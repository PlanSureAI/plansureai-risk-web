import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-900">
        <main className="flex min-h-screen flex-col">
          <header className="w-full bg-white border-b border-gray-200">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <Link href="/" className="flex items-center">
                <Image
                  src="/logo.png"
                  alt="PlanSureAI"
                  width={160}
                  height={40}
                  className="object-contain"
                />
              </Link>
              <nav className="flex items-center gap-6 text-sm font-medium text-zinc-700">
                <Link href="/how-it-works" className="hover:text-zinc-900">
                  How it works
                </Link>
                <div className="relative group">
                  <button type="button" className="hover:text-zinc-900">
                    Tools
                  </button>
                  <div className="absolute left-0 z-20 hidden w-52 rounded-md border border-gray-200 bg-white py-2 shadow-lg group-hover:block group-focus-within:block">
                    <Link
                      href="/sites"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Sites
                    </Link>
                    <Link
                      href="/constraints"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Planning check
                    </Link>
                    <Link
                      href="/viability"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Viability
                    </Link>
                    <Link
                      href="/epc"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      EPC database
                    </Link>
                  </div>
                </div>
                <div className="relative group">
                  <button type="button" className="hover:text-zinc-900">
                    Solutions
                  </button>
                  <div className="absolute left-0 z-20 hidden w-52 rounded-md border border-gray-200 bg-white py-2 shadow-lg group-hover:block group-focus-within:block">
                    <Link
                      href="/zero-bill-homes"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      EPC A development
                    </Link>
                  </div>
                </div>
                <Link href="/pricing" className="hover:text-zinc-900">
                  Pricing
                </Link>
                <Link
                  href="/login?next=/dashboard"
                  className="inline-flex items-center rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Sign in
                </Link>
              </nav>
            </div>
          </header>
          <div className="flex-1">{children}</div>
        </main>
      </body>
    </html>
  );
}
