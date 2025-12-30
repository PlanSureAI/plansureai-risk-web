import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";
import { Header } from "@/app/components/Header";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <html lang="en">
      <body>
        <Header size="small" homeHref="/sites" navVariant="app" />
        {children}
      </body>
    </html>
  );
}
