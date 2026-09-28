"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Send,
  Video,
  Phone,
  MoreVertical,
  SquarePen,
  Pin,
  CheckCheck,
  Paperclip,
  Smile,
  Mic,
  ArrowLeft,
  Sparkles,
  Crown,
  PhoneOff,
  MicOff,
  VideoOff,
  UserPlus,
  UserCheck,
  Clock,
  Lock,
  X,
  MessageCircle,
  Users,
  Compass,
  Check,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useSubscription } from "@/app/hooks/useSubscription";
import { useDebounce } from "@/hooks/useDebounce";

// Types
export interface ChatParticipant {
  id: string;
  name: string;
  avatar: string;
  role?: string;
  tier?: string;
  statusText?: string;
  isOnline?: boolean;
  color?: string;
}

export interface MessageItem {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  createdAt: string;
  senderColor?: string;
  isOutgoing?: boolean;
}

export type ConnectionStatus =
  | "WORLD"
  | "ACCEPTED"
  | "PENDING_RECEIVED"
  | "PENDING_SENT"
  | "NONE";

export interface ConversationItem {
  id: string; // "world-chat" or peer userId
  type: "world" | "direct";
  title: string;
  avatar: string;
  isWorldChat?: boolean;
  isPinned?: boolean;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
  isReadByPeer?: boolean;
  isTyping?: boolean;
  typingUser?: string;
  isOnline?: boolean;
  connectionStatus?: ConnectionStatus;
  inviteId?: string;
  inviteMessage?: string;
  participant?: ChatParticipant;
}

// Color palette mapping helper for dynamic senders
const SENDER_COLORS = [
  "text-amber-500 dark:text-amber-400",
  "text-pink-600 dark:text-pink-400",
  "text-amber-700 dark:text-amber-300",
  "text-purple-600 dark:text-purple-400",
  "text-teal-600 dark:text-teal-400",
  "text-sky-600 dark:text-sky-400",
  "text-indigo-600 dark:text-indigo-400",
  "text-emerald-600 dark:text-emerald-400",
];

function getSenderColor(name: string): string {
  if (name === "Lead Frans") return "text-amber-500 dark:text-amber-400";
  if (name === "Floyd Miles") return "text-pink-600 dark:text-pink-400";
  if (name === "Guy Hawkins") return "text-amber-700 dark:text-amber-300";
  if (name === "Theres Web" || name === "Theresa Web") return "text-purple-600 dark:text-purple-400";
  if (name === "Victor Yoga" || name === "Victor") return "text-teal-600 dark:text-teal-400";
  if (name === "PM Okta") return "text-sky-600 dark:text-sky-400";

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SENDER_COLORS.length;
  return SENDER_COLORS[index];
}

const QUICK_STARTERS = [
  "Anyone in Tokyo right now? 🍣",
  "Best sunset spot in Amalfi Coast? 🌅",
  "Solo traveler looking for weekend hiking buddy! 🥾",
  "Tips for traveling Paris on a budget? 🥐",
];

const ICEBREAKER_STARTERS = [
  "Hey! Loved your travel itinerary! ✈️",
  "Are you planning any trips soon? 🎒",
  "Any hidden gem spots you'd recommend? 🗺️",
  "Would you like to collaborate on an itinerary? 🤝",
];

export function UnifiedChatRoom() {
  const { data: session } = useSession();
  const { tier } = useSubscription();
  const searchParams = useSearchParams();

  // Socket state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Social World navigation tab: "chats" | "requests" | "discover"
  const [socialTab, setSocialTab] = useState<"chats" | "requests" | "discover">("chats");

  // Conversations list & active selection (DEFAULT: World Chat)
  const [conversations, setConversations] = useState<ConversationItem[]>([
    {
      id: "world-chat",
      type: "world",
      title: "World of Travellers",
      avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=kretya-studio",
      isWorldChat: true,
      isPinned: true,
      lastMessage: "Live global community hub...",
      lastMessageTime: "now",
      unreadCount: 0,
      isTyping: false,
      isOnline: true,
      connectionStatus: "WORLD",
    },
  ]);
  const [activeChatId, setActiveChatId] = useState<string>("world-chat");
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Messages cache per conversation
  const [messagesMap, setMessagesMap] = useState<Record<string, MessageItem[]>>({});
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Search & New message dialog states
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  // Live social connection lists from API
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [discoverUsers, setDiscoverUsers] = useState<any[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);

  // Active call modal simulation
  const [callState, setCallState] = useState<{
    isOpen: boolean;
    type: "video" | "audio";
    participantName: string;
    participantAvatar: string;
    isMuted: boolean;
    isVideoOff: boolean;
  }>({
    isOpen: false,
    type: "video",
    participantName: "",
    participantAvatar: "",
    isMuted: false,
    isVideoOff: false,
  });

  // Current user details
  const currentUserId = session?.user?.id || session?.user?.email || "guest-traveler";
  const currentUserName = session?.user?.name || "Traveler";
  const currentUserAvatar =
    session?.user?.image ||
    `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`;

  // Input & scroll refs
  const [inputText, setInputText] = useState("");
  const [inviteNote, setInviteNote] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch Real Live World Chat Messages from API
  const fetchWorldMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/world");
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessagesMap((prev) => ({
          ...prev,
          "world-chat": data.messages.map((m: any) => ({
            id: m.id,
            senderId: m.senderId,
            senderName: m.senderName,
            senderAvatar: m.senderAvatar,
            text: m.text,
            createdAt: m.createdAt,
            senderColor: getSenderColor(m.senderName),
            isOutgoing: m.senderId === currentUserId,
          })),
        }));

        if (data.messages.length > 0) {
          const last = data.messages[data.messages.length - 1];
          setConversations((prev) =>
            prev.map((c) =>
              c.id === "world-chat"
                ? {
                    ...c,
                    lastMessage: `${last.senderName}: ${last.text}`,
                    lastMessageTime: last.createdAt,
                  }
                : c
            )
          );
        }
      }
    } catch (err) {
      console.warn("Failed to fetch live world messages:", err);
    }
  }, [currentUserId]);

  // 2. Fetch Real Live Connections from API (Instagram-style Friends, Requests, Discover)
  const fetchConnections = useCallback(async () => {
    setIsLoadingConnections(true);
    try {
      const res = await fetch("/api/chat/connections");
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setIncomingRequests(data.receivedRequests || []);
        setSentRequests(data.sentRequests || []);
        setDiscoverUsers(data.discoverUsers || []);

        // Build conversations list starting with World Chat (DEFAULT at top)
        const newConversations: ConversationItem[] = [
          {
            id: "world-chat",
            type: "world",
            title: "World of Travellers",
            avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=kretya-studio",
            isWorldChat: true,
            isPinned: true,
            lastMessage: "Live global community hub...",
            lastMessageTime: "now",
            unreadCount: 0,
            isOnline: true,
            connectionStatus: "WORLD",
          },
        ];

        // Add Accepted Friends (Unlocked DMs)
        if (Array.isArray(data.friends)) {
          data.friends.forEach((f: any) => {
            newConversations.push({
              id: f.id,
              type: "direct",
              title: f.name || "Explorer",
              avatar: f.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.id}`,
              lastMessage: f.bio || "Connected traveler friend",
              lastMessageTime: "connected",
              isOnline: true,
              connectionStatus: "ACCEPTED",
              participant: {
                id: f.id,
                name: f.name || "Explorer",
                avatar: f.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.id}`,
                role: f.bio || "Connected Explorer",
                tier: f.subscriptionTier || "FREE",
                statusText: "Connected Friend",
                color: getSenderColor(f.name || "Explorer"),
              },
            });
          });
        }

        // Add Incoming Requests (Needs Acceptance)
        if (Array.isArray(data.receivedRequests)) {
          data.receivedRequests.forEach((r: any) => {
            newConversations.push({
              id: r.id,
              type: "direct",
              title: r.name || "Explorer",
              avatar: r.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.id}`,
              lastMessage: `Invite: "${r.message || "Wants to connect"}"`,
              lastMessageTime: "pending",
              unreadCount: 1,
              isOnline: true,
              connectionStatus: "PENDING_RECEIVED",
              inviteId: r.inviteId,
              inviteMessage: r.message,
              participant: {
                id: r.id,
                name: r.name || "Explorer",
                avatar: r.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.id}`,
                role: r.bio || "Sent you a chat invite",
                tier: r.subscriptionTier || "FREE",
                statusText: "Wants to connect",
                color: getSenderColor(r.name || "Explorer"),
              },
            });
          });
        }

        // Add Sent Requests (Awaiting response)
        if (Array.isArray(data.sentRequests)) {
          data.sentRequests.forEach((s: any) => {
            newConversations.push({
              id: s.id,
              type: "direct",
              title: s.name || "Explorer",
              avatar: s.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.id}`,
              lastMessage: "Chat invite sent • Pending",
              lastMessageTime: "pending",
              isOnline: false,
              connectionStatus: "PENDING_SENT",
              inviteId: s.inviteId,
              participant: {
                id: s.id,
                name: s.name || "Explorer",
                avatar: s.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.id}`,
                role: s.bio || "Awaiting acceptance",
                tier: s.subscriptionTier || "FREE",
                statusText: "Invite sent",
                color: getSenderColor(s.name || "Explorer"),
              },
            });
          });
        }

        setConversations(newConversations);
      }
    } catch (err) {
      console.warn("Failed to load connections:", err);
    } finally {
      setIsLoadingConnections(false);
    }
  }, []);

  // 3. Fetch Direct Messages for a specific peer
  const fetchDirectMessages = useCallback(async (peerId: string) => {
    if (!peerId || peerId === "world-chat") return;
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/messages?peerId=${encodeURIComponent(peerId)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessagesMap((prev) => ({
          ...prev,
          [peerId]: data.messages.map((m: any) => ({
            id: m.id,
            senderId: m.senderId,
            senderName: m.senderName,
            senderAvatar: m.senderAvatar,
            text: m.text,
            createdAt: m.createdAt,
            senderColor: getSenderColor(m.senderName),
            isOutgoing: m.senderId === currentUserId,
          })),
        }));

        // Update connection status from backend
        if (data.connectionStatus) {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === peerId
                ? {
                    ...c,
                    connectionStatus: data.connectionStatus,
                    inviteId: data.inviteId,
                  }
                : c
            )
          );
        }
      }
    } catch (err) {
      console.warn("Failed to fetch direct messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, [currentUserId]);

  // Initial load
  useEffect(() => {
    fetchWorldMessages();
    fetchConnections();
  }, [fetchWorldMessages, fetchConnections]);

  // When active chat changes, load its messages
  useEffect(() => {
    if (activeChatId === "world-chat") {
      fetchWorldMessages();
    } else {
      fetchDirectMessages(activeChatId);
    }
  }, [activeChatId, fetchWorldMessages, fetchDirectMessages]);

  // 4. Initialize Socket.IO connection
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
    const s = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 4,
      timeout: 5000,
    });

    s.on("connect", () => {
      setIsConnected(true);
      s.emit("community:join", { id: currentUserId, name: currentUserName });
      s.emit("user:register", { userId: currentUserId });
    });

    s.on("disconnect", () => {
      setIsConnected(false);
    });

    // World Chat socket messages
    s.on("community:new-message", (msg: any) => {
      const incoming: MessageItem = {
        id: msg.id || `world-${Date.now()}`,
        senderId: msg.user?.id || "guest",
        senderName: msg.user?.name || "Traveler",
        senderAvatar:
          msg.user?.avatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.user?.id || "user"}`,
        text: msg.text,
        createdAt: new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        senderColor: getSenderColor(msg.user?.name || "Traveler"),
        isOutgoing: msg.user?.id === currentUserId,
      };

      setMessagesMap((prev) => ({
        ...prev,
        "world-chat": [...(prev["world-chat"] || []), incoming],
      }));

      setConversations((prev) =>
        prev.map((c) =>
          c.id === "world-chat"
            ? {
                ...c,
                lastMessage: `${msg.user?.name || "Traveler"}: ${msg.text}`,
                lastMessageTime: "now",
                unreadCount: activeChatId === "world-chat" ? 0 : (c.unreadCount || 0) + 1,
              }
            : c
        )
      );
    });

    // P2P Direct chat socket messages
    s.on("p2p:new-message", (data: { conversationKey: string; message: any }) => {
      const isMe = data.message.senderId === currentUserId;
      const peerId = isMe ? data.message.recipientId : data.message.senderId;

      const incomingMsg: MessageItem = {
        id: data.message.id || `p2p-${Date.now()}`,
        senderId: data.message.senderId,
        senderName: data.message.senderName,
        senderAvatar:
          data.message.senderAvatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.message.senderId}`,
        text: data.message.text,
        createdAt: new Date(data.message.createdAt || Date.now()).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        senderColor: getSenderColor(data.message.senderName),
        isOutgoing: isMe,
      };

      setMessagesMap((prev) => {
        const existing = prev[peerId] || [];
        if (existing.some((m) => m.id === incomingMsg.id)) return prev;
        return {
          ...prev,
          [peerId]: [...existing, incomingMsg],
        };
      });

      setConversations((prev) =>
        prev.map((c) =>
          c.id === peerId
            ? {
                ...c,
                lastMessage: data.message.text,
                lastMessageTime: "now",
                isReadByPeer: isMe,
                unreadCount: activeChatId === peerId || isMe ? 0 : (c.unreadCount || 0) + 1,
              }
            : c
        )
      );
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [currentUserId, currentUserName, activeChatId]);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesMap, activeChatId]);

  // 5. Handle Social Actions (Invite, Accept, Decline, Cancel)
  const handleSendInvite = async (targetUserId: string, note?: string) => {
    setIsSendingInvite(true);
    try {
      const res = await fetch("/api/chat/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "INVITE",
          targetUserId,
          message: note || "Hey! Let's connect on Wander and plan travel together.",
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Chat invite sent successfully!");
        setInviteNote("");
        fetchConnections();
      } else {
        toast.error(data.error || "Failed to send chat invite");
      }
    } catch {
      toast.error("Failed to send invite");
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleAcceptInvite = async (targetUserId: string, inviteId?: string) => {
    try {
      const res = await fetch("/api/chat/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ACCEPT",
          targetUserId,
          inviteId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Chat request accepted! You can now message each other.");
        await fetchConnections();
        fetchDirectMessages(targetUserId);
      } else {
        toast.error(data.error || "Failed to accept invite");
      }
    } catch {
      toast.error("Failed to accept invite");
    }
  };

  const handleDeclineInvite = async (targetUserId: string, inviteId?: string) => {
    try {
      const res = await fetch("/api/chat/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DECLINE",
          targetUserId,
          inviteId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.info("Chat request declined");
        fetchConnections();
        setActiveChatId("world-chat");
      } else {
        toast.error(data.error || "Failed to decline invite");
      }
    } catch {
      toast.error("Failed to decline invite");
    }
  };

  const handleCancelInvite = async (targetUserId: string) => {
    try {
      const res = await fetch("/api/chat/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CANCEL",
          targetUserId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.info("Invite cancelled");
        fetchConnections();
      }
    } catch {
      toast.error("Failed to cancel invite");
    }
  };

  // 6. Handle Selecting a Conversation
  const handleSelectConversation = (conv: ConversationItem) => {
    setActiveChatId(conv.id);
    setShowMobileChat(true);

    // Reset unread count
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
    );

    // If P2P chat, emit socket join room
    if (conv.id !== "world-chat" && socket && currentUserId) {
      socket.emit("p2p:join", {
        userId: currentUserId,
        peerId: conv.id,
      });
    }

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // 7. Send Message Handler
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    // Check if direct chat is allowed
    const activeConv = conversations.find((c) => c.id === activeChatId);
    if (activeChatId !== "world-chat" && activeConv?.connectionStatus !== "ACCEPTED") {
      toast.error("You can only chat with accepted friends. Please connect first!");
      return;
    }

    setInputText("");

    const nowFormatted = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const outgoingMsg: MessageItem = {
      id: `local-${Date.now()}`,
      senderId: currentUserId,
      senderName: currentUserName,
      senderAvatar: currentUserAvatar,
      text,
      createdAt: nowFormatted,
      isOutgoing: true,
    };

    // Optimistically update active chat messages
    setMessagesMap((prev) => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), outgoingMsg],
    }));

    // Update conversation item snippet
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? {
              ...c,
              lastMessage: text,
              lastMessageTime: "now",
              isReadByPeer: true,
            }
          : c
      )
    );

    // Send through API and broadcast through Socket
    if (activeChatId === "world-chat") {
      try {
        await fetch("/api/chat/world", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (socket && isConnected) {
          socket.emit("community:send-message", {
            text,
            user: {
              id: currentUserId,
              name: currentUserName,
              avatar: currentUserAvatar,
              tier: tier || "FREE",
            },
          });
        }
      } catch (err) {
        console.error("Failed to post world message:", err);
      }
    } else {
      try {
        const res = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientId: activeChatId,
            text,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Cannot send message");
          return;
        }

        if (socket && isConnected) {
          socket.emit("p2p:send-message", {
            senderId: currentUserId,
            senderName: currentUserName,
            senderAvatar: currentUserAvatar,
            senderTier: tier || "FREE",
            recipientId: activeChatId,
            recipientName: activeConv?.title || "Explorer",
            recipientAvatar: activeConv?.avatar,
            text,
          });
        }
      } catch (err) {
        console.error("Failed to post direct message:", err);
      }
    }
  };

  // Active conversation and messages
  const activeConversation =
    conversations.find((c) => c.id === activeChatId) ||
    conversations[0] || {
      id: "world-chat",
      type: "world",
      title: "World of Travellers",
      avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=world-chat",
      isWorldChat: true,
      lastMessage: "",
      lastMessageTime: "",
      connectionStatus: "WORLD",
    };

  const activeMessages = messagesMap[activeChatId] || [];

  // Filter conversations based on current social tab
  const filteredConversations = conversations.filter((c) => {
    // Search filter
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      const matchesTitle = c.title.toLowerCase().includes(term);
      const matchesMsg = c.lastMessage.toLowerCase().includes(term);
      if (!matchesTitle && !matchesMsg) return false;
    }

    if (socialTab === "chats") {
      // In "chats" tab: show World Chat + Accepted Friends
      return c.isWorldChat || c.connectionStatus === "ACCEPTED";
    }

    if (socialTab === "requests") {
      // In "requests" tab: show pending incoming invites + outgoing
      return c.connectionStatus === "PENDING_RECEIVED" || c.connectionStatus === "PENDING_SENT";
    }

    // In "discover" tab: handled separately in render
    return true;
  });

  const pinnedChats = filteredConversations.filter((c) => c.isPinned);
  const otherChats = filteredConversations.filter((c) => !c.isPinned);

  // Trigger video or audio call
  const startCall = (type: "video" | "audio") => {
    if (activeConversation.connectionStatus !== "ACCEPTED" && !activeConversation.isWorldChat) {
      toast.error("You can only call accepted friends!");
      return;
    }

    setCallState({
      isOpen: true,
      type,
      participantName: activeConversation.title,
      participantAvatar: activeConversation.avatar,
      isMuted: false,
      isVideoOff: false,
    });
    toast.success(
      `Starting ${type} call with ${activeConversation.title}...`,
      { duration: 2500 }
    );
  };

  const pendingRequestsCount = incomingRequests.length;

  return (
    <TooltipProvider>
      {/* 
        MASTER CONTAINER: Social World Chat Room
        Instagram-Style Connection Rules:
        - World Chat: Open public community live hub
        - Direct Messages: ONLY accepted friends can chat
        - Requests Tab: Review & accept/decline incoming chat invites
        - Discover Tab: Explore travelers and send chat invites
      */}
      <div className="w-full h-[calc(100vh-5rem)] min-h-[600px] max-h-[920px] bg-card border border-border/80 shadow-soft overflow-hidden flex flex-col md:flex-row select-none">
        
        {/* ========================================================================= */}
        {/* COLUMN 1: USER LIST (Messages, Social Tabs, Search, Pinned, Requests)     */}
        {/* ========================================================================= */}
        <div
          className={`w-full md:w-[320px] lg:w-[360px] border-r border-border/70 flex flex-col h-full bg-background/40 shrink-0 ${
            showMobileChat ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Header: "Messages" + Refresh + Menu */}
          <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-border/40">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-foreground font-sans">
                Messages
              </h2>
              {isConnected && (
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>

            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      fetchWorldMessages();
                      fetchConnections();
                      toast.success("Live chat data refreshed");
                    }}
                    className="size-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all cursor-pointer"
                  >
                    <RefreshCw className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Refresh Live Data</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setSocialTab("discover")}
                    className="size-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all cursor-pointer"
                  >
                    <UserPlus className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Discover Explorers</TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="size-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all cursor-pointer"
                  >
                    <MoreVertical className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-2xl shadow-soft">
                  <DropdownMenuItem onClick={() => setActiveChatId("world-chat")}>
                    Go to World Chat
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSocialTab("requests")}>
                    View Chat Requests ({pendingRequestsCount})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSocialTab("discover")}>
                    Find Travelers to Connect
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setConversations((prev) =>
                        prev.map((c) => ({ ...c, unreadCount: 0 }))
                      );
                      toast.success("All messages marked as read");
                    }}
                  >
                    Mark all as read
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Social Navigation Tabs: Instagram-style "Chats", "Requests", "Discover" */}
          <div className="px-3 pt-2.5 pb-2 border-b border-border/40">
            <div className="grid grid-cols-3 gap-1 p-1 bg-muted/50 rounded-2xl">
              <button
                type="button"
                onClick={() => setSocialTab("chats")}
                className={`py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  socialTab === "chats"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Chats</span>
              </button>

              <button
                type="button"
                onClick={() => setSocialTab("requests")}
                className={`py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 relative ${
                  socialTab === "requests"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Requests</span>
                {pendingRequestsCount > 0 && (
                  <span className="size-4 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                    {pendingRequestsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSocialTab("discover")}
                className={`py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  socialTab === "discover"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Compass className="size-3" />
                <span>Discover</span>
              </button>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="px-4 py-2.5 border-b border-border/40">
            <div className="relative flex items-center">
              <Search className="size-4 absolute left-3.5 text-muted-foreground/80 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={socialTab === "discover" ? "Search travelers..." : "Search"}
                className="w-full pl-10 pr-9 py-2 bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border/60 focus:border-primary/50 rounded-2xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* User List Content */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 no-scrollbar">
            
            {/* VIEW A: DISCOVER TAB (Find and Invite Travelers) */}
            {socialTab === "discover" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2 text-muted-foreground text-xs">
                  <span className="font-bold uppercase tracking-wider text-[10px]">
                    Travelers on Wander
                  </span>
                  <span>{discoverUsers.length} available</span>
                </div>

                {discoverUsers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    All registered travelers are already in your connections!
                  </p>
                ) : (
                  discoverUsers.map((user) => {
                    return (
                      <div
                        key={user.id}
                        className="p-3 rounded-2xl bg-muted/30 hover:bg-muted/60 border border-border/60 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="size-10 rounded-full border border-border/70">
                            <AvatarImage src={user.image} alt={user.name} />
                            <AvatarFallback className="font-bold text-xs">
                              {(user.name || "T")[0]}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-foreground truncate">
                              {user.name || "Explorer"}
                            </h4>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {user.username ? `@${user.username}` : user.email || "Fellow traveler"}
                            </p>
                          </div>
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleSendInvite(user.id)}
                          className="rounded-xl px-3 py-1.5 h-auto text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 cursor-pointer"
                        >
                          <UserPlus className="size-3.5 mr-1" />
                          Invite
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            ) : socialTab === "requests" ? (
              /* VIEW B: REQUESTS TAB (Instagram-style Message Requests) */
              <div className="space-y-3">
                <div className="px-2 text-muted-foreground">
                  <span className="font-bold uppercase tracking-wider text-[10px]">
                    Pending Chat Requests ({incomingRequests.length})
                  </span>
                </div>

                {incomingRequests.length === 0 && sentRequests.length === 0 ? (
                  <div className="text-center py-10 px-4">
                    <UserCheck className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-xs font-bold text-foreground">No pending requests</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      When other explorers invite you to chat, their requests will appear here.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Incoming requests (Need accept/decline) */}
                    {incomingRequests.map((req) => (
                      <div
                        key={req.inviteId || req.id}
                        className="p-3.5 rounded-2xl bg-muted/40 border border-primary/20 space-y-2.5 shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10 rounded-full border border-border/70">
                            <AvatarImage src={req.image} alt={req.name} />
                            <AvatarFallback className="font-bold text-xs">
                              {(req.name || "T")[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-foreground truncate">
                              {req.name || "Explorer"}
                            </h4>
                            <p className="text-[11px] text-muted-foreground line-clamp-1 italic">
                              &ldquo;{req.message || "Wants to connect"}&rdquo;
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleAcceptInvite(req.id, req.inviteId)}
                            className="flex-1 rounded-xl h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                          >
                            <Check className="size-3.5 mr-1" />
                            Accept
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeclineInvite(req.id, req.inviteId)}
                            className="flex-1 rounded-xl h-8 text-xs font-bold cursor-pointer"
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Outgoing sent requests */}
                    {sentRequests.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <span className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground px-2">
                          Sent Invites ({sentRequests.length})
                        </span>
                        {sentRequests.map((s) => (
                          <div
                            key={s.inviteId || s.id}
                            className="p-3 rounded-2xl bg-muted/20 border border-border/60 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Avatar className="size-8 rounded-full border border-border/70">
                                <AvatarImage src={s.image} alt={s.name} />
                                <AvatarFallback className="text-[10px] font-bold">
                                  {(s.name || "T")[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-foreground truncate">
                                  {s.name}
                                </h5>
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                                  <Clock className="size-2.5" />
                                  Pending response
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCancelInvite(s.id)}
                              className="text-[11px] text-muted-foreground hover:text-destructive cursor-pointer font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              /* VIEW C: CHATS TAB (World Chat default + Accepted Friends) */
              <>
                {/* 1. PINNED SECTION (Contains World Chat default) */}
                {pinnedChats.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-3 py-1 text-muted-foreground/80">
                      <Pin className="size-3.5 rotate-45 text-muted-foreground" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Pinned
                      </span>
                    </div>

                    <div className="space-y-1 mt-1">
                      {pinnedChats.map((conv) => {
                        const isSelected = activeChatId === conv.id;

                        return (
                          <button
                            key={conv.id}
                            type="button"
                            onClick={() => handleSelectConversation(conv)}
                            className={`w-full flex items-center gap-3.5 p-3 rounded-2xl text-left transition-all cursor-pointer group ${
                              isSelected
                                ? "bg-card dark:bg-card/90 shadow-soft-xs border border-border/80"
                                : "hover:bg-muted/50 border border-transparent"
                            }`}
                          >
                            <div className="relative shrink-0">
                              {conv.isWorldChat ? (
                                <div className="size-11 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center font-bold shadow-soft-xs">
                                  <Sparkles className="size-5 fill-current" />
                                </div>
                              ) : (
                                <Avatar className="size-11 rounded-full border border-border/70">
                                  <AvatarImage src={conv.avatar} alt={conv.title} />
                                  <AvatarFallback className="text-xs font-bold">
                                    {conv.title[0]}
                                  </AvatarFallback>
                                </Avatar>
                              )}

                              {conv.isOnline && (
                                <span className="size-3 rounded-full bg-emerald-500 absolute bottom-0 right-0 ring-2 ring-background animate-pulse" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-foreground truncate">
                                  {conv.title}
                                </span>
                                <span className="text-[11px] text-muted-foreground/80 font-medium shrink-0 ml-2">
                                  {conv.lastMessageTime}
                                </span>
                              </div>

                              <div className="flex items-center justify-between mt-1 gap-2">
                                <p className="text-xs text-muted-foreground truncate">
                                  {conv.lastMessage}
                                </p>
                                {conv.isWorldChat && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                    LIVE
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. ACCEPTED FRIENDS SECTION */}
                <div>
                  <div className="flex items-center justify-between px-3 py-1 text-muted-foreground/80">
                    <div className="flex items-center gap-1.5">
                      <Users className="size-3.5 text-muted-foreground" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Connected Friends ({otherChats.length})
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 mt-1">
                    {otherChats.length === 0 ? (
                      <div className="p-4 text-center rounded-2xl bg-muted/20 border border-border/50">
                        <Users className="size-6 text-muted-foreground/40 mx-auto mb-1.5" />
                        <p className="text-xs font-bold text-foreground">No friends yet</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Head over to <strong>Discover</strong> to invite fellow travelers!
                        </p>
                      </div>
                    ) : (
                      otherChats.map((conv) => {
                        const isSelected = activeChatId === conv.id;

                        return (
                          <button
                            key={conv.id}
                            type="button"
                            onClick={() => handleSelectConversation(conv)}
                            className={`w-full flex items-center gap-3.5 p-3 rounded-2xl text-left transition-all cursor-pointer group ${
                              isSelected
                                ? "bg-card dark:bg-card/90 shadow-soft-xs border border-border/80"
                                : "hover:bg-muted/50 border border-transparent"
                            }`}
                          >
                            <div className="relative shrink-0">
                              <Avatar className="size-11 rounded-full border border-border/70">
                                <AvatarImage src={conv.avatar} alt={conv.title} />
                                <AvatarFallback className="text-xs font-bold">
                                  {conv.title[0]}
                                </AvatarFallback>
                              </Avatar>
                              {conv.isOnline && (
                                <span className="size-3 rounded-full bg-emerald-500 absolute bottom-0 right-0 ring-2 ring-background" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-foreground truncate">
                                  {conv.title}
                                </span>
                                <span className="text-[11px] text-muted-foreground/80 font-medium shrink-0 ml-2">
                                  {conv.lastMessageTime}
                                </span>
                              </div>

                              <div className="flex items-center justify-between mt-1 gap-2">
                                <p className="text-xs text-muted-foreground truncate">
                                  {conv.lastMessage}
                                </p>
                                <CheckCheck className="size-4 text-sky-500 shrink-0" />
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}

          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 2: ACTIVE CHAT SPACE (Header, Active Thread, Input Bar)           */}
        {/* ========================================================================= */}
        <div
          className={`flex-1 flex flex-col h-full bg-card min-w-0 ${
            !showMobileChat ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Main Chat Header */}
          <div className="h-[74px] px-4 sm:px-6 border-b border-border/70 flex items-center justify-between bg-card/90 backdrop-blur-xs shrink-0">
            {/* Left: Avatar, Title, Status */}
            <div className="flex items-center gap-3.5 min-w-0">
              <button
                type="button"
                onClick={() => setShowMobileChat(false)}
                className="md:hidden p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
              >
                <ArrowLeft className="size-5" />
              </button>

              <div className="relative shrink-0">
                {activeConversation.isWorldChat ? (
                  <div className="size-11 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center shadow-soft-xs">
                    <Sparkles className="size-5 fill-current" />
                  </div>
                ) : (
                  <Avatar className="size-11 rounded-full border border-border/80 shadow-2xs">
                    <AvatarImage
                      src={activeConversation.avatar}
                      alt={activeConversation.title}
                    />
                    <AvatarFallback className="text-xs font-bold">
                      {activeConversation.title[0]}
                    </AvatarFallback>
                  </Avatar>
                )}

                <span className="size-3 rounded-full bg-emerald-500 absolute bottom-0 right-0 ring-2 ring-background animate-pulse" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground truncate">
                    {activeConversation.title}
                  </h3>
                  {activeConversation.isWorldChat ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Global Hub
                    </span>
                  ) : activeConversation.connectionStatus === "ACCEPTED" ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <UserCheck className="size-3" />
                      Friends
                    </span>
                  ) : activeConversation.connectionStatus === "PENDING_RECEIVED" ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Clock className="size-3" />
                      Requested
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                      <Lock className="size-3" />
                      Invite Needed
                    </span>
                  )}
                </div>

                <p className="text-xs truncate text-muted-foreground">
                  {activeConversation.isWorldChat
                    ? "Live community conversation • Open to all travelers"
                    : activeConversation.connectionStatus === "ACCEPTED"
                    ? "Connected Friend • Live Direct Chat"
                    : activeConversation.participant?.role || "Wander Explorer"}
                </p>
              </div>
            </div>

            {/* Right: Actions (Video, Phone, More Menu) */}
            <div className="flex items-center gap-2 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => startCall("video")}
                    className="size-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all cursor-pointer"
                  >
                    <Video className="size-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Start Video Call</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => startCall("audio")}
                    className="size-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all cursor-pointer"
                  >
                    <Phone className="size-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Start Audio Call</TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="size-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all cursor-pointer"
                  >
                    <MoreVertical className="size-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-2xl shadow-soft">
                  <DropdownMenuItem
                    onClick={() =>
                      toast.info(`Viewing profile for ${activeConversation.title}`)
                    }
                  >
                    View Traveler Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => toast.success("Notifications muted")}
                  >
                    Mute Notifications
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setMessagesMap((prev) => ({
                        ...prev,
                        [activeChatId]: [],
                      }));
                      toast.info("Cleared local messages");
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    Clear History
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Message Stream Area */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
            
            {/* Centered Date Separator Badge */}
            <div className="flex justify-center mb-4">
              <span className="px-4 py-1.5 rounded-full bg-muted/60 dark:bg-muted/30 border border-border/60 text-xs font-semibold text-muted-foreground shadow-2xs">
                Today, March 12
              </span>
            </div>

            {/* INSTAGRAM-STYLE SOCIAL CONNECTION GATES */}

            {/* SCENARIO 1: INCOMING REQUEST (User needs to Accept or Decline) */}
            {activeConversation.connectionStatus === "PENDING_RECEIVED" && (
              <div className="p-6 rounded-3xl bg-muted/40 border border-primary/30 max-w-md mx-auto text-center space-y-4 my-8 shadow-soft">
                <Avatar className="size-16 rounded-full mx-auto border-2 border-primary/40">
                  <AvatarImage src={activeConversation.avatar} alt={activeConversation.title} />
                  <AvatarFallback className="text-lg font-bold">
                    {activeConversation.title[0]}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <h4 className="text-base font-bold text-foreground">
                    Chat Request from {activeConversation.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {activeConversation.inviteMessage
                      ? `"${activeConversation.inviteMessage}"`
                      : `${activeConversation.title} wants to connect with you. If you accept, you will be able to message each other, share itineraries, and call.`}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={() =>
                      handleAcceptInvite(activeConversation.id, activeConversation.inviteId)
                    }
                    className="flex-1 rounded-2xl h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-soft cursor-pointer"
                  >
                    <Check className="size-4 mr-1.5" />
                    Accept Request
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      handleDeclineInvite(activeConversation.id, activeConversation.inviteId)
                    }
                    className="flex-1 rounded-2xl h-11 font-bold cursor-pointer"
                  >
                    Decline
                  </Button>
                </div>
              </div>
            )}

            {/* SCENARIO 2: OUTGOING PENDING INVITE (Waiting for peer acceptance) */}
            {activeConversation.connectionStatus === "PENDING_SENT" && (
              <div className="p-6 rounded-3xl bg-muted/30 border border-border/70 max-w-md mx-auto text-center space-y-3 my-8 shadow-soft-xs">
                <div className="size-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                  <Clock className="size-6 animate-pulse" />
                </div>
                <h4 className="text-base font-bold text-foreground">
                  Chat Invite Sent
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  Waiting for <strong>{activeConversation.title}</strong> to accept your invite before you can start messaging directly.
                </p>
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelInvite(activeConversation.id)}
                    className="rounded-xl text-xs font-bold text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    Cancel Invite
                  </Button>
                </div>
              </div>
            )}

            {/* SCENARIO 3: NOT CONNECTED YET (Send Invite Prompt) */}
            {activeConversation.connectionStatus === "NONE" && (
              <div className="p-6 rounded-3xl bg-muted/40 border border-border/80 max-w-md mx-auto text-center space-y-4 my-8 shadow-soft">
                <Avatar className="size-16 rounded-full mx-auto border-2 border-border/80">
                  <AvatarImage src={activeConversation.avatar} alt={activeConversation.title} />
                  <AvatarFallback className="text-lg font-bold">
                    {activeConversation.title[0]}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <h4 className="text-base font-bold text-foreground">
                    Connect with {activeConversation.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Like Instagram, Wander requires travelers to connect before direct messaging to prevent spam. Send an invite to unlock 1-on-1 chat!
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  <input
                    type="text"
                    value={inviteNote}
                    onChange={(e) => setInviteNote(e.target.value)}
                    placeholder="Add an optional greeting note..."
                    className="w-full px-4 py-2.5 bg-background border border-border/80 rounded-2xl text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />

                  <Button
                    type="button"
                    disabled={isSendingInvite}
                    onClick={() => handleSendInvite(activeConversation.id, inviteNote)}
                    className="w-full rounded-2xl h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-soft cursor-pointer"
                  >
                    <UserPlus className="size-4 mr-2" />
                    {isSendingInvite ? "Sending Invite..." : "Send Chat Invite"}
                  </Button>
                </div>
              </div>
            )}

            {/* SCENARIO 4: UNLOCKED CHAT (World Chat OR Accepted Friends) */}
            {(activeConversation.isWorldChat || activeConversation.connectionStatus === "ACCEPTED") && (
              <>
                {activeMessages.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center max-w-md mx-auto">
                    <Avatar className="size-16 rounded-full border-2 border-border/80 shadow-soft mb-3">
                      <AvatarImage src={activeConversation.avatar} alt={activeConversation.title} />
                      <AvatarFallback className="text-xl font-bold">
                        {activeConversation.title[0]}
                      </AvatarFallback>
                    </Avatar>

                    <h4 className="text-base font-bold text-foreground">
                      {activeConversation.isWorldChat
                        ? "Welcome to World of Travellers!"
                        : `You are connected with ${activeConversation.title}!`}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                      {activeConversation.isWorldChat
                        ? "Join the live conversation with travelers worldwide sharing real-time tips."
                        : "Direct messaging is fully unlocked. Say hello or discuss travel plans!"}
                    </p>

                    <div className="mt-5 w-full space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Quick Starters:
                      </p>
                      {ICEBREAKER_STARTERS.map((starter) => (
                        <button
                          key={starter}
                          type="button"
                          onClick={() => handleSendMessage(starter)}
                          className="w-full text-xs text-left p-3 rounded-2xl bg-muted/40 hover:bg-muted/70 border border-border/60 hover:border-primary/40 text-foreground transition-all cursor-pointer flex items-center justify-between group"
                        >
                          <span>{starter}</span>
                          <Send className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  activeMessages.map((msg) => {
                    const isOutgoing = msg.isOutgoing || msg.senderId === currentUserId;

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-full"
                      >
                        {isOutgoing ? (
                          /* OUTGOING MESSAGE ("You") - Theme Primary Orange Bubble */
                          <div className="flex items-end justify-end gap-3 max-w-[85%] sm:max-w-[72%] ml-auto">
                            <div className="space-y-1.5 text-right">
                              <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-3xl rounded-br-sm p-4 sm:p-5 shadow-soft text-left">
                                <h5 className="text-xs font-bold text-white/90">
                                  You
                                </h5>
                                <p className="text-sm sm:text-[14px] leading-relaxed text-white font-normal mt-1">
                                  {msg.text}
                                </p>
                              </div>
                              <div className="text-[11px] text-muted-foreground font-medium pr-2">
                                {msg.createdAt}
                              </div>
                            </div>

                            <Avatar className="size-9 rounded-full ring-2 ring-background shrink-0 mb-6 border border-border/60">
                              <AvatarImage src={currentUserAvatar} alt="You" />
                              <AvatarFallback className="text-xs font-bold">
                                U
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        ) : (
                          /* INCOMING MESSAGE - White/Card Bubble with distinct colored sender name */
                          <div className="flex items-end gap-3 max-w-[85%] sm:max-w-[72%]">
                            <Avatar className="size-9 rounded-full ring-2 ring-background shrink-0 mb-6 border border-border/60">
                              <AvatarImage src={msg.senderAvatar} alt={msg.senderName} />
                              <AvatarFallback className="text-xs font-bold">
                                {msg.senderName[0]}
                              </AvatarFallback>
                            </Avatar>

                            <div className="space-y-1.5">
                              <div className="bg-card dark:bg-[#131E2D] border border-border/80 dark:border-border/60 rounded-3xl rounded-bl-sm p-4 sm:p-5 shadow-[0_2px_12px_rgba(22,40,59,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                                <h5 className={`text-xs font-bold ${msg.senderColor || getSenderColor(msg.senderName)}`}>
                                  {msg.senderName}
                                </h5>
                                <p className="text-sm sm:text-[14px] text-foreground/90 font-normal leading-relaxed mt-1">
                                  {msg.text}
                                </p>
                              </div>
                              <div className="text-[11px] text-muted-foreground font-medium pl-2">
                                {msg.createdAt}
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel Bar */}
          <div className="px-4 sm:px-6 py-2 border-t border-border/40 bg-muted/15 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 flex items-center gap-1">
              <Sparkles className="size-3 text-primary" />
              Quick:
            </span>
            {QUICK_STARTERS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  setInputText(prompt);
                  inputRef.current?.focus();
                }}
                className="text-[11px] font-medium px-3 py-1 rounded-full bg-background border border-border/70 hover:border-primary/50 text-foreground hover:text-primary transition-all whitespace-nowrap cursor-pointer shadow-2xs"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Bottom Message Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 sm:p-5 border-t border-border/70 bg-card flex items-center gap-2.5 shrink-0"
          >
            {/* Attachment Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => toast.info("Attachment upload ready")}
                  className="size-10 rounded-2xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all cursor-pointer shrink-0"
                >
                  <Paperclip className="size-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Attach photo or itinerary</TooltipContent>
            </Tooltip>

            {/* Input Field */}
            <div className="flex-1 relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={
                  !activeConversation.isWorldChat &&
                  activeConversation.connectionStatus !== "ACCEPTED"
                }
                placeholder={
                  activeConversation.isWorldChat
                    ? "Share travel tips with the world..."
                    : activeConversation.connectionStatus === "ACCEPTED"
                    ? `Message ${activeConversation.title}...`
                    : activeConversation.connectionStatus === "PENDING_RECEIVED"
                    ? "Accept request above to reply..."
                    : "Connect with friend to send messages..."
                }
                className="w-full pl-4 pr-10 py-3 bg-muted/40 focus:bg-background border border-border/70 focus:border-primary/60 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              />

              <button
                type="button"
                onClick={() => setInputText((prev) => prev + " ✈️ ")}
                className="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Smile className="size-5" />
              </button>
            </div>

            {/* Audio / Mic Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => toast.info("Voice memo recording")}
                  className="size-10 rounded-2xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all cursor-pointer shrink-0"
                >
                  <Mic className="size-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Voice message</TooltipContent>
            </Tooltip>

            {/* Send Button */}
            <Button
              type="submit"
              disabled={
                !inputText.trim() ||
                (!activeConversation.isWorldChat &&
                  activeConversation.connectionStatus !== "ACCEPTED")
              }
              className="rounded-2xl px-5 py-3 h-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-soft flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50 transition-all"
            >
              <Send className="size-4" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </form>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: INTERACTIVE VIDEO / AUDIO CALL SIMULATOR                         */}
      {/* ========================================================================= */}
      <Dialog
        open={callState.isOpen}
        onOpenChange={(open) =>
          setCallState((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent className="sm:max-w-md rounded-[32px] p-8 text-center bg-card border border-border/80 shadow-soft-xl">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="size-24 rounded-full p-1 bg-gradient-to-tr from-amber-500 to-orange-500 shadow-soft animate-pulse">
                <Avatar className="size-full rounded-full border-2 border-background">
                  <AvatarImage
                    src={callState.participantAvatar}
                    alt={callState.participantName}
                  />
                  <AvatarFallback className="text-xl font-bold">
                    {callState.participantName[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="size-4 rounded-full bg-emerald-500 absolute bottom-1 right-1 ring-2 ring-background animate-ping" />
            </div>

            <div>
              <h4 className="text-xl font-bold text-foreground">
                {callState.participantName}
              </h4>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                {callState.type === "video" ? "Video Calling..." : "Audio Calling..."}
              </p>
            </div>

            {/* Call action buttons */}
            <div className="flex items-center gap-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  setCallState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
                  toast.info(callState.isMuted ? "Unmuted" : "Muted microphone");
                }}
                className={`size-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  callState.isMuted
                    ? "bg-rose-500 text-white"
                    : "bg-muted hover:bg-muted/80 text-foreground"
                }`}
              >
                {callState.isMuted ? (
                  <MicOff className="size-5" />
                ) : (
                  <Mic className="size-5" />
                )}
              </button>

              {callState.type === "video" && (
                <button
                  type="button"
                  onClick={() => {
                    setCallState((prev) => ({
                      ...prev,
                      isVideoOff: !prev.isVideoOff,
                    }));
                    toast.info(
                      callState.isVideoOff ? "Camera turned on" : "Camera turned off"
                    );
                  }}
                  className={`size-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    callState.isVideoOff
                      ? "bg-rose-500 text-white"
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  }`}
                >
                  {callState.isVideoOff ? (
                    <VideoOff className="size-5" />
                  ) : (
                    <Video className="size-5" />
                  )}
                </button>
              )}

              {/* End call button */}
              <button
                type="button"
                onClick={() => {
                  setCallState((prev) => ({ ...prev, isOpen: false }));
                  toast.info("Call ended");
                }}
                className="size-14 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center justify-center shadow-soft cursor-pointer transition-all hover:scale-105"
              >
                <PhoneOff className="size-6" />
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
