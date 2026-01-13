import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function createSite(formData: FormData) {
  "use server";

  const supabase = await createSupabaseServerClient();

  const site_name = (formData.get("site_name") as string | null)?.trim() || null;
  const address = (formData.get("address") as string | null)?.trim() || null;
  const local_planning_authority =
    (formData.get("local_planning_authority") as string | null)?.trim() || null;
  const status = (formData.get("status") as string | null)?.trim() || null;
  const askingPriceRaw = formData.get("asking_price") as string | null;
  const asking_price =
    askingPriceRaw && askingPriceRaw.trim() !== ""
      ? Number(askingPriceRaw)
      : null;
  const notes = (formData.get("notes") as string | null)?.trim() || null;

  const { data, error } = await supabase
    .from("sites")
    .insert([
      {
        site_name,
        address,
        local_planning_authority,
        status,
        asking_price,
        planning_summary: notes,
      },
    ])
    .select("id")
    .single();

  if (error || !data) {
    console.error("Error creating site", error);
    return;
  }

  // refresh list + go straight to detail view
  revalidatePath("/sites");
  redirect(`/sites/${data.id}`);
}

export default function NewSitePage() {

  return (
    <div className="page-shell">
      <main className="page max-w-3xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-h1">Analyse a new site</h1>
          <p className="text-body">
            Capture the basics so you can assess planning risk and viability.
          </p>
        </div>

        <div className="card">
          <form action={createSite} className="space-y-4">
            <div>
              <label className="block text-label">Site name</label>
              <input
                type="text"
                name="site_name"
                required
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-body"
                placeholder="Helston"
              />
            </div>

            <div>
              <label className="block text-label">Address</label>
              <input
                type="text"
                name="address"
                required
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-body"
                placeholder="Street, town, postcode"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-label">Local planning authority</label>
                <input
                  type="text"
                  name="local_planning_authority"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-body"
                  placeholder="Cornwall"
                />
              </div>
              <div>
                <label className="block text-label">Status</label>
                <select
                  name="status"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-body"
                  defaultValue=""
                  required
                >
                  <option value="" disabled>
                    Select status
                  </option>
                  <option value="idea">Idea</option>
                  <option value="pre-app">Pre-app</option>
                  <option value="submitted">Submitted</option>
                  <option value="consented">Consented</option>
                  <option value="refused">Refused</option>
                </select>
              </div>
              <div>
                <label className="block text-label">Asking price</label>
                <input
                  type="number"
                  name="asking_price"
                  min={0}
                  step={1000}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-body"
                  placeholder="350000"
                />
              </div>
            </div>

            <div>
              <label className="block text-label">Proposed units</label>
              <input
                type="number"
                name="proposed_units"
                min={1}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-body"
                placeholder="12"
              />
              <p className="mt-1 text-body text-zinc-600">
                Best for 3–40 homes in England; above that, treat outputs as indicative only.
              </p>
            </div>

            <div>
              <label className="block text-label">Initial notes / planning summary</label>
              <textarea
                name="notes"
                rows={4}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-body"
                placeholder="High-level thoughts, constraints, comparable schemes…"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                Create and analyse
              </button>
              <a
                href="/sites"
                className="text-label underline underline-offset-4"
              >
                Cancel
              </a>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
