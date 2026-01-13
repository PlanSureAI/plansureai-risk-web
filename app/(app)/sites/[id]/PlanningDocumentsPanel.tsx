"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PlanningDocumentSummaryCard } from "@/app/components/PlanningDocumentSummaryCard";
import { GenerateBrokerPackButton } from "./GenerateBrokerPackButton";
import { createSupabaseBrowserClient } from "@/app/lib/supabaseBrowser";

type UploadState = "idle" | "uploading" | "success" | "error";

type Props = {
  siteId: string;
  userId: string;
  initialDocumentId?: string | null;
  brokers: {
    id: string;
    name: string;
    firm: string | null;
    email: string | null;
  }[];
};

export default function PlanningDocumentsPanel({
  siteId,
  userId,
  initialDocumentId,
  brokers,
}: Props) {
  const [documentId, setDocumentId] = useState(initialDocumentId ?? null);
  const [status, setStatus] = useState<UploadState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [drawingsFocus, setDrawingsFocus] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!jobId) return;
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`document-job-${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "document_jobs",
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          const updated = payload.new as {
            status: string;
            progress: number;
            progress_message: string | null;
            error_message: string | null;
            analysis_status: string | null;
            planning_document_id: string | null;
          };
          setJobStatus(updated.status);
          setProgress(updated.progress ?? 0);
          setProgressMessage(updated.progress_message);
          setErrorMessage(updated.error_message);
          if (updated.status === "completed" && updated.planning_document_id) {
            setDocumentId(updated.planning_document_id);
            const params = new URLSearchParams(searchParams?.toString());
            params.set("planningDocId", updated.planning_document_id);
            router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname);
            setStatus("success");
          }
          if (updated.status === "failed") {
            setStatus("error");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, pathname, router, searchParams]);

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setMessage("Choose a PDF to upload.");
      setStatus("error");
      return;
    }

    setStatus("uploading");
    setMessage(null);
    setJobId(null);
    setJobStatus(null);
    setProgress(0);
    setProgressMessage(null);
    setErrorMessage(null);

    const formData = new FormData();
    formData.set("file", file);
    formData.set("userId", userId);
    formData.set("siteId", siteId);
    if (drawingsFocus) {
      formData.set("focus", "drawings");
    }

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed.");
      }

      const data = (await res.json()) as { jobId: string };
      setJobId(data.jobId);
      setJobStatus("pending");
      setProgress(0);
      setProgressMessage("Queued for processing");
      setMessage("Upload complete. Processing started.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Upload failed.");
    }
  };

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Planning documents
        </p>
        <h2 className="mt-2 text-lg font-semibold text-zinc-900">
          Upload planning documents (PDF, PNG, JPG)
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Drop in a PIP, pre-app, planning letter, or plan sheet and PlanSureAI will
          extract the key planning route, fees, and process steps.
        </p>
      </div>

      <form
        onSubmit={handleUpload}
        className="flex flex-col items-start gap-3 sm:flex-row sm:items-center"
      >
        <label className="inline-flex cursor-pointer items-center rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50">
          Choose file
          <input
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            className="hidden"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <button
          type="submit"
          disabled={status === "uploading"}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
        >
          {status === "uploading" ? "Uploading…" : "Upload & analyse"}
        </button>
        <p className="text-xs text-zinc-500 sm:ml-2">
          PDF or image. Max 10 MB.
        </p>
      </form>
      <label className="flex items-center gap-2 text-xs text-zinc-600">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
          checked={drawingsFocus}
          onChange={(event) => setDrawingsFocus(event.target.checked)}
        />
        Focus on drawings (elevations, heights, materials).
      </label>

      {message && (
        <p
          className={`text-sm ${
            status === "error" ? "text-red-600" : "text-emerald-600"
          }`}
        >
          {message}
        </p>
      )}
      {jobId && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
          <div className="flex items-center gap-3">
            <div className="h-2 w-full rounded-full bg-zinc-200">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <span className="w-12 text-right text-xs">{progress}%</span>
          </div>
          <p className="mt-2 text-xs text-zinc-600">
            {progressMessage ||
              (jobStatus === "pending"
                ? "Queued for processing..."
                : jobStatus === "processing"
                ? "Processing..."
                : jobStatus === "completed"
                ? "Complete."
                : jobStatus === "failed"
                ? "Processing failed."
                : "Waiting...")}
          </p>
          {errorMessage && (
            <p className="mt-2 text-xs text-red-600">{errorMessage}</p>
          )}
        </div>
      )}

      <div className="space-y-3">
        <p className="text-sm font-medium text-zinc-800">Planning summary</p>
        {documentId ? (
          <PlanningDocumentSummaryCard documentId={documentId} siteId={siteId} />
        ) : (
          <p className="text-sm text-zinc-600">
            Upload a planning PDF to generate a summary.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href="#planning-risk"
          className="inline-flex items-center rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
        >
          View planning risk summary
        </a>
        <GenerateBrokerPackButton siteId={siteId} brokers={brokers} />
      </div>
    </section>
  );
}
