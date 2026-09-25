import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/app/lib/currentUser";
import { CollaboratorRole, InviteStatus } from "@prisma/client";
import { sendTripInviteEmail } from "@/app/lib/emailService";

// Helper to notify the local real-time server via socket or webhook if needed
async function emitSocketEvent(event: string, data: any) {
  try {
    // If the socket server is running on 3001, we can post to it or let client socket handle it
  } catch (e) {
    // Non-blocking
  }
}

/**
 * GET /api/collaborators?tripId=...
 * Fetch all collaborators, owner, and pending invites for the trip
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get("tripId");

    if (!tripId) {
      return NextResponse.json(
        { success: false, error: "tripId is required" },
        { status: 400 }
      );
    }

    const trip = await prisma.itinerary.findUnique({
      where: { id: tripId },
      include: {
        user: {
          select: { id: true, name: true, username: true, email: true, image: true },
        },
        collaborators: {
          include: {
            user: {
              select: { id: true, name: true, username: true, email: true, image: true },
            },
            invitedByUser: {
              select: { id: true, name: true, username: true },
            },
          },
          orderBy: { invitedAt: "desc" },
        },
      },
    });

    if (!trip) {
      return NextResponse.json(
        { success: false, error: "Trip not found" },
        { status: 404 }
      );
    }

    const owner = {
      id: `owner-${trip.user.id}`,
      itineraryId: trip.id,
      userId: trip.user.id,
      role: "OWNER" as const,
      inviteStatus: "ACCEPTED" as const,
      user: trip.user,
      invitedAt: trip.createdAt,
      acceptedAt: trip.createdAt,
    };

    return NextResponse.json({
      success: true,
      owner,
      collaborators: trip.collaborators,
      allMembers: [owner, ...trip.collaborators.filter((c) => c.inviteStatus === "ACCEPTED")],
    });
  } catch (error: any) {
    console.error("Error fetching collaborators:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch collaborators" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/collaborators
 * Send invite to a traveler (either by userId from in-portal search or by email)
 */
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { tripId, targetUserId, email, role = "TRAVELER", sectionOverrides } = body;

    if (!tripId) {
      return NextResponse.json(
        { success: false, error: "tripId is required" },
        { status: 400 }
      );
    }

    const trip = await prisma.itinerary.findUnique({
      where: { id: tripId },
      include: { user: true },
    });

    if (!trip) {
      return NextResponse.json(
        { success: false, error: "Trip not found" },
        { status: 404 }
      );
    }

    let userToInvite: any = null;
    if (targetUserId) {
      userToInvite = await prisma.user.findUnique({
        where: { id: targetUserId },
      });
    } else if (email) {
      const cleanEmail = email.trim().toLowerCase();
      userToInvite = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      // If user does not exist on platform yet, create a registered profile so they can be linked
      if (!userToInvite) {
        userToInvite = await prisma.user.create({
          data: {
            email: cleanEmail,
            name: cleanEmail.split("@")[0],
            username:
              cleanEmail.split("@")[0].replace(/[^a-zA-Z0-9]/g, "_") +
              "_" +
              Math.random().toString(36).substring(2, 6),
            role: "USER",
          },
        });
      }
    }

    if (!userToInvite && !email) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid user or email" },
        { status: 400 }
      );
    }

    // Check if target is already the owner
    if (userToInvite && userToInvite.id === trip.userId) {
      return NextResponse.json(
        { success: false, error: "User is the owner of this trip" },
        { status: 400 }
      );
    }

    // Check if already invited or collaborator
    let existing = null;
    if (userToInvite) {
      existing = await prisma.itineraryCollaborator.findUnique({
        where: {
          itineraryId_userId: {
            itineraryId: tripId,
            userId: userToInvite.id,
          },
        },
      });
    }

    let collaboratorRecord;
    if (existing) {
      // Re-activate or update existing invite
      collaboratorRecord = await prisma.itineraryCollaborator.update({
        where: { id: existing.id },
        data: {
          role: role as CollaboratorRole,
          inviteStatus: InviteStatus.PENDING,
          invitedAt: new Date(),
          invitedByUserId: currentUser.id,
          sectionOverrides: sectionOverrides || existing.sectionOverrides,
        },
        include: {
          user: {
            select: { id: true, name: true, username: true, email: true, image: true },
          },
          itinerary: {
            select: { id: true, title: true, destination: true, coverImage: true },
          },
        },
      });
    } else if (userToInvite) {
      collaboratorRecord = await prisma.itineraryCollaborator.create({
        data: {
          itineraryId: tripId,
          userId: userToInvite.id,
          role: role as CollaboratorRole,
          inviteStatus: InviteStatus.PENDING,
          invitedByUserId: currentUser.id,
          invitedEmail: userToInvite.email || email,
          sectionOverrides: sectionOverrides || undefined,
        },
        include: {
          user: {
            select: { id: true, name: true, username: true, email: true, image: true },
          },
          itinerary: {
            select: { id: true, title: true, destination: true, coverImage: true },
          },
        },
      });
    }

    // Create in-app Notification for the invited traveler
    let notification = null;
    if (userToInvite) {
      notification = await prisma.notification.create({
        data: {
          userId: userToInvite.id,
          actorId: currentUser.id,
          type: "INVITE",
          title: `Trip Invitation: ${trip.title || trip.destination}`,
          message: `${currentUser.name || "A friend"} invited you to collaborate as a ${role} on "${trip.title || trip.destination}"`,
          linkUrl: `/itinerary/${trip.id}`,
          data: {
            tripId: trip.id,
            tripTitle: trip.title || trip.destination,
            role,
            collaboratorId: collaboratorRecord?.id,
          },
        },
      });
    }

    // Send actual Email Invitation via Nodemailer
    const targetEmail = userToInvite?.email || email;
    let emailSent = false;
    let emailMessageId: string | null = null;
    let emailError: string | null = null;

    if (targetEmail) {
      try {
        const mailResult = await sendTripInviteEmail({
          to: targetEmail,
          recipientName: userToInvite?.name || undefined,
          inviterName: currentUser.name || "A friend",
          inviterEmail: currentUser.email || undefined,
          tripId: trip.id,
          tripTitle: trip.title || trip.destination,
          destination: trip.destination,
          role,
          coverImage: trip.coverImage || undefined,
          duration: trip.duration,
          startDate: trip.startDate || undefined,
          endDate: trip.endDate || undefined,
        });

        if (mailResult?.success) {
          emailSent = true;
          emailMessageId = mailResult.messageId || null;
        } else if (mailResult?.error) {
          emailError = String(mailResult.error);
        }
      } catch (err: any) {
        console.error("Email send exception:", err);
        emailError = err?.message || "Failed to dispatch email";
      }
    }

    // Log the invite action
    if (collaboratorRecord) {
      await prisma.activityLog.create({
        data: {
          itineraryId: tripId,
          userId: currentUser.id,
          action: "INVITED",
          entityType: "COLLABORATOR",
          entityId: collaboratorRecord.id,
          summary: `${currentUser.name || "Owner"} invited ${userToInvite?.name || userToInvite?.username || targetEmail} as ${role}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: emailSent
        ? `Invitation sent and email delivered to ${targetEmail}! ✉️`
        : `Invitation sent to ${targetEmail}.`,
      collaborator: collaboratorRecord,
      notification,
      emailSent,
      emailMessageId,
      emailError,
    });
  } catch (error: any) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/collaborators
 * Update role or section overrides
 */
export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { collaboratorId, role, sectionOverrides } = body;

    if (!collaboratorId) {
      return NextResponse.json({ success: false, error: "collaboratorId is required" }, { status: 400 });
    }

    const updated = await prisma.itineraryCollaborator.update({
      where: { id: collaboratorId },
      data: {
        ...(role ? { role: role as CollaboratorRole } : {}),
        ...(sectionOverrides !== undefined ? { sectionOverrides } : {}),
      },
      include: {
        user: { select: { id: true, name: true, username: true, image: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, collaborator: updated });
  } catch (error: any) {
    console.error("Error updating collaborator:", error);
    return NextResponse.json({ success: false, error: "Failed to update collaborator" }, { status: 500 });
  }
}

/**
 * DELETE /api/collaborators?id=...
 * Revoke invite or remove collaborator
 */
export async function DELETE(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    await prisma.itineraryCollaborator.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Collaborator or invite removed" });
  } catch (error: any) {
    console.error("Error removing collaborator:", error);
    return NextResponse.json({ success: false, error: "Failed to remove collaborator" }, { status: 500 });
  }
}
