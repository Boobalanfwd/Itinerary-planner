"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export interface PresenceUser {
  socketId: string;
  userId: string;
  name: string;
  username?: string;
  email?: string;
  avatar?: string;
  role: string;
  color: string;
  isIdle: boolean;
  lastActive: number;
  focusedField?: {
    fieldId: string;
    activityId?: string;
    label?: string;
  };
}

export interface RemoteCursor {
  userId: string;
  userName: string;
  userColor: string;
  userAvatar?: string;
  x: number;
  y: number;
  dayNumber?: number;
  activityId?: string;
}

export interface ActivityLockInfo {
  userId: string;
  userName: string;
}

interface UseTripRealtimeProps {
  tripId: string;
  currentUser: {
    id: string;
    name?: string;
    username?: string;
    email?: string;
    image?: string;
    role?: string;
  };
  onItineraryChange?: (change: any) => void;
  onNewComment?: (comment: any) => void;
  onCommentResolved?: (data: any) => void;
  onCommentReacted?: (data: any) => void;
  onPollCreated?: (poll: any) => void;
  onPollUpdated?: (poll: any) => void;
  onCollaboratorUpdated?: (data: any) => void;
  onActivityLog?: (log: any) => void;
}

export function useTripRealtime({
  tripId,
  currentUser,
  onItineraryChange,
  onNewComment,
  onCommentResolved,
  onCommentReacted,
  onPollCreated,
  onPollUpdated,
  onCollaboratorUpdated,
  onActivityLog,
}: UseTripRealtimeProps) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roster, setRoster] = useState<PresenceUser[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<Record<string, RemoteCursor>>({});
  const [focusedFields, setFocusedFields] = useState<
    Record<string, { userId: string; userName: string; userColor: string; label?: string }>
  >({});
  const [locks, setLocks] = useState<Record<string, ActivityLockInfo>>({});
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  // Inactivity tracking
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActiveRef = useRef<number>(Date.now());

  const resetIdleTimer = useCallback(() => {
    lastActiveRef.current = Date.now();
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    idleTimerRef.current = setTimeout(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("presence:idle", { tripId, isIdle: true });
      }
    }, 45000); // 45 seconds timeout to away state
  }, [tripId]);

  useEffect(() => {
    if (!tripId || !currentUser?.id) return;

    // Detect socket URL: hostname + port 3001
    const socketHost =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.hostname}:3001`
        : "http://localhost:3001";

    const socket = io(socketHost, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);

      // Join trip room and user notification room
      socket.emit("trip:join", {
        tripId,
        user: {
          id: currentUser.id,
          name: currentUser.name || "Traveler",
          username: currentUser.username,
          email: currentUser.email,
          avatar: currentUser.image,
          role: currentUser.role || "TRAVELER",
        },
      });

      // Heartbeat ping for latency calculation
      const start = Date.now();
      socket.emit("ping", () => {
        setLatencyMs(Date.now() - start);
      });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    // 1. Presence roster
    socket.on("presence:roster", (users: PresenceUser[]) => {
      setRoster(users);
    });

    // 2. Cursors
    socket.on("cursor:update", (cursorData: RemoteCursor) => {
      if (cursorData.userId === currentUser.id) return;
      setRemoteCursors((prev) => ({
        ...prev,
        [cursorData.userId]: cursorData,
      }));
    });

    // 3. Field Focus ("Currently editing" badge)
    socket.on(
      "presence:focus",
      (data: {
        userId: string;
        userName: string;
        userColor: string;
        fieldId: string;
        activityId?: string;
        label?: string;
      }) => {
        if (data.userId === currentUser.id) return;
        setFocusedFields((prev) => ({
          ...prev,
          [data.fieldId]: {
            userId: data.userId,
            userName: data.userName,
            userColor: data.userColor,
            label: data.label,
          },
        }));
      }
    );

    socket.on("presence:blur", (data: { fieldId?: string }) => {
      if (!data?.fieldId) return;
      setFocusedFields((prev) => {
        const next = { ...prev };
        delete next[data.fieldId!];
        return next;
      });
    });

    // 4. Locks sync
    socket.on("locks:sync", (currentLocks: Record<string, ActivityLockInfo>) => {
      setLocks(currentLocks);
    });

    socket.on(
      "lock:acquired",
      (data: { activityId: string; userId: string; userName: string }) => {
        setLocks((prev) => ({
          ...prev,
          [data.activityId]: { userId: data.userId, userName: data.userName },
        }));
      }
    );

    socket.on("lock:released", (data: { activityId: string }) => {
      setLocks((prev) => {
        const next = { ...prev };
        delete next[data.activityId];
        return next;
      });
    });

    // 5. Itinerary live edits
    socket.on("itinerary:changed", (change: any) => {
      onItineraryChange?.(change);
    });

    // 6. Comments
    socket.on("comment:added", (comment: any) => {
      onNewComment?.(comment);
    });
    socket.on("comment:resolved", (data: any) => {
      onCommentResolved?.(data);
    });
    socket.on("comment:reacted", (data: any) => {
      onCommentReacted?.(data);
    });

    // 7. Polls
    socket.on("poll:created", (poll: any) => {
      onPollCreated?.(poll);
    });
    socket.on("poll:updated", (poll: any) => {
      onPollUpdated?.(poll);
    });

    // 8. Collaborator updates
    socket.on("collaborator:updated", (data: any) => {
      onCollaboratorUpdated?.(data);
    });

    // 9. Activity Log
    socket.on("activity-log:new", (log: any) => {
      onActivityLog?.(log);
    });

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      socket.disconnect();
    };
  }, [tripId, currentUser?.id]);

  // Actions exposed to caller
  const sendCursor = useCallback(
    (x: number, y: number, dayNumber?: number, activityId?: string) => {
      resetIdleTimer();
      socketRef.current?.emit("cursor:move", {
        tripId,
        x,
        y,
        dayNumber,
        activityId,
      });
    },
    [tripId, resetIdleTimer]
  );

  const sendFocus = useCallback(
    (fieldId: string, activityId?: string, label?: string) => {
      resetIdleTimer();
      socketRef.current?.emit("presence:focus", {
        tripId,
        fieldId,
        activityId,
        label,
      });
    },
    [tripId, resetIdleTimer]
  );

  const sendBlur = useCallback(
    (fieldId?: string, activityId?: string) => {
      socketRef.current?.emit("presence:blur", {
        tripId,
        fieldId,
        activityId,
      });
    },
    [tripId]
  );

  const acquireLock = useCallback(
    (
      activityId: string,
      field?: string
    ): Promise<{ success: boolean; lockedBy?: { userId: string; userName: string } }> => {
      return new Promise((resolve) => {
        if (!socketRef.current?.connected) {
          resolve({ success: true });
          return;
        }
        socketRef.current.emit(
          "lock:request",
          { tripId, activityId, field },
          (response: any) => {
            resolve(response || { success: true });
          }
        );
      });
    },
    [tripId]
  );

  const releaseLock = useCallback(
    (activityId: string) => {
      socketRef.current?.emit("lock:release", { tripId, activityId });
    },
    [tripId]
  );

  const broadcastEdit = useCallback(
    (data: {
      action: "UPDATE" | "CREATE" | "DELETE" | "REORDER";
      activity?: any;
      activityId?: string;
      dayId?: string;
      activityIds?: string[];
      summary?: string;
    }) => {
      socketRef.current?.emit("itinerary:edit", {
        tripId,
        ...data,
      });
    },
    [tripId]
  );

  const broadcastComment = useCallback(
    (comment: any, mentionedUserIds?: string[]) => {
      socketRef.current?.emit("comment:new", {
        tripId,
        comment,
        mentionedUserIds,
      });
    },
    [tripId]
  );

  const broadcastCommentResolve = useCallback(
    (commentId: string, resolved: boolean) => {
      socketRef.current?.emit("comment:resolve", {
        tripId,
        commentId,
        resolved,
      });
    },
    [tripId]
  );

  const broadcastCommentReaction = useCallback(
    (commentId: string, emoji: string, reactions: any[]) => {
      socketRef.current?.emit("comment:reaction", {
        tripId,
        commentId,
        emoji,
        reactions,
      });
    },
    [tripId]
  );

  const broadcastPoll = useCallback(
    (poll: any) => {
      socketRef.current?.emit("poll:new", { tripId, poll });
    },
    [tripId]
  );

  const broadcastVote = useCallback(
    (pollId: string, poll: any) => {
      socketRef.current?.emit("poll:vote", { tripId, pollId, poll });
    },
    [tripId]
  );

  const broadcastNudge = useCallback(
    (pollTitle: string, nonVoterIds: string[]) => {
      socketRef.current?.emit("poll:nudge", { tripId, pollTitle, nonVoterIds });
    },
    [tripId]
  );

  const broadcastInviteSent = useCallback(
    (collaborator: any, invitedUserId?: string, notification?: any) => {
      socketRef.current?.emit("collaborator:invite-sent", {
        tripId,
        collaborator,
        invitedUserId,
        notification,
      });
    },
    [tripId]
  );

  const broadcastInviteResponse = useCallback(
    (userId: string, action: "ACCEPT" | "DECLINE", collaborator: any) => {
      socketRef.current?.emit("collaborator:respond", {
        tripId,
        userId,
        action,
        collaborator,
      });
    },
    [tripId]
  );

  return {
    isConnected,
    roster,
    remoteCursors,
    focusedFields,
    locks,
    latencyMs,
    sendCursor,
    sendFocus,
    sendBlur,
    acquireLock,
    releaseLock,
    broadcastEdit,
    broadcastComment,
    broadcastCommentResolve,
    broadcastCommentReaction,
    broadcastPoll,
    broadcastVote,
    broadcastNudge,
    broadcastInviteSent,
    broadcastInviteResponse,
  };
}
