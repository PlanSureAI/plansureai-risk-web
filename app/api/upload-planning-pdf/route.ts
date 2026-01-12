import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { extractPdfTextNode } from "@/app/lib/extractPdfText";
import { extractPlanningSummaryFromText } from "@/app/lib/extractPlanningSummary";
import { extractPlanningAnalysisFromText } from "@/app/lib/extractPlanningAnalysis";
import { extractPlanningStructuredSummaryFromText } from "@/app/lib/extractPlanningStructuredSummary";
import { buildRiskMatrixSnapshot } from "@/app/lib/risk/structuredRiskMatrix";
import type { PlanningDocumentSummary } from "@/app/types/planning";

export const runtime = "nodejs";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("supabaseKey is required");
  }
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  let supabase;
  try {
    supabase = getSupabase();
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Supabase credentials missing" },
      { status: 500 }
    );
  }
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const userId = formData.get("userId") as string | null;
  if (!userId) {
    return NextResponse.json({ error: "file and userId required" }, { status: 400 });
  }
  const siteId = formData.get("siteId") as string | null;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const pdfText = await extractPdfTextNode(buffer);
  const summary = await extractPlanningSummaryFromText(pdfText, file.name);

  const path = `${userId}/${Date.now()}-${file.name}`;
  const { data: storageData, error: storageError } = await supabase.storage
    .from("planning-pdfs")
    .upload(path, buffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("planning_documents")
    .insert({
      user_id: userId,
      site_id: siteId ?? null,
      storage_path: storageData?.path,
      file_name: file.name,
      summary_json: summary,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let analysisStatus: "ready" | "error" = "ready";
  try {
    const analysis = await extractPlanningAnalysisFromText(pdfText, file.name);
    let structuredSummary = null;
    let riskMatrix = null;
    let riskIndex = null;
    let riskBand = null;
    try {
      structuredSummary = await extractPlanningStructuredSummaryFromText(
        pdfText,
        file.name
      );
      const matrixSnapshot = buildRiskMatrixSnapshot(structuredSummary);
      riskMatrix = matrixSnapshot;
      riskIndex = matrixSnapshot.riskIndex;
      riskBand = matrixSnapshot.riskBand;
    } catch (summaryErr) {
      console.error("Failed to extract structured summary", summaryErr);
    }
    console.log("RISK DEBUG", {
      riskMatrix,
      riskIndex,
      riskBand,
    });
    const { error: analysisError } = await supabase
      .from("planning_document_analyses")
      .insert({
        planning_document_id: data.id,
        user_id: userId,
        analysis_json: analysis,
        structured_summary: structuredSummary,
        risk_matrix: riskMatrix,
        risk_index: riskIndex,
        risk_band: riskBand,
      });
    if (analysisError) {
      console.error("❌ ANALYSIS INSERT ERROR:", analysisError);
    } else {
      console.log("✅ ANALYSIS INSERT SUCCESS");
    }
    if (analysisError) {
      analysisStatus = "error";
      console.error("Failed to store planning analysis", analysisError);
    }
  } catch (analysisErr) {
    analysisStatus = "error";
    console.error("Failed to extract planning analysis", analysisErr);
  }

  return NextResponse.json({ documentId: data.id, summary, analysisStatus });
}
