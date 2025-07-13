import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ subscription: null });
    }

    const { data: subscriptionData } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!subscriptionData) {
      return NextResponse.json({ subscription: null });
    }

    return NextResponse.json({ subscription: subscriptionData });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
