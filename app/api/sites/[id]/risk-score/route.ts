import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";
import {
  calculatePlanningRiskScore,
  type PlanningHistorySummary,
  type PlanningRiskSite,
} from "@/app/lib/planningRiskScoring";

type NearbyApplication = {
  decision: string | null;
  decision_date: string | null;
  validated_date: string | null;
  refusal_reasons: string[] | null;
  units: number | null;
};

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

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: site, error } = await supabase
    .from("sites")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  let historySummary: PlanningHistorySummary | null = null;
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
      historySummary = buildHistorySummary(applications as NearbyApplication[]);
    }
  }

  const riskAnalysis = calculatePlanningRiskScore(site as PlanningRiskSite, historySummary);

  await supabase
    .from("sites")
    .update({
      risk_score: riskAnalysis.score,
      risk_level: riskAnalysis.level,
      risk_analysis: riskAnalysis,
      risk_calculated_at: new Date().toISOString(),
    })
    .eq("id", params.id);

  return NextResponse.json(riskAnalysis);
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: site } = await supabase
    .from("sites")
    .select("risk_score, risk_level, risk_analysis, risk_calculated_at")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!site || !site.risk_analysis) {
    return NextResponse.json({ error: "Risk score not calculated yet" }, { status: 404 });
  }

  return NextResponse.json(site.risk_analysis);
}
