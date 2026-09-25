import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/app/lib/currentUser";

/**
 * GET /api/journals?tripId=...&dayNumber=...
 * Fetch journal entries for a trip, sorted chronologically
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get("tripId");
    const dayNumber = searchParams.get("dayNumber")
      ? parseInt(searchParams.get("dayNumber")!, 10)
      : undefined;

    if (!tripId) {
      return NextResponse.json({ success: false, error: "tripId is required" }, { status: 400 });
    }

    const entries = await prisma.journalEntry.findMany({
      where: {
        itineraryId: tripId,
        ...(dayNumber !== undefined ? { dayNumber } : {}),
      },
      include: {
        author: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ success: true, entries });
  } catch (error: any) {
    console.error("Error fetching journal entries:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch journal entries" }, { status: 500 });
  }
}

/**
 * POST /api/journals
 * Create a new journal entry
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
      dayNumber,
      date,
      title,
      notes,
      mood = "adventurous",
      mediaType = "photo", // "photo" | "video" | "voice" | "text"
      photos = [],
      audioUrl,
      videoUrl,
      locationLat,
      locationLng,
      locationName,
      tags = [],
    } = body;

    if (!tripId || !notes?.trim()) {
      return NextResponse.json(
        { success: false, error: "tripId and notes are required" },
        { status: 400 }
      );
    }

    const newEntry = await prisma.journalEntry.create({
      data: {
        itineraryId: tripId,
        authorId: currentUser.id,
        dayNumber: dayNumber || 1,
        date: date ? new Date(date) : new Date(),
        title: title?.trim() || null,
        notes: notes.trim(),
        mood,
        mediaType,
        photos: Array.isArray(photos) ? photos : [],
        audioUrl: audioUrl || null,
        videoUrl: videoUrl || null,
        locationLat: locationLat ? parseFloat(locationLat) : null,
        locationLng: locationLng ? parseFloat(locationLng) : null,
        locationName: locationName || null,
        tags: Array.isArray(tags) ? tags : [],
      },
      include: {
        author: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    // Record activity log
    await prisma.activityLog.create({
      data: {
        itineraryId: tripId,
        userId: currentUser.id,
        action: "CREATED",
        entityType: "ACTIVITY",
        entityId: newEntry.id,
        summary: `${currentUser.name || "A traveler"} added a memory note: "${newEntry.title || newEntry.notes.slice(0, 30)}..."`,
      },
    });

    return NextResponse.json({ success: true, entry: newEntry });
  } catch (error: any) {
    console.error("Error creating journal entry:", error);
    return NextResponse.json({ success: false, error: "Failed to create journal entry" }, { status: 500 });
  }
}

/**
 * PATCH /api/journals
 * Update a journal entry
 */
export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, title, notes, mood, photos, mediaType, locationName, locationLat, locationLng, dayNumber } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    const updated = await prisma.journalEntry.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(mood !== undefined ? { mood } : {}),
        ...(photos !== undefined ? { photos } : {}),
        ...(mediaType !== undefined ? { mediaType } : {}),
        ...(locationName !== undefined ? { locationName } : {}),
        ...(locationLat !== undefined ? { locationLat: parseFloat(locationLat) } : {}),
        ...(locationLng !== undefined ? { locationLng: parseFloat(locationLng) } : {}),
        ...(dayNumber !== undefined ? { dayNumber: parseInt(dayNumber, 10) } : {}),
      },
      include: {
        author: { select: { id: true, name: true, username: true, image: true } },
      },
    });

    return NextResponse.json({ success: true, entry: updated });
  } catch (error: any) {
    console.error("Error updating journal entry:", error);
    return NextResponse.json({ success: false, error: "Failed to update journal entry" }, { status: 500 });
  }
}

/**
 * DELETE /api/journals?id=...
 */
export async function DELETE(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    await prisma.journalEntry.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Entry deleted" });
  } catch (error: any) {
    console.error("Error deleting journal entry:", error);
    return NextResponse.json({ success: false, error: "Failed to delete entry" }, { status: 500 });
  }
}
