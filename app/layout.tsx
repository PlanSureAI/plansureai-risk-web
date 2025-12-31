"use client";

import "./globals.css";
import { usePathname } from "next/navigation";

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
      <body className="min-h-screen bg-slate-50">
        <main className="py-6 px-4 md:px-8">{children}</main>
      </body>
    </html>
  );
}
