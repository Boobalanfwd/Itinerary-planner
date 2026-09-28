import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import prisma from "@/lib/prisma";
import {
  ensureChatTables,
  getConnectionStatus,
  getConversationMessages,
  saveLiveChatMessage,
} from "@/lib/chat-db";

function getConversationKey(u1: string, u2: string) {
  return [u1, u2].sort().join(":");
}

export async function GET(request: NextRequest) {
  try {
    await ensureChatTables();

    const { searchParams } = new URL(request.url);
    const peerId = searchParams.get("peerId");

    if (!peerId) {
      return NextResponse.json(
        { success: false, error: "peerId is required" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    let currentUserId = session?.user?.id;

    if (!currentUserId && session?.user?.email) {
      const u = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      currentUserId = u?.id;
    }

    if (!currentUserId) {
      const firstUser = await prisma.user.findFirst();
      currentUserId = firstUser?.id || "guest";
    }

    // Check Instagram-like connection status
    const { status, inviteId } = await getConnectionStatus(currentUserId, peerId);
    const conversationKey = `p2p:${getConversationKey(currentUserId, peerId)}`;
    const messages = await getConversationMessages(conversationKey, 80);

    return NextResponse.json({
      success: true,
      connectionStatus: status,
      inviteId,
      messages,
      isAllowedToChat: status === "ACCEPTED",
    });
  } catch (error: any) {
    console.error("Error fetching direct messages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let currentUserId = session?.user?.id;

    if (!currentUserId && session?.user?.email) {
      const u = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      currentUserId = u?.id;
    }

    if (!currentUserId) {
      const firstUser = await prisma.user.findFirst();
      currentUserId = firstUser?.id;
    }

    if (!currentUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const recipientId = body?.recipientId;
    const text = body?.text?.trim();

    if (!recipientId || !text) {
      return NextResponse.json(
        { success: false, error: "recipientId and text are required" },
        { status: 400 }
      );
    }

    // Verify Instagram-like friendship permission: ONLY accepted friends can chat
    const { status } = await getConnectionStatus(currentUserId, recipientId);
    if (status !== "ACCEPTED") {
      return NextResponse.json(
        {
          success: false,
          error: "You can only chat with accepted friends. Please send or accept a chat invite first.",
          connectionStatus: status,
        },
        { status: 403 }
      );
    }

    const conversationKey = `p2p:${getConversationKey(currentUserId, recipientId)}`;
    const saved = await saveLiveChatMessage({
      conversationKey,
      senderId: currentUserId,
      recipientId,
      text,
    });

    return NextResponse.json({
      success: true,
      message: saved,
    });
  } catch (error: any) {
    console.error("Error sending direct message:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send direct message" },
      { status: 500 }
    );
  }
}
