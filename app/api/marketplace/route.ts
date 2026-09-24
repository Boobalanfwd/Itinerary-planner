import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "trending";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isPublic: true,
      status: "PUBLISHED",
    };

    // Add search filter
    if (search) {
      where.OR = [
        { destination: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ];
    }

    // Determine sort order
    let orderBy: any = {};
    switch (filter) {
      case "trending":
        orderBy = [
          { likeCount: "desc" },
          { viewCount: "desc" },
          { createdAt: "desc" },
        ];
        break;
      case "recent":
        orderBy = { createdAt: "desc" };
        break;
      case "popular":
        orderBy = [{ cloneCount: "desc" }, { likeCount: "desc" }];
        break;
      case "top-rated":
        orderBy = [{ averageRating: "desc" }, { reviewCount: "desc" }];
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    // Fetch itineraries
    const [itineraries, total] = await Promise.all([
      prisma.itinerary.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          _count: {
            select: {
              days: true,
              likes: true,
              reviews: true,
            },
          },
        },
      }),
      prisma.itinerary.count({ where }),
    ]);

    // Format response
    const formattedItineraries = itineraries.map((itinerary) => ({
      id: itinerary.id,
      title: itinerary.title,
      destination: itinerary.destination,
      description: itinerary.description,
      duration: itinerary.duration,
      budgetAmount: itinerary.budgetAmount,
      currency: itinerary.currency,
      tags: itinerary.tags,
      coverImage: itinerary.coverImage,
      viewCount: itinerary.viewCount,
      likeCount: itinerary.likeCount,
      cloneCount: itinerary.cloneCount,
      reviewCount: itinerary.reviewCount,
      averageRating: itinerary.averageRating,
      createdAt: itinerary.createdAt,
      author: {
        id: itinerary.user.id,
        name: itinerary.user.name,
        username: itinerary.user.username,
        image: itinerary.user.image,
      },
      dayCount: itinerary._count.days,
    }));

    return NextResponse.json({
      success: true,
      itineraries: formattedItineraries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error("Marketplace API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch itineraries" },
      { status: 500 }
    );
  }
}
