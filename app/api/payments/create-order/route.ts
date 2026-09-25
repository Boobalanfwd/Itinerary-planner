/**
 * POST /api/payments/create-order
 *
 * Creates a Razorpay order on the server side.
 * The KEY_SECRET never leaves this file — it is only used here
 * to authenticate with the Razorpay REST API.
 *
 * Request body:
 *   { amount: number (paise), currency?: string, receipt?: string, notes?: Record<string,string> }
 *
 * Response:
 *   { id, amount, currency }  — the order_id to pass to the frontend checkout
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import Razorpay from "razorpay";
import * as Sentry from "@sentry/nextjs";

// ── Razorpay client (server-side only) ───────────────────────────────────────
function getRazorpayClient(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error(
      "Razorpay credentials are not configured. " +
        "Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file."
    );
  }

  return new Razorpay({ key_id, key_secret });
}

// ── Constants ─────────────────────────────────────────────────────────────────
const MINIMUM_AMOUNT_PAISE = 100; // ₹1 minimum
const DEFAULT_CURRENCY = "INR";
const MAX_AMOUNT_PAISE = 1_000_000_00; // ₹1 crore safety cap

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

    // ── Parse & validate body ─────────────────────────────────────────────────
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const {
      amount,
      currency = DEFAULT_CURRENCY,
      receipt,
      notes = {},
    } = body as {
      amount: unknown;
      currency?: string;
      receipt?: string;
      notes?: Record<string, string>;
    };

    // Validate amount
    if (typeof amount !== "number" || !Number.isInteger(amount)) {
      return NextResponse.json(
        { success: false, error: "amount must be an integer (paise)" },
        { status: 400 }
      );
    }

    if (amount < MINIMUM_AMOUNT_PAISE) {
      return NextResponse.json(
        {
          success: false,
          error: `amount must be at least ${MINIMUM_AMOUNT_PAISE} paise (₹1)`,
          minimum: MINIMUM_AMOUNT_PAISE,
        },
        { status: 400 }
      );
    }

    if (amount > MAX_AMOUNT_PAISE) {
      return NextResponse.json(
        { success: false, error: "amount exceeds maximum allowed" },
        { status: 400 }
      );
    }

    // ── Create Razorpay order ─────────────────────────────────────────────────
    const razorpay = getRazorpayClient();

    const order = await razorpay.orders.create({
      amount,
      currency: currency.toUpperCase(),
      receipt: receipt ?? `rcpt_${Date.now()}`,
      notes: {
        ...notes,
        userEmail: session.user.email,
      } as Record<string, string>,
    });

    return NextResponse.json({
      success: true,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: (order as any).receipt,
    });
  } catch (error: any) {
    console.error("[payments/create-order] Error:", error);

    Sentry.captureException(error, {
      tags: { route: "POST /api/payments/create-order" },
    });

    // Surface Razorpay API errors clearly
    const rzpError = error?.error;
    if (rzpError) {
      return NextResponse.json(
        {
          success: false,
          error: rzpError.description || "Razorpay API error",
          code: rzpError.code,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create payment order" },
      { status: 500 }
    );
  }
}
