"use client";

import DistributionCard from "./DistributionCard";

type Bucket = {
  label: string;
  value: number;
};

type DashboardChartsClientProps = {
  riskDistribution: Bucket[];
  viabilityDistribution: Bucket[];
};

export default function DashboardChartsClient({
  riskDistribution,
  viabilityDistribution,
}: DashboardChartsClientProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <DistributionCard title="Risk mix" data={riskDistribution} />
      <DistributionCard title="Viability mix" data={viabilityDistribution} />
    </div>
  );
}
