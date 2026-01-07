import { createSupabaseServerClient } from "@/app/lib/supabaseServer";
import { buildSiteRiskProfileInput, type SitePlanningData } from "@/app/lib/planningDataProvider";

export type RiskEngineInput = {
  site: {
    id: string;
    address: string;
    postcode: string;
    lpaName: string;
    planningStatus: "pre_app" | "outline" | "full" | "detailed" | "refused" | "consented";
    planningRef?: string;
    schemeDescription: string;
    unitsCount?: number;
    netGiaM2?: number;
  };
  planningContext: {
    keyPolicies: string[];
    constraints: string[];
    history: string;
  };
  financeProfile: {
    label: string;
    landCost: number;
    buildCost: number;
    professionalFees: number;
    contingency: number;
    financeCost: number;
    otherCosts: number;
    totalCost: number;
    gdv: number;
    equityContribution: number;
    seniorLoanAmount: number;
    mezzLoanAmount?: number;
    interestRatePct: number;
    arrangementFeePct?: number;
    termMonths: number;
  };
  financeMetrics: {
    ltcPercent: number;
    ltgdvPercent: number;
    profitAmount: number;
    profitOnCostPct: number;
    profitOnGdvPct: number;
    interestCoverRatio?: number;
    breakevenGdv: number;
  };
  sponsor: {
    name: string;
    background: string;
    trackRecordSummary: string;
    equityInvested: number;
    personalGuarantees?: string;
  };
  energy: {
    targetEpcRating?: string;
    measures: string[];
    summary: string;
  };
};

export type RiskEngineOutput = {
  overallRiskBand: "low" | "medium" | "high";
  planningRiskScore: number;
  deliveryRiskScore: number;
  salesRiskScore: number;
  costRiskScore: number;
  sponsorRiskScore: number;
  energyRiskScore: number;
  keyRisks: string[];
  keyMitigations: string[];
  summaryParagraph: string;
};

export type BrokerPackPayload = {
  site: RiskEngineInput["site"];
  planningContext: RiskEngineInput["planningContext"];
  financeProfile: RiskEngineInput["financeProfile"];
  financeMetrics: RiskEngineInput["financeMetrics"];
  sponsor: RiskEngineInput["sponsor"];
  energy: RiskEngineInput["energy"];
  risk: RiskEngineOutput;
  broker: {
    name?: string;
    firm?: string;
    email?: string;
  };
  meta: {
    lenderTarget?: string;
    headlineAsk: string;
    packVersion: number;
    generatedAt: string;
  };
};

type BuildRiskEngineInputArgs = {
  siteId: string;
  financeProfileId?: string;
  landtechApiKey?: string | null;
  planningData?: SitePlanningData | null;
};

function splitToLines(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n|•|-/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function toNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function computeFinanceTotals(finance: {
  land_cost?: any;
  build_cost?: any;
  professional_fees?: any;
  contingency?: any;
  finance_cost?: any;
  other_costs?: any;
}) {
  const parts = [
    toNumber(finance.land_cost),
    toNumber(finance.build_cost),
    toNumber(finance.professional_fees),
    toNumber(finance.contingency),
    toNumber(finance.finance_cost),
    toNumber(finance.other_costs),
  ];
  return parts.reduce((acc, val) => acc + val, 0);
}

function computeFinanceMetrics(financeProfile: any, metricsRow: any | null) {
  const totalCost = toNumber(financeProfile.total_cost ?? computeFinanceTotals(financeProfile));
  const gdv = toNumber(financeProfile.gdv);
  const senior = toNumber(financeProfile.senior_loan_amount);
  const mezz = toNumber(financeProfile.mezz_loan_amount);
  const profitAmount = gdv - totalCost;
  const breakevenGdv = totalCost;

  return {
    ltcPercent:
      toNumber(metricsRow?.ltc_percent) || (totalCost ? ((senior + mezz) / totalCost) * 100 : 0),
    ltgdvPercent: toNumber(metricsRow?.ltgdv_percent) || (gdv ? ((senior + mezz) / gdv) * 100 : 0),
    profitAmount: toNumber(metricsRow?.profit_amount) || profitAmount,
    profitOnCostPct:
      toNumber(metricsRow?.profit_on_cost_pct) || (totalCost ? (profitAmount / totalCost) * 100 : 0),
    profitOnGdvPct: toNumber(metricsRow?.profit_on_gdv_pct) || (gdv ? (profitAmount / gdv) * 100 : 0),
    interestCoverRatio: metricsRow?.interest_cover_ratio ?? null,
    breakevenGdv: toNumber(metricsRow?.breakeven_gdv) || breakevenGdv,
  };
}

function derivePostcode(address?: string | null, fallback?: string | null): string {
  if (fallback) return fallback;
  if (!address) return "";
  const match = address.match(/\b([A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2})\b/i);
  return match ? match[1].toUpperCase() : "";
}

export async function buildRiskEngineInput({
  siteId,
  financeProfileId,
  landtechApiKey,
  planningData,
}: BuildRiskEngineInputArgs): Promise<RiskEngineInput & { financeProfileId: string }> {
  const supabase = await createSupabaseServerClient();

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select(
      `
        id,
        address_line,
        address,
        postcode,
        lpa_name,
        local_planning_authority,
        planning_status,
        planning_ref,
        scheme_description,
        units_count,
        net_residential_gia_m2,
        key_planning_considerations,
        planning_summary,
        decision_summary,
        target_epc_rating,
        energy_strategy_summary
      `
    )
    .eq("id", siteId)
    .single();

  if (siteError || !site) {
    throw siteError ?? new Error("Site not found");
  }

  const { data: financeProfiles, error: financeError } = await supabase
    .from("site_finance_profiles")
    .select("*")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  if (financeError) throw financeError;
  const financeProfile = financeProfiles?.find((p) => p.id === financeProfileId) ?? financeProfiles?.[0];
  if (!financeProfile) throw new Error("No finance profile found for site");

  const { data: metricsRow } = await supabase
    .from("site_finance_metrics")
    .select("*")
    .eq("finance_profile_id", financeProfile.id)
    .maybeSingle();

  const { data: sponsorRow } = await supabase
    .from("site_sponsors")
    .select("*")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false })
    .maybeSingle();

  let planning = planningData ?? null;
  const landtechKey = landtechApiKey ?? process.env.LANDTECH_API_KEY ?? null;
  if (!planning && landtechKey) {
    const geometry = (site as any)?.geometry ?? null;
    const postcode = derivePostcode(site.address ?? undefined, site.postcode ?? null);
    if (geometry || postcode) {
      try {
        planning = await buildSiteRiskProfileInput({
          apiKey: landtechKey,
          geometry: geometry ?? undefined,
          postcode: geometry ? undefined : postcode,
        });
      } catch (err) {
        console.error("buildRiskEngineInput: LandTech planning fetch failed", err);
      }
    }
  }

  const financeMetrics = computeFinanceMetrics(financeProfile, metricsRow);

  const measures = splitToLines(site.energy_strategy_summary);

  const input: RiskEngineInput & { financeProfileId: string } = {
    financeProfileId: financeProfile.id,
    site: {
      id: site.id,
      address: site.address_line ?? site.address ?? "",
      postcode: derivePostcode(site.address ?? undefined, site.postcode ?? null),
      lpaName: site.lpa_name ?? site.local_planning_authority ?? "",
      planningStatus: (site.planning_status as RiskEngineInput["site"]["planningStatus"]) ?? "pre_app",
      planningRef: site.planning_ref ?? undefined,
      schemeDescription: site.scheme_description ?? site.planning_summary ?? "",
      unitsCount: site.units_count ?? (site as any).proposed_units ?? undefined,
      netGiaM2: site.net_residential_gia_m2 ?? undefined,
    },
    planningContext: {
      keyPolicies: splitToLines(site.key_planning_considerations).filter(
        (line): line is string => line !== null
      ),
      constraints:
        planning?.planningApplications?.map((p) => p.classification).filter(Boolean) ??
        splitToLines(site.planning_summary).filter(
          (line): line is string => line !== null
        ),
      history: site.decision_summary ?? "",
    },
    financeProfile: {
      label: financeProfile.label ?? "Base",
      landCost: toNumber(financeProfile.land_cost),
      buildCost: toNumber(financeProfile.build_cost),
      professionalFees: toNumber(financeProfile.professional_fees),
      contingency: toNumber(financeProfile.contingency),
      financeCost: toNumber(financeProfile.finance_cost),
      otherCosts: toNumber(financeProfile.other_costs),
      totalCost: toNumber(financeProfile.total_cost ?? computeFinanceTotals(financeProfile)),
      gdv: toNumber(financeProfile.gdv),
      equityContribution: toNumber(financeProfile.equity_contribution),
      seniorLoanAmount: toNumber(financeProfile.senior_loan_amount),
      mezzLoanAmount: financeProfile.mezz_loan_amount != null ? toNumber(financeProfile.mezz_loan_amount) : undefined,
      interestRatePct: toNumber(financeProfile.interest_rate_pct),
      arrangementFeePct:
        financeProfile.arrangement_fee_pct != null ? toNumber(financeProfile.arrangement_fee_pct) : undefined,
      termMonths: toNumber(financeProfile.term_months),
    },
    financeMetrics,
    sponsor: {
      name: sponsorRow?.sponsor_name ?? "Unknown sponsor",
      background: sponsorRow?.sponsor_background ?? "",
      trackRecordSummary: sponsorRow?.track_record_summary ?? "",
      equityInvested: toNumber(sponsorRow?.equity_invested),
      personalGuarantees: sponsorRow?.personal_guarantees ?? undefined,
    },
    energy: {
      targetEpcRating: site.target_epc_rating ?? undefined,
      measures,
      summary: site.energy_strategy_summary ?? "",
    },
  };

  return input;
}

export async function saveRiskEngineOutput(args: {
  siteId: string;
  output: RiskEngineOutput;
  snapshotLabel?: string;
  modelName?: string;
}): Promise<string> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("site_risks")
    .insert({
      site_id: args.siteId,
      snapshot_label: args.snapshotLabel ?? "Latest",
      planning_risk_score: args.output.planningRiskScore,
      delivery_risk_score: args.output.deliveryRiskScore,
      sales_risk_score: args.output.salesRiskScore,
      cost_risk_score: args.output.costRiskScore,
      sponsor_risk_score: args.output.sponsorRiskScore,
      energy_risk_score: args.output.energyRiskScore,
      overall_risk_band: args.output.overallRiskBand,
      key_risks: args.output.keyRisks.join("\n"),
      key_mitigations: args.output.keyMitigations.join("\n"),
      summary_paragraph: args.output.summaryParagraph,
      ai_model_name: args.modelName ?? process.env.OPENAI_MODEL ?? "unknown",
      ai_run_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}
