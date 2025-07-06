import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

const upsertUserProfile = async (supabase: any, user: any) => {
  try {
    // Extract metadata from auth user
    const userMetadata = user.user_metadata || {};
    const { first_name, last_name } = userMetadata;

    // Prepare profile data for upsert
    const profileData = {
      user_id: user.id,
      first_name: first_name || "",
      last_name: last_name || "",
      email: user.email || "",
      updated_at: new Date().toISOString(),
    };

    // Upsert the profile data
    const { data, error: upsertError } = await supabase
      .from("profiles")
      .upsert(profileData, {
        onConflict: "user_id",
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (upsertError) {
      console.error("Error upserting profile:", upsertError);
      return null;
    } else {
      console.log("Profile upserted successfully");
      return data;
    }
  } catch (err) {
    console.error("Error in upsertUserProfile:", err);
    return null;
  }
};

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    return NextResponse.redirect(`${origin}/auth/email-confirmed?error=${error}&error_description=${errorDescription}`);
  }

  if (!code) {
    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }
  const supabase = await createClient();
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  
  if (!exchangeError && data?.user) {
    // This is likely an email confirmation
    // Upsert user profile with metadata from auth/users table
    await upsertUserProfile(supabase, data.user);
    // Redirect to email confirmation result page
    return NextResponse.redirect(`${origin}/auth/email-confirmed`);
  }
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}