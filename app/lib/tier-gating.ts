import { createSupabaseServerClient } from "@/app/lib/supabaseServer";
import { createSupabaseBrowserClient } from "@/app/lib/supabaseBrowser";
import type { ReactNode } from "react";
import Link from "next/link";

export type UserTier = "free" | "starter" | "pro" | "enterprise";

export interface TierFeatures {
  tier: UserTier;
  projects_limit: number;
  full_mitigation_plans: boolean;
  full_comparable_analysis: boolean;
  policy_citations: boolean;
  priority_support: boolean;
  api_access: boolean;
}

export async function getUserTier(userId: string): Promise<UserTier> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("user_subscriptions")
    .select("tier")
    .eq("user_id", userId)
    .single();

  return (data?.tier as UserTier) || "free";
}

export async function getUserTierFeatures(userId: string): Promise<TierFeatures | null> {
  const supabase = await createSupabaseServerClient();

  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select("tier")
    .eq("user_id", userId)
    .single();

  if (!subscription) return null;

  const { data: features } = await supabase
    .from("tier_features")
    .select("*")
    .eq("tier", subscription.tier)
    .single();

  return features as TierFeatures | null;
}

export async function canCreateProject(userId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("user_subscriptions")
    .select("projects_limit, projects_used")
    .eq("user_id", userId)
    .single();

  if (!data) return false;

  if (data.projects_limit === -1) return true;

  return data.projects_used < data.projects_limit;
}

export async function hasFeatureAccess(
  userId: string,
  feature: keyof TierFeatures
): Promise<boolean> {
  const features = await getUserTierFeatures(userId);
  if (!features) return false;

  return Boolean(features[feature]);
}

export function useTierGate() {
  const supabase = createSupabaseBrowserClient();

  async function checkFeature(feature: keyof TierFeatures): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("tier")
      .eq("user_id", user.id)
      .single();

    if (!subscription) return false;

    const { data: features } = await supabase
      .from("tier_features")
      .select("*")
      .eq("tier", subscription.tier)
      .single();

    return Boolean(features?.[feature]);
  }

  async function checkProjectLimit(): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from("user_subscriptions")
      .select("projects_limit, projects_used")
      .eq("user_id", user.id)
      .single();

    if (!data) return false;

    if (data.projects_limit === -1) return true;
    return data.projects_used < data.projects_limit;
  }

  async function getTier(): Promise<UserTier> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return "free";

    const { data } = await supabase
      .from("user_subscriptions")
      .select("tier")
      .eq("user_id", user.id)
      .single();

  return (data?.tier as UserTier) || "free";
  }

  return {
    checkFeature,
    checkProjectLimit,
    getTier,
  };
}

export function TierGate({
  requiredTier,
  userTier,
  feature,
  children,
  fallback,
}: {
  requiredTier: UserTier;
  userTier: UserTier;
  feature?: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const tierHierarchy: Record<UserTier, number> = {
    free: 0,
    starter: 1,
    pro: 2,
    enterprise: 3,
  };

  const hasAccess = tierHierarchy[userTier] >= tierHierarchy[requiredTier];

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="rounded-lg border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <h4 className="mb-2 font-semibold text-gray-900">🔒 {requiredTier} Feature</h4>
      <p className="mb-3 text-sm text-gray-700">
        {feature || "This feature"} requires a {requiredTier} plan or higher.
      </p>
      <Link
        href="/pricing"
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Upgrade to {requiredTier}
      </Link>
    </div>
  );
}
