"use client";

import { useEffect, useState } from "react";

type SummaryView = {
  title: string | null;
  bullets: string[];
};

type ProcessView = {
  stage: string | null;
  steps: string[];
};

type FeesView = {
  planningAuthorityFee: {
    amount: number | null;
    currency: "GBP";
    payer: string | null;
    description: string | null;
  };
  agentFee: {
    amount: number | null;
    currency: "GBP";
    vatExcluded: boolean;
    description: string | null;
  };
};

interface PlanningDocumentSummaryCardProps {
  documentId: string;
}

export function PlanningDocumentSummaryCard({
  documentId,
}: PlanningDocumentSummaryCardProps) {
  const [summary, setSummary] = useState<SummaryView | null>(null);
  const [processView, setProcessView] = useState<ProcessView | null>(null);
  const [feesView, setFeesView] = useState<FeesView | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "process" | "fees">(
    "summary"
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchSummary() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/planning-documents/${documentId}/view?viewType=summary`
        );
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as SummaryView;
        if (!cancelled) {
          setSummary(data);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchSummary();

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  async function loadProcess() {
    if (processView) return;
    const response = await fetch(
      `/api/planning-documents/${documentId}/view?viewType=process`
    );
    if (!response.ok) return;
    const data = (await response.json()) as ProcessView;
    setProcessView(data);
  }

  async function loadFees() {
    if (feesView) return;
    const response = await fetch(
      `/api/planning-documents/${documentId}/view?viewType=fees`
    );
    if (!response.ok) return;
    const data = (await response.json()) as FeesView;
    setFeesView(data);
  }

  function handleTabChange(tab: "summary" | "process" | "fees") {
    setActiveTab(tab);
    if (tab === "process") void loadProcess();
    if (tab === "fees") void loadFees();
  }

  if (loading && !summary) {
    return (
      <div className="rounded-lg border p-4">
        <p className="text-sm text-gray-500">Loading planning summary...</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="rounded-lg border p-4">
        <p className="text-sm text-gray-500">No planning summary available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div>
        <h2 className="text-lg font-semibold">
          {summary.title ?? "Planning document"}
        </h2>
      </div>

      <div className="space-y-1">
        {summary.bullets.map((line) => (
          <p key={line} className="text-sm text-gray-800">
            {line}
          </p>
        ))}
      </div>

      <div className="flex gap-2 border-t pt-3">
        <button
          type="button"
          onClick={() => handleTabChange("summary")}
          className={`rounded border px-2 py-1 text-xs ${
            activeTab === "summary" ? "bg-gray-900 text-white" : "bg-white"
          }`}
        >
          Summary
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("process")}
          className={`rounded border px-2 py-1 text-xs ${
            activeTab === "process" ? "bg-gray-900 text-white" : "bg-white"
          }`}
        >
          Process & steps
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("fees")}
          className={`rounded border px-2 py-1 text-xs ${
            activeTab === "fees" ? "bg-gray-900 text-white" : "bg-white"
          }`}
        >
          Fees
        </button>
      </div>

      {activeTab === "process" && processView && (
        <div className="space-y-2 text-sm">
          {processView.stage && <p className="font-medium">{processView.stage}</p>}
          <ul className="ml-4 list-disc space-y-1">
            {processView.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === "fees" && feesView && (
        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <div className="rounded border p-2">
            <p className="font-medium">Planning authority</p>
            {feesView.planningAuthorityFee.amount != null && (
              <p>
                £{feesView.planningAuthorityFee.amount}{" "}
                <span className="text-xs text-gray-500">
                  ({feesView.planningAuthorityFee.currency})
                </span>
              </p>
            )}
            {feesView.planningAuthorityFee.payer && (
              <p className="text-xs text-gray-600">
                Payer: {feesView.planningAuthorityFee.payer}
              </p>
            )}
            {feesView.planningAuthorityFee.description && (
              <p className="text-xs text-gray-600">
                {feesView.planningAuthorityFee.description}
              </p>
            )}
          </div>
          <div className="rounded border p-2">
            <p className="font-medium">Planning agent</p>
            {feesView.agentFee.amount != null && (
              <p>
                £{feesView.agentFee.amount}{" "}
                <span className="text-xs text-gray-500">
                  ({feesView.agentFee.currency})
                </span>
              </p>
            )}
            <p className="text-xs text-gray-600">
              VAT: {feesView.agentFee.vatExcluded ? "excluded" : "included"}
            </p>
            {feesView.agentFee.description && (
              <p className="text-xs text-gray-600">{feesView.agentFee.description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
