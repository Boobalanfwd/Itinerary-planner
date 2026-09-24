import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function formatGCalDate(date: Date, isAllDay = true): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  if (isAllDay) {
    return `${year}${month}${day}`;
  }
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const itinerary = await prisma.itinerary.findUnique({
      where: { id },
      include: {
        days: {
          orderBy: { dayNumber: "asc" },
          include: {
            activities: {
              orderBy: [
                { position: "asc" },
                { time: "asc" },
              ],
            },
          },
        },
      },
    });

    if (!itinerary) {
      return NextResponse.json(
        { success: false, error: "Itinerary not found" },
        { status: 404 }
      );
    }

    // Determine start and end dates
    const startDate = itinerary.startDate
      ? new Date(itinerary.startDate)
      : itinerary.days[0]?.date
      ? new Date(itinerary.days[0].date)
      : new Date();

    const endDate = itinerary.endDate
      ? new Date(itinerary.endDate)
      : new Date(startDate.getTime() + (itinerary.duration || 1) * 24 * 60 * 60 * 1000);

    // Google Calendar all-day event end date is exclusive (day after last day)
    const gcalEndDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);

    const datesParam = `${formatGCalDate(startDate, true)}/${formatGCalDate(gcalEndDate, true)}`;

    const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const tripUrl = itinerary.shareToken
      ? `${origin}/itinerary/share/${itinerary.shareToken}`
      : `${origin}/itinerary/${itinerary.id}`;

    // Build agenda text
    const agendaLines: string[] = [];
    agendaLines.push(`✈️ Trip to ${itinerary.destination} (${itinerary.duration} Days)`);
    if (itinerary.description) {
      agendaLines.push(`\n${itinerary.description}`);
    }
    agendaLines.push("\n📅 DAY-BY-DAY AGENDA:\n");

    itinerary.days.forEach((day) => {
      agendaLines.push(`\n--- Day ${day.dayNumber}: ${day.title} ---`);
      if (day.activities.length === 0) {
        agendaLines.push("  (Free exploration day)");
      } else {
        day.activities.forEach((act) => {
          const timeStr = act.time ? `[${act.time}] ` : "";
          const locStr = act.locationName ? ` (@ ${act.locationName})` : "";
          agendaLines.push(`• ${timeStr}${act.title}${locStr}`);
          if (act.description) {
            agendaLines.push(`  ${act.description}`);
          }
        });
      }
    });

    agendaLines.push(`\n\n🔗 View interactive itinerary & map:\n${tripUrl}`);

    const title = itinerary.title || `${itinerary.destination} Trip`;
    const details = agendaLines.join("\n");
    const location = itinerary.destination;

    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&dates=${datesParam}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(
      location
    )}`;

    const wantsJson = req.nextUrl.searchParams.get("json") === "1" ||
      req.headers.get("accept")?.includes("application/json");

    if (wantsJson) {
      return NextResponse.json({
        success: true,
        url: gcalUrl,
        title,
        dates: datesParam,
      });
    }

    return NextResponse.redirect(gcalUrl);
  } catch (error) {
    console.error("[gcal export error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate Google Calendar export" },
      { status: 500 }
    );
  }
}
