import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/app/lib/currentUser";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { emoji } = await req.json();
    if (!emoji) {
      return NextResponse.json({ success: false, error: "Emoji is required" }, { status: 400 });
    }

    // Check if user already reacted with this emoji
    const existing = await prisma.commentReaction.findUnique({
      where: {
        commentId_userId_emoji: {
          commentId: id,
          userId: currentUser.id,
          emoji,
        },
      },
    });

    if (existing) {
      await prisma.commentReaction.delete({
        where: { id: existing.id },
      });
    } else {
      await prisma.commentReaction.create({
        data: {
          commentId: id,
          userId: currentUser.id,
          emoji,
        },
      });
    }

    const updatedReactions = await prisma.commentReaction.findMany({
      where: { commentId: id },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, reactions: updatedReactions });
  } catch (error: any) {
    console.error("Error toggling reaction:", error);
    return NextResponse.json({ success: false, error: "Failed to update reaction" }, { status: 500 });
  }
}
