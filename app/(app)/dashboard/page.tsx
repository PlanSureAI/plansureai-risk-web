import Link from "next/link";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";
import { getProfileForUser } from "@/app/lib/profile";
import ProfileHeader from "@/app/components/ProfileHeader";
import DashboardChartsClient from "./DashboardChartsClient";
import DashboardFiltersBar, { type FilterOption } from "./DashboardFiltersBar";

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

type DashboardFilters = {
  council?: string;
  status?: string;
};

async function saveProfile(formData: FormData) {
  "use server";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const payload = {
    id: user.id,
    full_name: (formData.get("full_name") as string | null)?.trim() || null,
    company_name: (formData.get("company_name") as string | null)?.trim() || null,
    email: (formData.get("email") as string | null)?.trim() || null,
    phone: (formData.get("phone") as string | null)?.trim() || null,
    branding_logo_url:
      (formData.get("branding_logo_url") as string | null)?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  await supabase.from("profiles").upsert(payload, { onConflict: "id" });
}

async function getSites(filters: DashboardFilters): Promise<SiteSummary[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("sites")
    .select(
      `
      id,
      site_name,
      local_planning_authority,
      risk_profile,
      viability_assessment,
      last_assessed_at,
      status
    `
    );

  if (filters.council) {
    query = query.eq("local_planning_authority", filters.council);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query.limit(500);

  if (error) {
    console.error("Error fetching sites for dashboard", error);
    return [];
  }

  return (data ?? []).map((row: any) => {
    const riskLevel = row.risk_profile?.riskLevel as string | undefined;
    let riskBand: RiskBand | null = null;
    if (riskLevel === "LOW") riskBand = "low";
    else if (riskLevel === "MEDIUM") riskBand = "medium";
    else if (riskLevel === "HIGH" || riskLevel === "EXTREME") riskBand = "high";

    const isViable = row.viability_assessment?.isViable;
    const viabilityBand: ViabilityBand | null =
      typeof isViable === "boolean" ? (isViable ? "viable" : "not_viable") : null;

    return {
      id: row.id,
      name: row.site_name ?? "Untitled site",
      council: row.local_planning_authority ?? null,
      riskBand,
      viabilityBand,
      lastAssessmentAt: row.last_assessed_at ?? null,
    };
  });
}

function buildOptions(values: Array<string | null | undefined>): FilterOption[] {
  const seen = new Set<string>();
  const options: FilterOption[] = [];

  values.forEach((raw) => {
    if (!raw) return;
    const cleaned = raw.trim();
    if (!cleaned) return;
    if (seen.has(cleaned)) return;
    seen.add(cleaned);
    options.push({ value: cleaned, label: cleaned });
  });

  return options.sort((a, b) => a.label.localeCompare(b.label));
}

async function getFilterOptions() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("sites")
    .select("local_planning_authority, status")
    .limit(500);

  if (error) {
    console.error("Error fetching dashboard filters", error);
    return { councils: [], statuses: [] };
  }

  return {
    councils: buildOptions((data ?? []).map((row: any) => row.local_planning_authority)),
    statuses: buildOptions((data ?? []).map((row: any) => row.status)),
  };
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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const council =
    typeof searchParams?.council === "string" ? searchParams.council : undefined;
  const status = typeof searchParams?.status === "string" ? searchParams.status : undefined;
  const [sites, filterOptions] = await Promise.all([
    getSites({ council, status }),
    getFilterOptions(),
  ]);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getProfileForUser(supabase, user.id) : null;
  const showCouncilHint = filterOptions.councils.length <= 3;

  const riskCounts = countBy<RiskBand>(sites, (site) => site.riskBand, ["low", "medium", "high"]);

  const viabilityCounts = countBy<ViabilityBand>(sites, (site) => site.viabilityBand, [
    "viable",
    "marginal",
    "not_viable",
  ]);
  const riskDistribution = [
    { label: "Low", value: riskCounts.low },
    { label: "Medium", value: riskCounts.medium },
    { label: "High", value: riskCounts.high },
  ];
  const viabilityDistribution = [
    { label: "Viable", value: viabilityCounts.viable },
    { label: "Marginal", value: viabilityCounts.marginal },
    { label: "Not viable", value: viabilityCounts.not_viable },
  ];

  const totalSites = sites.length;
  const summariseBucket = (
    distribution: { label: string; value: number }[],
    label: string,
    total: number
  ) => {
    const bucket = distribution.find((item) => item.label === label);
    if (!bucket || total === 0 || bucket.value === 0) {
      return null;
    }
    return `${bucket.value} of ${total} sites are ${label}`;
  };
  const riskSummary =
    summariseBucket(riskDistribution, "Medium", totalSites) ??
    summariseBucket(riskDistribution, "High", totalSites) ??
    summariseBucket(riskDistribution, "Low", totalSites);
  const viabilitySummary =
    summariseBucket(viabilityDistribution, "Viable", totalSites) ??
    summariseBucket(viabilityDistribution, "Marginal", totalSites) ??
    summariseBucket(viabilityDistribution, "Not viable", totalSites);
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
        <ProfileHeader profile={profile} />
        <details className="rounded-lg border border-slate-200 bg-white px-6 py-4 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold text-slate-900">
            Edit profile
          </summary>
          <form action={saveProfile} className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-600">
                Full name
              </label>
              <input
                name="full_name"
                required
                defaultValue={profile?.full_name ?? ""}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">
                Company name
              </label>
              <input
                name="company_name"
                required
                defaultValue={profile?.company_name ?? ""}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                defaultValue={profile?.email ?? user?.email ?? ""}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">
                Phone
              </label>
              <input
                name="phone"
                defaultValue={profile?.phone ?? ""}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600">
                Logo URL
              </label>
              <input
                name="branding_logo_url"
                type="url"
                placeholder="https://..."
                defaultValue={profile?.branding_logo_url ?? ""}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Save changes
              </button>
            </div>
          </form>
        </details>
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

        <DashboardFiltersBar
          councilOptions={filterOptions.councils}
          statusOptions={filterOptions.statuses}
          initialFilters={{ council, status }}
          showCouncilHint={showCouncilHint}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryTile label="Total sites" value={totalSites} />
          <SummaryTile label="Low risk sites" value={riskCounts.low} />
          <SummaryTile label="Viable sites" value={viabilityCounts.viable} />
        </div>

        <DashboardChartsClient
          riskDistribution={riskDistribution}
          viabilityDistribution={viabilityDistribution}
          riskSummary={riskSummary}
          viabilitySummary={viabilitySummary}
        />

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
