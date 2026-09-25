import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/app/lib/currentUser";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { winnerOptionId } = body;

    const poll = await prisma.poll.findUnique({
      where: { id },
      include: {
        options: {
          include: { votes: true },
        },
      },
    });

    if (!poll) {
      return NextResponse.json({ success: false, error: "Poll not found" }, { status: 404 });
    }

    let calculatedWinner = winnerOptionId;
    if (!calculatedWinner) {
      let maxScore = -Infinity;
      for (const opt of poll.options) {
        const score = opt.votes.reduce((acc, v) => acc + v.value, 0);
        if (score > maxScore) {
          maxScore = score;
          calculatedWinner = opt.id;
        }
      }
    }

    const updated = await prisma.poll.update({
      where: { id },
      data: {
        status: "closed",
        winnerOptionId: calculatedWinner,
      },
      include: {
        options: {
          include: {
            votes: {
              include: { user: { select: { id: true, name: true, image: true } } },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, poll: updated });
  } catch (error: any) {
    console.error("Error closing poll:", error);
    return NextResponse.json({ success: false, error: "Failed to close poll" }, { status: 500 });
  }
}
