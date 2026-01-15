"use client";

import { RiskAssessment } from "@/app/types";
import { cn } from "@/app/lib/utils";

interface RiskScoreCardProps {
  assessment?: RiskAssessment | null;
  loading?: boolean;
}

export function RiskScoreCard({ assessment, loading }: RiskScoreCardProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      case "amber":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "red":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case "low":
        return "bg-green-100 text-green-800";
      case "amber":
        return "bg-amber-100 text-amber-800";
      case "red":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading || !assessment) {
    return (
      <div className="animate-pulse">
        <div className="h-48 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border rounded-lg p-6 transition-all",
        getRiskColor(assessment.risk_level)
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Planning Risk Score</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold">
              {assessment.overall_score}
            </span>
            <span className="text-gray-500">/100</span>
          </div>
        </div>

        <div className="text-right">
          <div
            className={cn(
              "inline-block px-4 py-2 rounded-full font-semibold text-sm",
              getRiskBadgeColor(assessment.risk_level)
            )}
          >
            {assessment.risk_level.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-semibold mb-3">Top Risks</h4>
        <div className="space-y-3">
          {assessment.top_risks.slice(0, 3).map((risk, idx) => (
            <div
              key={idx}
              className="flex gap-3 p-3 bg-white bg-opacity-50 rounded"
            >
              <div>
                <p className="font-medium text-sm">{risk.category}</p>
                <p className="text-sm text-gray-700">{risk.description}</p>
              </div>
              <span
                className={cn(
                  "flex-shrink-0 px-2 py-1 rounded text-xs font-semibold",
                  risk.severity === "high"
                    ? "bg-red-100 text-red-700"
                    : risk.severity === "medium"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700"
                )}
              >
                {risk.severity}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-current border-opacity-20">
        <div>
          <p className="text-sm opacity-75">Est. Timeline</p>
          <p className="font-semibold">{assessment.timeline_estimate} weeks</p>
        </div>
        <div>
          <p className="text-sm opacity-75">Policy Status</p>
          <p className="font-semibold">
            {assessment.compliance_notes.split(" ")[0]}
          </p>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <button className="flex-1 px-4 py-2 bg-current text-white rounded font-medium hover:opacity-90 transition">
          View Full Analysis
        </button>
      </div>
    </div>
  );
}
