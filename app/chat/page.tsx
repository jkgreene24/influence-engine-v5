"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Bot,
  ArrowLeft,
  Zap,
  Users,
  Anchor,
  Link,
  Navigation,
  User,
  Settings,
  Plus,
  CreditCard,
  LogOut,
  SettingsIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";

interface ChatUser {
  id: string;
  name: string;
  influenceStyle: string; // Changed to string for blended styles
  avatar: string;
  status: "online" | "offline" | "away";
  color: string;
}

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  displayName?: string;
}

interface ChatHistory {
  id: string;
  userName: string;
  userAvatar: string;
  userColor: string;
  lastMessage: string;
  timestamp: Date;
}

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
        return <Bot className="w-4 h-4" />;
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
  return getIcon(styles[0]);
};

export default function ChatInterface() {
  const [currentUser] = useState<ChatUser>({
    id: "user-1",
    name: "You",
    influenceStyle: "catalyst-navigator", // Example blended style
    avatar: "YU",
    status: "online",
    color: "bg-[#92278F]",
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [globalSystemInstruction, setGlobalSystemInstruction] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Set initial welcome message from AI Assistant
    const initialMessages: Message[] = [
      {
        id: "1",
        content: `Hello! I'm your AI assistant. I'm ready to help with any questions or conversations you'd like to have. How can I assist you today?`,
        sender: "assistant",
        timestamp: new Date(Date.now() - 60000),
      },
    ];
    setMessages(initialMessages);

    // Load or create chat history
    loadChatHistory();
  }, []);

  useEffect(() => {
    // Load global OpenAI settings
    const savedSystemInstruction = localStorage.getItem(
      "openai_system_instruction"
    );
    if (savedSystemInstruction) {
      setGlobalSystemInstruction(savedSystemInstruction);
    }
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  const loadChatHistory = () => {
    // Create sample chat history
    const userHistory: ChatHistory[] = [
      {
        id: "chat-1",
        userName: "Current Conversation",
        userAvatar: "CC",
        userColor: "bg-[#92278F]",
        lastMessage: "Hello! I'm your AI assistant...",
        timestamp: new Date(),
      },
    ];
    setChatHistory(userHistory);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
      displayName: currentUser.name,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Update chat history
    setChatHistory((prev) =>
      prev.map((chat) =>
        chat.id === "chat-1"
          ? { ...chat, lastMessage: input, timestamp: new Date() }
          : chat
      )
    );

    // TODO: Here you will add the OpenAI API call
    // The message should be sent to OpenAI with:
    // - system instruction: globalSystemInstruction (from global settings)
    // - role: "user"
    // - content: input
    // - context about the user and their influence style
    // - fine-tuning data will be applied at the model level

    // Placeholder for AI response (you'll replace this with actual OpenAI call)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `Thank you for your message: "${input}". This is a placeholder response that will be replaced with actual OpenAI integration. I'm here to help with any questions or conversations you'd like to have!`,
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);

      // Update chat history with AI response
      setChatHistory((prev) =>
        prev.map((chat) =>
          chat.id === "chat-1"
            ? {
                ...chat,
                lastMessage: "AI responded to your message",
                timestamp: new Date(),
              }
            : chat
        )
      );
    }, 1000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatHistoryTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "now";
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const handleBackToHome = () => {
    window.location.href = "/";
  };

  const getMessageColor = (sender: string) => {
    switch (sender) {
      case "user":
        return "bg-[#92278F] text-white";
      case "assistant":
        return "bg-gray-100 text-black border border-gray-200";
      default:
        return "bg-gray-100 text-black";
    }
  };

  const getAvatarForSender = (sender: string) => {
    switch (sender) {
      case "user":
        return (
          <div className="w-8 h-8 rounded-full bg-[#92278F] flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
        );
      case "assistant":
        return (
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 border-2 border-gray-200">
            <img
              src="/logo.png"
              alt="AI Assistant"
              className="w-6 h-6 rounded-full"
            />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </div>
        );
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const getUserInitials = (user: any) => {
    if (user?.user_metadata?.full_name) {
      const names = user.user_metadata.full_name.split(" ");
      return names.length > 1 ? `${names[0][0]}${names[1][0]}` : names[0][0];
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Chat History Sidebar */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToHome}
              className="text-gray-600 hover:text-[#92278F] p-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-[#92278F] p-2"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <h2 className="font-playfair text-lg font-bold text-gray-800">
            Chat History
          </h2>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto">
          {chatHistory.map((chat) => (
            <div
              key={chat.id}
              className="p-4 border-b border-gray-100 bg-white border-l-4 border-l-[#92278F]"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-full ${chat.userColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                >
                  {chat.userAvatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-inter font-medium text-gray-800 truncate capitalize">
                      {chat.userName}
                    </h3>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatHistoryTime(chat.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {chat.lastMessage}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-[#92278F] to-[#a83399] text-white p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className={`w-12 h-12 rounded-full ${currentUser.color} flex items-center justify-center text-white font-bold font-inter relative`}
              >
                {currentUser.avatar}
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    currentUser.status === "online"
                      ? "bg-green-500"
                      : currentUser.status === "away"
                      ? "bg-yellow-500"
                      : "bg-gray-400"
                  }`}
                />
              </div>
              <div>
                <h1 className="font-playfair text-2xl font-bold">
                  AI Chat Assistant
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="text-white/80">
                    {getInfluenceIcon(currentUser.influenceStyle)}
                  </div>
                  {/* Show name only for single styles */}
                  {!currentUser.influenceStyle.includes("-") && (
                    <span className="font-inter text-sm text-white/90 capitalize">
                      {currentUser.influenceStyle}
                    </span>
                  )}
                </div>
                {globalSystemInstruction && (
                  <div className="flex items-center space-x-1 mt-1">
                    <Settings className="w-3 h-3 text-white/60" />
                    <span className="font-inter text-xs text-white/80">
                      Custom system instruction active
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full border-2 border-white/20 hover:border-white/40"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={
                        user?.user_metadata?.avatar_url || "/placeholder.svg"
                      }
                      alt={user?.user_metadata?.full_name || user?.email}
                    />
                    <AvatarFallback className="bg-white text-[#92278F] font-semibold">
                      {getUserInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user?.user_metadata?.full_name && (
                      <p className="font-medium">
                        {user.user_metadata.full_name}
                      </p>
                    )}
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => (window.location.href = "/profile")}
                >
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => (window.location.href = "/subscription")}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Subscription</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex space-x-3 animate-in slide-in-from-bottom-2 duration-300 ${
                message.sender === "assistant"
                  ? "items-start"
                  : "items-start justify-end"
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Avatar - show first for AI, last for User */}
              {message.sender === "assistant" &&
                getAvatarForSender(message.sender)}

              <div
                className={`flex flex-col ${
                  message.sender === "assistant" ? "items-start" : "items-end"
                } max-w-[70%]`}
              >
                {/* Message bubble */}
                <div
                  className={`px-4 py-3 rounded-2xl ${getMessageColor(
                    message.sender
                  )} shadow-sm ${
                    message.sender === "assistant"
                      ? "rounded-bl-md"
                      : "rounded-br-md"
                  }`}
                >
                  <p className="font-inter text-sm leading-relaxed">
                    {message.content}
                  </p>
                </div>

                {/* Timestamp and sender info */}
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-500 font-inter">
                    {formatTime(message.timestamp)}
                  </span>
                  {message.displayName && (
                    <>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500 font-inter">
                        {message.displayName}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Avatar - show last for User */}
              {message.sender !== "assistant" &&
                getAvatarForSender(message.sender)}
            </div>
          ))}
        </div>

        {/* Message Input Area */}
        <div className="p-6 bg-white border-t border-gray-200">
          <div className="space-y-4">
            {/* Message Input */}
            <form onSubmit={handleSubmit} className="flex space-x-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message here..."
                className="flex-1 font-inter border-gray-300 focus:border-[#92278F] focus:ring-[#92278F] h-12"
              />
              <Button
                type="submit"
                className="bg-[#92278F] hover:bg-[#7a1f78] text-white px-6 h-12"
                disabled={!input.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>

            {/* Helper text */}
            <p className="text-xs text-gray-500 font-inter text-center">
              Start a conversation with your AI assistant
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
