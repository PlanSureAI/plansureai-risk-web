import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";
import { runFullAnalysis, updateSite } from "./actions";
import { RunAnalysisButton } from "./RunAnalysisButton";
import { getNextMove, getFrictionHint, type NextMove } from "@/app/types/siteFinance";
import { getPlanningForPostcode, type LandTechPlanningApplication } from "@/app/lib/landtech";
import { PlanningRiskCard } from "./PlanningRiskCard";
import { ComparableApprovalsMap } from "./ComparableApprovalsMap";

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

type PageProps = {
  params: { id: string };
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
  };

  return site as Site;
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

export default async function SiteDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  const { data: profile } = user
    ? await supabaseServer
        .from("profiles")
        .select("subscription_tier")
        .eq("id", user.id)
        .single()
    : { data: null };
  const userTier = (profile?.subscription_tier as
    | "free"
    | "starter"
    | "pro"
    | "enterprise"
    | undefined) ?? "free";
  const site = await getSite(id);
  const nextMove = site ? getNextMove(site.ai_outcome, site.eligibility_results ?? []) : null;
  const units = site ? site.proposed_units ?? site.ai_units_estimate ?? null : null;
  const postcode = site ? extractPostcodeFromAddress(site.address) : null;
  let planningApplications: LandTechPlanningApplication[] = [];

  if (site && postcode) {
    let planningData: LandTechPlanningApplication[] | null = null;
    try {
      planningData = await getPlanningForPostcode(postcode);
    } catch (error) {
      console.warn("LandTech data unavailable:", error);
    }
    planningApplications = planningData ? planningData.slice(0, 3) : [];
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

        {/* DEPRIORITIZED: Planning Documents Upload
        {user && (
          <PlanningDocumentsPanel
            siteId={site.id}
            userId={user.id}
            initialDocumentId={planningDocId ?? null}
            brokers={brokers}
          />
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
        */}

        {/* DEPRIORITIZED: Zero-Bill view
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/sites/${site.id}/zero-bill`}
            className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100"
          >
            Open Zero-Bill view
          </Link>
        </div>
        */}

        {/* DEPRIORITIZED: Status/Outcome/Objection summary
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
        */}

        <PlanningRiskCard siteId={site.id} userTier={userTier} />

        <ComparableApprovalsMap
          site={{
            id: site.id,
            address: site.address,
          }}
        />

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

        {/* DEPRIORITIZED: Edit planning analysis form
        <details className="mt-6 rounded-xl border border-zinc-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-zinc-900">
            Edit planning analysis
          </summary>
          <p className="mt-2 text-xs text-zinc-600">
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
        </details>
        */}

        {/* DEPRIORITIZED: Planning summary display
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
        */}


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

        {/* DEPRIORITIZED: Run full analysis + broker pack section
        <section className="mt-8 space-y-8">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
            <form action={runFullAnalysis}>
              <input type="hidden" name="id" value={site.id} />
              <RunAnalysisButton />
            </form>

            <FinancePackPdfButton siteId={site.id} siteName={site.site_name} />
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
        */}

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
