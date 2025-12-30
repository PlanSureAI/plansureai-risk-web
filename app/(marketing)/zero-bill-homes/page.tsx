import Link from "next/link";

export const metadata = {
  title: "Zero-Bill Homes | PlanSureAI",
  description:
    "PlanSureAI's Zero-Bill workflow pairs planning risk analysis with EPC A, fabric-first energy strategies, and lender-ready packs.",
};

export default function ZeroBillHomesPage() {
  return (
    <div className="bg-neutral-50 text-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <Link href="/" className="text-sm font-semibold text-zinc-600 hover:text-zinc-900">
          ← Back
        </Link>
      </div>
      <ZeroBillHero />
      <ZeroBillExplainer />
      <ZeroBillWorkflowTeaser />
    </div>
  );
}

function ZeroBillHero() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 lg:py-16">
      <div className="grid gap-10 rounded-3xl bg-white/80 p-8 shadow-sm ring-1 ring-zinc-100 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div className="space-y-4">
          <p className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Zero-Bill Homes
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Designed for Zero-Bill Homes.
          </h1>
          <p className="text-base text-zinc-700 sm:text-lg">
            PlanSureAI gives you a single view of planning risk, EPC A delivery, and lender
            narratives. Run the Zero-Bill preset to see how fabric-first, heat pumps, and solar
            combine for net-operational energy.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center" />
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Planning risk · EPC A · lender ready
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 p-6 shadow-inner">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Zero-Bill preset snapshot
          </p>
          <div className="mt-4 space-y-3 text-sm text-zinc-800">
            <div className="rounded-xl bg-white/80 p-3 shadow-sm ring-1 ring-zinc-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Inputs
              </p>
              <p className="mt-1">Site address, LPA, proposed homes</p>
              <p className="text-xs text-zinc-600">EPC target A · heat pump + PV · fabric-first</p>
            </div>
            <div className="rounded-xl bg-white/80 p-3 shadow-sm ring-1 ring-zinc-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Outputs
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>Planning risk score and deal framing</li>
                <li>Zero-Bill lender narrative</li>
                <li>Downloadable PDF pack</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ZeroBillExplainer() {
  const pillars = [
    {
      title: "EPC A, default",
      copy: "Treat EPC A as the baseline, with uplift notes where the site needs fabric or renewables to close the gap.",
    },
    {
      title: "Net-operational energy",
      copy: "Model heat demand, heat pump performance, and solar generation to show how the scheme moves towards £0 operational bills.",
    },
    {
      title: "Heat pumps + solar + fabric-first",
      copy: "Evidence the mix lenders want: low air permeability, high-efficiency ASHPs, PV coverage, and resident comfort built in.",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 pb-12 lg:pb-16">
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-zinc-100 pb-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Zero-Bill Explainer
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
              Built for lenders who expect EPC A and net-zero ready homes.
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-zinc-700">
              Use the preset as a fast lane: pull a site, confirm the energy strategy, and export a
              lender narrative without rewriting prompts. Full workflow is available once you sign in.
            </p>
          </div>
          <p className="text-xs text-zinc-600">
            Zero-Bill workflow unlocks after sign-in; dashboards and lender packs live in the app.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4 shadow-inner"
            >
              <p className="text-sm font-semibold text-zinc-900">{pillar.title}</p>
              <p className="mt-2 text-sm text-zinc-700">{pillar.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ZeroBillWorkflowTeaser() {
  const steps = [
    {
      title: "Pull the site context",
      body: "Existing PlanSureAI context: LPA, planning status, energy strategy, phasing, and finance inputs you already track.",
    },
    {
      title: "Run Zero-Bill analysis",
      body: "Server action uses the same planning engine with Zero-Bill prompt context: EPC A, heat pumps, solar, fabric-first.",
    },
    {
      title: "Share lender pack",
      body: "Outputs include planning risk score, Zero-Bill narrative, lender rationale, and a one-click PDF for brokers or ICs.",
    },
  ];

  return (
    <section id="workflow" className="mx-auto max-w-6xl px-4 pb-16">
      <div className="rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-zinc-50 p-8 ring-1 ring-emerald-100">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Workflow teaser
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
          One route: inputs → Zero-Bill analysis → lender pack.
        </h3>
        <p className="mt-2 max-w-3xl text-sm text-zinc-700">
          The Zero-Bill view reuses your core planning risk pipeline; it only swaps the prompt and UI
          framing so you don't maintain a separate system.
        </p>

        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm"
            >
              <span className="absolute right-3 top-3 text-xs font-semibold text-emerald-600">
                {index + 1}
              </span>
              <p className="text-sm font-semibold text-zinc-900">{step.title}</p>
              <p className="mt-2 text-sm text-zinc-700">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
