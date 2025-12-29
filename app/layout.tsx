"use client";

import "./globals.css";
import { usePathname } from "next/navigation";

function Logo() {
  return (
    <div className="px-8 py-6">
      {/* remove this <img> if you no longer want the logo anywhere */}
      <span className="text-sm font-semibold">PlanSureAI</span>
    </div>
  );
}

function Footer() {
  return (
    <footer className="w-full border-t border-neutral-200 px-8 py-4 text-xs text-neutral-500">
      <span>Contact: plansureai@gmail.com</span>
    </footer>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-white">
        {/* hide logo on home */}
        {!isHome && <Logo />}

        <main className="flex-1 flex flex-col">{children}</main>

        {/* hide bottom bar on home */}
        {!isHome && <Footer />}
      </body>
    </html>
  );
}
