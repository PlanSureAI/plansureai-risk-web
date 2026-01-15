"use client";

import { usePortfolioMetrics } from "@/app/hooks/usePortfolioMetrics";
import { useUser } from "@/app/hooks/useUser";

interface HeroMetricProps {
  label: string;
  value: string | number;
  subtitle?: string;
}

function HeroMetric({ label, value, subtitle }: HeroMetricProps) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <p className="text-sm text-gray-600 mb-2">{label}</p>
      <p className="text-3xl font-bold mb-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  );
}

export function PortfolioDashboard() {
  const { user } = useUser();
  const { metrics, sites, loading, error } = usePortfolioMetrics(user?.id || null);

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 font-semibold">Error loading portfolio</p>
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No portfolio data yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HeroMetric label="Total Sites" value={metrics.total_sites} />
        <HeroMetric label="Total Units" value={metrics.total_units} />
        <HeroMetric
          label="Est. GDV"
          value={`£${(metrics.estimated_gdv / 1000000).toFixed(1)}M`}
        />
        <HeroMetric
          label="Avg Risk Score"
          value={metrics.average_risk_score.toFixed(1)}
          subtitle="/100"
        />
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="font-semibold mb-4">Risk Distribution</h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm">Low Risk</span>
              <span className="font-bold ml-auto">{metrics.by_risk_level.low}</span>
            </div>
            <div className="w-full bg-gray-200 rounded h-2">
              <div
                className="bg-green-500 h-2 rounded"
                style={{
                  width: `${(metrics.by_risk_level.low / metrics.total_sites) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-sm">Medium Risk</span>
              <span className="font-bold ml-auto">{metrics.by_risk_level.amber}</span>
            </div>
            <div className="w-full bg-gray-200 rounded h-2">
              <div
                className="bg-amber-500 h-2 rounded"
                style={{
                  width: `${(metrics.by_risk_level.amber / metrics.total_sites) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm">High Risk</span>
              <span className="font-bold ml-auto">{metrics.by_risk_level.red}</span>
            </div>
            <div className="w-full bg-gray-200 rounded h-2">
              <div
                className="bg-red-500 h-2 rounded"
                style={{
                  width: `${(metrics.by_risk_level.red / metrics.total_sites) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold">Your Sites</h3>
        </div>
        <div className="divide-y">
          {sites.map((site) => (
            <div key={site.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
              <div>
                <p className="font-semibold">{site.name}</p>
                <p className="text-sm text-gray-600">{site.location}</p>
              </div>
              <div className="text-right">
                <div
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    site.risk_level === "low"
                      ? "bg-green-100 text-green-800"
                      : site.risk_level === "amber"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {site.risk_level.toUpperCase()} - {site.risk_score}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
