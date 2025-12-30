import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";

export const dynamic = 'force-dynamic';

export default async function SitesLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  return <>{children}</>;
}
