import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import prisma from "@/lib/prisma";

// POST follow/unfollow user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await params;

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get target user
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: { startsWith: username } }],
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Can't follow yourself
    if (currentUser.id === targetUser.id) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: targetUser.id,
        },
      },
    });

    if (existingFollow) {
      // Unfollow
      await prisma.$transaction([
        prisma.follow.delete({
          where: { id: existingFollow.id },
        }),
        prisma.user.update({
          where: { id: currentUser.id },
          data: { followingCount: { decrement: 1 } },
        }),
        prisma.user.update({
          where: { id: targetUser.id },
          data: { followerCount: { decrement: 1 } },
        }),
      ]);

      return NextResponse.json({
        success: true,
        following: false,
        message: "Unfollowed successfully",
      });
    } else {
      // Follow
      await prisma.$transaction([
        prisma.follow.create({
          data: {
            followerId: currentUser.id,
            followingId: targetUser.id,
          },
        }),
        prisma.user.update({
          where: { id: currentUser.id },
          data: { followingCount: { increment: 1 } },
        }),
        prisma.user.update({
          where: { id: targetUser.id },
          data: { followerCount: { increment: 1 } },
        }),
      ]);

      return NextResponse.json({
        success: true,
        following: true,
        message: "Followed successfully",
      });
    }
  } catch (error) {
    console.error("Follow API error:", error);
    return NextResponse.json(
      { error: "Failed to process follow" },
      { status: 500 }
    );
  }
}

// GET followers or following list
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "followers"; // followers or following

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: { startsWith: username } },
        ],
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (type === "followers") {
      const followers = await prisma.follow.findMany({
        where: { followingId: user.id },
        include: {
          follower: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              profile: {
                select: {
                  bio: true,
                  location: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        success: true,
        users: followers.map((f) => f.follower),
      });
    } else {
      const following = await prisma.follow.findMany({
        where: { followerId: user.id },
        include: {
          following: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              profile: {
                select: {
                  bio: true,
                  location: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        success: true,
        users: following.map((f) => f.following),
      });
    }
  } catch (error) {
    console.error("Get followers/following error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
