"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PlanningDocumentSummaryCard } from "@/app/components/PlanningDocumentSummaryCard";
import { GenerateBrokerPackButton } from "./GenerateBrokerPackButton";

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setMessage("Choose a PDF to upload.");
      setStatus("error");
      return;
    }

    setStatus("uploading");
    setMessage(null);

    const formData = new FormData();
    formData.set("file", file);
    formData.set("userId", userId);
    formData.set("siteId", siteId);

    try {
      const res = await fetch("/api/upload-planning-pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed.");
      }

      const data = (await res.json()) as {
        documentId: string;
        analysisStatus?: "ready" | "error";
      };
      setDocumentId(data.documentId);
      setStatus("success");
      if (data.analysisStatus === "error") {
        setMessage("Upload complete. Analysis is still processing.");
      } else {
        setMessage("Planning document analysed.");
      }

      const params = new URLSearchParams(searchParams?.toString());
      params.set("planningDocId", data.documentId);
      router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname);
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

      {message && (
        <p
          className={`text-sm ${
            status === "error" ? "text-red-600" : "text-emerald-600"
          }`}
        >
          {message}
        </p>
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
