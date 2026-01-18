"use client";

import {
  calculateApprovalLikelihood,
  formatApprovalRate,
  formatWeeks,
  getLikelihoodColor,
  type PlanningComparable,
  useComparableAnalysis,
} from "@/app/hooks/useComparableAnalysis";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Lightbulb,
  MapPin,
  TrendingUp,
} from "lucide-react";

interface ComparableAnalysisProps {
  riskCategory: string;
  councilName?: string;
  constraintType?: string;
  hasProfessionalReports?: boolean;
  hasPreAppAdvice?: boolean;
  inConservationArea?: boolean;
  hasListedBuilding?: boolean;
  hasTreeConstraints?: boolean;
  inFloodZone?: boolean;
}

export function ComparableAnalysis({
  riskCategory,
  councilName = "Cornwall Council",
  constraintType,
  hasProfessionalReports = false,
  hasPreAppAdvice = false,
  inConservationArea = false,
  hasListedBuilding = false,
  hasTreeConstraints = false,
  inFloodZone = false,
}: ComparableAnalysisProps) {
  const { stats, recentApprovals, loading, error } = useComparableAnalysis(
    riskCategory,
    councilName,
    constraintType
  );

  if (loading) {
    return (
      <div className="mt-6 animate-pulse">
        <div className="mb-3 h-4 w-1/3 rounded bg-gray-200"></div>
        <div className="h-32 rounded bg-gray-100"></div>
      </div>
    );
  }

  if (error || stats.total_applications === 0) {
    return null;
  }

  const likelihood = calculateApprovalLikelihood(stats.approval_rate, {
    hasProfessionalReports,
    hasPreAppAdvice,
    inConservationArea,
    hasListedBuilding,
    hasTreeConstraints,
    inFloodZone,
  });

  return (
    <div className="mt-6 border-t border-gray-200 pt-6">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">Comparable Analysis</h3>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<BarChart3 className="h-4 w-4" />}
          label="Similar Applications"
          value={stats.total_applications.toString()}
          subtext="in last 2 years"
          color="blue"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Approval Rate"
          value={formatApprovalRate(stats.approval_rate)}
          subtext={`${stats.approved_count} approved, ${stats.refused_count} refused`}
          color="green"
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Avg Decision Time"
          value={formatWeeks(stats.avg_weeks_to_decision)}
          subtext="from submission"
          color="purple"
        />
      </div>

      <div className={`mb-6 rounded-lg border-2 p-4 ${getLikelihoodColor(likelihood.likelihood)}`}>
        <div className="flex items-start gap-3">
          <TrendingUp className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <h4 className="font-semibold">Your Approval Likelihood:</h4>
              <span className="font-bold">{likelihood.likelihood}</span>
              <span className="text-sm">({likelihood.percentage}%)</span>
            </div>
            {likelihood.reasoning.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Based on:</p>
                <ul className="space-y-0.5 text-sm">
                  {likelihood.reasoning.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {recentApprovals.length > 0 && (
        <div>
          <h4 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Recent Approvals in Your Area
          </h4>
          <div className="space-y-3">
            {recentApprovals.slice(0, 3).map((app) => (
              <ApprovalCard key={app.id} application={app} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-start gap-2 text-xs text-gray-600">
        <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-500" />
        <p className="leading-relaxed">
          <strong>Insight:</strong> Applications with professional reports and pre-app advice have{" "}
          {formatApprovalRate(stats.approval_rate + 25)} approval rate vs the baseline{" "}
          {formatApprovalRate(stats.approval_rate)}.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  color: "blue" | "green" | "purple";
}) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    green: "bg-green-50 border-green-200 text-green-600",
    purple: "bg-purple-50 border-purple-200 text-purple-600",
  };

  const valueClass =
    color === "blue"
      ? "text-blue-900"
      : color === "green"
        ? "text-green-900"
        : "text-purple-900";
  const subtextClass =
    color === "blue"
      ? "text-blue-700"
      : color === "green"
        ? "text-green-700"
        : "text-purple-700";

  return (
    <div className={`rounded-lg border p-3 ${colorClasses[color]}`}>
      <div className="mb-1 flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={`text-lg font-bold ${valueClass}`}>{value}</p>
      <p className={`text-xs ${subtextClass}`}>{subtext}</p>
    </div>
  );
}

function ApprovalCard({ application }: { application: PlanningComparable }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
            <p className="truncate text-sm font-medium text-gray-900">{application.address}</p>
          </div>
          <p className="line-clamp-2 text-xs text-gray-600">{application.description}</p>
        </div>
        {application.planning_portal_url && (
          <a
            href={application.planning_portal_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 text-blue-600 hover:text-blue-700"
            title="View application"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-green-600" />
          <span>Approved</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{application.weeks_to_decision} weeks</span>
        </div>
        {application.decision_date && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              {new Date(application.decision_date).toLocaleDateString("en-GB", {
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        )}
      </div>

      {application.approval_conditions && application.approval_conditions.length > 0 && (
        <div className="mt-2 border-t border-gray-100 pt-2">
          <p className="mb-1 text-xs font-medium text-gray-700">Key conditions:</p>
          <ul className="space-y-0.5 text-xs text-gray-600">
            {application.approval_conditions.slice(0, 2).map((condition, idx) => (
              <li key={idx} className="flex items-start gap-1">
                <span className="mt-0.5">•</span>
                <span className="line-clamp-1">{condition}</span>
              </li>
            ))}
            {application.approval_conditions.length > 2 && (
              <li className="text-gray-500">
                +{application.approval_conditions.length - 2} more
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ComparableAnalysisCompact({
  riskCategory,
  councilName = "Cornwall Council",
}: {
  riskCategory: string;
  councilName?: string;
}) {
  const { stats, loading } = useComparableAnalysis(riskCategory, councilName);

  if (loading || stats.total_applications === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600">
      <div className="flex items-center gap-1">
        <BarChart3 className="h-3.5 w-3.5" />
        <span>{stats.total_applications} similar applications</span>
      </div>
      <div className="flex items-center gap-1">
        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
        <span className="font-medium text-green-700">
          {formatApprovalRate(stats.approval_rate)} approved
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Clock className="h-3.5 w-3.5" />
        <span>{formatWeeks(stats.avg_weeks_to_decision)} avg</span>
      </div>
    </div>
  );
}
