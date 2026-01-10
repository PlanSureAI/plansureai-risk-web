import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { extractPdfTextNode } from "@/app/lib/extractPdfText";
import { extractPlanningSummaryFromText } from "@/app/lib/extractPlanningSummary";
import type { PlanningDocumentSummary } from "@/app/types/planning";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const userId = formData.get("userId") as string | null;
  if (!userId) {
    return NextResponse.json({ error: "file and userId required" }, { status: 400 });
  }

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
      storage_path: storageData?.path,
      file_name: file.name,
      summary_json: summary,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ documentId: data.id, summary });
}
