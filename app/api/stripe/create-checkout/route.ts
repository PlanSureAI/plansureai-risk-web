import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  try {
    // Payments kill switch for pre-launch staging.
    const paymentsEnabled = process.env.PAYMENTS_ENABLED === "true";

    if (!paymentsEnabled) {
      return NextResponse.json(
        {
          error:
            "Payments are temporarily disabled while we finalize setup. Please check back soon!",
          comingSoon: true,
        },
        { status: 503 }
      );
    }

    const { priceId, userId, userEmail } = await req.json();

    if (!priceId || !userId || !userEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    let customerId: string;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      await stripe.customers.update(customerId, {
        metadata: { user_id: userId },
      });
    } else {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { user_id: userId },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: userId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      subscription_data: {
        metadata: {
          user_id: userId,
        },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Checkout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
