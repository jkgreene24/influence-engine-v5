"use client";
import { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MessageCircle,
  Zap,
  Users,
  Anchor,
  Link,
  Navigation,
  Loader2,
  Settings,
  Upload,
  Save,
  X,
  Home,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Textarea } from "@/components/ui/textarea";

interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_admin: boolean;
  avatar: string;
  status: "online" | "offline" | "away";
  color: string;
  primary_influence_style: string;
  secondary_influence_style: string;
}

const getRandomInfluenceStyle = () => {
  const styles = ["catalyst", "diplomat", "anchor", "connector", "navigator"];

  // 60% chance for blended style, 40% chance for single style
  const isBlended = Math.random() < 0.6;

  if (isBlended) {
    // Generate blended style
    const shuffled = [...styles].sort(() => 0.5 - Math.random());
    return `${shuffled[0]}-${shuffled[1]}`;
  } else {
    // Generate single style
    return styles[Math.floor(Math.random() * styles.length)];
  }
};

const getInfluenceIcon = (style: string) => {
  const styles = style.split("-");
  const primaryStyle = styles[0];

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
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  // For blended styles, show both icons with plus
  if (styles.length === 2) {
    return (
      <div className="flex items-center space-x-1">
        {getIcon(styles[0])}
        <span className="text-xs">+</span>
        {getIcon(styles[1])}
      </div>
    );
  }

  // For single styles, show just the icon
  return getIcon(primaryStyle);
};

const getRandomColor = (index: number) => {
  const colors = [
    "bg-purple-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-red-500",
    "bg-yellow-500",
    "bg-cyan-500",
  ];
  return colors[index % colors.length];
};

const getRandomStatus = () => {
  const statuses: ("online" | "offline" | "away")[] = [
    "online",
    "offline",
    "away",
  ];
  return statuses[Math.floor(Math.random() * statuses.length)];
};

const generateAvatar = (name: string) => {
  const words = name.split(" ");
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const validateEnvironment = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log("Environment check:", {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    urlPreview: supabaseUrl
      ? supabaseUrl.substring(0, 20) + "..."
      : "undefined",
  });

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file."
    );
  }

  // Check for common placeholder patterns
  const placeholderPatterns = [
    "your_supabase_project_url_here",
    "your_supabase_anon_key_here",
    "your-project-id.supabase.co",
    "your-actual-anon-key-here",
    "https://your-project.supabase.co",
  ];

  const isPlaceholder = placeholderPatterns.some(
    (pattern) => supabaseUrl.includes(pattern) || supabaseKey.includes(pattern)
  );

  if (isPlaceholder) {
    throw new Error(
      "Please replace the placeholder values in your .env.local file with your actual Supabase URL and anon key."
    );
  }

  // Basic URL validation
  try {
    new URL(supabaseUrl);
  } catch {
    throw new Error(
      "Invalid Supabase URL format. Please ensure your NEXT_PUBLIC_SUPABASE_URL is a valid URL (e.g., https://abcdefgh.supabase.co)"
    );
  }

  return { supabaseUrl, supabaseKey };
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [systemInstruction, setSystemInstruction] = useState("");
  const [fineTuningFile, setFineTuningFile] = useState<File | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [fineTuningData, setFineTuningData] = useState("");
  const [ingestLoading, setIngestLoading] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [fineTuningDataType, setFineTuningDataType] = useState<
    "message" | "text" | "json"
  >("message");

  const getPlaceholderText = (type: "message" | "text" | "json") => {
    switch (type) {
      case "message":
        return `Customer: Hi, I'm having trouble with my Allbirds shoes. The sole is coming off after only 2 months of use.
Support: I'm sorry to hear that. Can you please provide your order number?
Customer: My order number is AB-2024-001234.
Support: Thank you. I can see your order here. Since this happened within our warranty period, we'll send you a replacement pair right away.`;
      case "text":
        return `MIT researchers have unveiled 'ClimateNet', an AI system capable of predicting climate patterns with unprecedented accuracy. Early tests show it can forecast major weather events up to three weeks in advance, potentially revolutionizing disaster preparedness and agricultural planning.

The system uses advanced machine learning algorithms trained on decades of meteorological data from around the globe. Unlike traditional weather models that rely primarily on atmospheric conditions, ClimateNet incorporates ocean temperatures, solar radiation patterns, and even vegetation changes to create more comprehensive predictions.`;
      case "json":
        return `{
  "id": "PROD001",
  "name": "Men's SuperLight Wool Runners",
  "color": "Dark Grey",
  "sole_color": "Medium Grey",
  "material": "Wool",
  "technology": "SuperLight Foam",
  "price": 125.00,
  "in_stock": true,
  "last_updated": "2024-03-15T10:30:00Z"
}

{
  "id": "PROD002",
  "name": "Women's Tree Runners",
  "color": "Natural White",
  "sole_color": "White",
  "material": "Eucalyptus Tree Fiber",
  "technology": "SweetFoam",
  "price": 98.00,
  "in_stock": false,
  "last_updated": "2024-03-15T10:30:00Z"
}`;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSystemInstruction = localStorage.getItem(
      "openai_system_instruction"
    );
    if (savedSystemInstruction) {
      setSystemInstruction(savedSystemInstruction);
    }

    const savedFineTuningData = localStorage.getItem("fine_tuning_data");
    if (savedFineTuningData) {
      setFineTuningData(savedFineTuningData);
    }
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate environment variables first
      validateEnvironment();

      const supabase = createClient();

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("first_name");

      if (error) {
        throw error;
      }

      const formattedUsers: User[] = data.map((user, index) => ({
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        is_admin: user.is_admin,
        avatar: generateAvatar(user.first_name),
        status: getRandomStatus(),
        color: getRandomColor(index),
        primary_influence_style: user.primary_influence_style,
        secondary_influence_style: user.secondary_influence_style,
      }));

      setUsers(formattedUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserClick = (user: User) => {
    // Store user data in localStorage for the admin chat interface
    localStorage.setItem(
      "selectedUser",
      JSON.stringify({
        id: user.user_id,
        name: user.first_name,
        influenceStyle: user.is_admin,
        avatar: user.avatar,
        status: user.status,
        color: user.color,
      })
    );
    // Navigate to admin chat interface
    window.location.href = "/admin/chat";
  };

  const handleGoToHome = () => {
    window.location.href = "/";
  };

  const handleSaveSettings = async () => {
    setSettingsLoading(true);
    try {
      // Save system instruction to localStorage
      localStorage.setItem("openai_system_instruction", systemInstruction);

      // Show success message
      alert("Settings saved successfully!");
      setShowSettings(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Error saving settings. Please try again.");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleIngestData = async () => {
    setIngestLoading(true);
    try {
      // Validate data based on type
      if (fineTuningDataType === "json") {
        // For JSON, validate that it's proper JSON
        JSON.parse(fineTuningData);
      } else if (fineTuningDataType === "message") {
        // For message data, check if it has conversation patterns
        if (
          !fineTuningData.includes(":") ||
          fineTuningData.trim().length < 10
        ) {
          throw new Error(
            "Message data should contain conversation patterns with speakers"
          );
        }
      } else if (fineTuningDataType === "text") {
        // For text data, just check minimum length
        if (fineTuningData.trim().length < 50) {
          throw new Error("Text data should be at least 50 characters long");
        }
      }

      // Simulate API call to ingest data (replace with actual OpenAI API call)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Save to localStorage with type information
      localStorage.setItem("fine_tuning_data", fineTuningData);
      localStorage.setItem("fine_tuning_data_type", fineTuningDataType);

      setToast({
        type: "success",
        message: `${
          fineTuningDataType.charAt(0).toUpperCase() +
          fineTuningDataType.slice(1)
        } data ingested successfully!`,
      });
      setFineTuningData("");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Invalid ${fineTuningDataType} format or ingestion failed. Please check your data.`;
      setToast({ type: "error", message: errorMessage });
    } finally {
      setIngestLoading(false);
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#92278F] mx-auto mb-4" />
          <p className="font-inter text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-2xl">
          <div className="text-red-500 mb-4">
            <MessageCircle className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="font-playfair text-xl text-gray-600 mb-2">
            Configuration Error
          </h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="font-inter text-sm text-red-700 text-left">{error}</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left">
            <p className="font-inter text-sm text-blue-700 mb-3">
              <strong>Setup Instructions:</strong>
            </p>
            <ol className="font-inter text-sm text-blue-700 list-decimal list-inside space-y-2">
              <li>Go to your Supabase project dashboard</li>
              <li>Navigate to Settings → API</li>
              <li>Copy your Project URL and anon/public key</li>
              <li>
                Create/update your{" "}
                <code className="bg-blue-100 px-1 rounded">.env.local</code>{" "}
                file:
              </li>
            </ol>
            <pre className="bg-blue-100 p-3 rounded mt-3 text-xs overflow-x-auto">
              {`NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}
            </pre>
            <p className="font-inter text-xs text-blue-600 mt-2">
              <strong>Important:</strong> Make sure to restart your development
              server after adding environment variables!
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="font-inter text-sm text-yellow-700">
              <strong>Current Status:</strong> Environment variables are{" "}
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? "detected" : "missing"}
            </p>
          </div>

          <Button
            onClick={fetchUsers}
            className="bg-[#92278F] hover:bg-[#7a1f78] text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      {/* Header */}
      <div className="bg-gradient-to-r from-[#92278F] to-[#a83399] text-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Top row with Home button and logo/title */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={handleGoToHome}
              className="text-white hover:bg-white/20 p-2 flex items-center space-x-2 border border-white/20"
            >
              <Home className="w-4 h-4" />
              <span className="font-inter">Home</span>
            </Button>
            <div className="flex items-center space-x-4">
              <img
                src="/logo.png"
                alt="Admin Dashboard Logo"
                className="w-16 h-16 rounded-full border-2 border-white/20"
              />
              <div className="text-center">
                <h1 className="font-playfair text-4xl font-bold">
                  Admin Dashboard
                </h1>
                <p className="font-inter text-lg opacity-90 mt-2">
                  Monitor and manage user conversations with AI assistance
                </p>
              </div>
            </div>
            <div className="w-20"></div> {/* Spacer for balance */}
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search users or influence styles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/70 focus:bg-white/20 font-inter"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center mt-4">
            <Button
              onClick={() => setShowSettings(true)}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-inter flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>OpenAI Settings</span>
            </Button>
          </div>
        </div>
      </div>

      {/* User Grid */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers.map((user) => (
            <Card
              key={user.user_id}
              className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-[#92278F]/30 group"
              onClick={() => handleUserClick(user)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 rounded-full ${user.color} flex items-center justify-center text-white font-bold font-inter relative`}
                  >
                    {user.avatar}
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        user.status === "online"
                          ? "bg-green-500"
                          : user.status === "away"
                          ? "bg-yellow-500"
                          : "bg-gray-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="font-inter text-lg text-black group-hover:text-[#92278F] transition-colors capitalize">
                      {user.first_name} {user.last_name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 font-inter capitalize">
                      {user.status}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <Badge
                      variant="secondary"
                      className="bg-[#92278F]/10 text-[#92278F] hover:bg-[#92278F]/20 font-inter text-sm px-3 py-1 flex items-center space-x-2"
                    >
                      <div className="text-[#92278F]">
                        {getInfluenceIcon(
                          user.primary_influence_style +
                            (user.secondary_influence_style
                              ? "-" + user.secondary_influence_style
                              : "")
                        )}
                      </div>
                      {/* Show name only for single styles */}
                      {!user.secondary_influence_style && (
                        <span className="capitalize">
                          {user.primary_influence_style}
                        </span>
                      )}
                    </Badge>
                  </div>

                  <Button
                    className="w-full bg-[#92278F] hover:bg-[#7a1f78] text-white font-inter group-hover:shadow-md transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUserClick(user);
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Monitor Conversation
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Users className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="font-playfair text-xl text-gray-600 mb-2">
              No users found
            </h3>
            <p className="font-inter text-gray-500">
              Try adjusting your search terms
            </p>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-playfair text-2xl font-bold text-gray-800">
                  OpenAI Settings
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* System Instruction */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-inter">
                    System Instruction
                  </label>
                  <Textarea
                    value={systemInstruction}
                    onChange={(e) => setSystemInstruction(e.target.value)}
                    placeholder="Enter the system instruction that will guide the AI's behavior across all conversations..."
                    className="min-h-[120px] font-inter"
                  />
                  <p className="text-xs text-gray-500 mt-1 font-inter">
                    This instruction will be sent to OpenAI as the system
                    message for all conversations.
                  </p>
                </div>

                {/* Fine-tuning Data */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-inter">
                    Fine-tuning Data
                  </label>

                  {/* Data Type Dropdown */}
                  <div className="mb-3">
                    <select
                      value={fineTuningDataType}
                      onChange={(e) => {
                        setFineTuningDataType(
                          e.target.value as "message" | "text" | "json"
                        );
                        setFineTuningData(""); // Clear existing data when switching types
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#92278F] focus:border-[#92278F] font-inter text-sm"
                    >
                      <option value="message">Adding Message Data</option>
                      <option value="text">Adding Text Data</option>
                      <option value="json">Adding JSON Data</option>
                    </select>
                  </div>

                  <Textarea
                    value={fineTuningData}
                    onChange={(e) => setFineTuningData(e.target.value)}
                    placeholder={getPlaceholderText(fineTuningDataType)}
                    className="min-h-[200px] font-mono text-sm font-inter"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500 font-inter">
                      {fineTuningDataType === "message" &&
                        "Paste conversation data to train the AI on dialogue patterns."}
                      {fineTuningDataType === "text" &&
                        "Paste text content to improve the AI's knowledge and writing style."}
                      {fineTuningDataType === "json" &&
                        "Paste structured JSON data to train the AI on data formats and relationships."}
                    </p>
                    <Button
                      type="button"
                      onClick={handleIngestData}
                      disabled={!fineTuningData.trim() || ingestLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-inter flex items-center space-x-2"
                    >
                      {ingestLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>{ingestLoading ? "Ingesting..." : "Ingest"}</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setShowSettings(false)}
                  className="font-inter"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveSettings}
                  disabled={settingsLoading}
                  className="bg-[#92278F] hover:bg-[#7a1f78] text-white font-inter flex items-center space-x-2"
                >
                  {settingsLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{settingsLoading ? "Saving..." : "Save Settings"}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 ${
              toast.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            <span className="font-inter text-sm">{toast.message}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setToast(null)}
              className="text-white hover:bg-white/20 p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
