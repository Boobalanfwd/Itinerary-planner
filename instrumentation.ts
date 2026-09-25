/**
 * instrumentation.ts (Root Next.js Instrumentation Hook)
 * Loaded once at server startup — inits Sentry server-side and catches unhandled errors.
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export async function onRequestError(
  err: unknown,
  _request: unknown,
  _context: unknown
) {
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureException(err);
}
