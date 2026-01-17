import Link from "next/link";
import { Check, ArrowRight, Zap } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="border-b border-zinc-200 bg-zinc-50 py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900">
            Simple, transparent pricing
          </h1>
          <p className="mt-6 text-xl text-zinc-600">
            Choose the plan that fits your workflow. Start free, upgrade anytime.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-4">
            <div className="rounded-2xl border-2 border-zinc-200 bg-white p-8">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-zinc-900">Explorer</h3>
              </div>
              <div className="mt-4">
                <span className="text-4xl font-bold text-zinc-900">Free</span>
              </div>
              <p className="mt-2 text-sm text-zinc-600">Perfect for trying it out</p>

              <Link
                href="/signup"
                className="mt-6 block w-full rounded-lg border-2 border-zinc-900 bg-white px-4 py-3 text-center text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Start Free
              </Link>

              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <span className="text-sm text-zinc-700">
                    <strong>3 sites per month</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <span className="text-sm text-zinc-700">Basic risk assessment</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <span className="text-sm text-zinc-700">Constraint detection (UK-wide)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <span className="text-sm text-zinc-700">Watermarked exports</span>
                </li>
              </ul>
            </div>

            <div className="relative rounded-2xl border-2 border-zinc-900 bg-zinc-900 p-8 text-white">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-emerald-500 px-4 py-1 text-xs font-semibold text-white">
                  MOST POPULAR
                </span>
              </div>

              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">Developer</h3>
              </div>
              <div className="mt-4">
                <span className="text-4xl font-bold">£49</span>
                <span className="text-zinc-300">/month</span>
              </div>
              <p className="mt-2 text-sm text-zinc-300">For active site hunters</p>

              <Link
                href="/signup"
                className="mt-6 block w-full rounded-lg bg-white px-4 py-3 text-center text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
              >
                Start Free Trial
              </Link>

              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
                  <span className="text-sm text-zinc-100">
                    <strong>10 sites per month</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
                  <span className="text-sm text-zinc-100">Full risk assessment</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
                  <span className="text-sm text-zinc-100">Policy references</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
                  <span className="text-sm text-zinc-100">Mitigation plans</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
                  <span className="text-sm text-zinc-100">Clean PDF exports</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border-2 border-zinc-200 bg-white p-8">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-zinc-900">Expert</h3>
                <Zap className="h-5 w-5 text-amber-500" />
              </div>
              <div className="mt-4">
                <span className="text-4xl font-bold text-zinc-900">£149</span>
                <span className="text-zinc-600">/month</span>
              </div>
              <p className="mt-2 text-sm text-zinc-600">For serious developers</p>

              <Link
                href="/signup"
                className="mt-6 block w-full rounded-lg bg-zinc-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Start Free Trial
              </Link>

              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <span className="text-sm text-zinc-700">
                    <strong>Unlimited sites</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <span className="text-sm text-zinc-700">Priority processing</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <span className="text-sm text-zinc-700">Detailed mitigation plans</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <span className="text-sm text-zinc-700">Team collaboration</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <span className="text-sm text-zinc-700">API access</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border-2 border-zinc-200 bg-white p-8">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-zinc-900">Enterprise</h3>
              </div>
              <div className="mt-4">
                <span className="text-4xl font-bold text-zinc-900">Custom</span>
              </div>
              <p className="mt-2 text-sm text-zinc-600">For multi-user teams</p>

              <Link
                href="/contact"
                className="mt-6 block w-full rounded-lg border-2 border-zinc-900 bg-white px-4 py-3 text-center text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Contact Sales
              </Link>

              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <span className="text-sm text-zinc-700">
                    <strong>Everything in Expert</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <span className="text-sm text-zinc-700">White-label reports</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <span className="text-sm text-zinc-700">Bank/broker integrations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <span className="text-sm text-zinc-700">Dedicated support</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <span className="text-sm text-zinc-700">Custom workflows</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-zinc-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-zinc-900">Compare features</h2>

          <div className="mt-16 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="py-4 text-left text-sm font-semibold text-zinc-900">Feature</th>
                  <th className="py-4 text-center text-sm font-semibold text-zinc-900">Explorer</th>
                  <th className="py-4 text-center text-sm font-semibold text-zinc-900">Developer</th>
                  <th className="py-4 text-center text-sm font-semibold text-zinc-900">Expert</th>
                  <th className="py-4 text-center text-sm font-semibold text-zinc-900">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                <FeatureRow
                  feature="Sites per month"
                  values={["3", "10", "Unlimited", "Unlimited"]}
                />
                <FeatureRow
                  feature="Risk assessment"
                  values={["Basic", "Full", "Full", "Full"]}
                />
                <FeatureRow
                  feature="Policy references"
                  values={[false, true, true, true]}
                />
                <FeatureRow
                  feature="Mitigation plans"
                  values={[false, true, true, true]}
                />
                <FeatureRow
                  feature="PDF exports"
                  values={["Watermarked", "Clean", "Clean", "Clean"]}
                />
                <FeatureRow
                  feature="Team collaboration"
                  values={[false, false, true, true]}
                />
                <FeatureRow
                  feature="API access"
                  values={[false, false, true, true]}
                />
                <FeatureRow
                  feature="White-label reports"
                  values={[false, false, false, true]}
                />
                <FeatureRow
                  feature="Dedicated support"
                  values={[false, false, false, true]}
                />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-zinc-900">
            Frequently asked questions
          </h2>

          <dl className="mt-16 space-y-8">
            <div>
              <dt className="text-lg font-semibold text-zinc-900">Can I try before I buy?</dt>
              <dd className="mt-2 text-base text-zinc-600">
                Yes! The Explorer plan is completely free with 3 sites per month. No credit card
                required. You can upgrade anytime.
              </dd>
            </div>

            <div>
              <dt className="text-lg font-semibold text-zinc-900">
                What happens if I exceed my monthly limit?
              </dt>
              <dd className="mt-2 text-base text-zinc-600">
                You&apos;ll see a prompt to upgrade to the next tier. We never charge you without
                permission - you&apos;re always in control.
              </dd>
            </div>

            <div>
              <dt className="text-lg font-semibold text-zinc-900">Can I cancel anytime?</dt>
              <dd className="mt-2 text-base text-zinc-600">
                Yes. Cancel anytime from your account settings. You&apos;ll retain access until the end
                of your billing period.
              </dd>
            </div>

            <div>
              <dt className="text-lg font-semibold text-zinc-900">Do you offer refunds?</dt>
              <dd className="mt-2 text-base text-zinc-600">
                We offer a 14-day money-back guarantee on all paid plans. If you&apos;re not satisfied,
                contact us for a full refund.
              </dd>
            </div>

            <div>
              <dt className="text-lg font-semibold text-zinc-900">
                What payment methods do you accept?
              </dt>
              <dd className="mt-2 text-base text-zinc-600">
                We accept all major credit cards (Visa, Mastercard, Amex) via Stripe. Enterprise
                customers can request invoicing.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-zinc-900 py-24 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold">Ready to get started?</h2>
          <p className="mt-4 text-xl text-zinc-300">
            Start with 3 free sites. No credit card required.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 text-base font-semibold text-zinc-900 hover:bg-zinc-100"
          >
            Start Free Trial
            <ArrowRight className="h-5 w-5" />
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

function FeatureRow({
  feature,
  values,
}: {
  feature: string;
  values: Array<string | boolean>;
}) {
  return (
    <tr>
      <td className="py-4 text-sm text-zinc-700">{feature}</td>
      {values.map((value, i) => (
        <td key={i} className="py-4 text-center">
          {typeof value === "boolean" ? (
            value ? (
              <Check className="mx-auto h-5 w-5 text-emerald-600" />
            ) : (
              <span className="text-zinc-300">—</span>
            )
          ) : (
            <span className="text-sm text-zinc-900">{value}</span>
          )}
        </td>
      ))}
    </tr>
  );
}
