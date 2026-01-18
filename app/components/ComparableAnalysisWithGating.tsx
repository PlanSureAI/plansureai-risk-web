"use client";

import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { ComparableAnalysis, ComparableAnalysisCompact } from "@/app/components/ComparableAnalysis";

type UserTier = "free" | "starter" | "pro" | "enterprise";

type ComparableAnalysisWithGatingProps = {
  riskCategory: string;
  riskSeverity: "low" | "medium" | "high" | "critical";
  councilName?: string;
  constraintType?: string;
  userTier: UserTier;
  hasProfessionalReports?: boolean;
  hasPreAppAdvice?: boolean;
  inConservationArea?: boolean;
  hasListedBuilding?: boolean;
  hasTreeConstraints?: boolean;
  inFloodZone?: boolean;
};

export function ComparableAnalysisWithGating({
  riskCategory,
  riskSeverity,
  councilName,
  constraintType,
  userTier,
  hasProfessionalReports,
  hasPreAppAdvice,
  inConservationArea,
  hasListedBuilding,
  hasTreeConstraints,
  inFloodZone,
}: ComparableAnalysisWithGatingProps) {
  const isHighRisk = riskSeverity === "high" || riskSeverity === "critical";
  const isFreeTier = userTier === "free";

  if (!isHighRisk) {
    return (
      <ComparableAnalysisCompact riskCategory={riskCategory} councilName={councilName} />
    );
  }

  if (isFreeTier) {
    return (
      <div className="mt-4 rounded-lg border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-600">
            <Lock className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="mb-1 font-semibold text-gray-900">
              Unlock Comparable Analysis
            </h4>
            <p className="mb-3 text-sm text-gray-700">
              See approval rates, recent similar approvals, and your approval likelihood.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
            >
              Upgrade to Developer
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ComparableAnalysis
      riskCategory={riskCategory}
      councilName={councilName}
      constraintType={constraintType}
      hasProfessionalReports={hasProfessionalReports}
      hasPreAppAdvice={hasPreAppAdvice}
      inConservationArea={inConservationArea}
      hasListedBuilding={hasListedBuilding}
      hasTreeConstraints={hasTreeConstraints}
      inFloodZone={inFloodZone}
    />
  );
}
