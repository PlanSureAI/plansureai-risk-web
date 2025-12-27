"use client";

import { useTransition } from "react";
import { generateFinancePackPdf } from "./actions";

type Props = { siteId: string; siteName?: string | null };

export function FinancePackPdfButton({ siteId, siteName }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleGenerate = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("id", siteId);

      try {
        const base64 = await generateFinancePackPdf(formData);
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length)
          .fill(0)
          .map((_, i) => byteCharacters.charCodeAt(i));
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
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
        a.download = `finance-pack-${safeName}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Failed to generate finance pack PDF", err);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={isPending}
      className="inline-flex items-center rounded-full bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
    >
      {isPending ? "Preparing..." : "Download PDF pack"}
    </button>
  );
}
