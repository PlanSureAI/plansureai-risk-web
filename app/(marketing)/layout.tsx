import Link from "next/link";
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="text-xl font-bold text-zinc-900">
              PlanSureAI
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/pricing" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
                Pricing
              </Link>
              <Link href="/about" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
                About
              </Link>
              <Link href="/contact" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
                Contact
              </Link>
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
      {children}
    </>
  );
}
