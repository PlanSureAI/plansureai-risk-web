import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";
import type { PlanningDocumentSummary, PlanningDocumentAnalysis } from "@/app/types/planning";

type PlannerAssistantRequest = {
  siteId: string;
  documentId: string;
  question: string;
  contextType?: "summary" | "compare";
};

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await req.json()) as PlannerAssistantRequest;
  if (!payload?.siteId || !payload?.documentId || !payload?.question) {
    return NextResponse.json({ error: "siteId, documentId, question required" }, { status: 400 });
  }

  const { data: doc, error: docError } = await supabase
    .from("planning_documents")
    .select("summary_json, site_id")
    .eq("id", payload.documentId)
    .maybeSingle();

  if (docError || !doc || doc.site_id !== payload.siteId) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const summary = doc.summary_json as PlanningDocumentSummary;

  const { data: analysis } = await supabase
    .from("planning_document_analyses")
    .select("analysis_json")
    .eq("planning_document_id", payload.documentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const analysisJson = analysis?.analysis_json as PlanningDocumentAnalysis | undefined;

  const answer = await runAssistant({
    question: payload.question,
    summary,
    analysis: analysisJson,
  });

  const { data: inserted, error: insertError } = await supabase
    .from("planner_ai_feedback")
    .insert({
      site_id: payload.siteId,
      planning_document_id: payload.documentId,
      user_id: user.id,
      context_type: payload.contextType ?? "summary",
      question: payload.question,
      answer,
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ answer, interactionId: inserted.id });
}

async function runAssistant({
  question,
  summary,
  analysis,
}: {
  question: string;
  summary: PlanningDocumentSummary;
  analysis?: PlanningDocumentAnalysis;
}) {
  const system = `
You are a planning copilot for UK development sites.
Answer concisely, in practical next-step language.
Use the provided planning summary and analysis; do not invent facts or numbers.
If data is missing, say what is unknown and suggest what to confirm.
`;

  const context = {
    site: summary.site,
    proposal: summary.proposal,
    fees: summary.fees,
    process: summary.process,
    documentsRequired: summary.documentsRequired,
    analysis: analysis ?? null,
  };

  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: system.trim() },
      {
        role: "user",
        content: `Context JSON:\n${JSON.stringify(context)}\n\nQuestion: ${question}`,
      },
    ],
  });

  return response.choices[0]?.message?.content?.trim() ?? "No answer available.";
}
