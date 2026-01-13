import { NewSiteForm } from "./NewSiteForm";

export const dynamic = "force-dynamic";

export default function NewSitePage() {
  return (
    <div className="page-shell">
      <main className="page max-w-3xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-h1">Analyse a new site</h1>
          <p className="text-body">
            Capture the basics so you can assess planning risk and viability.
          </p>
        </div>

        <div className="card">
          <NewSiteForm />
        </div>
      </main>
    </div>
  );
}
