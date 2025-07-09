import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    console.log("Customer API called");
    
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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      console.error("Profile error:", profileError);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    console.log("Profile found:", profile.user_id);

    // Check if user already has a Stripe customer ID
    if (profile.stripe_customer_id) {
      console.log("Customer already exists:", profile.stripe_customer_id);
      return NextResponse.json({ 
        customerId: profile.stripe_customer_id,
        message: "Customer already exists" 
      });
    }

    // Create Stripe customer
    console.log("Creating Stripe customer...");
    const customer = await stripe.customers.create({
      email: user.email!,
      metadata: {
        user_id: user.id,
      },
    });

    console.log("Stripe customer created:", customer.id);

    // Update profile with Stripe customer ID
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        stripe_customer_id: customer.id,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    console.log("Profile updated with customer ID");

    return NextResponse.json({ 
      customerId: customer.id,
      message: "Customer created successfully" 
    });
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}