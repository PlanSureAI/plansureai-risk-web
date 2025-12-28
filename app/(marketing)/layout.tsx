import type { ReactNode } from "react";
import { Header } from "@/app/components/Header";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-50">
        <Header size="large" />
        {children}
      </body>
    </html>
  );
}
