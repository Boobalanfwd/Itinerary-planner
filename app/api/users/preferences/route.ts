import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface UserPreferencesPayload {
  onboardingComplete?: boolean;
  onboardingStep?: number;
  onboardingDismissedAt?: string;
  defaultCurrency?: string;
  temperatureUnit?: "celsius" | "fahrenheit";
  distanceUnit?: "km" | "miles";
  theme?: "light" | "dark" | "system";
  welcomeEmailSent?: boolean;
  [key: string]: unknown;
}

/**
 * GET /api/users/preferences
 * Returns the authenticated user's preferences JSON object.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      // Return guest fallback defaults
      return NextResponse.json(
        {
          success: true,
          isGuest: true,
          preferences: {
            onboardingComplete: false,
            onboardingStep: 1,
          },
        },
        { status: 200 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        preferences: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const preferences = (user.preferences as UserPreferencesPayload) || {
      onboardingComplete: false,
      onboardingStep: 1,
    };

    return NextResponse.json({
      success: true,
      isGuest: false,
      preferences,
    });
  } catch (error) {
    console.error("[Preferences API] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user preferences" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/preferences
 * Updates/merges the authenticated user's preferences JSON object.
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as UserPreferencesPayload;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { preferences: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const currentPrefs = (user.preferences as Record<string, unknown>) || {};
    
    // Check if reset was requested
    const updatedPrefs: Record<string, unknown> = body.reset
      ? { onboardingComplete: false, onboardingStep: 1 }
      : {
          ...currentPrefs,
          ...body,
          updatedAt: new Date().toISOString(),
        };

    // Remove internal control flag
    delete updatedPrefs.reset;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        preferences: updatedPrefs as Prisma.InputJsonValue,
      },
      select: { preferences: true },
    });

    return NextResponse.json({
      success: true,
      preferences: updatedUser.preferences,
    });
  } catch (error) {
    console.error("[Preferences API] PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user preferences" },
      { status: 500 }
    );
  }
}
