"use client";

import { useTransition } from "react";
import { generateFinancePack } from "./actions";
import { packToCsvRow, type FinancePackCsvRow } from "@/app/types/siteFinance";

type Props = { siteId: string; siteName?: string | null };

export function FinancePackButton({ siteId, siteName }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleGenerate = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("id", siteId);

      try {
        const pack = await generateFinancePack(formData);
        const row = packToCsvRow(pack);
        const csv = toCsv(row);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
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
        a.download = `finance-pack-${safeName}.csv`;
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
      className="inline-flex items-center rounded-full border border-violet-500 bg-white px-5 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50 disabled:opacity-50"
    >
      {isPending ? "Preparing..." : "Download CSV pack"}
    </button>
  );
}

function toCsv(row: FinancePackCsvRow): string {
  const headers = Object.keys(row);
  const values = headers.map((h) => {
    const v = (row as any)[h];
    if (v === null || v === undefined) return "";
    const str = String(v);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  });
  return headers.join(",") + "\n" + values.join(",");
}
