import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import prisma from "@/lib/prisma";
import {
  ensureChatTables,
  getUserConnections,
  sendChatInvite,
  acceptChatInvite,
  declineChatInvite,
  cancelChatInvite,
} from "@/lib/chat-db";

export async function GET(request: NextRequest) {
  try {
    await ensureChatTables();

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
      // Fallback in dev/preview
      const firstUser = await prisma.user.findFirst();
      currentUserId = firstUser?.id || "guest";
    }

    const { friends, receivedRequests, sentRequests } = await getUserConnections(currentUserId);

    // Also get all discoverable users not yet connected
    const connectedOrPendingIds = new Set([
      currentUserId,
      ...friends.map((f: any) => f.id),
      ...receivedRequests.map((r: any) => r.id),
      ...sentRequests.map((s: any) => s.id),
    ]);

    const discoverUsers = await prisma.user.findMany({
      where: {
        id: { notIn: Array.from(connectedOrPendingIds) },
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        subscriptionTier: true,
      },
      take: 12,
    });

    return NextResponse.json({
      success: true,
      friends,
      receivedRequests,
      sentRequests,
      discoverUsers,
    });
  } catch (error: any) {
    console.error("Error fetching chat connections:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch connections" },
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
    const { action, targetUserId, inviteId, message } = body;

    if (action === "INVITE") {
      if (!targetUserId) {
        return NextResponse.json(
          { success: false, error: "targetUserId is required" },
          { status: 400 }
        );
      }
      if (targetUserId === currentUserId) {
        return NextResponse.json(
          { success: false, error: "Cannot invite yourself" },
          { status: 400 }
        );
      }

      const res = await sendChatInvite(currentUserId, targetUserId, message);
      return NextResponse.json({ ...res });
    }

    if (action === "ACCEPT") {
      if (!targetUserId && !inviteId) {
        return NextResponse.json(
          { success: false, error: "targetUserId or inviteId is required" },
          { status: 400 }
        );
      }
      const res = await acceptChatInvite(inviteId || targetUserId, currentUserId);
      return NextResponse.json({ ...res });
    }

    if (action === "DECLINE") {
      if (!targetUserId && !inviteId) {
        return NextResponse.json(
          { success: false, error: "targetUserId or inviteId is required" },
          { status: 400 }
        );
      }
      const res = await declineChatInvite(inviteId || targetUserId, currentUserId);
      return NextResponse.json({ ...res });
    }

    if (action === "CANCEL") {
      if (!targetUserId) {
        return NextResponse.json(
          { success: false, error: "targetUserId is required" },
          { status: 400 }
        );
      }
      const res = await cancelChatInvite(currentUserId, targetUserId);
      return NextResponse.json({ ...res });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error managing chat invite:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process chat invite" },
      { status: 500 }
    );
  }
}
