import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/app/lib/currentUser";

/**
 * GET /api/comments?tripId=...&anchorType=...&anchorId=...
 * Fetch threaded comments with user details, reactions, and replies
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get("tripId");
    const anchorType = searchParams.get("anchorType"); // "activity" | "place" | "day" | "itinerary"
    const anchorId = searchParams.get("anchorId");

    if (!tripId) {
      return NextResponse.json({ success: false, error: "tripId is required" }, { status: 400 });
    }

    const whereClause: any = {
      itineraryId: tripId,
      parentId: null, // Top-level comments
    };

    if (anchorType && anchorId) {
      whereClause.anchorType = anchorType;
      whereClause.anchorId = anchorId;
    }

    const comments = await prisma.comment.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true, email: true },
        },
        reactions: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        replies: {
          include: {
            user: {
              select: { id: true, name: true, username: true, image: true, email: true },
            },
            reactions: {
              include: { user: { select: { id: true, name: true } } },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Also compute count of unresolved comments per anchor for badges
    const allComments = await prisma.comment.findMany({
      where: { itineraryId: tripId },
      select: {
        id: true,
        anchorType: true,
        anchorId: true,
        resolved: true,
      },
    });

    const badgeCounts: Record<string, { total: number; unresolved: number }> = {};
    for (const c of allComments) {
      const key = `${c.anchorType}:${c.anchorId}`;
      if (!badgeCounts[key]) {
        badgeCounts[key] = { total: 0, unresolved: 0 };
      }
      badgeCounts[key].total++;
      if (!c.resolved) {
        badgeCounts[key].unresolved++;
      }
    }

    return NextResponse.json({
      success: true,
      comments,
      badgeCounts,
    });
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch comments" }, { status: 500 });
  }
}

/**
 * POST /api/comments
 * Create a new comment or reply
 */
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      tripId,
      anchorType = "activity",
      anchorId,
      text,
      parentId,
      attachments = [],
      mentionedUserIds = [],
    } = body;

    if (!tripId || !anchorId || !text?.trim()) {
      return NextResponse.json(
        { success: false, error: "tripId, anchorId, and text are required" },
        { status: 400 }
      );
    }

    const newComment = await prisma.comment.create({
      data: {
        itineraryId: tripId,
        anchorType,
        anchorId,
        userId: currentUser.id,
        parentId: parentId || undefined,
        text: text.trim(),
        attachments: attachments?.length ? attachments : undefined,
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true, email: true },
        },
        reactions: true,
        replies: true,
      },
    });

    // Create notifications for mentioned users
    if (mentionedUserIds && Array.isArray(mentionedUserIds)) {
      for (const mId of mentionedUserIds) {
        if (mId !== currentUser.id) {
          await prisma.notification.create({
            data: {
              userId: mId,
              actorId: currentUser.id,
              type: "MENTION",
              title: "Mentioned in comment",
              message: `${currentUser.name || "A collaborator"} mentioned you in a comment: "${text.slice(0, 60)}..."`,
              linkUrl: `/itinerary/${tripId}`,
              data: { tripId, commentId: newComment.id, anchorType, anchorId },
            },
          });
        }
      }
    }

    // Log comment in ActivityLog
    await prisma.activityLog.create({
      data: {
        itineraryId: tripId,
        userId: currentUser.id,
        action: "COMMENTED",
        entityType: "COMMENT",
        entityId: newComment.id,
        summary: `${currentUser.name || "A traveler"} commented: "${text.slice(0, 40)}${text.length > 40 ? "..." : ""}"`,
      },
    });

    return NextResponse.json({ success: true, comment: newComment });
  } catch (error: any) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ success: false, error: "Failed to create comment" }, { status: 500 });
  }
}
