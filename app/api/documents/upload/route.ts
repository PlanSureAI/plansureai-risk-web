import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";
import { Client } from "@upstash/qstash";
import { supabaseAdmin } from "@/app/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
          set: (name: string, value: string, options: any) => {
            cookieStore.set(name, value, options);
          },
          remove: (name: string, options: any) => {
            cookieStore.delete(name);
          },
        },
      }
    );

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const siteId = formData.get("siteId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!siteId) {
      return NextResponse.json({ error: "No siteId provided" }, { status: 400 });
    }

    if (!file.type.includes("pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();

    let pdfText = "";
    try {
      const data = await pdf(Buffer.from(buffer));
      pdfText = data.text;
    } catch (error) {
      console.error("PDF parsing error:", error);
      return NextResponse.json(
        { error: "Failed to parse PDF" },
        { status: 400 }
      );
    }

    const fileName = `${siteId}/${Date.now()}-${file.name}`;
    const { error: storageError } = await supabaseAdmin.storage
      .from("documents")
      .upload(fileName, buffer, {
        contentType: "application/pdf",
      });

    if (storageError) {
      console.error("Storage upload error:", storageError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(fileName);
    const fileUrl = urlData.publicUrl;

    const { data: documentData, error: dbError } = await supabaseAdmin
      .from("documents")
      .insert({
        site_id: siteId,
        user_id: session.user.id,
        file_name: file.name,
        file_url: fileUrl,
        file_size: file.size,
        status: "processing",
        content_preview: pdfText.substring(0, 1000),
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database insert error:", dbError);
      return NextResponse.json(
        { error: "Failed to create document record" },
        { status: 500 }
      );
    }

    const documentId = documentData.id;

    const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

    const processUrl =
      process.env.PROCESS_DOCUMENT_URL ||
      (process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/documents/process`
        : "") ||
      `${request.nextUrl.origin}/api/documents/process`;

    try {
      await qstash.publishJSON({
        url: processUrl,
        body: {
          documentId,
          fileUrl,
          siteId,
          userId: session.user.id,
          fileName: file.name,
          pdfText,
        },
      });
    } catch (qstashError) {
      console.error("QStash publish error:", qstashError);

      await supabase
        .from("documents")
        .update({ status: "failed", error_message: "Failed to queue processing" })
        .eq("id", documentId);

      return NextResponse.json(
        {
          documentId,
          message:
            "File uploaded but processing queue failed. Please retry.",
        },
        { status: 202 }
      );
    }

    return NextResponse.json(
      {
        documentId,
        message: "File uploaded successfully and queued for processing",
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
