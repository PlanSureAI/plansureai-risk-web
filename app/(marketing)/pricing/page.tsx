'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/app/lib/supabaseBrowser';
import { Check, Zap, Crown, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

const tiers = [
  {
    name: 'Free',
    id: 'free',
    price: '£0',
    description: 'Perfect for exploring planning requirements',
    features: [
      '1 project',
      'Basic risk assessment',
      'Policy citations',
      'Compact mitigation plans',
      'Compact comparable stats',
    ],
    cta: 'Current Plan',
    icon: Sparkles,
    highlighted: false,
  },
  {
    name: 'Starter',
    id: 'starter',
    price: '£49',
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || 'price_1SI4a3DveIc1wtstvmOnAwyG',
    description: 'For homeowners and small developers',
    features: [
      'Up to 10 projects',
      'Full risk assessment',
      'Detailed mitigation plans with costs & timelines',
      'Full comparable analysis with approval likelihood',
      'Policy citations with specialist links',
      'Email support',
      'PDF report exports',
    ],
    cta: 'Upgrade to Starter',
    icon: Zap,
    highlighted: true,
  },
  {
    name: 'Pro',
    id: 'pro',
    price: '£149',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_1Sqos5DveIc1wtstZk4Leoeb',
    description: 'For professionals and agencies',
    features: [
      'Unlimited projects',
      'Everything in Developer',
      'Priority email & chat support',
      'Custom policy database',
      'White-label PDF reports',
      'API access (coming soon)',
      'Dedicated account manager',
    ],
    cta: 'Upgrade to Pro',
    icon: Crown,
    highlighted: false,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function handleSubscribe(priceId: string, tierId: string) {
    try {
      setLoading(tierId);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirect=/pricing');
        return;
      }

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          userEmail: user.email,
        }),
      });

      const { url, error } = await response.json();

      if (error) {
        alert('Error: ' + error);
        return;
      }

      window.location.href = url;
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">Choose Your Plan</h1>
        <p className="mx-auto max-w-2xl text-xl text-gray-600">
          Get professional planning risk assessments with detailed mitigation guidance and real
          approval data.
        </p>
      </div>

      <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-3">
        {tiers.map((tier) => {
          const Icon = tier.icon;

          return (
            <div
              key={tier.id}
              className={`relative rounded-2xl border-2 p-8 ${
                tier.highlighted
                  ? 'border-blue-500 shadow-xl md:scale-105'
                  : 'border-gray-200 shadow-sm'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-blue-500 px-4 py-1 text-sm font-medium text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-4 flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                    tier.highlighted ? 'bg-blue-100' : 'bg-gray-100'
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 ${
                      tier.highlighted ? 'text-blue-600' : 'text-gray-600'
                    }`}
                  />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{tier.name}</h2>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                  {tier.price !== '£0' && <span className="text-gray-600">/month</span>}
                </div>
                <p className="mt-2 text-sm text-gray-600">{tier.description}</p>
              </div>

              <ul className="mb-8 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check
                      className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                        tier.highlighted ? 'text-blue-600' : 'text-green-600'
                      }`}
                    />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => tier.priceId && handleSubscribe(tier.priceId, tier.id)}
                disabled={!tier.priceId || loading === tier.id}
                className={`w-full rounded-lg px-6 py-3 font-medium transition-colors ${
                  tier.highlighted
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : tier.priceId
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'cursor-not-allowed bg-gray-100 text-gray-400'
                }`}
              >
                {loading === tier.id ? 'Loading...' : tier.cta}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
          Feature Comparison
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="px-4 py-4 text-left font-semibold text-gray-900">Feature</th>
                <th className="px-4 py-4 text-center font-semibold text-gray-900">Free</th>
                <th className="bg-blue-50 px-4 py-4 text-center font-semibold text-gray-900">
                  Developer
                </th>
                <th className="px-4 py-4 text-center font-semibold text-gray-900">Expert</th>
              </tr>
            </thead>
            <tbody>
              <FeatureRow feature="Projects" free="1" developer="10" expert="Unlimited" />
              <FeatureRow feature="Risk Assessment" free="Basic" developer="Full" expert="Full" />
              <FeatureRow feature="Policy Citations" free="✓" developer="✓" expert="✓" />
              <FeatureRow
                feature="Mitigation Plans (LOW/MED)"
                free="Compact"
                developer="Compact"
                expert="Compact"
              />
              <FeatureRow
                feature="Mitigation Plans (HIGH/CRITICAL)"
                free="—"
                developer="Full + Costs"
                expert="Full + Costs"
              />
              <FeatureRow
                feature="Comparable Analysis"
                free="Compact"
                developer="Full + Likelihood"
                expert="Full + Likelihood"
              />
              <FeatureRow feature="Specialist Directory Links" free="—" developer="✓" expert="✓" />
              <FeatureRow feature="PDF Reports" free="—" developer="✓" expert="White-label" />
              <FeatureRow feature="Email Support" free="—" developer="✓" expert="Priority" />
              <FeatureRow feature="API Access" free="—" developer="—" expert="Coming soon" />
            </tbody>
          </table>
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-3xl">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6">
          <FAQItem
            question="Can I cancel anytime?"
            answer="Yes! You can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your billing period."
          />
          <FAQItem
            question="What happens to my projects if I downgrade?"
            answer="Your projects and data are never deleted. If you downgrade, you'll keep access to all your projects but won't be able to create new ones above your plan limit."
          />
          <FAQItem
            question="Do you offer refunds?"
            answer="We offer a 14-day money-back guarantee. If you're not satisfied within the first 14 days, contact us for a full refund."
          />
          <FAQItem
            question="Can I upgrade or downgrade my plan?"
            answer="Yes! You can change your plan at any time. Upgrades take effect immediately, while downgrades take effect at the end of your current billing period."
          />
          <FAQItem
            question="What payment methods do you accept?"
            answer="We accept all major credit and debit cards through Stripe, our secure payment processor."
          />
        </div>
      </div>

      <div className="mt-16 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 p-8 text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Still have questions?</h2>
        <p className="mb-6 text-gray-700">
          Get in touch with our team and we will help you choose the right plan.
        </p>
        <a
          href="mailto:support@yourapp.com"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}

function FeatureRow({
  feature,
  free,
  developer,
  expert,
}: {
  feature: string;
  free: string;
  developer: string;
  expert: string;
}) {
  return (
    <tr className="border-b border-gray-100">
      <td className="px-4 py-4 text-gray-700">{feature}</td>
      <td className="px-4 py-4 text-center text-gray-600">{free}</td>
      <td className="bg-blue-50 px-4 py-4 text-center font-medium text-gray-900">
        {developer}
      </td>
      <td className="px-4 py-4 text-center text-gray-600">{expert}</td>
    </tr>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b border-gray-200 pb-6 last:border-0">
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{question}</h3>
      <p className="text-gray-700">{answer}</p>
    </div>
  );
}
