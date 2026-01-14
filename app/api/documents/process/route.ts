import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { extractPdfTextNode } from "@/app/lib/extractPdfText";
import {
  extractPlanningSummaryFromImage,
  extractPlanningSummaryFromText,
} from "@/app/lib/extractPlanningSummary";
import {
  extractPlanningAnalysisFromImage,
  extractPlanningAnalysisFromText,
} from "@/app/lib/extractPlanningAnalysis";

export const runtime = "nodejs";
export const maxDuration = 300;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service credentials missing");
  }
  return createClient(url, key);
}

async function updateJob(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  jobId: string,
  updates: Record<string, unknown>
) {
  await supabase
    .from("document_jobs")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", jobId);
}

async function handler(req: NextRequest) {
  const { jobId, focus } = (await req.json()) as {
    jobId?: string;
    focus?: "drawings" | null;
  };

  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: job, error: jobError } = await supabase
    .from("document_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  try {
    await updateJob(supabase, jobId, {
      status: "processing",
      progress: 10,
      progress_message: "Downloading document",
      started_at: new Date().toISOString(),
      attempts: (job.attempts ?? 0) + 1,
    });

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("planning-pdfs")
      .download(job.storage_path);

    if (downloadError || !fileData) {
      throw new Error(downloadError?.message ?? "Failed to download file");
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await updateJob(supabase, jobId, {
      progress: 35,
      progress_message: "Extracting planning summary",
    });

    let summary;
    let analysisSourceText: string | null = null;

    if (job.mime_type === "application/pdf") {
      const pdfText = await extractPdfTextNode(buffer);
      if (pdfText.trim().length < 50) {
        throw new Error("PDF looks image-only. Upload a PNG or JPG version.");
      }
      summary = await extractPlanningSummaryFromText(pdfText, job.file_name);
      analysisSourceText = pdfText;
    } else if (job.mime_type?.startsWith("image/")) {
      summary = await extractPlanningSummaryFromImage(
        buffer,
        job.mime_type,
        job.file_name,
        focus ?? undefined
      );
    } else {
      throw new Error("Unsupported file type");
    }

    const { data: planningDoc, error: planningDocError } = await supabase
      .from("planning_documents")
      .insert({
        user_id: job.user_id,
        site_id: job.site_id,
        storage_path: job.storage_path,
        file_name: job.file_name,
        summary_json: summary,
      })
      .select("id")
      .single();

    if (planningDocError || !planningDoc) {
      throw new Error(planningDocError?.message ?? "Failed to store summary");
    }

    await updateJob(supabase, jobId, {
      progress: 70,
      progress_message: "Generating planning analysis",
      planning_document_id: planningDoc.id,
    });

    let analysisStatus: "ready" | "error" = "ready";
    try {
      const analysis = analysisSourceText
        ? await extractPlanningAnalysisFromText(analysisSourceText, job.file_name)
        : await extractPlanningAnalysisFromImage(
            buffer,
            job.mime_type,
            job.file_name,
            focus ?? undefined
          );

      const { error: analysisError } = await supabase
        .from("planning_document_analyses")
        .insert({
          planning_document_id: planningDoc.id,
          user_id: job.user_id,
          analysis_json: analysis,
        });

      if (analysisError) {
        analysisStatus = "error";
        await updateJob(supabase, jobId, {
          error_message: analysisError.message,
        });
      }
    } catch (analysisErr) {
      analysisStatus = "error";
      await updateJob(supabase, jobId, {
        error_message: analysisErr instanceof Error ? analysisErr.message : "Analysis failed",
      });
    }

    await updateJob(supabase, jobId, {
      status: "completed",
      progress: 100,
      progress_message:
        analysisStatus === "ready" ? "Analysis complete" : "Summary ready",
      analysis_status: analysisStatus,
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Processing failed";
    await updateJob(supabase, jobId, {
      status: "failed",
      progress: 100,
      progress_message: "Processing failed",
      error_message: message,
      analysis_status: "error",
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = verifySignatureAppRouter(handler);
