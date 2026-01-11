import type { ReactNode } from "react";
import { SignOutButton } from "@/app/components/SignOutButton";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-6xl items-center justify-end px-6 pt-6">
        <SignOutButton />
      </div>
      {children}
    </div>
  );
}
