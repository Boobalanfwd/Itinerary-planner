import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import prisma from "@/lib/prisma";

// PUT update a review
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reviewId } = await params;
    const body = await request.json();
    const { rating, comment } = body;

    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check ownership
    const review = await prisma.itineraryReview.findUnique({
      where: { id: reviewId },
    });

    if (!review || review.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update review and recalculate average
    const updated = await prisma.$transaction(async (tx) => {
      const updatedReview = await tx.itineraryReview.update({
        where: { id: reviewId },
        data: {
          rating: rating || review.rating,
          comment: comment !== undefined ? comment : review.comment,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
      });

      // Recalculate average rating
      const allReviews = await tx.itineraryReview.findMany({
        where: { itineraryId: review.itineraryId },
        select: { rating: true },
      });

      const avgRating =
        allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      await tx.itinerary.update({
        where: { id: review.itineraryId },
        data: { averageRating: avgRating },
      });

      return updatedReview;
    });

    return NextResponse.json({
      success: true,
      review: updated,
    });
  } catch (error) {
    console.error("Update review error:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}

// DELETE a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reviewId } = await params;

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check ownership
    const review = await prisma.itineraryReview.findUnique({
      where: { id: reviewId },
    });

    if (!review || review.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete review and update stats
    await prisma.$transaction(async (tx) => {
      await tx.itineraryReview.delete({
        where: { id: reviewId },
      });

      // Recalculate average rating
      const remainingReviews = await tx.itineraryReview.findMany({
        where: { itineraryId: review.itineraryId },
        select: { rating: true },
      });

      const avgRating =
        remainingReviews.length > 0
          ? remainingReviews.reduce((sum, r) => sum + r.rating, 0) /
            remainingReviews.length
          : null;

      await tx.itinerary.update({
        where: { id: review.itineraryId },
        data: {
          reviewCount: { decrement: 1 },
          averageRating: avgRating,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete review error:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
