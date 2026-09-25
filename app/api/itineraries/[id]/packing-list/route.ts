import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import * as Sentry from "@sentry/nextjs";
import { authOptions } from "@/app/lib/auth";
import prisma from "@/lib/prisma";
import { geminiService } from "@/app/services/geminiService";
import { getForecastForDestination } from "@/lib/weather";
import { PackingList, PackingListSchema } from "@/schemas/packingList";

/**
 * GET /api/itineraries/[id]/packing-list
 * Returns cached packing list from itinerary.metadata if available.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const itinerary = await prisma.itinerary.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        isPublic: true,
        metadata: true,
      },
    });

    if (!itinerary) {
      return NextResponse.json(
        { success: false, error: "Itinerary not found" },
        { status: 404 }
      );
    }

    const metadata = (itinerary.metadata as Record<string, any>) || {};
    const packingList = metadata.packingList || null;

    return NextResponse.json({
      success: true,
      packingList,
    });
  } catch (error) {
    Sentry.captureException(error, { extra: { route: "GET /api/itineraries/[id]/packing-list" } });
    console.error("Error fetching packing list:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve packing list" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/itineraries/[id]/packing-list
 * Generates an intelligent, tailored packing checklist using Gemini AI,
 * caches it into itinerary.metadata, and returns the result.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    let currentUser: { id: string; email: string } | null = null;

    if (session?.user?.email) {
      currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, email: true },
      });
    }

    // Retrieve itinerary with days and activities to build rich contextual prompt
    const itinerary = await prisma.itinerary.findUnique({
      where: { id },
      include: {
        days: {
          include: {
            activities: {
              select: {
                title: true,
                type: true,
                notes: true,
              },
            },
          },
          orderBy: { dayNumber: "asc" },
        },
        collaborators: true,
      },
    });

    if (!itinerary) {
      return NextResponse.json(
        { success: false, error: "Itinerary not found" },
        { status: 404 }
      );
    }

    // Authorization check: allow owner, collaborator, or public/shared itinerary
    const isOwner = currentUser && itinerary.userId === currentUser.id;
    const isCollaborator = Boolean(
      currentUser &&
        itinerary.collaborators &&
        itinerary.collaborators.some((c) => c.userId === currentUser.id)
    );
    const isPublicAccess =
      itinerary.isPublic ||
      itinerary.visibility === "PUBLIC" ||
      itinerary.visibility === "SHARED";

    if (!isOwner && !isCollaborator && !isPublicAccess) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Access denied" },
        { status: 403 }
      );
    }

    // Optional query param: ?force=true to ignore cache and regenerate
    const url = new URL(req.url);
    const forceRegenerate = url.searchParams.get("force") === "true";

    const currentMetadata = (itinerary.metadata as Record<string, any>) || {};
    if (!forceRegenerate && currentMetadata.packingList) {
      return NextResponse.json({
        success: true,
        packingList: currentMetadata.packingList,
        cached: true,
      });
    }

    // Gather activities for context
    const activities: string[] = [];
    for (const day of itinerary.days) {
      for (const act of day.activities) {
        if (act.title) {
          activities.push(act.title);
        }
      }
    }

    // Fetch real-time weather summary if available
    let weatherSummary: string | null = null;
    try {
      if (itinerary.destination) {
        const forecast = await getForecastForDestination(itinerary.destination);
        if (forecast && forecast.daily && forecast.daily.length > 0) {
          const temps = forecast.daily.map((d: any) => `${d.date}: ${d.tempMax}°C / ${d.tempMin}°C, ${d.weatherDescription}`);
          weatherSummary = temps.slice(0, 5).join("; ");
        }
      }
    } catch (weatherErr) {
      console.warn("Could not fetch weather forecast for packing list:", weatherErr);
    }

    // Generate packing list via Gemini AI
    const { packingList } = await geminiService.generatePackingList({
      destination: itinerary.destination,
      duration: itinerary.duration || itinerary.days.length || 3,
      startDate: itinerary.startDate,
      endDate: itinerary.endDate,
      travelers: itinerary.travelers,
      activities,
      weatherSummary,
    });

    // Update itinerary metadata with newly generated packing list
    const updatedMetadata = {
      ...currentMetadata,
      packingList,
    };

    await prisma.itinerary.update({
      where: { id },
      data: {
        metadata: updatedMetadata,
      },
    });

    return NextResponse.json({
      success: true,
      packingList,
      cached: false,
    });
  } catch (error) {
    Sentry.captureException(error, { extra: { route: "POST /api/itineraries/[id]/packing-list" } });
    console.error("Error generating packing list:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate packing list" },
      { status: 500 }
    );
  }
}
