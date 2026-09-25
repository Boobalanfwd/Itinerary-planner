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

    const { optionId, value = 1 } = await req.json();

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

    if (poll.status === "closed") {
      return NextResponse.json({ success: false, error: "This poll is closed" }, { status: 400 });
    }

    // Check if user has already voted on this option
    const existingVote = await prisma.pollVote.findUnique({
      where: {
        pollId_optionId_userId: {
          pollId: id,
          optionId,
          userId: currentUser.id,
        },
      },
    });

    if (existingVote) {
      if (poll.voteType === "thumbs" && existingVote.value === value) {
        // Toggle off thumbs vote if clicking same button
        await prisma.pollVote.delete({
          where: { id: existingVote.id },
        });
      } else {
        await prisma.pollVote.update({
          where: { id: existingVote.id },
          data: { value },
        });
      }
    } else {
      await prisma.pollVote.create({
        data: {
          pollId: id,
          optionId,
          userId: currentUser.id,
          value,
        },
      });
    }

    // Recalculate totals and find the leading option
    const updatedOptions = await prisma.pollOption.findMany({
      where: { pollId: id },
      include: {
        votes: {
          include: {
            user: { select: { id: true, name: true, username: true, image: true } },
          },
        },
      },
      orderBy: { position: "asc" },
    });

    let bestOptionId: string | null = null;
    let highestScore = -Infinity;

    for (const opt of updatedOptions) {
      let score = 0;
      for (const v of opt.votes) {
        score += v.value;
      }
      if (score > highestScore && score > 0) {
        highestScore = score;
        bestOptionId = opt.id;
      }
    }

    // If quorum is reached (e.g. 3 or more votes or owner decided), auto highlight winner
    const totalVotes = updatedOptions.reduce((acc, opt) => acc + opt.votes.length, 0);
    let winnerOptionId = poll.winnerOptionId;
    if (totalVotes >= 3 && bestOptionId) {
      winnerOptionId = bestOptionId;
      await prisma.poll.update({
        where: { id },
        data: { winnerOptionId: bestOptionId },
      });
    }

    const updatedPoll = await prisma.poll.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, image: true } },
        options: {
          include: {
            votes: {
              include: {
                user: { select: { id: true, name: true, username: true, image: true } },
              },
            },
          },
          orderBy: { position: "asc" },
        },
      },
    });

    return NextResponse.json({ success: true, poll: updatedPoll });
  } catch (error: any) {
    console.error("Error casting vote:", error);
    return NextResponse.json({ success: false, error: "Failed to cast vote" }, { status: 500 });
  }
}
