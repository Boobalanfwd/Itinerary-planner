# IMPLEMENTATION_PLAN.md — Wander.AI
> Version 1.0 · Created: 2026-09-24 · Status: **Active**
> References: [PROJECT_GROWTH_PLAN.md](./PROJECT_GROWTH_PLAN.md) · [IMPROVEMENT_PHASES.md](./IMPROVEMENT_PHASES.md)

---

## Executive Summary

Wander.AI is a fully functional AI itinerary generator with a rich data model, async job pipeline, and subscription billing already wired. The app is **production-ready in architecture** but has **critical gaps** in observability, testing, and several high-value features that are schema-complete but UI-incomplete (price alerts, collaboration, packing lists).

This plan organises all improvements into 4 sprints across 6 months, ordered by risk reduction first, then user value, then growth.

---

## Sprint Map

| Sprint | Duration | Theme | Goal |
|--------|----------|-------|------|
| **Sprint 0** | Days 1–3 | Foundation | Zero-risk deployment; stop flying blind |
| **Sprint 1** | Week 1–2 | Quick Wins | Ship visible features; close security gaps |
| **Sprint 2** | Month 1 | Core UX | Fix daily-use friction; increase retention |
| **Sprint 3** | Month 2 | Growth | Activate revenue channels; drive organic traffic |
| **Sprint 4** | Month 3–6 | Platform | Real collaboration; multi-city; integrations |

---

## Dependencies Map

```
Sprint 0 (Foundation)
    ├── Sentry ──────────────────── required before production launch
    ├── .env.example ────────────── required before any new contributor
    └── README rewrite ──────────── required before any new contributor

Sprint 1 (Quick Wins)
    ├── Edge Rate Limiting ──────── required before high-traffic launch
    ├── Dev Route Security ──────── required before any beta users
    ├── Vitest Setup ────────────── required before Sprint 2 refactors
    ├── Packing List API ────────── independent feature
    └── Google OAuth ────────────── already in auth.ts! Just needs env vars

Sprint 2 (Core UX) — depends on Sprint 1 tests passing
    ├── Generation Progress Bar ─── depends on SSE hook (already in useItinerary)
    ├── Mobile View ────────────── depends on use-mobile.ts (already exists)
    ├── PDF Export ──────────────── depends on pdfExport flag in PLAN_LIMITS
    ├── Onboarding ──────────────── depends on userPreferences model (exists)
    └── Undo/Redo ───────────────── depends on Sonner (already installed)

Sprint 3 (Growth) — depends on Sprint 2 stable
    ├── Price Alert Cron ────────── depends on PriceAlert model (exists) + emailService (exists)
    ├── Chat Sidebar ────────────── depends on /api/chat (exists)
    ├── SEO Pages ───────────────── independent
    └── Referral ────────────────── depends on User model migration

Sprint 4 (Platform) — depends on Sprint 3 stable
    ├── Collaboration ───────────── depends on ItineraryCollaborator model (exists)
    ├── Multi-City ──────────────── depends on Itinerary model migration
    ├── Flight/Hotel Search ─────── depends on flightService.ts (exists)
    └── i18n ────────────────────── independent
```

---

## Sprint 0 — Foundation
> **Duration:** Days 1–3 | **Must complete before anything else**

### Task 0.1 — Sentry Error Monitoring
**Effort:** 30 min | **Risk if skipped:** Production errors are invisible

**Discovery:** `app/api/generate/route.ts` catches all errors with only `console.error`. `geminiService.ts` retries silently. There is zero production observability.

**Steps:**
```bash
# 1. Install
npx @sentry/wizard@latest -i nextjs

# 2. Add to .env
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
```

| File to instrument | Method | Notes |
|---|---|---|
| [`app/api/generate/route.ts`](./app/api/generate/route.ts) | Wrap `POST` + `processGeneration` | Highest value — this is the money path |
| [`app/services/geminiService.ts`](./app/services/geminiService.ts) | Wrap `generateItinerary` | Catches Gemini API errors |
| [`app/api/chat/route.ts`](./app/api/chat/route.ts) | Wrap `POST` | Chat failures are silent today |
| [`lib/maps/placeVerification.ts`](./lib/maps/placeVerification.ts) | Wrap `verifyAndEnrichItinerary` | Geocoding failures silently degrade place data |

**Definition of Done:**
- [ ] Intentional `throw new Error("test")` in generate route appears in Sentry within 10s
- [ ] Source maps configured — stack traces show TypeScript line numbers
- [ ] Alert set up for error spike > 10/hour

---

### Task 0.2 — README & .env.example
**Effort:** 1 hour | **Risk if skipped:** Impossible to onboard collaborators

**Discovery:** [`README.md`](./README.md) is the default Next.js boilerplate. There is no `.env.example`. A new developer has no way to know what env vars exist without reading every source file.

**Steps:**
1. Create [`/.env.example`](./.env.example) — copy `.env`, blank all values, commit to git
2. Rewrite [`README.md`](./README.md) with:
   - Project description + screenshot
   - Local setup (clone → `.env.example` → `npm install` → `npx prisma migrate dev` → `npm run dev`)
   - Full env vars table (cross-reference `lib/env.ts` and all `process.env.*` calls)
   - Architecture link to `PROJECT_GROWTH_PLAN.md`

**Key env vars to document** (sourced from [`lib/env.ts`](./lib/env.ts) and source files):

| Variable | Required | Source |
|---|---|---|
| `DATABASE_URL` | Yes | Prisma datasource |
| `NEXTAUTH_SECRET` | Yes | `app/lib/auth.ts` |
| `NEXTAUTH_URL` | Yes | NextAuth |
| `GEMINI_API_KEY` | Yes | `app/services/geminiService.ts` |
| `GEMINI_MODEL` | Yes | `app/api/generate/route.ts` |
| `MAPBOX_TOKEN` | Yes | `components/map/MapboxMapInner.tsx` |
| `GOOGLE_CLIENT_ID` | No* | `app/lib/auth.ts` — OAuth |
| `GOOGLE_CLIENT_SECRET` | No* | `app/lib/auth.ts` — OAuth |
| `LEMONSQUEEZY_API_KEY` | No* | `app/lib/lemonsqueezy.ts` |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | No* | Webhook handler |
| `SMTP_HOST` | No* | `app/lib/emailService.ts` |
| `SMTP_USER` | No* | `app/lib/emailService.ts` |
| `SMTP_PASS` | No* | `app/lib/emailService.ts` |
| `SENTRY_DSN` | No* | After Task 0.1 |

*Required for the specific feature, optional for basic local dev

**Definition of Done:**
- [ ] `.env.example` has every key with blank value and a comment explaining it
- [ ] `README.md` has zero Next.js boilerplate remaining
- [ ] New dev can start the app using only the README (test this yourself)

---

### Task 0.3 — Lock /dev Route
**Effort:** 20 min | **Risk if skipped:** Internal dev tools exposed to all users**

**Discovery:** [`middleware.ts`](./middleware.ts) line 27 — `/dev` is in `PUBLIC_PREFIXES`, meaning any user can access it.

**Fix in [`middleware.ts`](./middleware.ts):**

```typescript
// REMOVE from PUBLIC_PREFIXES:
"/dev",

// ADD before the main auth check:
if (pathname.startsWith("/dev")) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if ((token as any)?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}
```

**Definition of Done:**
- [ ] `/dev` redirects to `/` for unauthenticated users
- [ ] `/dev` redirects to `/` for authenticated non-admin users
- [ ] Admin user (role: ADMIN in DB) can still access `/dev`

---

## Sprint 1 — Quick Wins
> **Duration:** Week 1–2 | **Depends on:** Sprint 0 complete

### Task 1.1 — Activate Google OAuth
**Effort:** 45 min | **Impact:** High (reduces sign-up friction ~40%)

**Discovery:** `GoogleProvider` is **already imported and configured** in [`app/lib/auth.ts`](./app/lib/auth.ts) lines 2–22. The `signIn`, `jwt`, and `session` callbacks already handle Google accounts. The only missing piece is the **environment variables**.

**Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://yourdomain.com/api/auth/callback/google` (prod)
4. Add to `.env`:
   ```
   GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```
5. Update the sign-in page to show the Google button (check `app/auth/signin/page.tsx`)

**Definition of Done:**
- [ ] "Sign in with Google" button visible on `/auth/signin`
- [ ] Google OAuth completes → user created in DB → session established
- [ ] Existing email+password login unaffected
- [ ] Google users get `isEmailVerified: true` automatically (already handled in `auth.ts` line 104)

---

### Task 1.2 — Edge-Layer Rate Limiting (Upstash Redis)
**Effort:** 2–3 hours | **Impact:** High (security + scalability)

**Discovery:** [`lib/rateLimit.ts`](./lib/rateLimit.ts) hits PostgreSQL on every `/api/generate` call — a read + a write. At 100 concurrent users, this creates 200 DB operations per generation batch. The `lib/subscriptionService.ts` defines `PLAN_LIMITS` with `itinerariesPerMonth: 3` for FREE (note: `rateLimit.ts` says 5 — these are inconsistent and must be reconciled).

**Steps:**

```bash
npm install @upstash/ratelimit @upstash/redis
```

**1. Create [`lib/edgeRateLimit.ts`](./lib/edgeRateLimit.ts):**
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { SubscriptionTier } from "@prisma/client";

const redis = Redis.fromEnv();

const MONTHLY_LIMITS: Record<SubscriptionTier, number> = {
  FREE: 3,      // Match subscriptionService.ts PLAN_LIMITS
  PRO: 50,
  PREMIUM: 999999,
};

export function getMonthlyLimiter(tier: SubscriptionTier) {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(MONTHLY_LIMITS[tier], "30 d"),
    prefix: `wander:monthly:${tier.toLowerCase()}`,
  });
}

// Burst limiter — IP-based, applied in middleware
export const burstLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  prefix: "wander:burst",
});
```

**2. Update [`app/api/generate/route.ts`](./app/api/generate/route.ts):**
Replace the `checkAndIncrementQuota(user.id)` call with:
```typescript
const limiter = getMonthlyLimiter(user.subscriptionTier);
const { success, remaining, limit } = await limiter.limit(user.id);
if (!success) {
  return NextResponse.json(
    { success: false, error: `Quota reached (${limit}/month on ${user.subscriptionTier})`, code: "QUOTA_EXCEEDED" },
    { status: 429 }
  );
}
```

**3. Fix the inconsistency:** Reconcile `FREE: 5` in `lib/rateLimit.ts` vs `FREE: 3` in `subscriptionService.ts`. Pick one value and update both + the pricing page copy.

**Add to `.env`:**
```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

**Definition of Done:**
- [ ] Free user is blocked after 3 generations in a 30-day window
- [ ] PRO user allowed up to 50
- [ ] Database is NOT hit for quota check on the fast path
- [ ] `lib/rateLimit.ts` and `subscriptionService.ts` agree on tier limits

---

### Task 1.3 — Packing List Generator
**Effort:** 1 day | **Impact:** High (zero DB migration; new visible feature)

**Discovery:** `Itinerary.metadata` is `Json?` and unused. `lib/weather.ts` already has `getOpenMeteoForecast()`. `app/services/geminiService.ts` has the structured output pattern. `app/lib/subscriptionService.ts` marks `pdfExport: false` for FREE tier — packing list should be free for all.

**Files to create:**

**[`schemas/packingList.ts`](./schemas/packingList.ts)**
```typescript
import { z } from "zod";

export const PackingItemSchema = z.object({
  item: z.string().min(1),
  essential: z.boolean(),
  notes: z.string().max(100).optional(),
});

export const PackingCategorySchema = z.object({
  name: z.string().min(1),
  emoji: z.string(),
  items: z.array(PackingItemSchema).min(1).max(20),
});

export const PackingListSchema = z.object({
  categories: z.array(PackingCategorySchema).min(1).max(12),
  tips: z.array(z.string()).max(5).optional(), // destination-specific packing tips
});

export type PackingList = z.infer<typeof PackingListSchema>;
```

**[`app/api/itineraries/[id]/packing-list/route.ts`](./app/api/itineraries/)**
```typescript
// GET  → return cached packing list from metadata (or null)
// POST → generate new packing list via Gemini, cache in metadata
```

Prompt structure:
```
"Generate a packing checklist for:
 Destination: ${destination}
 Duration: ${duration} days
 Dates: ${startDate} to ${endDate}
 Traveler: ${travelers}
 Activities: ${activityTypes joined}
 Weather: ${weatherSummary from open-meteo}

Return JSON with categories (Clothing, Documents, Electronics, Toiletries, 
Health & Safety, Activity Gear) and essential/non-essential flag per item."
```

**[`components/itinerary/PackingListPanel.tsx`](./components/itinerary/)**
- Accordion by category (use existing Radix UI from `components/ui/`)
- Checkbox per item — state persisted in `localStorage` keyed by `itineraryId`
- "Regenerate" button (POST to API)
- "Copy all" and "Share" buttons

**Files to modify:**
- [`components/itinerary/SplitItineraryView.tsx`](./components/itinerary/SplitItineraryView.tsx) — add "Packing" tab to the tab bar
- [`middleware.ts`](./middleware.ts) — add `/api/itineraries/*/packing-list` to public GET prefix

**Definition of Done:**
- [ ] POST `/api/itineraries/[id]/packing-list` returns categorised JSON
- [ ] Result stored in `itinerary.metadata.packingList` (no re-generation on refresh)
- [ ] Checklist items can be checked/unchecked
- [ ] Works on shared (public) itineraries

---

### Task 1.4 — Vitest Test Suite (Baseline)
**Effort:** 2 hours | **Impact:** Medium now, High later (gates all refactors)

**Install:**
```bash
npm install -D vitest @vitejs/plugin-react
```

**Create [`vitest.config.ts`](./vitest.config.ts):**
```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

**Add to `package.json` scripts:**
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

**Test files to create (15 tests minimum):**

| Test File | Tests |
|---|---|
| `__tests__/schemas/trip.test.ts` | Valid full input · Missing both destination+prompt · Duration > 30 · Invalid budget enum · Coerced duration string |
| `__tests__/schemas/activity.test.ts` | Valid activity · Missing required fields |
| `__tests__/lib/weather.test.ts` | `decodeWmoWeatherCode(0)` = Clear Sky · code 95 = Thunderstorm · Unknown code = fallback |
| `__tests__/lib/rateLimit.test.ts` | `getUserQuota` unknown user = defaults · Tier limit values correct |
| `__tests__/lib/utils.test.ts` | Any utility functions in `lib/utils.ts` |

**Definition of Done:**
- [ ] `npm test` passes with ≥15 green tests
- [ ] `npm run test:coverage` shows ≥30% coverage on `schemas/` and `lib/`
- [ ] Test script added to `package.json`

---

## Sprint 2 — Core UX
> **Duration:** Month 1 | **Depends on:** Sprint 1 tests green

### Task 2.1 — SSE Generation Progress Bar
**Effort:** 1 day | **Impact:** High (reduces perceived wait time)

**Discovery:** `GenerationJob` has `progress` (0–100) and `step` (string) fields already populated in `app/api/generate/route.ts`. The `/api/jobs` SSE endpoint exists. But `app/components/views/LoadingView.tsx` shows a static spinner — it doesn't consume the SSE stream.

**`useItinerary.ts` currently calls `/api/generate` synchronously with `async: true`** — it gets a `jobId` back but does NOT poll the SSE stream for progress.

**Files to modify:**

**[`app/hooks/useItinerary.ts`](./app/hooks/useItinerary.ts)** — add progress state and SSE polling:
```typescript
const [progress, setProgress] = useState(0);
const [progressStep, setProgressStep] = useState("");

// Inside generateItinerary(), after getting jobId:
const eventSource = new EventSource(`/api/jobs/${jobId}/stream`);
eventSource.onmessage = (e) => {
  const data = JSON.parse(e.data);
  setProgress(data.progress ?? 0);
  setProgressStep(data.step ?? "");
  if (data.status === "completed") {
    eventSource.close();
    // load the itinerary...
  }
};
```

**[`app/components/views/LoadingView.tsx`](./app/components/views/)** — replace spinner:
```tsx
// Animated progress bar + step label
// Show estimated time remaining based on current progress
// Framer Motion for smooth bar fill (already installed)
```

**Definition of Done:**
- [x] Progress bar visible from 0% → 100% during generation
- [x] Step label ("Consulting AI travel architect...") updates in real-time
- [x] On completion, itinerary view loads without page refresh
- [x] EventSource cleaned up on component unmount

---

### Task 2.2 — Mobile-Optimised Itinerary View
**Effort:** 3 days | **Impact:** High (PWA is installed on mobile, but view is broken)

**Discovery:** [`components/itinerary/SplitItineraryView.tsx`](./components/itinerary/SplitItineraryView.tsx) is 31 KB and desktop-first. [`hooks/use-mobile.ts`](./hooks/use-mobile.ts) already exists with a mobile detection hook.

**Target layouts:**

| Breakpoint | Layout |
|---|---|
| `≥ 1024px` (lg) | Existing split view — unchanged |
| `768–1023px` (md) | Single column, map behind a modal |
| `< 768px` (sm) | Swipeable day tabs + bottom sheet map |

**Files to create:**
```
components/itinerary/
  MobileItineraryView.tsx      ← Main mobile layout component
  DayScrollTabs.tsx            ← Horizontal scrollable day selector
  ActivitySheet.tsx            ← Bottom drawer for activity detail
```

**Files to modify:**
- [`components/itinerary/SplitItineraryView.tsx`](./components/itinerary/SplitItineraryView.tsx) — Add: `const isMobile = useMobile(); if (isMobile) return <MobileItineraryView />;`
- [`components/itinerary/SortableActivityCard.tsx`](./components/itinerary/SortableActivityCard.tsx) — increase tap target to 44px minimum

**Mobile UX decisions:**
- Day tabs are horizontally scrollable (no wrapping)
- Tap activity card → opens `ActivitySheet` bottom drawer
- Drag-and-drop disabled on mobile (too unreliable on touch); replaced with long-press context menu for "Move up / Move down"
- Map is a floating FAB ("View Map") that opens as a full-screen overlay

**Definition of Done:**
- [x] Itinerary fully usable on 375px viewport (iPhone SE)
- [x] No horizontal scroll on mobile
- [x] Map accessible via FAB button
- [x] Activity details readable in bottom sheet without pinching

---

### Task 2.3 — PDF Itinerary Export
**Effort:** 2 days | **Impact:** High (most-requested export format)

**Discovery:** `app/lib/subscriptionService.ts` already has `pdfExport: true` for PRO/PREMIUM plans and `pdfExport: false` for FREE. The middleware already allows `/api/itineraries/*/export` without auth. The `calendarService.ts` pattern can be followed for a new `pdfService.ts`.

**Install:**
```bash
npm install @react-pdf/renderer
npm install -D @types/react-pdf
```

**Files to create:**
```
app/api/itineraries/[id]/export/pdf/
  route.ts                          ← New endpoint (GET)
app/lib/
  pdfService.ts                     ← PDF generation logic
components/itinerary/pdf/
  ItineraryPDFDoc.tsx               ← React PDF document root
  PDFCoverPage.tsx                  ← Title + destination + cover image
  PDFDaySection.tsx                 ← One section per day
  PDFBudgetSummary.tsx              ← Budget breakdown table
```

**PDF structure:**
```
Page 1:  Cover (title, destination hero image, dates, travelers, budget tier)
Page 2+: Day sections (day number, theme, timeline of activities with times/costs)
Last:    Budget summary (estimated vs actual, category breakdown)
```

**Files to modify:**
- [`components/itinerary/SplitItineraryView.tsx`](./components/itinerary/SplitItineraryView.tsx) — Add "Download PDF" button alongside existing "Export Calendar" button
- Gate behind subscription check using `subscriptionService.ts`'s `pdfExport` flag

**Definition of Done:**
- [x] PDF generates in < 8 seconds for a 7-day itinerary
- [x] All activity times, names, addresses, and costs present
- [x] Budget summary page shows category breakdown
- [x] FREE users see upgrade prompt; PRO/PREMIUM download directly
- [x] Works for shared (public) itinerary URLs

---

### Task 2.4 — User Onboarding Flow
**Effort:** 2 days | **Impact:** High (zero onboarding currently; converts new users)

**Discovery:** `UserPreferences.preferences` is `Json?` — we can store `{ onboardingComplete: true }` there without a schema migration. `app/lib/emailService.ts` already sends emails, so a welcome email is trivial to add.

**Files to create:**
```
components/shared/
  OnboardingModal.tsx          ← Animated 3-step overlay
app/api/users/preferences/
  route.ts                     ← PATCH endpoint to update preferences JSON
app/hooks/
  useOnboarding.ts             ← Read/write onboarding state
```

**Files to modify:**
- [`app/dashboard/layout.tsx`](./app/dashboard/layout.tsx) — Mount `<OnboardingModal>` if not complete
- [`app/lib/emailService.ts`](./app/lib/emailService.ts) — Add `sendWelcomeEmail()` function
- [`app/api/auth/`](./app/api/auth/) — Trigger welcome email on first sign-in

**3-step onboarding flow:**
```
Step 1 — "Generate your first trip"
  Visual: Animated input field with "Tokyo 7 days" being typed
  CTA: "Try it now →" → scrolls to generator

Step 2 — "Explore the interactive map"
  Visual: Screenshot/animation of the split map view
  CTA: "Got it →"

Step 3 — "Export & share anywhere"
  Visual: iCal icon + PDF icon + share link icon
  CTA: "Start planning! 🗺️"
```

**Definition of Done:**
- [x] Modal appears exactly once for new users (after first sign-in)
- [x] "Skip" button on every step
- [x] Completion stored in `UserPreferences.preferences.onboardingComplete`
- [x] Welcome email sent on account creation
- [x] Returning users never see the modal

---

### Task 2.5 — Undo/Redo for Activity Edits
**Effort:** 1 day | **Impact:** Medium (prevents data loss frustration)

**Discovery:** `sonner` is installed and used throughout. `@dnd-kit` handles reordering in [`components/itinerary/SortableActivityList.tsx`](./components/itinerary/SortableActivityList.tsx). Currently, deleting or reordering is irreversible.

**Files to create:**
```
app/hooks/
  useUndoableActions.ts        ← Action history stack (max 10 items)
```

**Files to modify:**
- [`components/itinerary/ActivityActionsMenu.tsx`](./components/itinerary/ActivityActionsMenu.tsx) — Show undo toast on delete
- [`components/itinerary/SortableActivityList.tsx`](./components/itinerary/SortableActivityList.tsx) — Show undo toast on reorder

**Undo pattern (using Sonner):**
```typescript
// On delete:
const snapshot = [...activities];
optimisticallyRemove(activityId);
toast("Activity removed", {
  action: { label: "Undo", onClick: () => restoreSnapshot(snapshot) },
  duration: 5000,
});

// On reorder (dnd-kit onDragEnd):
const snapshot = [...activities];
applyNewOrder(newOrder);
toast("Order updated", {
  action: { label: "Undo", onClick: () => restoreSnapshot(snapshot) },
  duration: 4000,
});
```

**Definition of Done:**
- [x] Delete activity → undo toast for 5 seconds → clicking Undo restores the activity
- [x] Reorder activities → undo toast for 4 seconds → clicking Undo restores order
- [x] DB sync only happens if undo is NOT triggered within the timeout

---

## Sprint 3 — Growth Engine
> **Duration:** Month 2 | **Depends on:** Sprint 2 stable

### Task 3.1 — Price Alert Cron Job
**Effort:** 3 days | **Impact:** High (highest-retention feature; email brings users back)

**Discovery:** The `PriceAlert` model in [`prisma/schema.prisma`](./prisma/schema.prisma) is fully designed (lines 511–538) with `criteria: Json`, `targetPrice`, `currentPrice`, `isActive`, `triggered`. `app/lib/emailService.ts` has a working Nodemailer setup. `app/lib/flightService.ts` exists (2 KB) — check if it has real API calls or stubs.

**Files to create:**
```
app/api/jobs/price-check/
  route.ts                     ← Cron-triggered endpoint
lib/
  priceCheckService.ts         ← Price fetching + comparison logic
app/lib/emailTemplates/
  priceAlert.ts                ← HTML email template
vercel.json                    ← Cron schedule config
```

**[`vercel.json`](./vercel.json)** (create at root):
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

**Cron job flow:**
```
1. Validate CRON_SECRET header (prevent public triggering)
2. Fetch all PriceAlerts where isActive=true AND triggered=false
3. For each alert:
   a. Parse criteria JSON (origin, destination, date for flights)
   b. Call price API (use Amadeus sandbox or mock with random ±5%)
   c. Update PriceAlert.currentPrice
   d. If currentPrice <= targetPrice:
      → Send email via emailService
      → Set triggered=true
      → Set isActive=false (alert consumed)
4. Return { checked: N, triggered: M }
```

**Add to `.env`:**
```
CRON_SECRET=your_random_cron_secret
```

**Definition of Done:**
- [ ] `GET /api/jobs/price-check` with correct `CRON_SECRET` header runs the job
- [ ] Without `CRON_SECRET` header → 401
- [ ] Email received when simulated price drops below target
- [ ] `PriceAlert.triggered = true` after first email sent
- [ ] Vercel Cron fires daily at 09:00 UTC (verified in Vercel dashboard)

---

### Task 3.2 — Itinerary Chat Sidebar
**Effort:** 2 days | **Impact:** High (transforms refinement UX)

**Discovery:** [`app/api/chat/route.ts`](./app/api/chat/route.ts) is a fully working conversational AI endpoint. [`app/components/ui/AIChatAssistant.tsx`](./app/components/ui/AIChatAssistant.tsx) is the landing-page chat widget (7.7 KB). [`components/itinerary/RefinementBar.tsx`](./components/itinerary/RefinementBar.tsx) handles single-shot refinement. The gap: no persistent chat with itinerary context inside the saved itinerary view.

**Files to create:**
```
components/itinerary/
  ItineraryChatSidebar.tsx     ← Full chat panel with itinerary context
```

**Files to modify:**
- [`app/api/chat/route.ts`](./app/api/chat/route.ts) — Accept optional `itineraryContext` in body
- [`components/itinerary/SplitItineraryView.tsx`](./components/itinerary/SplitItineraryView.tsx) — Add chat sidebar toggle button

**Extended `/api/chat` request body:**
```typescript
const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
  itineraryContext: z.object({
    id: z.string(),
    destination: z.string(),
    duration: z.number(),
    travelers: z.string().optional(),
    days: z.array(z.object({
      dayNumber: z.number(),
      theme: z.string().optional(),
      activityTitles: z.array(z.string()),
    })),
  }).optional(),
});
```

**Updated system instruction when context present:**
```
You are an AI travel assistant for Wander.AI helping refine an existing itinerary.

Current itinerary: [destination], [duration] days for [travelers]
Day 1 ([theme]): [activity1], [activity2], [activity3]
Day 2 ([theme]): [activity1], [activity2]
...

Help the user modify this plan. When suggesting replacements, describe 
the new activity clearly. Keep responses under 3 sentences.
```

**Definition of Done:**
- [ ] Chat sidebar opens/closes with a button in `SplitItineraryView`
- [ ] AI responses reference specific days and activities from the current plan
- [ ] Chat history persists for the session (not lost on panel close)
- [ ] "Apply suggestion" button applies AI-suggested activity swap

---

### Task 3.3 — SEO Destination Landing Pages
**Effort:** 3 days | **Impact:** Very High (organic traffic engine)

**Discovery:** `app/sitemap.ts` exists. `app/robots.ts` exists. No destination-specific pages exist. The `trip-creation-form.tsx` has 9 hardcoded popular destinations — these should be extracted to a shared data file and linked to destination pages.

**Files to create:**
```
lib/
  destinations.ts              ← Master list of 50 destinations
app/destinations/
  page.tsx                     ← Index page (/destinations)
  [slug]/
    page.tsx                   ← Individual destination (ISR, revalidate: 86400)
    loading.tsx                ← Skeleton
```

**[`lib/destinations.ts`](./lib/destinations.ts) shape:**
```typescript
export type Destination = {
  slug: string;            // "tokyo-japan"
  name: string;            // "Tokyo, Japan"
  countryCode: string;     // "JP"
  region: string;          // "Asia"
  heroKeyword: string;     // "tokyo japan travel" (for Unsplash)
  tagline: string;         // "Neon lights, ancient temples, world-class sushi"
  bestMonths: string[];    // ["March", "April", "October", "November"]
  popularDurations: number[]; // [3, 5, 7]
  tags: string[];          // ["culture", "food", "tech", "history"]
  sampleItineraryId: string | null; // ID of a real public itinerary
};
```

**`app/destinations/[slug]/page.tsx` sections:**
1. **Hero** — Unsplash image (reuse `app/lib/unsplashService.ts`) + title + CTA
2. **Sample itinerary** — pull `sampleItineraryId` from DB, show day-by-day preview
3. **Quick-generate buttons** — "Plan 3 days", "Plan 5 days", "Plan 7 days"
4. **Best time to visit** — based on `bestMonths` data
5. **FAQ** — 3-5 Q&As for long-tail keywords
6. **Related destinations** — 4 cards with same region/tags

**SEO metadata per page:**
```typescript
export async function generateMetadata({ params }) {
  const dest = DESTINATIONS.find(d => d.slug === params.slug);
  return {
    title: `${dest.name} Travel Itinerary — AI-Powered Plans | Wander.AI`,
    description: `Plan the perfect ${dest.name} trip with AI. Get a custom day-by-day itinerary for any budget, duration, and travel style. Free to try.`,
    openGraph: { images: [{ url: heroImageUrl }] },
  };
}
```

**Files to modify:**
- [`app/sitemap.ts`](./app/sitemap.ts) — add all 50 destination URLs
- [`components/trip-creation-form.tsx`](./components/trip-creation-form.tsx) — link `POPULAR_DESTINATIONS` to `/destinations/[slug]`

**Definition of Done:**
- [ ] 50 destination pages render with ISR (`revalidate: 86400`)
- [ ] Each has unique `<title>`, `<meta description>`, Open Graph image
- [ ] JSON-LD `TouristDestination` structured data present
- [ ] All 50 URLs in `sitemap.xml`
- [ ] Quick-generate buttons pre-fill the trip form with the destination

---

### Task 3.4 — Referral Program
**Effort:** 1.5 days | **Impact:** High (lowest-cost user acquisition)

**Discovery:** `User` model has `itinerariesThisMonth` and `lastResetDate` for quota tracking. Adding a referral code and bonus credits requires a small schema migration.

**Schema migration — add to `User` model in [`prisma/schema.prisma`](./prisma/schema.prisma):**
```prisma
referralCode      String?  @unique  // User's shareable code (e.g. "ALICE42")
referredByCode    String?           // Code used when this user signed up
bonusItineraries  Int      @default(0) // Extra generations from referrals
```

**Migration:**
```bash
npx prisma migrate dev --name add_referral_fields
```

**Files to create:**
```
app/api/users/referral/
  route.ts                     ← GET (get code + stats), POST (apply code)
components/dashboard/
  ReferralCard.tsx             ← Dashboard card with shareable link + stats
```

**Referral flow:**
```
Sign-up page URL: /auth/register?ref=ALICE42

On registration:
  → Store referredByCode = "ALICE42"
  → Generate unique referralCode for new user (e.g. random 6-char alphanumeric)

On new user's FIRST itinerary generation:
  → Give new user: bonusItineraries += 5
  → Find referrer (User where referralCode = "ALICE42")
  → Give referrer: bonusItineraries += 5
  → Send both users a "You earned 5 bonus trips!" email

Quota check in lib/rateLimit.ts (or edgeRateLimit.ts):
  → effective_limit = tier_limit + bonusItineraries
```

**Definition of Done:**
- [ ] Every user has a unique `referralCode` (generated on account creation)
- [ ] Referral link `wanderai.com/register?ref=CODE` visible in dashboard
- [ ] Both parties receive +5 itineraries on first referral's first generation
- [ ] "You've referred N friends and earned N bonus trips" stat on dashboard
- [ ] Referral bonus applied correctly in quota calculation

---

## Sprint 4 — Platform Expansion
> **Duration:** Months 3–6 | **Depends on:** Sprint 3 stable + team review

### Task 4.1 — Real-Time Collaborative Editing
**Effort:** 1 week | **Activate** the fully designed `ItineraryCollaborator` model

**Key decisions:**
- Use **Pusher** (simplest, 100 connections free) vs **Liveblocks** (richer, but opinionated)
- Start with presence (who's viewing) + optimistic activity updates
- Role enforcement: VIEWER sees but can't edit; EDITOR can modify; OWNER can invite/remove

**Files to create:**
```
lib/pusher.ts
app/api/itineraries/[id]/collaborators/route.ts
components/itinerary/CollaboratorPresenceBar.tsx
components/itinerary/InviteCollaboratorDialog.tsx
```

---

### Task 4.2 — Multi-City Trip Support
**Effort:** 1 week | **Schema + prompt + form changes**

**Schema migration:**
```prisma
// Itinerary model additions:
destinations   String[]  @default([])
isMultiCity    Boolean   @default(false)
```

**Form change:** "Add another city +" button in `trip-creation-form.tsx`.

**Prompt change in `app/api/generate/route.ts`:** When `destinations.length > 1`, generate with geo-boundaries per city block, inserting `TRANSPORTATION` activities for transit days.

---

### Task 4.3 — Flight & Hotel Search
**Effort:** 2 weeks | **Revenue impact: High (affiliate commissions)**

**Amadeus API** (free sandbox): `lib/amadeus.ts`
**Booking.com Partner API**: `app/lib/bookingService.ts` (1 KB stub — flesh it out)

Surface flight results in `FlightCard.tsx` (already exists at 8.6 KB) and hotel results in a new `HotelCard.tsx`.

All outbound links include affiliate tracking parameters.

---

### Task 4.4 — Activity Group Voting
**Effort:** 3 days

**Schema migration:**
```prisma
model ActivityVote {
  id         String   @id @default(cuid())
  activityId String
  userId     String
  vote       Int      // +1 thumbs up, -1 thumbs down
  createdAt  DateTime @default(now())

  activity   Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([activityId, userId])
  @@map("activity_votes")
}
```

Surface vote tallies in `SortableActivityCard.tsx` when itinerary has collaborators.

---

### Task 4.5 — i18n
**Effort:** 2 weeks | **Start with:** Spanish, French, Japanese

```bash
npm install next-intl
```

Scope: UI strings only (navigation, buttons, labels, error messages). AI generation output already adapts to destination context.

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Gemini API rate limit exceeded in production | Medium | High | Add `gemini-2.0-flash` fallback model (already partially done in `chat/route.ts`) |
| PostgreSQL connection pool exhaustion | High | High | Configure PgBouncer or Prisma Accelerate before Sprint 3 |
| Lemon Squeezy webhook delivery failure | Low | High | Add idempotency key check in webhook handler |
| Nominatim geocoding rate limit (1 req/s) | Medium | Medium | Add request queue + 1s delay in `placeVerification.ts` |
| PDF generation timeout on Vercel (10s limit) | Medium | Medium | Use streaming PDF or pre-generate on itinerary save |
| `metadata: Json?` field collision | Low | Medium | Create typed wrapper `MetadataManager` before Sprint 2 |
| Referral system abuse (multiple accounts) | Medium | Medium | Rate-limit referral credits; require email verification before bonus |

---

## Definition of Done (Global)

Every task is "done" when ALL of the following are true:

1. **Code** — Feature works end-to-end (verified manually)
2. **Tests** — At least 2 unit tests added for any new logic
3. **Types** — No new `any` types introduced
4. **Error handling** — Errors are caught and logged to Sentry (after Sprint 0.1)
5. **Mobile** — Feature tested on 375px viewport
6. **Dark mode** — Feature tested in both light and dark theme
7. **Docs** — If the feature adds a new env var, it's added to `.env.example` and README

---

## Progress Tracker

Update status as tasks complete. Mark with date when done.

| ID | Task | Status | Est. Hours | Actual | Done Date |
|----|------|--------|-----------|--------|-----------|
| 0.1 | Sentry error monitoring | ✅ | 0.5h | 1h | 2026-09-24 |
| 0.2 | README + .env.example | ✅ | 1h | 0.5h | 2026-09-24 |
| 0.3 | Lock /dev route | ✅ | 0.3h | 0.3h | 2026-09-24 |
| 1.1 | Activate Google OAuth | ✅ | 0.75h | 0.5h | 2026-09-24 |
| 1.2 | Edge rate limiting | ✅ | 3h | 1.5h | 2026-09-24 |
| 1.3 | Packing list generator | ✅ | 8h | 3h | 2026-09-24 |
| 1.4 | Vitest baseline tests | ✅ | 2h | 1h | 2026-09-24 |
| 2.1 | SSE progress bar | ✅ | 8h | 2h | 2026-09-24 |
| 2.2 | Mobile itinerary view | ✅ | 24h | 2h | 2026-09-24 |
| 2.3 | PDF export | ✅ | 16h | 1.5h | 2026-09-24 |
| 2.4 | Onboarding flow | ⬜ | 16h | — | — |
| 2.5 | Undo/redo edits | ⬜ | 8h | — | — |
| 3.1 | Price alert cron | ⬜ | 24h | — | — |
| 3.2 | Chat sidebar | ⬜ | 16h | — | — |
| 3.3 | SEO destination pages | ⬜ | 24h | — | — |
| 3.4 | Referral program | ⬜ | 12h | — | — |
| 4.1 | Real-time collaboration | ⬜ | 40h | — | — |
| 4.2 | Multi-city trips | ⬜ | 40h | — | — |
| 4.3 | Activity voting | ⬜ | 24h | — | — |
| 4.4 | i18n | ⬜ | 80h | — | — |

**Status:** ⬜ Todo · 🔄 In Progress · ✅ Done · ⏸ Blocked · ❌ Cancelled

---

*Cross-references: [PROJECT_GROWTH_PLAN.md](./PROJECT_GROWTH_PLAN.md) · [IMPROVEMENT_PHASES.md](./IMPROVEMENT_PHASES.md)*
