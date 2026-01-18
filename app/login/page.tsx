"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabaseBrowser";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [nextPath, setNextPath] = useState("/dashboard");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextParam = params.get("next");
    if (nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")) {
      setNextPath(nextParam);
    }
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsError(false);

    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message || "Login failed");
        setIsError(true);
        return;
      }

      setMessage("Logged in");
      router.push(nextPath);
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-xl font-semibold text-zinc-900">Sign in</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Sign in to view and analyse sites.
        </p>

        {message && (
          <p
            className={`mt-3 text-xs ${
              isError ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {message}
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-black"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-black"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {isPending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </main>
    </div>
  );
}
