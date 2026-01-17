"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, MapPin } from "lucide-react";

export default function WaitlistPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState("");
  const [company, setCompany] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, region, company }),
      });

      if (res.ok) {
        setSubmitted(true);
      }
    } catch (err) {
      console.error("Error submitting waitlist:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        {!submitted ? (
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="h-8 w-8 text-zinc-900" />
                <h1 className="text-4xl font-bold text-zinc-900">Request Regional Coverage</h1>
              </div>
              <p className="mt-4 text-lg text-zinc-600">
                Tell us which region you&apos;re working in and we&apos;ll prioritize it for deep policy
                coverage.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-zinc-900">
                    Your name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-2 block w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    placeholder="John Smith"
                  />
                </div>

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
                    className="mt-2 block w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="region" className="block text-sm font-medium text-zinc-900">
                    Which region? <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="region"
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    required
                    className="mt-2 block w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    placeholder="e.g., Manchester, Bristol, Edinburgh"
                  />
                  <p className="mt-2 text-sm text-zinc-500">
                    The local planning authority or region where you develop
                  </p>
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-zinc-900">
                    Company (optional)
                  </label>
                  <input
                    id="company"
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="mt-2 block w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    placeholder="Your company name"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-zinc-900 px-6 py-3 font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
                >
                  {loading ? "Submitting..." : "Request Coverage"}
                </button>
              </form>
            </div>

            <div className="flex flex-col justify-center">
              <h2 className="text-2xl font-bold text-zinc-900">How it works</h2>

              <ul className="mt-8 space-y-6">
                <li className="flex items-start gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">Submit your request</h3>
                    <p className="mt-1 text-sm text-zinc-600">
                      Tell us which region you&apos;re working in and why it matters to you.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">We prioritize based on demand</h3>
                    <p className="mt-1 text-sm text-zinc-600">
                      The more requests we get for a region, the faster we build coverage for it.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">Get early access</h3>
                    <p className="mt-1 text-sm text-zinc-600">
                      When your region goes live, you&apos;ll be the first to know and get preferential
                      pricing.
                    </p>
                  </div>
                </li>
              </ul>

              <div className="mt-12 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
                <h3 className="font-semibold text-zinc-900">Currently building:</h3>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2 text-sm text-zinc-700">
                    <Check className="h-4 w-4 text-emerald-600" />
                    Cornwall (Live)
                  </li>
                  <li className="flex items-center gap-2 text-sm text-zinc-700">
                    <Check className="h-4 w-4 text-emerald-600" />
                    Birmingham (Live)
                  </li>
                  <li className="flex items-center gap-2 text-sm text-zinc-700">
                    <Check className="h-4 w-4 text-emerald-600" />
                    Leeds (Live)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="mt-6 text-4xl font-bold text-zinc-900">Request received!</h1>
            <p className="mt-4 text-lg text-zinc-600">
              Thanks for your interest in {region}. We&apos;ll email you at <strong>{email}</strong> when
              coverage goes live.
            </p>

            <div className="mt-12 flex items-center justify-center gap-4">
              <Link
                href="/"
                className="rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Back to home
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Start using PlanSureAI
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
