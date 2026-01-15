"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Stripe from "stripe";

interface PricingTier {
  name: string;
  price: number;
  description: string;
  features: string[];
  priceId: string;
  cta: string;
}

const TIERS: PricingTier[] = [
  {
    name: "Free",
    price: 0,
    description: "Perfect for getting started",
    features: [
      "3 sites maximum",
      "5 document uploads/month",
      "Basic risk scoring",
      "Watermarked exports",
      "Community support",
    ],
    priceId: "",
    cta: "Get Started",
  },
  {
    name: "Starter",
    price: 49,
    description: "For active developers",
    features: [
      "10 sites",
      "20 document uploads/month",
      "Full risk assessment",
      "Clean exports",
      "Email support",
      "Share analyses",
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || "",
    cta: "Subscribe Now",
  },
  {
    name: "Pro",
    price: 149,
    description: "For serious planning teams",
    features: [
      "Unlimited sites",
      "Unlimited uploads",
      "All Starter features",
      "Comparable approvals map",
      "Pre-app pack generator",
      "Email alerts",
      "Priority support",
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "",
    cta: "Subscribe Now",
  },
  {
    name: "Enterprise",
    price: 0,
    description: "Custom solution for teams",
    features: [
      "Everything in Pro",
      "Custom regions",
      "API access",
      "Bulk uploads",
      "Dedicated account manager",
      "SLA guarantee",
    ],
    priceId: "",
    cta: "Contact Sales",
  },
];

export function PricingPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string, tierName: string) => {
    if (!session) {
      window.location.href = "/auth/login";
      return;
    }

    if (tierName === "Enterprise") {
      window.location.href = "/contact";
      return;
    }

    if (!priceId) return;

    setLoading(priceId);

    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { sessionId } = await response.json();

      const stripe = (window as any).Stripe;
      await stripe.redirectToCheckout({ sessionId });
    } catch (error) {
      alert("Failed to start checkout: " + String(error));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600">
            Choose the plan that fits your planning needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-lg border-2 p-6 transition-all ${
                tier.name === "Pro"
                  ? "border-blue-600 bg-blue-50 scale-105"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              {tier.name === "Pro" && (
                <div className="mb-4">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{tier.description}</p>

              <div className="mb-6">
                {tier.price > 0 ? (
                  <>
                    <span className="text-4xl font-bold">£{tier.price}</span>
                    <span className="text-gray-600">/month</span>
                  </>
                ) : tier.name === "Free" ? (
                  <span className="text-4xl font-bold">Free</span>
                ) : (
                  <span className="text-2xl font-semibold text-gray-600">Custom</span>
                )}
              </div>

              <button
                onClick={() => handleSubscribe(tier.priceId, tier.name)}
                disabled={loading === tier.priceId}
                className={`w-full py-2 rounded-lg font-semibold mb-6 transition ${
                  tier.name === "Pro" || tier.name === "Starter"
                    ? "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {loading === tier.priceId ? "Processing..." : tier.cta}
              </button>

              <ul className="space-y-3">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex gap-3 text-sm">
                    <span className="text-green-600 flex-shrink-0">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <details className="border-b border-gray-200 pb-4">
              <summary className="font-semibold cursor-pointer">
                Can I cancel anytime?
              </summary>
              <p className="mt-2 text-gray-700">
                Yes, you can cancel your subscription anytime. You'll retain
                access until the end of your billing period.
              </p>
            </details>
            <details className="border-b border-gray-200 pb-4">
              <summary className="font-semibold cursor-pointer">
                Is there a free trial?
              </summary>
              <p className="mt-2 text-gray-700">
                Yes! Start with our Free plan. Upgrade to paid plans anytime.
              </p>
            </details>
            <details className="pb-4">
              <summary className="font-semibold cursor-pointer">
                Do you offer refunds?
              </summary>
              <p className="mt-2 text-gray-700">
                We offer 30 days money-back guarantee on annual subscriptions.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
