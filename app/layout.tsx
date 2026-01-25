import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import GoogleAnalytics from "./components/GoogleAnalytics";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "PlansurAI - Planning Risk Assessment",
  description: "AI-powered planning permission risk analysis with policy citations and comparable data.",
  keywords: "planning permission, risk assessment, UK planning, AI planning",
  authors: [{ name: "PlansurAI" }],
  icons: {
    icon: "/brand/plansureai-logo.png",
  },
  openGraph: {
    title: "PlansurAI - Planning Risk Assessment",
    description: "AI-powered planning permission risk analysis",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "PlansurAI - Planning Risk Assessment",
    description: "AI-powered planning permission risk analysis",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GoogleAnalytics />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
