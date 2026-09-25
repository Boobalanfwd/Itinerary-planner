# Wander.AI ✈️ 🌍

> AI-powered intelligent trip & itinerary planning application built with Next.js 15, React 19, Google Gemini, Mapbox, and Prisma with PostgreSQL.

---

## 📖 Overview

**Wander.AI** crafts tailored travel itineraries in seconds. It combines Google Gemini AI with Mapbox geocoding, multi-day scheduling, interactive maps, weather awareness, and exportable trip plans.

### ✨ Key Features

- 🤖 **AI-Powered Itinerary Generation**: Day-by-day customized travel plans with morning, afternoon, and evening activities.
- 🗺️ **Interactive Maps & Route Visualization**: Seamless Mapbox integration showing places, points of interest, and routes.
- 💬 **Travel Assistant Chat**: Real-time conversational AI assistant to refine, ask questions, or modify plans.
- 🛡️ **Authentication & Permissions**: NextAuth with credentials and Google OAuth support.
- 📊 **Error Monitoring**: Comprehensive Sentry error monitoring and performance tracing.
- 💳 **Subscription & Pro Tier**: Lemon Squeezy integration for subscription management.

---

## 🚀 Quick Start & Local Setup

### Prerequisites

- **Node.js**: v18.18+ or v20+
- **PostgreSQL**: Local instance or hosted (e.g. Supabase, Neon)
- **API Keys**: Google Gemini API key, Mapbox token

### Step-by-Step Installation

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd Itinerary-planner
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Fill in your PostgreSQL `DATABASE_URL`, `NEXTAUTH_SECRET`, and `GEMINI_API_KEY`.

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Initialize database schema**:
   ```bash
   npx prisma generate
   npx prisma db push
   # or npx prisma migrate dev
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Environment Variables Reference

| Variable | Required | Description |
|---|:---:|---|
| `DATABASE_URL` | **Yes** | PostgreSQL connection URL |
| `NEXTAUTH_SECRET` | **Yes** | Secret for signing NextAuth JWTs (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | **Yes** | Base application URL (e.g. `http://localhost:3000`) |
| `GEMINI_API_KEY` | **Yes** | Google Gemini API key from Google AI Studio |
| `GEMINI_MODEL` | No | Model name (default: `gemini-2.5-flash`) |
| `NEXT_PUBLIC_MAPBOX_TOKEN`| No | Public Mapbox token (`pk.*`) for map rendering |
| `GOOGLE_CLIENT_ID` | No | Google OAuth Client ID for social sign-in |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth Client Secret |
| `SMTP_HOST` | No | SMTP host for transactional emails |
| `SMTP_PORT` | No | SMTP port (default `587`) |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password / app password |
| `LEMONSQUEEZY_API_KEY` | No | Lemon Squeezy API key for payments |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | No | Lemon Squeezy Webhook signing secret |
| `SENTRY_DSN` | No | Sentry DSN for server-side error monitoring |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry DSN for client-side error monitoring |
| `SENTRY_AUTH_TOKEN` | No | Sentry auth token for build-time source map upload |
| `SENTRY_ORG` | No | Sentry organization slug |
| `SENTRY_PROJECT` | No | Sentry project slug |

See [`.env.example`](./.env.example) for a pre-configured template with documentation.

---

## 🏗️ Architecture & Development Roadmap

- 📑 **Architecture & Growth Roadmap**: See [`PROJECT_GROWTH_PLAN.md`](./PROJECT_GROWTH_PLAN.md) for a deep dive into existing architecture, design patterns, and growth opportunities.
- 🗺️ **Phase Breakdown**: See [`IMPROVEMENT_PHASES.md`](./IMPROVEMENT_PHASES.md) for phased execution milestones.
- 📋 **Implementation Plan**: See [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) for the active sprint plan, tasks, and definition of done.

---

## 🧪 Testing & Validation

```bash
# TypeScript compilation check
npx tsc --noEmit

# Linting
npm run lint

# Production build check
npm run build
```
