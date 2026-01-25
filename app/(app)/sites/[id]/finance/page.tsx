import FinanceClient from "./finance-client";

export const dynamic = "force-dynamic";

export default function FinancePage({ params }: { params: { id: string } }) {
  return <FinanceClient siteId={params.id} />;
}
