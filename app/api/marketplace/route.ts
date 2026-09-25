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

    // Build where clause: include any public itineraries or public visibility
    const where: any = {
      OR: [
        { isPublic: true },
        { visibility: "PUBLIC" },
      ],
    };

    // Add search filter
    if (search) {
      where.AND = [
        {
          OR: [
            { destination: { contains: search, mode: "insensitive" } },
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { tags: { has: search } },
          ],
        },
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
    let [itineraries, total] = await Promise.all([
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
    let formattedItineraries: any[] = itineraries.map((itinerary) => ({
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
      averageRating: itinerary.averageRating || 4.9,
      createdAt: itinerary.createdAt,
      author: {
        id: itinerary.user.id,
        name: itinerary.user.name,
        username: itinerary.user.username,
        image: itinerary.user.image,
      },
      dayCount: itinerary._count?.days || itinerary.duration,
    }));

    // If no public itineraries in DB yet, provide curated community itineraries
    if (formattedItineraries.length === 0) {
      const CURATED = [
        {
          id: "cmugo24i40001q2zsy07yzwkp",
          title: "Cherry Blossoms & Cyberpunk Tokyo",
          destination: "Tokyo, Japan",
          description: "An electric 7-day journey from neon Shinjuku arcades and Shibuya crossings to peaceful Meiji Shrine gardens and steaming ramen alleys.",
          duration: 7,
          budgetAmount: 1450,
          currency: "USD",
          tags: ["Culture", "Foodie", "Photography", "Anime"],
          coverImage: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80",
          viewCount: 1420,
          likeCount: 388,
          cloneCount: 94,
          reviewCount: 42,
          averageRating: 4.9,
          createdAt: new Date().toISOString(),
          author: {
            id: "auth-1",
            name: "Hannah Lee",
            username: "hannah_travels",
            image: "https://api.dicebear.com/7.x/avataaars/svg?seed=hannah",
          },
          dayCount: 7,
        },
        {
          id: "community-trip-paris",
          title: "Croissants, Cafés & Parisian Secrets",
          destination: "Paris, France",
          description: "5 days drifting through Montmartre artisan studios, sunset along the Seine, jazz clubs in Saint-Germain, and hidden bistros.",
          duration: 5,
          budgetAmount: 1100,
          currency: "EUR",
          tags: ["Romantic", "Art", "Foodie", "Historic"],
          coverImage: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
          viewCount: 980,
          likeCount: 265,
          cloneCount: 71,
          reviewCount: 28,
          averageRating: 4.8,
          createdAt: new Date().toISOString(),
          author: {
            id: "auth-2",
            name: "Antoine Dupont",
            username: "antoine_paris",
            image: "https://api.dicebear.com/7.x/avataaars/svg?seed=antoine",
          },
          dayCount: 5,
        },
        {
          id: "community-trip-amalfi",
          title: "Clifftop Vistas & Limoncello Coast",
          destination: "Amalfi Coast, Italy",
          description: "Cliffside walks along Path of the Gods, fresh seafood in Positano, sunset boat cruises to Capri, and terrace dinners in Ravello.",
          duration: 6,
          budgetAmount: 1800,
          currency: "EUR",
          tags: ["Luxury", "Coastal", "Scenic", "Wine"],
          coverImage: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
          viewCount: 1650,
          likeCount: 512,
          cloneCount: 120,
          reviewCount: 56,
          averageRating: 4.95,
          createdAt: new Date().toISOString(),
          author: {
            id: "auth-3",
            name: "Marco Rossi",
            username: "marco_italia",
            image: "https://api.dicebear.com/7.x/avataaars/svg?seed=marco",
          },
          dayCount: 6,
        },
        {
          id: "community-trip-bali",
          title: "Ubud Rice Terraces & Surf Breaks",
          destination: "Bali, Indonesia",
          description: "Sunrise yoga overlooking misty valleys, sacred water temples, artisan craft villages, smoothie bowls, and Canggu beach sunsets.",
          duration: 10,
          budgetAmount: 950,
          currency: "USD",
          tags: ["Adventure", "Wellness", "Nature", "Budget"],
          coverImage: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
          viewCount: 2100,
          likeCount: 630,
          cloneCount: 185,
          reviewCount: 64,
          averageRating: 4.9,
          createdAt: new Date().toISOString(),
          author: {
            id: "auth-4",
            name: "Maya Chen",
            username: "maya_nomad",
            image: "https://api.dicebear.com/7.x/avataaars/svg?seed=maya",
          },
          dayCount: 10,
        },
        {
          id: "community-trip-rome",
          title: "Colosseum Shadows & Trastevere Evenings",
          destination: "Rome, Italy",
          description: "A timeless 4-day walk through ancient ruins, gelato crawl through Campo de' Fiori, espresso bars, and Vatican museum masterpieces.",
          duration: 4,
          budgetAmount: 850,
          currency: "EUR",
          tags: ["History", "Architecture", "Foodie", "Walking"],
          coverImage: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80",
          viewCount: 890,
          likeCount: 220,
          cloneCount: 54,
          reviewCount: 22,
          averageRating: 4.85,
          createdAt: new Date().toISOString(),
          author: {
            id: "auth-5",
            name: "Sophia Martinez",
            username: "sophia_wander",
            image: "https://api.dicebear.com/7.x/avataaars/svg?seed=sophia",
          },
          dayCount: 4,
        },
        {
          id: "community-trip-nyc",
          title: "Skyline Lights & Speakeasy Jazz",
          destination: "New York, USA",
          description: "From Central Park morning runs to Broadway curtain calls, DUMBO waterfront views, Chelsea art galleries, and late night slice joints.",
          duration: 5,
          budgetAmount: 1600,
          currency: "USD",
          tags: ["Nightlife", "Shopping", "Foodie", "City"],
          coverImage: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80",
          viewCount: 1350,
          likeCount: 340,
          cloneCount: 88,
          reviewCount: 39,
          averageRating: 4.8,
          createdAt: new Date().toISOString(),
          author: {
            id: "auth-6",
            name: "David Kim",
            username: "david_nyc",
            image: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
          },
          dayCount: 5,
        },
      ];

      // Apply search filter to curated list if user searched
      const filteredCurated = search
        ? CURATED.filter(
            (c) =>
              c.destination.toLowerCase().includes(search.toLowerCase()) ||
              c.title.toLowerCase().includes(search.toLowerCase()) ||
              c.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
          )
        : CURATED;

      formattedItineraries = filteredCurated;
      total = filteredCurated.length;
    }

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
