import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function saveProfile(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const payload = {
    id: user.id,
    full_name: (formData.get("full_name") as string | null)?.trim() || null,
    company_name:
      (formData.get("company_name") as string | null)?.trim() || null,
    email: (formData.get("email") as string | null)?.trim() || null,
    phone: (formData.get("phone") as string | null)?.trim() || null,
    branding_logo_url:
      (formData.get("branding_logo_url") as string | null)?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("profiles").upsert(payload, {
    onConflict: "id",
  });

  if (error) {
    throw error;
  }

  redirect("/dashboard");
}

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_name, email, phone, branding_logo_url")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profile) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto max-w-xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Set up your profile
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Add the details that will appear on your reports and PDFs.
        </p>

        <form action={saveProfile} className="mt-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-zinc-700">
              Full name
            </label>
            <input
              name="full_name"
              type="text"
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-black"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700">
              Company name
            </label>
            <input
              name="company_name"
              type="text"
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-black"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700">
              Work email
            </label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-black"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700">
              Phone (optional)
            </label>
            <input
              name="phone"
              type="tel"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-black"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700">
              Logo URL (optional)
            </label>
            <input
              name="branding_logo_url"
              type="url"
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-black"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Save profile
          </button>
        </form>
      </main>
    </div>
  );
}
