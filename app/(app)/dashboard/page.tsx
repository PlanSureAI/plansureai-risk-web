import Link from "next/link";

export const metadata = {
  title: "Dashboard | PlanSureAI",
};

export default function DashboardPage() {
  return (
    <main className="px-6 py-8">
      <section className="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white px-6 py-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>

        <p className="mt-3 text-sm text-slate-700">
          This dashboard will become your portfolio hub, showing planning constraints,
          risk and viability across all your sites in one place.
        </p>

        <p className="mt-2 text-sm text-slate-600">
          Start by adding sites and running assessments from the Sites page. As your
          portfolio grows, its key signals will surface here.
        </p>

        <div className="mt-6">
          <Link
            href="/sites"
            className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Go to Sites
          </Link>
        </div>
      </section>
    </main>
  );
}
