import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { ActivityReorderSchema } from "@/schemas/activity";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const parseResult = ActivityReorderSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues.map((i) => i.message).join(", "),
        },
        { status: 400 }
      );
    }

    const { activityIds } = parseResult.data;

    // Check ownership
    const day = await prisma.day.findUnique({
      where: { id },
      include: {
        itinerary: {
          select: { user: { select: { email: true } } },
        },
      },
    });

    if (!day || day.itinerary.user.email !== session.user.email) {
      return NextResponse.json(
        { success: false, error: "Day not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update positions sequentially in transaction
    await prisma.$transaction(
      activityIds.map((actId, position) =>
        prisma.activity.update({
          where: { id: actId, dayId: id },
          data: { position },
        })
      )
    );

    const updatedActivities = await prisma.activity.findMany({
      where: { dayId: id },
      orderBy: { position: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: updatedActivities,
    });
  } catch (error: any) {
    console.error("[day-reorder] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to reorder activities",
      },
      { status: 500 }
    );
  }
}
