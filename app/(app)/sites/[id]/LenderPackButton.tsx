"use client";

import { useTransition } from "react";

type Props = {
  siteId: string;
  siteName?: string | null;
};

export function LenderPackButton({ siteId, siteName }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const response = await fetch(`/api/sites/${siteId}/lender-pack`);
      if (!response.ok) {
        console.error("Failed to generate lender pack:", response.statusText);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeName = (siteName ?? "site").trim().replace(/\s+/g, "-") || "site";
      const dateStamp = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `lender-pack-${safeName}-${dateStamp}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
    >
      {isPending ? "Generating Lender Pack..." : "Generate Lender Pack"}
    </button>
  );
}
