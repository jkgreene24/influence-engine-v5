"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Check,
  Crown,
  CreditCard,
  Calendar,
  DollarSign,
  AlertTriangle,
  Loader2,
  Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface SubscriptionData {
  id: string;
  status: string;
  current_period_end: number;
  current_period_start: number;
  amount: number;
  currency: string;
  interval: string;
  trial_end?: number;
  cancel_at_period_end: boolean;
  payment_method?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    funding?: string;
  };
}

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    interval: "forever",
    description: "Perfect for getting started",
    features: [
      "5 AI conversations per day",
      "Basic influence style coaching",
      "Email support",
      "Community access",
    ],
    popular: false,
    stripePriceId: null,
  },
  {
    id: "monthly",
    name: "Monthly",
    price: 9.99,
    interval: "month",
    description: "Full access with monthly billing",
    features: [
      "Unlimited AI conversations",
      "Advanced influence style coaching",
      "Personalized recommendations",
      "Priority support",
      "Advanced analytics",
      "Custom coaching plans",
    ],
    popular: true,
    stripePriceId: "price_monthly_999",
  },
  {
    id: "yearly",
    name: "Yearly",
    price: 99.9,
    interval: "year",
    description: "Best value with annual billing",
    features: [
      "Everything in Monthly",
      "2 months free (save $19.9)",
      "Exclusive yearly features",
      "1-on-1 coaching session",
      "Advanced reporting",
      "API access",
    ],
    popular: false,
    stripePriceId: "price_yearly_999",
    savings: "Save $19.9",
  },
];

export default function Subscription() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUser(user);

          // Fetch profile data
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();
          if (profileData) {
            setProfile(profileData);
          }

          // Fetch subscription status from Stripe
          const subscriptionResponse = await fetch(
            "/api/stripe/subscription/status"
          );
          if (subscriptionResponse.ok) {
            const data = await subscriptionResponse.json();
            setSubscriptionData(data.subscription);
          } else {
            console.error("Failed to fetch subscription data");
          }

          // Fetch payment method details from Stripe
          const paymentMethodResponse = await fetch(
            "/api/stripe/payment-method"
          );
          if (paymentMethodResponse.ok) {
            const data = await paymentMethodResponse.json();
            setPaymentMethod(data.payment_method);
          } else {
            console.error("Failed to fetch payment method data");
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load subscription information");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndData();
  }, []);

  // Show upgrade notification if redirected from middleware
  useEffect(() => {
    const upgradeParam = searchParams.get("upgrade");
    if (upgradeParam === "true") {
      toast({
        title: "Trial Ended",
        description: "Please upgrade your plan to continue using the service.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  const getUserInitials = () => {
    // First try to get initials from profile data
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }

    // Fallback to auth metadata
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name[0]}${user.user_metadata.last_name[0]}`.toUpperCase();
    }

    // Fallback to full name
    if (user?.user_metadata?.full_name) {
      const names = user.user_metadata.full_name.split(" ");
      return names.length > 1
        ? `${names[0][0]}${names[1][0]}`.toUpperCase()
        : names[0][0].toUpperCase();
    }

    // Final fallback to email
    if (user?.email) {
      return user.email[0].toUpperCase();
    }

    return "U";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Active
          </Badge>
        );
      case "trialing":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            Trial
          </Badge>
        );
      case "past_due":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Past Due
          </Badge>
        );
      case "canceled":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Canceled
          </Badge>
        );
      case "incomplete":
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
            Incomplete
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            Free
          </Badge>
        );
    }
  };

  const getPlanStatus = () => {
    if (currentPlan.id === "free" && profile?.trial_ended) {
      return "canceled";
    }
    return subscriptionData?.status || "free";
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getCurrentPlan = () => {
    if (!subscriptionData) return plans[0]; // Free plan

    if (subscriptionData.interval === "month") {
      return plans.find((p) => p.id === "monthly") || plans[0];
    } else if (subscriptionData.interval === "year") {
      return plans.find((p) => p.id === "yearly") || plans[0];
    }

    return plans[0];
  };

  const handleSubscribe = async (planId: string) => {
    if (planId === "free") return;

    try {
      const plan = plans.find((p) => p.id === planId);
      if (!plan?.stripePriceId) return;

      const response = await fetch("/api/stripe/subscription/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating subscription:", error);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/signin");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#92278F]" />
          <p className="text-gray-600">Loading subscription information...</p>
        </div>
      </div>
    );
  }

  const currentPlan = getCurrentPlan();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => (window.location.href = "/chat")}
              className="text-gray-600 hover:text-[#92278F]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Chat
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="text-gray-600 border-gray-300 hover:bg-gray-100"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Current Plan Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-[#92278F]" />
              <span>Current Plan</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-[#92278F] flex items-center justify-center text-white font-bold text-xl">
                  {user?.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url || "/placeholder.svg"}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    getUserInitials()
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {currentPlan.name} Plan
                  </h3>
                  <p className="text-gray-600">{currentPlan.description}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {getStatusBadge(getPlanStatus())}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {currentPlan.price === 0 ? "Free" : `$${currentPlan.price}`}
                  {currentPlan.price > 0 && (
                    <span className="text-sm text-gray-500">
                      /{currentPlan.interval}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Subscription Details */}
            {subscriptionData && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Subscription ID</p>
                      <p className="font-medium text-gray-900">
                        {subscriptionData.id.slice(-8)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Next Billing</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(subscriptionData.current_period_end)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="font-medium text-gray-900">
                        {formatAmount(
                          subscriptionData.amount,
                          subscriptionData.currency
                        )}{" "}
                        / {subscriptionData.interval}
                      </p>
                    </div>
                  </div>

                  {subscriptionData.payment_method && (
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Payment Method</p>
                        <p className="font-medium text-gray-900">
                          {subscriptionData.payment_method.brand.toUpperCase()}{" "}
                          ****
                          {subscriptionData.payment_method.last4}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {subscriptionData.cancel_at_period_end && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Subscription Ending
                      </p>
                      <p className="text-sm text-yellow-700">
                        Your subscription will end on{" "}
                        {formatDate(subscriptionData.current_period_end)}.
                        You'll still have access until then.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Choose Your Plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative ${
                  plan.popular ? "shadow-lg" : "border-gray-200"
                } ${
                  currentPlan.id === plan.id
                    ? "ring-2 ring-[#92278F] ring-opacity-50"
                    : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-[#92278F] text-white px-3 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                {plan.savings && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-green-500 text-white px-2 py-1 text-xs">
                      {plan.savings}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {plan.name}
                  </CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {`$${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-500">/{plan.interval}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={currentPlan.id === plan.id}
                    className={`w-full ${
                      plan.popular
                        ? "bg-[#92278F] hover:bg-[#7a1f78] text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                    } ${
                      currentPlan.id === plan.id
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {currentPlan.id === plan.id
                      ? "Current Plan"
                      : plan.price === 0
                      ? "Current Plan"
                      : "Upgrade"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Billing Information */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Email</span>
                <span className="font-medium">{user?.email}</span>
              </div>

              {/* Payment Method Display - Show regardless of subscription */}
              {paymentMethod ? (
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {/* Card Brand Icon */}
                  <div className="flex-shrink-0">
                    {(() => {
                      const brand = paymentMethod.brand.toLowerCase();
                      switch (brand) {
                        case "visa":
                          return (
                            <img
                              src="/card-logos/visa.svg"
                              alt="Visa"
                              className="w-10 h-7"
                            />
                          );
                        case "mastercard":
                          return (
                            <img
                              src="/card-logos/mastercard.svg"
                              alt="Mastercard"
                              className="w-10 h-7"
                            />
                          );
                        case "amex":
                        case "american express":
                          return (
                            <img
                              src="/card-logos/amex.svg"
                              alt="American Express"
                              className="w-10 h-7"
                            />
                          );
                        default:
                          return (
                            <div className="w-10 h-7 flex items-center justify-center bg-gray-200 rounded">
                              <span className="text-xs text-gray-500 uppercase">
                                {brand}
                              </span>
                            </div>
                          );
                      }
                    })()}
                  </div>

                  {/* Card Details */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-700 text-sm">
                        Payment Method:
                      </span>
                      <span className="font-medium text-base">
                        {paymentMethod.brand.toUpperCase()} ****
                        {paymentMethod.last4}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-gray-700 text-sm">Expires:</span>
                      <span className="font-medium text-sm">
                        {String(paymentMethod.exp_month).padStart(2, "0")}/
                        {paymentMethod.exp_year}
                      </span>
                    </div>
                  </div>

                  {/* Card Type Chip */}
                  <div>
                    <span className="inline-block px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded">
                      {paymentMethod.funding
                        ? paymentMethod.funding.charAt(0).toUpperCase() +
                          paymentMethod.funding.slice(1)
                        : "Card"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-10 h-7 flex items-center justify-center bg-gray-200 rounded">
                    <span className="text-xs text-gray-400">N/A</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-gray-500 text-sm">
                      No payment method on file.
                    </span>
                  </div>
                </div>
              )}

              {/* <div className="pt-4 border-t border-gray-200">
                <Button variant="outline" className="w-full bg-transparent">
                  Update Payment Method
                </Button>
              </div> */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
