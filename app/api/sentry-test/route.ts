import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

/**
 * POST /api/sentry-test
 * Triggers a test server-side exception reported to Sentry.
 */
export async function POST() {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  console.log("[Sentry Server Test] Sentry DSN present:", !!dsn);

  try {
    throw new Error(`Sentry Server Test Error: Wander.AI verified at ${new Date().toISOString()}`);
  } catch (error) {
    const eventId = Sentry.captureException(error, {
      tags: {
        source: "test_sentry_api",
        route: "/api/sentry-test",
      },
    });

    // CRITICAL for serverless / Next.js API routes: flush event before exiting!
    const flushed = await Sentry.flush(5000);
    console.log(`[Sentry Server Test] Event ID: ${eventId}, Flushed: ${flushed}`);

    return NextResponse.json({
      success: true,
      message: "Server error captured by Sentry",
      eventId,
      flushed,
      dsnConfigured: !!dsn,
    });
  }
}

export async function GET() {
  return POST();
}
