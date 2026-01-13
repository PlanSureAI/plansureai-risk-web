import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";
import { runFullAnalysis, updateSite } from "./actions";
import { RunAnalysisButton } from "./RunAnalysisButton";
import { ConfidenceScoreSection } from "./ConfidenceScoreSection";
import { RiskRationaleSection } from "./RiskRationaleSection";
import { SiteKillersSection } from "./SiteKillersSection";
import { FinancePackButton } from "./FinancePackButton";
import { FinancePackPdfButton } from "./FinancePackPdfButton";
import { LenderPackButton } from "./LenderPackButton";
import { LenderStrategySection } from "./LenderStrategySection";
import { OutcomesSection } from "./OutcomesSection";
import { getNextMove, getFrictionHint, type NextMove } from "@/app/types/siteFinance";
import { BrokerSendForm } from "./BrokerSendForm";
import { getPlanningForPostcode, type LandTechPlanningApplication } from "@/app/lib/landtech";
import PlanningDocumentsPanel from "./PlanningDocumentsPanel";
import { buildRiskMatrixSnapshot, type RiskMatrixSnapshot } from "@/app/lib/risk/structuredRiskMatrix";
import type { PlanningStructuredSummary } from "@/app/types/planning";
import type { OutcomesBundle } from "./outcomesTypes";

type Site = {
  id: string;
  site_name: string | null;
  address: string | null;
  local_planning_authority: string | null;
  status: string | null;
  planning_outcome: string | null;
  planning_summary: string | null;
  key_planning_considerations: string | null;
  decision_summary: string | null;
  objection_likelihood: string | null;
  ai_outcome: string | null;
  ai_risk_summary: string | null;
  ai_report: string | null;
  risk_rationale: string | null;
  site_killers:
    | {
        risk: string;
        impact: string;
        mitigation: string;
      }[]
    | null;
  // Finance + scores
  gdv: number | null | undefined;
  total_cost: number | null | undefined;
  profit_on_cost_percent: number | null | undefined;
  loan_amount: number | null | undefined;
  ltc_percent: number | null | undefined;
  ltgdv_percent: number | null | undefined;
  interest_cover: number | null | undefined;
  planning_confidence_score: number | null;
  confidence_reasons: string[] | null;

  // ADD THESE MISSING FIELDS:
  settlement: string | null;
  site_area_ha: number | null;
  green_belt: boolean | null;
  submitted_at: string | null; // timestamp
  decision_outcome: string | null;
  decision_reasoning: string | null;
  reviewed_by: string | null;
  planning_justification: string | null;
  proposed_units: number | null;
  policy_unit_threshold: number | null;
  highway_access: string | null;
  visibility_splay_ok: number | null;
  access_width_ok: number | null;
  school_capacity: string | null;
  gp_capacity: string | null;
  utilities_capacity: string | null;
  planning_risk: string | null;
  planning_score: number | null;
  rural_exception_site: boolean | null;
  affordable_housing: boolean | null;
  affordable_percentage: number | null;
  previously_developed: boolean | null;
  decision_reason: string | null;
  user_id: string | null;
  risk_status: string | null;
  ai_last_run_at: string | null; // timestamp
  ai_units_estimate: number | null;
  ai_net_site_area_ha: number | null;
  ai_density_dph: number | null;
  ai_access_notes: string | null;
  country: string | null;
  units_total: number | null;
  sponsor_entity_type: string | null;
  sponsor_uk_registered: boolean | null;
  sponsor_sme_housebuilder: boolean | null;
  sponsor_completed_units: number | null;
  sponsor_years_active: number | null;
  land_control: string | null;
  majority_control: boolean | null;
  would_stall_without_funding: boolean | null;
  fossil_fuel_free: boolean | null;
  target_sap: number | null;
  target_epc_band: string | null;
  mmc_used: boolean | null;
  real_living_wage: boolean | null;
  lighthouse_charity_support: boolean | null;
  follow_on_site_appetite: boolean | null;
  growth_horizon_years: number | null;
  eligibility_results: any | null; // jsonb
  asking_price: number | null;
  lender_strategy_notes: string | null;
};

type Broker = {
  id: string;
  name: string;
  firm: string | null;
  email: string | null;
  phone: string | null;
};

type BrokerPack = {
  id: string;
  pack_version: number;
  pack_url: string;
  csv_url: string | null;
  created_at: string;
  headline_ask: string | null;
  broker_name: string | null;
  broker_firm: string | null;
};


type PlanningTimelineStats = {
  total: number;
  approvals: number;
  refusals: number;
  medianWeeks: number | null;
};

type LpaEvidenceStats = {
  approvalRate: number | null;
  medianWeeks: number | null;
  decidedCount: number;
};

type RiskOverview = {
  riskIndex: number | null;
  riskBand: "low" | "medium" | "high" | null;
  topIssues: Array<{
    issue: string;
    mitigation?: string | null;
    score?: number;
  }>;
};

const PRODUCT_LABELS = {
  homeBuildingFund: "Home Building Fund (development finance)",
  smeAccelerator: "SME Accelerator",
  greenerHomesAlliance: "Greener Homes Alliance",
  housingGrowthPartnership: "Housing Growth Partnership",
} as const;

const STATUS_CLASS: Record<"Eligible" | "Borderline" | "NotEligible", string> = {
  Eligible: "bg-emerald-100 text-emerald-800",
  Borderline: "bg-amber-100 text-amber-800",
  NotEligible: "bg-rose-100 text-rose-800",
} as const;
type StatusKey = keyof typeof STATUS_CLASS;

const MOVE_LABEL: Record<NextMove, string> = {
  proceed: "Proceed",
  hold: "Hold & clarify",
  walk_away: "Walk away",
};

const MOVE_CLASS: Record<NextMove, string> = {
  proceed: "border-emerald-200 bg-emerald-50 text-emerald-900",
  hold: "border-amber-200 bg-amber-50 text-amber-900",
  walk_away: "border-rose-200 bg-rose-50 text-rose-900",
};

function extractPostcodeFromAddress(address?: string | null): string | null {
  if (!address) return null;
  const match = address.match(/\b([A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2})\b/i);
  return match ? match[1].toUpperCase() : null;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function deriveLpaCode(lpaName?: string | null): string | null {
  if (!lpaName) return null;
  const stopwords = new Set([
    "COUNCIL",
    "CITY",
    "METROPOLITAN",
    "BOROUGH",
    "DISTRICT",
    "COUNTY",
    "OF",
    "THE",
    "LONDON",
    "ROYAL",
  ]);
  const tokens = lpaName
    .toUpperCase()
    .replace(/[^A-Z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !stopwords.has(token));
  return tokens[0] ?? null;
}

async function getPlanningTimelineStats({
  siteId,
  postcode,
}: {
  siteId: string;
  postcode: string | null;
}): Promise<PlanningTimelineStats | null> {
  const supabaseServer = await createSupabaseServerClient();
  let query = supabaseServer
    .from("application")
    .select("received_date, decision_date, decision")
    .gte("received_date", "2015-01-01");

  query = query.eq("site_id", siteId);

  if (postcode) {
    query = query.or(`site_id.is.null,address_text.ilike.%${postcode}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("❌ Error loading planning timeline stats:", error);
    return null;
  }

  const rows = data ?? [];
  if (rows.length === 0) return null;

  const approvals = new Set(["granted", "split_decision", "appeal_allowed"]);
  const refusals = new Set(["refused", "appeal_dismissed"]);
  let approvalCount = 0;
  let refusalCount = 0;
  const durations: number[] = [];

  for (const row of rows) {
    if (row.decision && approvals.has(row.decision)) approvalCount += 1;
    if (row.decision && refusals.has(row.decision)) refusalCount += 1;
    if (row.received_date && row.decision_date) {
      const received = new Date(row.received_date).getTime();
      const decided = new Date(row.decision_date).getTime();
      if (!Number.isNaN(received) && !Number.isNaN(decided) && decided >= received) {
        const weeks = (decided - received) / (1000 * 60 * 60 * 24 * 7);
        durations.push(weeks);
      }
    }
  }

  return {
    total: rows.length,
    approvals: approvalCount,
    refusals: refusalCount,
    medianWeeks: median(durations),
  };
}

async function getLpaEvidenceStats(
  lpaName?: string | null
): Promise<LpaEvidenceStats | null> {
  if (!lpaName) return null;
  const supabaseServer = await createSupabaseServerClient();
  const lpaCode = deriveLpaCode(lpaName);
  let query = supabaseServer
    .from("application")
    .select("validated_date, received_date, decision_date, decision")
    .gte("received_date", "2015-01-01");

  if (lpaCode) {
    query = query.eq("lpa_code", lpaCode);
  } else {
    query = query.ilike("address_text", `%${lpaName}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("❌ Error loading LPA evidence stats:", error);
    return null;
  }

  const rows = data ?? [];
  if (rows.length === 0) return null;

  const approvals = new Set(["granted", "split_decision", "appeal_allowed"]);
  const refusals = new Set(["refused", "appeal_dismissed"]);
  let approvalCount = 0;
  let refusalCount = 0;
  let decidedCount = 0;
  const durations: number[] = [];

  for (const row of rows) {
    if (row.decision) {
      decidedCount += 1;
      if (approvals.has(row.decision)) approvalCount += 1;
      if (refusals.has(row.decision)) refusalCount += 1;
    }

    const startDate = row.validated_date ?? row.received_date;
    if (startDate && row.decision_date) {
      const received = new Date(startDate).getTime();
      const decided = new Date(row.decision_date).getTime();
      if (!Number.isNaN(received) && !Number.isNaN(decided) && decided >= received) {
        const weeks = (decided - received) / (1000 * 60 * 60 * 24 * 7);
        durations.push(weeks);
      }
    }
  }

  if (decidedCount === 0) {
    return {
      approvalRate: null,
      medianWeeks: median(durations),
      decidedCount: 0,
    };
  }

  const approvalRate = (approvalCount / decidedCount) * 100;

  return {
    approvalRate,
    medianWeeks: median(durations),
    decidedCount,
  };
}

async function getLatestRiskOverview(siteId: string): Promise<RiskOverview | null> {
  const supabaseServer = await createSupabaseServerClient();
  const { data: documents } = await supabaseServer
    .from("planning_documents")
    .select("id")
    .eq("site_id", siteId);

  const docIds = (documents ?? []).map((doc) => doc.id);
  if (docIds.length === 0) return null;

  const { data: analysis } = await supabaseServer
    .from("planning_document_analyses")
    .select("structured_summary, risk_matrix, risk_index, risk_band, created_at")
    .in("planning_document_id", docIds)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!analysis) return null;

  const storedMatrix = (analysis.risk_matrix ?? null) as RiskMatrixSnapshot | null;
  const structuredSummary = (analysis.structured_summary ?? null) as PlanningStructuredSummary | null;
  const computedMatrix = structuredSummary ? buildRiskMatrixSnapshot(structuredSummary) : null;

  const riskIndex =
    (analysis.risk_index as number | null | undefined) ??
    storedMatrix?.riskIndex ??
    computedMatrix?.riskIndex ??
    null;
  const riskBand =
    (analysis.risk_band as "low" | "medium" | "high" | null | undefined) ??
    storedMatrix?.riskBand ??
    computedMatrix?.riskBand ??
    null;
  const topIssues =
    storedMatrix?.topIssues?.length
      ? storedMatrix.topIssues
      : computedMatrix?.topIssues ?? [];

  return {
    riskIndex: riskIndex != null ? Number(riskIndex) : null,
    riskBand,
    topIssues: topIssues.map((issue) => ({
      issue: issue.issue,
      mitigation: issue.mitigation ?? null,
      score: issue.score,
    })),
  };
}

async function getOutcomesBundle(
  supabaseServer: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  siteId: string
): Promise<OutcomesBundle> {
  const [planning, funding, performance] = await Promise.all([
    supabaseServer
      .from("planning_outcomes")
      .select("planning_ref, decision, decision_date, authority_name, notes")
      .eq("scheme_id", siteId)
      .limit(1)
      .maybeSingle(),
    supabaseServer
      .from("funding_outcomes")
      .select(
        "lender_name, decision, ltc_percent, gdv_ltv_percent, interest_rate_percent, approved_loan_amount, decision_date, notes"
      )
      .eq("scheme_id", siteId)
      .limit(1)
      .maybeSingle(),
    supabaseServer
      .from("performance_outcomes")
      .select(
        "status, actual_gdv, actual_build_cost, build_start_date, build_completion_date, sale_completion_date, notes"
      )
      .eq("scheme_id", siteId)
      .limit(1)
      .maybeSingle(),
  ]);

  if (planning.error || funding.error || performance.error) {
    console.error("❌ Error loading outcomes:", {
      planning: planning.error?.message,
      funding: funding.error?.message,
      performance: performance.error?.message,
      siteId,
    });
  }

  return {
    planning: planning.data ?? null,
    funding: funding.data ?? null,
    performance: performance.data ?? null,
  };
}

function computeDownsideProfit(
  gdv: number | null | undefined,
  totalCost: number | null | undefined
): number | null {
  if (gdv == null || totalCost == null) return null;
  const gdvDown = Number(gdv) * 0.9;
  const costUp = Number(totalCost) * 1.1;
  if (costUp === 0) return null;
  const profit = gdvDown - costUp;
  return (profit / costUp) * 100;
}

function viabilityFlagClass(value: number | null, goodRange: [number, number]) {
  if (value == null) return "text-zinc-500";
  const [min, max] = goodRange;
  if (value < min || value > max) return "text-amber-700";
  return "text-zinc-800";
}

type PageProps = {
  params: { id: string };
  searchParams?: { planningDocId?: string };
};

async function getSite(id: string): Promise<Site | null> {
  const supabaseServer = await createSupabaseServerClient();

  const { data, error } = await supabaseServer
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
        decision_summary,
        proposed_units,
        ai_units_estimate,
        ai_outcome,
        ai_risk_summary,
        ai_report,
        risk_rationale,
        site_killers,
        gdv,
        total_cost,
        profit_on_cost_percent,
        loan_amount,
        ltc_percent,
        ltgdv_percent,
        interest_cover,
        planning_confidence_score,
        confidence_reasons,
        eligibility_results,
        lender_strategy_notes
      `
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("❌ Error loading site:", {
      error,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      id,
    });
    return null;
  }

  console.log("✅ Site loaded successfully:", data?.site_name);
  // Explicit type-safe return with nullish fallbacks
  const site = {
    id: data.id,
    site_name: data.site_name,
    address: data.address,
    local_planning_authority: data.local_planning_authority,
    status: data.status,
    planning_outcome: data.planning_outcome,
    planning_summary: data.planning_summary,
    key_planning_considerations: data.key_planning_considerations,
    decision_summary: data.decision_summary,
    objection_likelihood: data.objection_likelihood,
    proposed_units: (data as any).proposed_units ?? null,
    ai_units_estimate: (data as any).ai_units_estimate ?? null,
    ai_outcome: data.ai_outcome,
    ai_risk_summary: data.ai_risk_summary,
    ai_report: data.ai_report,
    risk_rationale: data.risk_rationale,
    site_killers: data.site_killers,
    gdv: data.gdv ?? null,
    total_cost: data.total_cost ?? null,
    profit_on_cost_percent: data.profit_on_cost_percent ?? null,
    loan_amount: data.loan_amount ?? null,
    ltc_percent: data.ltc_percent ?? null,
    ltgdv_percent: data.ltgdv_percent ?? null,
    interest_cover: data.interest_cover ?? null,
    planning_confidence_score: data.planning_confidence_score ?? null,
    confidence_reasons: data.confidence_reasons ?? null,
    eligibility_results: (data as any).eligibility_results ?? null,
    lender_strategy_notes: (data as any).lender_strategy_notes ?? null,
  };

  return site as Site;
}

async function getBrokersForCurrentUser(): Promise<Broker[]> {
  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabaseServer.auth.getUser();

  if (userError || !user) {
    if (userError) console.error("❌ Error loading user for brokers:", userError);
    return [];
  }

  const { data, error } = await supabaseServer
    .from("broker_contacts")
    .select("id, name, firm, email, phone")
    .eq("user_id", user.id)
    .order("name");

  if (error) {
    console.error("❌ Error loading brokers:", error);
    return [];
  }

  return data ?? [];
}

async function getLatestBrokerPack(siteId: string): Promise<BrokerPack | null> {
  const supabaseServer = await createSupabaseServerClient();
  const { data, error } = await supabaseServer
    .from("broker_packs")
    .select("id, pack_version, pack_url, csv_url, created_at, headline_ask, broker:broker_contacts(name, firm)")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("❌ Error loading broker pack:", error);
    return null;
  }

  if (!data) return null;

  const pdfUrl = supabaseServer.storage.from("broker-packs").getPublicUrl(data.pack_url).data
    .publicUrl;
  const csvUrl = data.csv_url
    ? supabaseServer.storage.from("broker-packs").getPublicUrl(data.csv_url).data.publicUrl
    : null;

  return {
    id: data.id,
    pack_version: data.pack_version,
    pack_url: pdfUrl,
    csv_url: csvUrl,
    created_at: data.created_at,
    headline_ask: data.headline_ask,
    broker_name: (data as any).broker?.name ?? null,
    broker_firm: (data as any).broker?.firm ?? null,
  };
}

// Reusable fetch for lender contexts; narrowed to fields the lender page consumes.
export async function getSiteForLender(id: string): Promise<Site | null> {
  const supabaseServer = await createSupabaseServerClient();

  const { data, error } = await supabaseServer
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
        decision_summary,
        proposed_units,
        ai_units_estimate,
        risk_rationale,
        site_killers,
        gdv,
        total_cost,
        profit_on_cost_percent,
        loan_amount,
        ltc_percent,
        ltgdv_percent,
        interest_cover,
        planning_confidence_score,
        confidence_reasons,
        eligibility_results,
        lender_strategy_notes
      `
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("❌ Error loading lender site:", {
      error,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      id,
    });
    return null;
  }

  const site = {
    id: data.id,
    site_name: data.site_name,
    address: data.address,
    local_planning_authority: data.local_planning_authority,
    status: data.status,
    planning_outcome: data.planning_outcome,
    planning_summary: data.planning_summary,
    key_planning_considerations: data.key_planning_considerations,
    decision_summary: data.decision_summary,
    objection_likelihood: data.objection_likelihood,
    ai_outcome: (data as any).ai_outcome ?? null,
    ai_risk_summary: (data as any).ai_risk_summary ?? null,
    ai_report: (data as any).ai_report ?? null,
    risk_rationale: data.risk_rationale,
    site_killers: data.site_killers,
    gdv: data.gdv ?? null,
    total_cost: data.total_cost ?? null,
    profit_on_cost_percent: data.profit_on_cost_percent ?? null,
    loan_amount: data.loan_amount ?? null,
    ltc_percent: data.ltc_percent ?? null,
    ltgdv_percent: data.ltgdv_percent ?? null,
    interest_cover: data.interest_cover ?? null,
    planning_confidence_score: data.planning_confidence_score ?? null,
    confidence_reasons: data.confidence_reasons ?? null,
    eligibility_results: (data as any).eligibility_results ?? null,
    lender_strategy_notes: (data as any).lender_strategy_notes ?? null,
  };

  return site as Site;
}

export async function deleteSite(id: string) {
  "use server";

  const supabaseServer = await createSupabaseServerClient();
  const { error } = await supabaseServer.from("sites").delete().eq("id", id);

  if (error) throw error;

  revalidatePath("/sites");
  redirect("/sites");
}

export default async function SiteDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const site = await getSite(id);
  const brokers = await getBrokersForCurrentUser();
  const brokerPack = await getLatestBrokerPack(id);
  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  const outcomes = user ? await getOutcomesBundle(supabaseServer, id) : null;
  const resolvedSearchParams = await searchParams;
  const planningDocId = resolvedSearchParams?.planningDocId;
  const nextMove = site ? getNextMove(site.ai_outcome, site.eligibility_results ?? []) : null;
  const units = site ? site.proposed_units ?? site.ai_units_estimate ?? null : null;
  const viability = site
    ? {
        gdv: site.gdv ?? null,
        totalCost: site.total_cost ?? null,
        profitOnCostPct: site.profit_on_cost_percent ?? null,
        loanAmount: site.loan_amount ?? null,
        ltcPercent: site.ltc_percent ?? null,
        ltgdvPercent: site.ltgdv_percent ?? null,
        downsideProfitOnCostPct: computeDownsideProfit(site.gdv, site.total_cost),
      }
    : null;
  const postcode = site ? extractPostcodeFromAddress(site.address) : null;
  let planningApplications: LandTechPlanningApplication[] = [];
  let planningTimeline: PlanningTimelineStats | null = null;
  let lpaEvidence: LpaEvidenceStats | null = null;
  let riskOverview: RiskOverview | null = null;

  if (site) {
    try {
      if (postcode) {
        planningApplications = (await getPlanningForPostcode(postcode)).slice(0, 3);
      }
    } catch (err) {
      console.error("Failed to fetch planning applications for postcode", err);
    }
    try {
      planningTimeline = await getPlanningTimelineStats({
        siteId: site.id,
        postcode,
      });
    } catch (err) {
      console.error("Failed to fetch planning timeline stats", err);
    }
    try {
      lpaEvidence = await getLpaEvidenceStats(site.local_planning_authority);
    } catch (err) {
      console.error("Failed to fetch LPA evidence stats", err);
    }
    try {
      riskOverview = await getLatestRiskOverview(site.id);
    } catch (err) {
      console.error("Failed to fetch risk overview", err);
    }
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900">
        <main className="mx-auto max-w-3xl px-4 py-10">
          <p className="text-sm text-zinc-600">Site not found.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto max-w-3xl px-4 py-10 space-y-8">
        {nextMove && (
          <section
            className={`mb-4 rounded-lg border px-4 py-3 text-sm ${MOVE_CLASS[nextMove.move]}`}
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="inline-flex rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold">
                Next move: {MOVE_LABEL[nextMove.move]}
              </span>
            </div>
            <p>{nextMove.reason}</p>
          </section>
        )}

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            PlansureAI
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {site.site_name || "Untitled site"}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {site.address || "No address set"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {site.local_planning_authority || "No LPA set"}
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            Units: {units ?? "—"}
            {units && units > 50 && (
              <span className="ml-2 inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700">
                Outside PlanSureAI’s sweet spot (optimised for small SME sites)
              </span>
            )}
          </p>
          {units && units > 50 && (
            <p className="mt-1 text-xs text-zinc-600">
              This scheme is larger than PlanSureAI’s core 3–40 home focus; treat planning and funding outputs as high-level only.
            </p>
          )}
        </div>

        {user && (
          <>
            <PlanningDocumentsPanel
              siteId={site.id}
              userId={user.id}
              initialDocumentId={planningDocId ?? null}
              brokers={brokers}
            />
            <OutcomesSection
              siteId={site.id}
              initialOutcomes={outcomes}
            />
          </>
        )}

        {!user && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            <p className="font-semibold">Sign in to upload planning documents.</p>
            <p className="mt-1 text-xs text-amber-800">
              Planning PDFs are tied to your account and used to generate summaries.
            </p>
            <Link
              href={`/login?next=/sites/${site.id}`}
              className="mt-3 inline-flex items-center rounded-full border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100"
            >
              Sign in
            </Link>
          </div>
        )}

        {planningTimeline && (
          <section className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Planning timeline (since 2015)
                </p>
                <h2 className="mt-1 text-sm font-semibold text-zinc-900">
                  Applications in this postcode
                </h2>
              </div>
              <span className="text-xs text-zinc-500">
                Median decision time{" "}
                <span className="font-semibold text-zinc-700">
                  {planningTimeline.medianWeeks != null
                    ? `${planningTimeline.medianWeeks.toFixed(1)} weeks`
                    : "—"}
                </span>
              </span>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Total apps
                </p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  {planningTimeline.total}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
                <p
                  className="text-xs font-medium uppercase tracking-wide text-zinc-500"
                  title="Approvals include granted, split decision, and appeal allowed."
                >
                  Approvals
                </p>
                <p className="mt-1 text-lg font-semibold text-emerald-700">
                  {planningTimeline.approvals}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
                <p
                  className="text-xs font-medium uppercase tracking-wide text-zinc-500"
                  title="Refusals include refused and appeal dismissed."
                >
                  Refusals
                </p>
                <p className="mt-1 text-lg font-semibold text-rose-700">
                  {planningTimeline.refusals}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              Since 2015. Approvals include split decisions and appeal allowed.
              Refusals include appeal dismissed.
            </p>
          </section>
        )}

        {lpaEvidence && (
          <section className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  LPA evidence (since 2015)
                </p>
                <h2 className="mt-1 text-sm font-semibold text-zinc-900">
                  {site.local_planning_authority ?? "Local planning authority"}
                </h2>
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Approval rate
                </p>
                <p className="mt-1 text-lg font-semibold text-emerald-700">
                  {lpaEvidence.approvalRate != null
                    ? `${lpaEvidence.approvalRate.toFixed(1)}%`
                    : "—"}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Median weeks
                </p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  {lpaEvidence.medianWeeks != null
                    ? `${lpaEvidence.medianWeeks.toFixed(1)}`
                    : "—"}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Sample size
                </p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  {lpaEvidence.decidedCount}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              Based on decided applications only. Approvals include granted, split decision, and
              appeal allowed.
            </p>
          </section>
        )}

        {riskOverview && (
          <section className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Risk overview
                </p>
                <h2 className="mt-1 text-sm font-semibold text-zinc-900">
                  Lender risk snapshot
                </h2>
              </div>
              <span className="inline-flex rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-800">
                {riskOverview.riskBand ? `${riskOverview.riskBand.toUpperCase()} risk` : "Risk TBD"}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm text-zinc-700">
              <span>
                Index{" "}
                <span className="font-semibold text-zinc-900">
                  {riskOverview.riskIndex != null ? `${riskOverview.riskIndex}/100` : "—"}
                </span>
              </span>
            </div>
            {riskOverview.topIssues.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm text-zinc-700">
                {riskOverview.topIssues.slice(0, 3).map((issue, idx) => (
                  <li key={`${issue.issue}-${idx}`} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                    <p className="font-medium text-zinc-900">{issue.issue}</p>
                    {issue.mitigation && (
                      <p className="mt-1 text-xs text-zinc-600">
                        Mitigation: {issue.mitigation}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-zinc-500">
                No structured risk issues available yet.
              </p>
            )}
          </section>
        )}

        <LenderStrategySection
          siteId={site.id}
          initialNotes={site.lender_strategy_notes}
        />

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/sites/${site.id}/zero-bill`}
            className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100"
          >
            Open Zero-Bill view
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Status
            </p>
            <p className="mt-1 inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-800">
              {site.status || "—"}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Outcome
            </p>
            <p className="mt-1 text-sm text-zinc-800">
              {site.planning_outcome || "—"}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Objection likelihood
            </p>
            <p className="mt-1 text-sm text-zinc-800">
              {site.objection_likelihood || "—"}
            </p>
          </div>
        </section>

        {planningApplications.length > 0 && (
          <section className="rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-zinc-900">Recent planning in this postcode</h2>
            <ul className="mt-3 space-y-3">
              {planningApplications.map((app, idx) => {
                const ref =
                  (app as any).reference ??
                  (app as any).application_number ??
                  (app as any).id ??
                  `Application ${idx + 1}`;
                const decision =
                  (app as any).decision ??
                  (app as any).status ??
                  (app as any).current_status ??
                  "Status unknown";
                const decisionDate =
                  (app as any).decision_date ??
                  (app as any).determination_date ??
                  (app as any).received_date ??
                  null;
                const description =
                  (app as any).proposal ?? (app as any).description ?? "No description available.";
                const address = (app as any).address ?? (app as any).site_address ?? "";

                return (
                  <li key={`${ref}-${idx}`} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-sm font-medium text-zinc-900">
                      {ref}{" "}
                      <span className="text-xs font-normal text-zinc-600">
                        {decision}
                        {decisionDate ? ` · ${decisionDate}` : ""}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-zinc-700">{description}</p>
                    {address ? <p className="mt-1 text-xs text-zinc-500">{address}</p> : null}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {(site.ai_outcome || site.ai_risk_summary || site.ai_report) && (
          <section className="rounded-xl border border-zinc-200 bg-white p-4 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              AI planning insight
            </p>

            <p className="text-sm">
              <span className="font-medium">Outcome:</span>{" "}
              {site.ai_outcome ?? "Not yet analysed"}
            </p>

            <p className="text-sm whitespace-pre-line text-zinc-800">
              {site.ai_risk_summary ??
                "Run AI planning analysis to generate an initial risk summary."}
            </p>
          </section>
        )}

        <ConfidenceScoreSection
          siteId={site.id}
          siteName={site.site_name}
          address={site.address}
          localPlanningAuthority={site.local_planning_authority}
          aiOutcome={site.ai_outcome}
          aiRiskSummary={site.ai_risk_summary}
          keyPlanningConsiderations={site.key_planning_considerations}
          objectionLikelihood={site.objection_likelihood}
        />

        <SiteKillersSection
          siteId={site.id}
          siteName={site.site_name}
          address={site.address}
          localPlanningAuthority={site.local_planning_authority}
          aiOutcome={site.ai_outcome}
          aiRiskSummary={site.ai_risk_summary}
          keyPlanningConsiderations={site.key_planning_considerations}
          objectionLikelihood={site.objection_likelihood}
        />

        <RiskRationaleSection
          siteId={site.id}
          siteName={site.site_name}
          address={site.address}
          localPlanningAuthority={site.local_planning_authority}
          riskStatus={site.status}
          objectionLikelihood={site.objection_likelihood}
          keyPlanningConsiderations={site.key_planning_considerations}
        />

        <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-900">Edit planning analysis</h2>
          <p className="mt-1 text-xs text-zinc-600">
            Update status, outcome, and the key summaries for this site.
          </p>

          <form action={updateSite} className="mt-4 space-y-4">
            <input type="hidden" name="id" value={site.id} />

            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-1 text-sm text-zinc-800">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Status
                </span>
                <input
                  name="status"
                  defaultValue={site.status ?? ""}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none"
                />
              </label>

              <label className="space-y-1 text-sm text-zinc-800">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Outcome
                </span>
                <input
                  name="planning_outcome"
                  defaultValue={site.planning_outcome ?? ""}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none"
                />
              </label>

              <label className="space-y-1 text-sm text-zinc-800">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Objection likelihood
                </span>
                <input
                  name="objection_likelihood"
                  defaultValue={site.objection_likelihood ?? ""}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none"
                />
              </label>
            </div>

            <label className="block space-y-1 text-sm text-zinc-800">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Key planning considerations
              </span>
              <textarea
                name="key_planning_considerations"
                defaultValue={site.key_planning_considerations ?? ""}
                rows={4}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none"
              />
            </label>

            <label className="block space-y-1 text-sm text-zinc-800">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Planning summary
              </span>
              <textarea
                name="planning_summary"
                defaultValue={site.planning_summary ?? ""}
                rows={4}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none"
              />
            </label>

            <label className="block space-y-1 text-sm text-zinc-800">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Decision summary
              </span>
              <textarea
                name="decision_summary"
                defaultValue={site.decision_summary ?? ""}
                rows={4}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none"
              />
            </label>

            <button
              type="submit"
              className="inline-flex items-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Save changes
            </button>
          </form>
        </section>

        <section className="space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Key planning considerations
            </p>
            <p className="mt-2 whitespace-pre-line text-zinc-800">
              {site.key_planning_considerations || "No key considerations recorded yet."}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Planning summary
            </p>
            <p className="mt-2 whitespace-pre-line text-zinc-800">
              {site.planning_summary || "No planning summary recorded yet."}
            </p>
            {getFrictionHint(site.objection_likelihood, site.ai_outcome) && (
              <p className="mt-2 text-xs text-amber-700">
                {getFrictionHint(site.objection_likelihood, site.ai_outcome)}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Decision summary
            </p>
            <p className="mt-2 whitespace-pre-line text-zinc-800">
              {site.decision_summary || "No decision summary recorded yet."}
            </p>
          </div>
        </section>

        {viability && (
          <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 text-xs">
            <p className="mb-2 font-semibold text-zinc-800">Viability snapshot</p>
            <div className="grid gap-x-6 gap-y-1 sm:grid-cols-3">
              <p>
                GDV:{" "}
                <span className="font-medium">
                  {viability.gdv != null ? `£${Number(viability.gdv).toLocaleString()}` : "—"}
                </span>
              </p>
              <p>
                Total cost:{" "}
                <span className="font-medium">
                  {viability.totalCost != null
                    ? `£${Number(viability.totalCost).toLocaleString()}`
                    : "—"}
                </span>
              </p>
              <p className={viabilityFlagClass(viability.profitOnCostPct, [18, 25])}>
                Profit on cost:{" "}
                <span className="font-medium">
                  {viability.profitOnCostPct != null
                    ? `${viability.profitOnCostPct.toFixed(1)}%`
                    : "—"}
                </span>
              </p>
              <p className={viabilityFlagClass(viability.ltcPercent, [70, 85])}>
                LTC:{" "}
                <span className="font-medium">
                  {viability.ltcPercent != null ? `${viability.ltcPercent.toFixed(1)}%` : "—"}
                </span>
              </p>
              <p className={viabilityFlagClass(viability.ltgdvPercent, [55, 70])}>
                LTGDV:{" "}
                <span className="font-medium">
                  {viability.ltgdvPercent != null ? `${viability.ltgdvPercent.toFixed(1)}%` : "—"}
                </span>
              </p>
              <p className={viabilityFlagClass(viability.downsideProfitOnCostPct, [12, 20])}>
                Downside profit (cost +10%, GDV -10%):{" "}
                <span className="font-medium">
                  {viability.downsideProfitOnCostPct != null
                    ? `${viability.downsideProfitOnCostPct.toFixed(1)}%`
                    : "—"}
                </span>
              </p>
            </div>
          </section>
        )}

        {site.eligibility_results && site.eligibility_results.length > 0 && (
          <section className="space-y-4">
            {site.eligibility_results.map((result: any) => {
              const status: StatusKey = (result.status ?? "NotEligible") as StatusKey;
              return (
                <div
                  key={result.productId}
                  className="rounded-lg border border-zinc-200 bg-white p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      {PRODUCT_LABELS[result.productId as keyof typeof PRODUCT_LABELS] ?? result.productId}
                    </h3>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[status]}`}
                    >
                      {status}
                    </span>
                  </div>

                  {result.passedCriteria.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-zinc-600">Strengths</p>
                      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-zinc-700">
                        {result.passedCriteria.map((c: string) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.failedCriteria.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-zinc-600">Gaps</p>
                      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-zinc-700">
                        {result.failedCriteria.map((c: string) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        <section className="mt-8 space-y-8">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
            <form action={runFullAnalysis}>
              <input type="hidden" name="id" value={site.id} />
              <RunAnalysisButton />
            </form>

            <FinancePackPdfButton siteId={site.id} siteName={site.site_name} />
            <LenderPackButton siteId={site.id} siteName={site.site_name} />
          </div>

          <div className="space-y-4">
            <FinancePackButton siteId={site.id} siteName={site.site_name} />

            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Latest broker pack</p>
                  <p className="text-xs text-zinc-600">
                    {brokerPack
                      ? `v${brokerPack.pack_version} • ${new Date(
                          brokerPack.created_at
                        ).toLocaleString()}`
                      : "No broker pack generated yet."}
                  </p>
                </div>
                {brokerPack && (
                  <div className="flex items-center gap-2">
                    <a
                      href={brokerPack.pack_url}
                      className="text-sm font-semibold text-emerald-700 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download PDF
                    </a>
                    {brokerPack.csv_url && (
                      <a
                        href={brokerPack.csv_url}
                        className="text-sm text-zinc-700 hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        CSV
                      </a>
                    )}
                  </div>
                )}
              </div>
              {brokerPack && (
                <div className="mt-2 text-sm text-zinc-700">
                  <p>Headline ask: {brokerPack.headline_ask ?? "—"}</p>
                  <p>
                    Broker: {brokerPack.broker_name ?? "—"}
                    {brokerPack.broker_firm ? ` (${brokerPack.broker_firm})` : ""}
                  </p>
                </div>
              )}
              {!brokerPack && (
                <p className="mt-2 text-sm text-zinc-700">
                  Run risk analysis and generate a pack to populate this section.
                </p>
              )}
            </div>

          {brokers.length > 0 && (
            <BrokerSendForm brokers={brokers} siteName={site.site_name} />
          )}
        </div>
        </section>

        <a
          href="/sites"
          className="text-xs font-medium text-zinc-600 underline underline-offset-4"
        >
          ← Back to all sites
        </a>
      </main>
    </div>
  );
}
