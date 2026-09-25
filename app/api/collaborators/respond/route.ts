import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/app/lib/currentUser";
import { InviteStatus } from "@prisma/client";

/**
 * POST /api/collaborators/respond
 * Accept or decline a trip invitation
 */
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { collaboratorId, tripId, action } = body; // action: 'ACCEPT' | 'DECLINE'

    if (!action || !["ACCEPT", "DECLINE"].includes(action)) {
      return NextResponse.json({ success: false, error: "Action must be ACCEPT or DECLINE" }, { status: 400 });
    }

    let collaboratorRecord = null;

    if (collaboratorId) {
      collaboratorRecord = await prisma.itineraryCollaborator.findUnique({
        where: { id: collaboratorId },
        include: { itinerary: true },
      });
    } else if (tripId) {
      collaboratorRecord = await prisma.itineraryCollaborator.findUnique({
        where: {
          itineraryId_userId: {
            itineraryId: tripId,
            userId: currentUser.id,
          },
        },
        include: { itinerary: true },
      });
    }

    if (!collaboratorRecord) {
      return NextResponse.json({ success: false, error: "Invitation not found" }, { status: 404 });
    }

    if (action === "ACCEPT") {
      const updated = await prisma.itineraryCollaborator.update({
        where: { id: collaboratorRecord.id },
        data: {
          inviteStatus: InviteStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
        include: {
          user: { select: { id: true, name: true, username: true, email: true, image: true } },
          itinerary: { select: { id: true, title: true, destination: true } },
        },
      });

      // Mark the corresponding notification as read
      await prisma.notification.updateMany({
        where: {
          userId: currentUser.id,
          type: "INVITE",
          data: {
            path: ["tripId"],
            equals: collaboratorRecord.itineraryId,
          },
        },
        data: { isRead: true },
      });

      // Notify the trip owner
      if (collaboratorRecord.itinerary.userId !== currentUser.id) {
        await prisma.notification.create({
          data: {
            userId: collaboratorRecord.itinerary.userId,
            actorId: currentUser.id,
            type: "INVITE_ACCEPTED",
            title: "Invitation Accepted! 🎉",
            message: `${currentUser.name || "A traveler"} joined your trip "${collaboratorRecord.itinerary.title || collaboratorRecord.itinerary.destination}"`,
            linkUrl: `/itinerary/${collaboratorRecord.itineraryId}`,
            data: { tripId: collaboratorRecord.itineraryId },
          },
        });
      }

      // Log in activity log
      await prisma.activityLog.create({
        data: {
          itineraryId: collaboratorRecord.itineraryId,
          userId: currentUser.id,
          action: "UPDATED",
          entityType: "COLLABORATOR",
          entityId: updated.id,
          summary: `${currentUser.name || "Traveler"} joined as ${updated.role}`,
        },
      });

      return NextResponse.json({ success: true, action: "ACCEPTED", collaborator: updated });
    } else {
      // DECLINE
      const updated = await prisma.itineraryCollaborator.update({
        where: { id: collaboratorRecord.id },
        data: {
          inviteStatus: InviteStatus.DECLINED,
        },
        include: {
          user: { select: { id: true, name: true, username: true, email: true, image: true } },
        },
      });

      // Mark notification as read
      await prisma.notification.updateMany({
        where: {
          userId: currentUser.id,
          type: "INVITE",
          data: {
            path: ["tripId"],
            equals: collaboratorRecord.itineraryId,
          },
        },
        data: { isRead: true },
      });

      return NextResponse.json({ success: true, action: "DECLINED", collaborator: updated });
    }
  } catch (error: any) {
    console.error("Error responding to invitation:", error);
    return NextResponse.json({ success: false, error: "Failed to respond to invitation" }, { status: 500 });
  }
}
