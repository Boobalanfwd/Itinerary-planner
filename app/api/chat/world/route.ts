import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import prisma from "@/lib/prisma";
import {
  ensureChatTables,
  getConversationMessages,
  saveLiveChatMessage,
} from "@/lib/chat-db";

const DEFAULT_WORLD_MESSAGES = [
  {
    senderName: "Lead Frans",
    text: "Hey everyone! Just wanted to kick off the day by saying how excited I am to dive into our latest project. Who's ready to work some design magic?",
    timeAgo: 3600000,
  },
  {
    senderName: "Floyd Miles",
    text: "Definitely pumped to get started. Did everyone get a chance to review the brief for Project Crypto?",
    timeAgo: 2400000,
  },
  {
    senderName: "Guy Hawkins",
    text: "Yes, I've looked it over. Seems like a fun challenge. Do we have any initial ideas brewing?",
    timeAgo: 1800000,
  },
  {
    senderName: "Theres Web",
    text: "Just wrapped up some color palette explorations! Sharing the travel moodboard shortly.",
    timeAgo: 900000,
  },
];

export async function GET(request: NextRequest) {
  try {
    await ensureChatTables();

    let messages = await getConversationMessages("world", 100);

    // If no messages exist yet in the database, seed default world chat messages with real users
    if (messages.length === 0) {
      const users = await prisma.user.findMany({ take: 5 });
      if (users.length > 0) {
        for (let i = 0; i < DEFAULT_WORLD_MESSAGES.length; i++) {
          const u = users[i % users.length];
          const sample = DEFAULT_WORLD_MESSAGES[i];
          await saveLiveChatMessage({
            conversationKey: "world",
            senderId: u.id,
            text: sample.text,
          });
        }
        messages = await getConversationMessages("world", 100);
      }
    }

    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    console.error("Error fetching world messages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch world messages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let senderId = session?.user?.id;

    if (!senderId && session?.user?.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      senderId = dbUser?.id;
    }

    if (!senderId) {
      // Fallback to first active user if guest in development
      const fallbackUser = await prisma.user.findFirst();
      senderId = fallbackUser?.id;
    }

    if (!senderId) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const text = body?.text?.trim();

    if (!text) {
      return NextResponse.json(
        { success: false, error: "Message text is required" },
        { status: 400 }
      );
    }

    const saved = await saveLiveChatMessage({
      conversationKey: "world",
      senderId,
      text,
    });

    return NextResponse.json({ success: true, message: saved });
  } catch (error: any) {
    console.error("Error sending world chat message:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    );
  }
}
