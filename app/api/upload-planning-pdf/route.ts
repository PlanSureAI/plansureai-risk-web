import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { extractPdfTextNode } from "@/app/lib/extractPdfText";
import {
  extractPlanningSummaryFromImage,
  extractPlanningSummaryFromText,
} from "@/app/lib/extractPlanningSummary";
import {
  extractPlanningAnalysisFromImage,
  extractPlanningAnalysisFromText,
} from "@/app/lib/extractPlanningAnalysis";
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
  const focus = formData.get("focus") === "drawings" ? "drawings" : undefined;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let summary: PlanningDocumentSummary;
  let analysisSourceText: string | null = null;

  if (file.type === "application/pdf") {
    const pdfText = await extractPdfTextNode(buffer);
    if (pdfText.trim().length < 50) {
      return NextResponse.json(
        { error: "PDF looks image-only. Please upload a PNG or JPG version." },
        { status: 400 }
      );
    }
    summary = await extractPlanningSummaryFromText(pdfText, file.name);
    analysisSourceText = pdfText;
  } else if (file.type.startsWith("image/")) {
    summary = await extractPlanningSummaryFromImage(
      buffer,
      file.type,
      file.name,
      focus
    );
  } else {
    return NextResponse.json(
      { error: "Unsupported file type. Upload a PDF, PNG, or JPG." },
      { status: 400 }
    );
  }

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
    const analysis = analysisSourceText
      ? await extractPlanningAnalysisFromText(analysisSourceText, file.name)
      : await extractPlanningAnalysisFromImage(buffer, file.type, file.name, focus);
    const { error: analysisError } = await supabase
      .from("planning_document_analyses")
      .insert({
        planning_document_id: data.id,
        user_id: userId,
        analysis_json: analysis,
      });
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
