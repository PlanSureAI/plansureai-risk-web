import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/app/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) {
          console.warn(`Customer ${customerId} is deleted`);
          break;
        }

        const userId = customer.metadata?.user_id;

        if (!userId) {
          console.warn(`No user_id found for customer ${customerId}`);
          break;
        }

        const planTier = getPlanTierFromSubscription(subscription);

        await supabaseAdmin.from("user_subscriptions").upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          plan_tier: planTier,
          status: subscription.status,
          current_period_start: new Date(
            subscription.current_period_start * 1000
          ).toISOString(),
          current_period_end: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
        });

        console.log(`Subscription updated for user ${userId}: ${planTier}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: userSub } = await supabaseAdmin
          .from("user_subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (userSub) {
          await supabaseAdmin
            .from("user_subscriptions")
            .update({
              plan_tier: "free",
              status: "canceled",
            })
            .eq("user_id", userSub.user_id);

          console.log(`Subscription canceled for user ${userSub.user_id}`);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Payment succeeded for invoice: ${invoice.id}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Payment failed for invoice: ${invoice.id}`);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

function getPlanTierFromSubscription(
  subscription: Stripe.Subscription
): "free" | "starter" | "pro" | "enterprise" {
  const price = subscription.items.data[0]?.price;
  if (!price) return "free";

  const priceId = price.id;

  if (priceId === process.env.STRIPE_STARTER_PRICE_ID) return "starter";
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "pro";
  if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) return "enterprise";

  return "free";
}
