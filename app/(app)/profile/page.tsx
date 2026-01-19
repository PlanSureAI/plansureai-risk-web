import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileForUser } from "@/app/lib/profile";

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
    company_name: (formData.get("company_name") as string | null)?.trim() || null,
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

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const profile = await getProfileForUser(supabase, session.user.id);

  return (
    <main className="px-6 py-10">
      <section className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white px-6 py-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
        <p className="mt-2 text-sm text-slate-600">
          These details appear on your dashboards and PDFs.
        </p>

        <form action={saveProfile} className="mt-6 grid gap-5 md:grid-cols-2">
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
              defaultValue={profile?.email ?? session.user.email ?? ""}
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
            <p className="mt-2 text-xs text-slate-500">
              Upload a logo to your storage bucket and paste the URL or storage
              path.
            </p>
          </div>

          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Save profile
            </button>
            <a
              href="/dashboard"
              className="inline-flex items-center rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back to dashboard
            </a>
          </div>
        </form>
      </section>
    </main>
  );
}
