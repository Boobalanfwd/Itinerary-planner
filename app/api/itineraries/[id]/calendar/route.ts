import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import prisma from "@/lib/prisma";
import {
  generateCalendarFile,
  getCalendarFileName,
  parseActivityTime,
  calculateEndTime,
} from "@/app/lib/calendarService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    // Fetch itinerary with activities
    const itinerary = await prisma.itinerary.findUnique({
      where: { id },
      include: {
        days: {
          orderBy: { dayNumber: "asc" },
          include: {
            activities: {
              orderBy: { time: "asc" },
            },
          },
        },
      },
    });

    if (!itinerary) {
      return NextResponse.json(
        { error: "Itinerary not found" },
        { status: 404 }
      );
    }

    // Check access permissions
    if (itinerary.visibility === "PRIVATE" && (!session?.user?.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Transform itinerary data for calendar generation
    const calendarActivities = itinerary.days.flatMap((day) =>
      day.activities.map((activity) => {
        const startTime = parseActivityTime(day.date, activity.time);
        const endTime = calculateEndTime(startTime, activity.duration || 120);

        return {
          id: activity.id,
          title: activity.title,
          description: activity.description || undefined,
          location: activity.locationName || activity.address || undefined,
          startTime,
          endTime,
          type: activity.type,
        };
      })
    );

    const calendarData = {
      id: itinerary.id,
      title: itinerary.title || `${itinerary.destination} Trip`,
      destination: itinerary.destination,
      activities: calendarActivities,
    };

    // Generate .ics file
    const icsContent = generateCalendarFile(calendarData);
    const fileName = getCalendarFileName(calendarData);

    // Return as downloadable file
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Calendar export error:", error);
    return NextResponse.json(
      { error: "Failed to generate calendar file" },
      { status: 500 }
    );
  }
}
