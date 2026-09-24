import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { addActivity } from "@/app/services/itineraryService";
import prisma from "@/lib/prisma";
import { z } from "zod";

const CreateActivitySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  time: z.string().optional(),
  duration: z.number().int().positive().optional(),
  cost: z.number().min(0).optional(),
  notes: z.string().optional(),
  locationName: z.string().optional(),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
  address: z.string().optional(),
  type: z.string().optional(),
});

/**
 * POST /api/days/[id]/activities
 * Add a new activity to a specific day.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dayId } = await params;

    // Look up the day to determine itinerary ownership
    const day = await prisma.day.findUnique({
      where: { id: dayId },
      include: { itinerary: true },
    });

    if (!day) {
      return NextResponse.json(
        { success: false, error: "Day not found" },
        { status: 404 }
      );
    }

    let userId = "";
    const itineraryOwnerId = day.itinerary.userId;

    if (itineraryOwnerId) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return NextResponse.json(
          { success: false, error: "Please sign in to add stops to this trip", code: "UNAUTHORIZED" },
          { status: 401 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (!user || user.id !== itineraryOwnerId) {
        return NextResponse.json(
          { success: false, error: "You do not have permission to modify this trip", code: "FORBIDDEN" },
          { status: 403 }
        );
      }

      userId = user.id;
    }

    const body = await request.json();
    const parsed = CreateActivitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const activity = await addActivity(dayId, userId, parsed.data);

    return NextResponse.json({ success: true, data: activity }, { status: 201 });
  } catch (error) {
    console.error("[days/activities] POST error:", error);
    const isUnauth = error instanceof Error && error.message === "Unauthorized";
    return NextResponse.json(
      { success: false, error: isUnauth ? "Unauthorized" : "Failed to add activity" },
      { status: isUnauth ? 403 : 500 }
    );
  }
}
