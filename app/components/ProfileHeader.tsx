import type { Profile } from "@/app/lib/profile";

export default function ProfileHeader({ profile }: { profile: Profile | null }) {
  if (!profile) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-6 py-4 shadow-sm">
        <p className="text-sm text-slate-600">
          Complete your profile to personalise reports and PDFs.
        </p>
      </div>
    );
  }

  const nameLine =
    [profile.company_name, profile.full_name].filter(Boolean).join(" · ") || "Profile";
  const contactLine = [profile.email, profile.phone].filter(Boolean).join(" · ");

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-6 py-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        {profile.branding_logo_url && (
          <img
            src={profile.branding_logo_url}
            alt={profile.company_name ?? "Profile logo"}
            className="h-10 w-auto object-contain"
          />
        )}
        <div>
          <p className="text-sm font-semibold text-slate-900">{nameLine}</p>
          {contactLine && <p className="text-xs text-slate-500">{contactLine}</p>}
        </div>
      </div>
    </div>
  );
}
