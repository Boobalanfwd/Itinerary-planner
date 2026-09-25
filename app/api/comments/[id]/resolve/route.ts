import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/app/lib/currentUser";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 });
    }

    const newResolved = !comment.resolved;

    const updated = await prisma.comment.update({
      where: { id },
      data: {
        resolved: newResolved,
        resolvedById: newResolved ? currentUser.id : null,
        resolvedAt: newResolved ? new Date() : null,
      },
      include: {
        user: { select: { id: true, name: true, username: true, image: true } },
      },
    });

    return NextResponse.json({ success: true, comment: updated });
  } catch (error: any) {
    console.error("Error toggling resolve on comment:", error);
    return NextResponse.json({ success: false, error: "Failed to update comment" }, { status: 500 });
  }
}
