import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

    // Get user's profile with payment method ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("payment_method_id, payment_method_added")
      .eq("user_id", user.id)
      .single();

    if (!profile?.payment_method_id || !profile?.payment_method_added) {
      return NextResponse.json({ payment_method: null });
    }

    // Fetch payment method details from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(
      profile.payment_method_id
    );

    if (!paymentMethod.card) {
      return NextResponse.json({ payment_method: null });
    }

    const paymentMethodData = {
      brand: paymentMethod.card.brand,
      last4: paymentMethod.card.last4,
      exp_month: paymentMethod.card.exp_month,
      exp_year: paymentMethod.card.exp_year,
      funding: paymentMethod.card.funding,
    };

    return NextResponse.json({ payment_method: paymentMethodData });
  } catch (error) {
    console.error("Error fetching payment method:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}