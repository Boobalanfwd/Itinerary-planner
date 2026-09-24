import { prisma } from "@/lib/prisma";
import type {
  ActivityType,
  ItineraryStatus,
  ItineraryVisibility,
  Prisma,
} from "@prisma/client";
import { randomBytes } from "crypto";

export interface CreateActivityInput {
  time: string;
  title: string;
  description: string;
  type: ActivityType;
  locationLat?: number | null;
  locationLng?: number | null;
  locationName?: string | null;
  address?: string | null;
  duration?: number | null;
  cost?: number | null;
  bookingUrl?: string | null;
  notes?: string | null;
  position?: number | null;
  indoor?: boolean | null;
  placeId?: string | null;
  flightInfo?: Prisma.InputJsonValue | null;
}

export interface CreateDayInput {
  dayNumber: number;
  title: string;
  date: Date;
  theme?: string | null;
  description?: string | null;
  activities: CreateActivityInput[];
}

export interface CreateItineraryInput {
  userId: string;
  title: string;
  destination: string;
  description?: string | null;
  duration: number;
  startDate?: Date | null;
  endDate?: Date | null;
  budgetAmount?: number | null;
  currency?: string;
  travelers?: string | null;
  preferences?: Prisma.InputJsonValue | null;
  tags?: string[];
  coverImage?: string | null;
  images?: string[];
  status?: ItineraryStatus;
  visibility?: ItineraryVisibility;
  days: CreateDayInput[];
}

export interface ItineraryFilterOptions {
  search?: string;
  status?: ItineraryStatus;
  visibility?: ItineraryVisibility;
  isFavorite?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "startDate" | "title";
  sortOrder?: "asc" | "desc";
}

export async function createItinerary(input: CreateItineraryInput) {
  const shareToken = randomBytes(16).toString("hex");

  return prisma.itinerary.create({
    data: {
      userId: input.userId,
      title: input.title,
      destination: input.destination,
      description: input.description,
      duration: input.duration,
      startDate: input.startDate,
      endDate: input.endDate,
      budgetAmount: input.budgetAmount,
      currency: input.currency ?? "USD",
      travelers: input.travelers,
      preferences: input.preferences ?? undefined,
      shareToken,
      tags: input.tags ?? [],
      coverImage: input.coverImage,
      images: input.images ?? [],
      status: input.status ?? "DRAFT",
      visibility: input.visibility ?? "PRIVATE",
      days: {
        create: input.days.map((day) => ({
          dayNumber: day.dayNumber,
          title: day.title,
          date: day.date,
          theme: day.theme,
          description: day.description,
          activities: {
            create: day.activities.map((act, index) => ({
              time: act.time,
              title: act.title,
              description: act.description,
              type: act.type,
              locationLat: act.locationLat,
              locationLng: act.locationLng,
              locationName: act.locationName,
              address: act.address,
              duration: act.duration,
              cost: act.cost,
              bookingUrl: act.bookingUrl,
              notes: act.notes,
              position: act.position ?? index,
              indoor: act.indoor ?? false,
              placeId: act.placeId,
              flightInfo: act.flightInfo ?? undefined,
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
            orderBy: [{ position: "asc" }, { time: "asc" }],
            include: { place: true },
          },
        },
      },
    },
  });
}

export async function getItineraryById(id: string, userId?: string) {
  const where: Prisma.ItineraryWhereInput = { id };
  if (userId) {
    where.userId = userId;
  }

  return prisma.itinerary.findFirst({
    where,
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: {
          activities: {
            orderBy: [{ position: "asc" }, { time: "asc" }],
            include: { place: true },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      budgetData: {
        include: {
          expenses: true,
        },
      },
      _count: {
        select: {
          likes: true,
          reviews: true,
        },
      },
    },
  });
}

export async function getItineraryByShareToken(shareToken: string) {
  return prisma.itinerary.findUnique({
    where: { shareToken },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: {
          activities: {
            orderBy: [{ position: "asc" }, { time: "asc" }],
            include: { place: true },
          },
        },
      },
      user: {
        select: {
          name: true,
          image: true,
        },
      },
      _count: {
        select: {
          likes: true,
        },
      },
    },
  });
}

export async function getUserItineraries(
  userId: string,
  options: ItineraryFilterOptions = {}
) {
  const {
    search,
    status,
    visibility,
    isFavorite,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = options;

  const where: Prisma.ItineraryWhereInput = {
    userId,
    ...(status && { status }),
    ...(visibility && { visibility }),
    ...(isFavorite !== undefined && { isFavorite }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { destination: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const skip = (page - 1) * limit;

  const [itineraries, total] = await Promise.all([
    prisma.itinerary.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        days: {
          select: {
            id: true,
            dayNumber: true,
            title: true,
            theme: true,
            _count: {
              select: { activities: true },
            },
          },
          orderBy: { dayNumber: "asc" },
        },
        _count: {
          select: {
            likes: true,
            savedBy: true,
          },
        },
      },
    }),
    prisma.itinerary.count({ where }),
  ]);

  return {
    itineraries,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateItinerary(
  id: string,
  userId: string,
  data: Prisma.ItineraryUpdateInput
) {
  return prisma.itinerary.update({
    where: {
      id,
      userId,
    },
    data,
  });
}

export async function deleteItinerary(id: string, userId: string) {
  return prisma.itinerary.delete({
    where: {
      id,
      userId,
    },
  });
}

export async function toggleItineraryFavorite(id: string, userId: string) {
  const existing = await prisma.itinerary.findFirst({
    where: { id, userId },
    select: { isFavorite: true },
  });

  if (!existing) {
    throw new Error("Itinerary not found");
  }

  return prisma.itinerary.update({
    where: { id },
    data: { isFavorite: !existing.isFavorite },
  });
}

export async function ensureShareToken(id: string, userId: string) {
  const existing = await prisma.itinerary.findFirst({
    where: { id, userId },
    select: { shareToken: true },
  });

  if (!existing) {
    throw new Error("Itinerary not found");
  }

  if (existing.shareToken) {
    return existing.shareToken;
  }

  const newToken = randomBytes(16).toString("hex");
  const updated = await prisma.itinerary.update({
    where: { id },
    data: { shareToken: newToken },
    select: { shareToken: true },
  });

  return updated.shareToken!;
}
