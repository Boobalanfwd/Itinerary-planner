import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { updateActivity, deleteActivity } from "@/app/services/itineraryService";
import prisma from "@/lib/prisma";
import { z } from "zod";

const UpdateActivitySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  time: z.string().optional(),
  duration: z.number().int().positive().nullable().optional(),
  cost: z.number().min(0).nullable().optional(),
  notes: z.string().nullable().optional(),
  locationName: z.string().nullable().optional(),
  locationLat: z.number().nullable().optional(),
  locationLng: z.number().nullable().optional(),
  address: z.string().nullable().optional(),
  type: z.string().optional(),
  position: z.number().int().optional(),
});

/**
 * PATCH /api/activities/[id]
 * Update an activity. Ownership verified inside updateActivity service.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: { day: { include: { itinerary: true } } },
    });

    if (!activity) {
      return NextResponse.json(
        { success: false, error: "Activity not found" },
        { status: 404 }
      );
    }

    const session = await getServerSession(authOptions);
    const itineraryOwnerId = activity.day.itinerary.userId;

    let userId = "";

    if (itineraryOwnerId) {
      if (!session?.user?.email) {
        return NextResponse.json(
          { success: false, error: "Please sign in to modify this itinerary", code: "UNAUTHORIZED" },
          { status: 401 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (!user || user.id !== itineraryOwnerId) {
        return NextResponse.json(
          { success: false, error: "You do not have permission to modify this itinerary", code: "FORBIDDEN" },
          { status: 403 }
        );
      }

      userId = user.id;
    }

    const body = await request.json();
    const updates = UpdateActivitySchema.parse(body);

    await updateActivity(id, userId, {
      title: updates.title,
      description: updates.description,
      time: updates.time,
      duration: updates.duration,
      cost: updates.cost,
      notes: updates.notes,
      locationName: updates.locationName,
      locationLat: updates.locationLat,
      locationLng: updates.locationLng,
      address: updates.address,
      type: updates.type,
      position: updates.position,
    });

    const updated = await prisma.activity.findUnique({
      where: { id },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[activities] PATCH error:", error);

    const isUnauth =
      error instanceof Error && error.message === "Unauthorized";

    return NextResponse.json(
      { success: false, error: isUnauth ? "Unauthorized" : "Failed to update activity" },
      { status: isUnauth ? 403 : 500 }
    );
  }
}

/**
 * DELETE /api/activities/[id]
 * Delete an activity. Ownership verified inside deleteActivity service.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: { day: { include: { itinerary: true } } },
    });

    if (!activity) {
      return NextResponse.json(
        { success: false, error: "Activity not found" },
        { status: 404 }
      );
    }

    const session = await getServerSession(authOptions);
    const itineraryOwnerId = activity.day.itinerary.userId;

    let userId = "";

    if (itineraryOwnerId) {
      if (!session?.user?.email) {
        return NextResponse.json(
          { success: false, error: "Please sign in to modify this itinerary", code: "UNAUTHORIZED" },
          { status: 401 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (!user || user.id !== itineraryOwnerId) {
        return NextResponse.json(
          { success: false, error: "You do not have permission to modify this itinerary", code: "FORBIDDEN" },
          { status: 403 }
        );
      }

      userId = user.id;
    }

    await deleteActivity(id, userId);

    return NextResponse.json({ success: true, message: "Activity deleted" });
  } catch (error) {
    console.error("[activities] DELETE error:", error);

    const isUnauth =
      error instanceof Error && error.message === "Unauthorized";

    return NextResponse.json(
      { success: false, error: isUnauth ? "Unauthorized" : "Failed to delete activity" },
      { status: isUnauth ? 403 : 500 }
    );
  }
}
