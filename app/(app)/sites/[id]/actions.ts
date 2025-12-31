"use server";

import OpenAI from "openai";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";
import { buildSiteRiskProfileInput, type SitePlanningData } from "@/app/lib/planningDataProvider";
import {
  formatPlanningDataForPromptJson,
  type PlanningInstructionPayload,
} from "@/app/lib/formatPlanningDataForPrompt";
import {
  mapSiteFinanceProfile,
  type SiteFinanceProfile,
  type FinancePack,
} from "@/app/types/siteFinance";
import {
  buildRiskEngineInput,
  saveRiskEngineOutput,
  type RiskEngineOutput,
  type BrokerPackPayload,
} from "@/app/types/riskEngine";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type PlanningOutcome = "proceed" | "conditional" | "do_not_proceed";

type PlanningAnalysis = {
  outcome: PlanningOutcome;
  risk_summary: string;
  report: string;
};

type EligibilityStatus = "Eligible" | "Borderline" | "NotEligible";

type EligibilityResult = {
  productId:
    | "homeBuildingFund"
    | "smeAccelerator"
    | "greenerHomesAlliance"
    | "housingGrowthPartnership";
  status: EligibilityStatus;
  passedCriteria: string[];
  failedCriteria: string[];
};

function toNullableString(value: FormDataEntryValue | null) {
  const str = value?.toString().trim();
  return str ? str : null;
}

function extractPostcode(address?: string | null): string | null {
  if (!address) return null;
  const match = address.match(
    /\b([A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2})\b/i,
  );
  return match ? match[1].toUpperCase() : null;
}

async function runRiskEngineForSite(args: {
  siteId: string;
  financeProfileId?: string;
  planningData?: SitePlanningData | null;
  landtechKey?: string | null;
}): Promise<RiskEngineOutput> {
  const riskInput = await buildRiskEngineInput({
    siteId: args.siteId,
    financeProfileId: args.financeProfileId,
    planningData: args.planningData ?? null,
    landtechApiKey: args.landtechKey ?? null,
  });

  const riskPrompt = {
    instruction:
      'Score the scheme. Return JSON exactly like {"overallRiskBand":"low|medium|high","planningRiskScore":1-5,"deliveryRiskScore":1-5,"salesRiskScore":1-5,"costRiskScore":1-5,"sponsorRiskScore":1-5,"energyRiskScore":1-5,"keyRisks":["..."],"keyMitigations":["..."],"summaryParagraph":"3-4 sentences."}. 1 = low risk, 5 = high risk.',
    input: riskInput,
  };

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "You are a UK real-estate credit analyst producing concise risk ratings for small residential schemes.",
      },
      {
        role: "user",
        content: JSON.stringify(riskPrompt),
      },
    ],
    response_format: { type: "json_object" } as const,
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "";
  let parsed: RiskEngineOutput;

  try {
    parsed = JSON.parse(raw) as RiskEngineOutput;
  } catch (err) {
    console.error("Risk engine parse failed. Raw:", raw);
    throw err;
  }

  await saveRiskEngineOutput({
    siteId: args.siteId,
    output: parsed,
    snapshotLabel: "Latest",
    modelName: model,
  });

  return parsed;
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

  const landtechKey = process.env.LANDTECH_API_KEY;
  const postcode = extractPostcode(site.address ?? undefined);
  const geometry = (site as any)?.geometry ?? null;

  let landtechPlanning: SitePlanningData | null = null;
  if (landtechKey && postcode) {
    try {
      landtechPlanning = await buildSiteRiskProfileInput({
        apiKey: landtechKey,
        geometry: geometry ?? undefined,
        postcode: geometry ? undefined : postcode,
      });
    } catch (err) {
      console.error("LandTech planning fetch failed", err);
    }
  }

  const planningDataForPrompt = formatPlanningDataForPromptJson(landtechPlanning);

  const payload: PlanningInstructionPayload = {
    instruction:
      "You are a UK planning specialist AI assessing planning risk for a single site. Return JSON with this exact shape: {\"outcome\":\"proceed\"|\"conditional\"|\"do_not_proceed\",\"risk_summary\":\"2–4 sentences.\",\"report\":\"400–600 word planning risk memo.\"} Focus on UK planning policy, settlement pattern, likely objections and overall deliverability. Use outcome \"do_not_proceed\" if there are major unresolved risks.",
    site: {
      name: site.site_name ?? "Unknown",
      address: site.address ?? "Unknown",
      lpa: site.local_planning_authority ?? "Unknown",
      status: site.status ?? "Unknown",
      existing_planning_outcome: site.planning_outcome ?? "None",
      objection_likelihood: site.objection_likelihood ?? "Unknown",
      key_planning_considerations: site.key_planning_considerations ?? "None",
      planning_summary: site.planning_summary ?? "None",
      decision_summary: site.decision_summary ?? "None",
    },
    planning_data: planningDataForPrompt,
  };

  // Logging for manual validation
  console.log("[runSiteAnalysis] SitePlanningData:", JSON.stringify(landtechPlanning));
  const payloadString = JSON.stringify(payload);
  console.log("[runSiteAnalysis] payload_length_chars:", payloadString.length);
  console.log("[runSiteAnalysis] payload_preview:", payloadString.slice(0, 800));

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4-turbo-preview",
    messages: [{ role: "user", content: payloadString }],
    response_format: { type: "json_object" } as const,
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "";

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

  await runRiskEngineForSite({
    siteId: id,
    planningData: landtechPlanning,
    landtechKey: landtechKey ?? null,
  });

  revalidatePath(`/sites/${id}`);
  revalidatePath("/sites");
}

export async function runFullAnalysis(formData: FormData) {
  "use server";
  await runSiteAnalysis(formData);
  await runFundingEligibility(formData);
}

export async function runFundingEligibility(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing site id");

  const supabase = await createSupabaseServerClient();

  const { data: site, error } = await supabase
    .from("sites")
    .select(
      `
        id,
        country,
        proposed_units,
        gdv,
        total_cost,
        profit_on_cost_percent,
        sponsor_uk_registered,
        sponsor_sme_housebuilder,
        sponsor_completed_units,
        sponsor_years_active,
        land_control,
        majority_control,
        would_stall_without_funding,
        fossil_fuel_free,
        target_sap,
        target_epc_band,
        mmc_used,
        real_living_wage,
        lighthouse_charity_support,
        follow_on_site_appetite,
        growth_horizon_years
      `
  )
  .eq("id", id)
  .single();

  if (error || !site) throw error ?? new Error("Site not found");

  const profile = mapSiteFinanceProfile(site);

  const results: EligibilityResult[] = evaluateFundingForSite(profile);

  const { error: updateError } = await supabase
    .from("sites")
    .update({ eligibility_results: results })
    .eq("id", id);

  if (updateError) throw updateError;

  revalidatePath(`/sites/${id}`);
  revalidatePath("/sites");
}

function evaluateFundingForSite(profile: SiteFinanceProfile): EligibilityResult[] {
  const results: EligibilityResult[] = [];

  // Home Building Fund (HBF)
  const hbfPassed: string[] = [];
  const hbfFailed: string[] = [];

  if (profile.scheme.country === "England") {
    hbfPassed.push("England scheme");
  } else {
    hbfFailed.push("Outside England");
  }

  if ((profile.scheme.unitsTotal ?? 0) >= 5) hbfPassed.push("5+ homes");
  else hbfFailed.push("Fewer than 5 homes");

  if (profile.sponsor.ukRegistered === true) hbfPassed.push("UK registered sponsor");
  else hbfFailed.push("Sponsor not UK registered");

  if (profile.planning.landControl === "owned" || profile.planning.landControl === "option") {
    hbfPassed.push("Land control in place");
  } else {
    hbfFailed.push("No clear land control");
  }

  if ((profile.viability.gdv ?? 0) > 0 && (profile.viability.totalCost ?? 0) > 0) {
    hbfPassed.push("Viability inputs present");
  } else {
    hbfFailed.push("Missing viability inputs");
  }

  if (profile.planning.wouldStallWithoutFunding === true) {
    hbfPassed.push("Would stall without this funding");
  } else {
    hbfFailed.push("Does not clearly depend on HBF to proceed");
  }

  const hbfStatus =
    hbfFailed.length === 0
      ? "Eligible"
      : hbfPassed.length > 0
        ? "Borderline"
        : "NotEligible";

  results.push({
    productId: "homeBuildingFund",
    status: hbfStatus,
    passedCriteria: hbfPassed,
    failedCriteria: hbfFailed,
  });

  // Greener Homes Alliance (GHA)
  const ghaPassed: string[] = [];
  const ghaFailed: string[] = [];

  if ((profile.scheme.unitsTotal ?? 0) >= 10) ghaPassed.push("10+ homes");
  else ghaFailed.push("Fewer than 10 homes");

  if ((profile.sustainability.targetSAP ?? 0) >= 85) ghaPassed.push("Target SAP ≥ 85");
  else ghaFailed.push("Target SAP < 85");

  if (profile.sustainability.fossilFuelFree === true) ghaPassed.push("Fossil-fuel-free heat");
  else ghaFailed.push("Not fossil-fuel-free");

  if (profile.sponsor.smeHousebuilder === true) ghaPassed.push("SME housebuilder");
  else ghaFailed.push("Not an SME housebuilder");

  // Optional bonus messaging; does not affect core status resolution
  if (profile.sustainability.mmcUsed) ghaPassed.push("Uses MMC (potential enhanced terms)");
  if (profile.sustainability.realLivingWage) ghaPassed.push("Pays Real Living Wage");
  if (profile.sustainability.lighthouseCharity) ghaPassed.push("Supports Lighthouse Charity");

  const ghaStatus =
    ghaFailed.length === 0
      ? "Eligible"
      : ghaPassed.length > 0
        ? "Borderline"
        : "NotEligible";

  results.push({
    productId: "greenerHomesAlliance",
    status: ghaStatus,
    passedCriteria: ghaPassed,
    failedCriteria: ghaFailed,
  });

  return results;
}

export async function generateFinancePack(formData: FormData): Promise<FinancePack> {
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
        land_control,
        proposed_units,
        country,
        gdv,
        total_cost,
        loan_amount,
        ltc_percent,
        ltgdv_percent,
        fossil_fuel_free,
        target_sap,
        target_epc_band,
        mmc_used,
        real_living_wage,
        lighthouse_charity_support,
        sponsor_sme_housebuilder,
        sponsor_uk_registered,
        sponsor_entity_type,
        sponsor_completed_units,
        sponsor_years_active,
        eligibility_results
      `
    )
    .eq("id", id)
    .single();

  if (error || !site) throw error ?? new Error("Site not found");

  const profile = mapSiteFinanceProfile(site);

  const pack: FinancePack = {
    scheme: {
      id: site.id,
      name: site.site_name,
      address: site.address,
      localAuthority: site.local_planning_authority,
      country: profile.scheme.country,
      unitsTotal: profile.scheme.unitsTotal,
      planningStatus: site.status,
      landControl: profile.planning.landControl,
    },
    viability: profile.viability,
    sustainability: profile.sustainability,
    sponsor: {
      smeHousebuilder: profile.sponsor.smeHousebuilder,
      ukRegistered: profile.sponsor.ukRegistered,
      entityType: profile.sponsor.entityType,
      completedUnits: profile.sponsor.completedUnits,
      yearsActive: profile.sponsor.yearsActive,
    },
    funding: {
      results: (site.eligibility_results ?? []) as EligibilityResult[],
    },
  };

  return pack;
}

export async function generateFinancePackPdf(formData: FormData): Promise<string> {
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing site id");

  const pack = await generateFinancePack(formData);

  const doc = await PDFDocument.create();
  let page = doc.addPage([595, 842]); // A4 portrait
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  let y = height - 50;

  const drawText = (text: string, opts: { size?: number; bold?: boolean } = {}) => {
    const size = opts.size ?? 10;
    const usedFont = opts.bold ? fontBold : font;
    page.drawText(text, { x: 50, y, size, font: usedFont });
    y -= size + 4;
  };

  // Header
  drawText("PlanSureAI – Indicative Development Finance Pack", { size: 12, bold: true });
  drawText(`Site: ${pack.scheme.name ?? "Untitled site"}`, { size: 11, bold: true });
  drawText(`Address: ${pack.scheme.address ?? "—"}`);
  drawText(`LPA: ${pack.scheme.localAuthority ?? "—"} | Country: ${pack.scheme.country}`);

  y -= 10;
  drawText("1. Scheme snapshot", { bold: true });
  drawText(
    `Units: ${pack.scheme.unitsTotal ?? "—"} | Planning status: ${
      pack.scheme.planningStatus ?? "—"
    } | Land control: ${pack.scheme.landControl ?? "—"}`
  );

  y -= 6;
  drawText("2. Viability overview", { bold: true });
  drawText(
    `GDV: £${pack.viability.gdv?.toLocaleString() ?? "—"} | Total cost: £${
      pack.viability.totalCost?.toLocaleString() ?? "—"
    }`
  );
  drawText(
    `Profit on cost: ${pack.viability.profitOnCostPct?.toFixed(1) ?? "—"}% | LTC: ${
      pack.viability.ltcPercent?.toFixed(1) ?? "—"
    }% | LTGDV: ${pack.viability.ltgdvPercent?.toFixed(1) ?? "—"}%`
  );
  if (pack.viability.downsideProfitOnCostPct != null) {
    drawText(
      `Downside (cost +10%, GDV −10%): ~${pack.viability.downsideProfitOnCostPct.toFixed(
        1
      )}% profit on cost`
    );
  }

  y -= 6;
  drawText("3. Sustainability & GHA fit", { bold: true });
  drawText(
    `Target SAP: ${pack.sustainability.targetSAP ?? "—"} | EPC: ${
      pack.sustainability.targetEPCBand ?? "—"
    } | Fossil-fuel-free: ${pack.sustainability.fossilFuelFree ? "Yes" : "No"}`
  );
  drawText(
    `MMC: ${pack.sustainability.mmcUsed ? "Yes" : "No"} | Real Living Wage: ${
      pack.sustainability.realLivingWage ? "Yes" : "No"
    } | Lighthouse: ${pack.sustainability.lighthouseCharity ? "Yes" : "No"}`
  );

  y -= 6;
  drawText("4. Sponsor overview", { bold: true });
  drawText(
    `SME housebuilder: ${
      pack.sponsor.smeHousebuilder ? "Yes" : "No"
    } | UK registered: ${pack.sponsor.ukRegistered ? "Yes" : "No"}`
  );
  drawText(
    `Entity: ${pack.sponsor.entityType ?? "—"} | Track record: ${
      pack.sponsor.completedUnits ?? "—"
    } units over ${pack.sponsor.yearsActive ?? "—"} years`
  );

  y -= 6;
  drawText("5. Funding options (indicative)", { bold: true });

  for (const r of pack.funding.results) {
    if (y < 80) {
      page = doc.addPage([595, 842]);
      y = height - 50;
    }
    drawText(
      `• ${r.productId}: ${r.status} – strengths: ${
        r.passedCriteria.slice(0, 2).join("; ") || "None"
      }; gaps: ${r.failedCriteria.slice(0, 2).join("; ") || "None"}`
    );
  }

  y -= 6;
  drawText(
    "Note: This pack is indicative only and does not constitute financial or planning advice.",
    { size: 8 }
  );

  const pdfBytes = await doc.save();
  const base64 = Buffer.from(pdfBytes).toString("base64");

  return base64;
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

function formatCurrency(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `£${Math.round(value).toLocaleString()}`;
}

function splitLines(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/\r?\n/)
    .map((v) => v.trim())
    .filter(Boolean);
}

export async function generateBrokerPackAction(
  formData: FormData
): Promise<{ pdfUrl: string; csvUrl?: string; packVersion: number }> {
  const siteId = formData.get("id") as string;
  const brokerId = (formData.get("broker_id") as string | null) ?? null;
  const headlineAskInput = toNullableString(formData.get("headline_ask"));
  const lenderTarget = toNullableString(formData.get("lender_target"));
  const notesToBroker = toNullableString(formData.get("notes_to_broker"));

  if (!siteId) throw new Error("Missing site id");

  const supabase = await createSupabaseServerClient();

  const { data: riskRow, error: riskError } = await supabase
    .from("site_risks")
    .select("*")
    .eq("site_id", siteId)
    .order("ai_run_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (riskError) throw riskError;
  if (!riskRow) throw new Error("No risk snapshot found for this site. Run analysis first.");

  const riskOutput: RiskEngineOutput = {
    overallRiskBand: riskRow.overall_risk_band,
    planningRiskScore: riskRow.planning_risk_score,
    deliveryRiskScore: riskRow.delivery_risk_score,
    salesRiskScore: riskRow.sales_risk_score,
    costRiskScore: riskRow.cost_risk_score,
    sponsorRiskScore: riskRow.sponsor_risk_score,
    energyRiskScore: riskRow.energy_risk_score,
    keyRisks: splitLines(riskRow.key_risks),
    keyMitigations: splitLines(riskRow.key_mitigations),
    summaryParagraph: riskRow.summary_paragraph ?? "",
  };

  const riskInput = await buildRiskEngineInput({
    siteId,
    landtechApiKey: process.env.LANDTECH_API_KEY ?? null,
  });

  let broker: BrokerPackPayload["broker"] = {};
  if (brokerId) {
    const { data: brokerRow } = await supabase
      .from("broker_contacts")
      .select("name, firm, email")
      .eq("id", brokerId)
      .maybeSingle();
    if (brokerRow) {
      broker = {
        name: brokerRow.name ?? undefined,
        firm: brokerRow.firm ?? undefined,
        email: brokerRow.email ?? undefined,
      };
    }
  }

  const { data: latestPack } = await supabase
    .from("broker_packs")
    .select("pack_version")
    .eq("site_id", siteId)
    .order("pack_version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = latestPack?.pack_version ? latestPack.pack_version + 1 : 1;

  const derivedHeadline =
    headlineAskInput ??
    `£${Math.round(riskInput.financeProfile.seniorLoanAmount || 0).toLocaleString()} senior at ${
      riskInput.financeMetrics.ltcPercent?.toFixed(0) ?? "—"
    }% LTC`;

  const payload: BrokerPackPayload = {
    site: riskInput.site,
    planningContext: riskInput.planningContext,
    financeProfile: riskInput.financeProfile,
    financeMetrics: riskInput.financeMetrics,
    sponsor: riskInput.sponsor,
    energy: riskInput.energy,
    risk: riskOutput,
    broker,
    meta: {
      lenderTarget: lenderTarget ?? undefined,
      headlineAsk: derivedHeadline,
      packVersion: nextVersion,
      generatedAt: new Date().toISOString(),
    },
  };

  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { height } = page.getSize();
  let y = height - 40;

  const draw = (text: string, opts: { size?: number; bold?: boolean } = {}) => {
    const size = opts.size ?? 10;
    const f = opts.bold ? bold : font;
    page.drawText(text, { x: 40, y, size, font: f });
    y -= size + 4;
  };

  draw("PlanSureAI – Broker Pack Snapshot", { bold: true, size: 12 });
  draw(`Site: ${payload.site.address} | Postcode: ${payload.site.postcode}`);
  draw(
    `Planning: ${payload.site.planningStatus} (${payload.site.planningRef ?? "N/A"}) | LPA: ${
      payload.site.lpaName
    }`
  );
  y -= 6;
  draw("Risk summary", { bold: true });
  draw(
    `Band: ${payload.risk.overallRiskBand.toUpperCase()} | Scores (1-5 high risk) P${payload.risk.planningRiskScore}/D${payload.risk.deliveryRiskScore}/S${payload.risk.salesRiskScore}/C${payload.risk.costRiskScore}/Sponsor${payload.risk.sponsorRiskScore}/Energy${payload.risk.energyRiskScore}`
  );
  draw(`Summary: ${payload.risk.summaryParagraph || payload.risk.keyRisks.join("; ")}`);
  y -= 4;
  draw("Finance snapshot", { bold: true });
  draw(
    `GDV ${formatCurrency(payload.financeProfile.gdv)} | Total cost ${formatCurrency(
      payload.financeProfile.totalCost
    )} | Profit on cost ${payload.financeMetrics.profitOnCostPct.toFixed(1)}%`
  );
  draw(
    `Senior loan ${formatCurrency(payload.financeProfile.seniorLoanAmount)} | LTC ${
      payload.financeMetrics.ltcPercent?.toFixed(1) ?? "—"
    }% | LTGDV ${payload.financeMetrics.ltgdvPercent?.toFixed(1) ?? "—"}%`
  );
  y -= 4;
  draw("Key risks", { bold: true });
  for (const r of payload.risk.keyRisks.slice(0, 5)) {
    draw(`• ${r}`);
  }
  y -= 4;
  draw("Mitigations", { bold: true });
  for (const m of payload.risk.keyMitigations.slice(0, 5)) {
    draw(`• ${m}`);
  }

  const pdfBytes = await doc.save();
  const csvLines = [
    "site_id,address,postcode,lpa,overall_risk_band,ltc_percent,ltgdv_percent,profit_on_cost_pct,headline_ask,broker_name",
    [
      payload.site.id,
      `"${payload.site.address}"`,
      payload.site.postcode,
      `"${payload.site.lpaName}"`,
      payload.risk.overallRiskBand,
      payload.financeMetrics.ltcPercent.toFixed(2),
      payload.financeMetrics.ltgdvPercent.toFixed(2),
      payload.financeMetrics.profitOnCostPct.toFixed(2),
      `"${payload.meta.headlineAsk}"`,
      `"${payload.broker.name ?? ""}"`,
    ].join(","),
  ].join("\n");

  const bucket = "broker-packs";
  const pdfPath = `${siteId}/pack-v${nextVersion}.pdf`;
  const csvPath = `${siteId}/pack-v${nextVersion}.csv`;

  const { error: pdfError } = await supabase.storage
    .from(bucket)
    .upload(pdfPath, Buffer.from(pdfBytes), {
      contentType: "application/pdf",
      upsert: true,
    });

  if (pdfError) throw pdfError;

  const { error: csvError } = await supabase.storage
    .from(bucket)
    .upload(csvPath, Buffer.from(csvLines), {
      contentType: "text/csv",
      upsert: true,
    });

  if (csvError) throw csvError;

  const { data: pdfPublic } = supabase.storage.from(bucket).getPublicUrl(pdfPath);
  const { data: csvPublic } = supabase.storage.from(bucket).getPublicUrl(csvPath);

  const { error: insertError } = await supabase.from("broker_packs").insert({
    site_id: siteId,
    broker_id: brokerId,
    finance_profile_id: riskInput.financeProfileId,
    risk_snapshot_id: riskRow.id,
    pack_version: nextVersion,
    pack_url: pdfPath,
    csv_url: csvPath,
    lender_target: lenderTarget,
    headline_ask: derivedHeadline,
    notes_to_broker: notesToBroker,
  });

  if (insertError) throw insertError;

  revalidatePath(`/sites/${siteId}`);

  return { pdfUrl: pdfPublic.publicUrl, csvUrl: csvPublic.publicUrl, packVersion: nextVersion };
}
