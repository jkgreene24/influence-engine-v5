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
  Settings,
  Plus,
  Loader2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useBetty, useInitialMessageChat } from "../../baml_client/react/hooks";

interface ChatUser {
  user_id: string;
  name: string;
  influence_style: string;
  avatar: string;
  status: "online" | "offline" | "away";
  color: string;
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

  // For single styles, show just the icon
  return getIcon(styles[0]);
};

export default function AdminChatInterface() {
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
        userId: selectedUser?.user_id || "",
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
        selectedUser?.user_id || "",
        sessionId || "",
        data?.answer || "",
        "assistant"
      );
      await addZepMessage(
        selectedUser?.user_id || "",
        sessionId || "",
        data?.answer || "",
        "assistant",
        selectedUser?.name || null
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
            userName: selectedUser?.name || "",
            userAvatar: selectedUser?.avatar || "",
            userColor: selectedUser?.color || "",
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
        selectedUser?.user_id || "",
        sessionId || "",
        data || "",
        "assistant"
      );
      await addZepMessage(
        selectedUser?.user_id || "",
        sessionId || "",
        data || "",
        "assistant",
        selectedUser?.name || null
      );
      setChatHistory(
        (prev) =>
          [
            {
              id: sessionId || "",
              userName: selectedUser?.name || "",
              userAvatar: selectedUser?.avatar || "",
              userColor: selectedUser?.color || "",
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
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const instructionsRef = useRef<string | null>(null);
  const [input, setInput] = useState("");
  const [currentSender, setCurrentSender] = useState<"developer" | "user">(
    "user"
  );
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
    if (selectedUser) {
      await initializeChat(selectedUser.user_id);
    }
  };
  const initializeChat = async (user_id: string) => {
    await fetchInstructions().then((data) => {
      instructionsRef.current = data || "";
    });
    const influenceStyle = selectedUser?.influence_style;
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
    // const guidance_prompt = `${instructions}\n\nBelow are additional guidance that you can use to help the user: ${retrieved_guidance_text}`;
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
    if (!selectedUser) return;

    // 1. Fetch all messages for the user, newest first
    const { data: allMessages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", selectedUser.user_id)
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
          userName: selectedUser.name,
          userAvatar: selectedUser.avatar,
          userColor: selectedUser.color,
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
        displayName:
          message.message_role === "user"
            ? selectedUser?.name
            : message.message_role === "developer"
            ? "Admin"
            : "Assistant",
      }))
    );
    currentSessionIdRef.current = sessionId;
  };
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    if (!selectedUser) return;
    fetchInstructions().then((data) => {
      instructionsRef.current = data || "";
    });
    // const upsertZepUser = async () => {
    //   const response = await fetch("/api/zep/user", {
    //     method: "POST",
    //     body: JSON.stringify({
    //       userId: selectedUser.user_id,
    //       email: "",
    //       first_name: "",
    //       last_name: "",
    //       metadata: {
    //         name: selectedUser.name,
    //         influence_style: selectedUser.influenceStyle,
    //         last_active: new Date().toISOString(),
    //       },
    //     }),
    //   });
    //   if (!response.ok) {
    //     throw new Error("Failed to upsert user");
    //   }
    //   return response.json();
    // };
    // upsertZepUser();
    fetchLatestSessionMessages();
  }, [selectedUser]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    const localStoredUser = localStorage.getItem("selectedUser");
    if (localStoredUser) {
      const user = JSON.parse(localStoredUser);
      setSelectedUser(user);
    }
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

      if (!input.trim() || !selectedUser) return;
      setInput("");
      setIsLoading(true);

      const userMessage: Message = {
        content: input,
        role: currentSender,
        timestamp: new Date(),
        displayName: currentSender === "user" ? selectedUser.name : "Admin",
      };
      setMessages((prev) => [...prev, userMessage]);
      const newSessionId = currentSessionIdRef.current || crypto.randomUUID();
      currentSessionIdRef.current = newSessionId;
      insertMessage(
        selectedUser?.user_id || "",
        newSessionId || "",
        input,
        currentSender
      );
      if (currentSender === "developer") {
        // const userInfluenceStyle = selectedUser?.influence_style;
        // const feedbackTemplate = `=============================\n\n
        //   # context\n\n
        //   user's influence style: ${userInfluenceStyle}\n\n
        //   # conversation history\n\n
        //   ${messages
        //     .slice(-2)
        //     .map((message) => {
        //       if (message.role === "user") {
        //         return `user: ${message.content}`;
        //       } else if (message.role === "assistant") {
        //         return `assistant: ${message.content}`;
        //       }
        //       return "";
        //     })
        //     .filter(Boolean)
        //     .join("\n")}\n\n
        //   # feedback: ${input}\n\n`;
        // const feedbackIngest = await fetch("/api/llama/feedback/ingest", {
        //   method: "POST",
        //   body: JSON.stringify({
        //     text: feedbackTemplate,
        //     userInfluenceStyle: userInfluenceStyle,
        //   }),
        // });
        // const feedbackIngestData = await feedbackIngest.json();
        // if (feedbackIngestData.success == true) {
        //   setToast({
        //     type: "success",
        //     message: "Feedback ingested successfully",
        //   });
        // } else {
        //   setToast({
        //     type: "error",
        //     message: "Error ingesting feedback",
        //   });
        // }
        // setIsLoading(false);
        return;
      }
      addZepMessage(
        selectedUser?.user_id || "",
        newSessionId || "",
        input,
        "user",
        selectedUser?.name || ""
      );
      const zepMemoryContext = await getZepMemoryContext(newSessionId || "");

      // const userInfluenceStyle = selectedUser?.influenceStyle;
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
      //   ${instructions}\n\n${
      //   relevantGuidance.length > 0
      //     ? "Below is the relevant additional guidance for this user.\n\n"
      //     : ""
      // }
      //   ${relevantGuidance}
      // `;

      betty.mutate(
        instructionsRef.current || "", // Can pass additional guidance here
        [
          ...messages
            .filter((m) => m.role !== "developer")
            .map((m) => ({
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
          name: selectedUser?.name || "",
          influence_style: selectedUser?.influence_style || "",
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

  const handleBackToDashboard = () => {
    localStorage.removeItem("selectedUser");
    router.push("/admin");
  };

  const getMessageColor = (role: string) => {
    switch (role) {
      case "developer":
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

  const getAvatarForSender = (role: string) => {
    switch (role) {
      case "developer":
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
            {selectedUser.avatar}
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
          <p className="font-inter text-gray-600 mb-4">Loading chat...</p>
          <Button
            onClick={handleBackToDashboard}
            className="bg-[#92278F] hover:bg-[#7a1f78] text-white"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex">
      {/* Chat History Sidebar */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
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
              Dashboard
            </Button>
            <Button
              onClick={() => handleNewChat()}
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
          <div className="flex items-center space-x-4">
            <div
              className={`w-12 h-12 rounded-full ${selectedUser.color} flex items-center justify-center text-white font-bold font-inter relative`}
            >
              {selectedUser.avatar}
              {/* <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  selectedUser.status === "online"
                    ? "bg-green-500"
                    : selectedUser.status === "away"
                    ? "bg-yellow-500"
                    : "bg-gray-400"
                }`}
              /> */}
            </div>
            <div>
              <h1 className="font-playfair text-2xl font-bold">
                AI Chat with {selectedUser.name}
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <div className="text-white/80">
                  {getInfluenceIcon(selectedUser.influence_style)}
                </div>
                <span className="font-inter text-sm text-white/90 capitalize">
                  {selectedUser.influence_style}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {currentResponse
            ? [...messages, currentResponse].map((message, index) => (
                <div
                  key={index}
                  className={`flex space-x-3 ${
                    message.role === "assistant"
                      ? "items-start"
                      : "items-start justify-end"
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Avatar - show first for AI, last for Admin/User */}
                  {message.role === "assistant" &&
                    getAvatarForSender(message.role)}

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
                      {message.role === "assistant" ? (
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
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        <div className="whitespace-pre-wrap">
                          {message.content}
                        </div>
                      )}
                    </div>

                    {/* Timestamp and role info */}
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
                  {message.role !== "assistant" &&
                    getAvatarForSender(message.role)}
                </div>
              ))
            : messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex space-x-3 ${
                    message.role === "assistant"
                      ? "items-start"
                      : "items-start justify-end"
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Avatar - show first for AI, last for Admin/User */}
                  {message.role === "assistant" &&
                    getAvatarForSender(message.role)}

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
                      {message.role === "assistant" ? (
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
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        <div className="whitespace-pre-wrap">
                          {message.content}
                        </div>
                      )}
                    </div>

                    {/* Timestamp and role info */}
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
                  {message.role !== "assistant" &&
                    getAvatarForSender(message.role)}
                </div>
              ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Area */}
        <div className="p-6 bg-white border-t border-gray-200">
          <div className="space-y-4">
            {/* role Selection */}
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={currentSender === "developer" ? "default" : "outline"}
                onClick={() => setCurrentSender("developer")}
                className={`font-inter text-sm flex items-center space-x-2 ${
                  currentSender === "developer"
                    ? "bg-[#92278F] hover:bg-[#7a1f78] text-white"
                    : "border-[#92278F] text-[#92278F] hover:bg-[#92278F] hover:text-white"
                }`}
                disabled={true}
              >
                <Settings className="w-4 h-4" />
                <span>Send Feedback</span>
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
                disabled={currentSender === "user" ? true : false}
              >
                <User className="w-4 h-4" />
                <span>Send as {selectedUser.name}</span>
              </Button>
            </div>

            {/* Message Input */}
            <form onSubmit={handleSubmit} className="flex space-x-3">
              <Textarea
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleTextareaKeyDown}
                placeholder={
                  currentSender === "developer"
                    ? "Enter feedback..."
                    : `Message as ${selectedUser.name}...`
                }
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
              {currentSender === "developer"
                ? "Feedback helps guide the AI's behavior and responses"
                : `User messages are sent as if ${selectedUser.name} is speaking`}
            </p>
          </div>
        </div>
      </div>
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
