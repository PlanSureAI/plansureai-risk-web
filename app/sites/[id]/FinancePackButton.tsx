"use client";

import { useTransition } from "react";
import { generateFinancePack } from "./actions";

type Props = { siteId: string; siteName?: string | null };

export function FinancePackButton({ siteId, siteName }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleGenerate = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("id", siteId);

      try {
        const pack = await generateFinancePack(formData);
        const json = JSON.stringify(pack, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const safeName =
          (siteName ?? "site")
            .toString()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^a-zA-Z0-9-_]/g, "")
            .toLowerCase() || "site";

        const a = document.createElement("a");
        a.href = url;
        a.download = `finance-pack-${safeName}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Failed to generate finance pack", err);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={isPending}
      className="inline-flex items-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
    >
      {isPending ? "Preparing..." : "Download JSON pack"}
    </button>
  );
}
