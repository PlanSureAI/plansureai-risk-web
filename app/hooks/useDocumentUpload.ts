'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/app/lib/api-client';

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export interface UploadError {
  code: string;
  message: string;
  statusCode?: number;
}

interface UseDocumentUploadReturn {
  upload: (file: File, siteId: string) => Promise<any>;
  loading: boolean;
  progress: UploadProgress | null;
  error: UploadError | null;
  cancel: () => void;
  reset: () => void;
}

export function useDocumentUpload(): UseDocumentUploadReturn {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<UploadError | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const reset = useCallback(() => {
    setLoading(false);
    setProgress(null);
    setError(null);
    setAbortController(null);
  }, []);

  const cancel = useCallback(() => {
    if (abortController) {
      abortController.abort();
      reset();
    }
  }, [abortController, reset]);

  const upload = useCallback(
    async (file: File, siteId: string) => {
      setError(null);
      setProgress(null);
      setLoading(true);

      const validation = validateFile(file);
      if (!validation.valid) {
        const err: UploadError = {
          code: 'VALIDATION_ERROR',
          message: validation.error!,
        };
        setError(err);
        setLoading(false);
        throw err;
      }

      const controller = new AbortController();
      setAbortController(controller);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('siteId', siteId);

        const response = await uploadWithProgress(
          formData,
          controller,
          (newProgress) => {
            setProgress(newProgress);
          }
        );

        setLoading(false);
        setProgress({ loaded: file.size, total: file.size, percent: 100 });
        setAbortController(null);

        return {
          documentId: response.documentId,
          fileName: file.name,
          fileSize: file.size,
          status: 'processing',
          message: response.message,
        };
      } catch (err: any) {
        setLoading(false);
        setAbortController(null);

        let uploadError: UploadError;

        if (err.name === 'AbortError') {
          uploadError = {
            code: 'UPLOAD_CANCELLED',
            message: 'Upload cancelled',
          };
        } else if (err.response) {
          uploadError = {
            code: err.response.status === 413 ? 'FILE_TOO_LARGE' : 'API_ERROR',
            message: err.response.data?.error || 'Upload failed',
            statusCode: err.response.status,
          };
        } else if (err.message === 'Network error') {
          uploadError = {
            code: 'NETWORK_ERROR',
            message: 'Network error. Check your connection.',
          };
        } else {
          uploadError = {
            code: 'UNKNOWN_ERROR',
            message: err.message || 'An unexpected error occurred',
          };
        }

        setError(uploadError);
        throw uploadError;
      }
    },
    []
  );

  return {
    upload,
    loading,
    progress,
    error,
    cancel,
    reset,
  };
}

function validateFile(
  file: File
): { valid: boolean; error?: string } {
  if (!file.type.includes('pdf')) {
    return {
      valid: false,
      error: 'Only PDF files are supported',
    };
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File is too large. Maximum size is 10MB, your file is ${(file.size / 1024 / 1024).toFixed(1)}MB`,
    };
  }

  const MIN_FILE_SIZE = 100 * 1024;
  if (file.size < MIN_FILE_SIZE) {
    return {
      valid: false,
      error: 'File is too small. Please upload a document with at least some content',
    };
  }

  return { valid: true };
}

async function uploadWithProgress(
  formData: FormData,
  controller: AbortController,
  onProgress: (progress: UploadProgress) => void
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress({
          loaded: e.loaded,
          total: e.total,
          percent,
        });
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
          reject(new Error('Invalid response format'));
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          const error = new Error(errorData.error || 'Upload failed');
          (error as any).response = {
            status: xhr.status,
            data: errorData,
          };
          reject(error);
        } catch (e) {
          const error = new Error(`Upload failed with status ${xhr.status}`);
          (error as any).response = { status: xhr.status, data: {} };
          reject(error);
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error'));
    });

    xhr.addEventListener('abort', () => {
      reject(new DOMException('Upload cancelled', 'AbortError'));
    });

    xhr.timeout = 300000;
    xhr.addEventListener('timeout', () => {
      reject(new Error('Upload timeout'));
    });

    controller.signal.addEventListener('abort', () => {
      xhr.abort();
    });

    xhr.open('POST', '/api/documents/upload');
    xhr.send(formData);
  });
}
