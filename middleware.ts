import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Route Protection Middleware
 * - Public routes: landing, auth pages, API auth, shared/public trips, static assets
 * - Protected routes: everything else (dashboard, profile, settings, itinerary management)
 */

// Routes accessible without authentication
const PUBLIC_ROUTES = [
  "/",
  "/auth/signin",
  "/auth/register",
  "/auth/verify-email",
  "/auth/error",
  "/privacy",
  "/terms",
];

const PUBLIC_PREFIXES = [
  "/api/auth",
  "/api/jobs",        // SSE stream and job status polling
  "/api/places",      // Place search and geocoding
  "/api/weather",     // Real-time Open-Meteo weather forecasts
  "/api/sentry-test", // Sentry test diagnostic endpoint
  "/monitoring",      // Sentry tunnel route
  "/auth/",           // All auth pages (signin, register, verify-email, forgot-password, reset-password, error)
  "/itinerary/",      // Itinerary viewer
  "/shared/",         // Public shared itinerary view
  "/public/",         // Future public profile pages
  "/memory-book/",    // Public shareable memory book viewer
  "/api/memory-books/share/", // Public memory book data endpoint
  "/api/polls",       // Group decisions & voting
  "/api/comments",    // Real-time threaded comments
  "/api/journals",    // Post-trip memory journals & AI summary
  "/api/collaborators", // Collaborators & invitations
  "/api/activity-logs", // Version history audit logs
  "/api/notifications", // Notifications and invite inbox
  "/api/users/search", // In-portal traveler search
  "/api/marketplace",  // Public community trip marketplace
  "/_next",
  "/favicon",
  "/icon",
  "/og-image",
  "/manifest",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Internal dev route — restricted to ADMIN users only
  if (pathname.startsWith("/dev")) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if ((token as any)?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Always allow static assets and Next.js internals
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Allow public itinerary endpoints (Google Calendar, iCal, Packing List)
  if (
    pathname.startsWith("/api/itineraries/") &&
    (pathname.includes("/export") || pathname.includes("/calendar") || pathname.includes("/packing-list"))
  ) {
    return NextResponse.next();
  }

  // Always allow exact public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Check authentication for all other routes
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Authentication required" },
        { status: 401 }
      );
    }
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - Static files with extensions (_next/static, images, fonts, etc.)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
