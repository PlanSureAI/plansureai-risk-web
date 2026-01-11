"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PlanningDocumentSummaryCard } from "@/app/components/PlanningDocumentSummaryCard";
import { GenerateBrokerPackButton } from "./GenerateBrokerPackButton";

type UploadState = "idle" | "uploading" | "success" | "error";
type CompareState = "idle" | "loading" | "ready" | "error";
const MAX_COMPARE = 3;

type PlanningDocItem = {
  id: string;
  title: string;
  routeLabel: string | null;
  createdAt: string | null;
};

type CompareResponse = {
  documents: {
    documentId: string;
    title: string | null;
    routeLabel: string | null;
    siteAddress: string | null;
    proposalSummary: string | null;
    phaseOneFeeSummary: string | null;
  }[];
  comparison_rows: { label: string; values: (string | null)[] }[];
};

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
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareState, setCompareState] = useState<CompareState>("idle");
  const [docs, setDocs] = useState<PlanningDocItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareData, setCompareData] = useState<CompareResponse | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const canCompare = useMemo(() => selectedIds.length >= 2, [selectedIds]);
  const disableNewSelections = useMemo(
    () => selectedIds.length >= MAX_COMPARE,
    [selectedIds]
  );

  useEffect(() => {
    if (!compareOpen) return;
    let cancelled = false;

    async function loadDocs() {
      try {
        const res = await fetch(`/api/planning-documents?siteId=${siteId}`);
        if (!res.ok) return;
        const data = (await res.json()) as { documents: PlanningDocItem[] };
        if (!cancelled) {
          setDocs(data.documents ?? []);
        }
      } catch {
        if (!cancelled) setDocs([]);
      }
    }

    loadDocs();
    return () => {
      cancelled = true;
    };
  }, [compareOpen, siteId]);

  const handleCompare = async () => {
    if (!canCompare) return;
    setCompareState("loading");
    setCompareData(null);
    try {
      const ids = encodeURIComponent(selectedIds.join(","));
      const res = await fetch(
        `/api/planning-documents/compare?siteId=${siteId}&documentIds=${ids}`
      );
      if (!res.ok) {
        throw new Error("Compare failed");
      }
      const data = (await res.json()) as CompareResponse;
      setCompareData(data);
      setCompareState("ready");
    } catch {
      setCompareState("error");
    }
  };

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
          Upload planning documents (PDF)
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Drop in a PIP, pre-app, or planning letter and PlanSureAI will extract
          the key planning route, fees, and process steps.
        </p>
      </div>

      <form
        onSubmit={handleUpload}
        className="flex flex-col items-start gap-3 sm:flex-row sm:items-center"
      >
        <label className="inline-flex cursor-pointer items-center rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50">
          Choose PDF
          <input
            type="file"
            accept="application/pdf"
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
          PDF only. Max 10 MB.
        </p>
      </form>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCompareOpen(true)}
          className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
        >
          Compare planning docs
        </button>
      </div>

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

      {compareOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-3xl rounded-xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Compare planning docs
                </p>
                <h3 className="text-lg font-semibold text-zinc-900">
                  Select documents to compare
                </h3>
              </div>
              <button
                type="button"
                className="text-sm font-semibold text-zinc-500 hover:text-zinc-800"
                onClick={() => {
                  setCompareOpen(false);
                  setCompareState("idle");
                  setCompareData(null);
                }}
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {docs.length === 0 && (
                <p className="text-sm text-zinc-600">
                  No planning documents uploaded yet.
                </p>
              )}
              {docs.map((doc) => (
                <label
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={selectedIds.includes(doc.id)}
                      disabled={
                        disableNewSelections && !selectedIds.includes(doc.id)
                      }
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedIds((prev) => {
                            if (prev.length >= MAX_COMPARE) return prev;
                            return [...prev, doc.id];
                          });
                        } else {
                          setSelectedIds((prev) =>
                            prev.filter((id) => id !== doc.id)
                          );
                        }
                      }}
                    />
                    <div>
                      <p className="font-medium text-zinc-900">{doc.title}</p>
                      <p className="text-xs text-zinc-500">
                        {doc.routeLabel ?? "Route unknown"} ·{" "}
                        {doc.createdAt
                          ? new Date(doc.createdAt).toLocaleDateString()
                          : "Date unknown"}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={!canCompare || compareState === "loading"}
                onClick={handleCompare}
                className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {compareState === "loading" ? "Comparing…" : "Compare"}
              </button>
              {!canCompare && (
                <p className="text-xs text-zinc-500">
                  Select at least two documents.
                </p>
              )}
              {disableNewSelections && (
                <p className="text-xs text-zinc-500">
                  You can compare up to {MAX_COMPARE} documents.
                </p>
              )}
              {compareState === "error" && (
                <p className="text-xs text-red-600">
                  Compare failed. Please try again.
                </p>
              )}
            </div>

            {compareState === "ready" && compareData && (
              <div className="mt-5 space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  {compareData.documents.map((doc) => (
                    <div
                      key={doc.documentId}
                      className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm"
                    >
                      <p className="font-semibold text-zinc-900">
                        {doc.title ?? "Planning document"}
                      </p>
                      <p className="text-xs text-zinc-600">
                        {doc.routeLabel ?? "Route unknown"}
                      </p>
                      {doc.proposalSummary && (
                        <p className="mt-2 text-xs text-zinc-700">
                          {doc.proposalSummary}
                        </p>
                      )}
                      {doc.phaseOneFeeSummary && (
                        <p className="mt-1 text-xs text-zinc-700">
                          {doc.phaseOneFeeSummary}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="overflow-x-auto rounded-lg border border-zinc-200">
                  <table className="min-w-full text-xs">
                    <thead className="bg-zinc-50 text-zinc-600">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">Aspect</th>
                        {compareData.documents.map((doc) => (
                          <th
                            key={doc.documentId}
                            className="px-3 py-2 text-left font-semibold"
                          >
                            {doc.routeLabel ?? "Document"}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {compareData.comparison_rows.map((row) => (
                        <tr key={row.label}>
                          <td className="px-3 py-2 text-zinc-700">{row.label}</td>
                          {row.values.map((value, idx) => (
                            <td key={`${row.label}-${idx}`} className="px-3 py-2">
                              {value ?? "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
