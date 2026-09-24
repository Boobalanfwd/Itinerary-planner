import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { getUserItineraries } from "@/app/services/itineraryService";
import { ListItinerariesResponse } from "@/app/components/types";
import prisma from "@/lib/prisma";

/**
 * GET /api/itineraries
 * List all itineraries for the authenticated user.
 * B5 fix: pass authOptions so session is actually resolved.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as
      | "DRAFT"
      | "PUBLISHED"
      | "ARCHIVED"
      | null;
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { itineraries, total } = await getUserItineraries(user.id, {
      status: status || undefined,
      limit,
      offset,
    });

    const response: ListItinerariesResponse = {
      success: true,
      data: itineraries,
      total,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[itineraries] Error:", error);

    const response: ListItinerariesResponse = {
      success: false,
      error: "Failed to fetch itineraries",
    };

    return NextResponse.json(response, { status: 500 });
  }
}
