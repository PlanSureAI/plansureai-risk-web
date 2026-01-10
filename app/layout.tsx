import "./globals.css";
import { Inter } from "next/font/google";
import Link from "next/link";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "PlanSureAI - Planning Intelligence for Developers",
  description: "AI-powered planning intelligence for SME developers and property professionals",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-3">
                <Image
                  src="/plansureai-logo.jpg"
                  alt="PlanSureAI"
                  width={160}
                  height={40}
                  className="object-contain"
                />
              </Link>

              {/* Navigation Links */}
              <div className="flex space-x-6 items-center">
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
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
