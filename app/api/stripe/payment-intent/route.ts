import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    console.log("Payment intent API called");
    
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY not found");
      return NextResponse.json({ error: "Stripe configuration missing" }, { status: 500 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User authenticated:", user.id);

    // Get user profile with Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      console.error("Profile error:", profileError);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (!profile?.stripe_customer_id) {
      console.error("No Stripe customer ID found");
      return NextResponse.json({ error: "No Stripe customer found" }, { status: 404 });
    }

    console.log("Customer ID found:", profile.stripe_customer_id);

    // Create a setup intent for $0 (just to collect payment method)
    const setupIntent = await stripe.setupIntents.create({
      customer: profile.stripe_customer_id,
      usage: "off_session", // or "on_session" depending on your use case
      metadata: {
        user_id: user.id,
        purpose: "payment_method_collection",
      },
    });

    console.log("Setup intent created:", setupIntent.id);

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
    });
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}