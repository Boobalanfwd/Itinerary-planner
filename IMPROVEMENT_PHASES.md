# IMPROVEMENT_PHASES.md — Wander.AI App Improvement Execution Plan
> Derived from [`PROJECT_GROWTH_PLAN.md`](./PROJECT_GROWTH_PLAN.md)  
> Last updated: 2026-09-24 | Status: Ready to execute

This document translates the growth plan into a **concrete, sprint-by-sprint execution plan** with acceptance criteria, file targets, and dependency ordering. Each phase builds on the previous one.

---

## Overview

```
Phase 0 ── Foundation (Days 1-3)       ← Do this FIRST. Nothing else is safe without it.
Phase 1 ── Quick Wins (Week 1-2)       ← High ROI, low effort. Ship fast.
Phase 2 ── Core UX (Month 1)           ← Polish the product loop.
Phase 3 ── Growth Engine (Month 2)     ← Retention + Monetisation.
Phase 4 ── Platform Expansion (M 3-6)  ← Scale features.
```

---

## Phase 0 — Foundation (Days 1–3)
> **Goal:** Stop flying blind. These 3 tasks must happen before anything else is touched.

---

### 0.1 — Error Monitoring (Sentry) `[Day 1 — 30 min]`

**Why first:** You have zero production visibility. A failing Gemini call or DB error is currently silent.

**Install:**
```bash
npx @sentry/wizard@latest -i nextjs
```

**Instrument these files:**
| File | What to wrap |
|---|---|
| `app/api/generate/route.ts` | Wrap entire `POST` handler + `processGeneration()` |
| `app/services/geminiService.ts` | Wrap `generateItinerary()` method |
| `app/api/chat/route.ts` | Wrap `POST` handler |
| `lib/maps/placeVerification.ts` | Wrap `verifyAndEnrichItinerary()` |

**Add to `.env`:**
```
SENTRY_DSN=your_sentry_dsn_here
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
```

**Acceptance criteria:**
- [ ] Test error appears in Sentry dashboard within 30 seconds of triggering it
- [ ] Source maps uploaded (Sentry wizard handles this automatically)

---

### 0.2 — Rewrite README.md `[Day 1 — 45 min]`

**Why:** Any future contributor (or you, 3 months from now) needs this to get started.

**Replace** the default Next.js template at [`README.md`](./README.md) with:

```markdown
# Wander.AI — AI Travel Itinerary Planner

[screenshot here]

## What it does
AI-powered itinerary generator. Describe a trip → get a full day-by-day plan
with real place data, weather, interactive map, and budget tracker.

## Tech Stack
Next.js 16 · React 19 · TypeScript · Tailwind v4 · Prisma/PostgreSQL
Google Gemini · Mapbox/Leaflet · NextAuth · Lemon Squeezy · Open-Meteo

## Local Setup
1. Clone the repo
2. cp .env.example .env  (fill in required vars — see table below)
3. npm install
4. npx prisma migrate dev
5. npm run dev → http://localhost:3000

## Required Environment Variables
| Variable | Description |
|---|---|
| DATABASE_URL | PostgreSQL connection string |
| NEXTAUTH_SECRET | Random secret for NextAuth |
| NEXTAUTH_URL | http://localhost:3000 |
| GEMINI_API_KEY | Google AI Studio API key |
| GEMINI_MODEL | e.g. gemini-2.5-flash |
| MAPBOX_TOKEN | Mapbox public token |
| LEMONSQUEEZY_API_KEY | Lemon Squeezy API key |
| LEMONSQUEEZY_WEBHOOK_SECRET | Webhook signing secret |
| EMAIL_SERVER_* | Nodemailer SMTP config |

## Architecture
See PROJECT_GROWTH_PLAN.md for full architecture diagram.
```

**Acceptance criteria:**
- [ ] `README.md` has no Next.js boilerplate remaining
- [ ] A new dev can run the app locally using only the README

---

### 0.3 — Create `.env.example` `[Day 1 — 15 min]`

**Currently missing.** Create [`/.env.example`](./env.example) by copying `.env` and blanking all values:

```bash
cp .env .env.example
# Then blank all values in .env.example, keep only keys
```

Add `.env.example` to git (and confirm `.env` stays in `.gitignore`).

**Acceptance criteria:**
- [ ] `.env.example` committed to git
- [ ] `.env` confirmed in `.gitignore`

---

## Phase 1 — Quick Wins (Weeks 1–2)
> **Goal:** High-ROI improvements that take hours not days. Each is fully self-contained.

---

### 1.1 — Google OAuth Sign-In `[Day 2 — 1h]`

**Impact:** Social auth reduces signup drop-off by ~40%. Currently only email+OTP is available.

**Files to change:**
- `app/lib/auth.ts` — add `GoogleProvider`
- `.env` — add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `app/auth/signin/page.tsx` — add "Continue with Google" button

**Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/) → Create OAuth 2.0 credentials
2. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
3. Install provider (already included in `next-auth`):
```typescript
// app/lib/auth.ts
import GoogleProvider from "next-auth/providers/google";

providers: [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }),
  // ... existing CredentialsProvider
]
```

**Acceptance criteria:**
- [ ] "Sign in with Google" button visible on `/auth/signin`
- [ ] Google OAuth flow completes and creates a DB session
- [ ] Existing email/password login still works

---

### 1.2 — Edge-Layer Rate Limiting `[Day 2–3 — 2h]`

**Impact:** Current `lib/rateLimit.ts` hits the DB on every `/api/generate` call. At scale this becomes a bottleneck and a billing exploit vector.

**Files to create/change:**

| File | Action |
|---|---|
| `lib/edgeRateLimit.ts` | New — Upstash Redis sliding window |
| `app/api/generate/route.ts` | Replace `checkAndIncrementQuota` call |
| `middleware.ts` | Add IP burst protection (30 req/min) |
| `lib/env.ts` | Add Upstash env vars |

**Install:**
```bash
npm install @upstash/ratelimit @upstash/redis
```

**`lib/edgeRateLimit.ts` skeleton:**
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Tier limits: FREE=5/mo, PRO=50/mo, PREMIUM=unlimited
export const monthlyLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "30 d"),
  prefix: "wander:monthly",
});

// Burst protection: 30 requests/min per IP
export const burstLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  prefix: "wander:burst",
});
```

**Acceptance criteria:**
- [ ] Free user blocked after 5 generations (verified via test)
- [ ] PRO user allowed up to 50
- [ ] DB quota still synced for dashboard display

---

### 1.3 — Packing List Generator `[Day 3–4 — 1 day]`

**Impact:** Top travel search keyword category. Zero DB migration required (`metadata: Json?` field exists).

**Files to create:**

```
app/api/itineraries/[id]/packing-list/
  route.ts                      ← New API route
schemas/
  packingList.ts                ← New Zod schema
components/itinerary/
  PackingListPanel.tsx          ← New UI component
```

**Files to modify:**
- `components/itinerary/SplitItineraryView.tsx` — add "Packing List" tab
- `middleware.ts` — allow public GET for `/api/itineraries/*/packing-list`

**`schemas/packingList.ts`:**
```typescript
import { z } from "zod";

export const PackingItemSchema = z.object({
  item: z.string(),
  essential: z.boolean(),
  notes: z.string().optional(),
});

export const PackingCategorySchema = z.object({
  name: z.string(),        // e.g. "Clothing", "Documents", "Electronics"
  icon: z.string(),        // emoji
  items: z.array(PackingItemSchema),
});

export const PackingListSchema = z.object({
  categories: z.array(PackingCategorySchema),
  generatedAt: z.string().datetime(),
  weatherBased: z.boolean(),
});

export type PackingList = z.infer<typeof PackingListSchema>;
```

**Gemini prompt strategy:** Pass the list of activity types + weather forecast + trip duration. Example:
> "Generate a packing list for a 7-day trip to Tokyo in December. Activities include: sightseeing (outdoor), traditional restaurants (formal), temple visits, shopping. Weather: 5-10°C, partly cloudy. Traveler: solo."

**Acceptance criteria:**
- [ ] `GET /api/itineraries/[id]/packing-list` returns categorised JSON
- [ ] List persists in `itinerary.metadata.packingList`
- [ ] UI shows checkboxes (state in `localStorage`)
- [ ] Works on publicly shared itineraries

---

### 1.4 — First Test Suite (Vitest) `[Day 4–5 — 2h]`

**Install:**
```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react
```

**Add to `package.json`:**
```json
"scripts": {
  "test": "vitest",
  "test:ui": "vitest --ui"
}
```

**Create `vitest.config.ts`:**
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: { environment: "node" },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") }
  },
});
```

**Write these 10 tests first:**

| Test file | Tests |
|---|---|
| `__tests__/schemas/trip.test.ts` | Valid input, missing destination+prompt, invalid duration (>30), invalid budget |
| `__tests__/lib/weather.test.ts` | `decodeWmoWeatherCode(0)` → Clear Sky, code 95 → Thunderstorm, unknown code |
| `__tests__/lib/rateLimit.test.ts` | Quota at limit returns `allowed: false`, unknown user returns defaults |

**Acceptance criteria:**
- [ ] `npm test` passes with 10+ green tests
- [ ] Test script runs in CI (add to GitHub Actions if applicable)

---

### 1.5 — Lock `/dev` Route Behind ADMIN `[Day 5 — 30 min]`

**Current issue:** `middleware.ts` line 27 whitelists `/dev` for all users.

**Fix in `middleware.ts`:**
```typescript
// Remove /dev from PUBLIC_PREFIXES
// Add admin check:
if (pathname.startsWith("/dev")) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}
```

**Acceptance criteria:**
- [ ] Non-admin user visiting `/dev` is redirected to homepage
- [ ] Admin user can still access `/dev`

---

## Phase 2 — Core UX (Month 1)
> **Goal:** Fix the 3 biggest UX gaps that affect daily usage and first-time user conversion.

---

### 2.1 — Onboarding Flow `[Week 3 — 2 days]`

**Why:** New users have no guidance. The app's power is non-obvious.

**Design:** A 3-step overlay shown once after first login. Stored in `UserPreferences.preferences` JSON.

**Files to create:**
```
components/shared/
  OnboardingModal.tsx        ← Step carousel with Framer Motion
  OnboardingStep.tsx         ← Individual step card
app/hooks/
  useOnboarding.ts           ← Check/set onboarding status
```

**Files to modify:**
- `app/dashboard/layout.tsx` — render `<OnboardingModal>` if not complete
- `app/api/users/` — add `PATCH /api/users/onboarding-complete` endpoint

**Steps flow:**
```
Step 1: "Generate your first trip"
  → Show the trip creation form, highlight destination input
  → CTA: "Try it now →"

Step 2: "Explore on the map"
  → Animated screenshot of the split map view
  → CTA: "Got it →"

Step 3: "Share or export"
  → Show share link icon + iCal export icon
  → CTA: "Start planning!"
```

**Acceptance criteria:**
- [ ] Modal shows on first login, never again after
- [ ] Each step has a "Skip" option
- [ ] Completion status persisted in DB (not just localStorage)

---

### 2.2 — Mobile-Optimised Itinerary View `[Week 3–4 — 3 days]`

**Why:** `SplitItineraryView.tsx` (31 KB) is desktop-first. The app is installed as a PWA but the mobile experience is poor.

**Files to modify:**
- `components/itinerary/SplitItineraryView.tsx` — add responsive layout switching
- `components/itinerary/SortableActivityCard.tsx` — make touch-friendly (larger tap targets)

**Files to create:**
```
components/itinerary/
  MobileItineraryView.tsx      ← Swipeable day carousel
  DayTabBar.tsx                ← Horizontal scrolling day selector
  ActivityBottomSheet.tsx      ← Activity detail as bottom drawer
```

**Layout strategy:**
```
Desktop (lg+): Existing split view (unchanged)
Tablet  (md):  Stacked layout, map toggle button
Mobile  (sm):  Single-column with bottom sheet for map
               Day tabs scrollable horizontally
               Activities as swipeable cards
```

**Use `use-mobile.ts`** (already exists in `/hooks`) to switch layouts.

**Acceptance criteria:**
- [ ] Itinerary fully usable on 375px viewport (iPhone SE)
- [ ] Map toggle works on mobile
- [ ] Activity drag-and-drop replaced with long-press on mobile

---

### 2.3 — Generation Progress Bar `[Week 3 — 1 day]`

**Why:** The SSE stream and `GenerationJob.step` / `GenerationJob.progress` (0–100) already exist but the UI shows a generic spinner. Users don't know how long to wait.

**Files to modify:**
- `app/components/views/LoadingView.tsx` — replace spinner with step-label progress bar
- `app/hooks/useItinerary.ts` — consume the SSE `step` and `progress` events

**Progress steps that are already emitted from `route.ts`:**
```
15% → "Analyzing destination & seasonal highlights..."
40% → "Consulting AI travel architect for custom routes..."
75% → "Structuring timeline and daily pacing..."
88% → "Resolving locations & calculating travel times..."
98% → "Finalizing itinerary details & budget..."
```

**UI implementation:**
```tsx
// Animated progress bar with step label
<div className="w-full max-w-md mx-auto">
  <div className="h-2 bg-muted rounded-full overflow-hidden">
    <motion.div
      className="h-full bg-primary"
      animate={{ width: `${progress}%` }}
      transition={{ duration: 0.5 }}
    />
  </div>
  <p className="text-sm text-muted-foreground mt-2">{currentStep}</p>
</div>
```

**Acceptance criteria:**
- [ ] Progress bar visible during generation
- [ ] Step label updates in real-time via SSE
- [ ] Smooth animation between progress values

---

### 2.4 — PDF Itinerary Export `[Week 4 — 2 days]`

**Why:** Most-requested export format. iCal exists, PDF is universally useful offline.

**Install:**
```bash
npm install @react-pdf/renderer
```

**Files to create:**
```
app/api/itineraries/[id]/export/pdf/
  route.ts                        ← New route (already allowed in middleware)
components/itinerary/pdf/
  ItineraryPDFDocument.tsx        ← React PDF layout
  PDFActivityRow.tsx              ← Activity line item
  PDFDaySummary.tsx               ← Day section header
  PDFBudgetPage.tsx               ← Budget breakdown page
```

**Files to modify:**
- `components/itinerary/SplitItineraryView.tsx` — add "Download PDF" button

**PDF layout (pages):**
```
Page 1: Cover (title, destination, dates, cover image)
Page 2-N: Day-by-day schedule (one day per section)
Page N+1: Budget summary (estimated vs actual)
```

**Acceptance criteria:**
- [ ] PDF downloads in < 5 seconds for a 7-day itinerary
- [ ] All activities, times, and locations appear correctly
- [ ] Budget page shows category breakdown
- [ ] Works for shared (public) itineraries

---

### 2.5 — Undo/Redo for Activity Edits `[Week 4 — 1 day]`

**Why:** Users accidentally delete or reorder activities with no way to recover. Sonner toasts are already configured.

**Files to create:**
```
app/hooks/
  useUndoableState.ts         ← Generic undo/redo hook
```

**Files to modify:**
- `components/itinerary/SortableActivityList.tsx` — wrap mutations in undoable actions
- `components/itinerary/ActivityActionsMenu.tsx` — show undo toast on delete

**Undo toast pattern:**
```typescript
// On delete
const deleted = activities[index];
setActivities(prev => prev.filter((_, i) => i !== index));

toast("Activity removed", {
  action: {
    label: "Undo",
    onClick: () => {
      setActivities(prev => [
        ...prev.slice(0, index),
        deleted,
        ...prev.slice(index)
      ]);
    }
  },
  duration: 5000,
});
```

**Acceptance criteria:**
- [ ] Delete shows undo toast for 5 seconds
- [ ] Reorder shows undo option
- [ ] Undo restores the exact previous state

---

## Phase 3 — Growth Engine (Month 2)
> **Goal:** Drive retention with AI-powered features + open first monetisation channels.

---

### 3.1 — Price Alert Cron Job `[Week 5–6 — 3 days]`

**Why:** The `PriceAlert` DB model is fully designed but the job runner is missing. This is a high-retention touchpoint.

**Files to create:**
```
app/api/jobs/price-check/
  route.ts                      ← Cron-triggered endpoint (Vercel Cron)
lib/
  priceChecker.ts               ← Price fetching logic (Amadeus or mock)
  emailTemplates/
    priceAlert.ts               ← Nodemailer HTML template
```

**Files to modify:**
- `vercel.json` — add cron schedule

**`vercel.json` cron config:**
```json
{
  "crons": [
    {
      "path": "/api/jobs/price-check",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Flow:**
```
1. Cron fires daily at 09:00 UTC
2. Fetch all active PriceAlerts where isActive=true, triggered=false
3. For each alert: check current price (Amadeus API or Kiwi.com)
4. If currentPrice <= targetPrice: send email via Nodemailer, set triggered=true
5. Update PriceAlert.currentPrice with latest value
```

**Acceptance criteria:**
- [ ] Cron endpoint secured with `CRON_SECRET` header validation
- [ ] Email sends correctly via Nodemailer when price drops
- [ ] `PriceAlert.triggered` set to `true` after first alert
- [ ] Alert history visible in dashboard

---

### 3.2 — "Trip Advisor" Chat on Saved Itineraries `[Week 5 — 2 days]`

**Why:** `RefinementBar.tsx` is limited to bulk AI tweaks. A full chat with itinerary context enables fine-grained editing.

**Files to modify:**
- `app/api/chat/route.ts` — accept optional `itineraryContext` in request body
- `components/itinerary/SplitItineraryView.tsx` — add chat sidebar toggle

**Files to create:**
```
components/itinerary/
  ItineraryChatSidebar.tsx      ← Chat UI inside the itinerary view
```

**Extended request schema for `/api/chat`:**
```typescript
const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
  itineraryContext: z.object({
    destination: z.string(),
    days: z.array(z.object({
      dayNumber: z.number(),
      activities: z.array(z.string()), // activity titles only
    })),
    budget: z.string().optional(),
    travelers: z.string().optional(),
  }).optional(),
});
```

**AI system instruction update:** When `itineraryContext` is present, prepend:
> "You have access to the user's current itinerary for [destination]. Day 1: [activities]. Day 2: [activities]... Help them refine it. When suggesting changes, format them as JSON activity patches."

**Acceptance criteria:**
- [ ] Chat sidebar opens inside `SplitItineraryView`
- [ ] AI responds with awareness of the current itinerary contents
- [ ] AI-suggested activity swaps can be applied with one click

---

### 3.3 — SEO Destination Landing Pages `[Week 6–7 — 3 days]`

**Why:** "5 day Tokyo itinerary" gets millions of monthly searches. ISR pages are zero marginal cost after setup.

**Files to create:**
```
app/destinations/
  page.tsx                      ← Index: all destinations
  [slug]/
    page.tsx                    ← Individual destination page (ISR)
lib/
  destinations.ts               ← Static list of 50 destinations
```

**`lib/destinations.ts` structure:**
```typescript
export const DESTINATIONS = [
  {
    slug: "tokyo-japan",
    name: "Tokyo, Japan",
    country: "JP",
    hero: "https://...",
    tagline: "Neon lights, ancient temples, and world-class sushi",
    sampleItineraryId: "clxxx...",  // ID of a public community itinerary
    popularDurations: [3, 5, 7],
    tags: ["culture", "food", "tech", "history"],
  },
  // ... 49 more
];
```

**`app/destinations/[slug]/page.tsx`:**
```typescript
export const revalidate = 86400; // ISR: rebuild once per day

export async function generateStaticParams() {
  return DESTINATIONS.map(d => ({ slug: d.slug }));
}

export async function generateMetadata({ params }) {
  const dest = DESTINATIONS.find(d => d.slug === params.slug);
  return {
    title: `${dest.name} Itinerary Planner — Wander.AI`,
    description: `Generate a custom ${dest.name} itinerary in seconds. AI-powered day-by-day plans for every budget and travel style.`,
  };
}
```

**Page sections:**
1. Hero with destination image and CTA "Plan my [destination] trip →"
2. Sample 5-day itinerary preview (from `sampleItineraryId`)
3. Popular durations (3/5/7 day) — one-click generation
4. Weather by month chart
5. FAQ (What's the best time to visit? How many days do you need?)

**Update `app/sitemap.ts`** to include all destination URLs.

**Acceptance criteria:**
- [ ] 50 destination pages render statically
- [ ] Each page has unique `<title>`, `<description>`, and JSON-LD structured data
- [ ] Pages appear in `sitemap.xml`
- [ ] CTA links to generator pre-filled with the destination

---

### 3.4 — Referral Program `[Week 7 — 1.5 days]`

**Why:** Referral programs have the best CAC:LTV ratio for B2C SaaS.

**Schema migration — add to `User` model:**
```prisma
referralCode    String?  @unique   // User's own referral code
referredBy      String?            // referralCode of who referred this user
referralBonuses Int      @default(0) // Bonus itineraries earned
```

**Files to create:**
```
app/api/users/referral/
  route.ts              ← GET (get code), POST (apply code)
components/shared/
  ReferralBanner.tsx    ← Dashboard banner with shareable link
```

**Logic:**
- On sign-up: if `?ref=CODE` is in the URL, store in session and apply after registration
- When referred user generates their first itinerary: give both users +5 bonus `itinerariesThisMonth` credit
- Show referral stats on dashboard: "You've referred 3 friends — earned 15 bonus trips!"

**Acceptance criteria:**
- [ ] Every user has a unique `referralCode`
- [ ] Referred users get +5 itineraries after first generation
- [ ] Referring user gets +5 itineraries when their referral generates their first trip
- [ ] Referral link visible and copyable in dashboard

---

## Phase 4 — Platform Expansion (Months 3–6)
> **Goal:** Move from tool to platform. Add collaboration, multi-city, and monetisation.

---

### 4.1 — Real-Time Collaborative Editing `[Month 3 — 1 week]`

**Activate the existing `ItineraryCollaborator` (OWNER/EDITOR/VIEWER) model.**

**Install:**
```bash
npm install pusher pusher-js
# OR: npm install @liveblocks/client @liveblocks/react
```

**Features:**
- Collaborator invite by email (look up User by email, create `ItineraryCollaborator` record)
- Live presence: show avatar bubbles of who's currently viewing
- Optimistic UI: apply changes locally, then sync to DB
- Role-based editing: VIEWER cannot drag/edit, EDITOR can, OWNER can invite/delete

**Files to create:**
```
app/api/itineraries/[id]/collaborators/
  route.ts              ← GET (list), POST (invite), DELETE (remove)
lib/
  pusher.ts             ← Pusher server client
components/itinerary/
  CollaboratorBar.tsx   ← Avatar presence bar
  InviteCollaboratorDialog.tsx
```

---

### 4.2 — Multi-City Trip Support `[Month 3–4 — 1 week]`

**Extend the trip creation form and generation pipeline.**

**Schema migration:**
```prisma
// Add to Itinerary model:
destinations  String[]  @default([])   // Array of cities for multi-city trips
isMultiCity   Boolean   @default(false)
```

**Form changes** (`components/trip-creation-form.tsx`):
- Add "Add another city" button below destination field
- Show city list with drag-to-reorder and day allocation per city

**Prompt changes** (`app/api/generate/route.ts`):
- When `destinations.length > 1`, generate with a strict city-boundary transition model
- Insert a `TRANSPORTATION` day between each city change

---

### 4.3 — Flight & Hotel Search Integration `[Month 4–5 — 2 weeks]`

**Build on the existing `app/flights/` route and `PriceAlert` model.**

**Integrations:**
- **Flights:** Amadeus Flight Offers Search API (free sandbox, paid production)
- **Hotels:** Booking.com Partner API or TripAdvisor Content API

**Files to create:**
```
lib/
  amadeus.ts            ← Amadeus API client
  bookingDotCom.ts      ← Hotel search client
app/api/flights/search/
  route.ts              ← Proxied flight search
app/api/hotels/search/
  route.ts              ← Hotel search
components/itinerary/
  FlightSearchPanel.tsx ← Shown when activity type = FLIGHT
  HotelSearchPanel.tsx  ← Shown when activity type = ACCOMMODATION
```

**Revenue model:** Include affiliate tracking parameters in all outbound booking links.

---

### 4.4 — Activity Group Voting `[Month 5 — 3 days]`

**Schema migration:**
```prisma
model ActivityVote {
  id         String   @id @default(cuid())
  activityId String
  userId     String
  vote       Int      // +1 or -1
  createdAt  DateTime @default(now())

  activity   Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([activityId, userId])
  @@map("activity_votes")
}
```

**UI:** Add thumbs up/down icons to `SortableActivityCard.tsx` — visible only when itinerary is shared with collaborators.

---

### 4.5 — i18n — Spanish, French, Japanese `[Month 6 — 2 weeks]`

**Install:**
```bash
npm install next-intl
```

**Priority languages:** Spanish (largest non-English travel market), French, Japanese.

**Scope:** UI strings only. AI generation already produces output in the destination's local language context.

---

## Progress Tracker

Use this table to track implementation status across phases.

| Phase | Task | Status | Owner | Target Date |
|---|---|---|---|---|
| 0.1 | Sentry error monitoring | ⬜ Todo | — | Day 1 |
| 0.2 | Rewrite README | ⬜ Todo | — | Day 1 |
| 0.3 | Create `.env.example` | ⬜ Todo | — | Day 1 |
| 1.1 | Google OAuth | ⬜ Todo | — | Day 2 |
| 1.2 | Edge rate limiting | ⬜ Todo | — | Day 2–3 |
| 1.3 | Packing list generator | ⬜ Todo | — | Day 3–4 |
| 1.4 | Vitest test suite | ⬜ Todo | — | Day 4–5 |
| 1.5 | Lock /dev route | ⬜ Todo | — | Day 5 |
| 2.1 | Onboarding flow | ⬜ Todo | — | Week 3 |
| 2.2 | Mobile itinerary view | ⬜ Todo | — | Week 3–4 |
| 2.3 | Generation progress bar | ⬜ Todo | — | Week 3 |
| 2.4 | PDF export | ⬜ Todo | — | Week 4 |
| 2.5 | Undo/redo edits | ⬜ Todo | — | Week 4 |
| 3.1 | Price alert cron | ⬜ Todo | — | Week 5–6 |
| 3.2 | Itinerary chat sidebar | ⬜ Todo | — | Week 5 |
| 3.3 | SEO destination pages | ⬜ Todo | — | Week 6–7 |
| 3.4 | Referral program | ⬜ Todo | — | Week 7 |
| 4.1 | Real-time collaboration | ⬜ Todo | — | Month 3 |
| 4.2 | Multi-city trips | ⬜ Todo | — | Month 3–4 |
| 4.3 | Flight & hotel search | ⬜ Todo | — | Month 4–5 |
| 4.4 | Activity group voting | ⬜ Todo | — | Month 5 |
| 4.5 | i18n | ⬜ Todo | — | Month 6 |

**Status legend:** ⬜ Todo · 🔄 In Progress · ✅ Done · ⏸ Blocked

---

*This document is derived from [`PROJECT_GROWTH_PLAN.md`](./PROJECT_GROWTH_PLAN.md). Update both files when priorities change.*
