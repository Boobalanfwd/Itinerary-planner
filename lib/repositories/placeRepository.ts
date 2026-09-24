import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface UpsertPlaceInput {
  name: string;
  formattedAddress?: string | null;
  lat: number;
  lng: number;
  category?: string | null;
  placeId?: string | null;
  metadata?: Prisma.InputJsonValue | null;
  /** Destination/region this place belongs to — used to avoid cross-destination cache collisions */
  destination?: string | null;
}

export async function getPlaceById(id: string) {
  return prisma.place.findUnique({
    where: { id },
  });
}

export async function getPlaceByPlaceId(placeId: string) {
  return prisma.place.findUnique({
    where: { placeId },
  });
}

/**
 * Find a place by name, optionally scoped to a destination to avoid cross-country collisions.
 *
 * WHY: Generic activity names like "Sunset Beach", "Airport Transfer", "Snorkeling Spot"
 * appear in many destinations. Without destination scoping, a cached result for
 * "Sunset Beach, Goa" would be reused for "Sunset Beach, Maldives" — placing the pin
 * in the wrong country.
 */
export async function findPlaceByName(name: string, destination?: string | null) {
  if (destination) {
    // 1. Check candidate parts for compound destinations (e.g. "Rome and Vatican City" -> check "Rome", then "Vatican City")
    const parts = destination
      .split(/,|\band\b|&|\//gi)
      .map((p) => p.trim())
      .filter((p) => p.length >= 2);

    for (const part of parts) {
      const partMatch = await prisma.place.findFirst({
        where: {
          name: { contains: name, mode: "insensitive" },
          formattedAddress: {
            contains: part,
            mode: "insensitive",
          },
        },
      });
      if (partMatch) return partMatch;
    }

    // 2. Strict match with full destination string
    const exactMatch = await prisma.place.findFirst({
      where: {
        name: { contains: name, mode: "insensitive" },
        formattedAddress: {
          contains: destination,
          mode: "insensitive",
        },
      },
    });
    if (exactMatch) return exactMatch;

    // 3. No match scoped to this destination — return null to force fresh geocoding
    return null;
  }

  // No destination provided — fall back to name-only search (legacy behavior)
  return prisma.place.findFirst({
    where: {
      name: {
        contains: name,
        mode: "insensitive",
      },
    },
  });
}

export async function upsertPlace(data: UpsertPlaceInput) {
  if (data.placeId) {
    return prisma.place.upsert({
      where: { placeId: data.placeId },
      update: {
        name: data.name,
        formattedAddress: data.formattedAddress,
        lat: data.lat,
        lng: data.lng,
        category: data.category,
        metadata: data.metadata ?? undefined,
      },
      create: {
        name: data.name,
        formattedAddress: data.formattedAddress,
        lat: data.lat,
        lng: data.lng,
        category: data.category,
        placeId: data.placeId,
        metadata: data.metadata ?? undefined,
      },
    });
  }

  // If no external placeId, find by approximate name match or create new
  const existing = await findPlaceByName(data.name);
  if (existing) {
    return prisma.place.update({
      where: { id: existing.id },
      data: {
        formattedAddress: data.formattedAddress ?? existing.formattedAddress,
        lat: data.lat,
        lng: data.lng,
        category: data.category ?? existing.category,
      },
    });
  }

  return prisma.place.create({
    data: {
      name: data.name,
      formattedAddress: data.formattedAddress,
      lat: data.lat,
      lng: data.lng,
      category: data.category,
      metadata: data.metadata ?? undefined,
    },
  });
}
