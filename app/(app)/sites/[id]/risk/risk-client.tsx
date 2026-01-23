"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabaseBrowser";
import { RiskBadge } from "@/app/components/RiskBadge";
import { ComparableApprovalsMap } from "../ComparableApprovalsMap";
import { ComparableAnalysisWithGating } from "@/app/components/ComparableAnalysisWithGating";

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

type MitigationPlan = {
  summary: string;
  steps: Array<{
    title: string;
    description: string;
    cost_gbp_min?: number | null;
    cost_gbp_max?: number | null;
    timeline_weeks_min?: number | null;
    timeline_weeks_max?: number | null;
    specialist?: string | null;
  }>;
};

type RiskAnalysis = {
  score?: number;
  level?: string;
  tagline?: string;
  topRisks?: Array<{
    id: string;
    severity: string;
    title: string;
    description: string;
    category?: string;
  }>;
  mitigation_plan?: MitigationPlan | null;
};

type SiteRecord = {
  id: string;
  site_name: string | null;
  address: string | null;
  latitude?: number | null;
  longitude?: number | null;
  risk_profile: RiskProfile | null;
  planning_route: string | null;
  planning_route_status: string | null;
  last_assessed_at: string | null;
};

function mapRiskToCategory(risk: { title: string; constraint?: string }): string {
  const constraint = (risk.constraint ?? "").toLowerCase();
  const title = risk.title.toLowerCase();

  if (constraint.includes("conservation") || constraint.includes("listed")) return "heritage";
  if (constraint.includes("tpo") || constraint.includes("tree")) return "trees";
  if (constraint.includes("flood")) return "flooding";
  if (constraint.includes("parking")) return "parking";

  if (title.includes("heritage") || title.includes("conservation") || title.includes("listed")) {
    return "heritage";
  }
  if (title.includes("tree")) return "trees";
  if (title.includes("flood") || title.includes("drainage")) return "flooding";
  if (title.includes("parking")) return "parking";

  return "heritage";
}

function mapConstraintType(risk: { title: string; constraint?: string }): string | undefined {
  const constraint = (risk.constraint ?? "").toLowerCase();
  const title = risk.title.toLowerCase();

  if (constraint.includes("conservation") || title.includes("conservation")) {
    return "conservation_area";
  }
  if (constraint.includes("listed") || title.includes("listed")) {
    return "listed_building";
  }
  return undefined;
}

function mapRiskLevelToSeverity(level: string): "low" | "medium" | "high" | "critical" {
  const normalized = level.toLowerCase();
  if (normalized === "critical" || normalized === "extreme") return "critical";
  if (normalized === "high") return "high";
  if (normalized === "medium") return "medium";
  return "low";
}

function formatStatus(status: string | null) {
  if (!status) return "Unknown";
  return status.replace("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatCurrency(amount?: number | null) {
  if (amount == null) return "—";
  return `£${amount.toLocaleString("en-GB")}`;
}

function formatTimeline(min?: number | null, max?: number | null) {
  if (min == null && max == null) return "—";
  if (min != null && max != null) return `${min}-${max} weeks`;
  if (min != null) return `${min}+ weeks`;
  return `Up to ${max} weeks`;
}

export function RiskClient() {
  const router = useRouter();
  const params = useParams();
  const siteId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [site, setSite] = useState<SiteRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [userTier, setUserTier] = useState<"free" | "starter" | "pro" | "enterprise">("free");
  const [isAssessing, setIsAssessing] = useState(false);

  async function fetchData() {
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
          latitude,
          longitude,
          risk_profile,
          planning_route,
          planning_route_status,
          last_assessed_at
        `
      )
      .eq("id", siteId)
      .maybeSingle();

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

    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("tier")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscription?.tier) {
      setUserTier(subscription.tier);
    }

    const riskResponse = await fetch(`/api/sites/${siteId}/risk-score`);
    if (riskResponse.ok) {
      const data = (await riskResponse.json()) as RiskAnalysis & { calculated?: boolean };
      if (data.calculated !== false) {
        setRiskAnalysis(data);
      } else {
        setRiskAnalysis(null);
      }
    }

    setSite(siteData as SiteRecord);
    setIsLoading(false);
  }

  const handleRunAssessment = async () => {
    setIsAssessing(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/sites/${siteId}/risk-score`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        setErrorMessage(error.error || "Failed to run assessment");
        setIsAssessing(false);
        return;
      }

      await fetchData();
    } catch (error) {
      console.error("Assessment failed:", error);
      setErrorMessage("An error occurred while running the assessment. Please try again.");
    } finally {
      setIsAssessing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!isMounted) return;
      setIsLoading(true);
      await fetchData();
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

  const derivedProfile: RiskProfile | null = site.risk_profile
    ? site.risk_profile
    : riskAnalysis
      ? {
          overallRiskScore: riskAnalysis.score ?? 0,
          riskLevel: (riskAnalysis.level ?? "low").toUpperCase() as RiskProfile["riskLevel"],
          summary: riskAnalysis.tagline,
          flags: (riskAnalysis.topRisks ?? []).map((risk) => ({
            id: risk.id,
            level: risk.severity,
            title: risk.title,
            message: risk.description,
            severity: risk.severity,
            category: risk.category,
          })),
          calculatedAt: new Date().toISOString(),
        }
      : null;

  if (!derivedProfile) {
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
          <button
            onClick={handleRunAssessment}
            disabled={isAssessing}
            className="mt-4 inline-flex items-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAssessing ? "Generating Assessment..." : "Run Risk Assessment"}
          </button>
        </div>
      </div>
    );
  }

  const profile = derivedProfile;
  const mitigationPlan = riskAnalysis?.mitigation_plan ?? null;
  const steps = mitigationPlan?.steps ?? [];
  const isPaidTier = userTier !== "free";
  const visibleSteps = isPaidTier ? steps : steps.slice(0, 5);
  const primaryRisk = riskAnalysis?.topRisks?.[0];
  const comparableRiskCategory = primaryRisk ? mapRiskToCategory(primaryRisk) : "heritage";
  const comparableRiskSeverity = primaryRisk
    ? mapRiskLevelToSeverity(primaryRisk.severity)
    : "low";

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

      {/* Overall Risk Status */}
      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Overall Risk Status</h2>
          <RiskBadge riskLevel={profile.riskLevel} riskScore={profile.overallRiskScore} />
        </div>
        {profile.summary && <p className="mt-3 text-sm text-zinc-600">{profile.summary}</p>}
      </div>

      {/* Planning Route */}
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

      {/* Risk Flags */}
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

      {/* Mitigation Plan */}
      {mitigationPlan && steps.length > 0 && (
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">Mitigation Plan</h3>
            {!isPaidTier && (
              <span className="text-xs font-semibold text-amber-700">Basic plan</span>
            )}
          </div>
          <p className="mt-2 text-sm text-zinc-600">{mitigationPlan.summary}</p>

          <div className="mt-4 space-y-4">
            {visibleSteps.map((step, index) => (
              <div key={`${step.title}-${index}`} className="rounded-lg border border-zinc-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-zinc-900">{step.title}</h4>
                    <p className="mt-1 text-sm text-zinc-600">{step.description}</p>
                    {isPaidTier && (
                      <div className="mt-3 grid gap-2 text-xs text-zinc-500 md:grid-cols-3">
                        <div>
                          <span className="font-semibold text-zinc-700">Cost: </span>
                          {formatCurrency(step.cost_gbp_min)} - {formatCurrency(step.cost_gbp_max)}
                        </div>
                        <div>
                          <span className="font-semibold text-zinc-700">Timeline: </span>
                          {formatTimeline(step.timeline_weeks_min, step.timeline_weeks_max)}
                        </div>
                        <div>
                          <span className="font-semibold text-zinc-700">Specialist: </span>
                          {step.specialist || "Not specified"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!isPaidTier && steps.length > visibleSteps.length && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              Upgrade to Developer to unlock {steps.length - visibleSteps.length} more steps with
              costs, timelines, and specialist guidance.
            </div>
          )}
        </div>
      )}

      {/* Nearby Planning Applications Map - NEW SECTION */}
      {site.address && (
        <div className="mt-6">
          <ComparableApprovalsMap site={{ id: site.id, address: site.address }} />
        </div>
      )}

      {/* Comparable Analysis - NEW SECTION */}
      {site.latitude && site.longitude && (
        <div className="mt-6">
          <ComparableAnalysisWithGating
            riskCategory={comparableRiskCategory}
            riskSeverity={comparableRiskSeverity}
            councilName={undefined}
            constraintType={primaryRisk ? mapConstraintType(primaryRisk) : undefined}
            userTier={userTier}
            hasProfessionalReports={false}
            hasPreAppAdvice={false}
            inConservationArea={
              primaryRisk?.title?.toLowerCase().includes("conservation") ||
              primaryRisk?.description?.toLowerCase().includes("conservation") ||
              false
            }
            hasListedBuilding={
              primaryRisk?.title?.toLowerCase().includes("listed") ||
              primaryRisk?.description?.toLowerCase().includes("listed") ||
              false
            }
            hasTreeConstraints={
              primaryRisk?.title?.toLowerCase().includes("tree") ||
              primaryRisk?.description?.toLowerCase().includes("tree") ||
              false
            }
            inFloodZone={
              primaryRisk?.title?.toLowerCase().includes("flood") ||
              primaryRisk?.description?.toLowerCase().includes("flood") ||
              false
            }
          />
        </div>
      )}
    </div>
  );
}
