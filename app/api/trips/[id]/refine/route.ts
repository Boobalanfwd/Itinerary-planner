import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { geminiService, AiItinerary } from "@/app/services/geminiService";
import { getItineraryById } from "@/lib/repositories/itineraryRepository";
import { TripRefineSchema } from "@/schemas/trip";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function mapCategoryToPrisma(cat: string) {
  const upper = (cat || "").toUpperCase();
  if (upper === "FOOD" || upper === "FOOD_DRINK" || upper === "RESTAURANT") return "FOOD_DRINK";
  if (upper === "SIGHTSEEING" || upper === "CULTURE") return "SIGHTSEEING";
  if (upper === "HOTEL" || upper === "ACCOMMODATION") return "ACCOMMODATION";
  if (upper === "TRAVEL" || upper === "TRANSPORTATION" || upper === "TRANSIT" || upper === "FLIGHT") return "TRANSPORTATION";
  if (upper === "NIGHTLIFE" || upper === "ENTERTAINMENT") return "ENTERTAINMENT";
  if (upper === "SHOPPING") return "SHOPPING";
  if (upper === "ACTIVITIES" || upper === "ACTIVITY" || upper === "OUTDOOR" || upper === "WELLNESS") return "ACTIVITIES";
  return "MISCELLANEOUS";
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const parseResult = TripRefineSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues.map((i) => i.message).join(", "),
        },
        { status: 400 }
      );
    }

    const { instruction } = parseResult.data;

    // Fetch existing itinerary with relations
    const existing = await getItineraryById(id, user.id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Itinerary not found or unauthorized" },
        { status: 404 }
      );
    }

    // Convert database structure to AiItinerary schema
    const currentAiItinerary: AiItinerary = {
      title: existing.title,
      destination: existing.destination,
      summary: existing.description || undefined,
      days: existing.days.map((d) => ({
        day_number: d.dayNumber,
        theme: d.theme || undefined,
        activities: d.activities.map((a) => ({
          place_name: a.title,
          neighborhood: a.locationName || undefined,
          category: (a.type.toLowerCase() as any) || "sightseeing",
          start_time: a.time,
          duration_min: a.duration || undefined,
          est_cost_usd: a.cost || undefined,
          indoor: a.indoor || false,
          reason: a.description,
        })),
      })),
    };

    // Run refinement via Gemini AI
    const { itinerary: refined } = await geminiService.refineItinerary(
      currentAiItinerary,
      instruction
    );

    // Transaction to update the days and activities
    const updated = await prisma.$transaction(async (tx) => {
      // Remove old days (which cascade deletes activities)
      await tx.day.deleteMany({
        where: { itineraryId: id },
      });

      // Insert refined days
      const updatedItinerary = await tx.itinerary.update({
        where: { id },
        data: {
          title: refined.title,
          description: refined.summary,
          duration: refined.days.length,
          days: {
            create: refined.days.map((day) => ({
              dayNumber: day.day_number,
              title: day.theme || `Day ${day.day_number}`,
              theme: day.theme,
              date: new Date(Date.now() + (day.day_number - 1) * 86400000),
              activities: {
                create: day.activities.map((act, idx) => ({
                  title: act.place_name,
                  description: act.reason,
                  time: act.start_time || `${9 + idx * 2}:00`,
                  type: mapCategoryToPrisma(act.category),
                  locationName: act.neighborhood || act.place_name,
                  duration: act.duration_min,
                  cost: act.est_cost_usd,
                  indoor: act.indoor || false,
                  position: idx,
                })),
              },
            })),
          },
        },
        include: {
          days: {
            orderBy: { dayNumber: "asc" },
            include: {
              activities: {
                orderBy: { position: "asc" },
              },
            },
          },
        },
      });

      return updatedItinerary;
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error("[trip-refine] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to refine itinerary",
      },
      { status: 500 }
    );
  }
}
