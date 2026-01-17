import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const userLabel = session.user?.email?.charAt(0)?.toUpperCase() ?? "U";

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", session.user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/logo.png"
                alt="PlanSureAI"
                width={160}
                height={40}
                className="object-contain"
              />
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/sites"
                className="text-sm text-gray-700 hover:text-blue-600 font-medium"
              >
                Sites
              </Link>
              <Link
                href="/sites/new"
                className="text-sm text-gray-700 hover:text-blue-600 font-medium"
              >
                Add site
              </Link>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-medium">
                {userLabel}
              </div>
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
