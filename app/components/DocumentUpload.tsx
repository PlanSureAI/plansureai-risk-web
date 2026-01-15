'use client';

import React, { useRef, useState } from 'react';
import { useDocumentUpload } from '@/app/hooks/useDocumentUpload';
import { formatFileSize } from '@/app/lib/formatters';

interface DocumentUploadProps {
  siteId?: string;
  onComplete?: (data: any) => void;
  onError?: (error: any) => void;
}

export function DocumentUpload({
  siteId,
  onComplete,
  onError,
}: DocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { upload, loading, progress, error, cancel, reset } = useDocumentUpload();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    
    if (!siteId) {
      const err = {
        code: 'NO_SITE',
        message: 'Please select a site first',
      };
      onError?.(err);
      return;
    }

    try {
      const result = await upload(file, siteId);
      onComplete?.(result);
      
      setTimeout(() => {
        setSelectedFile(null);
        reset();
      }, 2000);
    } catch (err) {
      onError?.(err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleRetry = () => {
    if (selectedFile) {
      reset();
      handleFileSelect(selectedFile);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold mb-4">Upload Document</h3>

      {/* Success State */}
      {!loading && !error && progress?.percent === 100 && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-medium">{selectedFile?.name}</p>
              <p className="text-sm">
                Successfully uploaded and queued for processing
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {getErrorTitle(error.code)}
              </p>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                {error.message}
              </p>
            </div>
            {error.code !== 'UPLOAD_CANCELLED' && (
              <button
                onClick={handleRetry}
                className="text-red-600 dark:text-red-400 hover:underline whitespace-nowrap text-sm font-medium"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {!loading && !progress ? (
          <>
            <svg
              className="w-12 h-12 mx-auto mb-3 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <p className="text-gray-900 dark:text-gray-100 font-medium">
              Drag and drop your PDF here
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              or click to browse (max 10MB)
            </p>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-gray-900 dark:text-gray-100 font-medium">
                {selectedFile?.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {formatFileSize(selectedFile?.size || 0)}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {loading && !progress ? 'Preparing...' : 'Uploading...'}
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {progress?.percent || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                  style={{ width: `${progress?.percent || 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {progress ? formatFileSize(progress.loaded) : '0 B'} /{' '}
                {formatFileSize(progress?.total || 0)}
              </p>
            </div>

            {/* Cancel Button */}
            <button
              onClick={cancel}
              className="text-sm text-red-600 dark:text-red-400 hover:underline font-medium"
            >
              Cancel Upload
            </button>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleInputChange}
          className="hidden"
          disabled={loading}
        />
      </div>

      {/* Click to Browse */}
      {!loading && !progress && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Choose File
        </button>
      )}

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-400">
          💡 <strong>Tip:</strong> After upload, your document will be analyzed by AI
          to extract planning risks and generate a risk score.
        </p>
      </div>
    </div>
  );
}

function getErrorTitle(code: string): string {
  const titles: Record<string, string> = {
    VALIDATION_ERROR: 'Invalid File',
    FILE_TOO_LARGE: 'File Too Large',
    FILE_TOO_SMALL: 'File Too Small',
    NETWORK_ERROR: 'Network Error',
    API_ERROR: 'Upload Failed',
    UPLOAD_CANCELLED: 'Upload Cancelled',
    NO_SITE: 'No Site Selected',
    UNKNOWN_ERROR: 'Upload Error',
  };
  return titles[code] || 'Error';
}
