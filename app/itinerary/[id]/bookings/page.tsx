import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import BookingClient from "./BookingClient";
import { ItineraryViewWrapper } from "../ItineraryViewWrapper";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BookingPage({ params }: PageProps) {
  const { id } = await params;

  const itinerary = await prisma.itinerary.findUnique({
    where: { id },
    select: {
      id: true,
      destination: true,
      startDate: true,
      endDate: true,
      days: {
        include: { activities: true },
      },
      // Fetch minimal fields needed for wrapper
      title: true,
      duration: true,
      budgetAmount: true,
      description: true,
      images: true,
      tags: true,
    },
  });

  if (!itinerary) notFound();

  // Filter flights for the client
  const flights = itinerary.days.flatMap((d) =>
    d.activities.filter((a) => a.type === "FLIGHT")
  );

  // Prepare data for Wrapper (simplified for this view if needed, or fully mapped)
  const itineraryData = {
    id: itinerary.id,
    destination: itinerary.destination,
    duration: itinerary.duration,
    budget: itinerary.budgetAmount || 0,
    totalBudget: itinerary.budgetAmount || undefined,
    title: itinerary.title || undefined,
    description: itinerary.description || undefined,
    image: itinerary.images?.[0] || undefined,
    startDate: itinerary.startDate?.toISOString() || undefined,
    endDate: itinerary.endDate?.toISOString() || undefined,
    tags: itinerary.tags || [],
    days: [], // We don't render days in booking view, so empty is fine for wrapper context if it uses it for basic info
  };

  return (
    <ItineraryViewWrapper data={itineraryData as any}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Manage Bookings</h1>
        <BookingClient
          initialFlights={flights as any[]}
          destination={itinerary.destination}
          startDate={itinerary.startDate?.toISOString()}
          endDate={itinerary.endDate?.toISOString()}
        />
      </div>
    </ItineraryViewWrapper>
  );
}
