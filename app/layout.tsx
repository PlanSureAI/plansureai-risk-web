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
                <Link href="/sites" className="text-sm text-gray-700 hover:text-blue-600 font-medium">
                  Sites
                </Link>
                <Link
                  href="/constraints"
                  className="text-sm text-gray-700 hover:text-blue-600 font-medium"
                >
                  Constraints
                </Link>
                <Link
                  href="/viability"
                  className="text-sm text-gray-700 hover:text-blue-600 font-medium"
                >
                  Viability
                </Link>
                <Link
                  href="/zero-bill-homes"
                  className="text-sm text-gray-700 hover:text-blue-600 font-medium"
                >
                  Zero-Bill Homes
                </Link>
                <Link href="/epc" className="text-sm text-gray-700 hover:text-blue-600 font-medium">
                  EPC explorer
                </Link>
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-700 hover:text-blue-600 font-medium"
                >
                  Dashboard
                </Link>
                {session ? (
                  <SignOutButton />
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
