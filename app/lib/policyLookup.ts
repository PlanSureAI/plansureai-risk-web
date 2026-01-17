/**
 * Policy Lookup Functions
 * Fetch relevant local plan policies for constraints and planning authorities
 */

import { createSupabaseServerClient } from "./supabaseServer";

export interface LocalPlanPolicy {
  id: string;
  policy_number: string;
  policy_title: string;
  policy_text: string;
  local_planning_authority: string;
  region: string | null;
  policy_type: string;
  constraint_types: string[];
  local_plan_name: string;
  local_plan_year: number | null;
  policy_url: string | null;
  keywords: string[] | null;
}

/**
 * Get policies relevant to specific constraints for a planning authority
 */
export async function getPoliciesForConstraints(
  localPlanningAuthority: string,
  constraints: string[]
): Promise<LocalPlanPolicy[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("local_plan_policies")
    .select("*")
    .eq("local_planning_authority", localPlanningAuthority)
    .overlaps("constraint_types", constraints)
    .order("policy_number");

  if (error) {
    console.error("Error fetching policies:", error);
    return [];
  }

  return data || [];
}

/**
 * Get a specific policy by number and authority
 */
export async function getPolicy(
  localPlanningAuthority: string,
  policyNumber: string
): Promise<LocalPlanPolicy | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("local_plan_policies")
    .select("*")
    .eq("local_planning_authority", localPlanningAuthority)
    .eq("policy_number", policyNumber)
    .single();

  if (error) {
    console.error("Error fetching policy:", error);
    return null;
  }

  return data;
}

/**
 * Get all policies for a planning authority
 */
export async function getAllPolicies(
  localPlanningAuthority: string
): Promise<LocalPlanPolicy[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("local_plan_policies")
    .select("*")
    .eq("local_planning_authority", localPlanningAuthority)
    .order("policy_number");

  if (error) {
    console.error("Error fetching policies:", error);
    return [];
  }

  return data || [];
}

/**
 * Attach policy references to risk factors
 */
export function attachPoliciesToRiskFactors(
  riskFactors: Array<{
    id: string;
    title: string;
    description: string;
    severity: string;
    impact: number;
    mitigation?: string;
    constraint?: string;
  }>,
  policies: LocalPlanPolicy[]
): Array<{
  id: string;
  title: string;
  description: string;
  severity: string;
  impact: number;
  mitigation?: string;
  constraint?: string;
  policy?: {
    number: string;
    title: string;
    text: string;
    plan: string;
    year: number | null;
    url: string | null;
  };
}> {
  return riskFactors.map((risk) => {
    const matchingPolicy = policies.find(
      (policy) => risk.constraint && policy.constraint_types.includes(risk.constraint)
    );

    if (matchingPolicy) {
      return {
        ...risk,
        policy: {
          number: matchingPolicy.policy_number,
          title: matchingPolicy.policy_title,
          text: matchingPolicy.policy_text,
          plan: matchingPolicy.local_plan_name,
          year: matchingPolicy.local_plan_year,
          url: matchingPolicy.policy_url,
        },
      };
    }

    return risk;
  });
}

/**
 * Check if we have deep policy coverage for a planning authority
 */
export async function hasDeepCoverage(
  localPlanningAuthority: string
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  const { count, error } = await supabase
    .from("local_plan_policies")
    .select("*", { count: "exact", head: true })
    .eq("local_planning_authority", localPlanningAuthority);

  if (error) {
    console.error("Error checking coverage:", error);
    return false;
  }

  return (count || 0) >= 5;
}
