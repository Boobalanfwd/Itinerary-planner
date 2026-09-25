/**
 * sentry.client.config.ts
 * Sentry SDK initialisation for the browser (client-side).
 * This file is automatically imported by Next.js for client bundles.
 * See: https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  "https://ff56689599c6020af5ac855e47ab0424@o4512140035489792.ingest.us.sentry.io/4512140041322496";

Sentry.init({
  dsn: SENTRY_DSN,

  // ── Environment & Release ───────────────────────────────────────
  environment: process.env.NODE_ENV ?? "development",

  // ── Performance Monitoring ──────────────────────────────────────
  // Capture 100% of transactions in dev; 10% in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // ── Session Replay ───────────────────────────────────────────────
  // Record 10% of sessions; 100% when an error occurs
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // ── Integrations ────────────────────────────────────────────────
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // ── Ignored Errors ──────────────────────────────────────────────
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
    "NetworkError",
    "Failed to fetch",
    "Load failed",
    "Abort fetching component for route",
    "Route cancelled",
  ],

  // ── Debug ────────────────────────────────────────────────────────
  debug: false,
});
