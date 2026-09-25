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

    const { activityId, optionId } = await req.json();

    const poll = await prisma.poll.findUnique({
      where: { id },
      include: { options: true },
    });

    if (!poll) {
      return NextResponse.json({ success: false, error: "Poll not found" }, { status: 404 });
    }

    const targetOptionId = optionId || poll.winnerOptionId || poll.options[0]?.id;
    const chosenOption = poll.options.find((o) => o.id === targetOptionId);

    if (!chosenOption) {
      return NextResponse.json({ success: false, error: "No winning option found" }, { status: 400 });
    }

    const targetActivityId = activityId || poll.linkedActivityId;
    if (!targetActivityId) {
      return NextResponse.json({ success: false, error: "No target itinerary activity slot provided" }, { status: 400 });
    }

    // Update the itinerary activity title, description, and link
    const updatedActivity = await prisma.activity.update({
      where: { id: targetActivityId },
      data: {
        title: chosenOption.title,
        description: chosenOption.description || undefined,
      },
    });

    // Mark poll linked
    await prisma.poll.update({
      where: { id },
      data: {
        linkedActivityId: targetActivityId,
        winnerOptionId: targetOptionId,
        status: "closed",
      },
    });

    // Record activity log
    await prisma.activityLog.create({
      data: {
        itineraryId: poll.itineraryId,
        userId: currentUser.id,
        action: "UPDATED",
        entityType: "ACTIVITY",
        entityId: targetActivityId,
        summary: `Group voted and populated "${chosenOption.title}" into the schedule`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Itinerary slot updated with winning choice "${chosenOption.title}"`,
      activity: updatedActivity,
    });
  } catch (error: any) {
    console.error("Error applying poll winner to slot:", error);
    return NextResponse.json({ success: false, error: "Failed to apply poll winner" }, { status: 500 });
  }
}
