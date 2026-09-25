import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // ── Source Maps ────────────────────────────────────────────────────
  // Upload source maps to Sentry so stack traces show TS line numbers.
  // Requires SENTRY_AUTH_TOKEN environment variable.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // ── Silent in CI ───────────────────────────────────────────────────
  // Suppress Sentry CLI output during builds unless debugging
  silent: !process.env.CI,

  // ── Webpack Options ────────────────────────────────────────────────
  webpack: {
    // Automatically wrap API routes for tracing
    autoInstrumentServerFunctions: true,
    // Tree-shake Sentry logger statements in production builds
    treeshake: {
      removeDebugLogging: true,
    },
  },

  // ── Source Map Upload ──────────────────────────────────────────────
  // Automatically delete source maps after upload (don't ship to users)
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
