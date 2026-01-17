import "./globals.css";
import { Inter } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { Analytics } from "@vercel/analytics/next";
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
        {session && (
          <nav className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-3">
                  <Image
                    src="/logo.png"
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
                    className="text-sm text-gray-700 hover:text-blue-600 font-medium"
                  >
                    Add site
                  </Link>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-medium">
                    {userLabel}
                  </div>
                </div>
              </div>
            </div>
          </nav>
        )}
        {children}
        <Analytics />
      </body>
    </html>
  );
}
