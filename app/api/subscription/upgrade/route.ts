import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { getCheckoutUrl, getVariantId } from "@/app/lib/lemonsqueezy";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tier, billingCycle = "monthly" } = await req.json();

    if (!tier || !["PRO", "PREMIUM"].includes(tier.toUpperCase())) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    // Check if Lemonsqueezy is configured
    if (
      !process.env.LEMONSQUEEZY_API_KEY ||
      !process.env.LEMONSQUEEZY_STORE_ID
    ) {
      return NextResponse.json(
        {
          error: "Payment system not configured yet. Please contact support.",
          details:
            "Lemonsqueezy API credentials are missing. Please set LEMONSQUEEZY_API_KEY and LEMONSQUEEZY_STORE_ID in your .env file.",
        },
        { status: 503 }
      );
    }

    // Get the appropriate variant ID
    const variantId = getVariantId(tier, billingCycle);

    if (!variantId || variantId.includes("your_")) {
      return NextResponse.json(
        {
          error: "Product not configured yet. Please contact support.",
          details: `Missing variant ID for ${tier} ${billingCycle}. Please set up your products in Lemonsqueezy and update .env file.`,
        },
        { status: 503 }
      );
    }

    // Generate checkout URL with user data
    const checkoutUrl = getCheckoutUrl(
      variantId,
      session.user.email || undefined,
      {
        userId: session.user.id,
        tier: tier.toUpperCase(),
        billingCycle,
      }
    );

    // Return checkout URL for client to redirect
    return NextResponse.json({
      success: true,
      checkoutUrl,
      message: "Redirecting to checkout...",
    });
  } catch (error) {
    console.error("Upgrade error:", error);
    return NextResponse.json(
      { error: "Failed to process upgrade" },
      { status: 500 }
    );
  }
}
