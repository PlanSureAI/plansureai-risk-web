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
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-xl font-semibold text-zinc-900">
          Analyse a new site
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Capture the basics so you can assess planning risk and viability.
        </p>

        <form action={createSite} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700">
              Site name
            </label>
            <input
              type="text"
              name="site_name"
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Helston"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700">
              Address
            </label>
            <input
              type="text"
              name="address"
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Street, town, postcode"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700">
                Local planning authority
              </label>
              <input
                type="text"
                name="local_planning_authority"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                placeholder="Cornwall"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700">
                Status
              </label>
              <select
                name="status"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
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
              <label className="block text-xs font-medium text-zinc-700">
                Asking price
              </label>
              <input
                type="number"
                name="asking_price"
                min={0}
                step={1000}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                placeholder="350000"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700">
              Proposed units
            </label>
            <input
              type="number"
              name="proposed_units"
              min={1}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              placeholder="12"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Best for 3–40 homes in England; above that, treat outputs as indicative only.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700">
              Initial notes / planning summary
            </label>
            <textarea
              name="notes"
              rows={4}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              placeholder="High-level thoughts, constraints, comparable schemes…"
            />
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              Create and analyse
            </button>
            <a
              href="/sites"
              className="text-xs font-medium text-zinc-600 underline underline-offset-4"
            >
              Cancel
            </a>
          </div>
        </form>
      </main>
    </div>
  );
}
