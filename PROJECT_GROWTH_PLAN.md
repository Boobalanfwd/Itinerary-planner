# PROJECT_GROWTH_PLAN.md
> Last updated: 2026-09-24 | Authored by: Senior Product Strategist & Software Architect
> Based on full codebase analysis of the `Itinerary-planner` workspace.

---

## 1. Project Overview

### What It Does
**Wander.AI** is an AI-powered travel itinerary generator and planner. Users describe a trip (destination, duration, budget, interests, pace) — either through a structured multi-step form or natural language chat — and the app produces a day-by-day itinerary enriched with real place data, weather context, and an interactive map. Generated itineraries are persisted to a database, shareable via public links, and manageable from a personal dashboard.

### Who It's For
- **Primary users:** Individual travelers (solo, couples, families, friend groups) who want a fast, intelligent starting point for trip planning.
- **Secondary users:** Travel enthusiasts who browse and clone community itineraries via a Marketplace.
- **Monetization target:** Freemium SaaS model — free users get 5 itineraries/month; PRO (50/month) and PREMIUM (unlimited) tiers unlock more.

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4, `tw-animate-css`, Radix UI primitives |
| AI | Google Gemini via `@google/genai` SDK (model configurable via `GEMINI_MODEL` env) |
| Database | PostgreSQL via Prisma ORM 5.22 |
| Auth | NextAuth.js v4 with Prisma adapter; credential + OTP email flow |
| Maps | Mapbox GL + Leaflet (dual-provider), Nominatim geocoding |
| Payments | Lemon Squeezy (`@lemonsqueezy/lemonsqueezy.js`) + webhook handler |
| UI Extras | Framer Motion, dnd-kit (drag & drop), Sonner toasts, cmdk (command palette) |
| Calendar | `ical-generator` for iCal export |
| Weather | Open-Meteo (free, no API key) |
| Validation | Zod schemas (`schemas/trip.ts`, `schemas/activity.ts`) |
| Job Tracking | Custom `GenerationJob` model + SSE streaming (`/api/jobs`) |
| Rate Limiting | In-database monthly quota check (`lib/rateLimit.ts`) |

---

## 2. Current State Analysis

### 2.1 Existing Features

**Core Generation**
- [x] Structured trip-creation form (`components/trip-creation-form.tsx`) — 9 popular destination presets with country flags, 5 duration presets, 4 budget tiers, 12 interest categories, pace selector, free-text notes
- [x] Natural-language AI chat assistant (`app/api/chat/route.ts`, `AIChatAssistant` component) that transitions to full generation via `[GENERATE_READY]` signal
- [x] Async generation pipeline with `GenerationJob` DB tracking and SSE progress streaming (`/api/jobs`)
- [x] Anti-hallucination prompt engineering — geo-locking, venue naming conventions, interest-to-instruction mapping (`app/api/generate/route.ts`)
- [x] Real-time weather context injection during generation via Open-Meteo (`lib/weather.ts`)
- [x] Place verification & coordinate enrichment post-generation (`lib/maps/placeVerification.ts`, Nominatim geocoder)

**Itinerary Management**
- [x] Full CRUD: create, view, update, archive itineraries (`app/api/itineraries/`)
- [x] Drag-and-drop activity reordering (`@dnd-kit`, `SortableActivityCard.tsx`)
- [x] Edit activity dialog, add stop dialog, regenerate-day dialog (`components/itinerary/`)
- [x] AI refinement bar for iterative improvements (`RefinementBar.tsx`)
- [x] Split view: itinerary list + interactive Mapbox map side-by-side (`SplitItineraryView.tsx`)
- [x] Budget tracking & expense logging (`BudgetDialog.tsx`, `BudgetSummaryCard.tsx`, `ExpenseLogCard.tsx`, Prisma `Budget`/`Expense` models)
- [x] iCal and Google Calendar export (`app/api/itineraries/[id]/export`, `/calendar`)
- [x] Public share link with `shareToken` (`/api/itineraries/[id]/share`)
- [x] Itinerary cloning from marketplace (`/api/itineraries/[id]/clone`)

**Social & Marketplace**
- [x] Public marketplace page (`app/marketplace/`)
- [x] Likes, reviews with ratings, clone counts (`ItineraryLike`, `ItineraryReview`, `ItineraryClone` models)
- [x] Social follow/follower system (`Follow` model, `followerCount`/`followingCount` on User)
- [x] User profiles with travel style tags, visited countries count, social links (`UserProfile` model)
- [x] Saved itineraries with optional folder grouping

**User & Auth**
- [x] Email/password credentials with OTP email verification (Nodemailer, `OtpVerification` model)
- [x] Forgot/reset password flow (`app/auth/forgot-password/`, `/reset-password`)
- [x] NextAuth session management; protected routes via `middleware.ts`
- [x] User preferences (currency, temperature unit, distance unit, travel style, notifications)

**Subscription & Billing**
- [x] 3-tier model: FREE (5/mo), PRO (50/mo), PREMIUM (unlimited) — enforced in `lib/rateLimit.ts`
- [x] Lemon Squeezy payment integration with webhook handler (`app/api/webhooks/lemonsqueezy/`)
- [x] Upgrade modal & pricing page (`app/pricing/page.tsx`, `UpgradeModal` component)
- [x] Subscription status API (`app/api/subscription/status/`)

**UX Polish**
- [x] PWA install prompt (`InstallPrompt` component)
- [x] Dark/light theme toggle (`next-themes`)
- [x] `SmartRecommendations` component for follow-up destination suggestions
- [x] Framer Motion animations throughout
- [x] Price alert schema in DB (`PriceAlert` model) — UI not yet confirmed
- [x] SEO: `robots.ts`, `sitemap.ts` in app root

---

### 2.2 Architecture Summary

```
+--------------------------------------------------+
|  Client (Next.js App Router / React 19)          |
|  - Landing page (single-page state machine)      |
|  - Dashboard (server + client components)        |
|  - Auth pages, Pricing, Marketplace              |
|  - Components: form, map, itinerary, shared, ui  |
+------------------------+-------------------------+
                         | API Routes (Next.js)
+------------------------v-------------------------+
|  /api/generate   /api/chat     /api/itineraries  |
|  /api/trips      /api/days     /api/activities   |
|  /api/places     /api/weather  /api/jobs (SSE)   |
|  /api/users      /api/auth     /api/webhooks     |
|  /api/subscription /api/marketplace /api/alerts  |
+------------------------+-------------------------+
                         |
+------------------------v-------------------------+
|  Services (app/services/)                        |
|  - GeminiService: LLM calls, structured JSON,   |
|    Zod validation, retry logic                   |
|  - ItineraryService: DB persistence, mapping    |
|  - ImageService: cover image handling            |
+------------------------+-------------------------+
                         |
+------------------------v-------------------------+
|  Repositories (lib/repositories/)               |
|  - itineraryRepository, jobRepository,          |
|    placeRepository, userRepository              |
+------------------------+-------------------------+
                         |
+------------------------v-------------------------+
|  PostgreSQL (Prisma ORM)                        |
|  16 models: User, Itinerary, Day, Activity,     |
|  Budget, Expense, Place, Follow, Review, Like,  |
|  Clone, PriceAlert, GenerationJob, OTP, etc.    |
+---------+-----------------------------+----------+
          |                             |
   Google Gemini API             External APIs
   (LLM generation)              Open-Meteo, Nominatim,
                                 Mapbox, Lemon Squeezy
```

---

### 2.3 Strengths

1. **Thoughtful AI architecture** — Two-phase approach (LLM outputs names only, then Nominatim enriches coordinates) eliminates hallucinated lat/lngs. Prompt engineering is sophisticated with anti-hallucination guards.
2. **Async job pipeline** — `GenerationJob` model + SSE streaming gives great UX for long-running AI calls.
3. **Schema-first validation** — Zod schemas (`schemas/trip.ts`, `schemas/activity.ts`) and Gemini structured output (Zod -> `@google/genai` Type) prevent bad data from ever reaching the DB.
4. **Rich data model** — The Prisma schema covers a lot of ground (social, budget, collaboration, price alerts, places cache) indicating strong product vision.
5. **Dual map providers** — Both Mapbox and Leaflet are implemented, allowing flexibility.
6. **PWA ready** — `InstallPrompt` + manifest support means mobile users can install the app.
7. **Monetisation wired** — Lemon Squeezy + webhook + quota enforcement is already in place.

---

### 2.4 Weaknesses, Technical Debt & Missing Pieces

#### Critical / High Risk

| Area | Issue | Evidence |
|---|---|---|
| **No tests** | Zero test files found anywhere in the project (no `*.test.ts`, `*.spec.ts`, no `__tests__` dir) | `package.json` has no `jest`, `vitest`, `playwright`, or `cypress` entries |
| **README is a stub** | `README.md` is the default Next.js template with zero project-specific content | `README.md` lines 1-37 |
| **Rate limiting is DB-only** | Monthly quota hits the DB on every request; no in-memory or edge layer protection against burst abuse | `lib/rateLimit.ts` |
| **Price Alerts UI missing** | `PriceAlert` model is complete but the alert-triggering job and UI are not confirmed in place | Schema exists, `/api/alerts/route.ts` is only 1.8 KB |
| **Sync generation fallback** | `processGeneration()` can be called synchronously, which would block the Node process for the full LLM call duration (potentially 15-30s) | `app/api/generate/route.ts` lines 222-228 |

#### Medium Risk / Technical Debt

| Area | Issue |
|---|---|
| **Error handling is console-only** | Errors are logged but no centralised error tracking (Sentry, Datadog) |
| **`any` types** | `handleSaveActivity`, `handleViewMap`, `startEditing` in `app/page.tsx` use `any` |
| **Activity `time` stored as string** | `Activity.time` is `String` ("09:00 AM"); date/time arithmetic, sorting, and timezone handling are fragile |
| **Collaboration is schema-only** | `ItineraryCollaborator` model exists but real-time collaborative editing (invitations, live cursors) is not visible in the UI |
| **Single AI provider** | Only Google Gemini; no fallback to OpenAI or Anthropic if Gemini is unavailable |
| **No image optimisation pipeline** | `coverImage` / `images` fields store raw URLs; no CDN, resizing, or WebP conversion |
| **`stripeCustomerId` vs Lemon Squeezy** | Schema has `stripeCustomerId` but payments use Lemon Squeezy — naming mismatch creates confusion |
| **Dev route is public** | `/dev` prefix is whitelisted in middleware for everyone, not just `ADMIN` users |

#### Low Risk / Missing Polish
- No i18n / localisation support
- No accessibility (a11y) audit has been performed
- `check_db.ts` and `test-api.js` are root-level debug scripts — should be moved to `scripts/`
- `tsInstall` directory at root appears to be leftover scaffolding

---

## 3. Growth Ideas

### 3.1 New Features

---

#### Feature 1: Real-Time Collaborative Trip Planning
**What:** Allow multiple users to edit an itinerary simultaneously (add/reorder/delete activities) with live presence indicators (avatars, cursors).
**Why it matters:** Travel is social. The `ItineraryCollaborator` model (OWNER/EDITOR/VIEWER roles) and the `Follow` system are already in the schema — this is the natural next step to activate that investment.
**How it fits:** Add a WebSocket or Pusher channel keyed on `itineraryId`. `SplitItineraryView.tsx` and `SortableActivityList.tsx` would receive optimistic updates. The existing collaborator invite API just needs a UI surface.

---

#### Feature 2: Price Alert Activation & Notifications
**What:** Complete the price alert loop: a cron job checks flight/hotel prices via an external API (e.g. Amadeus Flight Offers, Booking.com API), compares against `targetPrice`, and emails users when prices drop.
**Why it matters:** This is a high-retention feature. A user who sets a price alert returns to the app when they receive the email. The `PriceAlert` model is fully designed; only the job runner and email template are missing.
**How it fits:** Use the existing `GenerationJob` pattern for a recurring `PriceCheckJob`. Nodemailer is already wired (`nodemailer` in dependencies). Add `/api/jobs/price-check` triggered by a Vercel Cron.

---

#### Feature 3: Offline Mode & Progressive Enhancement
**What:** Cache the current itinerary in `localStorage` / `IndexedDB` so travelers can view their plans without internet access (airports, foreign data roaming).
**Why it matters:** The PWA install prompt already exists (`InstallPrompt` component). Completing the PWA story with a service worker and offline cache makes the installed app genuinely useful.
**How it fits:** Add a `next-pwa` or custom service worker. The itinerary JSON is already fetched client-side, so intercepting and caching it is straightforward.

---

#### Feature 4: Multi-City / Multi-Destination Trip Support
**What:** Let users chain multiple cities into a single trip (e.g. Paris -> Rome -> Barcelona, 3 days each), with AI-generated travel legs between cities.
**Why it matters:** Most trips beyond 7 days involve multiple stops. Currently the `destination` field is a single string and the generation prompt enforces a single geo-lock — a key missing use case.
**How it fits:** Extend `TripCreateSchema` with a `destinations: string[]` array. Update `GeminiService` prompt to sequence cities. The `Day` model already has a `date` field, so travel-day activities (flights, trains) can be inserted using the existing `ActivityType.TRANSPORTATION`.

---

#### Feature 5: AI-Powered Packing List Generator
**What:** After generating an itinerary, let users click "Generate Packing List" which analyses the activities, weather, and destination and returns a categorised checklist.
**Why it matters:** Extremely high utility / low effort. Packing lists are one of the top travel planning searches on Google. It creates an additional touchpoint inside the app post-itinerary creation.
**How it fits:** A new `/api/itineraries/[id]/packing-list` route calls Gemini with the itinerary JSON + weather data (already fetched in `lib/weather.ts`). Store the list in the itinerary's `metadata: Json?` field — no schema migration needed.

---

#### Feature 6: Destination Inspiration Feed ("Discover")
**What:** A curated, algorithm-ranked feed of public itineraries sortable by: trending (views/likes last 7 days), season match, destination, budget tier, and trip duration.
**Why it matters:** Transforms Wander.AI from a generator into a destination discovery platform, increasing organic traffic and user time-in-app. The marketplace page exists but appears to be basic.
**How it fits:** The `Itinerary` model already has `viewCount`, `likeCount`, `cloneCount`, `averageRating`, `isPublic`, and `tags`. A single query with ordering and filtering is all that's needed. Add `cover_image` display to the marketplace cards.

---

#### Feature 7: "Trip Advisor" Chat on Existing Itineraries
**What:** Inside a saved itinerary, allow the user to chat with an AI that has full context of their itinerary ("Can you swap Day 2 lunch for something vegan?" -> AI returns the modified activity JSON and applies it).
**Why it matters:** Currently the `RefinementBar.tsx` supports basic AI tweaks, but it's not conversational. A chat sidebar with itinerary context dramatically increases editing power and engagement.
**How it fits:** The `/api/chat` endpoint already exists; extend it to accept `itineraryContext` payload. The `AIChatAssistant` component and `SplitItineraryView.tsx` provide the UI scaffolding.

---

#### Feature 8: Itinerary PDF Export & Print View
**What:** A beautifully formatted, one-click PDF download of the full itinerary with maps, weather, budget summary, and activity details.
**Why it matters:** Many travelers print or save itineraries as PDFs for offline reference or to share with travel companions who don't use the app. iCal export exists but PDF is the most universally requested format.
**How it fits:** Use `@react-pdf/renderer` or a server-side Puppeteer/Chrome headless call. A new `/api/itineraries/[id]/export/pdf` route (parallel to the existing `/export` and `/calendar` routes already allowed through middleware).

---

#### Feature 9: Flight Search Integration
**What:** Surface real flight options (price, airline, duration) directly within the itinerary editor for any FLIGHT-type activity.
**Why it matters:** Users currently see flight info as AI-generated placeholders. Connecting to a real flight search API (Amadeus, Skyscanner, or Kiwi.com) adds immediate commercial value and opens affiliate revenue.
**How it fits:** The `flights` app route exists (`app/flights/`) and the `/api/flights/track/` is in place. `PriceAlert` model already has flight alert criteria stored as JSON. This is building on established ground.

---

#### Feature 10: Travel Group Voting on Activities
**What:** When an itinerary is shared with collaborators, each person can vote thumbs-up / thumbs-down on individual activities. The itinerary owner sees vote tallies and can swap out low-rated activities.
**Why it matters:** Group travel is hard because everyone has different preferences. This solves a real pain point and makes the collaboration feature stickier.
**How it fits:** Add an `ActivityVote` model (activityId, userId, vote). Surface in `SortableActivityCard.tsx`. No fundamental architecture change required.

---

### 3.2 UX / UI Improvements

1. **Onboarding flow** — New users see a 3-step tour after first sign-up: (1) generate your first trip, (2) explore the map, (3) share or export. Currently there is no onboarding.
2. **Progress bar on generation** — The `GenerationJob.progress` (0-100) and `step` fields are stored; surface a live step-label progress bar in the UI (the SSE stream is already there).
3. **Mobile-optimised itinerary view** — `SplitItineraryView.tsx` is 31 KB and appears desktop-first; a swipeable card view for mobile would improve the app experience significantly.
4. **Keyboard shortcuts** — Add `?` to open a shortcut panel, `G` to generate, `M` to toggle map. The `cmdk` package is already installed.
5. **Activity cards visual upgrade** — Show small inline map thumbnails and weather icons on activity cards based on activity type and time of day.
6. **Empty state illustrations** — Add meaningful empty states in the dashboard (no itineraries yet, no favourites yet) instead of blank panels.
7. **Undo / redo for edits** — When reordering or deleting activities with dnd-kit, provide an undo toast (Sonner is already configured).

---

### 3.3 Performance & Scalability Improvements

1. **Edge-layer rate limiting** — Move quota checks from the DB (`lib/rateLimit.ts`) to Upstash Redis or Vercel KV so burst requests don't hammer PostgreSQL. The current implementation does a DB write on every single request.
2. **React Query caching** — `@tanstack/react-query` is installed but its usage scope is unclear. Centralise all data fetching through React Query with stale-while-revalidate for the dashboard and itinerary views.
3. **Prisma connection pooling** — At scale, Next.js serverless functions exhaust DB connections rapidly. Add `@prisma/adapter-pg` (already in `package.json`) properly with PgBouncer or use Prisma Accelerate.
4. **Lazy-load Mapbox** — `mapbox-gl` is a heavy bundle (~250 KB). The `MapboxMapView.tsx` wraps `MapboxMapInner.tsx` in dynamic import — verify `ssr: false` is set and tree-shaking is working.
5. **Image CDN** — Route all cover images and user-uploaded photos through Cloudinary or Vercel Image Optimization instead of storing raw URLs.
6. **Incremental Static Regeneration for Marketplace** — The marketplace page (`/marketplace`) can be ISR with a 60s revalidation window instead of fetching on every request.
7. **Database indexes review** — The schema has good compound indexes, but `Activity` has no index on `(dayId, position)` which is the primary sort order for rendering.

---

### 3.4 Integrations

| Integration | Value | Complexity |
|---|---|---|
| **Google OAuth / Apple Sign-In** | Reduce signup friction dramatically | Low (NextAuth provider config) |
| **Amadeus Flight API** | Real flight prices in itinerary | Medium |
| **Booking.com / Hotels.com affiliate** | Hotel search + affiliate revenue | Medium |
| **Google Places API** | Richer place photos, ratings, hours | Medium (replace Nominatim for enrichment) |
| **WhatsApp / Telegram share** | One-tap itinerary sharing | Low |
| **Notion / Google Docs export** | Power-user export format | Medium |
| **Zapier / Make webhooks** | Connect to user's own tools | Medium |
| **Stripe** | Migrate from Lemon Squeezy or add as alternative | Low (schema already has `stripeCustomerId`) |
| **Sentry** | Error monitoring (critical missing piece) | Low |

---

### 3.5 Monetisation & User Growth

1. **Affiliate booking commissions** — Deep-link hotel and flight results to Booking.com/Skyscanner with affiliate codes. Booking.com affiliate pays ~4% commission.
2. **Itinerary Marketplace paid templates** — Let travel bloggers and professional planners sell premium itineraries (e.g. "$4.99 for a curated 10-day Japan itinerary"). Lemon Squeezy can handle per-product checkout.
3. **"Powered by Wander.AI" embed widget** — Let travel blogs embed a trip generator widget. Drives signups from high-intent travel content audiences.
4. **Corporate / Team plan tier** — Target corporate travel teams (10+ seats, shared itineraries, expense tracking). Higher ACV than consumer.
5. **Referral program** — "Invite a friend, both get +5 free itineraries." Easy to implement with the existing User and usage-tracking models.
6. **SEO-driven destination landing pages** — Auto-generate static pages like `/destinations/tokyo-japan` using Gemini + ISR, targeting "Tokyo 5 day itinerary" keywords (millions of monthly searches).
7. **Email newsletter with "Trip Inspiration"** — Weekly email to registered users with trending itineraries from the marketplace. Uses Nodemailer already in the stack.

---

## 4. Prioritization Matrix

| # | Idea | Impact | Effort | Priority |
|---|---|---|---|---|
| 1 | Add automated tests (unit + integration) | High | Med | **P1** |
| 2 | Fix README & developer documentation | Med | Low | **P1** |
| 3 | Edge-layer rate limiting (Redis/KV) | High | Low | **P1** |
| 4 | Error monitoring (Sentry) | High | Low | **P1** |
| 5 | Packing list generator | High | Low | **P1** |
| 6 | PDF export | High | Med | **P1** |
| 7 | Onboarding flow for new users | High | Med | **P1** |
| 8 | Destination landing pages (SEO) | High | Med | **P1** |
| 9 | Price alert job + email notification | High | Med | **P1** |
| 10 | Mobile-optimised itinerary view | High | Med | **P1** |
| 11 | Google / Apple OAuth | High | Low | **P1** |
| 12 | Trip Advisor chat on saved itinerary | High | Med | **P2** |
| 13 | Real-time collaborative editing | High | High | **P2** |
| 14 | Multi-city trip support | High | High | **P2** |
| 15 | Flight search integration (Amadeus) | High | High | **P2** |
| 16 | Discover / Inspiration feed | Med | Low | **P2** |
| 17 | Undo/redo for activity edits | Med | Low | **P2** |
| 18 | React Query caching overhaul | Med | Med | **P2** |
| 19 | Keyboard shortcuts (cmdk) | Med | Low | **P2** |
| 20 | Referral program | High | Med | **P2** |
| 21 | Activity voting for groups | Med | Med | **P2** |
| 22 | Hotel affiliate integration | High | High | **P2** |
| 23 | Marketplace paid templates | Med | High | **P3** |
| 24 | Corporate / team plan | High | High | **P3** |
| 25 | Notion / Google Docs export | Low | Med | **P3** |
| 26 | Embed widget for travel blogs | Med | High | **P3** |
| 27 | i18n / localisation | Med | High | **P3** |
| 28 | Zapier / Make integration | Low | Med | **P3** |
| 29 | Offline mode (service worker) | Med | High | **P3** |
| 30 | WhatsApp / Telegram share | Low | Low | **P3** |

---

## 5. Roadmap

### Phase 1: Quick Wins (Weeks 1-2)

> Goal: Fix critical gaps, reduce risk, and ship high-ROI features with minimal effort.

- [ ] **W1D1-2** — Add Sentry (`@sentry/nextjs`) for error tracking; instrument `app/api/generate/route.ts` and `geminiService.ts`
- [ ] **W1D2-3** — Replace `stripeCustomerId` field comment in schema with `paymentProviderId` and document it
- [ ] **W1D3-4** — Implement edge-layer rate limiting using Upstash Redis (or Vercel KV) so DB is not hit on every request
- [ ] **W1D4-5** — Add Google OAuth provider to NextAuth config in `app/lib/auth.ts`
- [ ] **W2D1-2** — Build `/api/itineraries/[id]/packing-list` route (Gemini call, store in `metadata`)
- [ ] **W2D2-3** — Write a proper `README.md` with setup instructions, env vars table, and architecture diagram
- [ ] **W2D4-5** — Create first 20 Vitest unit tests: Zod schemas, `lib/rateLimit.ts`, `lib/weather.ts`, `geminiService` mocks

---

### Phase 2: Core Improvements (Months 1-2)

> Goal: Polish the core product loop, activate key retention features, and open monetisation channels.

- [ ] PDF itinerary export (`/api/itineraries/[id]/export/pdf`)
- [ ] Price alert cron job + Nodemailer email template
- [ ] Mobile-optimised itinerary view (swipeable cards, bottom sheet for activities)
- [ ] Onboarding 3-step tour for new users (store `onboardingComplete` in `userPreferences`)
- [ ] "Trip Advisor" chat sidebar inside saved itineraries (extend `/api/chat` with context)
- [ ] SEO destination landing pages (`/destinations/[slug]`) with ISR
- [ ] React Query migration for dashboard and itinerary data fetching
- [ ] `Activity.time` type migration to `DateTime` + timezone handling
- [ ] `/dev` route locked behind `ADMIN` role check
- [ ] Weekly email newsletter (trending itineraries from marketplace)
- [ ] Referral system (referral code on User model, usage credited on sign-up)

---

### Phase 3: Long-Term Vision (Months 3-6)

> Goal: Transform Wander.AI from a generator tool into a full-stack travel platform.

- [ ] Real-time collaborative editing with Pusher or Liveblocks (activate `ItineraryCollaborator` model fully)
- [ ] Multi-city / multi-destination trip support
- [ ] Flight search and hotel search integrations with affiliate commission model
- [ ] Activity group voting for shared trips
- [ ] Marketplace paid templates (travel bloggers sell premium itineraries via Lemon Squeezy)
- [ ] Corporate/team plan (seat-based billing, shared workspace, expense reporting)
- [ ] "Powered by Wander.AI" embed widget for travel publishers
- [ ] Full a11y audit and WCAG 2.1 AA compliance
- [ ] i18n (start with Spanish, French, Japanese — top travel markets)
- [ ] Offline-first PWA with service worker and IndexedDB sync

---

## 6. Implementation Plan for Top 3 Ideas

---

### 6.1 Idea #1: Edge-Layer Rate Limiting

**Why top 3:** The current DB-based rate limit (`lib/rateLimit.ts`) is a single point of failure and a scalability bottleneck. Every request to `/api/generate` hits PostgreSQL twice (read quota, write increment). This is also trivially bypassed by spoofing session tokens.

**Step-by-step tasks:**

1. **Add dependency:** `npm install @upstash/ratelimit @upstash/redis`
2. **Create `lib/edgeRateLimit.ts`** with a sliding window limiter keyed on `userId + current_month` using Upstash Redis
3. **Update `app/api/generate/route.ts`:** Replace the `checkAndIncrementQuota` DB call with the edge rate limiter for the fast path; keep the DB as the source-of-truth for display (remaining count in dashboard)
4. **Update `middleware.ts`:** Add a global IP-based burst limiter (e.g. max 30 requests/minute per IP) to protect public endpoints
5. **Add env vars:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
6. **Test:** Write integration tests for quota enforcement at all three tiers

**Files to change/create:**
- `lib/edgeRateLimit.ts` <- new
- `app/api/generate/route.ts` <- update quota check
- `middleware.ts` <- add IP burst protection
- `lib/env.ts` <- add new env vars
- `.env` <- add Upstash vars

**Risks:**
- Upstash Redis adds a new paid dependency (mitigate: use Vercel KV which has a free tier)
- Dual-source of truth (Redis + DB) could drift; always treat DB as canonical for billing

---

### 6.2 Idea #2: AI Packing List Generator

**Why top 3:** Extremely high utility, zero schema migration needed, and takes ~1 day to implement end-to-end. Creates a new reason to re-open the app after trip creation.

**Step-by-step tasks:**

1. **Create `/api/itineraries/[id]/packing-list/route.ts`:**
   - Fetch itinerary with days + activities from `itineraryRepository`
   - Fetch weather forecast from `lib/weather.ts`
   - Call Gemini with a packing list prompt (activities, weather, duration, traveler type)
   - Validate response with a `PackingListSchema` Zod schema
   - Store result in `itinerary.metadata.packingList` via `prisma.itinerary.update`
   - Return the list as JSON

2. **Create `PackingListSchema`** in `schemas/packingList.ts`:
   ```typescript
   z.object({
     categories: z.array(z.object({
       name: z.string(),
       items: z.array(z.object({
         item: z.string(),
         essential: z.boolean(),
         notes: z.string().optional()
       }))
     }))
   })
   ```

3. **Create `PackingListPanel.tsx`** component in `components/itinerary/`:
   - Checklist UI with category sections
   - Check-off individual items (stored in `localStorage` or a `userPackingProgress` JSON field)
   - "Regenerate" and "Export as PDF" buttons

4. **Wire into `SplitItineraryView.tsx`:** Add a "Packing List" tab alongside the existing activity timeline

5. **Update middleware** to allow `GET /api/itineraries/[id]/packing-list` publicly (so shared itinerary viewers can also see it)

**Files to change/create:**
- `app/api/itineraries/[id]/packing-list/route.ts` <- new
- `schemas/packingList.ts` <- new
- `components/itinerary/PackingListPanel.tsx` <- new
- `components/itinerary/SplitItineraryView.tsx` <- add tab
- `middleware.ts` <- add public prefix

**Risks:**
- Gemini may return vague or over-generic packing lists. Mitigate with a highly specific prompt that references actual activity names and weather data.
- `metadata` is a `Json?` field — if multiple features store data there, add a typed wrapper utility.

---

### 6.3 Idea #3: SEO Destination Landing Pages

**Why top 3:** Generates organic traffic from high-intent travel searches ("5 day Tokyo itinerary", "best Paris 7 day plan") at essentially zero marginal cost once built. This is the highest leverage growth channel for a B2C travel product.

**Step-by-step tasks:**

1. **Create `app/destinations/[slug]/page.tsx`** as a statically generated page with ISR (`revalidate: 86400`)
   - `slug` format: `tokyo-japan`, `paris-france`, `bali-indonesia`
   - Page includes: hero image, AI-generated destination overview, a sample 5-day itinerary preview (use an existing public itinerary from the marketplace or generate one at build time), and a CTA to generate a personalised version

2. **Create `app/destinations/page.tsx`** — index page listing all supported destinations

3. **Create `lib/destinations.ts`** — a static list of ~50 top destinations with slugs, display names, country codes, and sample itinerary IDs

4. **Update `app/sitemap.ts`** to include all destination pages

5. **Add structured data (JSON-LD)** to each destination page for `TouristDestination` schema type

6. **Add internal linking** — From the marketplace page and the landing page "Popular Destinations" grid in `trip-creation-form.tsx`, link to the relevant destination page

7. **Write meta tags** — Dynamic `<title>` and `<description>` optimised for "[N] Day [Destination] Itinerary" keywords

**Files to change/create:**
- `app/destinations/[slug]/page.tsx` <- new
- `app/destinations/page.tsx` <- new
- `lib/destinations.ts` <- new
- `app/sitemap.ts` <- update
- `components/trip-creation-form.tsx` <- add destination links

**Risks:**
- AI-generated content on landing pages may be penalised by Google's Helpful Content guidelines. Mitigate by using real community itineraries (not on-the-fly AI generation) as the sample content.
- ISR with 24h revalidation means stale content. Acceptable for destination pages; use `revalidatePath` in the webhooks handler when a popular itinerary changes.

---

## 7. Next Steps — First 5 Concrete Actions Today

> Take these actions right now, in order. Each takes less than 2 hours.

### Action 1: Install Sentry (30 min)
```bash
npx @sentry/wizard@latest -i nextjs
```
Add `SENTRY_DSN` to `.env`. Wrap the `POST` handler in `app/api/generate/route.ts` and the core methods in `app/services/geminiService.ts` with `Sentry.captureException`. Blind spots in production error handling are your highest risk right now.

### Action 2: Rewrite README.md (45 min)
Replace the boilerplate with: project description, feature list, local setup steps (env vars table, DB migration command, dev server), and a link to this growth plan. Every future contributor — and your future self — needs this.

### Action 3: Add Google OAuth (45 min)
In `app/lib/auth.ts`, add `GoogleProvider` from `next-auth/providers/google`. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env` and register them in the Google Cloud Console. Test sign-in. Social auth typically reduces drop-off by 40%+ vs. email-only.

### Action 4: Install Vitest and write your first 5 tests (90 min)
```bash
npm install -D vitest @vitejs/plugin-react
```
Write tests for: (1) `TripCreateSchema` valid input, (2) `TripCreateSchema` missing destination + prompt, (3) `decodeWmoWeatherCode` known codes, (4) `checkAndIncrementQuota` at limit, (5) `getUserQuota` for unknown user. Getting to any green tests is a psychological and quality milestone.

### Action 5: Create the Packing List API route (90 min)
Follow the implementation plan in Section 6.2, steps 1-2 only (the API route + Zod schema). You can test it with a `curl` against a known itinerary ID. This is a high-visibility feature that takes a single afternoon and immediately differentiates Wander.AI from competitors.

---

> **Tip:** Use the `/plan` slash command in your IDE to break any of these sections into a detailed, executable task list before starting.

---

*This document was generated by analysing the full codebase including: `prisma/schema.prisma`, `package.json`, `middleware.ts`, `app/api/generate/route.ts`, `app/api/chat/route.ts`, `lib/rateLimit.ts`, `lib/weather.ts`, `app/services/geminiService.ts`, `schemas/trip.ts`, `components/itinerary/*`, `components/map/*`, `components/trip-creation-form.tsx`, `app/page.tsx`, and the full directory tree.*
