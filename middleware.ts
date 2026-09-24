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
  "/hotels",
  "/flights",
  "/pricing",
  "/marketplace",
  "/privacy",
  "/terms",
];

const PUBLIC_PREFIXES = [
  "/dev",           // Development UI test page
  "/api/auth",
  "/api/jobs",      // SSE stream and job status polling
  "/api/places",    // Place search and geocoding
  "/api/weather",   // Real-time Open-Meteo weather forecasts
  "/auth/",         // All auth pages (signin, register, verify-email, forgot-password, reset-password, error)
  "/itinerary/",    // Itinerary viewer
  "/shared/",       // Public shared itinerary view
  "/public/",       // Future public profile pages
  "/_next",
  "/favicon",
  "/icon",
  "/og-image",
  "/manifest",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow static assets and Next.js internals
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Allow public itinerary export endpoints (Google Calendar, iCal)
  if (
    pathname.startsWith("/api/itineraries/") &&
    (pathname.includes("/export") || pathname.includes("/calendar"))
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
