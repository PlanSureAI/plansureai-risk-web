import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "../../lib/supabaseServer";
import { runSiteAnalysis, uploadSitePdf, updateSite } from "./actions";
import { RunAnalysisButton } from "./RunAnalysisButton";
import { ConfidenceScoreSection } from "./ConfidenceScoreSection";
import { RiskRationaleSection } from "./RiskRationaleSection";
import { SiteKillersSection } from "./SiteKillersSection";

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
  gdv: number | null;
  total_cost: number | null;
  profit_on_cost_percent: number | null;
  loan_amount: number | null;
  ltc_percent: number | null;
  ltgdv_percent: number | null;
  interest_cover: number | null;
  planning_confidence_score: number | null;
  confidence_reasons: string[] | null;
  // Optional legacy finance fields
  gdv?: number;
  total_cost?: number;
  profit_on_cost?: number;
  loan_amount?: number;
  ltc?: number;
  ltgdv?: number;
  interest_cover?: number;
};

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
        confidence_reasons
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
  return data;
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
        confidence_reasons
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

  return data;
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
  const resolvedSearchParams = await searchParams;
  const uploadStatus = resolvedSearchParams?.upload;

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
