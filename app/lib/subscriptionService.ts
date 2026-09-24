import prisma from "@/lib/prisma";

export type SubscriptionTier = "FREE" | "PRO" | "PREMIUM";

export interface PlanLimits {
  itinerariesPerMonth: number;
  features: {
    unlimitedItineraries: boolean;
    hotelBooking: boolean;
    flightBooking: boolean;
    budgetTracking: boolean;
    pdfExport: boolean;
    calendarExport: boolean;
    advancedAI: boolean;
    prioritySupport: boolean;
    apiAccess: boolean;
    whiteLabel: boolean;
    dedicatedSupport: boolean;
    exclusiveDeals: boolean;
  };
}

// Plan definitions
export const PLAN_LIMITS: Record<SubscriptionTier, PlanLimits> = {
  FREE: {
    itinerariesPerMonth: 3,
    features: {
      unlimitedItineraries: false,
      hotelBooking: false,
      flightBooking: false,
      budgetTracking: false,
      pdfExport: false,
      calendarExport: false,
      advancedAI: false,
      prioritySupport: false,
      apiAccess: false,
      whiteLabel: false,
      dedicatedSupport: false,
      exclusiveDeals: false,
    },
  },
  PRO: {
    itinerariesPerMonth: -1, // Unlimited
    features: {
      unlimitedItineraries: true,
      hotelBooking: true,
      flightBooking: true,
      budgetTracking: true,
      pdfExport: true,
      calendarExport: true,
      advancedAI: true,
      prioritySupport: true,
      apiAccess: false,
      whiteLabel: false,
      dedicatedSupport: false,
      exclusiveDeals: false,
    },
  },
  PREMIUM: {
    itinerariesPerMonth: -1, // Unlimited
    features: {
      unlimitedItineraries: true,
      hotelBooking: true,
      flightBooking: true,
      budgetTracking: true,
      pdfExport: true,
      calendarExport: true,
      advancedAI: true,
      prioritySupport: true,
      apiAccess: true,
      whiteLabel: true,
      dedicatedSupport: true,
      exclusiveDeals: true,
    },
  },
};

/**
 * Get user's subscription plan
 */
export async function getUserPlan(userId: string): Promise<SubscriptionTier> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    });

    return (user?.subscriptionTier as SubscriptionTier) || "FREE";
  } catch (error) {
    console.error("Error getting user plan:", error);
    return "FREE";
  }
}

/**
 * Get user's usage and limits
 */
export async function getUserUsage(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        itinerariesThisMonth: true,
        lastResetDate: true,
      },
    });

    if (!user) {
      return null;
    }

    const plan = (user.subscriptionTier as SubscriptionTier) || "FREE";
    const limits = PLAN_LIMITS[plan];

    return {
      plan,
      used: user.itinerariesThisMonth,
      limit: limits.itinerariesPerMonth,
      resetDate: user.lastResetDate,
      canCreate:
        limits.itinerariesPerMonth === -1 ||
        user.itinerariesThisMonth < limits.itinerariesPerMonth,
    };
  } catch (error) {
    console.error("Error getting user usage:", error);
    return null;
  }
}

/**
 * Check if user can create a new itinerary
 */
export async function canCreateItinerary(userId: string): Promise<boolean> {
  const usage = await getUserUsage(userId);
  if (!usage) return false;

  // Check if we need to reset monthly counter
  const now = new Date();
  const lastReset = new Date(usage.resetDate);
  const monthsSinceReset =
    (now.getFullYear() - lastReset.getFullYear()) * 12 +
    (now.getMonth() - lastReset.getMonth());

  if (monthsSinceReset > 0) {
    // Reset counter
    await resetMonthlyUsage(userId);
    return true;
  }

  return usage.canCreate;
}

/**
 * Increment itinerary count for user
 */
export async function incrementItineraryCount(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        itinerariesThisMonth: {
          increment: 1,
        },
      },
    });
  } catch (error) {
    console.error("Error incrementing itinerary count:", error);
  }
}

/**
 * Reset monthly usage counter
 */
export async function resetMonthlyUsage(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        itinerariesThisMonth: 0,
        lastResetDate: new Date(),
      },
    });
  } catch (error) {
    console.error("Error resetting monthly usage:", error);
  }
}

/**
 * Check if user has access to a specific feature
 */
export async function hasFeatureAccess(
  userId: string,
  feature: keyof PlanLimits["features"]
): Promise<boolean> {
  try {
    const plan = await getUserPlan(userId);
    return PLAN_LIMITS[plan].features[feature];
  } catch (error) {
    console.error("Error checking feature access:", error);
    return false;
  }
}

/**
 * Upgrade user to a new plan
 */
export async function upgradePlan(
  userId: string,
  newPlan: SubscriptionTier
): Promise<boolean> {
  try {
    const now = new Date();
    const oneMonthFromNow = new Date(now);
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: newPlan,
        subscriptionStart: now,
        subscriptionEnd: oneMonthFromNow,
        subscriptionStatus: "active",
        // Reset usage when upgrading
        itinerariesThisMonth: 0,
        lastResetDate: now,
      },
    });

    return true;
  } catch (error) {
    console.error("Error upgrading plan:", error);
    return false;
  }
}

/**
 * Get subscription info for display
 */
export async function getSubscriptionInfo(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionStart: true,
        subscriptionEnd: true,
        itinerariesThisMonth: true,
        lastResetDate: true,
      },
    });

    if (!user) return null;

    const plan = (user.subscriptionTier as SubscriptionTier) || "FREE";
    const limits = PLAN_LIMITS[plan];

    return {
      tier: plan,
      status: user.subscriptionStatus,
      startDate: user.subscriptionStart,
      endDate: user.subscriptionEnd,
      limits,
      usage: {
        itineraries: user.itinerariesThisMonth,
        limit: limits.itinerariesPerMonth,
        resetDate: user.lastResetDate,
      },
    };
  } catch (error) {
    console.error("Error getting subscription info:", error);
    return null;
  }
}
