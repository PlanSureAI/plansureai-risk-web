import Link from "next/link";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";
import { runZeroBillAnalysis, type ZeroBillAssessment } from "./actions";
import { RunZeroBillButton } from "./RunZeroBillButton";
import { ZeroBillPdfButton } from "./ZeroBillPdfButton";

type PageProps = { params: { id: string } };

type ZeroBillSite = {
  id: string;
  site_name: string | null;
  address: string | null;
  local_planning_authority: string | null;
  status: string | null;
  planning_outcome: string | null;
  planning_summary: string | null;
  objection_likelihood: string | null;
  proposed_units: number | null;
  target_sap: number | null;
  target_epc_band: string | null;
  fossil_fuel_free: boolean | null;
  mmc_used: boolean | null;
  zero_bill_assessment: ZeroBillAssessment | null;
  zero_bill_last_run_at: string | null;
};

export default async function ZeroBillHomesPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
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
        objection_likelihood,
        proposed_units,
        target_sap,
        target_epc_band,
        fossil_fuel_free,
        mmc_used,
        zero_bill_assessment,
        zero_bill_last_run_at
      `
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("Zero-Bill page error:", error);
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-900">Unable to load site</p>
          <p className="text-xs text-red-700 mt-1">
            {error?.message || "Site not found or access denied."}
          </p>
        </div>
      </main>
    );
  }

  const site = data as ZeroBillSite;
  const assessment = (site as any).zero_bill_assessment as ZeroBillAssessment | null;
  const lastRun = (site as any).zero_bill_last_run_at as string | null;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Zero-Bill Homes workflow
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {site.site_name || "Untitled site"}
            </h1>
            <p className="text-sm text-zinc-600">{site.address || "No address set"}</p>
            <p className="text-xs text-zinc-500">
              {site.local_planning_authority || "No LPA set"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ZeroBillPdfButton
              siteId={site.id}
              siteName={site.site_name}
              disabled={!assessment}
            />
            <Link
              href={`/sites/${site.id}`}
              className="inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold text-zinc-700 ring-1 ring-inset ring-zinc-200 hover:bg-white"
            >
              Back to site
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Site</p>
            <p className="mt-1 text-base font-semibold text-zinc-900">
              {site.site_name || "Untitled site"}
            </p>
            <p className="text-sm text-zinc-700">{site.address || "No address set"}</p>
            <p className="text-xs text-zinc-500">
              Units: {site.proposed_units ?? "—"}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Planning status
            </p>
            <p className="mt-1 font-semibold text-zinc-900">{site.status || "Not set"}</p>
            <p className="text-sm text-zinc-700">
              Outcome: {site.planning_outcome || "—"}
            </p>
            <p className="text-sm text-zinc-700">
              Objection likelihood: {site.objection_likelihood || "—"}
            </p>
            <p className="text-xs text-zinc-500">
              {site.planning_summary || "No planning summary recorded."}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Energy strategy
            </p>
            <ul className="mt-2 space-y-1 text-sm text-zinc-800">
              <li>EPC target: {site.target_epc_band ?? "—"}</li>
              <li>Target SAP: {site.target_sap ?? "—"}</li>
              <li>Fossil-fuel-free heat: {formatBoolean(site.fossil_fuel_free)}</li>
              <li>MMC: {formatBoolean(site.mmc_used)}</li>
              <li>Phasing: Not recorded</li>
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Zero-Bill analysis
              </p>
              <p className="text-sm text-zinc-700">
                Last run: {lastRun ? formatDate(lastRun) : "Not run yet"}
              </p>
              <p className="text-xs text-zinc-600">
                Uses your planning context plus EPC A, net-operational energy, heat pumps and solar.
              </p>
            </div>

            <form action={runZeroBillAnalysis} className="flex items-center gap-3">
              <input type="hidden" name="id" value={site.id} />
              <RunZeroBillButton />
            </form>
          </div>
        </section>

        {assessment ? (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className={riskBadgeClass(assessment.planningRiskScore)}>
                Planning risk score: {Math.round(assessment.planningRiskScore)}/100
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200">
                Zero-Bill narrative ready
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Zero-Bill narrative
                </p>
                <p className="mt-2 whitespace-pre-line text-sm text-zinc-800">
                  {assessment.zeroBillNarrative || "No narrative returned by the model."}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Lender rationale
                </p>
                <p className="mt-2 whitespace-pre-line text-sm text-zinc-800">
                  {assessment.lenderRationale || "No lender rationale returned by the model."}
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {assessment.pdfSections.map((section, idx) => (
                <div
                  key={`${section.title}-${idx}`}
                  className="rounded-xl border border-emerald-100 bg-white p-4 text-sm shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    {section.title || "Section"}
                  </p>
                  <p className="mt-2 whitespace-pre-line text-zinc-800">
                    {section.body || "No detail provided."}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/60 p-5 text-sm text-emerald-900">
            <p className="font-semibold">No Zero-Bill assessment yet.</p>
            <p className="mt-1">
              Run the Zero-Bill preset to get a planning risk score, lender narrative, and a PDF-ready lender pack.
            </p>
          </section>
        )}

        <p className="text-xs text-zinc-500">
          PDF export uses the latest Zero-Bill run. Refresh after editing planning or energy inputs.
        </p>
      </main>
    </div>
  );
}

function formatBoolean(value: boolean | null) {
  if (value == null) return "—";
  return value ? "Yes" : "No";
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function riskBadgeClass(score: number) {
  if (score >= 75) {
    return "inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-800 ring-1 ring-inset ring-red-200";
  }
  if (score >= 50) {
    return "inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200";
  }
  return "inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200";
}
