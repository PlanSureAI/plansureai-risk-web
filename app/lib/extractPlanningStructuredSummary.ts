import OpenAI from "openai";
import { planningStructuredSummarySchema } from "@/app/lib/planningStructuredSummarySchema";
import type { PlanningStructuredSummary } from "@/app/types/planning";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const SYSTEM_INSTRUCTIONS = `
You extract structured planning risk summaries from planning-related PDFs.
Return ONLY valid minified JSON that matches the provided schema.
If a field is unknown or not present, use null or an empty array.
`;

function buildStructuredSummaryPrompt(text: string, fileName: string): string {
  return `
Schema:
{
  "headline": string|null,
  "risk_level": "LOW" | "MEDIUM" | "HIGH" | "EXTREME" | null,
  "key_issues": string[],
  "recommended_actions": string[],
  "timeline_notes": string[],
  "risk_issues": [
    {
      "issue": string,
      "category": "planning" | "delivery" | "sales" | "cost" | "sponsor" | "energy" | "other",
      "probability": 1|2|3|4|5,
      "impact": 1|2|3|4|5,
      "owner": string|null,
      "mitigation": string|null
    }
  ]
}

Rules:
- headline should be 1 sentence, decision-grade.
- risk_level must be one of LOW, MEDIUM, HIGH, EXTREME.
- key_issues should be 3–5 concise bullet-style strings.
- recommended_actions should be 3–5 practical next steps.
- timeline_notes should be 1–3 items if timelines/fees are mentioned.
- risk_issues should be 3–6 items; keep issue text concise and specific.
- probability/impact are 1–5 integers; owner/mitigation can be null if unknown.
- File name: "${fileName}".

Now extract the structured summary from this document text:

${text}
`;
}

function extractJson(content: string): PlanningStructuredSummary {
  const trimmed = content.trim();
  try {
    return planningStructuredSummarySchema.parse(
      JSON.parse(trimmed)
    ) as PlanningStructuredSummary;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("LLM did not return valid JSON");
    }
    return planningStructuredSummarySchema.parse(
      JSON.parse(match[0])
    ) as PlanningStructuredSummary;
  }
}

export async function extractPlanningStructuredSummaryFromText(
  text: string,
  fileName: string
): Promise<PlanningStructuredSummary> {
  const prompt = buildStructuredSummaryPrompt(text, fileName);
  const completion = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: SYSTEM_INSTRUCTIONS },
      { role: "user", content: prompt },
    ],
    temperature: 0,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  return extractJson(raw);
}
