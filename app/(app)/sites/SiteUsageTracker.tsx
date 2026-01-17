"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type UserTier = "free" | "starter" | "pro" | "enterprise";

type Props = {
  userId: string;
  currentTier?: UserTier;
  className?: string;
};

const TIER_LIMITS = {
  free: 3,
  starter: 10,
  pro: Infinity,
  enterprise: Infinity,
};

const TIER_NAMES = {
  free: "Explorer",
  starter: "Developer",
  pro: "Expert",
  enterprise: "Enterprise",
};

const TIER_COLORS = {
  free: {
    bg: "bg-zinc-100",
    bar: "bg-zinc-400",
    text: "text-zinc-700",
    ring: "text-zinc-400",
  },
  starter: {
    bg: "bg-blue-50",
    bar: "bg-blue-500",
    text: "text-blue-700",
    ring: "text-blue-500",
  },
  pro: {
    bg: "bg-purple-50",
    bar: "bg-purple-500",
    text: "text-purple-700",
    ring: "text-purple-500",
  },
  enterprise: {
    bg: "bg-amber-50",
    bar: "bg-amber-500",
    text: "text-amber-700",
    ring: "text-amber-500",
  },
};

export function SiteUsageTracker({ userId, currentTier = "free", className = "" }: Props) {
  const [sitesUsed, setSitesUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch(`/api/usage?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setSitesUsed(data.sitesThisMonth || 0);
        }
      } catch (error) {
        console.error("Error fetching usage:", error);
      } finally {
        setLoading(false);
      }
    }

    void fetchUsage();
  }, [userId]);

  const limit = TIER_LIMITS[currentTier];
  const isUnlimited = limit === Infinity;
  const percentage = isUnlimited ? 100 : Math.min((sitesUsed / limit) * 100, 100);
  const isNearingLimit = !isUnlimited && sitesUsed >= limit * 0.8;
  const hasHitLimit = !isUnlimited && sitesUsed >= limit;
  const colors = TIER_COLORS[currentTier];

  if (loading) {
    return (
      <div className={`animate-pulse rounded-lg ${colors.bg} p-4 ${className}`}>
        <div className="h-4 w-32 rounded bg-zinc-200"></div>
        <div className="mt-2 h-2 w-full rounded bg-zinc-200"></div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${colors.bg} p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${colors.ring}`}>
            {getTierIcon(currentTier)}
          </div>
          <div>
            <div className="text-xs font-medium text-zinc-500">Your Plan</div>
            <div className={`text-sm font-semibold ${colors.text}`}>
              {TIER_NAMES[currentTier]}
            </div>
          </div>
        </div>

        {!isUnlimited && (
          <div className="text-right">
            <div className={`text-2xl font-bold ${colors.text}`}>{sitesUsed}</div>
            <div className="text-xs text-zinc-500">of {limit} sites</div>
          </div>
        )}

        {isUnlimited && (
          <div className="text-right">
            <div className={`text-2xl font-bold ${colors.text}`}>{sitesUsed}</div>
            <div className="text-xs text-zinc-500">sites analyzed</div>
          </div>
        )}
      </div>

      {!isUnlimited && (
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/50">
            <div
              className={`h-full transition-all duration-500 ${colors.bar} ${
                hasHitLimit ? "animate-pulse" : ""
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {hasHitLimit && currentTier === "free" && (
        <div className="mt-4 rounded-lg border-2 border-blue-200 bg-blue-50 p-3">
          <div className="flex items-start gap-2">
            <span className="text-xl">🎯</span>
            <div className="flex-1">
              <div className="text-sm font-semibold text-blue-900">
                Site Limit Reached!
              </div>
              <div className="mt-1 text-xs text-blue-700">
                You&apos;ve analyzed all 3 sites on the Explorer plan.
                Upgrade to analyze 7 more sites this month.
              </div>
              <Link
                href="/pricing"
                className="mt-2 inline-block rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Upgrade to Starter - £49/mo
              </Link>
            </div>
          </div>
        </div>
      )}

      {hasHitLimit && currentTier === "starter" && (
        <div className="mt-4 rounded-lg border-2 border-purple-200 bg-purple-50 p-3">
          <div className="flex items-start gap-2">
            <span className="text-xl">⚡</span>
            <div className="flex-1">
              <div className="text-sm font-semibold text-purple-900">
                Monthly Limit Reached
              </div>
              <div className="mt-1 text-xs text-purple-700">
                Upgrade to Pro for unlimited sites + team features
              </div>
              <Link
                href="/pricing"
                className="mt-2 inline-block rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700"
              >
                Upgrade to Pro - £149/mo
              </Link>
            </div>
          </div>
        </div>
      )}

      {isNearingLimit && !hasHitLimit && currentTier === "free" && (
        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-amber-800">
            <span>⚠️</span>
            <span>
              {limit - sitesUsed} site{limit - sitesUsed === 1 ? "" : "s"} remaining this month
            </span>
            <Link href="/pricing" className="ml-auto font-semibold underline">
              Upgrade
            </Link>
          </div>
        </div>
      )}

      {isNearingLimit && !hasHitLimit && currentTier === "starter" && (
        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-amber-800">
            <span>⚠️</span>
            <span>
              {limit - sitesUsed} site{limit - sitesUsed === 1 ? "" : "s"} left this month
            </span>
            <Link href="/pricing" className="ml-auto font-semibold underline">
              Go Unlimited
            </Link>
          </div>
        </div>
      )}

      {isUnlimited && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-white/50 p-2 text-center">
            <div className={`text-lg font-bold ${colors.text}`}>{sitesUsed}</div>
            <div className="text-xs text-zinc-600">Sites</div>
          </div>
          <div className="rounded-lg bg-white/50 p-2 text-center">
            <div className={`text-lg font-bold ${colors.text}`}>
              £{(sitesUsed * 2500).toLocaleString()}
            </div>
            <div className="text-xs text-zinc-600">Saved</div>
          </div>
          <div className="rounded-lg bg-white/50 p-2 text-center">
            <div className={`text-lg font-bold ${colors.text}`}>{sitesUsed * 2}</div>
            <div className="text-xs text-zinc-600">Weeks</div>
          </div>
        </div>
      )}
    </div>
  );
}

function getTierIcon(tier: UserTier) {
  switch (tier) {
    case "free":
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
        </svg>
      );
    case "starter":
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      );
    case "pro":
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    case "enterprise":
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
          <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
        </svg>
      );
  }
}
