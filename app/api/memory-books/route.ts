import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/app/lib/currentUser";
import crypto from "crypto";

/**
 * GET /api/memory-books?tripId=...
 * Fetch or get memory book configuration for a trip
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get("tripId");

    if (!tripId) {
      return NextResponse.json({ success: false, error: "tripId is required" }, { status: 400 });
    }

    let memoryBook = await prisma.memoryBook.findFirst({
      where: { itineraryId: tripId },
      include: {
        author: { select: { id: true, name: true, image: true, username: true } },
      },
    });

    const trip = await prisma.itinerary.findUnique({
      where: { id: tripId },
      include: {
        journalEntries: {
          include: { author: { select: { id: true, name: true, image: true } } },
          orderBy: [{ date: "asc" }, { createdAt: "asc" }],
        },
        tripSummaries: { take: 1, orderBy: { createdAt: "desc" } },
      },
    });

    if (!trip) {
      return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 });
    }

    if (!memoryBook) {
      // Create initial default memory book
      const currentUser = await getCurrentUser();
      const token = crypto.randomBytes(8).toString("hex");

      memoryBook = await prisma.memoryBook.create({
        data: {
          itineraryId: tripId,
          authorId: currentUser?.id || trip.userId,
          title: `${trip.destination} Memory Book`,
          subtitle: `A nostalgic visual journey through ${trip.destination}`,
          coverPhoto: trip.coverImage,
          layoutTemplate: "magazine",
          visibility: "collaborators",
          collaborative: true,
          shareToken: token,
          selectedEntries: trip.journalEntries.map((e) => e.id),
        },
        include: {
          author: { select: { id: true, name: true, image: true, username: true } },
        },
      });
    }

    return NextResponse.json({
      success: true,
      memoryBook,
      trip,
      entries: trip.journalEntries,
      summary: trip.tripSummaries[0] || null,
    });
  } catch (error: any) {
    console.error("Error fetching memory book:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch memory book" }, { status: 500 });
  }
}

/**
 * POST /api/memory-books
 * Update or save memory book customization
 */
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      tripId,
      title,
      subtitle,
      coverPhoto,
      layoutTemplate = "magazine", // "grid" | "magazine" | "scrapbook"
      visibility = "collaborators", // "public" | "collaborators" | "private"
      collaborative = true,
      customCaptions = {},
      selectedEntries = [],
    } = body;

    if (!tripId) {
      return NextResponse.json({ success: false, error: "tripId is required" }, { status: 400 });
    }

    const existing = await prisma.memoryBook.findFirst({
      where: { itineraryId: tripId },
    });

    let book;
    if (existing) {
      book = await prisma.memoryBook.update({
        where: { id: existing.id },
        data: {
          title: title || existing.title,
          subtitle: subtitle !== undefined ? subtitle : existing.subtitle,
          coverPhoto: coverPhoto || existing.coverPhoto,
          layoutTemplate,
          visibility,
          collaborative,
          customCaptions: customCaptions as any,
          selectedEntries,
        },
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
      });
    } else {
      const shareToken = crypto.randomBytes(8).toString("hex");
      book = await prisma.memoryBook.create({
        data: {
          itineraryId: tripId,
          authorId: currentUser.id,
          title: title || "Trip Memory Book",
          subtitle: subtitle || "Captured Moments & Shared Stories",
          coverPhoto,
          layoutTemplate,
          visibility,
          collaborative,
          customCaptions: customCaptions as any,
          selectedEntries,
          shareToken,
        },
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
      });
    }

    return NextResponse.json({ success: true, memoryBook: book });
  } catch (error: any) {
    console.error("Error saving memory book:", error);
    return NextResponse.json({ success: false, error: "Failed to save memory book" }, { status: 500 });
  }
}
