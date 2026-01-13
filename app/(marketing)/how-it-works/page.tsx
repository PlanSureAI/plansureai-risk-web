import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <section className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            How it works
          </p>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Planning intelligence that respects local policy nuance
          </h1>
          <p className="mt-4 text-lg text-gray-700">
            PlanSureAI combines local plans, constraint datasets, planning outcomes, and your own
            documents to produce evidence-based insights for SME developers.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login?next=/sites/new"
              className="inline-flex items-center rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Add your first site
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-md border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              Back to home
            </Link>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">1. Add a site</h2>
            <p className="mt-2 text-sm text-gray-700">
              Capture the site basics, planning status, and local authority so we can anchor every
              analysis to a specific scheme.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">2. Check constraints</h2>
            <p className="mt-2 text-sm text-gray-700">
              We pull in constraint layers and planning context to surface red flags, mitigation
              paths, and evidence you can share with advisors.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">3. Assess viability</h2>
            <p className="mt-2 text-sm text-gray-700">
              Run early-stage viability checks and planning risk analysis before you spend time on
              full design work.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-blue-100 bg-blue-50 p-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Evidence-based by design
          </h2>
          <p className="mt-3 text-sm text-gray-700">
            When policies conflict or need interpretation, we surface the evidence and note what
            is missing. We do not guess. Your output is always traceable to the inputs.
          </p>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-8">
          <h2 className="text-2xl font-bold text-gray-900">Current coverage</h2>
          <p className="mt-3 text-sm text-gray-700">
            We are training deeply on Cornwall, Birmingham, and Leeds before expanding nationwide.
            This keeps data quality high while we build better tooling for each authority.
          </p>
        </section>
      </div>
    </div>
  );
}
