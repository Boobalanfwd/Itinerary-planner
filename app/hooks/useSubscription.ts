"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

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
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/subscription/status");
        if (response.ok) {
          const data = await response.json();
          setSubscription(data);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [session]);

  const canUseFeature = (feature: string): boolean => {
    if (!subscription) return false;
    return subscription.limits.features[feature] === true;
  };

  const canCreateItinerary = (): boolean => {
    if (!subscription) return false;
    return (
      subscription.limits.itinerariesPerMonth === -1 ||
      subscription.usage.itineraries < subscription.usage.limit
    );
  };

  const upgradePlan = async (
    newTier: SubscriptionTier,
    billingCycle: "monthly" | "yearly" = "monthly"
  ) => {
    try {
      const response = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: newTier, billingCycle }),
      });

      if (response.ok) {
        const data = await response.json();

        // Redirect to Lemonsqueezy checkout
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return true;
        }

        return false;
      }
      return false;
    } catch (error) {
      console.error("Error upgrading plan:", error);
      return false;
    }
  };

  return {
    subscription,
    loading,
    canUseFeature,
    canCreateItinerary,
    upgradePlan,
    tier: subscription?.tier || "FREE",
    usage: subscription?.usage,
    limits: subscription?.limits,
  };
}
