import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's Stripe customer ID from your database
    // You'll need to store this when creating the customer
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ subscription: null });
    }

    // Get subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: "all",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ subscription: null });
    }

    const subscription = subscriptions.data[0] as Stripe.Subscription;

    // Get payment method details
    let paymentMethod = null;
    if (subscription.default_payment_method) {
      const pm = await stripe.paymentMethods.retrieve(
        subscription.default_payment_method as string
      );
      if (pm.card) {
        paymentMethod = {
          brand: pm.card.brand,
          last4: pm.card.last4,
          exp_month: pm.card.exp_month,
          exp_year: pm.card.exp_year,
        };
      }
    }

    const subscriptionData = {
      id: subscription.id,
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      amount: subscription.items.data[0]?.price.unit_amount || 0,
      currency: subscription.items.data[0]?.price.currency || "usd",
      interval: subscription.items.data[0]?.price.recurring?.interval || "month",
      trial_end: subscription.trial_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      payment_method: paymentMethod,
    };

    return NextResponse.json({ subscription: subscriptionData });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
