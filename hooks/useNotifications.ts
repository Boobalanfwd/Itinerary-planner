"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";

export interface AppNotification {
  id: string;
  userId: string;
  actorId?: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
  actor?: {
    id: string;
    name?: string;
    username?: string;
    image?: string;
  };
}

export interface PendingInvite {
  id: string;
  itineraryId: string;
  userId: string;
  role: string;
  inviteStatus: string;
  invitedAt: string;
  itinerary: {
    id: string;
    title?: string;
    destination: string;
    coverImage?: string;
    startDate?: string;
    endDate?: string;
    user?: { id: string; name?: string; username?: string; image?: string };
  };
  invitedByUser?: { id: string; name?: string; username?: string; image?: string };
}

export function useNotifications(currentUserId?: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setPendingInvites(data.pendingInvites || []);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    if (!currentUserId) return;

    const socketHost =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.hostname}:3001`
        : "http://localhost:3001";

    const socket = io(socketHost, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("user:register", { userId: currentUserId });
    });

    socket.on("notification:new", (newNotif: any) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((c) => c + 1);
    });

    socket.on("invite:received", (data: any) => {
      if (data.collaborator) {
        setPendingInvites((prev) => [data.collaborator, ...prev]);
      }
      if (data.notification) {
        setNotifications((prev) => [data.notification, ...prev]);
        setUnreadCount((c) => c + 1);
      }
    });

    socket.on("invite:resolved", (data: any) => {
      setPendingInvites((prev) => prev.filter((inv) => inv.itineraryId !== data.tripId));
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUserId, fetchNotifications]);

  const markAsRead = async (notificationId?: string, markAll = false) => {
    try {
      if (markAll) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      } else if (notificationId) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }

      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, markAll }),
      });
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const respondToInvite = async (
    collaboratorId: string,
    action: "ACCEPT" | "DECLINE"
  ) => {
    try {
      // Optimistic update
      setPendingInvites((prev) => prev.filter((inv) => inv.id !== collaboratorId));

      const res = await fetch("/api/collaborators/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collaboratorId, action }),
      });

      const data = await res.json();
      if (data.success && socketRef.current?.connected) {
        socketRef.current.emit("collaborator:respond", {
          tripId: data.collaborator.itineraryId,
          userId: currentUserId,
          action,
          collaborator: data.collaborator,
        });
      }

      fetchNotifications();
      return data;
    } catch (err) {
      console.error("Error responding to invite:", err);
      fetchNotifications();
      return { success: false, error: err };
    }
  };

  return {
    notifications,
    pendingInvites,
    unreadCount,
    isLoading,
    markAsRead,
    respondToInvite,
    refetch: fetchNotifications,
  };
}
