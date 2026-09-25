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

    const poll = await prisma.poll.findUnique({
      where: { id },
      include: {
        votes: { select: { userId: true } },
        itinerary: {
          include: {
            collaborators: {
              where: { inviteStatus: "ACCEPTED" },
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!poll) {
      return NextResponse.json({ success: false, error: "Poll not found" }, { status: 404 });
    }

    const votedUserIds = new Set(poll.votes.map((v) => v.userId));
    const allMembers = [
      poll.itinerary.userId,
      ...poll.itinerary.collaborators.map((c) => c.userId),
    ];
    const nonVoterIds = allMembers.filter(
      (userId) => !votedUserIds.has(userId) && userId !== currentUser.id
    );

    for (const targetId of nonVoterIds) {
      await prisma.notification.create({
        data: {
          userId: targetId,
          actorId: currentUser.id,
          type: "POLL_DEADLINE",
          title: "Vote needed: " + poll.title,
          message: `${currentUser.name || "A collaborator"} is waiting for your vote on "${poll.title}"!`,
          linkUrl: `/itinerary/${poll.itineraryId}`,
          data: { tripId: poll.itineraryId, pollId: poll.id },
        },
      });
    }

    return NextResponse.json({
      success: true,
      nudgedCount: nonVoterIds.length,
      message: `Sent reminders to ${nonVoterIds.length} collaborators`,
      nonVoterIds,
    });
  } catch (error: any) {
    console.error("Error nudging non-voters:", error);
    return NextResponse.json({ success: false, error: "Failed to send reminders" }, { status: 500 });
  }
}
