import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Your portfolio overview will live here. For now, jump back to Sites to
          manage projects and run new assessments.
        </p>
        <Link
          href="/sites"
          className="mt-4 inline-flex text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Go to Sites
        </Link>
      </div>
    </div>
  );
}
