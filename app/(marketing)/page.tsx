import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "PlanSureAI – planning risk, clearly explained",
  description:
    "PlanSureAI helps landowners, developers and lenders see planning risk in seconds, not weeks.",
};

export default function Home() {
  return (
    <main className="text-zinc-900 min-h-screen flex flex-col justify-center">
      <section className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-24 lg:flex-row lg:items-center lg:gap-16">
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

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/login?next=/sites">
              <button className="flex h-11 items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800">
                Sign in
              </button>
            </Link>
          </div>

          <p className="mt-4 text-sm text-zinc-500">
            Analyse existing sites or create new ones once signed in. We have EPC, Zero-Bill Homes, and beyond.
          </p>
        </div>

        {/* Right column – card with features */}
        <aside
          id="features"
          className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:mt-0"
        >
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            What's included
          </h2>
          
          <div className="mt-4 space-y-4">
            <div className="border-b pb-3">
              <h3 className="text-sm font-semibold text-zinc-900">Planning Risk Analysis</h3>
              <ul className="mt-2 space-y-1 text-xs text-zinc-600">
                <li>• Policy alignment</li>
                <li>• Precedent & local context</li>
                <li>• Clear outcomes</li>
              </ul>
            </div>
            
            <div className="border-b pb-3">
              <h3 className="text-sm font-semibold text-zinc-900">EPC Explorer</h3>
              <ul className="mt-2 space-y-1 text-xs text-zinc-600">
                <li>• Energy ratings A-G</li>
                <li>• Efficiency scores</li>
                <li>• Certificate management</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Zero-Bill Homes</h3>
              <ul className="mt-2 space-y-1 text-xs text-zinc-600">
                <li>• Net-zero workflows</li>
                <li>• Heat pump & solar planning</li>
                <li>• Lender narratives</li>
              </ul>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
