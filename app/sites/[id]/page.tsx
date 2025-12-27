import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "../../lib/supabaseServer";
import { runSiteAnalysis, uploadSitePdf, updateSite } from "./actions";
import { RunAnalysisButton } from "./RunAnalysisButton";
import { ConfidenceScoreSection } from "./ConfidenceScoreSection";
import { RiskRationaleSection } from "./RiskRationaleSection";
import { SiteKillersSection } from "./SiteKillersSection";
import { runFundingEligibility } from "./actions";
import { FinancePackButton } from "./FinancePackButton";
import { FinancePackPdfButton } from "./FinancePackPdfButton";
import { getNextMove, getFrictionHint, type NextMove } from "@/app/types/siteFinance";
import { BrokerSendForm } from "./BrokerSendForm";

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
  proposed_units: number | null | undefined;
  ai_units_estimate: number | null | undefined;
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
  eligibility_results:
    | {
        productId:
          | "homeBuildingFund"
          | "smeAccelerator"
          | "greenerHomesAlliance"
          | "housingGrowthPartnership";
        status: "Eligible" | "Borderline" | "NotEligible";
        passedCriteria: string[];
        failedCriteria: string[];
      }[]
    | null;
};

type Broker = {
  id: string;
  name: string;
  firm: string | null;
  email: string;
};

const PRODUCT_LABELS = {
  homeBuildingFund: "Home Building Fund (development finance)",
  smeAccelerator: "SME Accelerator",
  greenerHomesAlliance: "Greener Homes Alliance",
  housingGrowthPartnership: "Housing Growth Partnership",
} as const;

const STATUS_CLASS = {
  Eligible: "bg-emerald-100 text-emerald-800",
  Borderline: "bg-amber-100 text-amber-800",
  NotEligible: "bg-rose-100 text-rose-800",
} as const;

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
  searchParams?: { upload?: string };
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
        eligibility_results
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
  const site: Site = {
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
  };

  return site;
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
    .from("broker_profiles")
    .select("id, name, firm, email")
    .eq("user_id", user.id)
    .order("name");

  if (error) {
    console.error("❌ Error loading brokers:", error);
    return [];
  }

  return data ?? [];
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
        eligibility_results
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

  const site: Site = {
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
  };

  return site;
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
  const resolvedSearchParams = await searchParams;
  const uploadStatus = resolvedSearchParams?.upload;
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
            {site.eligibility_results.map((result) => (
              <div
                key={result.productId}
                className="rounded-lg border border-zinc-200 bg-white p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    {PRODUCT_LABELS[result.productId] ?? result.productId}
                  </h3>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[result.status]}`}
                  >
                    {result.status}
                  </span>
                </div>

                {result.passedCriteria.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-zinc-600">Strengths</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-zinc-700">
                      {result.passedCriteria.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.failedCriteria.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-zinc-600">Gaps</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-zinc-700">
                      {result.failedCriteria.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        <div className="space-y-4">
          {uploadStatus === "success" && (
            <p className="text-sm text-green-600">PDF uploaded successfully.</p>
          )}
          {uploadStatus === "error" && (
            <p className="text-sm text-red-600">There was a problem uploading the PDF.</p>
          )}

          <form action={runSiteAnalysis}>
            <input type="hidden" name="id" value={site.id} />
            <RunAnalysisButton />
          </form>

          <form action={runFundingEligibility}>
            <input type="hidden" name="id" value={site.id} />
            <button
              type="submit"
              className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Run funding fit-check
            </button>
          </form>

          <div className="flex gap-2">
            <FinancePackButton siteId={site.id} siteName={site.site_name} />
            <FinancePackPdfButton siteId={site.id} siteName={site.site_name} />
          </div>
          {brokers.length > 0 && (
            <BrokerSendForm brokers={brokers} siteName={site.site_name} />
          )}

          <form action={uploadSitePdf} className="space-y-2">
            <input type="hidden" name="id" value={site.id} />
            <label className="block text-sm font-medium text-zinc-800">
              Upload site plan (PDF)
            </label>
            <input
              type="file"
              name="file"
              accept="application/pdf"
              className="block text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border file:border-zinc-200 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-800 hover:file:border-zinc-300"
            />
            <button
              type="submit"
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-900 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50"
            >
              Upload PDF
            </button>
          </form>
        </div>

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
