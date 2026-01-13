"use client";

import { useState } from "react";

type Props = {
  siteId: string;
  initialNotes?: string | null;
};

export function LenderStrategySection({ siteId, initialNotes }: Props) {
  const [strategyNotes, setStrategyNotes] = useState(initialNotes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const saveStrategy = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const response = await fetch(`/api/sites/${siteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lender_strategy_notes: strategyNotes }),
      });
      if (response.ok) {
        setStatusMessage("Strategy notes saved.");
      } else {
        const body = await response.json().catch(() => ({}));
        setStatusMessage(body?.error ?? "Failed to save strategy notes.");
      }
    } catch (error) {
      setStatusMessage("Failed to save strategy notes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Lender strategy
          </p>
          <h2 className="mt-1 text-sm font-semibold text-zinc-900">
            Funding ask & approach
          </h2>
        </div>
        <button
          type="button"
          onClick={saveStrategy}
          disabled={isSaving}
          className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save strategy"}
        </button>
      </div>
      <textarea
        className="mt-3 w-full min-h-[140px] rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none"
        placeholder="Add lender strategy notes, funding ask, exit routes, key dependencies..."
        value={strategyNotes}
        onChange={(event) => setStrategyNotes(event.target.value)}
      />
      {statusMessage && (
        <p className="mt-2 text-xs text-zinc-600">{statusMessage}</p>
      )}
    </section>
  );
}
