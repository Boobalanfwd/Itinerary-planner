import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/app/lib/currentUser";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const tripId = searchParams.get("tripId") || undefined;
    const currentUser = await getCurrentUser();

    if (!query && !tripId) {
      // Return suggestions (recent active travelers)
      const suggestions = await prisma.user.findMany({
        where: currentUser ? { id: { not: currentUser.id } } : undefined,
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          image: true,
          bio: true,
          subscriptionTier: true,
        },
        take: 8,
      });
      return NextResponse.json({ success: true, users: suggestions });
    }

    // Existing collaborators for this trip to avoid inviting already joined members
    let existingCollaboratorUserIds: string[] = [];
    if (tripId) {
      const existing = await prisma.itineraryCollaborator.findMany({
        where: { itineraryId: tripId },
        select: { userId: true },
      });
      existingCollaboratorUserIds = existing.map((c) => c.userId);
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          currentUser ? { id: { not: currentUser.id } } : {},
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { username: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        subscriptionTier: true,
      },
      take: 10,
    });

    const enriched = users.map((u) => ({
      ...u,
      isAlreadyCollaborator: existingCollaboratorUserIds.includes(u.id),
    }));

    return NextResponse.json({ success: true, users: enriched });
  } catch (error: any) {
    console.error("Error searching travelers:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search travelers" },
      { status: 500 }
    );
  }
}
