"use client";

import { useState } from "react";
import { UpdateOutcomesModal } from "./UpdateOutcomesModal";
import type {
  FundingOutcome,
  OutcomesBundle,
  PerformanceOutcome,
  PlanningOutcome,
} from "./outcomesTypes";

type Props = {
  siteId: string;
  initialOutcomes: OutcomesBundle | null;
};

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatPercent = (value?: number | null) => {
  if (value == null) return "";
  return `${value.toFixed(1)}%`;
};

const formatCurrency = (value?: number | null, currency: string = "GBP") => {
  if (value == null) return "";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

const statusColor = (
  label: string,
  _type: "planning" | "funding" | "performance"
) => {
  const normalised = label.toLowerCase();
  if (["approved", "funded", "completed", "sold", "held"].includes(normalised)) {
    return "bg-emerald-100 text-emerald-800";
  }
  if (["refused", "declined"].includes(normalised)) {
    return "bg-red-100 text-red-800";
  }
  if (
    ["in review", "on appeal", "revised terms", "on site", "not started"].includes(
      normalised
    )
  ) {
    return "bg-amber-100 text-amber-800";
  }
  return "bg-zinc-100 text-zinc-600";
};

const statusLabel = (
  status: string | null | undefined,
  type: "planning" | "funding" | "performance"
) => {
  if (!status) return "n/a";
  if (type === "planning") {
    switch (status) {
      case "approved":
        return "approved";
      case "refused":
        return "refused";
      case "pending":
        return "in review";
      case "withdrawn":
        return "withdrawn";
      case "appeal":
        return "on appeal";
      default:
        return status;
    }
  }
  if (type === "funding") {
    switch (status) {
      case "approved":
        return "funded";
      case "declined":
      case "refused":
        return "declined";
      case "terms_changed":
        return "revised terms";
      default:
        return status;
    }
  }
  switch (status) {
    case "not_started":
      return "not started";
    case "on_site":
      return "on site";
    case "completed":
      return "completed";
    case "sold":
      return "sold";
    case "held":
      return "held";
    default:
      return status;
  }
};

function ExpandableText({
  label,
  text,
  status,
  statusType,
  icon,
}: {
  label: string;
  text: string;
  status?: string | null;
  statusType: "planning" | "funding" | "performance";
  icon: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const displayText = text || (status ? "details pending" : "no outcome yet");
  const chipLabel = statusLabel(status, statusType);
  const chipColor = statusColor(chipLabel, statusType);

  return (
    <button
      type="button"
      onClick={() => setExpanded((current) => !current)}
      className="min-w-[200px] max-w-full text-left flex items-center gap-1 cursor-pointer hover:underline md:hover:underline-offset-2"
      title={displayText}
    >
      <span className="font-medium text-zinc-900">
        {icon} {label}:
      </span>{" "}
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mr-1 ${chipColor}`}
      >
        {chipLabel}
      </span>
      <span className={expanded ? "flex-1" : "truncate flex-1"}>
        {displayText}
      </span>
      <span className="shrink-0 text-xs text-zinc-500 md:hidden">
        {expanded ? "▴" : "▾"}
      </span>
    </button>
  );
}

export function OutcomesSection({ siteId, initialOutcomes }: Props) {
  const [planningOutcome, setPlanningOutcome] = useState<PlanningOutcome | null>(
    initialOutcomes?.planning ?? null
  );
  const [fundingOutcome, setFundingOutcome] = useState<FundingOutcome | null>(
    initialOutcomes?.funding ?? null
  );
  const [performanceOutcome, setPerformanceOutcome] = useState<PerformanceOutcome | null>(
    initialOutcomes?.performance ?? null
  );

  const handleSaved = (next: OutcomesBundle) => {
    setPlanningOutcome(next.planning ?? null);
    setFundingOutcome(next.funding ?? null);
    setPerformanceOutcome(next.performance ?? null);
  };

  const planningSummary = planningOutcome
    ? `${planningOutcome.authority_name ? `${planningOutcome.authority_name}` : ""}${
        planningOutcome.decision_date
          ? `${planningOutcome.authority_name ? " on " : "On "}${formatDate(
              planningOutcome.decision_date
            )}`
          : ""
      }`
    : "";

  const fundingSummary = fundingOutcome
    ? `${fundingOutcome.lender_name ? `${fundingOutcome.lender_name}` : ""}${
        fundingOutcome.approved_loan_amount != null
          ? `${fundingOutcome.lender_name ? ", " : ""}${formatCurrency(
              fundingOutcome.approved_loan_amount
            )}`
          : ""
      }${
        fundingOutcome.ltc_percent != null
          ? `${
              fundingOutcome.lender_name || fundingOutcome.approved_loan_amount != null
                ? " @ "
                : "@ "
            }${formatPercent(fundingOutcome.ltc_percent)} LTC`
          : ""
      }${
        fundingOutcome.gdv_ltv_percent != null
          ? `, ${formatPercent(fundingOutcome.gdv_ltv_percent)} GDV LTV`
          : ""
      }`
    : "";

  const performanceSummary = performanceOutcome
    ? `${performanceOutcome.actual_gdv != null
        ? `GDV ${formatCurrency(performanceOutcome.actual_gdv)}`
        : ""
      }${
        performanceOutcome.actual_build_cost != null
          ? `${performanceOutcome.actual_gdv != null ? " • " : ""}Cost ${formatCurrency(
              performanceOutcome.actual_build_cost
            )}`
          : ""
      }${
        performanceOutcome.build_start_date
          ? `${performanceOutcome.actual_gdv != null || performanceOutcome.actual_build_cost != null ? " • " : ""}Started ${formatDate(
              performanceOutcome.build_start_date
            )}`
          : ""
      }${
        performanceOutcome.build_completion_date
          ? ` • Completed ${formatDate(performanceOutcome.build_completion_date)}`
          : ""
      }${
        performanceOutcome.sale_completion_date
          ? ` • Sold ${formatDate(performanceOutcome.sale_completion_date)}`
          : ""
      }`
    : "";

  return (
    <section className="space-y-2">
      <h3 className="hidden text-sm font-medium text-zinc-500 md:block">
        Scheme outcomes
      </h3>
      <div className="flex flex-wrap gap-4 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
        <ExpandableText
          label="Planning"
          icon="P"
          text={planningSummary}
          status={planningOutcome?.decision ?? null}
          statusType="planning"
        />
        <ExpandableText
          label="Funding"
          icon="$"
          text={fundingSummary}
          status={fundingOutcome?.decision ?? null}
          statusType="funding"
        />
        <ExpandableText
          label="Performance"
          icon="^"
          text={performanceSummary}
          status={performanceOutcome?.status ?? null}
          statusType="performance"
        />
      </div>
      <UpdateOutcomesModal
        siteId={siteId}
        initialPlanning={planningOutcome}
        initialFunding={fundingOutcome}
        initialPerformance={performanceOutcome}
        onSaved={handleSaved}
      />
    </section>
  );
}
