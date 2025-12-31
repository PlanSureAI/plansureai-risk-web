import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";
import { addBrokerContact, deleteBrokerContact } from "./actions";

export default async function BrokersPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: brokers, error } = await supabase
    .from("broker_contacts")
    .select("id, name, firm, email, phone, notes")
    .eq("user_id", user!.id)
    .order("name");

  if (error) {
    console.error("Failed to load brokers", error);
  }

  return (
    <div className="page-shell">
      <div className="page space-y-6">
        <div>
          <h1 className="text-h1">Broker contacts</h1>
          <p className="text-body text-zinc-600">
            Add or update the brokers you work with. These feed the pack generator and mailto links.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Add broker</h2>
          <form action={addBrokerContact} className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Name
              <input name="name" required className="rounded border border-zinc-200 px-2 py-1" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Firm
              <input name="firm" className="rounded border border-zinc-200 px-2 py-1" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Email
              <input type="email" name="email" className="rounded border border-zinc-200 px-2 py-1" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Phone
              <input name="phone" className="rounded border border-zinc-200 px-2 py-1" />
            </label>
            <label className="md:col-span-2 flex flex-col gap-1 text-sm">
              Notes
              <textarea name="notes" rows={2} className="rounded border border-zinc-200 px-2 py-1" />
            </label>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Save broker
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Saved brokers</h2>
          <div className="mt-3 space-y-2">
            {brokers?.length ? (
              brokers.map((broker) => (
                <div
                  key={broker.id}
                  className="flex flex-col items-start justify-between rounded border border-zinc-100 bg-zinc-50 p-3 md:flex-row md:items-center"
                >
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-zinc-900">
                      {broker.name} {broker.firm ? `– ${broker.firm}` : ""}
                    </p>
                    <p className="text-zinc-700">
                      {broker.email ?? "No email"} {broker.phone ? `• ${broker.phone}` : ""}
                    </p>
                    {broker.notes && <p className="text-xs text-zinc-600">{broker.notes}</p>}
                  </div>
                  <form action={deleteBrokerContact}>
                    <input type="hidden" name="id" value={broker.id} />
                    <button className="text-xs font-semibold text-rose-600 hover:underline">
                      Delete
                    </button>
                  </form>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-600">No brokers yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
