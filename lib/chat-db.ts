import { prisma } from "@/lib/prisma";

let tablesInitialized = false;

/**
 * Ensure chat tables exist in PostgreSQL database idempotently.
 */
export async function ensureChatTables() {
  if (tablesInitialized) return;

  try {
    // 1. Chat Invites table (for Instagram-style friend connections)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS chat_invites (
        id TEXT PRIMARY KEY,
        "senderId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "recipientId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'PENDING',
        message TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chat_invites_sender_recipient_unique UNIQUE ("senderId", "recipientId")
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_chat_invites_recipient ON chat_invites("recipientId")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_chat_invites_sender ON chat_invites("senderId")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_chat_invites_status ON chat_invites(status)
    `);

    // 2. Live Chat Messages table (persists world chat and direct P2P messages)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS live_chat_messages (
        id TEXT PRIMARY KEY,
        "conversationKey" TEXT NOT NULL,
        "senderId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "recipientId" TEXT,
        text TEXT NOT NULL,
        "isRead" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_live_chat_messages_conv ON live_chat_messages("conversationKey")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_live_chat_messages_created ON live_chat_messages("createdAt")
    `);

    tablesInitialized = true;
  } catch (error) {
    console.error("Error ensuring chat tables:", error);
  }
}

export interface ChatInviteRow {
  id: string;
  senderId: string;
  recipientId: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  message?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LiveMessageRow {
  id: string;
  conversationKey: string;
  senderId: string;
  recipientId?: string | null;
  text: string;
  isRead: boolean;
  createdAt: Date;
  senderName?: string;
  senderImage?: string;
  senderTier?: string;
}

/**
 * Get connection status between two users.
 * Returns: "ACCEPTED" | "PENDING_SENT" | "PENDING_RECEIVED" | "NONE"
 */
export async function getConnectionStatus(userId1: string, userId2: string): Promise<{
  status: "ACCEPTED" | "PENDING_SENT" | "PENDING_RECEIVED" | "NONE";
  inviteId?: string;
}> {
  await ensureChatTables();

  const results: ChatInviteRow[] = await prisma.$queryRawUnsafe(
    `
    SELECT * FROM chat_invites
    WHERE ("senderId" = $1 AND "recipientId" = $2)
       OR ("senderId" = $2 AND "recipientId" = $1)
    ORDER BY "updatedAt" DESC
    LIMIT 1;
    `,
    userId1,
    userId2
  );

  if (!results || results.length === 0) {
    return { status: "NONE" };
  }

  const invite = results[0];
  if (invite.status === "ACCEPTED") {
    return { status: "ACCEPTED", inviteId: invite.id };
  }

  if (invite.status === "PENDING") {
    if (invite.senderId === userId1) {
      return { status: "PENDING_SENT", inviteId: invite.id };
    } else {
      return { status: "PENDING_RECEIVED", inviteId: invite.id };
    }
  }

  return { status: "NONE" };
}

/**
 * Send a chat invite from sender to recipient
 */
export async function sendChatInvite(senderId: string, recipientId: string, message?: string) {
  await ensureChatTables();

  const inviteId = `invite_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO chat_invites (id, "senderId", "recipientId", status, message, "createdAt", "updatedAt")
    VALUES ($1, $2, $3, 'PENDING', $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("senderId", "recipientId")
    DO UPDATE SET status = 'PENDING', message = EXCLUDED.message, "updatedAt" = CURRENT_TIMESTAMP;
    `,
    inviteId,
    senderId,
    recipientId,
    message || "Hey! Let's connect on Wander and plan travel together."
  );

  // Also create an in-app notification for the recipient
  try {
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { name: true },
    });

    await prisma.notification.create({
      data: {
        userId: recipientId,
        actorId: senderId,
        type: "INVITE",
        title: "New Chat Invite",
        message: `${sender?.name || "A traveler"} sent you a chat connection invite`,
        linkUrl: "/dashboard/chat",
        data: { inviteId, senderId },
      },
    });
  } catch (err) {
    console.warn("Could not create invite notification:", err);
  }

  return { success: true, inviteId };
}

/**
 * Accept a chat invite
 */
export async function acceptChatInvite(inviteIdOrUserId: string, currentUserId: string) {
  await ensureChatTables();

  await prisma.$executeRawUnsafe(
    `
    UPDATE chat_invites
    SET status = 'ACCEPTED', "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = $1
       OR ("senderId" = $1 AND "recipientId" = $2)
       OR ("senderId" = $2 AND "recipientId" = $1);
    `,
    inviteIdOrUserId,
    currentUserId
  );

  return { success: true };
}

/**
 * Decline a chat invite
 */
export async function declineChatInvite(inviteIdOrUserId: string, currentUserId: string) {
  await ensureChatTables();

  await prisma.$executeRawUnsafe(
    `
    UPDATE chat_invites
    SET status = 'DECLINED', "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = $1
       OR ("senderId" = $1 AND "recipientId" = $2)
       OR ("senderId" = $2 AND "recipientId" = $1);
    `,
    inviteIdOrUserId,
    currentUserId
  );

  return { success: true };
}

/**
 * Cancel a sent invite
 */
export async function cancelChatInvite(senderId: string, recipientId: string) {
  await ensureChatTables();

  await prisma.$executeRawUnsafe(
    `
    DELETE FROM chat_invites
    WHERE "senderId" = $1 AND "recipientId" = $2 AND status = 'PENDING';
    `,
    senderId,
    recipientId
  );

  return { success: true };
}

/**
 * Get all social connection lists for a user (accepted friends, pending incoming, pending sent)
 */
export async function getUserConnections(userId: string) {
  await ensureChatTables();

  // 1. Accepted Friends
  const acceptedRows: any[] = await prisma.$queryRawUnsafe(
    `
    SELECT ci.id as "inviteId", ci."createdAt" as "connectedAt",
           u.id, u.name, u.username, u.email, u.image, u.bio, u."subscriptionTier"
    FROM chat_invites ci
    JOIN users u ON (
      CASE WHEN ci."senderId" = $1 THEN ci."recipientId" = u.id
           ELSE ci."senderId" = u.id END
    )
    WHERE (ci."senderId" = $1 OR ci."recipientId" = $1)
      AND ci.status = 'ACCEPTED';
    `,
    userId
  );

  // 2. Pending Requests Received (Incoming - needs acceptance)
  const incomingRows: any[] = await prisma.$queryRawUnsafe(
    `
    SELECT ci.id as "inviteId", ci.message, ci."createdAt",
           u.id, u.name, u.username, u.email, u.image, u.bio, u."subscriptionTier"
    FROM chat_invites ci
    JOIN users u ON ci."senderId" = u.id
    WHERE ci."recipientId" = $1 AND ci.status = 'PENDING'
    ORDER BY ci."createdAt" DESC;
    `,
    userId
  );

  // 3. Pending Requests Sent (Outgoing - awaiting response)
  const sentRows: any[] = await prisma.$queryRawUnsafe(
    `
    SELECT ci.id as "inviteId", ci.message, ci."createdAt",
           u.id, u.name, u.username, u.email, u.image, u.bio, u."subscriptionTier"
    FROM chat_invites ci
    JOIN users u ON ci."recipientId" = u.id
    WHERE ci."senderId" = $1 AND ci.status = 'PENDING'
    ORDER BY ci."createdAt" DESC;
    `,
    userId
  );

  return {
    friends: acceptedRows,
    receivedRequests: incomingRows,
    sentRequests: sentRows,
  };
}

/**
 * Save a live message
 */
export async function saveLiveChatMessage(data: {
  conversationKey: string;
  senderId: string;
  recipientId?: string | null;
  text: string;
}) {
  await ensureChatTables();

  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO live_chat_messages (id, "conversationKey", "senderId", "recipientId", text, "isRead", "createdAt")
    VALUES ($1, $2, $3, $4, $5, false, CURRENT_TIMESTAMP);
    `,
    msgId,
    data.conversationKey,
    data.senderId,
    data.recipientId || null,
    data.text
  );

  // Fetch the sender details to return full message object
  const sender = await prisma.user.findUnique({
    where: { id: data.senderId },
    select: { id: true, name: true, image: true, subscriptionTier: true },
  });

  return {
    id: msgId,
    conversationKey: data.conversationKey,
    senderId: data.senderId,
    senderName: sender?.name || "Traveler",
    senderAvatar: sender?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.senderId}`,
    senderTier: sender?.subscriptionTier || "FREE",
    recipientId: data.recipientId,
    text: data.text,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Fetch messages for a conversationKey ("world" or "p2p:userId1:userId2")
 */
export async function getConversationMessages(conversationKey: string, limit = 50) {
  await ensureChatTables();

  const rows: any[] = await prisma.$queryRawUnsafe(
    `
    SELECT m.id, m."conversationKey", m."senderId", m."recipientId", m.text, m."isRead", m."createdAt",
           u.name as "senderName", u.image as "senderImage", u."subscriptionTier" as "senderTier"
    FROM live_chat_messages m
    JOIN users u ON m."senderId" = u.id
    WHERE m."conversationKey" = $1
    ORDER BY m."createdAt" ASC
    LIMIT $2;
    `,
    conversationKey,
    limit
  );

  return rows.map((r) => ({
    id: r.id,
    conversationKey: r.conversationKey,
    senderId: r.senderId,
    senderName: r.senderName || "Traveler",
    senderAvatar: r.senderImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.senderId}`,
    senderTier: r.senderTier || "FREE",
    recipientId: r.recipientId,
    text: r.text,
    createdAt: new Date(r.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));
}
