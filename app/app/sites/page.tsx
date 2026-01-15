'use client';

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/app/components/MainLayout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/providers/AuthProvider';
import { formatDate, formatCurrency } from '@/app/lib/formatters';
import { apiClient } from '@/app/lib/api-client';

interface Site {
  id: string;
  name: string;
  reference: string;
  location: string;
  gdv: number;
  units: number;
  risk_score: number;
  created_at: string;
}

export default function SitesPage() {
  const router = useRouter();
  const { session, loading } = useAuthContext();
  const [sites, setSites] = useState<Site[]>([]);
  const [sitesLoading, setSitesLoading] = useState(true);

  useEffect(() => {
    if (!loading && !session) {
      router.push('/login');
    }
  }, [session, loading, router]);

  useEffect(() => {
    if (session) {
      fetchSites();
    }
  }, [session]);

  const fetchSites = async () => {
    try {
      const response = await apiClient.get<Site[]>('/api/portfolio/sites');
      if (response.data) {
        setSites(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch sites:', error);
    } finally {
      setSitesLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header with Add Button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sites</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your property development sites
            </p>
          </div>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Add New Site
          </button>
        </div>

        {/* Sites Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold">Reference</th>
                <th className="text-left px-6 py-4 text-sm font-semibold">Location</th>
                <th className="text-left px-6 py-4 text-sm font-semibold">Units</th>
                <th className="text-left px-6 py-4 text-sm font-semibold">GDV</th>
                <th className="text-left px-6 py-4 text-sm font-semibold">Risk Score</th>
                <th className="text-left px-6 py-4 text-sm font-semibold">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sites.map((site) => (
                <tr
                  key={site.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link href={`/sites/${site.id}`} className="text-blue-600 hover:underline font-medium">
                      {site.reference}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-900 dark:text-gray-100">{site.location}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-gray-100">{site.units}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-gray-100">
                    {formatCurrency(site.gdv)}
                  </td>
                  <td className="px-6 py-4">
                    <RiskBadge score={site.risk_score} />
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                    {formatDate(site.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sites.length === 0 && !sitesLoading && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No sites yet. Create your first site to get started.
            </p>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Add Your First Site
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function RiskBadge({ score }: { score: number }) {
  if (score < 33) {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium">
        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
        Low ({Math.round(score)})
      </span>
    );
  }
  if (score < 67) {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-medium">
        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
        Medium ({Math.round(score)})
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium">
      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
      High ({Math.round(score)})
    </span>
  );
}
