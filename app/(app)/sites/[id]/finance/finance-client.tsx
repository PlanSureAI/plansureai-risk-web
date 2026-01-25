"use client";

export default function FinanceClient({ siteId }: { siteId: string }) {
  return (
    <div className="h-screen w-full">
      <iframe
        src="https://financeready.co"
        className="h-full w-full border-0"
        title="Finance Readiness Assessment"
      />
    </div>
  );
}
