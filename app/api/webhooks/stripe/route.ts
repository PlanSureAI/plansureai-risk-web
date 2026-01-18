import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/app/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const supabase = supabaseAdmin;

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session, supabase);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription, supabase);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, supabase);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice, supabase);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoiceFailed(invoice, supabase);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: typeof supabaseAdmin
) {
  const { subscription, client_reference_id } = session;

  if (!subscription || !client_reference_id) return;

  const subscriptionData = await stripe.subscriptions.retrieve(subscription as string);

  await updateUserSubscription(client_reference_id, subscriptionData, supabase);
}

async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription,
  supabase: typeof supabaseAdmin
) {
  const userId = subscription.metadata.user_id;
  if (!userId) {
    console.error("No user_id in subscription metadata");
    return;
  }

  await updateUserSubscription(userId, subscription, supabase);
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: typeof supabaseAdmin
) {
  const userId = subscription.metadata.user_id;
  if (!userId) return;

  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      tier: "free",
      status: "canceled",
      stripe_subscription_id: null,
      canceled_at: new Date().toISOString(),
      projects_limit: 1,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating canceled subscription:", error);
  }
}

async function handleInvoicePaid(
  invoice: Stripe.Invoice,
  supabase: typeof supabaseAdmin
) {
  const { customer, subscription, amount_paid, id, hosted_invoice_url } = invoice;

  if (!subscription) return;

  const customerData = await stripe.customers.retrieve(customer as string);
  if (customerData.deleted) return;

  const userId = customerData.metadata.user_id;
  if (!userId) return;

  const { error } = await supabase.from("payment_history").insert({
    user_id: userId,
    stripe_invoice_id: id,
    amount: amount_paid,
    currency: invoice.currency.toUpperCase(),
    status: "succeeded",
    description: invoice.description || "Subscription payment",
    receipt_url: hosted_invoice_url,
  });

  if (error) {
    console.error("Error recording payment:", error);
  }
}

async function handleInvoiceFailed(
  invoice: Stripe.Invoice,
  supabase: typeof supabaseAdmin
) {
  const { customer, subscription } = invoice;

  if (!subscription) return;

  const customerData = await stripe.customers.retrieve(customer as string);
  if (customerData.deleted) return;

  const userId = customerData.metadata.user_id;
  if (!userId) return;

  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating past_due subscription:", error);
  }
}

async function updateUserSubscription(
  userId: string,
  subscription: Stripe.Subscription,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
) {
  const priceId = subscription.items.data[0]?.price.id;

  const { data: tierData } = await supabase
    .from("tier_features")
    .select("tier, projects_limit")
    .eq("stripe_price_id", priceId)
    .single();

  const tier = tierData?.tier || "free";
  const projectsLimit = tierData?.projects_limit || 1;

  const { error } = await supabase.from("user_subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      tier,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      projects_limit: projectsLimit,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }
}
