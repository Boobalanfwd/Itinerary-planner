import { notFound } from "next/navigation";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { ItineraryViewWrapper } from "./ItineraryViewWrapper";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const itinerary = await prisma.itinerary.findUnique({
    where: { id },
    select: { title: true, destination: true, description: true, duration: true },
  });

  if (!itinerary) {
    return { title: "Itinerary Not Found" };
  }

  const title = itinerary.title || `${itinerary.destination} Itinerary`;
  const description =
    itinerary.description ||
    `Explore a ${itinerary.duration}-day AI-generated itinerary for ${itinerary.destination}.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Wander.AI`,
      description,
      type: "article",
    },
  };
}

async function getItinerary(id: string) {
  try {
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

    return itinerary;
  } catch (error) {
    console.error(`Error fetching itinerary ${id}:`, error);
    return null;
  }
}

export default async function ItineraryPage({ params }: PageProps) {
  const { id } = await params;

  console.log("Fetching itinerary for ID:", id);
  let itinerary = await getItinerary(id);

  if (!itinerary) {
    notFound();
  }

  // Auto-heal: Check if any activity has missing or out-of-region coordinates
  try {
    const { getDestinationCoords, resolveDestinationCoords, getDistanceKm } =
      await import("@/lib/country-code");
    const staticCenter = getDestinationCoords(itinerary.destination);
    const destCenter = staticCenter.isFallback
      ? await resolveDestinationCoords(itinerary.destination)
      : staticCenter;

    const needsHealing = itinerary.days?.some((day: any) =>
      day.activities?.some((act: any) => {
        if (act.locationLat === null || act.locationLng === null) {
          return true;
        }
        if (
          destCenter &&
          !destCenter.isFallback &&
          (destCenter.lat !== 20.0 || destCenter.lng !== 0.0)
        ) {
          return (
            getDistanceKm(act.locationLat, act.locationLng, destCenter.lat, destCenter.lng) >
            120
          );
        }
        return false;
      })
    );

    if (needsHealing) {
      console.info(
        `[ItineraryPage] Detected missing or out-of-region coordinates in trip ${itinerary.id} — running auto-heal`
      );
      const { verifyAndEnrichItinerary } = await import("@/lib/maps/placeVerification");
      await verifyAndEnrichItinerary(itinerary.id);
      const refreshed = await getItinerary(id);
      if (refreshed) {
        itinerary = refreshed;
      }
    }
  } catch (healErr) {
    console.warn("[ItineraryPage] Auto-heal check notice:", healErr);
  }

  // Ensure destination cover image exists in DB, or generate with LLM and persist
  let coverImage = itinerary.coverImage || itinerary.images?.[0] || undefined;
  if (!coverImage) {
    try {
      const { generateAndPersistCoverImage } = await import("@/app/services/imageService");
      coverImage = await generateAndPersistCoverImage(
        itinerary.id,
        itinerary.destination,
        itinerary.title
      );
    } catch (err) {
      console.warn("Could not auto-generate cover image:", err);
    }
  }

  // Transform the data to match the ItineraryData type
  const itineraryData = {
    id: itinerary.id,
    destination: itinerary.destination,
    duration: itinerary.duration,
    budget: itinerary.budgetAmount || 0,
    totalBudget: itinerary.budgetAmount || undefined,
    title: itinerary.title || undefined,
    description: itinerary.description || undefined,
    image: coverImage,
    startDate: itinerary.startDate?.toISOString() || undefined,
    endDate: itinerary.endDate?.toISOString() || undefined,
    tags: itinerary.tags || [],
    days:
      (itinerary as any).days?.map((day: any) => ({
        id: day.id,
        day: day.dayNumber,
        dayNumber: day.dayNumber,
        title: day.title,
        theme: day.theme || undefined,
        date: day.date ? (typeof day.date === "string" ? day.date : day.date.toISOString()) : new Date().toISOString(),
        description: day.description || undefined,
        activities:
          day.activities?.map((activity: any, actIdx: number) => ({
            id: activity.id,
            time: activity.time,
            title: activity.title,
            description: activity.description,
            desc: activity.description,
            type: activity.type,
            location:
              activity.locationLat !== null && activity.locationLng !== null
                ? {
                    name: activity.locationName || activity.title,
                    lat: Number(activity.locationLat),
                    lng: Number(activity.locationLng),
                  }
                : undefined,
            locationName: activity.locationName || undefined,
            locationLat: activity.locationLat || undefined,
            locationLng: activity.locationLng || undefined,
            address: activity.address || undefined,
            duration: activity.duration || undefined,
            cost: activity.cost || undefined,
            bookingUrl: activity.bookingUrl || undefined,
            notes: activity.notes || undefined,
            position:
              typeof activity.position === "number" && !isNaN(activity.position)
                ? activity.position
                : actIdx,
            flightInfo: activity.flightInfo || undefined,
          })) || [],
      })) || [],
  };

  return <ItineraryViewWrapper data={itineraryData} />;
}
