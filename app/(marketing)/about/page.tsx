import Link from "next/link";
import { Target, Users, Zap, Shield } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="border-b border-zinc-200 bg-zinc-50 py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900">
            Making planning intelligence accessible to every developer
          </h1>
          <p className="mt-6 text-xl text-zinc-600">
            We&apos;re building the UK&apos;s first comprehensive AI-powered planning intelligence platform
            that understands local policy nuance and helps SME developers compete.
          </p>
        </div>
      </section>

      <section className="border-b border-zinc-200 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-zinc-900">The problem</h2>
              <p className="mt-6 text-lg text-zinc-700">
                Small and medium developers waste weeks researching planning constraints, reading
                200+ page local plans, and paying consultants £2-5k per site for basic analysis.
              </p>
              <p className="mt-4 text-lg text-zinc-700">
                Meanwhile, larger firms have dedicated planning teams and expensive tools that give
                them an unfair advantage.
              </p>
              <p className="mt-4 text-lg text-zinc-700">We&apos;re leveling the playing field.</p>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-zinc-900">Our solution</h2>
              <p className="mt-6 text-lg text-zinc-700">
                PlanSureAI combines official Planning Data, local plan policies, and real planning
                outcomes to give you instant, evidence-based risk assessments.
              </p>
              <p className="mt-4 text-lg text-zinc-700">
                No guesswork. No vague AI waffle. Just clear guidance backed by actual policies and
                comparable approvals.
              </p>
              <p className="mt-4 text-lg text-zinc-700">What used to take 5 weeks now takes 30 seconds.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-zinc-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-zinc-900">How we work</h2>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-8">
              <Shield className="h-10 w-10 text-zinc-900" />
              <h3 className="mt-6 text-xl font-bold text-zinc-900">Evidence-based</h3>
              <p className="mt-4 text-base text-zinc-600">
                We cite actual policies and show comparable approvals. When data conflicts, we
                surface the evidence instead of guessing.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-8">
              <Target className="h-10 w-10 text-zinc-900" />
              <h3 className="mt-6 text-xl font-bold text-zinc-900">Quality over coverage</h3>
              <p className="mt-4 text-base text-zinc-600">
                We expand region by region, training deeply on local plans and outcomes before
                moving to the next area.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-8">
              <Zap className="h-10 w-10 text-zinc-900" />
              <h3 className="mt-6 text-xl font-bold text-zinc-900">Built for speed</h3>
              <p className="mt-4 text-base text-zinc-600">
                30-second risk assessments. Instant constraint checks. We respect your time and
                give you answers fast.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-8">
              <Users className="h-10 w-10 text-zinc-900" />
              <h3 className="mt-6 text-xl font-bold text-zinc-900">SME-focused</h3>
              <p className="mt-4 text-base text-zinc-600">
                Pricing designed for small developers. Tools that don&apos;t require a planning degree
                to understand.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200 py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-zinc-900">Where we are now</h2>

          <div className="mt-12 space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-zinc-900">Deep regional training</h3>
              <p className="mt-2 text-base text-zinc-700">
                Currently building comprehensive coverage for Cornwall, Birmingham, and Leeds-combining
                local plans, constraint datasets, and planning outcomes.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-zinc-900">UK-wide constraint detection</h3>
              <p className="mt-2 text-base text-zinc-700">
                Our constraint checker works nationwide via official Planning Data, covering
                conservation areas, listed buildings, TPOs, flood zones, and more.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-zinc-900">Expansion roadmap</h3>
              <p className="mt-2 text-base text-zinc-700">
                We prioritize new regions based on demand. Join our waitlist to influence which
                areas we cover next.
              </p>
            </div>
          </div>

          <div className="mt-12 flex gap-4">
            <Link
              href="/waitlist"
              className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Request your region
            </Link>
            <Link
              href="/signup"
              className="rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Try it free
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-zinc-50 py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-zinc-900">Built with official data</h2>
          <p className="mt-4 text-base text-zinc-600">
            We source planning constraints from planning.data.gov.uk and combine them with local
            plan policies and real planning outcomes.
          </p>
          <p className="mt-8 text-xs text-zinc-500">
            PlanSureAI is not affiliated with any local planning authority. We are an independent
            platform helping developers make better decisions.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-zinc-900">Ready to get started?</h2>
          <p className="mt-4 text-lg text-zinc-600">Start with 3 free sites. No credit card required.</p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-lg bg-zinc-900 px-8 py-4 text-base font-semibold text-white hover:bg-zinc-800"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      <footer className="border-t border-zinc-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-zinc-500">© 2026 PlanSureAI Ltd. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
