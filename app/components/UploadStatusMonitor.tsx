'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { formatRelativeTime, formatFileSize } from '@/app/lib/formatters';

// Create a client-side instance for real-time subscriptions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DocumentStatus {
  id: string;
  fileName: string;
  fileSize: number;
  status: 'processing' | 'processed' | 'failed';
  riskScore?: number;
  riskFactors?: string[];
  errorMessage?: string;
  createdAt: string;
  processedAt?: string;
}

interface UploadStatusMonitorProps {
  siteId: string;
  onStatusChange?: (doc: DocumentStatus) => void;
}

export function UploadStatusMonitor({
  siteId,
  onStatusChange,
}: UploadStatusMonitorProps) {
  const [documents, setDocuments] = useState<DocumentStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    fetchDocuments();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`documents-site-${siteId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documents', filter: `site_id=eq.${siteId}` },
        (payload) => {
          const record = payload.new as Record<string, any> | null;
          if (!record) return;

          const updatedDoc: DocumentStatus = {
            id: record.id,
            fileName: record.file_name,
            fileSize: record.file_size,
            status: record.status,
            riskScore: record.extracted_info?.riskScore,
            riskFactors: record.risk_factors,
            errorMessage: record.error_message,
            createdAt: record.created_at,
            processedAt: record.processed_at,
          };

          setDocuments((prev) => {
            const existing = prev.findIndex((d) => d.id === record.id);
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = updatedDoc;
              return updated;
            }
            return [updatedDoc, ...prev];
          });

          onStatusChange?.(updatedDoc);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [siteId, onStatusChange]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setDocuments(
        data.map((doc) => ({
          id: doc.id,
          fileName: doc.file_name,
          fileSize: doc.file_size,
          status: doc.status,
          riskScore: doc.extracted_info?.riskScore,
          riskFactors: doc.risk_factors,
          errorMessage: doc.error_message,
          createdAt: doc.created_at,
          processedAt: doc.processed_at,
        }))
      );
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        <p>No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <DocumentStatusCard key={doc.id} document={doc} />
      ))}
    </div>
  );
}

function DocumentStatusCard({ document }: { document: DocumentStatus }) {
  const isProcessing = document.status === 'processing';
  const isProcessed = document.status === 'processed';
  const isFailed = document.status === 'failed';

  return (
    <div
      className={`p-4 rounded-lg border-2 ${
        isProcessing
          ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
          : isProcessed
          ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
          : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {document.fileName}
            </p>
            <StatusBadge status={document.status} />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {formatFileSize(document.fileSize)} •{' '}
            {formatRelativeTime(document.createdAt)}
          </p>
        </div>

        {/* Risk Score (if processed) */}
        {isProcessed && document.riskScore !== undefined && (
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Math.round(document.riskScore)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Risk Score</p>
          </div>
        )}

        {/* Spinner (if processing) */}
        {isProcessing && (
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-300 dark:border-blue-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
          </div>
        )}

        {/* Error Icon (if failed) */}
        {isFailed && (
          <svg
            className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>

      {/* Error Message */}
      {isFailed && document.errorMessage && (
        <p className="text-sm text-red-700 dark:text-red-400 mt-2">
          {document.errorMessage}
        </p>
      )}

      {/* Risk Factors */}
      {isProcessed &&
        document.riskFactors &&
        document.riskFactors.length > 0 && (
          <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Top Risk Factors:
            </p>
            <ul className="space-y-1">
              {document.riskFactors.slice(0, 3).map((factor, idx) => (
                <li
                  key={idx}
                  className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2"
                >
                  <span className="text-red-500 flex-shrink-0">⚠️</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<
    string,
    { bg: string; text: string; icon: string }
  > = {
    processing: {
      bg: 'bg-blue-100 dark:bg-blue-900/50',
      text: 'text-blue-700 dark:text-blue-300',
      icon: '⏳',
    },
    processed: {
      bg: 'bg-green-100 dark:bg-green-900/50',
      text: 'text-green-700 dark:text-green-300',
      icon: '✅',
    },
    failed: {
      bg: 'bg-red-100 dark:bg-red-900/50',
      text: 'text-red-700 dark:text-red-300',
      icon: '❌',
    },
  };

  const style = styles[status] || styles.processing;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
    >
      <span>{style.icon}</span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
