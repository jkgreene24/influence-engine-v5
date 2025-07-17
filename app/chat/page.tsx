"use client";

import type React from "react";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";
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
  Plus,
  Loader2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useBetty, useInitialMessageChat } from "../baml_client/react/hooks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SettingsIcon, CreditCard, LogOut } from "lucide-react";
interface ChatUser {
  user_id: string;
  name: string;
  email: string;
  influence_style: string;
  avatar: string;
  status: "online" | "offline" | "away";
  color: string | "";
}

interface Message {
  content: string;
  role: "developer" | "user" | "assistant";
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

  // For single styles, show the first icon
  return getIcon(styles[0]);
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

const generateAvatar = (name: string) => {
  const words = name.split(" ");
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default function ChatInterface() {
  const addZepMessage = async (
    userId: string,
    sessionId: string,
    content: string,
    role: string,
    userName: string | null
  ) => {
    const response = await fetch("/api/zep/message", {
      method: "POST",
      body: JSON.stringify({ userId, sessionId, content, role, userName }),
    });
    if (!response.ok) {
      throw new Error("Failed to add message");
    }
    return response.json();
  };
  const getZepMemoryContext = async (sessionId: string) => {
    const response = await fetch("/api/zep/memory", {
      method: "POST",
      body: JSON.stringify({
        sessionId: sessionId,
        userId: user?.user_id || "",
      }),
    });
    const data = await response.json();
    return data.memory || "";
  };
  const betty = useBetty({
    stream: true,
    onStreamData: (data) => {
      setCurrentResponse({
        content: data?.answer || "",
        role: "assistant",
        timestamp: new Date(),
        displayName: "Assistant",
      });
    },
    onFinalData: async (data) => {
      const sessionId = currentSessionIdRef.current || crypto.randomUUID();
      currentSessionIdRef.current = sessionId;
      await insertMessage(
        user?.user_id || "",
        sessionId || "",
        data?.answer || "",
        "assistant"
      );
      await addZepMessage(
        user?.user_id || "",
        sessionId || "",
        data?.answer || "",
        "assistant",
        user?.name || null
      );
      setCurrentResponse(null);
      setMessages((prev) => {
        return [
          ...prev,
          {
            content: data?.answer || "",
            role: "assistant",
            timestamp: new Date(),
            displayName: "Assistant",
          },
        ];
      });
      setChatHistory((prev) => {
        const newChatHistory = [...prev];
        const chatIndex = newChatHistory.findIndex(
          (chat) => chat.id === sessionId
        );
        if (chatIndex !== -1) {
          const chat = { ...newChatHistory[chatIndex] };
          chat.lastMessage = data?.answer || "";
          chat.timestamp = new Date();
          newChatHistory.splice(chatIndex, 1); // Remove from current position
          newChatHistory.unshift(chat); // Insert at the beginning
        } else {
          newChatHistory.unshift({
            id: sessionId || "",
            userName: user?.name || "",
            userAvatar: user?.avatar || "",
            userColor: user?.color || "",
            lastMessage: data?.answer || "",
            timestamp: new Date(),
          });
        }
        return newChatHistory;
      });
      setIsLoading(false);
    },
  });
  const initialMessageChat = useInitialMessageChat({
    stream: true,
    onStreamData: (data) => {
      // console.log("Initial message chat data", data);
      setMessages(
        (prev) =>
          [
            {
              content: data || "",
              role: "assistant",
              timestamp: new Date(),
              displayName: "Assistant",
            },
          ] as Message[]
      );
    },
    onFinalData: async (data) => {
      const sessionId = crypto.randomUUID();
      currentSessionIdRef.current = sessionId;
      await insertMessage(
        user?.user_id || "",
        sessionId || "",
        data || "",
        "assistant"
      );
      await addZepMessage(
        user?.user_id || "",
        sessionId || "",
        data || "",
        "assistant",
        user?.name || null
      );
      setChatHistory(
        (prev) =>
          [
            {
              id: sessionId || "",
              userName: user?.name || "",
              userAvatar: user?.avatar || "",
              userColor: user?.color || "",
              lastMessage: data || "",
              timestamp: new Date(),
            },
            ...prev,
          ] as ChatHistory[]
      );
      setIsLoading(false);
    },
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [user, setUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const instructionsRef = useRef<string | null>(null);
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const currentSessionIdRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<Message | null>(null);
  const supabase = createClient();
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const fetchInstructions = async () => {
    const { data, error } = await supabase
      .from("instructions")
      .select("instruction")
      .eq("id", 1)
      .single();
    if (error) {
      console.error("Error fetching instructions:", error);
    }
    return data?.instruction || null;
  };
  const insertMessage = async (
    user_id: string,
    session_id: string | null,
    message_content: string,
    message_role: string
  ) => {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        user_id: user_id,
        session_id: session_id,
        message_content: message_content,
        message_role: message_role,
      })
      .select("*")
      .single();
    if (error) {
      console.error("Error inserting message:", error);
      return data;
    }
    console.log("Message inserted", data);
    return data;
  };
  const handleNewChat = async () => {
    setMessages([]);
    if (user) {
      await initializeChat(user.user_id);
    }
  };
  const initializeChat = async (user_id: string) => {
    await fetchInstructions().then((data) => {
      instructionsRef.current = data || "";
    });
    const influenceStyle = user?.influence_style;
    // const guidance_retrievals = await fetch("/api/llama/guidance", {
    //   method: "POST",
    //   body: JSON.stringify({
    //     query: `How to start a conversation with a user with influence style: ${influenceStyle}?`,
    //   }),
    // });
    // const retrieved_guidance = await guidance_retrievals.json();
    // const retrieved_guidance_text = retrieved_guidance
    //   .map((retrieval: any) => retrieval.node.text)
    //   .join("\n\n");
    // const guidance_prompt = `${instructionsRef.current}\n\nBelow are additional guidance that you can use to help the user: ${retrieved_guidance_text}`;
    // initialMessageChat.mutate(
    //   guidance_prompt || "",
    //   "",
    //   influenceStyle || "",
    //   ""
    // );
    initialMessageChat.mutate(
      instructionsRef.current || "",
      "",
      influenceStyle || "",
      ""
    );
    return;
  };
  const fetchLatestSessionMessages = async () => {
    if (!user) return;

    // 1. Fetch all messages for the user, newest first
    const { data: allMessages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", user.user_id)
      .in("message_role", ["user", "assistant"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching messages:", error);
      setMessages([]);
      setChatHistory([]);
      return;
    }

    // if (!allMessages || allMessages.length === 0) {
    //   await initializeChat(selectedUser.user_id);
    //   return;
    // }

    // 2. Build chat history: unique sessions with latest message in each
    const seenSessions = new Set();
    const tempChatHistory: ChatHistory[] = [];
    for (const msg of allMessages) {
      if (!seenSessions.has(msg.session_id)) {
        seenSessions.add(msg.session_id);
        tempChatHistory.push({
          id: msg.session_id,
          userName: user.name,
          userAvatar: user.avatar,
          userColor: user.color,
          lastMessage: msg.message_content,
          timestamp: new Date(msg.created_at),
        });
      }
    }
    setChatHistory(tempChatHistory);

    // 3. Find the latest session_id
    const latestSessionId =
      tempChatHistory.length > 0 ? tempChatHistory[0].id : null;
    if (!latestSessionId) {
      setMessages([]);
      return;
    }

    // 4. Fetch all messages for the latest session, oldest first
    fetchMessagesForSession(latestSessionId);
  };
  const fetchMessagesForSession = async (sessionId: string) => {
    const { data: sessionMessages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("session_id", sessionId)
      .in("message_role", ["user", "assistant"])
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching session messages:", error);
      setMessages([]);
      return;
    }

    setMessages(
      (sessionMessages || []).map((message) => ({
        content: message.message_content,
        role: message.message_role,
        timestamp: new Date(message.created_at),
        displayName: user?.name || "",
      }))
    );
    currentSessionIdRef.current = sessionId;
  };
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    if (!user) return;
    fetchInstructions().then((data) => {
      instructionsRef.current = data || "";
    });
    fetchLatestSessionMessages();
  }, [user]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    const fetchUser = async () => {
      const authUser = await supabase.auth.getUser();
      console.log("authUser", authUser);
      const profile = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", authUser.data.user?.id)
        .single();
      console.log("profile", profile);
      if (authUser.data.user) {
        setUser({
          user_id: authUser.data.user?.id || "",
          name: authUser.data.user?.user_metadata.full_name || "",
          email: authUser.data.user?.email || "",
          influence_style: profile.data?.secondary_influence_style
            ? profile.data?.primary_influence_style +
              "-" +
              profile.data?.secondary_influence_style
            : profile.data?.primary_influence_style || "",
          avatar: generateAvatar(
            authUser.data.user?.user_metadata.full_name || ""
          ),
          status: "online",
          color: getRandomColor(0),
        });
      }
    };
    fetchUser();
  }, []);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setInput(textarea.value);

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";

    // Calculate new height with limits
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 48), 120); // min 48px, max 120px
    textarea.style.height = `${newHeight}px`;
  };

  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();

      if (!input.trim() || !user) return;
      setInput("");
      setIsLoading(true);

      const userMessage: Message = {
        content: input,
        role: "user",
        timestamp: new Date(),
        displayName: user.name,
      };
      setMessages((prev) => [...prev, userMessage]);
      const sessionId = currentSessionIdRef.current || crypto.randomUUID();
      currentSessionIdRef.current = sessionId;
      insertMessage(user?.user_id || "", sessionId || "", input, "user");
      addZepMessage(
        user?.user_id || "",
        sessionId || "",
        input,
        "user",
        user?.name || ""
      );
      const zepMemoryContext = await getZepMemoryContext(sessionId || "");

      // const userInfluenceStyle = user?.influence_style;
      // const feedbackQuery = `
      //   User's influence style is: ${userInfluenceStyle}\n\n
      //   user's message: ${input}\n\n
      //   In this case how should the assistant respond?\n\n`;
      // console.log("feedbackQuery", feedbackQuery);
      // const feedbackResponse = await fetch("/api/llama/feedback/", {
      //   method: "POST",
      //   body: JSON.stringify({
      //     query: feedbackQuery,
      //     userInfluenceStyle: userInfluenceStyle,
      //   }),
      // });
      // console.log("feedbackResponse", feedbackResponse);
      // const feedbackResponseData = await feedbackResponse.json();
      // console.log("feedbackResponseData", feedbackResponseData);
      // const relevantFeedbacks = feedbackResponseData
      //   .map((feedback: any) => feedback.node.text + "\n\n")
      //   .join("\n");
      // console.log("relevantFeedbacks", relevantFeedbacks);

      // const guidanceQuery = `
      //   User's influence style is: ${userInfluenceStyle}\n\n
      //   Here is user's message: ${input}\n\n
      //   In this case how should the assistant respond?\n\n`;

      // const guidanceResponse = await fetch("/api/llama/guidance/", {
      //   method: "POST",
      //   body: JSON.stringify({
      //     query: guidanceQuery,
      //     userInfluenceStyle: userInfluenceStyle,
      //   }),
      // });
      // console.log("guidanceResponse", guidanceResponse);
      // const guidanceResponseData = await guidanceResponse.json();
      // console.log("guidanceResponseData", guidanceResponseData);
      // const relevantGuidance = guidanceResponseData
      //   .map((guidance: any) => guidance.node.text + "\n\n")
      //   .join("\n");
      // console.log("relevantGuidance", relevantGuidance);

      // const finalInstructions = `
      //   ${instructionsRef.current}\n\n${
      //   relevantGuidance.length > 0
      //     ? "Below is the relevant additional guidance for this user.\n\n"
      //     : ""
      // }
      //   ${relevantGuidance}
      // `;

      betty.mutate(
        instructionsRef.current || "", // Can pass additional guidance here
        [
          ...messages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
          {
            role: "user",
            content: input,
          },
        ],
        "", // Can pass relevant feedbacks here
        {
          name: user?.name || "",
          influence_style: user?.influence_style || "",
        },
        zepMemoryContext
      );
    } catch (error) {
      console.error("Error submitting message:", error);
      setToast({
        type: "error",
        message: "Error submitting message",
      });
    }
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
    localStorage.removeItem("selectedUser");
    router.push("/");
  };

  const getMessageColor = (role: string) => {
    switch (role) {
      case "user":
        return user
          ? `${user.color.replace("bg-", "bg-")} text-white`
          : "bg-blue-500 text-white";
      case "assistant":
        return "bg-gray-100 text-black border border-gray-200";
      default:
        return "bg-gray-100 text-black";
    }
  };

  const getAvatarForSender = (role: string) => {
    switch (role) {
      case "user":
        return user ? (
          <div
            className={`w-8 h-8 rounded-full ${user.color} flex items-center justify-center flex-shrink-0 text-white font-bold text-xs`}
          >
            {user.avatar}
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

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="font-inter text-gray-600 mb-4">Loading chat...</p>
          <Button
            onClick={handleBackToHome}
            className="bg-[#92278F] hover:bg-[#7a1f78] text-white"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
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
      <div className="w-80 bg-gray-100 border-r border-gray-200 flex flex-col">
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

        {/* Chat History List - Only showing the current user */}
        <div className="flex-1 overflow-y-auto">
          {chatHistory.map((chat, idx) => (
            <div
              key={chat.id}
              className={`p-4 border-b border-gray-100 border-l-4 cursor-pointer transition-all duration-300
                ${
                  currentSessionIdRef.current === chat.id
                    ? "border-l-[#92278F] !bg-[#f3e8fa]"
                    : "border-l-transparent hover:bg-[#f3e8fa] bg-white"
                }
                animate-fadeInUp 
              `}
              style={{ animationDelay: `${idx * 60}ms` }} // Staggered effect
              onClick={() => fetchMessagesForSession(chat.id)}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatHistoryTime(chat.timestamp)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 truncate mt-1 h-5 overflow-hidden">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p
                            style={{
                              whiteSpace: "pre-line",
                              marginBottom: "1em",
                            }}
                          >
                            {children}
                          </p>
                        ),
                      }}
                    >
                      {chat.lastMessage}
                    </ReactMarkdown>
                  </div>
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
              <div>
                <h1 className="font-playfair text-2xl font-bold">
                  {user.name}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="text-white/80">
                    {getInfluenceIcon(user.influence_style)}
                  </div>
                  <span className="font-inter text-sm text-white/90 capitalize">
                    {user.influence_style
                      .split("-")
                      .map(
                        (style) =>
                          style.charAt(0).toUpperCase() + style.slice(1)
                      )
                      .join(" + ")}
                  </span>
                </div>
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
                    <AvatarImage src={""} />
                    <AvatarFallback className="bg-white text-[#92278F] font-semibold">
                      {user?.avatar}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user?.name && <p className="font-medium">{user.name}</p>}
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/subscription")}>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-100">
          {messages.map((message, index) => (
            <div
              key={message.timestamp.toISOString()}
              className={`flex space-x-3 animate-in slide-in-from-bottom-2 duration-300 ${
                message.role === "assistant"
                  ? "items-start"
                  : "items-start justify-end"
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Avatar - show first for AI, last for User */}
              {message.role === "assistant" && getAvatarForSender(message.role)}

              <div
                className={`flex flex-col ${
                  message.role === "assistant" ? "items-start" : "items-end"
                } max-w-[70%]`}
              >
                {/* Message bubble */}
                <div
                  className={`px-4 py-3 rounded-2xl ${getMessageColor(
                    message.role
                  )} shadow-sm ${
                    message.role === "assistant"
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
              {message.role !== "assistant" && getAvatarForSender(message.role)}
            </div>
          ))}
        </div>

        {/* Message Input Area */}
        <div className="p-6 bg-white border-t border-gray-200">
          <div className="space-y-4">
            {/* Message Input */}
            <form onSubmit={handleSubmit} className="flex space-x-3">
              <Textarea
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleTextareaKeyDown}
                placeholder="Type your message here..."
                className="flex-1 font-inter border-gray-300 focus:border-[#92278F] focus:ring-[#92278F] resize-none min-h-[48px] max-h-[120px]"
                rows={1}
              />
              <Button
                type="submit"
                className="bg-[#92278F] hover:bg-[#7a1f78] text-white px-6 h-12"
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
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
