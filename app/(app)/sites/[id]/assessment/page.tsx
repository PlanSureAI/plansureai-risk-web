import AssessmentClient from "./assessment-client";

export const dynamic = "force-dynamic";

export default async function AssessmentPage({ params }: { params: { id: string } }) {
  return <AssessmentClient siteId={params.id} />;
}
