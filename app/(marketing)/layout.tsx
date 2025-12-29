import type { ReactNode } from "react";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        <main className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>

          <footer className="px-4 pb-8 pt-4 text-xs text-neutral-500">
            <p>
              Contact:{" "}
              <a
                href="mailto:plansureai@gmail.com"
                className="underline underline-offset-2 hover:text-neutral-700"
              >
                plansureai@gmail.com
              </a>
            </p>
          </footer>
        </main>
      </body>
    </html>
  );
}
