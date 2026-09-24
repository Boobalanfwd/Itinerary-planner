import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import {
  getItineraryById,
  updateItinerary,
  deleteItinerary,
} from "@/app/services/itineraryService";
import { ItineraryData } from "@/app/components/types";
import prisma from "@/lib/prisma";
import { z } from "zod";

const UpdateItinerarySchema = z.object({
  title: z.string().min(1, "Title must not be empty").max(120, "Title too long").optional(),
  description: z.string().max(500, "Description too long").optional(),
  tags: z.array(z.string().max(50)).max(20, "Too many tags").optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  visibility: z.enum(["PRIVATE", "PUBLIC", "SHARED"]).optional(),
  budgetAmount: z.number().min(0, "Budget must be 0 or more").nullable().optional(),
});

/**
 * GET /api/itineraries/[id]
 * Get a single itinerary by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch itinerary
    const itinerary = await getItineraryById(id, user.id);

    if (!itinerary) {
      return NextResponse.json(
        { success: false, error: "Itinerary not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: itinerary,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );

  } catch (error) {
    console.error("Error fetching itinerary:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch itinerary" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/itineraries/[id]
 * Update an itinerary (title, description, tags, status, visibility, budgetAmount)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Parse + validate request body with Zod
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parsed = UpdateItinerarySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updates = parsed.data;

    // Update itinerary
    const updatedItinerary = await updateItinerary(id, user.id, updates);

    return NextResponse.json({
      success: true,
      data: updatedItinerary,
    });
  } catch (error) {
    console.error("Error updating itinerary:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update itinerary" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/itineraries/[id]
 * Delete an itinerary
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Delete itinerary
    await deleteItinerary(id, user.id);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error deleting itinerary:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete itinerary" },
      { status: 500 }
    );
  }
}
