import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/app/lib/currentUser";

/**
 * GET /api/polls?tripId=...
 * Fetch all polls with options, user votes, and tallies
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get("tripId");

    if (!tripId) {
      return NextResponse.json({ success: false, error: "tripId is required" }, { status: 400 });
    }

    const polls = await prisma.poll.findMany({
      where: { itineraryId: tripId },
      include: {
        creator: {
          select: { id: true, name: true, username: true, image: true },
        },
        linkedActivity: {
          select: { id: true, title: true, time: true, dayId: true },
        },
        options: {
          include: {
            votes: {
              include: {
                user: { select: { id: true, name: true, username: true, image: true } },
              },
            },
          },
          orderBy: { position: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, polls });
  } catch (error: any) {
    console.error("Error fetching polls:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch polls" }, { status: 500 });
  }
}

/**
 * POST /api/polls
 * Create a new poll
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
      title,
      description,
      category = "activity",
      voteType = "thumbs", // "thumbs" | "star" | "ranked"
      deadline,
      linkedActivityId,
      options = [],
    } = body;

    if (!tripId || !title?.trim() || !options.length) {
      return NextResponse.json(
        { success: false, error: "tripId, title, and at least 2 options are required" },
        { status: 400 }
      );
    }

    const newPoll = await prisma.poll.create({
      data: {
        itineraryId: tripId,
        creatorId: currentUser.id,
        title: title.trim(),
        description: description?.trim() || null,
        category,
        voteType,
        deadline: deadline ? new Date(deadline) : null,
        linkedActivityId: linkedActivityId || null,
        options: {
          create: options.map((opt: any, idx: number) => ({
            title: typeof opt === "string" ? opt.trim() : opt.title.trim(),
            description: opt.description || null,
            photoUrl: opt.photoUrl || null,
            position: idx,
          })),
        },
      },
      include: {
        creator: {
          select: { id: true, name: true, username: true, image: true },
        },
        linkedActivity: true,
        options: {
          include: {
            votes: {
              include: {
                user: { select: { id: true, name: true, username: true, image: true } },
              },
            },
          },
        },
      },
    });

    // Notify all trip collaborators about the new poll
    const collaborators = await prisma.itineraryCollaborator.findMany({
      where: { itineraryId: tripId, inviteStatus: "ACCEPTED" },
      select: { userId: true },
    });

    for (const c of collaborators) {
      if (c.userId !== currentUser.id) {
        await prisma.notification.create({
          data: {
            userId: c.userId,
            actorId: currentUser.id,
            type: "POLL_CREATED",
            title: `New Poll: ${title}`,
            message: `${currentUser.name || "A collaborator"} created a poll to vote on: "${title}"`,
            linkUrl: `/itinerary/${tripId}`,
            data: { tripId, pollId: newPoll.id },
          },
        });
      }
    }

    // Log poll in ActivityLog
    await prisma.activityLog.create({
      data: {
        itineraryId: tripId,
        userId: currentUser.id,
        action: "CREATED",
        entityType: "POLL",
        entityId: newPoll.id,
        summary: `${currentUser.name || "A collaborator"} created a poll: "${title}"`,
      },
    });

    return NextResponse.json({ success: true, poll: newPoll });
  } catch (error: any) {
    console.error("Error creating poll:", error);
    return NextResponse.json({ success: false, error: "Failed to create poll" }, { status: 500 });
  }
}
