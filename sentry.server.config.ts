/**
 * sentry.server.config.ts
 * Sentry SDK initialisation for Node.js / server-side rendering.
 * This file is automatically imported by Next.js for server bundles.
 * See: https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN =
  process.env.SENTRY_DSN ||
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  "https://ff56689599c6020af5ac855e47ab0424@o4512140035489792.ingest.us.sentry.io/4512140041322496";

Sentry.init({
  dsn: SENTRY_DSN,

  // ── Environment ─────────────────────────────────────────────────
  environment: process.env.NODE_ENV ?? "development",

  // ── Performance Monitoring ──────────────────────────────────────
  // Capture 100% of server transactions in dev; 10% in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // ── Spotlight ───────────────────────────────────────────────────
  // Keep disabled by default unless explicitly running Spotlight sidecar daemon (port 8969)
  spotlight: process.env.SENTRY_SPOTLIGHT === "true",

  // ── Debug ────────────────────────────────────────────────────────
  debug: false,
});
