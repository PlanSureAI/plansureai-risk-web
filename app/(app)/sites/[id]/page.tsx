import { SiteDetailsClient } from "./site-details-client";

export const dynamic = "force-dynamic";

export default function SiteDetailsPage({ params }: { params: { id: string } }) {
  return <SiteDetailsClient siteId={params.id} />;
}
