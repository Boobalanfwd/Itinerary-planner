import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { geminiService } from "@/app/services/geminiService";
import { DayRegenerateSchema } from "@/schemas/trip";
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
    const body = await req.json().catch(() => ({}));
    const parseResult = DayRegenerateSchema.safeParse(body);
    const preferences = parseResult.success ? parseResult.data.preferences : undefined;

    // Load the target day with its parent itinerary
    const day = await prisma.day.findUnique({
      where: { id },
      include: {
        itinerary: {
          select: {
            userId: true,
            destination: true,
          },
        },
      },
    });

    if (!day) {
      return NextResponse.json(
        { success: false, error: "Day not found" },
        { status: 404 }
      );
    }

    if (day.itinerary.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Call Gemini to regenerate single day
    const { day: newDayData } = await geminiService.regenerateDay(
      day.dayNumber,
      day.itinerary.destination,
      day.theme || undefined,
      preferences
    );

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

    // Update in transaction: replace activities and update theme
    const updatedDay = await prisma.$transaction(async (tx) => {
      await tx.activity.deleteMany({
        where: { dayId: id },
      });

      await tx.activity.createMany({
        data: newDayData.activities.map((act, idx) => ({
          dayId: id,
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
      });

      return tx.day.update({
        where: { id },
        data: {
          theme: newDayData.theme || day.theme,
          title: newDayData.theme || day.title,
        },
        include: {
          activities: {
            orderBy: { position: "asc" },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: updatedDay,
    });
  } catch (error: any) {
    console.error("[day-regenerate] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to regenerate day",
      },
      { status: 500 }
    );
  }
}
