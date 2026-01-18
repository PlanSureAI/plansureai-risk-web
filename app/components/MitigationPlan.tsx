"use client";

import {
  calculateMitigationSummary,
  formatCurrency,
  formatTimeRange,
  type MitigationStep,
  type SpecialistType,
  useMitigationPlan,
  useSpecialistTypes,
} from "@/app/hooks/useMitigationPlan";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  Lightbulb,
  TrendingUp,
  User,
} from "lucide-react";

interface MitigationPlanProps {
  riskCategory: string;
  riskTitle?: string;
  compact?: boolean;
}

export function MitigationPlan({ riskCategory, riskTitle, compact = false }: MitigationPlanProps) {
  const { steps, loading, error } = useMitigationPlan(riskCategory);

  const specialistTypes = [
    ...new Set(steps.filter((step) => step.specialist_type).map((step) => step.specialist_type!)),
  ];

  const { specialists } = useSpecialistTypes(specialistTypes);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="mb-3 h-4 w-1/3 rounded bg-gray-200"></div>
        <div className="h-20 rounded bg-gray-100"></div>
      </div>
    );
  }

  if (error || steps.length === 0) {
    return null;
  }

  const summary = calculateMitigationSummary(steps, specialists);

  if (compact) {
    return <MitigationPlanCompact steps={steps} summary={summary} />;
  }

  return (
    <div className="mt-6 border-t border-gray-200 pt-6">
      <div className="mb-4 flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Mitigation Action Plan{riskTitle ? `: ${riskTitle}` : ""}
        </h3>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="mb-1 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-900">Total Cost</span>
          </div>
          <p className="text-lg font-bold text-blue-900">
            {formatCurrency(summary.totalCostMin)} - {formatCurrency(summary.totalCostMax)}
          </p>
        </div>

        <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
          <div className="mb-1 flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-900">Timeline</span>
          </div>
          <p className="text-lg font-bold text-purple-900">
            {formatTimeRange(summary.totalTimeMin, summary.totalTimeMax)}
          </p>
        </div>

        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
          <div className="mb-1 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-900">Steps</span>
          </div>
          <p className="text-lg font-bold text-green-900">
            {summary.totalSteps} action{summary.totalSteps !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <MitigationStepCard
            key={step.id}
            step={step}
            stepNumber={index + 1}
            specialists={specialists}
          />
        ))}
      </div>

      {summary.specialistsNeeded.length > 0 && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <User className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div className="flex-1">
              <h4 className="mb-2 text-sm font-semibold text-amber-900">
                Specialists Required
              </h4>
              <div className="space-y-2">
                {summary.specialistsNeeded.map((specialist) => (
                  <div key={specialist.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-900">
                        {specialist.display_name}
                      </p>
                      <p className="text-xs text-amber-700">{specialist.typical_cost_range}</p>
                    </div>
                    {specialist.directory_url && (
                      <a
                        href={specialist.directory_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-900"
                      >
                        Find consultant
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-start gap-2 text-xs text-gray-600">
        <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-500" />
        <p className="leading-relaxed">
          <strong>Pro tip:</strong> Following this plan increases your approval chances
          significantly. Each step addresses a specific concern that could otherwise lead to
          refusal.
        </p>
      </div>
    </div>
  );
}

function MitigationStepCard({
  step,
  stepNumber,
  specialists,
}: {
  step: MitigationStep;
  stepNumber: number;
  specialists: SpecialistType[];
}) {
  const specialist = specialists.find((entry) => entry.specialist_type === step.specialist_type);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
          {stepNumber}
        </div>
        <div className="flex-1">
          <h4 className="mb-1 font-semibold text-gray-900">{step.step_name}</h4>
          <p className="text-sm leading-relaxed text-gray-600">{step.step_description}</p>
        </div>
      </div>

      <div className="ml-11 space-y-2">
        {(step.cost_min !== null || step.cost_max !== null) && (
          <div className="flex items-start gap-2 text-sm">
            <DollarSign className="mt-0.5 h-4 w-4 text-gray-400" />
            <div>
              <span className="font-medium text-gray-700">Cost: </span>
              <span className="text-gray-600">
                {step.cost_min === 0 && step.cost_max === 0
                  ? "Free"
                  : `${formatCurrency(step.cost_min || 0)} - ${formatCurrency(step.cost_max || 0)}`}
              </span>
              {step.cost_notes && (
                <span className="ml-1 text-xs text-gray-500">({step.cost_notes})</span>
              )}
            </div>
          </div>
        )}

        {(step.timeline_weeks_min !== null || step.timeline_weeks_max !== null) && (
          <div className="flex items-start gap-2 text-sm">
            <Clock className="mt-0.5 h-4 w-4 text-gray-400" />
            <div>
              <span className="font-medium text-gray-700">Timeline: </span>
              <span className="text-gray-600">
                {step.timeline_weeks_min === 0 && step.timeline_weeks_max === 0
                  ? "Immediate"
                  : formatTimeRange(step.timeline_weeks_min || 0, step.timeline_weeks_max || 0)}
              </span>
              {step.timeline_notes && (
                <span className="ml-1 text-xs text-gray-500">({step.timeline_notes})</span>
              )}
            </div>
          </div>
        )}

        {step.specialist_required && specialist && (
          <div className="flex items-start gap-2 text-sm">
            <User className="mt-0.5 h-4 w-4 text-gray-400" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-gray-700">Specialist: </span>
              <span className="text-gray-600">{specialist.display_name}</span>
              {specialist.directory_url && (
                <a
                  href={specialist.directory_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700"
                >
                  Find one
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {step.rationale && (
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 text-gray-400" />
            <div>
              <span className="font-medium text-gray-700">Why: </span>
              <span className="text-gray-600">{step.rationale}</span>
            </div>
          </div>
        )}

        {step.success_impact && (
          <div className="mt-2 rounded border border-green-200 bg-green-50 p-2 text-xs">
            <div className="flex items-start gap-2">
              <TrendingUp className="mt-0.5 h-3.5 w-3.5 text-green-600" />
              <span className="font-medium text-green-800">{step.success_impact}</span>
            </div>
          </div>
        )}

        {step.guidance_url && (
          <div className="mt-2">
            <a
              href={step.guidance_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <FileText className="h-3 w-3" />
              Read official guidance
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function MitigationPlanCompact({
  steps,
  summary,
}: {
  steps: MitigationStep[];
  summary: ReturnType<typeof calculateMitigationSummary>;
}) {
  return (
    <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-sm font-semibold text-green-900">
            {summary.totalSteps}-Step Mitigation Plan Available
          </span>
        </div>
        <button className="text-xs font-medium text-green-700 hover:text-green-900">
          View plan →
        </button>
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-green-800">
        <span>
          💰 {formatCurrency(summary.totalCostMin)}-{formatCurrency(summary.totalCostMax)}
        </span>
        <span>⏱️ {formatTimeRange(summary.totalTimeMin, summary.totalTimeMax)}</span>
        {summary.specialistsNeeded.length > 0 && (
          <span>
            👥 {summary.specialistsNeeded.length} specialist
            {summary.specialistsNeeded.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}
