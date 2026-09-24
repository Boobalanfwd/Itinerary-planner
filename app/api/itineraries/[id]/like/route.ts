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

    // Check if already liked
    const existingLike = await prisma.itineraryLike.findUnique({
      where: {
        itineraryId_userId: {
          itineraryId: id,
          userId: user.id,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.$transaction([
        prisma.itineraryLike.delete({
          where: { id: existingLike.id },
        }),
        prisma.itinerary.update({
          where: { id },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);

      return NextResponse.json({
        success: true,
        liked: false,
        message: "Unliked itinerary",
      });
    } else {
      // Like
      await prisma.$transaction([
        prisma.itineraryLike.create({
          data: {
            itineraryId: id,
            userId: user.id,
          },
        }),
        prisma.itinerary.update({
          where: { id },
          data: { likeCount: { increment: 1 } },
        }),
      ]);

      return NextResponse.json({
        success: true,
        liked: true,
        message: "Liked itinerary",
      });
    }
  } catch (error) {
    console.error("Like API error:", error);
    return NextResponse.json(
      { error: "Failed to process like" },
      { status: 500 }
    );
  }
}

// Get like status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ liked: false });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ liked: false });
    }

    const like = await prisma.itineraryLike.findUnique({
      where: {
        itineraryId_userId: {
          itineraryId: id,
          userId: user.id,
        },
      },
    });

    return NextResponse.json({ liked: !!like });
  } catch (error) {
    console.error("Get like status error:", error);
    return NextResponse.json({ liked: false });
  }
}
