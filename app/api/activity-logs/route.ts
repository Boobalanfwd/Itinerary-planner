import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get("tripId");

    if (!tripId) {
      return NextResponse.json({ success: false, error: "tripId is required" }, { status: 400 });
    }

    const logs = await prisma.activityLog.findMany({
      where: { itineraryId: tripId },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error("Error fetching activity logs:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch activity logs" }, { status: 500 });
  }
}
