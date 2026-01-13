import OpenAI from "openai";
import type { PlanningDocumentAnalysis } from "@/app/types/planning";
import { planningDocumentAnalysisSchema } from "@/app/lib/planningAnalysisSchema";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const SYSTEM_INSTRUCTIONS = `
You extract structured planning risk insights from planning-related PDFs.
Return ONLY valid minified JSON that matches the provided schema.
If a field is unknown or not present, use null or an empty array.
`;

function buildAnalysisPrompt(text: string, fileName: string): string {
  return `
Schema:
{
  "headlineRisk": string|null,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "EXTREME" | null,
  "keyIssues": string[],
  "policyRefs": string[],
  "recommendedActions": string[],
  "timelineNotes": string|null
}

Rules:
- Headline should be 1–2 sentences, e.g. "Medium risk: scale acceptable but highways access needs evidence."
- riskLevel must be one of LOW, MEDIUM, HIGH, EXTREME.
- keyIssues should be concise bullet-style strings.
- policyRefs should capture policy codes or names if explicitly mentioned (otherwise empty).
- recommendedActions should be practical next steps (e.g. pre-app, surveys, reports).
- timelineNotes should mention any timeline/fee implications if stated.
- File name: "${fileName}".

Now extract risk analysis from this document text:

${text}
`;
}

function buildImagePrompt(fileName: string): string {
  return `
You are looking at a planning drawing or plan sheet.
Extract planning risk signals that are explicitly visible in the drawing, title block, and annotations.
Return JSON using the schema below.
If a field is unknown or not present, use null or an empty array.
File name: "${fileName}".

Schema:
{
  "headlineRisk": string|null,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "EXTREME" | null,
  "keyIssues": string[],
  "policyRefs": string[],
  "recommendedActions": string[],
  "timelineNotes": string|null
}
`;
}

function extractJson(content: string): PlanningDocumentAnalysis {
  const trimmed = content.trim();
  try {
    return planningDocumentAnalysisSchema.parse(
      JSON.parse(trimmed)
    ) as PlanningDocumentAnalysis;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("LLM did not return valid JSON");
    }
    return planningDocumentAnalysisSchema.parse(
      JSON.parse(match[0])
    ) as PlanningDocumentAnalysis;
  }
}

export async function extractPlanningAnalysisFromText(
  text: string,
  fileName: string
): Promise<PlanningDocumentAnalysis> {
  const prompt = buildAnalysisPrompt(text, fileName);
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

export async function extractPlanningAnalysisFromImage(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<PlanningDocumentAnalysis> {
  const base64 = buffer.toString("base64");
  const prompt = buildImagePrompt(fileName);
  const completion = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: SYSTEM_INSTRUCTIONS },
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64}` },
          },
        ],
      },
    ],
    temperature: 0,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  return extractJson(raw);
}
