import "./globals.css";
import { Inter } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";
import { SignOutButton } from "@/app/components/SignOutButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "PlanSureAI - Planning Intelligence for Developers",
  description: "AI-powered planning intelligence for SME developers and property professionals",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const addSiteHref = session ? "/sites/new" : "/login?next=/sites/new";
  const userLabel = session?.user?.email?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-3">
                <Image
                  src="/logo.jpg"
                  alt="PlanSureAI"
                  width={160}
                  height={40}
                  className="object-contain"
                />
              </Link>

              {/* Navigation Links */}
              <div className="flex items-center gap-6">
                <Link
                  href="/sites"
                  className="text-sm text-gray-700 hover:text-blue-600 font-medium"
                >
                  Sites
                </Link>
                <Link
                  href={addSiteHref}
                  className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  Add site
                </Link>
                <div className="relative group">
                  <button
                    type="button"
                    className="text-sm text-gray-700 hover:text-blue-600 font-medium"
                  >
                    Tools
                  </button>
                  <div className="absolute left-0 z-20 hidden w-52 rounded-md border border-gray-200 bg-white py-2 shadow-lg group-hover:block group-focus-within:block">
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
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-700 hover:text-blue-600 font-medium"
                >
                  Dashboard
                </Link>
                {session ? (
                  <details className="relative">
                    <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700 [&::-webkit-details-marker]:hidden">
                      {userLabel}
                    </summary>
                    <div className="absolute right-0 z-20 mt-2 w-48 rounded-md border border-gray-200 bg-white py-2 shadow-lg">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Account
                      </Link>
                      <Link
                        href="/how-it-works"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Help
                      </Link>
                      <div className="px-4 py-2">
                        <SignOutButton />
                      </div>
                    </div>
                  </details>
                ) : (
                  <Link
                    href="/login?next=/dashboard"
                    className="inline-flex items-center rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
