"use server";

import OpenAI from "openai";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type PlanningOutcome = "proceed" | "conditional" | "do_not_proceed";

type PlanningAnalysis = {
  outcome: PlanningOutcome;
  risk_summary: string;
  report: string;
};

function toNullableString(value: FormDataEntryValue | null) {
  const str = value?.toString().trim();
  return str ? str : null;
}

export async function runSiteAnalysis(formData: FormData) {
  const id = formData.get("id") as string;

  if (!id) throw new Error("Missing site id");

  const supabase = await createSupabaseServerClient();

  const { data: site, error } = await supabase
    .from("sites")
    .select(
      `
        id,
        site_name,
        address,
        local_planning_authority,
        status,
        planning_outcome,
        objection_likelihood,
        key_planning_considerations,
        planning_summary,
        decision_summary
      `
    )
    .eq("id", id)
    .single();

  if (error || !site) throw error ?? new Error("Site not found");

  const prompt = `
You are a UK planning specialist AI assessing planning risk for a single site.

Return JSON with this exact shape:

{
  "outcome": "proceed" | "conditional" | "do_not_proceed",
  "risk_summary": "2–4 sentences explaining the key planning risks and opportunities.",
  "report": "A concise planning risk memo (~400-600 words) suitable for an internal decision pack."
}

Site data:
- Site name: ${site.site_name ?? "Unknown"}
- Address: ${site.address ?? "Unknown"}
- Local planning authority: ${site.local_planning_authority ?? "Unknown"}
- Current status: ${site.status ?? "Unknown"}
- Existing planning outcome: ${site.planning_outcome ?? "None"}
- Objection likelihood: ${site.objection_likelihood ?? "Unknown"}
- Key planning considerations: ${site.key_planning_considerations ?? "None"}
- Planning summary: ${site.planning_summary ?? "None"}
- Decision summary: ${site.decision_summary ?? "None"}

Focus on UK planning policy, settlement pattern, likely objections and overall deliverability.
Say “do_not_proceed” if you see major unresolved risks.
`;

  const completion = await openai.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    input: prompt,
    response_format: { type: "json_object" },
  });

  const contentBlock = completion.output[0].content[0];
  const raw = "text" in contentBlock ? contentBlock.text : "";

  let parsed: PlanningAnalysis;

  try {
    parsed = JSON.parse(raw) as PlanningAnalysis;
  } catch {
    throw new Error("Failed to parse AI response");
  }

  const { outcome, risk_summary, report } = parsed;

  const { error: updateError } = await supabase
    .from("sites")
    .update({
      ai_outcome: outcome,
      ai_risk_summary: risk_summary,
      ai_report: report,
      ai_last_run_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) throw updateError;

  revalidatePath(`/sites/${id}`);
  revalidatePath("/sites");
}

export async function updateSite(formData: FormData) {
  const id = formData.get("id") as string;

  if (!id) throw new Error("Missing site id");

  const supabase = await createSupabaseServerClient();

  const updates = {
    status: toNullableString(formData.get("status")),
    planning_outcome: toNullableString(formData.get("planning_outcome")),
    objection_likelihood: toNullableString(formData.get("objection_likelihood")),
    key_planning_considerations: toNullableString(
      formData.get("key_planning_considerations")
    ),
    planning_summary: toNullableString(formData.get("planning_summary")),
    decision_summary: toNullableString(formData.get("decision_summary")),
  };

  const { error } = await supabase.from("sites").update(updates).eq("id", id);

  if (error) throw error;

  revalidatePath(`/sites/${id}`);
  revalidatePath("/sites");
}

export async function uploadSitePdf(formData: FormData) {
  const id = formData.get("id") as string;
  const file = formData.get("file") as File | null;

  if (!id) throw new Error("Missing site id");
  if (!file) throw new Error("No file uploaded");
  if (file.type !== "application/pdf") {
    throw new Error("Only PDF files are supported");
  }

  const supabase = await createSupabaseServerClient();

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const path = `${id}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("site-documents")
    .upload(path, buffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    redirect(`/sites/${id}?upload=error`);
  }

  const { error: updateError } = await supabase
    .from("sites")
    .update({ latest_plan_pdf_path: path })
    .eq("id", id);

  if (updateError) {
    redirect(`/sites/${id}?upload=error`);
  }

  redirect(`/sites/${id}?upload=success`);
}
