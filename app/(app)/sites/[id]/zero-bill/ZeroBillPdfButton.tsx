"use client";

import { useTransition } from "react";
import { generateZeroBillPdf } from "./actions";

type Props = { siteId: string; siteName?: string | null; disabled?: boolean };

export function ZeroBillPdfButton({ siteId, siteName, disabled }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("id", siteId);
        const base64 = await generateZeroBillPdf(formData);
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
        a.download = `zero-bill-${cleanName}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Failed to generate Zero-Bill PDF", err);
        alert("Couldn't generate the Zero-Bill PDF. Please run the assessment first.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending || disabled}
      className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-800 hover:border-emerald-400 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "Preparing PDF…" : "Download PDF"}
    </button>
  );
}
