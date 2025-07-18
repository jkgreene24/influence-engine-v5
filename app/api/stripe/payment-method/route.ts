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

    // Get user's profile with payment method ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("payment_method_id, payment_method_added")
      .eq("user_id", user.id)
      .single();

    if (!profile?.payment_method_id || !profile?.payment_method_added) {
      return NextResponse.json({ payment_method: null });
    }

    // Fetch payment method details from Supabase
    const paymentMethod = await supabase
      .from("payment_methods")
      .select("*")
      .eq("stripe_payment_method_id", profile.payment_method_id)
      .single();

    if (!paymentMethod.data) {
      return NextResponse.json({ payment_method: null });
    }

    const paymentMethodData = {
      brand: paymentMethod.data.card_brand,
      last4: paymentMethod.data.card_last4,
      exp_month: paymentMethod.data.card_exp_month,
      exp_year: paymentMethod.data.card_exp_year,
      funding: paymentMethod.data.card_funding,
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