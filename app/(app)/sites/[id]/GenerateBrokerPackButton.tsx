"use client";

import { useState, useTransition } from "react";
import { generateBrokerPackAction } from "./actions";

type Broker = {
  id: string;
  name: string;
  firm: string | null;
  email: string | null;
};

export function GenerateBrokerPackButton({
  siteId,
  brokers,
}: {
  siteId: string;
  brokers: Broker[];
}) {
  const [selectedBroker, setSelectedBroker] = useState<string>(brokers[0]?.id ?? "");
  const [headlineAsk, setHeadlineAsk] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-900">Generate broker pack</p>
          <p className="text-xs text-zinc-600">
            Builds PDF + CSV from the latest risk snapshot and uploads to Supabase Storage.
          </p>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <select
            className="rounded border border-zinc-200 bg-white px-2 py-1 text-sm"
            value={selectedBroker}
            onChange={(e) => setSelectedBroker(e.target.value)}
          >
            <option value="">No broker selected</option>
            {brokers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.firm ? `– ${b.firm}` : ""}
              </option>
            ))}
          </select>
          <input
            className="rounded border border-zinc-200 px-2 py-1 text-sm"
            placeholder="Headline ask (optional)"
            value={headlineAsk}
            onChange={(e) => setHeadlineAsk(e.target.value)}
          />
          <button
            className="inline-flex items-center justify-center rounded bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                setMessage(null);
                const fd = new FormData();
                fd.append("id", siteId);
                if (selectedBroker) fd.append("broker_id", selectedBroker);
                if (headlineAsk) fd.append("headline_ask", headlineAsk);
                const res = await generateBrokerPackAction(fd);
                setMessage(`Pack v${res.packVersion} ready`);
                if (res.pdfUrl) {
                  window.open(res.pdfUrl, "_blank");
                }
              });
            }}
          >
            {isPending ? "Generating..." : "Generate new pack"}
          </button>
        </div>
      </div>
      {message && <p className="text-xs text-emerald-700">{message}</p>}
    </div>
  );
}
