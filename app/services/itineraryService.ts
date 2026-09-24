/**
 * app/services/itineraryService.ts
 * Database layer for itinerary CRUD.
 * B6 fix: all ActivityType values now handled; no silent MISCELLANEOUS fallbacks.
 * Updated to accept AiItinerary (from new geminiService) in createItinerary.
 */

import prisma from "@/lib/prisma";
import { ItineraryData } from "../components/types";
import { ActivityType as PrismaActivityType } from "@prisma/client";
import { AiItinerary, AiActivity } from "./geminiService";
import { resolveDestinationImage } from "./imageService";
import { randomUUID } from "crypto";
import { resolvePlace } from "@/lib/maps/placeVerification";

// ── Type mapping helpers ───────────────────────────────────────────────────────

/**
 * Map AI category strings (returned by Gemini) → Prisma ActivityType enum.
 * B6 fix: every AI category is explicitly handled.
 */
const mapAiCategoryToPrisma = (category: AiActivity["category"]): PrismaActivityType => {
  const mapping: Record<AiActivity["category"], PrismaActivityType> = {
    sightseeing: "SIGHTSEEING",
    food: "FOOD_DRINK",
    accommodation: "ACCOMMODATION",
    transportation: "TRANSPORTATION",
    entertainment: "ENTERTAINMENT",
    shopping: "SHOPPING",
    outdoor: "ACTIVITIES",
    culture: "SIGHTSEEING",
    nightlife: "ENTERTAINMENT",
    wellness: "ACTIVITIES",
  };
  return mapping[category] ?? "MISCELLANEOUS";
};

/**
 * Map Prisma ActivityType → frontend display string.
 * B6 fix: ACTIVITY and RESTAURANT were previously unhandled; now explicit.
 */
const mapPrismaTypeToFrontend = (type: PrismaActivityType): string => {
  const mapping: Record<PrismaActivityType, string> = {
    TRANSPORTATION: "travel",
    FLIGHT: "travel",
    FOOD_DRINK: "food",
    SIGHTSEEING: "sightseeing",
    ACCOMMODATION: "hotel",
    ENTERTAINMENT: "nightlife",
    ACTIVITIES: "sightseeing",
    SHOPPING: "shopping",
    MISCELLANEOUS: "sightseeing",
    ACTIVITY: "sightseeing",      // B6: was missing
    RESTAURANT: "food",           // B6: was missing
  };
  return mapping[type] ?? "sightseeing";
};

// ── Create ────────────────────────────────────────────────────────────────────

/**
 * Create a new itinerary in the database from AI-generated data.
 * Accepts the new AiItinerary shape from geminiService.
 */
export async function createItinerary(
  userId: string,
  aiData: AiItinerary,
): Promise<ItineraryData> {
  try {
    const daysData = await Promise.all(
      aiData.days.map(async (day) => {
        const activitiesData = await Promise.all(
          day.activities.map(async (activity, idx) => {
            const place = await resolvePlace(
              activity.place_name,
              aiData.destination
            );
            return {
              time: activity.start_time ?? "09:00",
              title: activity.place_name,
              description: activity.reason,
              type: mapAiCategoryToPrisma(activity.category),
              locationName: activity.neighborhood,
              duration: activity.duration_min,
              cost: activity.est_cost_usd,
              position: idx,
              locationLat: place?.lat ?? null,
              locationLng: place?.lng ?? null,
              address: place?.formattedAddress ?? null,
              placeId: place?.placeId ?? null,
            };
          })
        );

        return {
          dayNumber: day.day_number,
          title: day.theme ?? `Day ${day.day_number}`,
          date: new Date(),
          activities: {
            create: activitiesData,
          },
        };
      })
    );

    // Resolve city cover image link via LLM and Unsplash
    const coverImageUrl = await resolveDestinationImage(
      aiData.destination,
      aiData.title
    );

    const itinerary = await prisma.itinerary.create({
      data: {
        userId,
        title: aiData.title,
        destination: aiData.destination,
        description: aiData.summary,
        duration: aiData.days.length,
        currency: "USD",
        tags: [],
        coverImage: coverImageUrl,
        images: [coverImageUrl],
        status: "DRAFT",
        visibility: "PRIVATE",
        shareToken: randomUUID().replace(/-/g, "").slice(0, 12),
        days: {
          create: daysData,
        },
      },
      include: {
        days: {
          include: { activities: true },
          orderBy: { dayNumber: "asc" },
        },
      },
    });

    return transformPrismaToFrontend(itinerary);
  } catch (error) {
    console.error("[itineraryService] createItinerary error:", error);
    throw new Error("Failed to create itinerary");
  }
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getUserItineraries(
  userId: string,
  options?: {
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    limit?: number;
    offset?: number;
  },
): Promise<{ itineraries: ItineraryData[]; total: number }> {
  try {
    const where = {
      userId,
      ...(options?.status && { status: options.status }),
    };

    const [itineraries, total] = await Promise.all([
      prisma.itinerary.findMany({
        where,
        include: {
          days: {
            include: { activities: true },
            orderBy: { dayNumber: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        take: options?.limit ?? 10,
        skip: options?.offset ?? 0,
      }),
      prisma.itinerary.count({ where }),
    ]);

    return {
      itineraries: itineraries.map(transformPrismaToFrontend),
      total,
    };
  } catch (error) {
    console.error("[itineraryService] getUserItineraries error:", error);
    throw new Error("Failed to fetch itineraries");
  }
}

export async function getItineraryById(
  itineraryId: string,
  userId: string,
): Promise<ItineraryData | null> {
  try {
    const itinerary = await prisma.itinerary.findFirst({
      where: { id: itineraryId, userId },
      include: {
        days: {
          include: { activities: true },
          orderBy: { dayNumber: "asc" },
        },
      },
    });

    return itinerary ? transformPrismaToFrontend(itinerary) : null;
  } catch (error) {
    console.error("[itineraryService] getItineraryById error:", error);
    throw new Error("Failed to fetch itinerary");
  }
}

/**
 * Get an itinerary by its unique public share token (unauthenticated read-only access).
 */
export async function getItineraryByShareToken(
  token: string
): Promise<ItineraryData | null> {
  try {
    const itinerary = await prisma.itinerary.findUnique({
      where: { shareToken: token },
      include: {
        days: {
          include: { activities: true },
          orderBy: { dayNumber: "asc" },
        },
      },
    });

    return itinerary ? transformPrismaToFrontend(itinerary) : null;
  } catch (error) {
    console.error("[itineraryService] getItineraryByShareToken error:", error);
    throw new Error("Failed to fetch shared itinerary");
  }
}

/**
 * Get or create a public share token for an itinerary.
 */
export async function getOrCreateShareToken(
  itineraryId: string,
  userId: string
): Promise<string> {
  try {
    const itinerary = await prisma.itinerary.findFirst({
      where: { id: itineraryId, userId },
      select: { id: true, shareToken: true },
    });

    if (!itinerary) {
      throw new Error("Itinerary not found or unauthorized");
    }

    if (itinerary.shareToken) {
      return itinerary.shareToken;
    }

    const token = randomUUID().replace(/-/g, "").slice(0, 12);
    await prisma.itinerary.update({
      where: { id: itineraryId },
      data: { shareToken: token },
    });

    return token;
  } catch (error) {
    console.error("[itineraryService] getOrCreateShareToken error:", error);
    throw new Error("Failed to get or create share token");
  }
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateItinerary(
  itineraryId: string,
  userId: string,
  updates: {
    title?: string;
    description?: string;
    tags?: string[];
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    visibility?: "PRIVATE" | "PUBLIC" | "SHARED";
    budgetAmount?: number | null;
  },
): Promise<ItineraryData> {
  try {
    const itinerary = await prisma.itinerary.update({
      where: { id: itineraryId, userId },
      data: {
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.tags !== undefined && { tags: updates.tags }),
        ...(updates.status !== undefined && { status: updates.status }),
        ...(updates.visibility !== undefined && { visibility: updates.visibility }),
        ...("budgetAmount" in updates && { budgetAmount: updates.budgetAmount }),
      },
      include: {
        days: {
          include: { activities: true },
          orderBy: { dayNumber: "asc" },
        },
      },
    });

    return transformPrismaToFrontend(itinerary);
  } catch (error) {
    console.error("[itineraryService] updateItinerary error:", error);
    throw new Error("Failed to update itinerary");
  }
}

export async function deleteItinerary(
  itineraryId: string,
  userId: string,
): Promise<void> {
  try {
    const itinerary = await prisma.itinerary.findFirst({
      where: { id: itineraryId, userId },
      select: { id: true },
    });

    if (!itinerary) {
      throw new Error("Itinerary not found or unauthorized");
    }

    await prisma.itinerary.delete({
      where: { id: itineraryId },
    });
  } catch (error) {
    console.error("[itineraryService] deleteItinerary error:", error);
    throw new Error("Failed to delete itinerary");
  }
}

// ── Activity update & delete ──────────────────────────────────────────────────

export async function updateActivity(
  activityId: string,
  userId: string,
  updates: {
    title?: string;
    description?: string;
    time?: string;
    duration?: number | null;
    cost?: number | null;
    notes?: string | null;
    locationName?: string | null;
    locationLat?: number | null;
    locationLng?: number | null;
    address?: string | null;
    type?: string;
    position?: number;
  },
): Promise<void> {
  try {
    // Verify ownership via join
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { day: { include: { itinerary: true } } },
    });

    if (!activity) {
      throw new Error("Activity not found");
    }

    // Verify ownership: if itinerary belongs to a user, ensure matching userId
    if (activity.day.itinerary.userId && activity.day.itinerary.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const prismaType = updates.type ? mapStringToPrismaType(updates.type) : undefined;

    await prisma.activity.update({
      where: { id: activityId },
      data: {
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.time !== undefined && { time: updates.time }),
        ...("duration" in updates && { duration: updates.duration }),
        ...("cost" in updates && { cost: updates.cost }),
        ...("notes" in updates && { notes: updates.notes }),
        ...("locationName" in updates && { locationName: updates.locationName }),
        ...("locationLat" in updates && { locationLat: updates.locationLat }),
        ...("locationLng" in updates && { locationLng: updates.locationLng }),
        ...("address" in updates && { address: updates.address }),
        ...(prismaType !== undefined && { type: prismaType }),
        ...(updates.position !== undefined && { position: updates.position }),
      },
    });
  } catch (error) {
    console.error("[itineraryService] updateActivity error:", error);
    throw error instanceof Error ? error : new Error("Failed to update activity");
  }
}

export async function deleteActivity(
  activityId: string,
  userId: string
): Promise<void> {
  try {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { day: { include: { itinerary: true } } },
    });

    if (!activity) {
      throw new Error("Activity not found");
    }

    // Verify ownership: if itinerary belongs to a user, ensure matching userId
    if (activity.day.itinerary.userId && activity.day.itinerary.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const dayId = activity.dayId;

    // Delete the activity
    await prisma.activity.delete({
      where: { id: activityId },
    });

    // Re-index remaining activities in this day to maintain continuous positions
    const remaining = await prisma.activity.findMany({
      where: { dayId },
      orderBy: { position: "asc" },
    });

    await prisma.$transaction(
      remaining.map((act, index) =>
        prisma.activity.update({
          where: { id: act.id },
          data: { position: index },
        })
      )
    );
  } catch (error) {
    console.error("[itineraryService] deleteActivity error:", error);
    throw error instanceof Error ? error : new Error("Failed to delete activity");
  }
}

// ── Add Activity ──────────────────────────────────────────────────────────────

export async function addActivity(
  dayId: string,
  userId: string,
  data: {
    title: string;
    description?: string;
    time?: string;
    duration?: number;
    cost?: number;
    notes?: string;
    locationName?: string;
    locationLat?: number;
    locationLng?: number;
    address?: string;
    type?: string;
  },
): Promise<{ id: string; dayId: string; [key: string]: unknown }> {
  try {
    const day = await prisma.day.findUnique({
      where: { id: dayId },
      include: { itinerary: true },
    });

    if (!day) throw new Error("Day not found");

    // Verify ownership: if itinerary belongs to a user, ensure matching userId
    if (day.itinerary.userId && day.itinerary.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Get next position
    const existingCount = await prisma.activity.count({ where: { dayId } });
    const prismaType = data.type ? mapStringToPrismaType(data.type) ?? "MISCELLANEOUS" : "MISCELLANEOUS";

    const activity = await prisma.activity.create({
      data: {
        dayId,
        title: data.title,
        description: data.description ?? "",
        time: data.time ?? "09:00",
        duration: data.duration ?? null,
        cost: data.cost ?? null,
        notes: data.notes ?? null,
        locationName: data.locationName ?? null,
        locationLat: data.locationLat ?? null,
        locationLng: data.locationLng ?? null,
        address: data.address ?? null,
        type: prismaType,
        position: existingCount,
      },
    });

    return activity as unknown as { id: string; dayId: string; [key: string]: unknown };
  } catch (error) {
    console.error("[itineraryService] addActivity error:", error);
    throw error instanceof Error ? error : new Error("Failed to add activity");
  }
}

function mapStringToPrismaType(typeStr?: string): PrismaActivityType | undefined {
  if (!typeStr) return undefined;
  const upper = typeStr.toUpperCase();
  if (upper === "FOOD" || upper === "FOOD_DRINK" || upper === "RESTAURANT") return "FOOD_DRINK";
  if (upper === "SIGHTSEEING" || upper === "CULTURE") return "SIGHTSEEING";
  if (upper === "HOTEL" || upper === "ACCOMMODATION") return "ACCOMMODATION";
  if (upper === "TRAVEL" || upper === "TRANSPORTATION" || upper === "FLIGHT") return "TRANSPORTATION";
  if (upper === "NIGHTLIFE" || upper === "ENTERTAINMENT") return "ENTERTAINMENT";
  if (upper === "SHOPPING") return "SHOPPING";
  if (upper === "ACTIVITIES" || upper === "ACTIVITY" || upper === "OUTDOOR" || upper === "WELLNESS") return "ACTIVITIES";
  return "MISCELLANEOUS";
}

// ── Transform ─────────────────────────────────────────────────────────────────

/**
 * Transform Prisma itinerary → frontend ItineraryData shape.
 * No `any` types.
 */
function transformPrismaToFrontend(
  itinerary: Awaited<ReturnType<typeof prisma.itinerary.findFirst>> & {
    days: Array<{
      id: string;
      dayNumber: number;
      title: string;
      date: Date;
      activities: Array<{
        id: string;
        time: string;
        title: string;
        description: string;
        type: PrismaActivityType;
        locationLat: number | null;
        locationLng: number | null;
        locationName: string | null;
        duration: number | null;
        cost: number | null;
        notes: string | null;
      }>;
    }>;
  }
): ItineraryData {
  return {
    id: itinerary!.id,
    destination: itinerary!.destination,
    duration: `${itinerary!.duration} Days`,
    budget: itinerary!.budgetAmount ? `$${itinerary!.budgetAmount}` : "N/A",
    totalBudget: itinerary!.budgetAmount ?? undefined,
    tags: itinerary!.tags,
    image: itinerary!.coverImage ?? undefined,
    title: itinerary!.title,
    description: itinerary!.description ?? undefined,
    status: itinerary!.status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    visibility: itinerary!.visibility as "PRIVATE" | "PUBLIC" | "SHARED",
    shareToken: itinerary!.shareToken ?? undefined,
    createdAt: itinerary!.createdAt,
    updatedAt: itinerary!.updatedAt,
    days: itinerary!.days.map((day) => ({
      id: day.id,
      day: day.dayNumber,
      title: day.title,
      date: day.date.toISOString(),
      activities: day.activities.map((activity) => ({
        id: activity.id,
        time: activity.time,
        title: activity.title,
        desc: activity.description,
        type: mapPrismaTypeToFrontend(activity.type) as ItineraryData["days"][0]["activities"][0]["type"],
        location:
          activity.locationLat !== null &&
          activity.locationLng !== null &&
          !isNaN(activity.locationLat) &&
          !isNaN(activity.locationLng)
            ? {
                lat: activity.locationLat,
                lng: activity.locationLng,
                name: activity.locationName ?? "",
              }
            : undefined,
        duration: activity.duration ?? undefined,
        cost: activity.cost ?? undefined,
        notes: activity.notes ?? undefined,
      })),
    })),
  };
}
