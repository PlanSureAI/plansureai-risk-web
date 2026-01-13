import OpenAI from "openai";
import type { PlanningDocumentSummary } from "@/app/types/planning";
import { planningDocumentSummarySchema } from "@/app/lib/planningSummarySchema";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const SYSTEM_INSTRUCTIONS = `
You extract structured planning data from planning-related PDFs.
Return ONLY valid minified JSON that matches the provided schema.
If a field is unknown or not present, use null or an empty array.
`;

function buildExtractionPrompt(text: string, fileName: string): string {
  return `
Schema:
{
  "site": {
    "name": string|null,
    "address": string|null,
    "localAuthority": string|null,
    "clientName": string|null
  },
  "proposal": {
    "description": string|null,
    "route": string[],
    "dwellingsMin": number|null,
    "dwellingsMax": number|null,
    "isHousingLed": boolean
  },
  "process": {
    "stage": string|null,
    "steps": string[]
  },
  "fees": {
    "planningAuthorityFee": {
      "amount": number|null,
      "currency": "GBP",
      "payer": string|null,
      "description": string|null
    },
    "agentFee": {
      "amount": number|null,
      "currency": "GBP",
      "vatExcluded": boolean,
      "description": string|null
    }
  },
  "documentsRequired": string[],
  "meta": {
    "documentTitle": string|null,
    "documentDate": string|null,
    "sourceFileName": string|null
  }
}

Rules:
- Use numbers only when clearly stated in the text.
- Set "route" to values like ["PIP"], ["PreApp"], ["Full"], or ["Other"].
- Detect housing-led schemes by words like "housing development", "dwellings", "residential".
- For fees, parse pound amounts like "2688.00" and "3250.00" and set currency to "GBP".
- Set "sourceFileName" to "${fileName}".

Now extract data from this document text:

${text}
`;
}

function buildImagePrompt(fileName: string, focus?: "drawings"): string {
  const focusNote =
    focus === "drawings"
      ? "Prioritise elevations, heights, materials, fenestration, and architectural notes."
      : "";
  return `
You are looking at a planning drawing or plan sheet.
Extract information that is explicitly visible in the drawing, title block, and annotations.
${focusNote}
Return JSON using the schema below.
If a field is unknown or not present, use null or an empty array.
Set "sourceFileName" to "${fileName}".

Schema:
{
  "site": {
    "name": string|null,
    "address": string|null,
    "localAuthority": string|null,
    "clientName": string|null
  },
  "proposal": {
    "description": string|null,
    "route": string[],
    "dwellingsMin": number|null,
    "dwellingsMax": number|null,
    "isHousingLed": boolean
  },
  "process": {
    "stage": string|null,
    "steps": string[]
  },
  "fees": {
    "planningAuthorityFee": {
      "amount": number|null,
      "currency": "GBP",
      "payer": string|null,
      "description": string|null
    },
    "agentFee": {
      "amount": number|null,
      "currency": "GBP",
      "vatExcluded": boolean,
      "description": string|null
    }
  },
  "documentsRequired": string[],
  "meta": {
    "documentTitle": string|null,
    "documentDate": string|null,
    "sourceFileName": string|null
  }
}
`;
}

function extractJson(content: string): PlanningDocumentSummary {
  const trimmed = content.trim();
  try {
    return planningDocumentSummarySchema.parse(JSON.parse(trimmed)) as PlanningDocumentSummary;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("LLM did not return valid JSON");
    }
    return planningDocumentSummarySchema.parse(JSON.parse(match[0])) as PlanningDocumentSummary;
  }
}

export async function extractPlanningSummaryFromText(
  text: string,
  fileName: string
): Promise<PlanningDocumentSummary> {
  const prompt = buildExtractionPrompt(text, fileName);
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

export async function extractPlanningSummaryFromImage(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
  focus?: "drawings"
): Promise<PlanningDocumentSummary> {
  const base64 = buffer.toString("base64");
  const prompt = buildImagePrompt(fileName, focus);
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
