/**
 * instrumentation.ts (Next.js Instrumentation Hook)
 * Loaded once at server startup — the correct place to init Sentry server-side.
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

/**
 * onRequestError — called by Next.js for every unhandled request error.
 * This catches errors in Server Components, API routes, and route handlers
 * that would otherwise be silently swallowed.
 */
export async function onRequestError(
  err: unknown,
  _request: unknown,
  _context: unknown
) {
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureException(err);
}
