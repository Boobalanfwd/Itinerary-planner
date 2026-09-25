"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Globe,
  MessageCircle,
  Users,
  Compass,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WorldOfTravellersChat } from "@/components/community/WorldOfTravellersChat";
import { P2PChatRoom } from "@/components/community/P2PChatRoom";

export default function ChatRoomPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // "world" | "p2p"
  const initialMode = searchParams.get("tab") === "p2p" ? "p2p" : "world";
  const [activeMode, setActiveMode] = useState<"world" | "p2p">(initialMode);

  // Safe client redirect when unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/dashboard/chat");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">
            Entering Travellers Hub...
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-16">
        {/* Hub Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-3">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>World of Travellers Hub</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-3 font-serif">
            Travelers Chat Room
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {activeMode === "world"
              ? "Join the live global community conversation with adventurers around the world sharing real-time travel tips."
              : "Direct peer-to-peer messaging to plan trips, exchange local secrets, and connect 1-on-1."}
          </p>

          {/* Mode Classifier Tabs: World Chat vs P2P Chat */}
          <div className="inline-flex items-center gap-2 p-1.5 rounded-full bg-muted/60 border border-border/80 mt-6 shadow-soft-xs">
            <button
              type="button"
              onClick={() => setActiveMode("world")}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeMode === "world"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Globe className="size-3.5" />
              <span>World Chat</span>
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            <button
              type="button"
              onClick={() => setActiveMode("p2p")}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeMode === "p2p"
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="size-3.5" />
              <span>P2P Direct Chat</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-primary-foreground/20 text-primary-foreground">
                1-on-1
              </span>
            </button>
          </div>
        </motion.div>

        {/* Content Section: World Chat or P2P Chat */}
        <AnimatePresence mode="wait">
          {activeMode === "world" ? (
            <motion.div
              key="world-chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <WorldOfTravellersChat />
            </motion.div>
          ) : (
            <motion.div
              key="p2p-chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <P2PChatRoom />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
