import Link from "next/link";
import { SignOutButton } from "@/app/components/SignOutButton";
import { supabase } from "@/app/lib/supabaseClient";
import { getNextMove, type NextMove } from "@/app/types/siteFinance";


type SiteRow = {
  id: string;
  site_name: string | null;
  address: string | null;
  local_planning_authority: string | null;
  status: string | null;
  planning_outcome: string | null;
  planning_summary: string | null;
  ai_outcome: string | null;
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

const MOVE_LABEL: Record<NextMove, string> = {
  proceed: "Proceed",
  hold: "Hold & clarify",
  walk_away: "Walk away",
};

const MOVE_CLASS: Record<NextMove, string> = {
  proceed: "bg-emerald-100 text-emerald-800",
  hold: "bg-amber-100 text-amber-800",
  walk_away: "bg-rose-100 text-rose-800",
};

function getHeadlineFundingStatus(results: SiteRow["eligibility_results"]): string {
  const r = (results ?? []).find(
    (x) =>
      x.productId === "homeBuildingFund" ||
      x.productId === "greenerHomesAlliance"
  );
  if (!r) return "—";
  const prefix = r.productId === "homeBuildingFund" ? "HBF" : "GHA";
  return `${prefix}: ${r.status}`;
}

async function getSites(): Promise<SiteRow[]> {
  const { data, error } = await supabase
    .from("sites")
    .select(`
      id,
      site_name,
      address,
      local_planning_authority,
      status,
      planning_outcome,
      planning_summary,
      ai_outcome,
      eligibility_results
    `)
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("Error loading sites", error);
    return [];
  }

  return data ?? [];
}

export default async function SitesPage() {
  const sites = await getSites();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">Sites</h1>
          <div className="flex items-center gap-3">
            <SignOutButton />
            <Link
              href="/sites/new"
              className="inline-flex items-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Analyse a site
            </Link>
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900">
          <p className="font-semibold">Zero-Bill preset</p>
          <p className="text-emerald-800">
            Choose a site, then open the Zero-Bill view to run EPC A analysis and lender packs.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Site
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  LPA
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Outcome
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Summary
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Next move
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Funding
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Zero-Bill
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sites.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-6 text-center text-sm text-zinc-500"
                  >
                    No sites found yet.
                  </td>
                </tr>
              )}

              {sites.map((site) => (
                <tr key={site.id} className="hover:bg-zinc-50/60">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    <Link href={`/sites/${site.id}`} className="hover:underline">
                      {site.site_name || "Untitled site"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {site.address || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {site.local_planning_authority || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                      {site.status || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {site.planning_outcome || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {site.planning_summary || "—"}
                  </td>
                  {(() => {
                    const next = getNextMove(site.ai_outcome, site.eligibility_results ?? []);
                    return (
                      <>
                        <td className="px-4 py-3 text-xs">
                          <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 font-medium">
                            {next.move === "proceed"
                              ? "Proceed"
                              : next.move === "hold"
                              ? "Hold & clarify"
                              : "Walk away"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-700">
                          {getHeadlineFundingStatus(site.eligibility_results)}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/sites/${site.id}/zero-bill`}
                            className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100"
                          >
                            Open Zero-Bill view
                          </Link>
                        </td>
                      </>
                    );
                  })()}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
