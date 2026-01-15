'use client';

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/app/components/MainLayout';
import { useRouter, useParams } from 'next/navigation';
import { useAuthContext } from '@/app/providers/AuthProvider';
import { RiskScoreCard } from '@/app/components/RiskScoreCard';
import type { RiskAssessment } from '@/app/types';
import { ShareLinkGenerator } from '@/app/components/ShareLinkGenerator';
import { PreAppPackViewer } from '@/app/components/PreAppPackViewer';
import { DocumentUpload } from '@/app/components/DocumentUpload';
import { UploadStatusMonitor } from '@/app/components/UploadStatusMonitor';
import { formatDate, formatCurrency, formatAddress } from '@/app/lib/formatters';
import { apiClient } from '@/app/lib/api-client';
import { LoadingSkeleton } from '@/app/components/LoadingSkeleton';

interface SiteDetail {
  id: string;
  reference: string;
  name: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
  gdv: number;
  units: number;
  risk_score: number;
  risk_factors: string[];
  risk_assessment?: RiskAssessment | null;
  documents_count: number;
  created_at: string;
  updated_at: string;
}

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { session, loading } = useAuthContext();
  const [site, setSite] = useState<SiteDetail | null>(null);
  const [siteLoading, setSiteLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!loading && !session) {
      router.push('/login');
    }
  }, [session, loading, router]);

  useEffect(() => {
    if (session && params.id) {
      fetchSiteDetail();
    }
  }, [session, params.id]);

  const fetchSiteDetail = async () => {
    try {
      const response = await apiClient.get<SiteDetail>(`/api/sites/${params.id}`);
      setSite(response.data ?? null);
    } catch (error) {
      console.error('Failed to fetch site:', error);
    } finally {
      setSiteLoading(false);
    }
  };

  if (siteLoading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <LoadingSkeleton />
        </div>
      </MainLayout>
    );
  }

  if (!site) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">Site not found</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:underline mb-4 inline-flex items-center gap-2"
          >
            ← Back to Sites
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {site.reference}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {formatAddress(site.address)}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-gray-200 dark:border-gray-700 mb-8">
          {['overview', 'documents', 'approvals', 'share'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Site Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">GDV</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(site.gdv)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Units</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {site.units}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Documents</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {site.documents_count}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Added</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(site.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Risk Factors */}
              {site.risk_factors.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold mb-4">Top Risk Factors</h3>
                  <ul className="space-y-2">
                    {site.risk_factors.slice(0, 5).map((factor, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-red-500 mt-1">⚠️</span>
                        <span className="text-gray-900 dark:text-gray-100">{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div>
              <RiskScoreCard assessment={site.risk_assessment ?? null} />
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Upload New Document</h3>
              <DocumentUpload
                siteId={site.id}
                onComplete={(data) => {
                  console.log('Document uploaded:', data);
                  fetchSiteDetail();
                }}
                onError={(error) => {
                  console.error('Upload error:', error);
                }}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Upload History</h3>
              <UploadStatusMonitor
                siteId={site.id}
                onStatusChange={(doc) => {
                  console.log('Document status changed:', doc);
                  if (doc.status === 'processed') {
                    fetchSiteDetail();
                  }
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Nearby Approvals</h3>
            <p className="text-gray-600 dark:text-gray-400">
              View comparable approved applications in this area.
            </p>
          </div>
        )}

        {activeTab === 'share' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Share Analysis</h3>
            <ShareLinkGenerator siteId={site.id} />
          </div>
        )}
      </div>
    </MainLayout>
  );
}
