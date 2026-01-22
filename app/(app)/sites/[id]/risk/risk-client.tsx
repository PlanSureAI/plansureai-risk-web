"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabaseBrowser";
import { RiskBadge } from "@/app/components/RiskBadge";

type RiskProfile = {
  overallRiskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
  summary?: string;
  flags?: {
    id: string;
    level: string;
    title: string;
    message: string;
    severity?: string;
    category?: string;
  }[];
  calculatedAt?: string;
};

type SiteRecord = {
  id: string;
  site_name: string | null;
  address: string | null;
  risk_profile: RiskProfile | null;
  planning_route: string | null;
  planning_route_status: string | null;
  last_assessed_at: string | null;
};

function formatStatus(status: string | null) {
  if (!status) return "Unknown";
  return status.replace("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function RiskClient() {
  const router = useRouter();
  const params = useParams();
  const siteId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [site, setSite] = useState<SiteRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!siteId) {
        setErrorMessage("Missing site id.");
        setIsLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: siteData, error } = await supabase
        .from("sites")
        .select(
          `
            id,
            site_name,
            address,
            risk_profile,
            planning_route,
            planning_route_status,
            last_assessed_at
          `
        )
        .eq("id", siteId)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      if (!siteData) {
        setErrorMessage("Site not found.");
        setIsLoading(false);
        return;
      }

      setSite(siteData as SiteRecord);
      setIsLoading(false);
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [router, siteId, supabase]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Loading risk assessment...
        </div>
      </div>
    );
  }

  if (errorMessage || !site) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link href="/sites" className="text-sm text-blue-600 hover:text-blue-800">
          {"← Back to Sites"}
        </Link>
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {errorMessage || "Unable to load site."}
        </div>
      </div>
    );
  }

  if (!site.risk_profile) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link href="/sites" className="text-sm text-blue-600 hover:text-blue-800">
          {"← Back to Sites"}
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900">
          {site.site_name || "Site"} - Risk Assessment
        </h1>
        <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
          <p className="text-sm text-zinc-700">No risk assessment available for this site yet.</p>
          <Link
            href={`/viability?address=${encodeURIComponent(site.address || "")}&siteId=${site.id}`}
            className="mt-4 inline-flex items-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Run Viability Assessment
          </Link>
        </div>
      </div>
    );
  }

  const profile = site.risk_profile;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/sites" className="text-sm text-blue-600 hover:text-blue-800">
        {"← Back to Sites"}
      </Link>
      <div className="mt-4">
        <h1 className="text-3xl font-semibold text-zinc-900">{site.site_name || "Site"}</h1>
        <p className="text-sm text-zinc-600">{site.address || "—"}</p>
        {site.last_assessed_at && (
          <p className="mt-2 text-xs text-zinc-500">
            Last assessed: {new Date(site.last_assessed_at).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Overall Risk Status</h2>
          <RiskBadge riskLevel={profile.riskLevel} riskScore={profile.overallRiskScore} />
        </div>
        {profile.summary && <p className="mt-3 text-sm text-zinc-600">{profile.summary}</p>}
      </div>

      {site.planning_route && site.planning_route !== "none" && (
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-zinc-900">Planning Route</h3>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-zinc-700">
            <span>
              Route: <span className="font-semibold uppercase">{site.planning_route}</span>
            </span>
            <span>
              Status: <span className="font-semibold">{formatStatus(site.planning_route_status)}</span>
            </span>
          </div>
        </div>
      )}

      {profile.flags && profile.flags.length > 0 && (
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-zinc-900">Risk Flags</h3>
          <div className="mt-4 space-y-3">
            {profile.flags.map((flag) => (
              <div key={flag.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                <div className="flex items-center justify-between text-sm font-semibold text-zinc-900">
                  <span>{flag.title}</span>
                  <span className="text-xs text-zinc-500">{flag.level}</span>
                </div>
                <p className="mt-1 text-sm text-zinc-600">{flag.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
