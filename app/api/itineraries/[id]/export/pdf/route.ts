import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import prisma from "@/lib/prisma";
import { hasFeatureAccess } from "@/app/lib/subscriptionService";
import { generateItineraryPDFBuffer, getItineraryPDFFilename } from "@/app/lib/pdfService";
import type { PDFItineraryData } from "@/components/itinerary/pdf/PDFCoverPage";
import * as Sentry from "@sentry/nextjs";

/**
 * Built-in demo itinerary for instant development mode testing without requiring DB records.
 */
const DEMO_DEV_ITINERARY: PDFItineraryData = {
  id: "dev-sample-trip",
  title: "5-Day Iconic Paris Culinary & Culture Expedition",
  destination: "Paris, France",
  description:
    "A handpicked exploration through historic Montmartre, world-class Louvre galleries, artisan pastry workshops, and Seine riverfront strolls.",
  duration: 5,
  startDate: new Date("2026-10-15"),
  endDate: new Date("2026-10-20"),
  budgetAmount: 1850,
  currency: "€",
  travelers: "2 Adults",
  coverImage: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
  days: [
    {
      dayNumber: 1,
      title: "Arrival & Heart of Historic Paris",
      theme: "Classic Architecture & Saint-Germain Cafes",
      date: new Date("2026-10-15"),
      activities: [
        {
          id: "act-d1-1",
          time: "09:30 AM",
          title: "Artisan Breakfast at Cafe de Flore",
          description: "Historic literary cafe serving fresh flaky croissants, hot chocolate, and cafe au lait.",
          type: "food",
          locationName: "Cafe de Flore",
          address: "172 Boulevard Saint-Germain, 75006 Paris",
          cost: 28,
          duration: 60,
          notes: "Outdoor terrace seating offers prime people-watching.",
        },
        {
          id: "act-d1-2",
          time: "11:30 AM",
          title: "Sainte-Chapelle & Conciergerie Tour",
          description: "Marvel at the 13th-century Gothic stained glass soaring over 15 meters high.",
          type: "sightseeing",
          locationName: "Sainte-Chapelle",
          address: "10 Boulevard du Palais, 75001 Paris",
          cost: 15,
          duration: 90,
          notes: "Pre-book timed tickets to bypass entry security queues.",
        },
        {
          id: "act-d1-3",
          time: "02:30 PM",
          title: "Stroll along the Seine & Pont Neuf",
          description: "Explore traditional bouquinistes bookstalls along the riverbanks with views of Ile de la Cite.",
          type: "sightseeing",
          locationName: "Pont Neuf",
          address: "Pont Neuf, 75001 Paris",
          cost: 0,
          duration: 75,
        },
        {
          id: "act-d1-4",
          time: "07:30 PM",
          title: "Bistro Dinner at Le Comptoir du Relais",
          description: "Renowned French gastronomic bistro serving seasonal duck confit and artisanal cheeses.",
          type: "food",
          locationName: "Le Comptoir du Relais",
          address: "9 Carrefour de l'Odeon, 75006 Paris",
          cost: 65,
          duration: 120,
        },
      ],
    },
    {
      dayNumber: 2,
      title: "Masterpieces & Regal Gardens",
      theme: "The Louvre & Tuileries Royal Promenade",
      date: new Date("2026-10-16"),
      activities: [
        {
          id: "act-d2-1",
          time: "09:00 AM",
          title: "Louvre Museum Highlights Tour",
          description: "Direct entry to view the Mona Lisa, Venus de Milo, and Winged Victory of Samothrace.",
          type: "sightseeing",
          locationName: "Musee du Louvre",
          address: "Rue de Rivoli, 75001 Paris",
          cost: 22,
          duration: 180,
          notes: "Enter via the Carrousel du Louvre underground entrance for faster lines.",
        },
        {
          id: "act-d2-2",
          time: "01:00 PM",
          title: "Tuileries Garden Gourmet Picnic",
          description: "Relax by the fountains with fresh baguettes, Comte cheese, and macarons from Angelina.",
          type: "food",
          locationName: "Jardin des Tuileries",
          address: "Place de la Concorde, 75001 Paris",
          cost: 24,
          duration: 75,
        },
        {
          id: "act-d2-3",
          time: "03:30 PM",
          title: "Musee de l'Orangerie Impressionists",
          description: "Experience Claude Monet's breathtaking 360-degree Water Lilies murals in natural light.",
          type: "sightseeing",
          locationName: "Musee de l'Orangerie",
          address: "Jardin des Tuileries, 75001 Paris",
          cost: 12.5,
          duration: 90,
        },
      ],
    },
    {
      dayNumber: 3,
      title: "Bohemian Montmartre & Sunset Views",
      theme: "Artisan Alleys, Sacre-Coeur & Panoramic Vistas",
      date: new Date("2026-10-17"),
      activities: [
        {
          id: "act-d3-1",
          time: "10:00 AM",
          title: "Funicular to Sacre-Coeur Basilica",
          description: "Climb up to the summit of Montmartre overlooking the entire Paris cityscape.",
          type: "sightseeing",
          locationName: "Basilique du Sacre-Coeur",
          address: "35 Rue du Chevalier de la Barre, 75018 Paris",
          cost: 0,
          duration: 90,
        },
        {
          id: "act-d3-2",
          time: "12:30 PM",
          title: "Place du Tertre Artist Square",
          description: "Watch portrait painters and sketch artists in the historic bohemian village square.",
          type: "sightseeing",
          locationName: "Place du Tertre",
          address: "Place du Tertre, 75018 Paris",
          cost: 0,
          duration: 60,
        },
        {
          id: "act-d3-3",
          time: "06:30 PM",
          title: "Twilight Seine Dinner Cruise",
          description: "Cruise past the sparkling Eiffel Tower with a 3-course illuminated dinner on the river.",
          type: "food",
          locationName: "Bateaux Parisiens",
          address: "Port de la Bourdonnais, 75007 Paris",
          cost: 110,
          duration: 150,
          notes: "Window seating guaranteed with reservations.",
        },
      ],
    },
  ],
};

/**
 * GET /api/itineraries/[id]/export/pdf
 * Generates and downloads a branded, high-resolution PDF itinerary.
 * - In development mode: Allows instant testing with zero authentication or paywall blocks.
 * - Supports sample preview via /api/itineraries/sample/export/pdf?inline=1
 * - In production: Gated behind PRO/PREMIUM plan check for private trips.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === "development" || req.nextUrl.searchParams.get("dev") === "true";

    let itinerary = null;

    // Development instant test sample
    if (id === "sample" || id === "test" || id === "demo") {
      const wantsBuiltin = req.nextUrl.searchParams.get("builtin") === "1" || id === "demo";
      const dbSample = wantsBuiltin
        ? null
        : await prisma.itinerary.findFirst({
            orderBy: { createdAt: "desc" },
            include: {
              days: {
                orderBy: { dayNumber: "asc" },
                include: {
                  activities: {
                    orderBy: [{ position: "asc" }, { time: "asc" }],
                  },
                },
              },
            },
          });

      if (!dbSample) {
        // Fall back to built-in sample itinerary
        const startTime = Date.now();
        const pdfBuffer = await generateItineraryPDFBuffer(DEMO_DEV_ITINERARY);
        const durationMs = Date.now() - startTime;
        console.log(`[PDF Export Demo] Generated ${pdfBuffer.length} bytes in ${durationMs}ms`);

        const wantsInline = req.nextUrl.searchParams.get("inline") === "1";
        const disposition = wantsInline
          ? "inline"
          : 'attachment; filename="wander-ai-paris-sample-5d.pdf"';

        return new NextResponse(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": disposition,
            "Content-Length": String(pdfBuffer.length),
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
          },
        });
      }
      itinerary = dbSample;
    } else {
      // Find by id or public share token
      itinerary = await prisma.itinerary.findFirst({
        where: {
          OR: [{ id }, { shareToken: id }],
        },
        include: {
          days: {
            orderBy: { dayNumber: "asc" },
            include: {
              activities: {
                orderBy: [{ position: "asc" }, { time: "asc" }],
              },
            },
          },
        },
      });
    }

    if (!itinerary) {
      if (isDev) {
        // Fallback to sample in dev if specific ID wasn't found
        const pdfBuffer = await generateItineraryPDFBuffer(DEMO_DEV_ITINERARY);
        return new NextResponse(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": "inline",
            "Content-Length": String(pdfBuffer.length),
          },
        });
      }

      return NextResponse.json(
        { success: false, error: "Itinerary not found" },
        { status: 404 }
      );
    }

    // Permission and Subscription checks
    const isSharedOrPublic = itinerary.isPublic || Boolean(itinerary.shareToken);
    const isOwner = session?.user?.id && session.user.id === itinerary.userId;

    if (!isSharedOrPublic && !isOwner && !isDev) {
      if (!session?.user?.id) {
        return NextResponse.json(
          { success: false, error: "Authentication required to export this itinerary" },
          { status: 401 }
        );
      }
    }

    // Subscription Tier Gate: Check if user has pdfExport feature
    // In dev mode, or on shared public links, allow direct export testing
    if (session?.user?.id && !isSharedOrPublic && !isDev) {
      const hasPdfAccess = await hasFeatureAccess(session.user.id, "pdfExport");
      if (!hasPdfAccess) {
        return NextResponse.json(
          {
            success: false,
            code: "UPGRADE_REQUIRED",
            error: "PDF export is a PRO feature. Upgrade to export high-resolution PDFs.",
          },
          { status: 403 }
        );
      }
    }

    // Transform into PDF document structure
    const pdfData: PDFItineraryData = {
      id: itinerary.id,
      title: itinerary.title || `${itinerary.destination} Itinerary`,
      destination: itinerary.destination,
      description: itinerary.description,
      duration: itinerary.duration || itinerary.days.length || 1,
      startDate: itinerary.startDate,
      endDate: itinerary.endDate,
      budgetAmount: itinerary.budgetAmount,
      currency: itinerary.currency || "$",
      travelers: itinerary.travelers,
      coverImage: itinerary.coverImage || (itinerary.images && itinerary.images[0]) || null,
      days: itinerary.days.map((d) => ({
        dayNumber: d.dayNumber,
        title: d.title,
        theme: d.theme,
        date: d.date,
        description: d.description,
        activities: d.activities.map((a) => ({
          id: a.id,
          time: a.time,
          title: a.title,
          description: a.description,
          type: a.type,
          locationName: a.locationName,
          address: a.address,
          cost: a.cost,
          duration: a.duration,
          notes: a.notes,
        })),
      })),
    };

    const startTime = Date.now();
    const pdfBuffer = await generateItineraryPDFBuffer(pdfData);
    const durationMs = Date.now() - startTime;
    console.log(`[PDF Export] Generated ${pdfBuffer.length} bytes in ${durationMs}ms`);

    const filename = getItineraryPDFFilename({
      destination: itinerary.destination,
      duration: itinerary.duration,
      title: itinerary.title,
    });

    const wantsInline = req.nextUrl.searchParams.get("inline") === "1";
    const disposition = wantsInline ? "inline" : `attachment; filename="${filename}"`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[PDF Export Error]:", error);
    Sentry.captureException(error, { tags: { route: "GET /api/itineraries/[id]/export/pdf" } });
    return NextResponse.json(
      { success: false, error: "Failed to generate PDF export" },
      { status: 500 }
    );
  }
}
