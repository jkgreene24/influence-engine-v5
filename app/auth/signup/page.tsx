"use client";

import React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  UserPlus,
  Mail,
  Lock,
  User,
  Zap,
  Users,
  Anchor,
  Link,
  Navigation,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

interface InfluenceStyle {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const influenceStyles: InfluenceStyle[] = [
  {
    id: "catalyst",
    name: "Catalyst",
    icon: <Zap className="w-5 h-5" />,
    color: "bg-orange-500",
    description:
      "Energetic change-makers who inspire action and drive innovation",
  },
  {
    id: "diplomat",
    name: "Diplomat",
    icon: <Users className="w-5 h-5" />,
    color: "bg-blue-500",
    description:
      "Skilled negotiators who build consensus and foster collaboration",
  },
  {
    id: "anchor",
    name: "Anchor",
    icon: <Anchor className="w-5 h-5" />,
    color: "bg-green-500",
    description: "Steady leaders who provide stability and reliable guidance",
  },
  {
    id: "connector",
    name: "Connector",
    icon: <Link className="w-5 h-5" />,
    color: "bg-purple-500",
    description:
      "Natural networkers who bridge relationships and create opportunities",
  },
  {
    id: "navigator",
    name: "Navigator",
    icon: <Navigation className="w-5 h-5" />,
    color: "bg-red-500",
    description:
      "Strategic thinkers who chart the course and guide others forward",
  },
];

export default function SignUp() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const searchParams = useSearchParams();
  const primaryStyle = searchParams.get("primary_style") || "";
  const secondaryStyle = searchParams.get("secondary_style") || "";

  // Get style information
  const primaryStyleInfo = influenceStyles.find((s) => s.id === primaryStyle);
  const secondaryStyleInfo = influenceStyles.find(
    (s) => s.id === secondaryStyle
  );

  // Add this test function to verify Supabase connection
  const testSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("count", { count: "exact" });
      console.log("Supabase connection test:", { data, error });
    } catch (err) {
      console.error("Supabase connection failed:", err);
    }
  };

  // Call this when component mounts
  React.useEffect(() => {
    testSupabaseConnection();
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setError("First name and last name are required");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: `${firstName.trim()} ${lastName.trim()}`, // Keep for compatibility
            primary_influence_style: primaryStyle || null,
            secondary_influence_style: secondaryStyle || null,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      // Add more detailed logging
      console.log("Signup response:", { data, error });

      if (error) {
        console.error("Signup error:", error);
        setError(error.message);
      } else {
        console.log("Signup successful:", data);
        setSuccess(true);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getInfluenceStyleDisplay = () => {
    if (!primaryStyleInfo) return null;

    if (secondaryStyleInfo) {
      return (
        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center space-x-3">
            <div
              className={`w-12 h-12 rounded-full ${primaryStyleInfo.color} flex items-center justify-center text-white`}
            >
              {primaryStyleInfo.icon}
            </div>
            <div className="flex flex-col items-center justify-center h-12">
              <span className="text-lg font-medium text-gray-500">+</span>
            </div>
            <div
              className={`w-12 h-12 rounded-full ${secondaryStyleInfo.color} flex items-center justify-center text-white`}
            >
              {secondaryStyleInfo.icon}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {primaryStyleInfo.name} + {secondaryStyleInfo.name}
            </h3>
            <p className="text-sm text-gray-600">Blended Influence Style</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border">
        <div
          className={`w-12 h-12 rounded-full ${primaryStyleInfo.color} flex items-center justify-center text-white`}
        >
          {primaryStyleInfo.icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">
            {primaryStyleInfo.name}
          </h3>
          <p className="text-sm text-gray-600">Primary Influence Style</p>
        </div>
      </div>
    );
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="text-center py-8">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Check your email!
              </h2>
              <p className="text-gray-600 mb-6">
                We've sent you a confirmation link at <strong>{email}</strong>.
                Please check your email and click the link to activate your
                account.
              </p>
              {primaryStyleInfo && (
                <div className="mb-4">{getInfluenceStyleDisplay()}</div>
              )}
              <Button
                onClick={() => router.push("/")}
                className="bg-[#92278F] hover:bg-[#7a1f78]"
              >
                Back to Home
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
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-6 text-gray-600 hover:text-[#92278F]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Create your account
          </h2>
          <p className="text-gray-600">
            Join us with your unique influence style
          </p>
        </div>

        {/* Influence Style Display */}
        {primaryStyleInfo && (
          <Card className="border-2 border-[#92278F]/20 bg-[#92278F]/5">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="w-5 h-5 text-[#92278F]" />
                <span className="text-sm font-medium text-gray-700">
                  Your Influence Style
                </span>
              </div>
              {getInfluenceStyleDisplay()}
            </CardContent>
          </Card>
        )}

        {/* Signup Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="firstName"
                    className="text-sm font-medium text-gray-700"
                  >
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="lastName"
                    className="text-sm font-medium text-gray-700"
                  >
                    Last Name
                  </label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Password Fields */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#92278F] hover:bg-[#7a1f78] text-white"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating account...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account</span>
                  </div>
                )}
              </Button>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Button
                  variant="link"
                  onClick={() => router.push("/auth/signin")}
                  className="text-[#92278F] hover:text-[#7a1f78] p-0 h-auto"
                >
                  Sign in
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
