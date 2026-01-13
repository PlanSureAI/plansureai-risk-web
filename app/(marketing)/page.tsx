import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">PlanSureAI</h1>
            <p className="text-xl text-gray-600 mb-8">
              AI-powered planning intelligence for SME developers
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              We are building the UK's first comprehensive planning intelligence platform that
              understands local policy nuance. Currently training on Cornwall, Birmingham, and
              Leeds - with more regions coming soon.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/login?next=/onboarding"
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Join early access waitlist
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <section className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Where we're building first
          </h2>
          <p className="text-gray-700 mb-4">
            Currently covering: Cornwall, Birmingham, Leeds
          </p>
          <p className="text-gray-600 text-sm mb-6">
            We take a quality-first approach, training our AI on local plans, constraint datasets,
            policy documents, and real planning outcomes before expanding nationwide.
          </p>
          <p className="text-gray-700 mb-6">
            Developing in one of these areas? You'll get the deepest coverage and help shape the
            platform.
          </p>
          <Link
            href="/login?next=/onboarding"
            className="inline-flex items-center justify-center rounded-md bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Request early access for your region
          </Link>
        </section>

        <section className="bg-blue-50 rounded-xl border border-blue-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Help us build the future of planning intelligence
          </h2>
          <p className="text-gray-700 mb-6">
            We are looking for SME developers working in Cornwall, Birmingham, or Leeds to join the
            beta program.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What you get</h3>
              <ul className="space-y-2 text-sm text-gray-700 list-disc pl-5">
                <li>Free access during beta and preferential pricing after launch</li>
                <li>Priority support and feature requests</li>
                <li>Direct input into what we build next</li>
                <li>First access to new regions as we expand</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What we need</h3>
              <ul className="space-y-2 text-sm text-gray-700 list-disc pl-5">
                <li>Real planning scenarios to test against</li>
                <li>Honest feedback on accuracy and usefulness</li>
                <li>Patience as we refine and improve</li>
              </ul>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-6">
            UK planning is complex because every authority does things differently. We are doing
            this properly and not rushing to market with incomplete data.
          </p>
          <div className="mt-6">
            <Link
              href="/login?next=/onboarding"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Apply for beta access
            </Link>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our approach</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                1. Deep regional training
              </h3>
              <p className="text-sm text-gray-700">
                We combine local plans, constraint datasets, policy documents, and user-uploaded
                planning materials to build comprehensive regional intelligence.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                2. Evidence-based analysis
              </h3>
              <p className="text-sm text-gray-700">
                When policies conflict or need interpretation, we surface the evidence and suggest
                mitigation steps rather than making assumptions.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                3. Continuous updates
              </h3>
              <p className="text-sm text-gray-700">
                We track regional policy feeds and run periodic refresh jobs to keep data current
                as local plans evolve.
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-6">
            Current focus: getting Cornwall, Birmingham, and Leeds right before expanding coverage.
          </p>
        </section>
      </div>

      {/* Main Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Tools & Features</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Sites */}
          <Link
            href="/sites"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-500 hover:shadow-lg transition-all"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-3">Sites</h3>
            <p className="text-gray-600 text-sm mb-4">
              Manage your development sites, run EPC A analysis, and generate lender packs for
              Zero-Bill residential developments.
            </p>
            <div className="inline-flex items-center text-blue-600 font-medium text-sm">
              View your sites →
            </div>
          </Link>

          {/* Constraints Checker */}
          <Link
            href="/constraints"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-500 hover:shadow-lg transition-all"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-3">Planning Constraints</h3>
            <p className="text-gray-600 text-sm mb-4">
              Instantly check planning constraints for any UK location including conservation
              areas, listed buildings, flood zones, and more.
            </p>
            <div className="inline-flex items-center text-blue-600 font-medium text-sm">
              Check constraints →
            </div>
          </Link>

          {/* Zero-Bill Homes */}
          <Link
            href="/zero-bill-homes"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-500 hover:shadow-lg transition-all"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-3">Zero-Bill Homes</h3>
            <p className="text-gray-600 text-sm mb-4">
              Explore zero-bill residential development opportunities with EPC A compliance and
              energy performance analysis.
            </p>
            <div className="inline-flex items-center text-blue-600 font-medium text-sm">
              Explore homes →
            </div>
          </Link>

          {/* EPC Explorer */}
          <Link
            href="/epc"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-500 hover:shadow-lg transition-all"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-3">EPC Explorer</h3>
            <p className="text-gray-600 text-sm mb-4">
              Search and analyze Energy Performance Certificate data across the UK to identify
              retrofit and development opportunities.
            </p>
            <div className="inline-flex items-center text-blue-600 font-medium text-sm">
              Explore EPCs →
            </div>
          </Link>

          {/* Dashboard */}
          <Link
            href="/dashboard"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-500 hover:shadow-lg transition-all"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-3">Dashboard</h3>
            <p className="text-gray-600 text-sm mb-4">
              View your project portfolio, track progress, and access all your planning
              intelligence in one place.
            </p>
            <div className="inline-flex items-center text-blue-600 font-medium text-sm">
              Go to dashboard →
            </div>
          </Link>

          {/* Viability Calculator - now active */}
          <Link
            href="/viability"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-500 hover:shadow-lg transition-all"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-3">Viability Calculator</h3>
            <p className="text-gray-600 text-sm mb-4">
              Assess development viability with AI-powered cost estimation and financial modeling.
            </p>
            <div className="inline-flex items-center text-blue-600 font-medium text-sm">
              Calculate viability →
            </div>
          </Link>
        </div>

        {/* Additional Info Section */}
        <div className="mt-16 bg-blue-50 rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Built for SME Developers</h3>
          <p className="text-gray-700 max-w-2xl mx-auto">
            PlanSureAI streamlines the planning process for small and medium developers, giving you
            the tools to compete with larger firms while saving time and reducing risk.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <section className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently asked questions</h2>
          <div className="space-y-5 text-sm text-gray-700">
            <div>
              <p className="font-semibold text-gray-900">Which areas do you cover?</p>
              <p>
                We are in development with deep coverage of Cornwall, Birmingham, and Leeds. We
                expand region by region based on data availability and demand.
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">When will you cover my region?</p>
              <p>
                Join the waitlist and tell us your area. This directly influences our roadmap and
                expansion order.
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">How accurate is your planning data?</p>
              <p>
                We combine official local plans, constraint datasets, and policy documents with
                real planning outcomes. When policies conflict, we show the evidence instead of
                guessing.
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">How do you handle policy updates?</p>
              <p>
                We track regional policy feeds and run periodic refresh jobs. We are building UI
                indicators for policy version dates next.
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                Do you include committee decisions and officer reports?
              </p>
              <p>
                Not yet. Our current coverage focuses on local plans, constraint datasets, and
                user-uploaded planning documents. Committee reports are on the roadmap.
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Can I try it now?</p>
              <p>
                We are in private beta with selected developers in our coverage areas. Join the
                waitlist to get early access.
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">How much will it cost?</p>
              <p>
                Pricing is not final yet, but beta testers will receive preferential rates. Our
                goal is to stay accessible for SME developers.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
