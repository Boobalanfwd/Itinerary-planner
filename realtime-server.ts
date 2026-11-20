import http from "http";
import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { decode as decodeNextAuthToken } from "next-auth/jwt";

const prisma = new PrismaClient();

const PORT = parseInt(process.env.SOCKET_PORT || "3001", 10);

interface UserPresence {
  socketId: string;
  userId: string;
  name: string;
  username?: string;
  email?: string;
  avatar?: string;
  role: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
    dayNumber?: number;
    activityId?: string;
  };
  focusedField?: {
    fieldId: string;
    activityId?: string;
    label?: string;
  };
  isIdle: boolean;
  lastActive: number;
}

interface ActivityLock {
  activityId: string;
  userId: string;
  userName: string;
  socketId: string;
  field?: string;
  lockedAt: number;
}

// Presence map: tripId -> Map<socketId, UserPresence>
const tripRooms = new Map<string, Map<string, UserPresence>>();

// Locks map: activityId -> ActivityLock
const activityLocks = new Map<string, ActivityLock>();

// Global World of Travellers Chat buffer
interface CommunityChatMessage {
  id: string;
  text: string;
  user: { id: string; name: string; avatar?: string; tier?: string };
  createdAt: string;
}

const globalCommunityChatMessages: CommunityChatMessage[] = [
  {
    id: "welcome-1",
    text: "Welcome to World of Travellers! 🌍 Share tips, ask about destinations, or find travel buddies.",
    user: {
      id: "wander-bot",
      name: "Wander Host",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=wander",
      tier: "PRO",
    },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "welcome-2",
    text: "Anyone visiting Tokyo during cherry blossom season? Would love to share secret picnic spots in Shinjuku Gyoen! 🌸",
    user: {
      id: "traveler-hannah",
      name: "Hannah Lee",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=hannah",
      tier: "PRO",
    },
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "welcome-3",
    text: "Just got back from the Amalfi Coast! If anyone needs ferry or scenic hike advice, feel free to ask!",
    user: {
      id: "traveler-marco",
      name: "Marco Rossi",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=marco",
      tier: "PREMIUM",
    },
    createdAt: new Date(Date.now() - 600000).toISOString(),
  },
];

export interface P2PDirectMessage {
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

// In-memory P2P message storage keyed by deterministic conversation roomId: "p2p:userIdA:userIdB"
const p2pConversationMessages = new Map<string, P2PDirectMessage[]>();
type PendingCallSignal = { fromUserId: string; kind: string; payload?: unknown; createdAt: number };
const pendingCallSignals = new Map<string, PendingCallSignal[]>();
const activeCallPairs = new Map<string, number>();

function getCallPairKey(firstId: string, secondId: string) {
  return [firstId, secondId].sort().join(":");
}

function getP2PConversationKey(u1: string, u2: string) {
  return [u1, u2].sort().join(":");
}

// Palettes for collaborator presence cursors & avatars
const PRESENCE_COLORS = [
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#14B8A6", // Teal
  "#84CC16", // Lime
];

function getRandomColor(seedStr: string): string {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PRESENCE_COLORS.length;
  return PRESENCE_COLORS[index];
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "healthy",
        uptime: process.uptime(),
        activeTrips: tripRooms.size,
        totalLocks: activityLocks.size,
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  res.writeHead(404);
  res.end();
});

const allowedOrigins = [
  process.env.NEXTAUTH_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter((origin): origin is string => Boolean(origin));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
  pingTimeout: 20000,
  pingInterval: 10000,
});

io.use(async (socket, next) => {
  const cookieHeader = socket.handshake.headers.cookie || "";
  const secureCookie = process.env.NEXTAUTH_URL?.startsWith("https://") || Boolean(process.env.VERCEL);
  const cookieName = secureCookie ? "__Secure-next-auth.session-token" : "next-auth.session-token";
  const tokenCookie = cookieHeader.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${cookieName}=`));
  const token = tokenCookie?.slice(cookieName.length + 1);
  if (!token || !process.env.NEXTAUTH_SECRET) return next(new Error("Authentication required"));

  try {
    const decoded = await decodeNextAuthToken({ token: decodeURIComponent(token), secret: process.env.NEXTAUTH_SECRET });
    if (!decoded?.sub) return next(new Error("Authentication required"));
    socket.data.authUserId = decoded.sub;
    next();
  } catch {
    next(new Error("Authentication required"));
  }
});

function getRoster(tripId: string): UserPresence[] {
  const room = tripRooms.get(tripId);
  if (!room) return [];
  // Return unique by userId
  const uniqueUsers = new Map<string, UserPresence>();
  for (const pres of room.values()) {
    uniqueUsers.set(pres.userId, pres);
  }
  return Array.from(uniqueUsers.values());
}

function broadcastRoster(tripId: string) {
  const roster = getRoster(tripId);
  io.to(`trip:${tripId}`).emit("presence:roster", roster);
}

// Cleanup stale locks every 15 seconds
setInterval(() => {
  const now = Date.now();
  for (const [activityId, lock] of activityLocks.entries()) {
    if (now - lock.lockedAt > 45000) {
      activityLocks.delete(activityId);
      io.emit("lock:released", { activityId });
    }
  }
}, 15000);

io.on("connection", (socket: Socket) => {
  let currentTripId: string | null = null;
  const currentUserId: string | null = socket.data.authUserId || null;

  // 1. User registers their personal notification channel
  socket.on("user:register", (data: { userId: string }) => {
    if (!currentUserId || data?.userId !== currentUserId) return;
    socket.join(`user:${currentUserId}`);
    const pendingSignals = (pendingCallSignals.get(currentUserId) || []).filter((pending) => Date.now() - pending.createdAt < 45000);
    pendingCallSignals.set(currentUserId, pendingSignals);
    for (const pending of pendingSignals) {
      socket.emit("call:signal", pending);
    }
  });

  // 2. Join a trip room for multiplayer collaboration
  socket.on(
    "trip:join",
    async (data: {
      tripId: string;
      user: {
        id: string;
        name?: string;
        username?: string;
        email?: string;
        avatar?: string;
        role?: string;
      };
    }) => {
      if (!data?.tripId || !data?.user?.id || data.user.id !== currentUserId) return;
      currentTripId = data.tripId;

      socket.join(`trip:${data.tripId}`);
      socket.join(`user:${data.user.id}`);

      let room = tripRooms.get(data.tripId);
      if (!room) {
        room = new Map();
        tripRooms.set(data.tripId, room);
      }

      const presence: UserPresence = {
        socketId: socket.id,
        userId: data.user.id,
        name: data.user.name || "Fellow Traveler",
        username: data.user.username,
        email: data.user.email,
        avatar: data.user.avatar,
        role: data.user.role || "TRAVELER",
        color: getRandomColor(data.user.id || data.user.name || socket.id),
        isIdle: false,
        lastActive: Date.now(),
      };

      room.set(socket.id, presence);
      broadcastRoster(data.tripId);

      // Send existing active locks to newly joined user
      const currentLocks: Record<string, { userId: string; userName: string }> = {};
      for (const [actId, lk] of activityLocks.entries()) {
        currentLocks[actId] = { userId: lk.userId, userName: lk.userName };
      }
      socket.emit("locks:sync", currentLocks);
    }
  );

  // 3. Live Cursor movement
  socket.on(
    "cursor:move",
    (data: {
      tripId: string;
      x: number;
      y: number;
      dayNumber?: number;
      activityId?: string;
    }) => {
      if (!data?.tripId || !currentUserId) return;
      const room = tripRooms.get(data.tripId);
      const userPres = room?.get(socket.id);
      if (userPres) {
        userPres.cursor = {
          x: data.x,
          y: data.y,
          dayNumber: data.dayNumber,
          activityId: data.activityId,
        };
        userPres.isIdle = false;
        userPres.lastActive = Date.now();
      }

      socket.to(`trip:${data.tripId}`).emit("cursor:update", {
        userId: currentUserId,
        userName: userPres?.name || "Traveler",
        userColor: userPres?.color || "#F59E0B",
        userAvatar: userPres?.avatar,
        x: data.x,
        y: data.y,
        dayNumber: data.dayNumber,
        activityId: data.activityId,
      });
    }
  );

  // 4. Focus / "Currently editing" badge on field
  socket.on(
    "presence:focus",
    (data: {
      tripId: string;
      fieldId: string;
      activityId?: string;
      label?: string;
    }) => {
      if (!data?.tripId || !currentUserId) return;
      const room = tripRooms.get(data.tripId);
      const userPres = room?.get(socket.id);
      if (userPres) {
        userPres.focusedField = {
          fieldId: data.fieldId,
          activityId: data.activityId,
          label: data.label,
        };
        userPres.lastActive = Date.now();
      }

      socket.to(`trip:${data.tripId}`).emit("presence:focus", {
        userId: currentUserId,
        userName: userPres?.name || "Traveler",
        userColor: userPres?.color || "#F59E0B",
        userAvatar: userPres?.avatar,
        fieldId: data.fieldId,
        activityId: data.activityId,
        label: data.label,
      });
    }
  );

  // 5. Blur field focus
  socket.on("presence:blur", (data: { tripId: string; fieldId?: string; activityId?: string }) => {
    if (!data?.tripId || !currentUserId) return;
    const room = tripRooms.get(data.tripId);
    const userPres = room?.get(socket.id);
    if (userPres) {
      userPres.focusedField = undefined;
    }

    socket.to(`trip:${data.tripId}`).emit("presence:blur", {
      userId: currentUserId,
      fieldId: data.fieldId,
      activityId: data.activityId,
    });
  });

  // 6. Idle status change
  socket.on("presence:idle", (data: { tripId: string; isIdle: boolean }) => {
    if (!data?.tripId || !currentUserId) return;
    const room = tripRooms.get(data.tripId);
    const userPres = room?.get(socket.id);
    if (userPres) {
      userPres.isIdle = data.isIdle;
      broadcastRoster(data.tripId);
    }
  });

  // 7. Field / Activity Locking (Conflict prevention)
  socket.on(
    "lock:request",
    (data: { tripId: string; activityId: string; field?: string }, callback?: (res: any) => void) => {
      if (!data?.activityId || !currentUserId) {
        callback?.({ success: false, error: "Missing parameters" });
        return;
      }

      const existingLock = activityLocks.get(data.activityId);
      if (existingLock && existingLock.userId !== currentUserId) {
        // Locked by someone else!
        callback?.({
          success: false,
          lockedBy: {
            userId: existingLock.userId,
            userName: existingLock.userName,
          },
        });
        return;
      }

      const room = tripRooms.get(data.tripId);
      const userPres = room?.get(socket.id);
      const userName = userPres?.name || "A collaborator";

      activityLocks.set(data.activityId, {
        activityId: data.activityId,
        userId: currentUserId,
        userName,
        socketId: socket.id,
        field: data.field,
        lockedAt: Date.now(),
      });

      // Update in DB
      prisma.activity
        .update({
          where: { id: data.activityId },
          data: {
            lockedByUserId: currentUserId,
            lockedAt: new Date(),
          },
        })
        .catch(() => {});

      io.to(`trip:${data.tripId}`).emit("lock:acquired", {
        activityId: data.activityId,
        userId: currentUserId,
        userName,
      });

      callback?.({ success: true });
    }
  );

  socket.on("lock:release", (data: { tripId: string; activityId: string }) => {
    if (!data?.activityId) return;
    const existing = activityLocks.get(data.activityId);
    if (existing && existing.userId === currentUserId) {
      activityLocks.delete(data.activityId);

      prisma.activity
        .update({
          where: { id: data.activityId },
          data: {
            lockedByUserId: null,
            lockedAt: null,
          },
        })
        .catch(() => {});

      io.to(`trip:${data.tripId}`).emit("lock:released", {
        activityId: data.activityId,
      });
    }
  });

  // 8. Itinerary Live Edits (Instant Sub-second synchronization)
  socket.on(
    "itinerary:edit",
    async (data: {
      tripId: string;
      action: "UPDATE" | "CREATE" | "DELETE" | "REORDER";
      activity?: any;
      activityId?: string;
      dayId?: string;
      activityIds?: string[];
      summary?: string;
    }) => {
      if (!data?.tripId) return;

      // Broadcast immediately to all other collaborators in the trip
      socket.to(`trip:${data.tripId}`).emit("itinerary:changed", data);

      // Record activity log if summary provided
      if (currentUserId && data.summary) {
        try {
          const log = await prisma.activityLog.create({
            data: {
              itineraryId: data.tripId,
              userId: currentUserId,
              action: data.action,
              entityType: "ACTIVITY",
              entityId: data.activityId || data.activity?.id,
              summary: data.summary,
              details: data.activity ? (data.activity as any) : undefined,
            },
            include: {
              user: {
                select: { id: true, name: true, image: true, username: true },
              },
            },
          });
          io.to(`trip:${data.tripId}`).emit("activity-log:new", log);
        } catch (e) {
          console.error("Error creating activity log:", e);
        }
      }
    }
  );

  // 9. Comments & Thread Updates
  socket.on(
    "comment:new",
    async (data: { tripId: string; comment: any; mentionedUserIds?: string[] }) => {
      if (!data?.tripId || !data?.comment) return;

      // Broadcast comment to trip
      socket.to(`trip:${data.tripId}`).emit("comment:added", data.comment);

      // Notify mentioned collaborators
      if (data.mentionedUserIds && Array.isArray(data.mentionedUserIds)) {
        for (const targetId of data.mentionedUserIds) {
          if (targetId !== currentUserId) {
            io.to(`user:${targetId}`).emit("notification:new", {
              type: "MENTION",
              title: "You were mentioned in a trip note",
              message: `${data.comment.user?.name || "A collaborator"} mentioned you in a comment`,
              data: {
                tripId: data.tripId,
                commentId: data.comment.id,
              },
            });
          }
        }
      }
    }
  );

  socket.on(
    "comment:resolve",
    (data: { tripId: string; commentId: string; resolved: boolean }) => {
      if (!data?.tripId) return;
      socket.to(`trip:${data.tripId}`).emit("comment:resolved", data);
    }
  );

  socket.on(
    "comment:reaction",
    (data: { tripId: string; commentId: string; emoji: string; reactions: any[] }) => {
      if (!data?.tripId) return;
      socket.to(`trip:${data.tripId}`).emit("comment:reacted", data);
    }
  );

  // 10. Polls & Voting Events
  socket.on("poll:new", (data: { tripId: string; poll: any }) => {
    if (!data?.tripId || !data?.poll) return;
    socket.to(`trip:${data.tripId}`).emit("poll:created", data.poll);
  });

  socket.on("poll:vote", (data: { tripId: string; pollId: string; poll: any }) => {
    if (!data?.tripId || !data?.pollId) return;
    io.to(`trip:${data.tripId}`).emit("poll:updated", data.poll);
  });

  socket.on("poll:nudge", (data: { tripId: string; pollTitle: string; nonVoterIds: string[] }) => {
    if (!data?.nonVoterIds) return;
    for (const targetId of data.nonVoterIds) {
      io.to(`user:${targetId}`).emit("notification:new", {
        type: "POLL_DEADLINE",
        title: "Cast your vote!",
        message: `Your friends are waiting for your input on "${data.pollTitle}"`,
        data: { tripId: data.tripId },
      });
    }
  });

  // 11. Collaborator Invitations & Live Status Updates
  socket.on(
    "collaborator:invite-sent",
    (data: {
      tripId: string;
      invitedUserId?: string;
      collaborator: any;
      notification?: any;
    }) => {
      if (!data?.tripId) return;

      // Broadcast to trip room so owner's modal immediately shows pending invite
      io.to(`trip:${data.tripId}`).emit("collaborator:updated", {
        tripId: data.tripId,
        collaborator: data.collaborator,
      });

      // Send live invite to invited user's personal inbox
      if (data.invitedUserId) {
        io.to(`user:${data.invitedUserId}`).emit("invite:received", {
          collaborator: data.collaborator,
          notification: data.notification,
        });
      }
    }
  );

  socket.on(
    "collaborator:respond",
    (data: {
      tripId: string;
      userId: string;
      action: "ACCEPT" | "DECLINE";
      collaborator: any;
    }) => {
      if (!data?.tripId) return;

      // Broadcast to everyone in the trip so collaborator list updates instantly
      io.to(`trip:${data.tripId}`).emit("collaborator:updated", {
        tripId: data.tripId,
        collaborator: data.collaborator,
        action: data.action,
      });

      // Also notify user room
      io.to(`user:${data.userId}`).emit("invite:resolved", {
        tripId: data.tripId,
        action: data.action,
      });
    }
  );

  // 12. Journal entries live updates
  socket.on("journal:entry-added", (data: { tripId: string; entry: any }) => {
    if (!data?.tripId) return;
    socket.to(`trip:${data.tripId}`).emit("journal:updated", data.entry);
  });

  // 14. World of Travellers Global Chat Room
  socket.on("community:join", (_userData?: { id?: string; name?: string }) => {
    socket.join("community:global");
    socket.emit("community:history", globalCommunityChatMessages);
  });

  socket.on(
    "community:send-message",
    async (msgData: {
      text: string;
      user: { id: string; name: string; avatar?: string; tier?: string };
      message?: { id: string; senderId: string; senderName: string; senderAvatar?: string; senderTier?: string; text: string; createdAt: string };
      mentionedUserIds?: string[];
    }) => {
      if (!currentUserId || !msgData?.text?.trim()) return;

      const saved = msgData.message;
      if (!saved || saved.senderId !== currentUserId || saved.text !== msgData.text.trim()) return;
      const persisted = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM live_chat_messages WHERE id = $1 AND "conversationKey" = 'world' AND "senderId" = $2 LIMIT 1`,
        saved.id, currentUserId
      );
      if (!persisted.length) return;
      const newMsg: CommunityChatMessage = {
        id: saved?.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        text: msgData.text.trim(),
        user: {
          id: saved?.senderId || msgData.user?.id || "guest",
          name: saved?.senderName || msgData.user?.name || "Fellow Traveler",
          avatar:
            saved?.senderAvatar || msgData.user?.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${msgData.user?.id || "guest"}`,
          tier: saved?.senderTier || msgData.user?.tier || "FREE",
        },
        createdAt: saved?.createdAt || new Date().toISOString(),
      };

      io.to("community:global").emit("community:new-message", newMsg);
      const handles = [...new Set([...newMsg.text.matchAll(/@([a-z0-9_]{2,32})/gi)].map((match) => match[1].toLowerCase()))];
      const mentionedUsers = handles.length && msgData.mentionedUserIds?.length
        ? await prisma.user.findMany({
            where: {
              id: { in: msgData.mentionedUserIds },
              OR: handles.flatMap((handle) => [{ username: handle }, { email: { startsWith: `${handle}@` } }]),
            },
            select: { id: true },
          })
        : [];
      for (const { id: targetId } of mentionedUsers) {
        if (targetId !== newMsg.user.id) {
          io.to(`user:${targetId}`).emit("notification:new", {
            type: "MENTION", title: "You were mentioned in World of Travellers",
            message: `${newMsg.user.name} mentioned you: ${newMsg.text.slice(0, 120)}`,
            linkUrl: "/dashboard/chat", data: { messageId: newMsg.id, room: "world" },
          });
        }
      }
    }
  );

  // 15. P2P Direct Traveler-to-Traveler Chat
  socket.on("p2p:join", async (data: { userId: string; peerId: string }) => {
    if (!data?.userId || !data?.peerId || data.userId !== currentUserId) return;
    try {
      const rows = await prisma.$queryRawUnsafe<Array<{ status: string }>>(
        `SELECT status FROM chat_invites WHERE (("senderId" = $1 AND "recipientId" = $2) OR ("senderId" = $2 AND "recipientId" = $1)) ORDER BY "updatedAt" DESC LIMIT 1`,
        data.userId, data.peerId
      );
      if (rows[0]?.status !== "ACCEPTED") return;
    } catch { return; }
    const conversationKey = getP2PConversationKey(data.userId, data.peerId);
    const roomName = `p2p:${conversationKey}`;
    socket.join(roomName);

    const history = p2pConversationMessages.get(conversationKey) || [];
    socket.emit("p2p:history", {
      conversationKey,
      peerId: data.peerId,
      messages: history,
    });
  });

  socket.on(
    "p2p:send-message",
    async (msgData: {
      senderId: string;
      senderName: string;
      senderAvatar?: string;
      senderTier?: string;
      recipientId: string;
      recipientName?: string;
      recipientAvatar?: string;
      text: string;
      message?: P2PDirectMessage;
    }) => {
      if (!msgData?.text?.trim() || !msgData?.senderId || !msgData?.recipientId) return;
      if (!currentUserId || msgData.senderId !== currentUserId || !msgData.message || msgData.message.senderId !== currentUserId || msgData.message.recipientId !== msgData.recipientId) return;

      const conversationKey = getP2PConversationKey(msgData.senderId, msgData.recipientId);
      const persisted = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM live_chat_messages WHERE id = $1 AND "conversationKey" = $2 AND "senderId" = $3 AND "recipientId" = $4 LIMIT 1`,
        msgData.message.id, `p2p:${conversationKey}`, currentUserId, msgData.recipientId
      );
      if (!persisted.length) return;
      const roomName = `p2p:${conversationKey}`;

      const newMsg: P2PDirectMessage = msgData.message || {
        id: `p2p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        senderId: msgData.senderId,
        senderName: msgData.senderName,
        senderAvatar: msgData.senderAvatar,
        senderTier: msgData.senderTier,
        recipientId: msgData.recipientId,
        recipientName: msgData.recipientName,
        recipientAvatar: msgData.recipientAvatar,
        text: msgData.text.trim(),
        createdAt: new Date().toISOString(),
      };

      let history = p2pConversationMessages.get(conversationKey);
      if (!history) {
        history = [];
        p2pConversationMessages.set(conversationKey, history);
      }
      history.push(newMsg);
      if (history.length > 200) {
        history.shift();
      }

      // Broadcast to the conversation room
      io.to(roomName).emit("p2p:new-message", {
        conversationKey,
        message: newMsg,
      });

      // Also notify recipient's personal user room
      io.to(`user:${msgData.recipientId}`).emit("p2p:incoming-notification", {
        senderId: msgData.senderId,
        senderName: msgData.senderName,
        senderAvatar: msgData.senderAvatar,
        text: msgData.text.trim(),
        conversationKey,
      });
      io.to(`user:${msgData.recipientId}`).emit("notification:new", {
        type: "MESSAGE", title: `Message from ${newMsg.senderName}`,
        message: newMsg.text.slice(0, 160),
        linkUrl: `/dashboard/chat?peer=${encodeURIComponent(newMsg.senderId)}`,
        data: { messageId: newMsg.id, peerId: newMsg.senderId },
      });
    }
  );

  socket.on("social:request", async (data: { recipientId: string; senderId: string; senderName: string; inviteId?: string }) => {
    if (!data?.recipientId || !data.senderId || data.senderId !== currentUserId) return;
    const pendingInvite = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM chat_invites WHERE "senderId" = $1 AND "recipientId" = $2 AND status = 'PENDING' LIMIT 1`,
      currentUserId, data.recipientId
    );
    if (!pendingInvite.length) return;
    io.to(`user:${data.recipientId}`).emit("notification:new", {
      type: "INVITE", title: "New Chat Invite", message: `${data.senderName || "A traveler"} sent you a chat connection invite`,
      linkUrl: "/dashboard/chat", data: { inviteId: data.inviteId, senderId: data.senderId },
    });
    io.to(`user:${data.recipientId}`).emit("social:updated");
  });

  socket.on("social:updated", (data: { userIds?: string[] } = {}) => {
    for (const userId of data.userIds || []) io.to(`user:${userId}`).emit("social:updated");
  });

  // One-to-one WebRTC signaling. Only accepted chat connections can signal.
  socket.on("call:signal", async (data: { toUserId: string; kind: string; payload?: unknown }) => {
    if (!currentUserId || !data?.toUserId || data.toUserId === currentUserId) return;
    try {
      const pairKey = getCallPairKey(currentUserId, data.toUserId);
      if (!activeCallPairs.has(pairKey) || Date.now() - (activeCallPairs.get(pairKey) || 0) > 4 * 60 * 60 * 1000) {
        const rows = await prisma.$queryRawUnsafe<Array<{ status: string }>>(
          `SELECT status FROM chat_invites WHERE (("senderId" = $1 AND "recipientId" = $2) OR ("senderId" = $2 AND "recipientId" = $1)) ORDER BY "updatedAt" DESC LIMIT 1`,
          currentUserId, data.toUserId
        );
        if (rows[0]?.status !== "ACCEPTED") return;
        if (data.kind === "invite") activeCallPairs.set(pairKey, Date.now());
      }
      activeCallPairs.set(pairKey, Date.now());
      const signal: PendingCallSignal = { fromUserId: currentUserId, kind: data.kind, payload: data.payload, createdAt: Date.now() };
      if (data.kind === "invite" || data.kind === "offer") {
        const pending = pendingCallSignals.get(data.toUserId) || [];
        if (!pending.some((entry) => entry.fromUserId === currentUserId && entry.kind === data.kind)) pending.push(signal);
        pendingCallSignals.set(data.toUserId, pending);
      }
      if (data.kind === "accepted" || data.kind === "declined" || data.kind === "ended") {
        for (const userId of [currentUserId, data.toUserId]) {
          pendingCallSignals.set(userId, (pendingCallSignals.get(userId) || []).filter(
            (entry) => entry.fromUserId !== currentUserId && entry.fromUserId !== data.toUserId
          ));
        }
      }
      if (data.kind === "declined" || data.kind === "ended") activeCallPairs.delete(pairKey);
      io.to(`user:${data.toUserId}`).emit("call:signal", signal);
    } catch (error) {
      console.warn("[socket] Call signaling rejected:", error);
    }
  });

  socket.on("p2p:get-conversations", (data: { userId: string }) => {
    if (!data?.userId || data.userId !== currentUserId) return;
    const recentConversations: Array<{
      conversationKey: string;
      peerId: string;
      lastMessage: P2PDirectMessage;
    }> = [];

    for (const [key, msgs] of p2pConversationMessages.entries()) {
      const parts = key.split(":");
      if (parts.includes(data.userId) && msgs.length > 0) {
        const peerId = parts[0] === data.userId ? parts[1] : parts[0];
        recentConversations.push({
          conversationKey: key,
          peerId,
          lastMessage: msgs[msgs.length - 1],
        });
      }
    }

    socket.emit("p2p:conversations-list", recentConversations);
  });

  // 16. Disconnect cleanup
  socket.on("disconnect", () => {
    if (currentTripId) {
      const room = tripRooms.get(currentTripId);
      if (room) {
        room.delete(socket.id);
        if (room.size === 0) {
          tripRooms.delete(currentTripId);
        } else {
          broadcastRoster(currentTripId);
        }
      }

      // Release any locks held by this socket
      for (const [activityId, lock] of activityLocks.entries()) {
        if (lock.socketId === socket.id) {
          activityLocks.delete(activityId);
          io.to(`trip:${currentTripId}`).emit("lock:released", { activityId });
        }
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Wander.AI Socket.io Real-time Server listening on port ${PORT}`);
});
