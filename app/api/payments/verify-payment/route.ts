/**
 * POST /api/payments/verify-payment
 *
 * Verifies the Razorpay payment signature after a successful checkout.
 * This is MANDATORY — never trust the frontend's payment status without
 * server-side HMAC-SHA256 signature verification.
 *
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 * The computed digest must match razorpay_signature exactly.
 *
 * Request body:
 *   { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 *
 * Response:
 *   200 { success: true, paymentId }  — verified, safe to fulfil order
 *   400 { success: false }            — signature mismatch or missing fields
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import crypto from "crypto";
import * as Sentry from "@sentry/nextjs";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // ── Auth guard ────────────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // ── Parse body ────────────────────────────────────────────────────────────
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      body as {
        razorpay_order_id?: string;
        razorpay_payment_id?: string;
        razorpay_signature?: string;
      };

    // ── Validate required fields ──────────────────────────────────────────────
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature",
        },
        { status: 400 }
      );
    }

    // ── Signature verification ────────────────────────────────────────────────
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error("[payments/verify] RAZORPAY_KEY_SECRET is not configured");
      return NextResponse.json(
        { success: false, error: "Payment system not configured" },
        { status: 503 }
      );
    }

    // Razorpay spec: HMAC-SHA256(order_id + "|" + payment_id, key_secret)
    const body_string = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body_string)
      .digest("hex");

    // Use constant-time comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(razorpay_signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    const isValid =
      signatureBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

    if (!isValid) {
      console.warn("[payments/verify] Signature mismatch", {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        userEmail: session.user.email,
      });

      Sentry.captureMessage("Razorpay signature mismatch detected", {
        level: "warning",
        tags: {
          route: "POST /api/payments/verify-payment",
          orderId: razorpay_order_id,
        },
        extra: { userEmail: session.user.email },
      });

      return NextResponse.json(
        {
          success: false,
          error:
            "Payment signature verification failed. This payment cannot be accepted.",
        },
        { status: 400 }
      );
    }

    // ── Payment is verified ───────────────────────────────────────────────────
    // Upgrade the user's subscription tier and role in the database
    const upgradedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        subscriptionTier: "PREMIUM",
        role: "PREMIUM",
        subscriptionStatus: "active",
        subscriptionStart: new Date(),
        subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        role: true,
      },
    });

    console.info("[payments/verify] Payment verified and user upgraded successfully", {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      userEmail: session.user.email,
      newTier: upgradedUser.subscriptionTier,
    });

    return NextResponse.json({
      success: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      message: "Payment verified successfully",
    });
  } catch (error: any) {
    console.error("[payments/verify] Unexpected error:", error);

    Sentry.captureException(error, {
      tags: { route: "POST /api/payments/verify-payment" },
    });

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to verify payment",
      },
      { status: 500 }
    );
  }
}
