/**
 * sentry.edge.config.ts
 * Sentry SDK initialisation for Next.js Edge Runtime (middleware, edge routes).
 * See: https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NODE_ENV ?? "development",

  // Edge runtime has stricter limits — keep sample rate low
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,

  debug: process.env.NODE_ENV === "development",
});
