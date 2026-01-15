import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Receiver } from "@upstash/qstash";
import { supabaseAdmin } from "@/app/lib/supabase";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY ?? currentSigningKey;

if (!currentSigningKey || !nextSigningKey) {
  throw new Error("QStash signing keys are required");
}

const receiver = new Receiver({
  currentSigningKey,
  nextSigningKey,
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("upstash-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 401 }
      );
    }

    const isValid = await receiver.verify({
      signature,
      body: rawBody,
    });

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    /**
     * Webhook handler for async document processing (QStash)
     *
     * Uses supabaseAdmin (bypasses RLS) because:
     * - Webhook is a service-to-service operation, not user-initiated
     * - Needs to update documents/sites regardless of RLS policies
     * - Service role key ensures operation succeeds even if user deleted
     * - Signature verification proves this is a legitimate QStash call
     *
     * Security: Signature verified first, then admin query performed
     */
    const requestBody = JSON.parse(rawBody);
    const { documentId, fileUrl, siteId, userId, fileName, pdfText } =
      requestBody;

    if (!documentId || !fileUrl || !siteId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: site, error: siteError } = await supabaseAdmin
      .from("sites")
      .select("*")
      .eq("id", siteId)
      .single();

    if (siteError || !site) {
      await updateDocumentStatus(
        supabaseAdmin,
        documentId,
        "failed",
        "Site not found"
      );
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    let extractedInfo: Record<string, any> = {};
    let riskFactors: string[] = [];

    try {
      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `You are a planning risk assessment expert. Analyze this planning document for the site: ${site.name} (${site.reference})\n\nDocument: ${pdfText}\n\nExtract:\n1. Key findings (2-3 bullet points)\n2. Top 3 risk factors (most critical first)\n3. Planning risks (0-100 score, where 0 is no risk, 100 is very high risk)\n\nRespond in JSON: { \"keyFindings\": [...], \"riskFactors\": [...], \"riskScore\": number }`,
          },
        ],
      });

      const responseText =
        message.content[0]?.type === "text" ? message.content[0].text : "";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        extractedInfo = JSON.parse(jsonMatch[0]);
        riskFactors = extractedInfo.riskFactors || [];
      }
    } catch (claudeError) {
      console.error("Claude analysis error:", claudeError);
      riskFactors = ["Unable to analyze document"];
    }

    const { error: updateError } = await supabaseAdmin
      .from("documents")
      .update({
        status: "processed",
        extracted_text: pdfText,
        extracted_info: extractedInfo,
        risk_factors: riskFactors,
        processed_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    if (updateError) {
      console.error("Database update error:", updateError);
      await updateDocumentStatus(
        supabaseAdmin,
        documentId,
        "failed",
        "Failed to save extracted data"
      );
      return NextResponse.json(
        { error: "Failed to save extracted data" },
        { status: 500 }
      );
    }

    if (extractedInfo.riskScore) {
      const currentRiskScore = site.risk_score || 0;
      const newRiskScore = Math.max(currentRiskScore, extractedInfo.riskScore);

      await supabaseAdmin
        .from("sites")
        .update({
          risk_score: newRiskScore,
          risk_factors: Array.from(
            new Set([...(site.risk_factors || []), ...riskFactors])
          ).slice(0, 10),
          documents_count: (site.documents_count || 0) + 1,
        })
        .eq("id", siteId);
    }

    return NextResponse.json(
      {
        message: "Document processed successfully",
        documentId,
        riskFactors,
        riskScore: extractedInfo.riskScore,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Process error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function updateDocumentStatus(
  supabase: any,
  documentId: string,
  status: string,
  errorMessage?: string
) {
  const updateData: Record<string, any> = { status };
  if (errorMessage) {
    updateData.error_message = errorMessage;
  }

  await supabase.from("documents").update(updateData).eq("id", documentId);
}
