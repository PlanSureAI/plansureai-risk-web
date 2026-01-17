"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, MessageSquare, Check } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (res.ok) {
        setSubmitted(true);
      }
    } catch (err) {
      console.error("Error submitting contact form:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        {!submitted ? (
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h1 className="text-4xl font-bold text-zinc-900">Get in touch</h1>
              <p className="mt-4 text-lg text-zinc-600">
                Questions about Enterprise plans? Need help with your account? We&apos;re here to help.
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
                  <label htmlFor="subject" className="block text-sm font-medium text-zinc-900">
                    Subject
                  </label>
                  <select
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="mt-2 block w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  >
                    <option value="">Select a subject</option>
                    <option value="enterprise">Enterprise plan inquiry</option>
                    <option value="sales">Sales question</option>
                    <option value="support">Technical support</option>
                    <option value="billing">Billing question</option>
                    <option value="partnership">Partnership opportunity</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-zinc-900">
                    Message
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={6}
                    className="mt-2 block w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    placeholder="Tell us how we can help..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-zinc-900 px-6 py-3 font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
                >
                  {loading ? "Sending..." : "Send message"}
                </button>
              </form>
            </div>

            <div className="flex flex-col justify-center">
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-6 w-6 text-zinc-900" />
                    <h2 className="text-xl font-bold text-zinc-900">Email us</h2>
                  </div>
                  <p className="mt-4 text-base text-zinc-600">
                    General inquiries:{" "}
                    <a
                      href="mailto:plansureai@gmail.com"
                      className="font-semibold text-zinc-900 hover:underline"
                    >
                      plansureai@gmail.com
                    </a>
                  </p>
                  <p className="mt-2 text-base text-zinc-600">
                    Support:{" "}
                    <a
                      href="mailto:support@plansureai.com"
                      className="font-semibold text-zinc-900 hover:underline"
                    >
                      support@plansureai.com
                    </a>
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-6 w-6 text-zinc-900" />
                    <h2 className="text-xl font-bold text-zinc-900">Response time</h2>
                  </div>
                  <p className="mt-4 text-base text-zinc-600">
                    We typically respond within <strong>24 hours</strong> on weekdays.
                  </p>
                  <p className="mt-2 text-base text-zinc-600">
                    Enterprise customers get priority support with response times under{" "}
                    <strong>4 hours</strong>.
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
                  <h3 className="font-semibold text-zinc-900">Office address</h3>
                  <address className="mt-4 text-sm not-italic text-zinc-700">
                    PlanSureAI Ltd<br />
                    [Your Address Line 1]<br />
                    [Your Address Line 2]<br />
                    [City, Postcode]<br />
                    United Kingdom
                  </address>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
                  <h3 className="font-semibold text-zinc-900">Prefer to chat?</h3>
                  <p className="mt-4 text-sm text-zinc-700">
                    Already a customer? Sign in and use the in-app chat for instant support.
                  </p>
                  <Link
                    href="/signin"
                    className="mt-4 inline-block text-sm font-semibold text-zinc-900 underline"
                  >
                    Sign in →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="mt-6 text-4xl font-bold text-zinc-900">Message sent!</h1>
            <p className="mt-4 text-lg text-zinc-600">
              Thanks for getting in touch. We&apos;ll respond to <strong>{email}</strong> within 24
              hours.
            </p>

            <div className="mt-12 flex items-center justify-center gap-4">
              <Link
                href="/"
                className="rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Back to home
              </Link>
              <Link
                href="/sites"
                className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Go to dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
