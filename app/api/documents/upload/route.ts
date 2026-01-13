import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";
import { Client } from "@upstash/qstash";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service credentials missing");
  }
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const siteId = (formData.get("siteId") as string | null) ?? null;
  const focus = formData.get("focus") === "drawings" ? "drawings" : null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const path = `${user.id}/${Date.now()}-${file.name}`;

  const { data: storageData, error: storageError } = await admin.storage
    .from("planning-pdfs")
    .upload(path, buffer, {
      contentType: file.type || "application/pdf",
      upsert: false,
    });

  if (storageError || !storageData?.path) {
    return NextResponse.json(
      { error: storageError?.message ?? "Upload failed" },
      { status: 500 }
    );
  }

  const { data: job, error: jobError } = await admin
    .from("document_jobs")
    .insert({
      user_id: user.id,
      site_id: siteId,
      storage_path: storageData.path,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      status: "pending",
      progress: 0,
      progress_message: "Queued for processing",
      analysis_status: "pending",
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { error: jobError?.message ?? "Job creation failed" },
      { status: 500 }
    );
  }

  const qstashToken = process.env.QSTASH_TOKEN;
  const processUrl = process.env.PROCESS_DOCUMENT_URL;
  if (!qstashToken || !processUrl) {
    return NextResponse.json(
      { error: "QStash not configured" },
      { status: 500 }
    );
  }

  const client = new Client({ token: qstashToken });
  await client.publishJSON({
    url: processUrl,
    body: { jobId: job.id, focus },
    retries: 3,
  });

  return NextResponse.json({ jobId: job.id, status: "pending" });
}
