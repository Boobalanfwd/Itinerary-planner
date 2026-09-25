import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const memoryBook = await prisma.memoryBook.findUnique({
      where: { shareToken: token },
      include: {
        author: { select: { id: true, name: true, image: true, username: true } },
        itinerary: {
          include: {
            user: { select: { id: true, name: true, image: true } },
            journalEntries: {
              include: { author: { select: { id: true, name: true, image: true } } },
              orderBy: [{ date: "asc" }, { createdAt: "asc" }],
            },
            tripSummaries: { take: 1, orderBy: { createdAt: "desc" } },
          },
        },
      },
    });

    if (!memoryBook) {
      return NextResponse.json({ success: false, error: "Memory book not found or link expired" }, { status: 404 });
    }

    if (memoryBook.visibility === "private") {
      return NextResponse.json({ success: false, error: "This memory book is private" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      memoryBook,
      trip: memoryBook.itinerary,
      entries: memoryBook.itinerary.journalEntries,
      summary: memoryBook.itinerary.tripSummaries[0] || null,
    });
  } catch (error: any) {
    console.error("Error fetching shared memory book:", error);
    return NextResponse.json({ success: false, error: "Failed to load memory book" }, { status: 500 });
  }
}
