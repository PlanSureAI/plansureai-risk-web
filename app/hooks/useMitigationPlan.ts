"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabaseBrowser";

export interface MitigationStep {
  id: string;
  step_name: string;
  step_description: string;
  risk_category: string;
  step_order: number;
  cost_min: number | null;
  cost_max: number | null;
  cost_notes: string | null;
  timeline_weeks_min: number | null;
  timeline_weeks_max: number | null;
  timeline_notes: string | null;
  specialist_type: string | null;
  specialist_required: boolean;
  rationale: string | null;
  success_impact: string | null;
  specialist_directory_url: string | null;
  guidance_url: string | null;
}

export interface SpecialistType {
  id: string;
  specialist_type: string;
  display_name: string;
  description: string | null;
  typical_cost_range: string | null;
  directory_url: string | null;
}

export interface MitigationPlanSummary {
  totalSteps: number;
  totalCostMin: number;
  totalCostMax: number;
  totalTimeMin: number;
  totalTimeMax: number;
  specialistsNeeded: SpecialistType[];
}

/**
 * Hook to fetch mitigation steps for a specific risk category.
 */
export function useMitigationPlan(riskCategory: string) {
  const [steps, setSteps] = useState<MitigationStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchSteps() {
      if (!riskCategory) {
        setSteps([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const supabase = createSupabaseBrowserClient();

        const { data, error: fetchError } = await supabase
          .from("mitigation_steps")
          .select("*")
          .eq("risk_category", riskCategory)
          .order("step_order");

        if (fetchError) throw fetchError;

        setSteps((data ?? []) as MitigationStep[]);
      } catch (err) {
        console.error("Error fetching mitigation steps:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch mitigation plan"));
      } finally {
        setLoading(false);
      }
    }

    void fetchSteps();
  }, [riskCategory]);

  return { steps, loading, error };
}

/**
 * Hook to fetch specialist information.
 */
export function useSpecialistTypes(specialistTypeIds?: string[]) {
  const [specialists, setSpecialists] = useState<SpecialistType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchSpecialists() {
      try {
        setLoading(true);
        const supabase = createSupabaseBrowserClient();

        let query = supabase.from("specialist_types").select("*");

        if (specialistTypeIds && specialistTypeIds.length > 0) {
          query = query.in("specialist_type", specialistTypeIds);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        setSpecialists((data ?? []) as SpecialistType[]);
      } catch (err) {
        console.error("Error fetching specialists:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch specialists"));
      } finally {
        setLoading(false);
      }
    }

    void fetchSpecialists();
  }, [specialistTypeIds?.join(",")]);

  return { specialists, loading, error };
}

/**
 * Calculate summary statistics for a mitigation plan.
 */
export function calculateMitigationSummary(
  steps: MitigationStep[],
  specialists: SpecialistType[]
): MitigationPlanSummary {
  const totalCostMin = steps.reduce((sum, step) => sum + (step.cost_min || 0), 0);
  const totalCostMax = steps.reduce((sum, step) => sum + (step.cost_max || 0), 0);
  const totalTimeMin = Math.max(...steps.map((step) => step.timeline_weeks_min || 0));
  const totalTimeMax = Math.max(...steps.map((step) => step.timeline_weeks_max || 0));

  const specialistTypes = [
    ...new Set(
      steps
        .filter((step) => step.specialist_required && step.specialist_type)
        .map((step) => step.specialist_type as string)
    ),
  ];

  const specialistsNeeded = specialists.filter((specialist) =>
    specialistTypes.includes(specialist.specialist_type)
  );

  return {
    totalSteps: steps.length,
    totalCostMin,
    totalCostMax,
    totalTimeMin,
    totalTimeMax,
    specialistsNeeded,
  };
}

/**
 * Format currency in GBP.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format time range.
 */
export function formatTimeRange(weeksMin: number, weeksMax: number): string {
  if (weeksMin === weeksMax) {
    return `${weeksMin} week${weeksMin !== 1 ? "s" : ""}`;
  }
  return `${weeksMin}-${weeksMax} weeks`;
}
