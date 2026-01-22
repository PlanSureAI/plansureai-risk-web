import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  calculatePlanningRiskScore,
  type PlanningHistorySummary,
  type PlanningRiskSite,
  type ComparableInsights,
} from "@/app/lib/planningRiskScoring";
import { generateMitigationPlan } from "@/app/lib/generateMitigationPlan";
import { getPoliciesForConstraints, attachPoliciesToRiskFactors } from "@/app/lib/policyLookup";

type NearbyApplication = {
  decision: string | null;
  decision_date: string | null;
  validated_date: string | null;
  refusal_reasons: string[] | null;
  units: number | null;
};

function normalizeAuthority(authority?: string | null): string | null {
  if (!authority) return null;
  const key = authority.toLowerCase();
  if (key.includes("cornwall")) return "Cornwall";
  if (key.includes("birmingham")) return "Birmingham";
  if (key.includes("leeds")) return "Leeds";
  return authority;
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const query = address.trim();
  if (!query) return null;

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}&countrycodes=gb&format=json&limit=1`,
    {
      headers: {
        "User-Agent": "PlanSureAI/1.0 (https://www.plansureai.com)",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) return null;
  const data = await response.json().catch(() => null);
  if (!data || data.length === 0) return null;

  const lat = parseFloat(data[0].lat);
  const lng = parseFloat(data[0].lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
}

function buildHistorySummary(applications: NearbyApplication[]): PlanningHistorySummary {
  const approvals = applications.filter((app) => app.decision === "approved");
  const refusals = applications.filter((app) => app.decision === "refused");

  const decisionDurations = applications
    .map((app) => {
      if (!app.decision_date || !app.validated_date) return null;
      const decision = new Date(app.decision_date).getTime();
      const validated = new Date(app.validated_date).getTime();
      if (!Number.isFinite(decision) || !Number.isFinite(validated)) return null;
      return Math.round((decision - validated) / (1000 * 60 * 60 * 24 * 7));
    })
    .filter((value): value is number => value != null);

  const refusalReasons = refusals
    .flatMap((app) => app.refusal_reasons ?? [])
    .map((reason) => reason.trim())
    .filter(Boolean);

  const reasonCounts = refusalReasons.reduce<Record<string, number>>((acc, reason) => {
    acc[reason] = (acc[reason] ?? 0) + 1;
    return acc;
  }, {});

  const refusalReasonHighlights = Object.entries(reasonCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([reason]) => reason);

  const avgDecisionWeeks =
    decisionDurations.length > 0
      ? Math.round(
          decisionDurations.reduce((sum, value) => sum + value, 0) / decisionDurations.length
        )
      : null;

  const decidedCount = approvals.length + refusals.length;
  const successRate = decidedCount > 0 ? Math.round((approvals.length / decidedCount) * 100) : null;

  return {
    recentApprovals: approvals.length,
    recentRefusals: refusals.length,
    avgDecisionWeeks,
    successRate,
    refusalReasonHighlights,
  };
}

function buildComparableInsights(
  applications: NearbyApplication[],
  targetUnits: number | null
): ComparableInsights | null {
  if (!applications.length) return null;
  const unitTarget = targetUnits ?? 0;
  const similar = applications.filter((app) => {
    if (!app.units || unitTarget === 0) return true;
    return app.units >= unitTarget * 0.5 && app.units <= unitTarget * 1.5;
  });

  const approvals = similar.filter((app) => app.decision === "approved");
  const refusals = similar.filter((app) => app.decision === "refused");
  const decidedCount = approvals.length + refusals.length;
  const approvalProbability =
    decidedCount > 0 ? approvals.length / decidedCount : 0;

  const decisionDurations = similar
    .map((app) => {
      if (!app.decision_date || !app.validated_date) return null;
      const decision = new Date(app.decision_date).getTime();
      const validated = new Date(app.validated_date).getTime();
      if (!Number.isFinite(decision) || !Number.isFinite(validated)) return null;
      return Math.round((decision - validated) / (1000 * 60 * 60 * 24 * 7));
    })
    .filter((value): value is number => value != null);

  const avgDecisionWeeks =
    decisionDurations.length > 0
      ? Math.round(
          decisionDurations.reduce((sum, value) => sum + value, 0) /
            decisionDurations.length
        )
      : null;

  const refusalReasons = refusals
    .flatMap((app) => app.refusal_reasons ?? [])
    .map((reason) => reason.trim())
    .filter(Boolean);

  const reasonCounts = refusalReasons.reduce<Record<string, number>>((acc, reason) => {
    acc[reason] = (acc[reason] ?? 0) + 1;
    return acc;
  }, {});

  const topRefusalReasons = Object.entries(reasonCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: refusals.length > 0 ? (count / refusals.length) * 100 : 0,
    }));

  return {
    similarApproved: approvals.length,
    similarRefused: refusals.length,
    approvalProbability,
    avgDecisionWeeks,
    topRefusalReasons,
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: site, error } = await supabase
    .from("sites")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  let historySummary: PlanningHistorySummary | null = null;
  let comparableInsights: ComparableInsights | null = null;
  const constraints = ((site as any).constraints ?? []) as string[];
  const address = (site as any).address as string | null;
  const coords = address ? await geocodeAddress(address) : null;

  if (coords) {
    const { data: applications } = await supabase.rpc(
      "find_nearby_planning_applications",
      {
        center_lat: coords.lat,
        center_lng: coords.lng,
        radius_meters: 500,
      }
    );

    if (Array.isArray(applications) && applications.length > 0) {
      const nearbyApps = applications as NearbyApplication[];
      historySummary = buildHistorySummary(nearbyApps);
      comparableInsights = buildComparableInsights(
        nearbyApps,
        (site as any).proposed_units ?? null
      );
    }
  }

  const authority = normalizeAuthority(
    (site as any).local_planning_authority ?? null
  );

  const riskAnalysis = calculatePlanningRiskScore(site as PlanningRiskSite, historySummary, {
    comparables: comparableInsights,
    authority,
  });

  const policies = authority
    ? await getPoliciesForConstraints(authority, constraints)
    : [];
  const topRisksWithPolicies = attachPoliciesToRiskFactors(riskAnalysis.topRisks, policies);
  const allRisksWithPolicies = attachPoliciesToRiskFactors(riskAnalysis.allRisks, policies);

  let mitigationPlan = null;
  try {
    mitigationPlan = await generateMitigationPlan(riskAnalysis, site);
  } catch (error) {
    console.error("Failed to generate mitigation plan:", error);
  }
  const fullAnalysis = {
    ...riskAnalysis,
    topRisks: topRisksWithPolicies,
    allRisks: allRisksWithPolicies,
    mitigation_plan: mitigationPlan,
  };

  // Map the risk analysis to risk_profile format for compatibility with risk-client.tsx
  const riskProfile = {
    overallRiskScore: riskAnalysis.score,
    riskLevel: riskAnalysis.level.toUpperCase(),
    summary: riskAnalysis.tagline,
    flags: riskAnalysis.topRisks.map((risk) => ({
      id: risk.id,
      level: risk.severity,
      title: risk.title,
      message: risk.description,
      severity: risk.severity,
      category: risk.category,
    })),
    calculatedAt: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from("sites")
    .update({
      risk_score: riskAnalysis.score,
      risk_level: riskAnalysis.level,
      risk_analysis: fullAnalysis,
      risk_profile: riskProfile,
      risk_calculated_at: new Date().toISOString(),
      last_assessed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("Failed to save risk analysis:", updateError);
    return NextResponse.json(
      { error: "Failed to save risk analysis", details: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json(fullAnalysis);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: site } = await supabase
    .from("sites")
    .select("risk_score, risk_level, risk_analysis, risk_calculated_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!site || !site.risk_analysis) {
    return NextResponse.json(
      {
        calculated: false,
        score: 0,
        level: "low",
        tagline: "Risk score not calculated yet",
        topRisks: [],
        allRisks: [],
        positiveFactors: [],
        confidence: 0,
        calculatedAt: new Date().toISOString(),
        dataVersion: "unscored",
        message: "Risk score not calculated yet",
      },
      { status: 200 }
    );
  }

  return NextResponse.json({ calculated: true, ...site.risk_analysis });
}
