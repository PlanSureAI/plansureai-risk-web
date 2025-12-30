import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "PlanSureAI – planning risk, clearly explained",
  description:
    "PlanSureAI helps landowners, developers and lenders see planning risk in seconds, not weeks.",
};

export default function Home() {
  return (
    <main className="text-zinc-900">
      <section className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 lg:flex-row lg:items-center lg:gap-16">
        {/* Left column – logo + headline + copy + primary actions */}
        <div className="max-w-xl">
          <Image
            src="/plansureai-wordmark.png"
            alt="PlanSureAI"
            width={200}
            height={50}
            className="mb-6"
            priority
          />

          <p className="text-xs font-medium tracking-[0.2em] text-zinc-500">
            PlanSureAI · PLANNING RISK, CLEARLY EXPLAINED
          </p>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
            Understand planning risk
            <br />
            before time and money are wasted.
          </h1>

          <p className="mt-4 max-w-xl text-sm text-zinc-600">
            <span className="font-semibold">PlanSureAI</span> helps landowners, developers, and
            lenders see planning risk in seconds, not weeks. Turn complex policy, precedent, and
            context into clear, actionable insight you can share with your team.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/login?next=/sites">
              <button className="flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800">
                Sign in to analyse a site
              </button>
            </Link>
            <Link href="/login?next=/sites/new">
              <button className="flex h-11 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-semibold text-zinc-900 hover:border-zinc-900 hover:bg-zinc-100">
                Create new site
              </button>
            </Link>
            <Link href="/zero-bill-homes">
              <button className="flex h-11 items-center justify-center rounded-full border border-emerald-200 bg-white px-6 text-sm font-semibold text-emerald-800 hover:border-emerald-400 hover:bg-emerald-50">
                See the Zero-Bill flow
              </button>
            </Link>
          </div>

          <p className="mt-4 text-sm text-zinc-500">
            Use the dashboard to explore planning insights, track sites over time, and export
            lender‑ready summaries.
          </p>
        </div>

        {/* Right column – card with typical outputs */}
        <aside
          id="dashboard"
          className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:mt-0"
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
            Sign in to unlock interactive dashboards, scenario testing, and exportable reports
            built from your latest planning intelligence.
          </div>
        </aside>
      </section>
    </main>
  );
}
