import FinanceClient from './finance-client';

export default function FinancePage({ params }: { params: { id: string } }) {
  return <FinanceClient siteId={params.id} />;
}
