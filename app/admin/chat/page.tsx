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
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatUser {
  user_id: string;
  first_name: string;
  last_name: string;
  primary_influence_style: string;
  secondary_influence_style: string;
  avatar_url: string;
  status: "online" | "offline" | "away";
  color: string;
}

interface Message {
  id: string;
  content: string;
  sender: "admin" | "user" | "assistant";
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

export default function AdminChatInterface() {
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [currentSender, setCurrentSender] = useState<"admin" | "user">("user");
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [globalSystemInstruction, setGlobalSystemInstruction] = useState("");

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem("selectedUser");
    if (userData) {
      const user = JSON.parse(userData);
      setSelectedUser(user);

      // Set initial welcome message from AI Assistant
      const initialMessages: Message[] = [
        {
          id: "1",
          content: `Hello Admin! I'm monitoring the conversation with ${user.name} (${user.influenceStyle}). You can send messages as yourself (admin prompts) or as ${user.name} (user prompts), and I'll respond accordingly.`,
          sender: "assistant",
          timestamp: new Date(Date.now() - 60000),
        },
      ];
      setMessages(initialMessages);

      // Load or create chat history for the selected user only
      loadChatHistory(user);
    }
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

  const loadChatHistory = (currentUser: ChatUser) => {
    // Only show the current user's chat history
    const userHistory: ChatHistory[] = [
      {
        id: currentUser.user_id,
        userName: `${currentUser.first_name} ${currentUser.last_name}`,
        userAvatar: currentUser.avatar_url,
        userColor: currentUser.color,
        lastMessage: "Hello Admin! I'm monitoring the conversation...",
        timestamp: new Date(),
      },
    ];
    setChatHistory(userHistory);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedUser) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: currentSender,
      timestamp: new Date(),
      displayName:
        currentSender === "user"
          ? `${selectedUser.first_name} ${selectedUser.last_name}`
          : "Admin",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Update chat history
    setChatHistory((prev) =>
      prev.map((chat) =>
        chat.id === selectedUser.user_id
          ? { ...chat, lastMessage: input, timestamp: new Date() }
          : chat
      )
    );

    // TODO: Here you will add the OpenAI API call
    // The message should be sent to OpenAI with:
    // - system instruction: globalSystemInstruction (from global settings)
    // - role: currentSender (either "system" or "user")
    // - content: input
    // - context about the selected user and their influence style
    // - fine-tuning data will be applied at the model level

    // Placeholder for AI response (you'll replace this with actual OpenAI call)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `[AI Response Placeholder] - Received ${currentSender} message: "${input}". This will be replaced with actual OpenAI response.`,
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);

      // Update chat history with AI response
      setChatHistory((prev) =>
        prev.map((chat) =>
          chat.id === selectedUser.user_id
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

  const handleBackToDashboard = () => {
    localStorage.removeItem("selectedUser");
    window.location.href = "/admin";
  };

  const getMessageColor = (sender: string) => {
    switch (sender) {
      case "admin":
        return "bg-[#92278F] text-white";
      case "user":
        return selectedUser
          ? `${selectedUser.color.replace("bg-", "bg-")} text-white`
          : "bg-blue-500 text-white";
      case "assistant":
        return "bg-gray-100 text-black border border-gray-200";
      default:
        return "bg-gray-100 text-black";
    }
  };
  const getUserInitials = (user: ChatUser) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return "U";
  };

  const getAvatarForSender = (sender: string) => {
    switch (sender) {
      case "admin":
        return (
          <div className="w-8 h-8 rounded-full bg-[#92278F] flex items-center justify-center flex-shrink-0">
            <Settings className="w-4 h-4 text-white" />
          </div>
        );
      case "user":
        return selectedUser ? (
          <div
            className={`w-8 h-8 rounded-full ${selectedUser.color} flex items-center justify-center flex-shrink-0 text-white font-bold text-xs`}
          >
            <Avatar className="h-12 w-12 transition-all duration-200 group-hover:brightness-75">
              <AvatarImage
                src={selectedUser.avatar_url}
                alt={`${selectedUser.first_name} ${selectedUser.last_name}`}
              />
              <AvatarFallback className="bg-[#92278F] text-white text-2xl font-bold">
                {getUserInitials(selectedUser)}
              </AvatarFallback>
            </Avatar>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
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

  if (!selectedUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="font-inter text-gray-600 mb-4">Loading admin chat...</p>
          <Button
            onClick={handleBackToDashboard}
            className="bg-[#92278F] hover:bg-[#7a1f78] text-white"
          >
            Back to Admin Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Chat History Sidebar */}
      <div className="w-80 bg-gray-100 border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToDashboard}
              className="text-gray-600 hover:text-[#92278F] p-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Admin Dashboard
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
            Monitoring
          </h2>
        </div>

        {/* Chat History List - Only showing the current user */}
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
          <div className="flex items-center space-x-4">
            <div
              className={`w-12 h-12 rounded-full ${selectedUser.color} flex items-center justify-center text-white font-bold font-inter relative`}
            >
              <Avatar className="h-12 w-12 transition-all duration-200 group-hover:brightness-75">
                <AvatarImage
                  src={selectedUser.avatar_url}
                  alt={`${selectedUser.first_name} ${selectedUser.last_name}`}
                />
                <AvatarFallback className="bg-[#92278F] text-white text-2xl font-bold">
                  {getUserInitials(selectedUser)}
                </AvatarFallback>
              </Avatar>
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  selectedUser.status === "online"
                    ? "bg-green-500"
                    : selectedUser.status === "away"
                    ? "bg-yellow-500"
                    : "bg-gray-400"
                }`}
              />
            </div>
            <div>
              <h1 className="font-playfair text-2xl font-bold">
                Admin Monitoring: {selectedUser.first_name}{" "}
                {selectedUser.last_name}
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <div className="text-white/80">
                  {getInfluenceIcon(
                    selectedUser.primary_influence_style +
                      (selectedUser.secondary_influence_style
                        ? "-" + selectedUser.secondary_influence_style
                        : "")
                  )}
                </div>
                {/* Show name only for single styles */}
                {!selectedUser.primary_influence_style.includes("-") && (
                  <span className="font-inter text-sm text-white/90 capitalize">
                    {selectedUser.primary_influence_style}
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
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-100">
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
              {/* Avatar - show first for AI, last for Admin/User */}
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

              {/* Avatar - show last for Admin/User */}
              {message.sender !== "assistant" &&
                getAvatarForSender(message.sender)}
            </div>
          ))}
        </div>

        {/* Message Input Area */}
        <div className="p-6 bg-white border-t border-gray-200">
          <div className="space-y-4">
            {/* Sender Selection */}
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={currentSender === "admin" ? "default" : "outline"}
                onClick={() => setCurrentSender("admin")}
                className={`font-inter text-sm flex items-center space-x-2 ${
                  currentSender === "admin"
                    ? "bg-[#92278F] hover:bg-[#7a1f78] text-white"
                    : "border-[#92278F] text-[#92278F] hover:bg-[#92278F] hover:text-white"
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Send as Admin</span>
              </Button>
              <Button
                type="button"
                variant={currentSender === "user" ? "default" : "outline"}
                onClick={() => setCurrentSender("user")}
                className={`font-inter text-sm flex items-center space-x-2 ${
                  currentSender === "user"
                    ? `${selectedUser.color.replace(
                        "bg-",
                        "bg-"
                      )} hover:opacity-80 text-white`
                    : `border-gray-400 text-gray-600 hover:${selectedUser.color.replace(
                        "bg-",
                        "bg-"
                      )} hover:text-white`
                }`}
              >
                <User className="w-4 h-4" />
                <span>
                  Send as {selectedUser.first_name} {selectedUser.last_name}
                </span>
              </Button>
            </div>

            {/* Message Input */}
            <form onSubmit={handleSubmit} className="flex space-x-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  currentSender === "admin"
                    ? "Enter admin feedback..."
                    : `Message as ${selectedUser.first_name} ${selectedUser.last_name}...`
                }
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
              {currentSender === "admin"
                ? "Admin feedback helps guide the AI's behavior and responses"
                : `User messages are sent as if ${selectedUser.first_name} ${selectedUser.last_name} is speaking`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
