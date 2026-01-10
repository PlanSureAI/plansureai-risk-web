"use client";

import DistributionCard from "./DistributionCard";

type Bucket = {
  label: string;
  value: number;
};

type DashboardChartsClientProps = {
  riskDistribution: Bucket[];
  viabilityDistribution: Bucket[];
  riskSummary?: string | null;
  viabilitySummary?: string | null;
};

export default function DashboardChartsClient({
  riskDistribution,
  viabilityDistribution,
  riskSummary,
  viabilitySummary,
}: DashboardChartsClientProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <DistributionCard title="Risk mix" data={riskDistribution} summary={riskSummary} />
      <DistributionCard title="Viability mix" data={viabilityDistribution} summary={viabilitySummary} />
    </div>
  );
}
