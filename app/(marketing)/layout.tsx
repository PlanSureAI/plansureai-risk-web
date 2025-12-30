import type { ReactNode } from "react";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-900">
        <main className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
        </main>
      </body>
    </html>
  );
}
