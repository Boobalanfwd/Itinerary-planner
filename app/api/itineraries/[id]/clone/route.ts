import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get original itinerary with all relations
    const original = await prisma.itinerary.findUnique({
      where: { id },
      include: {
        days: {
          include: {
            activities: true,
          },
        },
      },
    });

    if (!original) {
      return NextResponse.json(
        { error: "Itinerary not found" },
        { status: 404 }
      );
    }

    // Check if itinerary is public or user has access
    if (!original.isPublic && original.userId !== user.id) {
      return NextResponse.json(
        { error: "Itinerary is private" },
        { status: 403 }
      );
    }

    // Clone the itinerary
    const cloned = await prisma.itinerary.create({
      data: {
        userId: user.id,
        title: `${original.title} (Copy)`,
        destination: original.destination,
        description: original.description,
        duration: original.duration,
        startDate: original.startDate,
        endDate: original.endDate,
        budgetAmount: original.budgetAmount,
        currency: original.currency,
        tags: original.tags,
        coverImage: original.coverImage,
        images: original.images,
        status: "DRAFT",
        visibility: "PRIVATE",
        isPublic: false,
        days: {
          create: original.days.map((day) => ({
            dayNumber: day.dayNumber,
            title: day.title,
            date: day.date,
            description: day.description,
            activities: {
              create: day.activities.map((activity) => ({
                time: activity.time,
                title: activity.title,
                description: activity.description,
                type: activity.type,
                locationLat: activity.locationLat,
                locationLng: activity.locationLng,
                locationName: activity.locationName,
                address: activity.address,
                duration: activity.duration,
                cost: activity.cost,
                bookingUrl: activity.bookingUrl,
                notes: activity.notes,
              })),
            },
          })),
        },
      },
    });

    // Create clone record
    await prisma.itineraryClone.create({
      data: {
        originalId: id,
        clonedId: cloned.id,
        userId: user.id,
      },
    });

    // Increment clone count
    await prisma.itinerary.update({
      where: { id },
      data: { cloneCount: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      clonedId: cloned.id,
      message: "Itinerary cloned successfully",
    });
  } catch (error) {
    console.error("Clone API error:", error);
    return NextResponse.json(
      { error: "Failed to clone itinerary" },
      { status: 500 }
    );
  }
}
