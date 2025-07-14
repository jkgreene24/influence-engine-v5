"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Lock, AlertCircle, Loader2, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loadStripe } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// Load Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface PaymentSetupFormProps {
  clientSecret: string;
  onSuccess: () => void;
}

function PaymentSetupForm({ clientSecret, onSuccess }: PaymentSetupFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: submitError } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
    });

    if (submitError) {
      setError(submitError.message || "Payment Setup Failed");
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <PaymentElement />

      <Button
        type="submit"
        disabled={loading || !stripe}
        className="w-full bg-[#92278F] hover:bg-[#7a1f78] text-white h-12"
      >
        {loading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Secure Payment Setup</span>
          </div>
        )}
      </Button>
    </form>
  );
}

export default function PaymentSetup() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const initializePayment = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          window.location.href = "/auth/signin";
          return;
        }

        setUser(user);

        // Get user profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }

        // Create Stripe customer if doesn't exist
        console.log("Creating Stripe customer...");
        const customerResponse = await fetch("/api/stripe/customer", {
          method: "POST",
        });

        console.log("Customer response status:", customerResponse.status);

        if (!customerResponse.ok) {
          const errorData = await customerResponse.json();
          console.error("Customer creation error:", errorData);
          throw new Error(
            `Failed to create customer: ${
              errorData.error || customerResponse.statusText
            }`
          );
        }

        const customerData = await customerResponse.json();
        console.log("Customer created:", customerData);

        // Create payment intent
        console.log("Creating payment intent...");
        const paymentIntentResponse = await fetch(
          "/api/stripe/payment-intent",
          {
            method: "POST",
          }
        );

        console.log(
          "Payment intent response status:",
          paymentIntentResponse.status
        );

        if (!paymentIntentResponse.ok) {
          const errorData = await paymentIntentResponse.json();
          console.error("Payment intent error:", errorData);
          throw new Error(
            `Failed to create payment intent: ${
              errorData.error || paymentIntentResponse.statusText
            }`
          );
        }

        const { clientSecret } = await paymentIntentResponse.json();
        console.log("Payment intent created, client secret received");
        setClientSecret(clientSecret);
      } catch (err) {
        console.error("Error initializing payment:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to initialize payment setup"
        );
      } finally {
        setLoading(false);
      }
    };

    initializePayment();
  }, []);

  const handleSuccess = () => {
    // Redirect to chat or dashboard
    router.push("/chat");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#92278F]" />
          <p className="text-gray-600">Setting up payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card className="border-2 border-red-200 bg-red-50">
            <CardContent className="text-center py-8">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Setup Error
              </h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-[#92278F] hover:bg-[#7a1f78] text-white"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-[#92278F] rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Setup
          </h2>
          <p className="text-gray-600">
            Add your payment method to unlock full access
          </p>
        </div>

        {/* User Info */}
        {profile && (
          <Card className="border-2 border-[#92278F]/20 bg-[#92278F]/5">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[#92278F] flex items-center justify-center text-white font-bold">
                  {profile.first_name?.[0]}
                  {profile.last_name?.[0]}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {profile.first_name} {profile.last_name}
                  </h3>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-[#92278F]" />
              <span>Payment Method</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clientSecret ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "stripe",
                    variables: {
                      colorPrimary: "#92278F",
                    },
                  },
                }}
              >
                <PaymentSetupForm
                  clientSecret={clientSecret}
                  onSuccess={handleSuccess}
                />
              </Elements>
            ) : (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#92278F]" />
                <p className="text-gray-600">Loading payment form...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Shield className="w-4 h-4" />
            <span>Your payment information is secure and encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
