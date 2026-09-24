import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

// Initialize Lemonsqueezy
if (process.env.LEMONSQUEEZY_API_KEY) {
  lemonSqueezySetup({
    apiKey: process.env.LEMONSQUEEZY_API_KEY,
    onError: (error) => console.error("Lemonsqueezy Error:", error),
  });
}

// Product variant IDs from your Lemonsqueezy store
// You'll need to replace these with your actual variant IDs
export const LEMONSQUEEZY_VARIANTS = {
  PRO_MONTHLY: process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID || "",
  PRO_YEARLY: process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID || "",
  PREMIUM_MONTHLY: process.env.LEMONSQUEEZY_PREMIUM_MONTHLY_VARIANT_ID || "",
  PREMIUM_YEARLY: process.env.LEMONSQUEEZY_PREMIUM_YEARLY_VARIANT_ID || "",
};

// Store ID
export const LEMONSQUEEZY_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID || "";

/**
 * Generate checkout URL for a subscription
 */
export function getCheckoutUrl(
  variantId: string,
  userEmail?: string,
  customData?: Record<string, any>
) {
  const baseUrl = `https://${LEMONSQUEEZY_STORE_ID}.lemonsqueezy.com/checkout/buy/${variantId}`;

  const params = new URLSearchParams();

  if (userEmail) {
    params.append("checkout[email]", userEmail);
  }

  if (customData) {
    params.append("checkout[custom][user_data]", JSON.stringify(customData));
  }

  // Add checkout settings
  params.append("embed", "1"); // Enable embed mode
  params.append("media", "0"); // Hide media
  params.append("logo", "0"); // Hide logo
  params.append("desc", "0"); // Hide description
  params.append("discount", "0"); // Hide discount field
  params.append("dark", "1"); // Dark mode

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Get variant ID based on tier and billing cycle
 */
export function getVariantId(
  tier: string,
  billingCycle: "monthly" | "yearly" = "monthly"
): string {
  const key =
    `${tier.toUpperCase()}_${billingCycle.toUpperCase()}` as keyof typeof LEMONSQUEEZY_VARIANTS;
  return LEMONSQUEEZY_VARIANTS[key] || "";
}
