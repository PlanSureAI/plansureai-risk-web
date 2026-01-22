"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { createSupabaseBrowserClient } from "@/app/lib/supabaseBrowser";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message || "Failed to sign up");
        return;
      }

      window.location.href = "/sites";
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 lg:p-12">
              <div>
                <h1 className="text-3xl font-bold text-zinc-900">Create your account</h1>
                <p className="mt-2 text-base text-zinc-600">
                  Start with 3 free sites. No credit card required.
                </p>
              </div>

              <form onSubmit={handleSignUp} className="mt-8 space-y-6">
                {error && (
                  <div className="rounded-lg bg-rose-50 p-4 text-sm text-rose-800">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-zinc-900">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-2 block w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-zinc-900">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="mt-2 block w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    placeholder="At least 8 characters"
                  />
                  <p className="mt-2 text-xs text-zinc-500">Must be at least 8 characters</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-zinc-900 px-4 py-3 font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
                >
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-zinc-600">
                  Already have an account?{" "}
                  <Link href="/signin" className="font-semibold text-zinc-900 hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>

              <div className="mt-8 border-t border-zinc-200 pt-8">
                <p className="text-xs text-zinc-500">
                  By creating an account, you agree to our{" "}
                  <Link href="/contact" className="underline hover:text-zinc-900">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/contact" className="underline hover:text-zinc-900">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-center lg:pl-12">
              <h2 className="text-2xl font-bold text-zinc-900">Start free, upgrade when ready</h2>
              <p className="mt-4 text-base text-zinc-600">
                The Explorer plan gives you everything you need to get started with planning risk
                assessment.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  "3 site assessments per month",
                  "Full constraint detection (UK-wide)",
                  "Basic risk scores (0-100)",
                  "Conservation areas, listed buildings, TPOs, flood zones",
                  "Nearby planning approvals map",
                  "No credit card required",
                ].map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <Check className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-base text-zinc-700">{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-6">
                <p className="text-sm font-semibold text-zinc-900">
                  Need more? Upgrade to Developer (£49/mo)
                </p>
                <p className="mt-2 text-sm text-zinc-600">
                  Get 10 sites/month, policy citations, mitigation plans, and clean PDF exports.
                </p>
                <Link
                  href="/pricing"
                  className="mt-4 inline-block text-sm font-semibold text-zinc-900 underline"
                >
                  View all plans →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
