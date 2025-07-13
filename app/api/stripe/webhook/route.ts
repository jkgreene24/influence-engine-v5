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
    case "payment_method.detached":
      console.log("Payment method detached", event);
      const paymentMethodDetached = event.data.object as Stripe.PaymentMethod;
      console.log("Payment method:", paymentMethodDetached);

      // Find the user in your DB by stripe_customer_id and update
      const supabaseDetached = await createClient();
      const { data: profileDetached, error: errorDetached } = await supabaseDetached
        .from("profiles")
        .select("*")
        .eq("payment_method_id", paymentMethodDetached.id)
        .single();

      console.log("Profile found:", profileDetached);

      if (errorDetached) {
        console.error("Supabase error:", errorDetached);
      }

      if (profileDetached) {
        await supabaseDetached
          .from("profiles")
          .update({
            payment_method_added: false,
            payment_method_id: null,
            subscription_status: false,
          })
          .eq("user_id", profileDetached.user_id);
        console.log("Updated profile for user:", profileDetached.user_id);
      }
      break;
    case "payment_method.attached":
        console.log("Payment method attached", event);
        const paymentMethodAttached = event.data.object as Stripe.PaymentMethod;
        const customerId = paymentMethodAttached.customer as string;
        console.log("Customer ID:", customerId);

        // Find the user in your DB by stripe_customer_id and update
        const supabaseAttached = await createClient();
        const { data: profileAttached, error: errorAttached } = await supabaseAttached
          .from("profiles")
          .select("*")
          .eq("stripe_customer_id", customerId)
          .single();

        console.log("Profile found:", profileAttached);

        if (errorAttached) {
          console.error("Supabase error:", errorAttached);
        }

        if (profileAttached) {
          await supabaseAttached
            .from("profiles")
            .update({
              payment_method_added: true,
              payment_method_id: paymentMethodAttached.id,
            })
            .eq("user_id", profileAttached.user_id);
          const paymentMethodData = {
            user_id: profileAttached.user_id,
            stripe_payment_method_id: paymentMethodAttached.id,
            card_brand: paymentMethodAttached.card?.brand,
            card_last4: paymentMethodAttached.card?.last4,
            card_exp_month: paymentMethodAttached.card?.exp_month,
            card_exp_year: paymentMethodAttached.card?.exp_year,
            card_funding: paymentMethodAttached.card?.funding,
          }
          await supabaseAttached
            .from("payment_methods")
            .insert(paymentMethodData);
          console.log("Updated profile for user:", profileAttached.user_id);
        } else {
          console.log("No profile found for customer:", customerId);
        }
      break;
    case "payment_method.updated":
      console.log("Payment method updated", event);
      const paymentMethodUpdated = event.data.object as Stripe.PaymentMethod;
      const paymentMethodCustomerId = paymentMethodUpdated.customer as string;
      console.log("Payment method updated for customer:", paymentMethodCustomerId);
      const supabaseUpdated = await createClient();
      const { data: profileUpdated, error: errorUpdated } = await supabaseUpdated
        .from("profiles")
        .select("*")
        .eq("stripe_customer_id", paymentMethodCustomerId)
        .single();
      if (errorUpdated) {
        console.error("Supabase error fetching profile with customer id:", errorUpdated);
      }
      if (profileUpdated) {
        const { data: paymentMethodUpdatedData, error: paymentMethodUpdatedError } = await supabaseUpdated
          .from("payment_methods")
          .select("*")
          .eq("user_id", profileUpdated.user_id)
          .single();
        if (paymentMethodUpdatedError) {
          console.error("Supabase error fetching payment method with user id:", paymentMethodUpdatedError);
        }
        if (paymentMethodUpdatedData) {
          await supabaseUpdated
            .from("payment_methods")
            .update({
              stripe_payment_method_id: paymentMethodUpdated.id,
              card_exp_month: paymentMethodUpdated.card?.exp_month,
              card_exp_year: paymentMethodUpdated.card?.exp_year,
            })
            .eq("stripe_payment_method_id", paymentMethodUpdated.id);
          console.log("Updated payment method for user:", profileUpdated.user_id);
        } else {
          await supabaseUpdated
            .from("payment_methods")
            .insert({
              user_id: profileUpdated.user_id,
              stripe_payment_method_id: paymentMethodUpdated.id,
              card_brand: paymentMethodUpdated.card?.brand,
              card_last4: paymentMethodUpdated.card?.last4,
              card_exp_month: paymentMethodUpdated.card?.exp_month,
              card_exp_year: paymentMethodUpdated.card?.exp_year,
              card_funding: paymentMethodUpdated.card?.funding,
            });
          console.log("New payment method found for user:", profileUpdated.user_id);
        }
        console.log("Updated payment method for user:", profileUpdated.user_id);
      } else {
        console.log("No profile found for customer:", paymentMethodCustomerId);
      }
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
      console.log("Subscription created/updated", event);
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionCustomerId = subscription.customer as string;

      // Find the user in your DB by stripe_customer_id and update
      const supabaseSub = await createClient();
      const { data: profileSub, error: subError } = await supabaseSub
        .from("profiles")
        .select("*")
        .eq("stripe_customer_id", subscriptionCustomerId)
        .single();

      if (subError) {
        console.error("Supabase error:", subError);
        break;
      }

      if (profileSub) {
        // Update subscription status based on subscription status
        const isActive = subscription.status === "active" || subscription.status === "trialing";
        await supabaseSub
          .from("profiles")
          .update({
            subscription_status: isActive,
            trial_ended: subscription.status === "active" ? true : profileSub.trial_ended,
          })
          .eq("user_id", profileSub.user_id);
        console.log("Updated subscription status for user:", profileSub.user_id);
      }
      const subscriptionData = {
        subscription_id: subscription.id,
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        amount: subscription.items.data[0]?.price.unit_amount,
        currency: subscription.items.data[0]?.price.currency,
        interval: subscription.items.data[0]?.price.recurring?.interval,
        cancel_at_period_end: subscription.cancel_at_period_end,
        user_id: profileSub.user_id,
      }
      const { data: newSub, error: newSubError } = await supabaseSub.from("subscriptions").select("*").eq("user_id", profileSub.user_id).single();
      if (newSubError) {
        console.error("Supabase error:", newSubError);
      }
      if (newSub) {
        const { data: updatedSub, error: updateError } = await supabaseSub.from("subscriptions").update(subscriptionData).eq("user_id", profileSub.user_id);
        if (updateError) {
          console.error("Supabase error:", updateError);
        }
        console.log("Updated subscription for user:", newSub.user_id);
      } else {
        const { data: newSub, error: insertError } = await supabaseSub.from("subscriptions").insert(subscriptionData).select().single();
        if (insertError) {
          console.error("Supabase error:", insertError);
        }
        console.log("New subscription for user:", newSub.user_id);
      }
      break;
    case "customer.subscription.deleted":
      console.log("Subscription deleted", event);
      const deletedSubscription = event.data.object as Stripe.Subscription;
      const deletedCustomerId = deletedSubscription.customer as string;

      // Find the user in your DB by stripe_customer_id and update
      const supabaseDelete = await createClient();
      const { data: profileDelete, error: deleteError } = await supabaseDelete
        .from("profiles")
        .select("*")
        .eq("stripe_customer_id", deletedCustomerId)
        .single();

      if (deleteError) {
        console.error("Supabase error:", deleteError);
        break;
      }

      if (profileDelete) {
        // Set subscription status to false when subscription is deleted
        await supabaseDelete
          .from("profiles")
          .update({
            subscription_status: false,
          })
          .eq("user_id", profileDelete.user_id);
        console.log("Updated subscription status to false for user:", profileDelete.user_id);
      }
      break;
    // ... handle other event types as needed
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Always return a 200 to Stripe
  return NextResponse.json({ received: true });
}