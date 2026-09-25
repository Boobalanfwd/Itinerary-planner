import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { SubscriptionTier } from "@prisma/client";
import { checkAndIncrementQuota } from "./rateLimit";

const isRedisConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

export const MONTHLY_LIMITS: Record<SubscriptionTier, number> = {
  FREE: 3,      // Reconciled with subscriptionService.ts PLAN_LIMITS and pricing page
  PRO: 50,
  PREMIUM: 99999,
};

const limiters = new Map<SubscriptionTier, Ratelimit>();

export function getMonthlyLimiter(tier: SubscriptionTier): Ratelimit | null {
  if (!redis) return null;

  if (!limiters.has(tier)) {
    limiters.set(
      tier,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(MONTHLY_LIMITS[tier], "30 d"),
        prefix: `wander:monthly:${tier.toLowerCase()}`,
      })
    );
  }

  return limiters.get(tier)!;
}

// Burst limiter — IP-based (20 requests per minute)
export const burstLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 m"),
      prefix: "wander:burst",
    })
  : null;

/**
 * Checks and increments quota using Upstash Redis if configured,
 * or gracefully falls back to database-backed checkAndIncrementQuota.
 */
export async function checkQuotaWithEdgeFallback(
  userId: string,
  tier: SubscriptionTier
): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  tier: SubscriptionTier;
}> {
  const limiter = getMonthlyLimiter(tier);

  if (limiter) {
    try {
      const { success, remaining, limit } = await limiter.limit(userId);
      return {
        allowed: success,
        remaining,
        limit,
        tier,
      };
    } catch (error) {
      console.warn("Upstash Redis error during rate limit check, falling back to database:", error);
    }
  }

  // Database fallback
  return checkAndIncrementQuota(userId);
}
