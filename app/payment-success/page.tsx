"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Zap,
  Users,
  Anchor,
  Link,
  Navigation,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const getInfluenceIcon = (style: string) => {
  const styles = style.split("-");

  const getIcon = (singleStyle: string) => {
    switch (singleStyle) {
      case "catalyst":
        return <Zap className="w-4 h-4" />;
      case "diplomat":
        return <Users className="w-4 h-4" />;
      case "anchor":
        return <Anchor className="w-4 h-4" />;
      case "connector":
        return <Link className="w-4 h-4" />;
      case "navigator":
        return <Navigation className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  if (styles.length === 2) {
    return (
      <div className="flex items-center space-x-1">
        {getIcon(styles[0])}
        <span className="text-xs">+</span>
        {getIcon(styles[1])}
      </div>
    );
  }

  return getIcon(styles[0]);
};

export default function PaymentSuccess() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();

          if (profileData) {
            setProfile(profileData);
          }
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

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
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="text-center py-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Method Added!
            </h2>
            <p className="text-gray-600 mb-6">
              Your payment method has been securely saved. You're all set to
              start using Influence Engine™.
            </p>

            {profile && (
              <div className="mb-6 p-4 bg-white rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-[#92278F] flex items-center justify-center text-white font-bold">
                    {profile.first_name?.[0]}
                    {profile.last_name?.[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {profile.first_name} {profile.last_name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="text-gray-600">
                        {getInfluenceIcon(
                          profile.primary_influence_style +
                            (profile.secondary_influence_style
                              ? "-" + profile.secondary_influence_style
                              : "")
                        )}
                      </div>
                      <span className="text-sm text-gray-600 capitalize">
                        {profile.primary_influence_style}
                        {profile.secondary_influence_style && (
                          <span> + {profile.secondary_influence_style}</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={() => router.push("/chat")}
              className="bg-[#92278F] hover:bg-[#7a1f78] text-white"
            >
              Start Chatting
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
