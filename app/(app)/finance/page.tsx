export const dynamic = "force-dynamic";

export default function FinanceReadinessPage() {
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
