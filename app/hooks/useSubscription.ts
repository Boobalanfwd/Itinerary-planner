"use client";

export type SubscriptionTier = "FREE" | "PRO" | "PREMIUM";

interface SubscriptionData {
  tier: SubscriptionTier;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  usage: {
    itineraries: number;
    limit: number;
    resetDate: Date;
  };
  limits: {
    itinerariesPerMonth: number;
    features: Record<string, boolean>;
  };
}

export function useSubscription() {
  const subscription: SubscriptionData = {
    tier: "FREE",
    status: "active",
    startDate: null,
    endDate: null,
    usage: { itineraries: 0, limit: -1, resetDate: new Date() },
    limits: { itinerariesPerMonth: -1, features: { pdfExport: true } },
  };
  const canUseFeature = (_feature: string): boolean => true;
  const canCreateItinerary = (): boolean => true;
  const upgradePlan = async (): Promise<boolean> => false;

  return {
    subscription,
    loading: false,
    canUseFeature,
    canCreateItinerary,
    upgradePlan,
    tier: subscription?.tier || "FREE",
    usage: subscription?.usage,
    limits: subscription?.limits,
  };
}
