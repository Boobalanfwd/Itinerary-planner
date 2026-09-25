import { describe, it, expect } from "vitest";
import { MONTHLY_LIMITS } from "@/lib/edgeRateLimit";

describe("Rate Limiting Limits & Consistency", () => {
  it("should enforce FREE tier limit of 3 itineraries per month", () => {
    expect(MONTHLY_LIMITS.FREE).toBe(3);
  });

  it("should enforce PRO tier limit of 50 itineraries per month", () => {
    expect(MONTHLY_LIMITS.PRO).toBe(50);
  });

  it("should allow essentially unlimited itineraries on PREMIUM tier", () => {
    expect(MONTHLY_LIMITS.PREMIUM).toBeGreaterThanOrEqual(50000);
  });

  it("should have increasing quotas across subscription tiers", () => {
    expect(MONTHLY_LIMITS.FREE).toBeLessThan(MONTHLY_LIMITS.PRO);
    expect(MONTHLY_LIMITS.PRO).toBeLessThan(MONTHLY_LIMITS.PREMIUM);
  });
});
