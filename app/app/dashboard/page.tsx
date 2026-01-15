'use client';

import React, { useEffect } from 'react';
import { MainLayout } from '@/app/components/MainLayout';
import { RiskScoreCard } from '@/app/components/RiskScoreCard';
import { PortfolioDashboard } from '@/app/components/PortfolioDashboard';
import { DocumentUpload } from '@/app/components/DocumentUpload';
import { LoadingSkeleton } from '@/app/components/LoadingSkeleton';
import { usePortfolioMetrics } from '@/app/hooks/usePortfolioMetrics';
import { useUser } from '@/app/hooks/useUser';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { metrics, sites, loading: metricsLoading } = usePortfolioMetrics(user?.id || null);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  if (userLoading || metricsLoading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <LoadingSkeleton />
        </div>
      </MainLayout>
    );
  }

  const primarySite = sites[0] ?? null;
  const assessment = primarySite?.risk_assessment ?? null;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Here's your planning risk overview.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {primarySite ? (
            <DocumentUpload siteId={primarySite.id} />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-sm text-gray-500">
              Add a site to upload planning documents.
            </div>
          )}
          {assessment ? (
            <RiskScoreCard assessment={assessment} />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-sm text-gray-500">
              Generate a risk assessment to see scores here.
            </div>
          )}
        </div>

        {/* Portfolio Overview */}
        <PortfolioDashboard />

        {/* Quick Stats */}
        {metrics && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard title="Total Sites" value={metrics.total_sites} icon="📍" />
            <StatCard
              title="Average Risk"
              value={`${metrics.average_risk_score.toFixed(0)}%`}
              icon="⚠️"
            />
            <StatCard
              title="Total GDV"
              value={`£${(metrics.estimated_gdv / 1000000).toFixed(1)}M`}
              icon="💰"
            />
            <StatCard title="This Month" value="3 new" icon="📈" />
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
