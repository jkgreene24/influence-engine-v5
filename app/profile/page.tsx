"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Calendar,
  Shield,
  Zap,
  Users,
  Anchor,
  Link,
  Navigation,
  Sparkles,
  X,
  Camera,
  Upload,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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

export default function Profile() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [primaryStyle, setPrimaryStyle] = useState<string>("");
  const [secondaryStyle, setSecondaryStyle] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        setEmail(user.email || "");
        setAvatarUrl(user.user_metadata?.avatar_url || "");

        // Load from auth metadata first (for new users)
        setFirstName(user.user_metadata?.first_name || "");
        setLastName(user.user_metadata?.last_name || "");

        // Try to fetch from profiles table
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profileData && !error) {
          setProfile(profileData);
          // Override with profile data if available
          setFirstName(
            profileData.first_name || user.user_metadata?.first_name || ""
          );
          setLastName(
            profileData.last_name || user.user_metadata?.last_name || ""
          );
          setUserName(profileData.user_name || "");
          setPrimaryStyle(profileData.primary_influence_style || "");
          setSecondaryStyle(profileData.secondary_influence_style || "");
        }
      }
    };
    fetchUserAndProfile();
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      alert("Please select a valid image file (PNG, JPG, JPEG, GIF, or WebP)");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert("File size must be less than 5MB");
      return;
    }

    setAvatarUploading(true);

    try {
      // Create a unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Update user metadata with new avatar URL
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: publicUrl,
        },
      });

      if (updateError) {
        throw updateError;
      }

      setAvatarUrl(publicUrl);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload avatar. Please try again.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          primary_influence_style: primaryStyle || null,
          secondary_influence_style: secondaryStyle || null,
        },
      });

      if (authError) {
        throw authError;
      }

      // Upsert profile data
      const { error: profileError } = await supabase.from("profiles").upsert({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        primary_influence_style: primaryStyle || null,
        secondary_influence_style: secondaryStyle || null,
      });

      if (profileError) {
        throw profileError;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Use full page reload for logout to clear all state
    window.location.href = "/auth/signin";
  };

  const getUserInitials = () => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (user?.user_metadata?.full_name) {
      const names = user.user_metadata.full_name.split(" ");
      return names.length > 1 ? `${names[0][0]}${names[1][0]}` : names[0][0];
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getInfluenceStyleIcon = (styleId: string) => {
    const style = influenceStyles.find((s) => s.id === styleId);
    return style ? style.icon : null;
  };

  const getInfluenceStyleColor = (styleId: string) => {
    const style = influenceStyles.find((s) => s.id === styleId);
    return style ? style.color : "bg-gray-1000";
  };

  const getInfluenceStyleName = (styleId: string) => {
    const style = influenceStyles.find((s) => s.id === styleId);
    return style ? style.name : "";
  };

  const getCurrentInfluenceDisplay = () => {
    if (!primaryStyle) return null;

    if (secondaryStyle) {
      return (
        <div className="flex items-start space-x-2">
          <div className="flex flex-col items-center space-y-1">
            <div
              className={`w-10 h-10 rounded-full ${getInfluenceStyleColor(
                primaryStyle
              )} flex items-center justify-center text-white`}
            >
              {getInfluenceStyleIcon(primaryStyle)}
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">
              {getInfluenceStyleName(primaryStyle)}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center h-10">
            <span className="text-sm font-medium text-gray-500">+</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <div
              className={`w-10 h-10 rounded-full ${getInfluenceStyleColor(
                secondaryStyle
              )} flex items-center justify-center text-white`}
            >
              {getInfluenceStyleIcon(secondaryStyle)}
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">
              {getInfluenceStyleName(secondaryStyle)}
            </span>
          </div>
          <div className="ml-3 flex flex-col justify-center">
            <p className="text-xs text-gray-600">Blended Influence Style</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-3">
        <div
          className={`w-10 h-10 rounded-full ${getInfluenceStyleColor(
            primaryStyle
          )} flex items-center justify-center text-white`}
        >
          {getInfluenceStyleIcon(primaryStyle)}
        </div>
        <div>
          <p className="font-semibold text-gray-900">
            {getInfluenceStyleName(primaryStyle)}
          </p>
          <p className="text-sm text-gray-600">Primary Influence Style</p>
        </div>
      </div>
    );
  };

  const getAvailableSecondaryStyles = () => {
    return influenceStyles.filter((style) => style.id !== primaryStyle);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpg,image/jpeg,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push("/chat")}
              className="text-gray-600 hover:text-[#92278F]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Chat
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              Profile Settings
            </h1>
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

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div
                  className="relative group cursor-pointer"
                  onClick={handleAvatarClick}
                  title="Click to change avatar"
                >
                  <Avatar className="h-24 w-24 transition-all duration-200 group-hover:brightness-75">
                    <AvatarImage
                      src={avatarUrl}
                      alt={`${firstName} ${lastName}`}
                    />
                    <AvatarFallback className="bg-[#92278F] text-white text-2xl font-bold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Camera overlay on hover */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {avatarUploading ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </div>

                  {/* Upload indicator */}
                  {avatarUploading && (
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-[#92278F] rounded-full flex items-center justify-center">
                      <Upload className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </div>
              <CardTitle className="text-xl">
                {firstName && lastName ? `${firstName} ${lastName}` : "User"}
              </CardTitle>
              <p className="text-gray-600">{user?.email}</p>
              <p className="text-xs text-gray-500 mt-2">
                Click avatar to change picture
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Joined{" "}
                    {user?.created_at
                      ? formatDate(user.created_at)
                      : "Recently"}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Shield className="w-4 h-4" />
                  <span>
                    Email {user?.email_confirmed_at ? "Verified" : "Pending"}
                  </span>
                </div>

                {/* Current Influence Style Display */}
                {primaryStyle && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <Sparkles className="w-4 h-4 text-[#92278F]" />
                      <span className="text-sm font-medium text-gray-700">
                        Current Style
                      </span>
                    </div>
                    {getCurrentInfluenceDisplay()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information & Influence Style</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Personal Information
                  </h3>

                  {/* First Name and Last Name Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          id="firstName"
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="First name"
                          className="pl-10 h-12 border-gray-300 focus:border-[#92278F] focus:ring-[#92278F]"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          id="lastName"
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Last name"
                          className="pl-10 h-12 border-gray-300 focus:border-[#92278F] focus:ring-[#92278F]"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="userName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Username <span className="text-gray-400">(Optional)</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="userName"
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Choose a username"
                        className="pl-10 h-12 border-gray-300 focus:border-[#92278F] focus:ring-[#92278F]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        disabled
                        className="pl-10 h-12 border-gray-300 bg-gray-100 text-gray-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Email cannot be changed. Contact support if you need to
                      update your email.
                    </p>
                  </div>
                </div>

                {/* Influence Style Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Influence Style{" "}
                    <span className="text-gray-400">(Optional)</span>
                  </h3>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700 mb-2">
                      <strong>
                        Your influence style shapes how the AI coaches you.
                      </strong>
                    </p>
                    <p className="text-xs text-blue-600">
                      Choose a primary style and optionally add a secondary
                      style for a blended approach. You can skip this for now
                      and set it up later.
                    </p>
                  </div>

                  {/* Primary Style */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Influence Style
                    </label>
                    <Select
                      value={primaryStyle}
                      onValueChange={setPrimaryStyle}
                    >
                      <SelectTrigger className="h-12 border-gray-300 focus:border-[#92278F] focus:ring-[#92278F]">
                        <SelectValue placeholder="Select your primary influence style (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {influenceStyles.map((style) => (
                          <SelectItem key={style.id} value={style.id}>
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-6 h-6 rounded-full ${style.color} flex items-center justify-center text-white`}
                              >
                                {style.icon}
                              </div>
                              <div>
                                <p className="font-medium">{style.name}</p>
                                <p className="text-xs text-gray-600">
                                  {style.description}
                                </p>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Secondary Style */}
                  {primaryStyle && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Secondary Influence Style{" "}
                        <span className="text-gray-400">(Optional)</span>
                      </label>
                      <div className="flex space-x-2">
                        <Select
                          value={secondaryStyle}
                          onValueChange={setSecondaryStyle}
                        >
                          <SelectTrigger className="h-12 border-gray-300 focus:border-[#92278F] focus:ring-[#92278F]">
                            <SelectValue placeholder="Add a secondary style for blended approach" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableSecondaryStyles().map((style) => (
                              <SelectItem key={style.id} value={style.id}>
                                <div className="flex items-center space-x-3">
                                  <div
                                    className={`w-6 h-6 rounded-full ${style.color} flex items-center justify-center text-white`}
                                  >
                                    {style.icon}
                                  </div>
                                  <div>
                                    <p className="font-medium">{style.name}</p>
                                    <p className="text-xs text-gray-600">
                                      {style.description}
                                    </p>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {secondaryStyle && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSecondaryStyle("")}
                            className="h-12 px-3 border-gray-300 hover:border-red-300 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Adding a secondary style creates a blended approach that
                        combines both influence methods.
                      </p>
                    </div>
                  )}

                  {/* Live Preview */}
                  {primaryStyle && (
                    <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Preview Your Style
                      </h4>
                      {getCurrentInfluenceDisplay()}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || !firstName.trim() || !lastName.trim()}
                  className="bg-[#92278F] hover:bg-[#7a1f78] text-white"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </div>
                  )}
                </Button>
                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-700">
                      Profile updated successfully!
                    </p>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
