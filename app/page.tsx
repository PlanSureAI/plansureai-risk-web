import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-16 text-zinc-900">
      {/* Hero */}
      <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-6xl flex-col justify-center px-6 py-16 lg:flex-row lg:items-center lg:gap-16">
        {/* Left column – headline + copy + primary actions */}
        <section className="max-w-xl space-y-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Planning risk, clearly explained
          </p>

          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
            Understand planning risk
            <br />
            before time and money are wasted.
          </h1>

          <p className="text-lg leading-relaxed text-zinc-600">
            PlanSureAI helps landowners, developers, and lenders see planning
            risk in seconds, not weeks. Turn complex policy, precedent, and
            context into clear, actionable insight you can share with your team.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signin?redirect=/sites/new"
              className="flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
            >
              Analyse a site
            </Link>
            <Link
              href="/signin"
              className="flex h-11 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-semibold text-zinc-900 hover:border-zinc-900 hover:bg-zinc-100"
            >
              Sign in to view dashboard
            </Link>
          </div>

          <p className="text-sm text-zinc-500">
            Use the dashboard to explore planning insights, track sites over
            time, and export lender‑ready summaries.
          </p>
        </section>

        {/* Right column – card with typical outputs */}
        <aside
          id="dashboard"
          className="mt-12 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:mt-0"
        >
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Typical outputs include
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-zinc-700">
            <li>-  Planning policy alignment</li>
            <li>-  Settlement boundary and density analysis</li>
            <li>-  Precedent, appeal, and local character context</li>
            <li>-  Clear Proceed / Conditional / Do Not Proceed outcome</li>
            <li>-  PDF‑ready lender and investment summaries</li>
          </ul>
          <div className="mt-6 rounded-xl bg-zinc-50 p-4 text-xs text-zinc-600">
            Sign in to unlock interactive dashboards, scenario testing, and
            exportable reports built from your latest planning intelligence.
          </div>
        </aside>
      </main>
    </div>
  );
}
