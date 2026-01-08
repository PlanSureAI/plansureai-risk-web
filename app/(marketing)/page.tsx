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
              AI-powered planning intelligence for SME developers and property professionals
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              We help small and medium-sized developers navigate the complexities of UK planning by
              providing instant access to planning constraints, risk analysis, and viability
              assessments—turning weeks of research into minutes of clarity.
            </p>
          </div>
        </div>
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
    </div>
  );
}
