import { prisma } from "@/lib/prisma";
import type { User, UserProfile } from "@prisma/client";

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      userPreferences: true,
    },
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: {
      profile: true,
      userPreferences: true,
    },
  });
}

export async function updateUserProfile(
  id: string,
  data: {
    name?: string;
    bio?: string;
    location?: string;
    image?: string;
    phoneNumber?: string;
  }
) {
  return prisma.user.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.image !== undefined && { image: data.image }),
      ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber }),
    },
  });
}

export async function getUserDashboardStats(userId: string) {
  const [totalTrips, favoritesCount, savedCount, upcomingTrips] =
    await Promise.all([
      prisma.itinerary.count({ where: { userId } }),
      prisma.itinerary.count({ where: { userId, isFavorite: true } }),
      prisma.savedItinerary.count({ where: { userId } }),
      prisma.itinerary.count({
        where: {
          userId,
          startDate: { gte: new Date() },
        },
      }),
    ]);

  return {
    totalTrips,
    favoritesCount,
    savedCount,
    upcomingTrips,
  };
}
