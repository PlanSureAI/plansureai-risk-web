import { getSiteForLender } from "../page";

type PageProps = { params: { id: string } };

export default async function LenderSummaryPage({ params }: PageProps) {
  const { id } = await params;
  const site = await getSiteForLender(id);

  if (!site) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 text-sm text-zinc-700">
        Site not found.
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        {/* Header band */}
        <header className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            Lender Summary · PlansureAI
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {site.site_name || "Untitled site"}
          </h1>
          <p className="text-sm text-zinc-600">{site.address || "No address set"}</p>
          <p className="text-xs text-zinc-500">
            {site.local_planning_authority || "No LPA set"}
          </p>
        </header>

        {/* Metrics strip band */}
        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard label="GDV" value={site.gdv} format="currency" />
          <MetricCard label="Total cost" value={site.total_cost} format="currency" />
          <MetricCard
            label="Profit on cost"
            value={site.profit_on_cost_percent}
            format="percent"
          />
          <MetricCard label="Loan amount" value={site.loan_amount} format="currency" />
          <MetricCard label="LTC" value={site.ltc_percent} format="percent" />
          <MetricCard label="LTGDV" value={site.ltgdv_percent} format="percent" />
          <MetricCard label="Interest cover" value={site.interest_cover} format="number" />
          <MetricCard
            label="Planning confidence"
            value={site.planning_confidence_score}
            format="percent"
          />
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-4 text-sm space-y-2">
          <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Why this isn&apos;t Red / What moves it to Green
          </h2>
          <p className="whitespace-pre-line text-zinc-800">
            {site.risk_rationale || "No risk rationale recorded yet."}
          </p>
        </section>

        {site.site_killers && site.site_killers.length > 0 && (
          <section className="space-y-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm">
            <h2 className="text-xs font-medium uppercase tracking-wide text-red-700">
              Top site killers
            </h2>

            <div className="space-y-3">
              {site.site_killers.map((killer, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-red-200 bg-white/70 p-3 space-y-1"
                >
                  <div className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                      {idx + 1}
                    </span>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-red-900">{killer.risk}</p>
                      <p className="text-sm text-red-800">
                        <span className="font-medium">Impact:</span> {killer.impact}
                      </p>
                      <p className="text-sm text-red-700">
                        <span className="font-medium">Mitigation:</span> {killer.mitigation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Panels band – placeholders wired to your existing data */}
        <section className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 text-sm">
            <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Site &amp; Planning
            </h2>
            <p>
              <span className="font-medium">Status:</span> {site.status || "—"}
            </p>
            <p>
              <span className="font-medium">Outcome:</span> {site.planning_outcome || "—"}
            </p>
            <p>
              <span className="font-medium">Objection likelihood:</span>{" "}
              {site.objection_likelihood || "—"}
            </p>
            <p className="text-xs text-zinc-600 whitespace-pre-line">
              {site.key_planning_considerations || "No key considerations recorded."}
            </p>
          </div>

          <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 text-sm">
            <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Planning summary
            </h2>
            <p className="whitespace-pre-line">
              {site.planning_summary || "No planning summary recorded."}
            </p>
            <h3 className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Decision summary
            </h3>
            <p className="whitespace-pre-line">
              {site.decision_summary || "No decision summary recorded."}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({
  label,
  value,
  format,
}: {
  label: string;
  value: number | null;
  format: "currency" | "percent" | "number";
}) {
  const formatted = formatMetric(value, format);

  return (
    <div className={`rounded-xl border p-3 text-sm ${getMetricClasses(label, value)}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-zinc-900">{formatted}</p>
    </div>
  );
}

function getMetricClasses(label: string, value: number | null) {
  if (value === null) return "border-zinc-200 bg-white";

  if (label === "LTC") {
    if (value <= 70) return "border-emerald-200 bg-emerald-50";
    if (value <= 85) return "border-amber-200 bg-amber-50";
    return "border-red-200 bg-red-50";
  }

  if (label === "LTGDV") {
    if (value <= 60) return "border-emerald-200 bg-emerald-50";
    if (value <= 70) return "border-amber-200 bg-amber-50";
    return "border-red-200 bg-red-50";
  }

  if (label === "Planning confidence") {
    if (value >= 80) return "border-emerald-200 bg-emerald-50";
    if (value >= 55) return "border-amber-200 bg-amber-50";
    return "border-red-200 bg-red-50";
  }

  return "border-zinc-200 bg-white";
}

function formatMetric(value: number | null, format: "currency" | "percent" | "number") {
  if (value === null || Number.isNaN(value)) return "—";

  if (format === "currency") {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(value);
  }

  if (format === "percent") {
    return `${Number(value).toFixed(1)}%`;
  }

  return Number(value).toLocaleString("en-GB");
}
