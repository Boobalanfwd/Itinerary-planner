"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Search,
  Send,
  MessageCircle,
  Crown,
  User,
  Users,
  Sparkles,
  ArrowLeft,
  Circle,
  Clock,
  Compass,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSubscription } from "@/app/hooks/useSubscription";
import { useDebounce } from "@/hooks/useDebounce";

interface PeerUser {
  id: string;
  name: string | null;
  username?: string | null;
  email?: string | null;
  image?: string | null;
  bio?: string | null;
  subscriptionTier?: string | null;
}

interface P2PMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderTier?: string;
  recipientId: string;
  recipientName?: string;
  recipientAvatar?: string;
  text: string;
  createdAt: string;
}

interface ConversationSummary {
  conversationKey: string;
  peerId: string;
  lastMessage: P2PMessage;
}

const P2P_STARTERS = [
  "Hey! Loved your travel itinerary! ✈️",
  "Any hidden gem spots you'd recommend? 🗺️",
  "Are you planning any trips soon? 🎒",
  "Would you like to collaborate on an itinerary? 🤝",
];

export function P2PChatRoom() {
  const { data: session } = useSession();
  const { tier } = useSubscription();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Traveler search & directory state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [suggestedTravelers, setSuggestedTravelers] = useState<PeerUser[]>([]);
  const [loadingTravelers, setLoadingTravelers] = useState(false);

  // Selected conversation & messages
  const [selectedPeer, setSelectedPeer] = useState<PeerUser | null>(null);
  const [messages, setMessages] = useState<P2PMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = session?.user?.id || session?.user?.email || "";
  const currentUserName = session?.user?.name || "Fellow Traveler";
  const currentUserAvatar =
    session?.user?.image ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserId || "traveler"}`;

  // 1. Socket connection & listeners
  useEffect(() => {
    if (!currentUserId) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
    const s = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    s.on("connect", () => {
      setIsConnected(true);
      s.emit("user:register", { userId: currentUserId });
      s.emit("p2p:get-conversations", { userId: currentUserId });
    });

    s.on("disconnect", () => {
      setIsConnected(false);
    });

    s.on(
      "p2p:history",
      (data: { conversationKey: string; peerId: string; messages: P2PMessage[] }) => {
        if (data?.messages) {
          setMessages(data.messages);
        }
      }
    );

    s.on(
      "p2p:new-message",
      (data: { conversationKey: string; message: P2PMessage }) => {
        setMessages((prev) => {
          // Avoid duplicate messages if socket echoed back
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });

        // Also update recent conversations list preview
        setConversations((prev) => {
          const peerId =
            data.message.senderId === currentUserId
              ? data.message.recipientId
              : data.message.senderId;

          const existingIndex = prev.findIndex((c) => c.peerId === peerId);
          const updatedSummary: ConversationSummary = {
            conversationKey: data.conversationKey,
            peerId,
            lastMessage: data.message,
          };

          if (existingIndex >= 0) {
            const copy = [...prev];
            copy.splice(existingIndex, 1);
            return [updatedSummary, ...copy];
          }
          return [updatedSummary, ...prev];
        });
      }
    );

    s.on("p2p:conversations-list", (list: ConversationSummary[]) => {
      if (Array.isArray(list)) {
        setConversations(list);
      }
    });

    s.on(
      "p2p:incoming-notification",
      (notif: {
        senderId: string;
        senderName: string;
        senderAvatar?: string;
        text: string;
        conversationKey: string;
      }) => {
        // Refresh conversations list
        s.emit("p2p:get-conversations", { userId: currentUserId });
      }
    );

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [currentUserId]);

  // 2. Fetch travelers (debounced search or suggestions)
  useEffect(() => {
    let isMounted = true;
    async function fetchUsers() {
      setLoadingTravelers(true);
      try {
        const url = debouncedSearch
          ? `/api/users/search?q=${encodeURIComponent(debouncedSearch)}`
          : "/api/users/search";
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.users)) {
          setSuggestedTravelers(data.users);
          // If no peer is selected yet and we have users, preselect first user on desktop
          if (!selectedPeer && data.users.length > 0 && window.innerWidth >= 768) {
            handleSelectPeer(data.users[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch travelers:", err);
      } finally {
        if (isMounted) setLoadingTravelers(false);
      }
    }

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch]);

  // 3. Select peer to chat with
  const handleSelectPeer = (peer: PeerUser) => {
    setSelectedPeer(peer);
    setShowMobileChat(true);
    setMessages([]);

    if (socket && currentUserId) {
      socket.emit("p2p:join", {
        userId: currentUserId,
        peerId: peer.id,
      });
    }
  };

  // 4. Send message handler
  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !selectedPeer || !currentUserId) return;

    const messageText = inputText.trim();
    setInputText("");

    if (socket && isConnected) {
      socket.emit("p2p:send-message", {
        senderId: currentUserId,
        senderName: currentUserName,
        senderAvatar: currentUserAvatar,
        senderTier: tier || "FREE",
        recipientId: selectedPeer.id,
        recipientName: selectedPeer.name || "Fellow Traveler",
        recipientAvatar:
          selectedPeer.image ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedPeer.id}`,
        text: messageText,
      });
    } else {
      // Local optimistic fallback
      const localMsg: P2PMessage = {
        id: `p2p-local-${Date.now()}`,
        senderId: currentUserId,
        senderName: currentUserName,
        senderAvatar: currentUserAvatar,
        senderTier: tier || "FREE",
        recipientId: selectedPeer.id,
        recipientName: selectedPeer.name || "Fellow Traveler",
        text: messageText,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, localMsg]);
    }
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatMessageTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Just now";
    }
  };

  return (
    <div className="bg-card border border-border/80 rounded-3xl shadow-soft overflow-hidden h-[680px] grid grid-cols-1 md:grid-cols-12">
      {/* LEFT COLUMN: Traveler Directory & Active Chats (Hidden on mobile when chat is active) */}
      <div
        className={`md:col-span-4 lg:col-span-4 border-r border-border/70 flex flex-col h-full bg-muted/20 ${
          showMobileChat ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Search header */}
        <div className="p-4 border-b border-border/70 bg-card/60 backdrop-blur-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="size-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Direct Messages</h3>
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              P2P Ready
            </span>
          </div>

          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search travelers..."
              className="w-full pl-9 pr-3 py-2 bg-background border border-border/70 rounded-xl text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>
        </div>

        {/* Travelers list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-border/30">
          {/* Active Conversations Section */}
          {conversations.length > 0 && !searchQuery && (
            <div className="pb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-1.5">
                Active Chats
              </p>
              {conversations.map((conv) => {
                const isSelected = selectedPeer?.id === conv.peerId;
                const peerFromList = suggestedTravelers.find((u) => u.id === conv.peerId);
                const displayName =
                  peerFromList?.name ||
                  (conv.lastMessage.senderId === currentUserId
                    ? conv.lastMessage.recipientName
                    : conv.lastMessage.senderName) ||
                  "Traveler";
                const displayAvatar =
                  peerFromList?.image ||
                  (conv.lastMessage.senderId === currentUserId
                    ? conv.lastMessage.recipientAvatar
                    : conv.lastMessage.senderAvatar) ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.peerId}`;

                return (
                  <button
                    key={conv.conversationKey}
                    type="button"
                    onClick={() =>
                      handleSelectPeer({
                        id: conv.peerId,
                        name: displayName,
                        image: displayAvatar,
                      })
                    }
                    className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 text-primary border border-primary/30 shadow-2xs"
                        : "hover:bg-muted/70 text-foreground"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="size-9 rounded-full border border-border/70">
                        <AvatarImage src={displayAvatar} />
                        <AvatarFallback className="text-xs font-bold">
                          {displayName[0]?.toUpperCase() || "T"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="size-2.5 rounded-full bg-emerald-500 absolute bottom-0 right-0 ring-2 ring-background" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold truncate">{displayName}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatMessageTime(conv.lastMessage.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {conv.lastMessage.senderId === currentUserId ? "You: " : ""}
                        {conv.lastMessage.text}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Suggested / Searched Travelers Section */}
          <div className="pt-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-1.5 flex items-center justify-between">
              <span>{searchQuery ? "Search Results" : "Explore Travelers"}</span>
              <span className="text-[10px] lowercase font-normal text-muted-foreground">
                {suggestedTravelers.length} available
              </span>
            </p>

            {loadingTravelers ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                Searching explorers...
              </div>
            ) : suggestedTravelers.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No travelers found for &quot;{searchQuery}&quot;
              </div>
            ) : (
              suggestedTravelers.map((traveler) => {
                const isSelected = selectedPeer?.id === traveler.id;
                return (
                  <button
                    key={traveler.id}
                    type="button"
                    onClick={() => handleSelectPeer(traveler)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 text-primary border border-primary/30 shadow-2xs"
                        : "hover:bg-muted/70 text-foreground"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="size-9 rounded-full border border-border/70">
                        <AvatarImage
                          src={
                            traveler.image ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${traveler.id}`
                          }
                        />
                        <AvatarFallback className="text-xs font-bold">
                          {(traveler.name || "T")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="size-2.5 rounded-full bg-emerald-500 absolute bottom-0 right-0 ring-2 ring-background" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold truncate">
                          {traveler.name || "Explorer"}
                        </span>
                        {traveler.subscriptionTier &&
                          traveler.subscriptionTier !== "FREE" && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-0.5">
                              <Crown className="size-2" />
                              {traveler.subscriptionTier}
                            </span>
                          )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {traveler.bio || (traveler.username ? `@${traveler.username}` : "Ready to plan trips")}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Active P2P Conversation Thread */}
      <div
        className={`md:col-span-8 lg:col-span-8 flex flex-col h-full bg-card ${
          !showMobileChat ? "hidden md:flex" : "flex"
        }`}
      >
        {selectedPeer ? (
          <>
            {/* Peer Header */}
            <div className="p-3.5 sm:px-6 border-b border-border/70 bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Back button for mobile */}
                <button
                  type="button"
                  onClick={() => setShowMobileChat(false)}
                  className="md:hidden p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <ArrowLeft className="size-4" />
                </button>

                <div className="relative">
                  <Avatar className="size-10 rounded-full border border-border/80 shadow-2xs">
                    <AvatarImage
                      src={
                        selectedPeer.image ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedPeer.id}`
                      }
                    />
                    <AvatarFallback className="text-xs font-bold">
                      {(selectedPeer.name || "T")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="size-2.5 rounded-full bg-emerald-500 absolute bottom-0 right-0 ring-2 ring-background" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-foreground">
                      {selectedPeer.name || "Explorer"}
                    </h4>
                    {selectedPeer.subscriptionTier &&
                      selectedPeer.subscriptionTier !== "FREE" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-0.5">
                          <Crown className="size-2.5" />
                          {selectedPeer.subscriptionTier}
                        </span>
                      )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {selectedPeer.username
                      ? `@${selectedPeer.username} • Direct P2P Channel`
                      : "Direct P2P Traveler Channel"}
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Peer
              </div>
            </div>

            {/* Message History */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                  <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-3">
                    <MessageCircle className="size-6" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    Start a conversation with {selectedPeer.name || "this traveler"}
                  </p>
                  <p className="text-xs mt-1 max-w-sm">
                    Say hello, share tips, or discuss co-planning travel itineraries directly peer-to-peer!
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === currentUserId;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 items-start ${isMe ? "flex-row-reverse" : ""}`}
                    >
                      <Avatar className="size-7 rounded-full border border-border/70 mt-0.5 shrink-0">
                        <AvatarImage
                          src={
                            msg.senderAvatar ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderId}`
                          }
                        />
                        <AvatarFallback className="text-[10px] font-bold">
                          {(msg.senderName || "T")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div
                        className={`space-y-1 max-w-[80%] sm:max-w-[70%] ${
                          isMe ? "items-end text-right" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="font-bold text-foreground">
                            {isMe ? "You" : msg.senderName}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatMessageTime(msg.createdAt)}
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

            {/* Quick Starters */}
            <div className="px-4 py-2 border-t border-border/50 bg-muted/20 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                Quick Hello:
              </span>
              {P2P_STARTERS.map((starter) => (
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
                placeholder={`Message ${selectedPeer.name || "traveler"} directly...`}
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
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <Users className="size-12 text-primary/30 mb-3 animate-pulse" />
            <h4 className="text-base font-bold text-foreground">Select a Traveler</h4>
            <p className="text-xs mt-1 max-w-xs">
              Choose an explorer from the left panel to begin a 1-on-1 peer-to-peer chat.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
