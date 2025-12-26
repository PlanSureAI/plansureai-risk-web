import Link from "next/link";
import { SignOutButton } from "../components/SignOutButton";
import { supabase } from "../lib/supabaseClient";


type SiteRow = {
  id: string;
  site_name: string | null;
  address: string | null;
  local_planning_authority: string | null;
  status: string | null;
  planning_outcome: string | null;
  planning_summary: string | null;
};

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
      planning_summary
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
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sites.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
