import "./globals.css";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";

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
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
