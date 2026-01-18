"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabaseBrowser";

export interface PlanningComparable {
  id: string;
  reference: string;
  address: string;
  description: string;
  decision: string;
  decision_date: string;
  application_date: string;
  weeks_to_decision: number;
  risk_categories: string[];
  in_conservation_area: boolean;
  affects_listed_building: boolean;
  approval_conditions: string[] | null;
  refusal_reasons: string[] | null;
  planning_portal_url: string | null;
}

export interface AnalysisStats {
  total_applications: number;
  approved_count: number;
  refused_count: number;
  approval_rate: number;
  avg_weeks_to_decision: number;
}

export interface ComparableAnalysisResult {
  stats: AnalysisStats;
  recentApprovals: PlanningComparable[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch comparable analysis for a risk category.
 */
export function useComparableAnalysis(
  riskCategory: string,
  councilName = "Cornwall Council",
  constraintType?: string
): ComparableAnalysisResult {
  const [stats, setStats] = useState<AnalysisStats>({
    total_applications: 0,
    approved_count: 0,
    refused_count: 0,
    approval_rate: 0,
    avg_weeks_to_decision: 0,
  });
  const [recentApprovals, setRecentApprovals] = useState<PlanningComparable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAnalysis() {
      if (!riskCategory) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const supabase = createSupabaseBrowserClient();

        let statsQuery = supabase
          .from("comparable_analysis_cache")
          .select("*")
          .eq("risk_category", riskCategory)
          .eq("council_name", councilName);

        if (constraintType) {
          statsQuery = statsQuery.eq("constraint_type", constraintType);
        } else {
          statsQuery = statsQuery.is("constraint_type", null);
        }

        const { data: statsData, error: statsError } = await statsQuery
          .order("last_updated", { ascending: false })
          .limit(1)
          .single();

        if (statsError && statsError.code !== "PGRST116") {
          throw statsError;
        }

        if (statsData) {
          setStats({
            total_applications: statsData.total_applications,
            approved_count: statsData.approved_count,
            refused_count: statsData.refused_count,
            approval_rate: Number(statsData.approval_rate),
            avg_weeks_to_decision: Number(statsData.avg_weeks_to_decision),
          });
        }

        const { data: approvalsData, error: approvalsError } = await supabase
          .from("planning_comparables")
          .select("*")
          .eq("council_name", councilName)
          .eq("decision", "approved")
          .contains("risk_categories", [riskCategory])
          .order("decision_date", { ascending: false })
          .limit(5);

        if (approvalsError) throw approvalsError;

        setRecentApprovals((approvalsData ?? []) as PlanningComparable[]);
      } catch (err) {
        console.error("Error fetching comparable analysis:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch analysis"));
      } finally {
        setLoading(false);
      }
    }

    void fetchAnalysis();
  }, [riskCategory, councilName, constraintType]);

  return { stats, recentApprovals, loading, error };
}

/**
 * Calculate approval likelihood based on factors.
 */
export function calculateApprovalLikelihood(
  baseApprovalRate: number,
  factors: {
    hasProfessionalReports?: boolean;
    hasPreAppAdvice?: boolean;
    inConservationArea?: boolean;
    hasListedBuilding?: boolean;
    hasTreeConstraints?: boolean;
    inFloodZone?: boolean;
  }
): {
  likelihood: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  percentage: number;
  reasoning: string[];
} {
  let adjustedRate = baseApprovalRate;
  const reasoning: string[] = [];

  if (factors.hasProfessionalReports) {
    adjustedRate += 15;
    reasoning.push("Professional reports commissioned (+15%)");
  }

  if (factors.hasPreAppAdvice) {
    adjustedRate += 10;
    reasoning.push("Pre-application advice obtained (+10%)");
  }

  if (factors.inConservationArea && !factors.hasProfessionalReports) {
    adjustedRate -= 10;
    reasoning.push("Conservation area without heritage statement (-10%)");
  }

  if (factors.hasListedBuilding && !factors.hasProfessionalReports) {
    adjustedRate -= 15;
    reasoning.push("Listed building without heritage assessment (-15%)");
  }

  if (factors.hasTreeConstraints && !factors.hasProfessionalReports) {
    adjustedRate -= 10;
    reasoning.push("Tree constraints without arboricultural survey (-10%)");
  }

  if (factors.inFloodZone && !factors.hasProfessionalReports) {
    adjustedRate -= 20;
    reasoning.push("Flood zone without flood risk assessment (-20%)");
  }

  adjustedRate = Math.max(5, Math.min(95, adjustedRate));

  let likelihood: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  if (adjustedRate >= 80) likelihood = "VERY_HIGH";
  else if (adjustedRate >= 60) likelihood = "HIGH";
  else if (adjustedRate >= 40) likelihood = "MEDIUM";
  else likelihood = "LOW";

  return {
    likelihood,
    percentage: Math.round(adjustedRate),
    reasoning,
  };
}

export function formatApprovalRate(rate: number): string {
  return `${Math.round(rate)}%`;
}

export function formatWeeks(weeks: number): string {
  if (weeks < 1) return "Less than 1 week";
  if (weeks === 1) return "1 week";
  return `${Math.round(weeks)} weeks`;
}

export function getLikelihoodColor(
  likelihood: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH"
): string {
  const colors = {
    VERY_HIGH: "text-green-700 bg-green-100 border-green-300",
    HIGH: "text-green-600 bg-green-50 border-green-200",
    MEDIUM: "text-yellow-700 bg-yellow-100 border-yellow-300",
    LOW: "text-red-700 bg-red-100 border-red-300",
  };
  return colors[likelihood];
}
