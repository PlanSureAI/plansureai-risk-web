"use server";

import OpenAI from "openai";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";
import {
  buildSiteRiskProfileInput,
  type SitePlanningData,
} from "@/app/lib/planningDataProvider";
import { formatPlanningDataForPromptJson } from "@/app/lib/formatPlanningDataForPrompt";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type ZeroBillPdfSection = { title: string; body: string };

export type ZeroBillAssessment = {
  planningRiskScore: number;
  zeroBillNarrative: string;
  lenderRationale: string;
  pdfSections: ZeroBillPdfSection[];
};

function extractPostcode(address?: string | null): string | null {
  if (!address) return null;
  const match = address.match(/\b([A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2})\b/i);
  return match ? match[1].toUpperCase() : null;
}

function normaliseAssessment(raw: Partial<ZeroBillAssessment>): ZeroBillAssessment {
  const pdfSections = Array.isArray(raw.pdfSections)
    ? raw.pdfSections
        .map((section) => ({
          title: (section as ZeroBillPdfSection).title ?? "",
          body: (section as ZeroBillPdfSection).body ?? "",
        }))
        .filter((section) => section.title || section.body)
    : [];

  if (pdfSections.length === 0) {
    pdfSections.push({
      title: "Zero-Bill summary",
      body: raw.zeroBillNarrative ?? "Zero-Bill assessment not available.",
    });
  }

  const score = Number(raw.planningRiskScore);
  const safeScore = Number.isFinite(score) ? score : 0;

  return {
    planningRiskScore: Math.max(0, Math.min(100, safeScore)),
    zeroBillNarrative: raw.zeroBillNarrative ?? "",
    lenderRationale: raw.lenderRationale ?? "",
    pdfSections,
  };
}

export async function runZeroBillAnalysis(formData: FormData): Promise<ZeroBillAssessment> {
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
        planning_summary,
        decision_summary,
        key_planning_considerations,
        proposed_units,
        objection_likelihood,
        target_sap,
        target_epc_band,
        fossil_fuel_free,
        mmc_used,
        zero_bill_assessment
      `
    )
    .eq("id", id)
    .single();

  if (error || !site) throw error ?? new Error("Site not found");

  const geometry = (site as any)?.geometry ?? null;
  const landtechKey = process.env.LANDTECH_API_KEY;
  const postcode = extractPostcode(site.address);

  let planningData: SitePlanningData | null = null;
  if (landtechKey && (postcode || geometry)) {
    try {
      planningData = await buildSiteRiskProfileInput({
        apiKey: landtechKey,
        geometry: geometry ?? undefined,
        postcode: geometry ? undefined : postcode ?? undefined,
      });
    } catch (err) {
      console.error("Zero-Bill LandTech planning fetch failed", err);
    }
  }

  const payload = {
    instruction:
      'You are a UK planning specialist AI producing a "Zero-Bill Homes" assessment. Return JSON with this exact shape: {"planningRiskScore":0-100,"zeroBillNarrative":"120-180 words on planning risk and zero-bill delivery","lenderRationale":"80-120 words on why the scheme fits zero-bill lender appetite","pdfSections":[{"title":"string","body":"string"}]}. Consider EPC A as default, net-operational energy, heat pumps, rooftop solar, and fabric-first design. Flag planning risks and mitigation in lender-friendly language.',
    site: {
      name: site.site_name ?? "Unknown site",
      address: site.address ?? "Unknown address",
      lpa: site.local_planning_authority ?? "Unknown LPA",
      status: site.status ?? "Unknown",
      planning_outcome: site.planning_outcome ?? "None recorded",
      planning_summary: site.planning_summary ?? "No summary recorded",
      decision_summary: site.decision_summary ?? "No decision summary recorded",
      key_planning_considerations: site.key_planning_considerations ?? "None recorded",
      objection_likelihood: site.objection_likelihood ?? "Unknown",
      proposed_units: site.proposed_units ?? null,
    },
    energy_strategy: {
      target_sap: site.target_sap ?? null,
      target_epc_band: site.target_epc_band ?? null,
      fossil_fuel_free: site.fossil_fuel_free ?? null,
      mmc_used: site.mmc_used ?? null,
    },
    planning_data: formatPlanningDataForPromptJson(planningData),
  };

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4-turbo-preview",
    messages: [{ role: "user", content: JSON.stringify(payload) }],
    response_format: { type: "json_object" } as const,
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "";

  let parsed: Partial<ZeroBillAssessment>;

  try {
    parsed = JSON.parse(raw) as Partial<ZeroBillAssessment>;
  } catch {
    throw new Error("Failed to parse Zero-Bill AI response");
  }

  const assessment = normaliseAssessment(parsed);

  const { error: updateError } = await supabase
    .from("sites")
    .update({
      zero_bill_assessment: assessment,
      zero_bill_last_run_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) throw updateError;

  revalidatePath(`/sites/${id}`);
  revalidatePath(`/sites/${id}/zero-bill`);

  return assessment;
}

export async function generateZeroBillPdf(formData: FormData): Promise<string> {
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
        zero_bill_assessment,
        zero_bill_last_run_at
      `
    )
    .eq("id", id)
    .single();

  if (error || !site) throw error ?? new Error("Site not found");

  const assessment = (site as any)?.zero_bill_assessment as ZeroBillAssessment | null;
  if (!assessment) {
    throw new Error("Run the Zero-Bill analysis before exporting a PDF.");
  }

  const doc = await PDFDocument.create();
  let page = doc.addPage([595, 842]); // A4 portrait
  const { width, height } = page.getSize();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  let y = height - 50;

  const drawText = (text: string, opts: { size?: number; bold?: boolean } = {}) => {
    const size = opts.size ?? 10;
    const usedFont = opts.bold ? fontBold : font;
    page.drawText(text, { x: 50, y, size, font: usedFont });
    y -= size + 4;
  };

  const drawParagraph = (text: string, opts: { size?: number; bold?: boolean } = {}) => {
    const size = opts.size ?? 10;
    const usedFont = opts.bold ? fontBold : font;
    const lines = wrapText(text ?? "", usedFont, size, width - 100);
    for (const line of lines) {
      if (y < 60) {
        page = doc.addPage([595, 842]);
        y = height - 50;
      }
      page.drawText(line, { x: 50, y, size, font: usedFont });
      y -= size + 4;
    }
  };

  drawText("PlanSureAI – Zero-Bill Homes pack", { size: 12, bold: true });
  drawText(`Site: ${site.site_name ?? "Untitled site"}`, { size: 11, bold: true });
  drawText(site.address ?? "No address recorded");
  drawText(`LPA: ${site.local_planning_authority ?? "—"}`);
  drawText(
    `Zero-Bill last run: ${(site as any).zero_bill_last_run_at ?? "Not yet run"} | Planning risk score: ${assessment.planningRiskScore ?? "—"}`
  );

  y -= 10;
  drawText("Zero-Bill narrative", { bold: true });
  drawParagraph(assessment.zeroBillNarrative);
  y = Math.max(y - 6, 60);

  drawText("Lender rationale", { bold: true });
  drawParagraph(assessment.lenderRationale);
  y = Math.max(y - 6, 60);

  drawText("Sections", { bold: true });

  for (const section of assessment.pdfSections) {
    drawText(section.title || "Section", { bold: true });
    drawParagraph(section.body || "No content provided.");
    y = Math.max(y - 6, 60);
  }

  drawText(
    "Indicative only – for internal lender conversations. Generated by PlanSureAI Zero-Bill workflow.",
    { size: 8 }
  );

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes).toString("base64");
}

function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
  if (!text) return [""];
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, size);
    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}
