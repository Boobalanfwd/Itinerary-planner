/**
 * lib/env.ts
 * Centralised, typed environment variable validation.
 * Import this at the top of any server-side file that needs env vars.
 * All missing required variables will throw at startup — never silently undefined.
 */

import { z } from "zod";

const envSchema = z.object({
  // ── Database ────────────────────────────────────────────────
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // ── NextAuth ────────────────────────────────────────────────
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),
  NEXTAUTH_SECRET: z.string().min(16, "NEXTAUTH_SECRET must be at least 16 characters"),

  // ── Google OAuth ────────────────────────────────────────────
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),

  // ── Gemini AI ───────────────────────────────────────────────
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),

  // ── SMTP (email) ────────────────────────────────────────────
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_SECURE: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_NAME: z.string().default("Wander.AI"),
  SMTP_FROM_EMAIL: z.string().email().optional(),

  // ── Maps (optional — Mapbox token for legacy, Nominatim needs no key) ──
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().optional(),

  // ── Node environment ────────────────────────────────────────
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // ── Sentry (optional — app works without it, but errors are invisible) ──
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(), // Required for source map uploads at build time
  SENTRY_ORG: z.string().optional(),        // Your Sentry organisation slug
  SENTRY_PROJECT: z.string().optional(),    // Your Sentry project slug

  // ── Upstash Redis (Edge Rate Limiting) ──────────────────────────
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

/**
 * Parsed and validated environment variables.
 * Throws a descriptive error on startup if any required var is missing.
 */
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  const formatted = _env.error.format();
  console.error("❌ Invalid environment variables:\n", JSON.stringify(formatted, null, 2));
  throw new Error("Invalid environment configuration. Check the logs above.");
}

export const env = _env.data;
