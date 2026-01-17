import Link from "next/link";
import { CheckCircle, MapPin, Zap, ArrowRight, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold text-zinc-900">
                PlanSureAI
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link href="/sites" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
                  Sites
                </Link>
                <Link href="/constraints" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
                  Constraints
                </Link>
                <Link href="/pricing" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
                  Pricing
                </Link>
              </div>
            </div>
            <Link
              href="/signin"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-br from-zinc-50 to-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]"></div>
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-5xl font-bold tracking-tight text-zinc-900 sm:text-6xl">
              AI-powered planning intelligence for UK developers
            </h1>
            <p className="mt-6 text-xl leading-8 text-zinc-600">
              Get instant planning risk assessments backed by official constraint data and local policy
              analysis. No guesswork - just clear, evidence-based guidance to help you decide faster.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/signup"
                className="rounded-lg bg-zinc-900 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-zinc-800"
              >
                Start Free Trial
              </Link>
              <Link
                href="/constraints"
                className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-6 py-3 text-base font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Check Constraints
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-4 text-sm text-zinc-500">No credit card required for free tier</p>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">How it works</h2>
            <p className="mt-4 text-lg text-zinc-600">Three simple steps to planning clarity</p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white">
                1
              </div>
              <h3 className="mt-6 text-xl font-semibold text-zinc-900">Enter your site</h3>
              <p className="mt-2 text-base text-zinc-600">
                Address, postcode, or coordinates - we&apos;ll find it and pull official planning constraints
                from Planning Data.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white">
                2
              </div>
              <h3 className="mt-6 text-xl font-semibold text-zinc-900">Get instant risk assessment</h3>
              <p className="mt-2 text-base text-zinc-600">
                See your planning risk score (0-100) with specific constraints flagged: conservation
                areas, listed buildings, TPOs, flood zones.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white">
                3
              </div>
              <h3 className="mt-6 text-xl font-semibold text-zinc-900">Review evidence-based guidance</h3>
              <p className="mt-2 text-base text-zinc-600">
                Every constraint comes with policy references and mitigation steps. No assumptions - just
                what the data shows.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-zinc-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-8">
              <Shield className="h-10 w-10 text-zinc-900" />
              <h3 className="mt-6 text-2xl font-bold text-zinc-900">Planning Risk Assessment</h3>
              <p className="mt-4 text-base text-zinc-600">
                Analyze any UK site for planning constraints using official Planning Data. Get risk
                scores, constraint breakdowns, and mitigation guidance in seconds.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Risk score (0-100) with confidence rating",
                  "Conservation areas, listed buildings, TPOs, flood zones",
                  "Policy references from local plans",
                  "Mitigation recommendations",
                  "Nearby planning approvals analysis",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                    <span className="text-sm text-zinc-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/sites/new"
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Analyze a site
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-8">
              <MapPin className="h-10 w-10 text-zinc-900" />
              <h3 className="mt-6 text-2xl font-bold text-zinc-900">Planning Constraints Checker</h3>
              <p className="mt-4 text-base text-zinc-600">
                Free tool to instantly check planning constraints for any UK location. Perfect for quick
                site screening.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Conservation areas",
                  "Listed buildings nearby",
                  "Tree Preservation Orders (TPOs)",
                  "Flood zones (2 & 3)",
                  "AONBs, National Parks, Green Belt",
                  "SSSIs and ancient woodland",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                    <span className="text-sm text-zinc-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/constraints"
                className="mt-8 inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Check constraints
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-12">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-zinc-900">Deep regional coverage</h2>
              <p className="mt-4 text-lg text-zinc-600">
                Currently training on: {" "}
                <span className="font-semibold text-zinc-900">Cornwall, Birmingham, Leeds</span>
              </p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="text-xl font-semibold text-zinc-900">In these regions, you get:</h3>
                <ul className="mt-4 space-y-3">
                  {[
                    "Local plan policy citations (e.g., 'Cornwall Local Plan Policy 12')",
                    "Comparable approvals within 1km",
                    "Region-specific approval rates",
                    "Planning authority guidance",
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Zap className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
                      <span className="text-base text-zinc-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-zinc-900">Working elsewhere?</h3>
                <p className="mt-4 text-base text-zinc-600">
                  You still get full constraint detection and basic risk assessment. Deep policy coverage
                  expands based on demand.
                </p>
                <Link
                  href="/waitlist"
                  className="mt-6 inline-block text-sm font-semibold text-zinc-900 underline"
                >
                  Request coverage for your region →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-zinc-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Simple, transparent pricing</h2>
            <p className="mt-4 text-lg text-zinc-600">Choose the plan that fits your workflow</p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-4">
            <PricingCard
              name="Explorer"
              price="Free"
              period=""
              description="Perfect for trying it out"
              features={[
                "3 sites per month",
                "Basic risk assessment",
                "Constraint detection",
                "Watermarked exports",
              ]}
              cta="Start Free"
              href="/signup"
            />

            <PricingCard
              name="Developer"
              price="£49"
              period="/month"
              description="For active site hunters"
              features={[
                "10 sites per month",
                "Full risk assessment",
                "Policy references",
                "Mitigation plans",
                "Clean PDF exports",
              ]}
              cta="Start Trial"
              href="/signup"
              highlighted
            />

            <PricingCard
              name="Expert"
              price="£149"
              period="/month"
              description="For serious developers"
              features={[
                "Unlimited sites",
                "Priority processing",
                "Detailed mitigation plans",
                "Team collaboration",
                "API access",
              ]}
              cta="Start Trial"
              href="/signup"
            />

            <PricingCard
              name="Enterprise"
              price="Custom"
              period=""
              description="For multi-user teams"
              features={[
                "White-label reports",
                "Bank/broker integrations",
                "Dedicated support",
                "Custom workflows",
              ]}
              cta="Contact Sales"
              href="/contact"
            />
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-zinc-900">What developers say</h2>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <Testimonial
              quote="Saved me 2 weeks of research on a Cornwall site. The conservation area flag and mitigation steps were spot-on."
              author="James M."
              role="Land promoter, Cornwall"
            />
            <Testimonial
              quote="Finally, a tool that cites actual policies instead of vague AI waffle. Worth every penny."
              author="Sarah K."
              role="Small developer, Birmingham"
            />
            <Testimonial
              quote="Used the free constraints checker to screen 20 sites in an afternoon. Bought Pro the same day."
              author="Tom R."
              role="Developer, Leeds"
            />
          </div>
        </div>
      </section>

      <section className="bg-zinc-900 py-24 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold">Ready to get started?</h2>
          <p className="mt-4 text-xl text-zinc-300">
            Stop paying consultants £2-5k per site for basic planning research.
            <br />
            Get instant risk assessments backed by official data.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-white px-8 py-4 text-base font-semibold text-zinc-900 hover:bg-zinc-100"
            >
              Start Free Trial
            </Link>
            <Link
              href="/constraints"
              className="rounded-lg border border-white/20 bg-white/10 px-8 py-4 text-base font-semibold text-white hover:bg-white/20"
            >
              Check Constraints (Free)
            </Link>
          </div>
          <p className="mt-4 text-sm text-zinc-400">No credit card required for free tier</p>
        </div>
      </section>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="text-lg font-bold text-zinc-900">PlanSureAI</div>
              <p className="mt-2 text-sm text-zinc-600">
                AI-powered planning intelligence for UK developers
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Product</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/sites" className="text-sm text-zinc-600 hover:text-zinc-900">
                    Risk Assessment
                  </Link>
                </li>
                <li>
                  <Link href="/constraints" className="text-sm text-zinc-600 hover:text-zinc-900">
                    Constraints Checker
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-sm text-zinc-600 hover:text-zinc-900">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Company</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/about" className="text-sm text-zinc-600 hover:text-zinc-900">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-sm text-zinc-600 hover:text-zinc-900">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Contact</h3>
              <div className="mt-4 space-y-2 text-sm text-zinc-600">
                <p>PlanSureAI Ltd</p>
                <p>[Your Address]</p>
                <p>[City, Postcode]</p>
                <p>United Kingdom</p>
                <p className="mt-4">
                  <a href="mailto:plansureai@gmail.com" className="hover:text-zinc-900">
                    plansureai@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-zinc-200 pt-8">
            <p className="text-center text-sm text-zinc-500">
              © 2026 PlanSureAI Ltd. All rights reserved.
            </p>
            <p className="mt-2 text-center text-xs text-zinc-400">
              Planning data sourced from planning.data.gov.uk. PlanSureAI is not affiliated with any
              local planning authority.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  href,
  highlighted = false,
}: {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-8 ${
        highlighted
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-200 bg-white text-zinc-900"
      }`}
    >
      <h3 className="text-lg font-semibold">{name}</h3>
      <div className="mt-4">
        <span className="text-4xl font-bold">{price}</span>
        <span className={highlighted ? "text-zinc-300" : "text-zinc-500"}>{period}</span>
      </div>
      <p className={`mt-2 text-sm ${highlighted ? "text-zinc-300" : "text-zinc-600"}`}>
        {description}
      </p>

      <ul className="mt-8 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <CheckCircle
              className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                highlighted ? "text-emerald-400" : "text-emerald-600"
              }`}
            />
            <span className={`text-sm ${highlighted ? "text-zinc-200" : "text-zinc-700"}`}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href={href}
        className={`mt-8 block w-full rounded-lg px-4 py-3 text-center text-sm font-semibold ${
          highlighted
            ? "bg-white text-zinc-900 hover:bg-zinc-100"
            : "bg-zinc-900 text-white hover:bg-zinc-800"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

function Testimonial({ quote, author, role }: { quote: string; author: string; role: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8">
      <p className="text-base text-zinc-700">"{quote}"</p>
      <div className="mt-6">
        <div className="font-semibold text-zinc-900">{author}</div>
        <div className="text-sm text-zinc-600">{role}</div>
      </div>
    </div>
  );
}
