import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    // Fetch itinerary with all details
    const itinerary = await prisma.itinerary.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        days: {
          orderBy: { dayNumber: "asc" },
          include: {
            activities: {
              orderBy: { time: "asc" },
            },
          },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!itinerary) {
      return NextResponse.json(
        { error: "Itinerary not found" },
        { status: 404 }
      );
    }

    // Check if itinerary is public or user has access
    const isOwner =
      session?.user?.email && itinerary.user.id === session.user.id;
    if (!itinerary.isPublic && !isOwner) {
      return NextResponse.json(
        { error: "This itinerary is private" },
        { status: 403 }
      );
    }

    // Increment view count (only for non-owners)
    if (!isOwner) {
      await prisma.itinerary.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    }

    // Check if user has liked
    let isLiked = false;
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (user) {
        const like = await prisma.itineraryLike.findUnique({
          where: {
            itineraryId_userId: {
              itineraryId: id,
              userId: user.id,
            },
          },
        });
        isLiked = !!like;
      }
    }

    return NextResponse.json({
      success: true,
      itinerary: {
        ...itinerary,
        isLiked,
        isOwner,
      },
    });
  } catch (error) {
    console.error("Marketplace detail API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch itinerary" },
      { status: 500 }
    );
  }
}
