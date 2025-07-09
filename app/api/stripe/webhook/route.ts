import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Use your secret key and webhook secret from .env.local
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature") as string;
  const rawBody = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed.", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case "setup_intent.succeeded":
        console.log("Setup intent succeeded", event);
        const setupIntent = event.data.object as Stripe.SetupIntent;
        const customerId = setupIntent.customer as string;
        const paymentMethodId = setupIntent.payment_method as string;

        console.log("Customer ID:", customerId);
      
        // Find the user in your DB by stripe_customer_id and update
        const supabase = await createClient();
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("stripe_customer_id", customerId)
          .single();

        console.log("Profile found:", profile);
      
        if (error) {
          console.error("Supabase error:", error);
        }
      
        if (profile) {
          await supabase
            .from("profiles")
            .update({
              payment_method_added: true,
              payment_method_id: paymentMethodId,
            })
            .eq("user_id", profile.user_id);
          console.log("Updated profile for user:", profile.user_id);
        } else {
          console.log("No profile found for customer:", customerId);
        }
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      // Update DB: update subscription status, etc.
      break;
    // ... handle other event types as needed
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Always return a 200 to Stripe
  return NextResponse.json({ received: true });
}