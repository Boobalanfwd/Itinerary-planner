"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Bell, MessageCircle, UserPlus, Sparkles, Calendar, Check, Loader2 } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string;
  actor?: { name?: string | null; image?: string | null } | null;
};

function iconFor(type: string) {
  if (type === "INVITE" || type === "INVITE_ACCEPTED") return UserPlus;
  if (type === "MESSAGE" || type === "MENTION") return MessageCircle;
  if (type.startsWith("POLL")) return Calendar;
  return Sparkles;
}

function relativeTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationsPopover() {
  const { data: session } = useSession();
  const router = useRouter();
  const userId = session?.user?.id;
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isOpen, setIsOpen] = React.useState(false);
  const socketRef = React.useRef<Socket | null>(null);
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const loadNotifications = React.useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const data = await response.json();
      if (response.ok && data.success) setNotifications(data.notifications || []);
    } catch (error) {
      console.warn("Could not load notifications", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  React.useEffect(() => { void loadNotifications(); }, [loadNotifications]);

  React.useEffect(() => {
    if (!userId) return;
    const refresh = () => { void loadNotifications(); };
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", refresh); };
  }, [userId, loadNotifications]);

  React.useEffect(() => {
    if (!userId) return;
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
    const socket = io(socketUrl, { transports: ["websocket", "polling"], reconnectionAttempts: 8, timeout: 8000, withCredentials: true });
    socketRef.current = socket;
    socket.on("connect", () => socket.emit("user:register", { userId }));
    socket.on("notification:new", (item: Partial<NotificationItem>) => {
      void loadNotifications();
      if (item.title) toast(item.title, { description: item.message, duration: 5000 });
    });
    socket.on("call:signal", (signal: { fromUserId: string; kind: string; payload?: { name?: string; type?: string } }) => {
      if (signal.kind !== "invite") return;
      toast(`Incoming ${signal.payload?.type || "audio"} call`, {
        id: `incoming-call-${signal.fromUserId}`,
        description: `${signal.payload?.name || "A friend"} is calling. Open chat to answer.`,
        duration: 15000,
        action: { label: "Open chat", onClick: () => router.push(`/dashboard/chat?peer=${encodeURIComponent(signal.fromUserId)}`) },
      });
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, loadNotifications, router]);

  const markAllAsRead = async () => {
    const response = await fetch("/api/notifications", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAll: true }),
    });
    if (response.ok) setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

  const openNotification = async (item: NotificationItem) => {
    if (!item.isRead) {
      await fetch("/api/notifications", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: item.id }),
      });
      setNotifications((prev) => prev.map((entry) => entry.id === item.id ? { ...entry, isRead: true } : entry));
    }
    setIsOpen(false);
    if (item.linkUrl) router.push(item.linkUrl);
    else if (item.type === "INVITE" || item.type === "MESSAGE" || item.type === "MENTION") router.push("/dashboard/chat");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="icon-round" size="icon-round" aria-label={`Notifications (${unreadCount} unread)`} className="relative text-foreground hover:bg-muted">
          <Bell className="size-4" />
          {unreadCount > 0 && <span className="absolute top-2 right-2 size-2 rounded-full bg-red-500 ring-2 ring-card animate-pulse" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 sm:w-96 rounded-2xl p-0 shadow-soft-xl border border-border/80 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border/80 bg-muted/20">
          <div className="flex items-center gap-2"><h4 className="text-sm font-bold text-foreground">Notifications</h4>{unreadCount > 0 && <Badge variant="tag-peach" className="text-[10px] px-2 py-0.5">{unreadCount} new</Badge>}</div>
          {unreadCount > 0 && <button onClick={() => void markAllAsRead()} className="text-xs text-primary font-semibold hover:underline">Mark all read</button>}
        </div>
        <div className="max-h-96 overflow-y-auto divide-y divide-border/60">
          {loading ? <div className="p-8 text-center text-muted-foreground"><Loader2 className="size-5 mx-auto animate-spin" /></div> : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs"><Bell className="size-8 mx-auto mb-2 opacity-30" /><p>You’re all caught up</p></div>
          ) : notifications.map((item) => {
            const Icon = iconFor(item.type);
            return <button key={item.id} onClick={() => void openNotification(item)} className={`w-full text-left p-4 flex items-start gap-3 transition-colors ${item.isRead ? "hover:bg-muted/40" : "bg-primary-soft/30 hover:bg-primary-soft/40"}`}>
              <div className="size-8 rounded-xl bg-card border border-border/80 text-primary flex items-center justify-center shrink-0 shadow-soft-xs mt-0.5"><Icon className="size-4" /></div>
              <div className="flex-1 min-w-0"><div className="flex items-center justify-between gap-2"><p className="text-xs font-bold text-foreground truncate">{item.title}</p><span className="text-[10px] text-muted-foreground shrink-0">{relativeTime(item.createdAt)}</span></div><p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{item.message}</p></div>
              {!item.isRead && <span className="size-2 rounded-full bg-primary mt-2 shrink-0" />}
            </button>;
          })}
        </div>
        <div className="p-2.5 border-t border-border/80 bg-muted/20 flex justify-end"><Button variant="ghost" size="xs" onClick={() => setIsOpen(false)} className="text-foreground text-[11px] gap-1"><Check className="size-3" />Done</Button></div>
      </PopoverContent>
    </Popover>
  );
}
