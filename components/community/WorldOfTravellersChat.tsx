"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Send,
  Sparkles,
  Users,
  MessageCircle,
  Crown,
  Compass,
  Smile,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/app/hooks/useSubscription";

interface ChatMessage {
  id: string;
  text: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    tier?: string;
  };
  createdAt: string;
}

const QUICK_STARTERS = [
  "Anyone in Tokyo right now? 🍣",
  "Best sunset spot in Amalfi Coast? 🌅",
  "Solo traveler looking for weekend hiking buddy! 🥾",
  "Tips for traveling Paris on a budget? 🥐",
];

export function WorldOfTravellersChat() {
  const { data: session } = useSession();
  const { tier } = useSubscription();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUser = {
    id: session?.user?.id || session?.user?.email || "guest-" + Math.random().toString(36).substr(2, 4),
    name: session?.user?.name || "Traveler",
    avatar:
      session?.user?.image ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${session?.user?.name || "traveler"}`,
    tier: tier || "FREE",
  };

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
    const s = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    s.on("connect", () => {
      setIsConnected(true);
      s.emit("community:join", currentUser);
    });

    s.on("disconnect", () => {
      setIsConnected(false);
    });

    s.on("community:history", (history: ChatMessage[]) => {
      if (Array.isArray(history)) {
        setMessages(history);
      }
    });

    s.on("community:new-message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    if (socket && isConnected) {
      socket.emit("community:send-message", {
        text: inputText.trim(),
        user: currentUser,
      });
    } else {
      // Local fallback if socket is reconnecting
      const fallbackMsg: ChatMessage = {
        id: `local-${Date.now()}`,
        text: inputText.trim(),
        user: currentUser,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    }

    setInputText("");
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Just now";
    }
  };

  return (
    <div className="bg-card border border-border/80 rounded-3xl shadow-soft overflow-hidden flex flex-col h-[680px]">
      {/* Chat Room Top Bar */}
      <div className="p-4 sm:px-6 border-b border-border/70 bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-soft">
            <Compass className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">
                World of Travellers
              </h2>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {isConnected ? "Live Chat" : "Connecting..."}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Exchange trip advice, recommendations, and local travel secrets
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <Users className="size-4 text-primary" />
          <span>Global Community</span>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <MessageCircle className="size-10 text-primary/40 mb-3 animate-bounce" />
            <p className="text-sm font-semibold">The chat room is quiet right now.</p>
            <p className="text-xs mt-1">Be the first to say hello to travelers worldwide!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user.id === currentUser.id;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 items-start ${isMe ? "flex-row-reverse" : ""}`}
              >
                <img
                  src={msg.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.user.id}`}
                  alt={msg.user.name}
                  className="size-8 rounded-full border border-border/80 object-cover mt-0.5 shrink-0"
                />

                <div className={`space-y-1 max-w-[80%] sm:max-w-[70%] ${isMe ? "items-end text-right" : ""}`}>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-foreground">
                      {isMe ? "You" : msg.user.name}
                    </span>

                    {msg.user.tier && msg.user.tier !== "FREE" && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-0.5">
                        <Crown className="size-2.5" />
                        {msg.user.tier}
                      </span>
                    )}

                    <span className="text-[10px] text-muted-foreground">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-soft-xs ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-tr-xs"
                        : "bg-muted/70 text-foreground border border-border/60 rounded-tl-xs"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2 border-t border-border/50 bg-muted/20 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
          Quick Ask:
        </span>
        {QUICK_STARTERS.map((starter) => (
          <button
            key={starter}
            type="button"
            onClick={() => setInputText(starter)}
            className="text-[11px] font-medium px-3 py-1 rounded-full bg-background border border-border/70 hover:border-primary/50 text-foreground hover:text-primary transition-all whitespace-nowrap cursor-pointer shadow-2xs"
          >
            {starter}
          </button>
        ))}
      </div>

      {/* Input Message Area */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 sm:p-4 border-t border-border/70 bg-card flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Share travel tips or ask a destination question..."
          className="flex-1 px-4 py-2.5 bg-background border border-border/80 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
        />

        <Button
          type="submit"
          disabled={!inputText.trim()}
          className="rounded-2xl px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-soft flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
        >
          <Send className="size-4" />
          <span className="hidden sm:inline">Send</span>
        </Button>
      </form>
    </div>
  );
}
