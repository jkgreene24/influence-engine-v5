"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Home, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function EmailConfirmed() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isSuccess = !error;

  useEffect(() => {
    const checkPaymentSetup = async () => {
      if (!isSuccess) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("stripe_customer_id, payment_method_added")
            .eq("user_id", user.id)
            .single();

          if (profileData) {
            setProfile(profileData);
          }
        }
      } catch (err) {
        console.error("Error checking payment setup:", err);
      } finally {
        setLoading(false);
      }
    };

    checkPaymentSetup();
  }, [isSuccess]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#92278F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card
          className={
            isSuccess
              ? "border-2 border-green-200 bg-green-50"
              : "border-2 border-red-200 bg-red-50"
          }
        >
          <CardContent className="text-center py-8">
            {isSuccess ? (
              <>
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Email Confirmed!
                </h2>
                <p className="text-gray-600 mb-6">
                  Congratulations! Your email has been successfully verified.
                  {!profile?.payment_method_added && (
                    <span className="block mt-2">
                      Now let's set up your payment method to unlock full
                      access.
                    </span>
                  )}
                </p>

                {profile?.payment_method_added ? (
                  <Button
                    onClick={() => (window.location.href = "/chat")}
                    className="bg-[#92278F] hover:bg-[#7a1f78] text-white"
                  >
                    Go to Chat
                  </Button>
                ) : (
                  <Button
                    onClick={() => (window.location.href = "/payment-setup")}
                    className="bg-[#92278F] hover:bg-[#7a1f78] text-white"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Set Up Payment
                  </Button>
                )}
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Email Confirmation Failed
                </h2>
                <p className="text-gray-600 mb-6">
                  {errorDescription ||
                    "The confirmation link is invalid or has expired. Please try again or request a new confirmation email."}
                </p>
                <Button
                  onClick={() => (window.location.href = "/")}
                  className="w-full bg-[#92278F] hover:bg-[#7a1f78] text-white"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
