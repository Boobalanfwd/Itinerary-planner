import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { PublicShareViewWrapper } from "./PublicShareViewWrapper";
import { Metadata } from "next";
import { ItineraryData } from "@/app/components/types";

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const itinerary = await prisma.itinerary.findFirst({
    where: {
      OR: [{ shareToken: token }, { id: token }],
    },
    select: {
      title: true,
      destination: true,
      description: true,
      coverImage: true,
    },
  });

  if (!itinerary) {
    return {
      title: "Shared Itinerary | AI Itinerary Planner",
    };
  }

  const title = itinerary.title || `${itinerary.destination} Itinerary`;
  return {
    title: `${title} - Shared Trip`,
    description: itinerary.description || `Explore this custom travel itinerary for ${itinerary.destination}.`,
    openGraph: {
      title: `${title} - Shared Trip`,
      description: itinerary.description || `Explore this custom travel itinerary for ${itinerary.destination}.`,
      images: itinerary.coverImage ? [itinerary.coverImage] : [],
    },
  };
}

export default async function SharedItineraryPage({ params }: PageProps) {
  const { token } = await params;

  const itinerary = await prisma.itinerary.findFirst({
    where: {
      OR: [{ shareToken: token }, { id: token }],
    },
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
    notFound();
  }

  // Cover image fallback
  const coverImage = itinerary.coverImage || itinerary.images?.[0] || undefined;

  // Transform data for frontend
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
    shareToken: itinerary.shareToken || undefined,
    tags: itinerary.tags || [],
    days: itinerary.days.map((day) => ({
      id: day.id,
      day: day.dayNumber,
      dayNumber: day.dayNumber,
      title: day.title,
      theme: day.theme || undefined,
      date: day.date ? (typeof day.date === "string" ? day.date : day.date.toISOString()) : new Date().toISOString(),
      description: day.description || undefined,
      activities: day.activities.map((activity, actIdx) => ({
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
        flightInfo: (activity.flightInfo as any) || undefined,
      })) || [],
    })) || [],
  };

  return <PublicShareViewWrapper data={itineraryData as unknown as ItineraryData} />;
}
