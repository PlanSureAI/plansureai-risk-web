"use client";

import { useTransition } from "react";
import { generateFinancePackPdf } from "./actions";

type Props = { siteId: string; siteName?: string | null };

export function FinancePackPdfButton({ siteId, siteName }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("id", siteId);
      const base64 = await generateFinancePackPdf(formData);
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length)
        .fill(0)
        .map((_, i) => byteCharacters.charCodeAt(i));
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      const cleanName =
        (siteName || "site").toLowerCase().replace(/[^a-z0-9]+/g, "-") || "site";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finance-pack-${cleanName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center rounded-full border border-neutral-800 bg-white px-5 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
    >
      {isPending ? "Generating PDF…" : "Download PDF pack"}
    </button>
  );
}
