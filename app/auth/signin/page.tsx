"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Eye, EyeOff, LogIn, Mail, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upsertUserProfile = async (user: any) => {
    try {
      // Extract metadata from auth user
      const userMetadata = user.user_metadata || {};
      const { first_name, last_name } = userMetadata;

      // Prepare profile data for upsert
      const profileData = {
        user_id: user.id,
        first_name: first_name,
        last_name: last_name,
        email: user.email,
        updated_at: new Date().toISOString(),
      };

      // Upsert the profile data
      const { data, error } = await supabase
        .from("profiles")
        .upsert(profileData, {
          onConflict: "user_id",
          ignoreDuplicates: false,
        })
        .select()
        .single();
      return data;
    } catch (err) {
      console.error("Error in upsertUserProfile:", err);
      // Don't throw error here as it's not critical for signin
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        // Redirect to dashboard or chat
        const profile = await upsertUserProfile(data.user);
        if (profile.is_admin) {
          window.location.href = "/admin";
        } else {
          window.location.href = "/chat";
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

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
          <img
            src="/logo.png"
            alt="Logo"
            className="w-16 h-16 rounded-full mx-auto mb-4"
          />
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            Welcome back
          </h2>
          <p className="mt-2 text-gray-600">
            Sign in to your Influence Engine™ account
          </p>
        </div>

        {/* Sign In Form */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="text-center text-xl font-semibold text-gray-900">
              Sign In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10 h-12 border-gray-300 focus:border-[#92278F] focus:ring-[#92278F]"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 h-12 border-gray-300 focus:border-[#92278F] focus:ring-[#92278F]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-[#92278F] focus:ring-[#92278F] border-gray-300 rounded"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Remember me
                  </label>
                </div>
                <a
                  href="#"
                  className="text-sm text-[#92278F] hover:text-[#7a1f78] font-medium"
                >
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#92278F] hover:bg-[#7a1f78] text-white h-12 font-semibold"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <LogIn className="w-5 h-5" />
                    <span>Sign In</span>
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <a
                  href="/quiz"
                  className="text-[#92278F] hover:text-[#7a1f78] font-medium"
                >
                  Sign up
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
