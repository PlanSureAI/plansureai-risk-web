"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../lib/supabaseBrowser";

export function SignOutButton() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = () => {
    setError(null);
    startTransition(async () => {
      const { error } = await supabase.auth.signOut(); // logs out and clears session cookies [web:154]
      if (error) {
        setError(error.message || "Error signing out");
        return;
      }

      router.push("/login");
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-xs text-red-600">
          {error}
        </span>
      )}
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isPending}
        className="inline-flex items-center rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
      >
        {isPending ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
