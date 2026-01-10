import Link from "next/link";

type RiskBand = "low" | "medium" | "high";
type ViabilityBand = "viable" | "marginal" | "not_viable";

type SiteSummary = {
  id: string;
  name: string;
  council: string | null;
  riskBand: RiskBand | null;
  viabilityBand: ViabilityBand | null;
  lastAssessmentAt: string | null;
};

async function getSites(): Promise<SiteSummary[]> {
  return [];
}

function countBy<T extends string>(
  items: SiteSummary[],
  key: (s: SiteSummary) => T | null,
  buckets: T[]
): Record<T, number> {
  const result = Object.fromEntries(buckets.map((b) => [b, 0])) as Record<T, number>;
  for (const item of items) {
    const bucket = key(item);
    if (bucket && result[bucket] !== undefined) {
      result[bucket] += 1;
    }
  }
  return result;
}

export const metadata = {
  title: "Dashboard | PlanSureAI",
};

export default async function DashboardPage() {
  const sites = await getSites();

  const riskCounts = countBy<RiskBand>(sites, (site) => site.riskBand, ["low", "medium", "high"]);

  const viabilityCounts = countBy<ViabilityBand>(sites, (site) => site.viabilityBand, [
    "viable",
    "marginal",
    "not_viable",
  ]);

  const totalSites = sites.length;
  const recent = [...sites]
    .filter((site) => site.lastAssessmentAt)
    .sort(
      (a, b) =>
        new Date(b.lastAssessmentAt ?? 0).getTime() -
        new Date(a.lastAssessmentAt ?? 0).getTime()
    )
    .slice(0, 5);

  return (
    <main className="px-6 py-8">
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-6 shadow-sm">
          <h1 className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-700">
            This dashboard is your portfolio hub, showing planning constraints, risk and viability
            across all your sites in one place.
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Start by adding sites and running assessments from the Sites page. As your portfolio
            grows, its key signals will surface here.
          </p>
          <div className="mt-6">
            <Link
              href="/sites"
              className="inline-flex items-center rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800"
            >
              Go to Sites
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryTile label="Total sites" value={totalSites} />
          <SummaryTile label="Low risk sites" value={riskCounts.low} />
          <SummaryTile label="Viable sites" value={viabilityCounts.viable} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ChartPlaceholder
            title="Risk distribution"
            data={[
              { label: "Low", value: riskCounts.low },
              { label: "Medium", value: riskCounts.medium },
              { label: "High", value: riskCounts.high },
            ]}
          />
          <ChartPlaceholder
            title="Viability distribution"
            data={[
              { label: "Viable", value: viabilityCounts.viable },
              { label: "Marginal", value: viabilityCounts.marginal },
              { label: "Not viable", value: viabilityCounts.not_viable },
            ]}
          />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Recent activity</h2>
          {recent.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">
              No assessments yet. Run your first assessment from the Sites page.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {recent.map((site) => (
                <li key={site.id} className="flex items-center justify-between py-2">
                  <div>
                    <Link
                      href={`/sites/${site.id}`}
                      className="text-sm font-medium text-slate-900 hover:underline"
                    >
                      {site.name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      Last assessment{" "}
                      {site.lastAssessmentAt
                        ? new Date(site.lastAssessmentAt).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                  <div className="text-xs text-slate-500">{site.council ?? "Unknown council"}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-sky-100 bg-white px-4 py-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ChartPlaceholder({
  title,
  data,
}: {
  title: string;
  data: { label: string; value: number }[];
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">
        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-sky-500" />
        {title}
      </h2>
      <ul className="mt-3 space-y-1 text-xs text-slate-600">
        {data.map((item) => (
          <li key={item.label}>
            {item.label}: {item.value}
          </li>
        ))}
      </ul>
    </div>
  );
}
