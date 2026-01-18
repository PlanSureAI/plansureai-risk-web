# Stripe Integration Setup Guide

THE MONEY MAKER - Complete guide to setting up subscriptions and payments.

## Quick Start (30 minutes)

Step 1: Stripe Account Setup (5 min)

1. Create Stripe Account
Go to https://stripe.com and sign up or log in.

2. Get API Keys
Dashboard -> Developers -> API keys
Copy:
- Publishable key (starts with pk_)
- Secret key (starts with sk_)

3. Add to Environment Variables
```
# .env.local
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # We'll get this in Step 3
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Your app URL
```

Step 2: Create Products & Prices (10 min)

1. Go to Products
Stripe Dashboard -> Products -> Create product

2. Create Developer Product
Name: Developer Plan
Description: Full mitigation plans, comparable analysis, up to 10 projects
Pricing: GBP49.00 / month (recurring)
Click "Add pricing"

Copy the Price ID (starts with price_)

3. Create Expert Product
Name: Expert Plan
Description: Unlimited projects, priority support, white-label reports
Pricing: GBP149.00 / month (recurring)
Click "Add pricing"

Copy the Price ID (starts with price_)

4. Update Database
```
UPDATE tier_features
SET stripe_price_id = 'price_XXXXXXXXXXXXX'
WHERE tier = 'starter';

UPDATE tier_features
SET stripe_price_id = 'price_YYYYYYYYYYYYY'
WHERE tier = 'pro';
```

5. Update Environment Variables
```
# .env.local
STRIPE_STARTER_PRICE_ID=price_1SI4a3DveIc1wtstvmOnAwyG
STRIPE_PRO_PRICE_ID=price_1Sqos5DveIc1wtstZk4Leoeb
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

Step 3: Setup Webhooks (10 min)

1. Create Webhook Endpoint
Stripe Dashboard -> Developers -> Webhooks -> Add endpoint

Endpoint URL: https://yourdomain.com/api/webhooks/stripe
(For local dev: use Stripe CLI or ngrok)

Events to send:
- checkout.session.completed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.paid
- invoice.payment_failed

2. Get Webhook Secret
After creating endpoint, copy the signing secret (whsec_...).

3. Add to Environment
```
# .env.local
STRIPE_WEBHOOK_SECRET=whsec_...
```

4. For Local Development
```
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Step 4: Configure Customer Portal (5 min)

1. Enable Customer Portal
Stripe Dashboard -> Settings -> Billing -> Customer portal
Enable:
- Allow customers to update payment methods
- Allow customers to update subscriptions
- Allow customers to cancel subscriptions

2. Customize Portal
Business name: Your Company Name
Support email: support@yourdomain.com
Privacy policy: https://yourdomain.com/privacy
Terms of service: https://yourdomain.com/terms

Step 5: Run Database Migration

Run:
`supabase/migrations/20260302004000_stripe_subscriptions.sql`

This creates:
- user_subscriptions table
- payment_history table
- tier_features table
- auto-subscription trigger for new users

Step 6: Install Stripe Package
```
npm install stripe
```

## Testing the Integration

Test Checkout Flow
1. Go to /pricing
2. Click "Upgrade to Developer"
3. Use test card: 4242 4242 4242 4242
4. Complete payment and verify user_subscriptions updates

Test Webhook
```
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
```

Test Customer Portal
1. Go to /settings/billing
2. Click "Manage Subscription"
3. Verify portal opens and cancellation updates user_subscriptions

## Security Checklist

- Never commit secret keys to Git
- Always verify webhook signatures
- Use service role for webhook updates
- Users can only read their own subscription data

## Pricing Tiers Summary

free - GBP0/month
- 1 project
- Basic risk assessment
- Compact mitigation plans
- Compact comparable stats
- Policy citations

starter - GBP49/month
- 10 projects
- Full mitigation plans with costs
- Full comparable analysis with likelihood
- Policy citations with specialist links
- Email support

pro - GBP149/month
- Unlimited projects
- Everything in Developer
- Priority support
- Custom policy database
- White-label reports
- API access (coming soon)

## Common Issues & Fixes

Webhook not receiving events:
- Check endpoint URL and webhook secret
- Ensure endpoint is publicly accessible
- Use Stripe CLI for local testing

Subscription not updating in database:
- Check webhook logs
- Verify RLS allows service_role writes
- Ensure price_id matches tier_features table

Customer portal not opening:
- Ensure customer has stripe_customer_id
- Confirm portal is enabled in Stripe settings
