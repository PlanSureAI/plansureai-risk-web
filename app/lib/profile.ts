import type { SupabaseClient } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  branding_logo_url: string | null;
};

type LogoCacheEntry = { url: string; expiresAt: number };

const logoCache = new Map<string, LogoCacheEntry>();
const LOGO_CACHE_SAFETY_WINDOW_MS = 60_000;

function isHttpUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

async function resolveBrandingLogoUrl(
  supabase: SupabaseClient,
  logoValue: string | null,
  expiresInSeconds = 60 * 60 * 24 * 7
) {
  if (!logoValue) return null;
  if (isHttpUrl(logoValue)) return logoValue;

  const bucket = process.env.PROFILE_LOGO_BUCKET ?? "profile-logos";
  let path = logoValue;

  if (logoValue.startsWith("storage:")) {
    const trimmed = logoValue.replace("storage:", "");
    const [bucketName, ...rest] = trimmed.split("/");
    if (bucketName && rest.length > 0) {
      path = rest.join("/");
      return signLogoPath(supabase, bucketName, path, expiresInSeconds);
    }
  }

  if (logoValue.includes(":")) {
    const [bucketName, rest] = logoValue.split(":");
    if (bucketName && rest) {
      path = rest;
      return signLogoPath(supabase, bucketName, path, expiresInSeconds);
    }
  }

  return signLogoPath(supabase, bucket, path, expiresInSeconds);
}

async function signLogoPath(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  expiresInSeconds: number
) {
  const cacheKey = `${bucket}:${path}`;
  const cached = logoCache.get(cacheKey);
  if (cached && cached.expiresAt - Date.now() > LOGO_CACHE_SAFETY_WINDOW_MS) {
    return cached.url;
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) {
    console.error("Failed to sign profile logo URL", error);
    return null;
  }

  logoCache.set(cacheKey, {
    url: data.signedUrl,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  });

  return data.signedUrl;
}

export async function getProfileForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, company_name, email, phone, branding_logo_url")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load profile", error);
    return null;
  }

  const profile = (data as Profile | null) ?? null;
  if (!profile) return null;

  const signedLogoUrl = await resolveBrandingLogoUrl(
    supabase,
    profile.branding_logo_url
  );

  return {
    ...profile,
    branding_logo_url: signedLogoUrl ?? profile.branding_logo_url,
  };
}

export function formatProfileHeaderLines(profile: Profile) {
  const lines: string[] = [];
  const nameLine =
    [profile.company_name, profile.full_name].filter(Boolean).join(" · ") || null;
  if (nameLine) {
    lines.push(nameLine);
  }

  const contactLine = [profile.email, profile.phone].filter(Boolean).join(" · ");
  if (contactLine) {
    lines.push(contactLine);
  }

  return lines;
}

export function assertProfileForExport(profile: Profile | null) {
  if (!profile) {
    throw new Error("Complete your profile before exporting PDFs.");
  }

  const missing = [];
  if (!profile.full_name) missing.push("full name");
  if (!profile.company_name) missing.push("company name");
  if (!profile.email) missing.push("email");

  if (missing.length > 0) {
    throw new Error(
      `Complete your profile before exporting PDFs: missing ${missing.join(", ")}.`
    );
  }
}
