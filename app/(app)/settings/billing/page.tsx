"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabaseBrowser";
import { CreditCard, Calendar, AlertCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Subscription {
  tier: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  projects_used: number;
  projects_limit: number;
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    async function loadSubscription() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setSubscription(data as Subscription);
      }
      setLoading(false);
    }

    void loadSubscription();
  }, [supabase]);

  async function openCustomerPortal() {
    try {
      setPortalLoading(true);

      const response = await fetch("/api/stripe/create-portal", {
        method: "POST",
      });

      const { url, error } = await response.json();

      if (error) {
        alert("Error: " + error);
        return;
      }

      window.location.href = url;
    } catch (error) {
      console.error("Portal error:", error);
      alert("Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="animate-pulse">
          <div className="mb-6 h-8 w-1/3 rounded bg-gray-200"></div>
          <div className="h-32 rounded bg-gray-100"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="mb-6 text-2xl font-bold">Billing & Subscription</h1>
        <div className="rounded-lg border bg-gray-50 p-6">
          <p className="text-gray-600">No subscription found.</p>
        </div>
      </div>
    );
  }

  const periodEnd = new Date(subscription.current_period_end);
  const isActive = subscription.status === "active";

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Billing & Subscription</h1>

      <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{subscription.tier} Plan</h2>
            <p className="mt-1 text-sm text-gray-600">
              {isActive ? (
                subscription.cancel_at_period_end ? (
                  <span className="text-orange-600">
                    Cancels on {periodEnd.toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-green-600">Active subscription</span>
                )
              ) : (
                <span className="text-gray-600">Status: {subscription.status}</span>
              )}
            </p>
          </div>

          {subscription.tier !== "free" && (
            <button
              onClick={openCustomerPortal}
              disabled={portalLoading}
              className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-white transition-colors hover:bg-gray-800"
            >
              {portalLoading ? "Loading..." : "Manage Subscription"}
              <ExternalLink className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Plan</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">{subscription.tier}</p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {subscription.cancel_at_period_end ? "Expires" : "Renews"}
              </span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {periodEnd.toLocaleDateString()}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Projects Used</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {subscription.projects_used} /{" "}
              {subscription.projects_limit === -1 ? "∞" : subscription.projects_limit}
            </p>
          </div>
        </div>
      </div>

      {subscription.tier === "free" && (
        <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 p-6">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Unlock Premium Features
          </h3>
          <p className="mb-4 text-gray-700">
            Upgrade to Developer or Expert to access detailed mitigation plans, full comparable
            analysis, and more.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            View Plans
          </Link>
        </div>
      )}

      {subscription.tier !== "free" && (
        <div className="rounded-lg border bg-gray-50 p-6">
          <h3 className="mb-3 font-semibold text-gray-900">Manage Your Subscription</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Update payment method</li>
            <li>• View billing history</li>
            <li>• Download invoices</li>
            <li>• Change or cancel subscription</li>
          </ul>
          <button
            onClick={openCustomerPortal}
            disabled={portalLoading}
            className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {portalLoading ? "Loading..." : "Open Billing Portal →"}
          </button>
        </div>
      )}
    </div>
  );
}
