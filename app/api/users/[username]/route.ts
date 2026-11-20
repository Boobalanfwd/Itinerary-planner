import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import prisma from "@/lib/prisma";

// GET user profile by username
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const session = await getServerSession(authOptions);

    // Find user by username or email prefix
    const currentUser = session?.user?.email
      ? await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true, username: true, email: true },
        })
      : null;
    const isOwnProfile = !!currentUser &&
      (currentUser.username === username || currentUser.email?.split("@")[0] === username);

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: { startsWith: username } }],
      },
      include: {
        profile: true,
        itineraries: {
          where: isOwnProfile ? {} : { isPublic: true },
          orderBy: { createdAt: "desc" },
          take: 12,
          include: {
            _count: {
              select: {
                days: true,
                likes: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [totalTripCount, destinationGroups] = isOwnProfile
      ? await Promise.all([
          prisma.itinerary.count({ where: { userId: user.id } }),
          prisma.itinerary.groupBy({ by: ["destination"], where: { userId: user.id } }),
        ])
      : [user.profile?.totalTrips ?? 0, []];

    // Check if current user is following this user
    let isFollowing = false;
    if (currentUser) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!follow;
    }

    // Format response
    const profileData = {
      id: user.id,
      name: user.name,
      username: user.username || user.email?.split("@")[0],
      email: user.email,
      image: user.image,
      bio: user.profile?.bio,
      location: user.profile?.location,
      website: user.profile?.website,
      travelStyle: user.profile?.travelStyle || [],
      visitedCountries: user.profile?.visitedCountries || 0,
      totalTrips: totalTripCount,
      destinationsExplored: isOwnProfile ? destinationGroups.length : 0,
      coverImage: user.profile?.coverImage,
      isPublic: user.profile?.isPublic ?? true,
      followerCount: user.followerCount,
      followingCount: user.followingCount,
      subscriptionTier: user.subscriptionTier || "FREE",
      role: user.role,
      subscriptionStatus: user.subscriptionStatus || "active",
      createdAt: user.createdAt,
      itineraries: user.itineraries.map((itinerary) => ({
        id: itinerary.id,
        title: itinerary.title,
        destination: itinerary.destination,
        duration: itinerary.duration,
        coverImage: itinerary.coverImage,
        tags: itinerary.tags,
        likeCount: itinerary.likeCount,
        viewCount: itinerary.viewCount,
        dayCount: itinerary._count.days,
      })),
      isFollowing,
      isOwnProfile: session?.user?.email === user.email,
    };

    return NextResponse.json({
      success: true,
      profile: profileData,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT update user profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || (user.username !== username && user.email?.split("@")[0] !== username)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { bio, location, website, travelStyle, coverImage } = body;
    const validImageUrl = typeof coverImage === "string" && /^https?:\/\//i.test(coverImage) ? coverImage : null;
    const validWebsite = typeof website === "string" && /^https?:\/\//i.test(website) ? website : null;

    // Update or create profile
    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        bio: typeof bio === "string" ? bio.slice(0, 300) : null,
        location: typeof location === "string" ? location.slice(0, 120) : null,
        website: validWebsite,
        travelStyle: Array.isArray(travelStyle) ? travelStyle.slice(0, 20) : [],
        coverImage: validImageUrl,
      },
      create: {
        userId: user.id,
        bio: typeof bio === "string" ? bio.slice(0, 300) : null,
        location: typeof location === "string" ? location.slice(0, 120) : null,
        website: validWebsite,
        travelStyle: Array.isArray(travelStyle) ? travelStyle.slice(0, 20) : [],
        coverImage: validImageUrl,
      },
    });

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
