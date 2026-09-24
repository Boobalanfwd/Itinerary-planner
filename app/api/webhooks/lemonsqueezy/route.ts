import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { SubscriptionTier } from "@prisma/client";

/**
 * Verify Lemonsqueezy webhook signature
 */
function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get("x-signature") || "";
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "";

    // Verify webhook signature
    if (secret && !verifySignature(payload, signature, secret)) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(payload);
    const eventName = event.meta?.event_name;

    console.log("Lemonsqueezy webhook received:", eventName);

    // Handle different event types
    switch (eventName) {
      case "subscription_created":
      case "subscription_updated":
        await handleSubscriptionUpdate(event);
        break;

      case "subscription_cancelled":
        await handleSubscriptionCancelled(event);
        break;

      case "subscription_resumed":
        await handleSubscriptionResumed(event);
        break;

      case "subscription_expired":
        await handleSubscriptionExpired(event);
        break;

      case "subscription_payment_success":
        await handlePaymentSuccess(event);
        break;

      case "subscription_payment_failed":
        await handlePaymentFailed(event);
        break;

      default:
        console.log("Unhandled event type:", eventName);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdate(event: any) {
  const subscription = event.data;
  const customData = subscription.attributes.custom_data || {};
  const userId = customData.user_data?.userId;

  if (!userId) {
    console.error("No userId in webhook data");
    return;
  }

  const tier = customData.user_data?.tier as SubscriptionTier;
  const status = subscription.attributes.status;
  const endsAt =
    subscription.attributes.renews_at || subscription.attributes.ends_at;

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: tier,
      subscriptionStatus: status,
      subscriptionStart: new Date(subscription.attributes.created_at),
      subscriptionEnd: endsAt ? new Date(endsAt) : null,
      // Store Lemonsqueezy subscription ID
      stripeCustomerId: subscription.id, // Reusing this field for Lemonsqueezy ID
      itinerariesThisMonth: 0,
      lastResetDate: new Date(),
    },
  });

  console.log(`Subscription updated for user ${userId}: ${tier} (${status})`);
}

async function handleSubscriptionCancelled(event: any) {
  const subscription = event.data;
  const customData = subscription.attributes.custom_data || {};
  const userId = customData.user_data?.userId;

  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: "cancelled",
    },
  });

  console.log(`Subscription cancelled for user ${userId}`);
}

async function handleSubscriptionResumed(event: any) {
  const subscription = event.data;
  const customData = subscription.attributes.custom_data || {};
  const userId = customData.user_data?.userId;

  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: "active",
    },
  });

  console.log(`Subscription resumed for user ${userId}`);
}

async function handleSubscriptionExpired(event: any) {
  const subscription = event.data;
  const customData = subscription.attributes.custom_data || {};
  const userId = customData.user_data?.userId;

  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: "FREE",
      subscriptionStatus: "expired",
      subscriptionEnd: new Date(),
    },
  });

  console.log(`Subscription expired for user ${userId}, downgraded to FREE`);
}

async function handlePaymentSuccess(event: any) {
  console.log("Payment successful:", event.data.id);
  // You can add additional logic here, like sending confirmation emails
}

async function handlePaymentFailed(event: any) {
  const subscription = event.data;
  const customData = subscription.attributes.custom_data || {};
  const userId = customData.user_data?.userId;

  if (!userId) return;

  // You might want to send an email notification here
  console.log(`Payment failed for user ${userId}`);
}
