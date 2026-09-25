import { prisma } from "@/lib/prisma";
import { SubscriptionTier } from "@prisma/client";

const TIER_LIMITS: Record<SubscriptionTier, number> = {
  FREE: 3,
  PRO: 50,
  PREMIUM: 99999,
};

export async function checkAndIncrementQuota(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  tier: SubscriptionTier;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      itinerariesThisMonth: true,
      lastResetDate: true,
    },
  });

  if (!user) {
    return { allowed: false, remaining: 0, limit: 0, tier: "FREE" };
  }

  const limit = TIER_LIMITS[user.subscriptionTier] ?? 5;
  const now = new Date();

  // Reset count if it's been more than 30 days since last reset
  const daysSinceReset =
    (now.getTime() - new Date(user.lastResetDate).getTime()) /
    (1000 * 60 * 60 * 24);

  let currentCount = user.itinerariesThisMonth;

  if (daysSinceReset >= 30) {
    currentCount = 0;
    await prisma.user.update({
      where: { id: userId },
      data: {
        itinerariesThisMonth: 0,
        lastResetDate: now,
      },
    });
  }

  if (currentCount >= limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      tier: user.subscriptionTier,
    };
  }

  // Increment usage count
  await prisma.user.update({
    where: { id: userId },
    data: {
      itinerariesThisMonth: { increment: 1 },
    },
  });

  const remaining = Math.max(0, limit - (currentCount + 1));

  return {
    allowed: true,
    remaining,
    limit,
    tier: user.subscriptionTier,
  };
}

export async function getUserQuota(userId: string): Promise<{
  used: number;
  limit: number;
  remaining: number;
  tier: SubscriptionTier;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      itinerariesThisMonth: true,
      lastResetDate: true,
    },
  });

  if (!user) {
    return { used: 0, limit: 5, remaining: 5, tier: "FREE" };
  }

  const limit = TIER_LIMITS[user.subscriptionTier] ?? 5;
  const remaining = Math.max(0, limit - user.itinerariesThisMonth);

  return {
    used: user.itinerariesThisMonth,
    limit,
    remaining,
    tier: user.subscriptionTier,
  };
}
