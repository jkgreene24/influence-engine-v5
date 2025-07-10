import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { priceId } = await request.json();

    if (!priceId) {
      return NextResponse.json(
        { error: "Price ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile with Stripe customer ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, payment_method_id")
      .eq("user_id", user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe customer found" },
        { status: 404 }
      );
    }

    if (!profile?.payment_method_id) {
      return NextResponse.json(
        { error: "No payment method found" },
        { status: 404 }
      );
    }

    // Create subscription with allow_incomplete behavior
    const subscription = await stripe.subscriptions.create({
      customer: profile.stripe_customer_id,
      items: [{ price: priceId }],
      default_payment_method: profile.payment_method_id,
      payment_behavior: "allow_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"], // Add this line
    });

    // Return different responses based on subscription status
    if (subscription.status === "active") {
      // Update database when subscription is active
      const { data: updatedProfile } = await supabase
      .from("profiles")
      .update({
        subscription_status: true,
        trial_ended: true,
      })
      .eq("user_id", user.id)
      .select()
      .single();

      return NextResponse.json({
        success: true,
        subscriptionId: subscription.id,
        status: subscription.status,
        message: "Subscription activated successfully!",
        profile: {
          subscription_status: updatedProfile?.subscription_status,
          trial_ended: updatedProfile?.trial_ended,
        },
      });
    } else if (subscription.status === "incomplete") {
      return NextResponse.json({
        success: false,
        subscriptionId: subscription.id,
        status: subscription.status,
        message: "Payment failed. Please check your payment method and try again.",
        requiresAction: true,
        clientSecret: ((subscription.latest_invoice as Stripe.Invoice)?.payment_intent as Stripe.PaymentIntent)?.client_secret,
      });
    } else if (subscription.status === "past_due") {
      return NextResponse.json({
        success: false,
        subscriptionId: subscription.id,
        status: subscription.status,
        message: "Payment is past due. Please update your payment method.",
      });
    } else {
      return NextResponse.json({
        success: false,
        subscriptionId: subscription.id,
        status: subscription.status,
        message: "Subscription created but payment requires additional action.",
      });
    }
  } catch (error) {
    console.error("Error creating subscription:", error);
    
    // Handle specific Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      if (error.code === 'card_declined') {
        return NextResponse.json(
          { 
            error: "Payment method was declined. Please try a different card.",
            code: error.code 
          },
          { status: 400 }
        );
      } else if (error.code === 'insufficient_funds') {
        return NextResponse.json(
          { 
            error: "Insufficient funds. Please try a different payment method.",
            code: error.code 
          },
          { status: 400 }
        );
      } else if (error.code === 'expired_card') {
        return NextResponse.json(
          { 
            error: "Your card has expired. Please update your payment method.",
            code: error.code 
          },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Failed to create subscription. Please try again." },
      { status: 500 }
    );
  }
}