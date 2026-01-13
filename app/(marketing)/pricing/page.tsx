import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
        <section className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Pricing
          </p>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Private beta pricing is coming soon
          </h1>
          <p className="mt-4 text-lg text-gray-700">
            We are currently onboarding select SME developers in Cornwall, Birmingham, and Leeds.
            Beta testers get free access during development and preferential pricing at launch.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login?next=/sites/new"
              className="inline-flex items-center rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Join the waitlist
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center rounded-md border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              How it works
            </Link>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-8">
          <h2 className="text-xl font-semibold text-gray-900">What beta testers receive</h2>
          <ul className="mt-4 space-y-2 text-sm text-gray-700 list-disc pl-5">
            <li>Free access during the beta period</li>
            <li>Preferential pricing once we launch publicly</li>
            <li>Direct input into product priorities</li>
          </ul>
          <p className="mt-6 text-sm text-gray-600">
            Questions about pricing? Email{" "}
            <a className="underline" href="mailto:plansureai@gmail.com">
              plansureai@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
