import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import * as Sentry from "@sentry/nextjs";
import { authOptions } from "@/app/lib/auth";
import { geminiService, GeminiService } from "@/app/services/geminiService";
import { createItinerary } from "@/app/services/itineraryService";
import { createJob, updateJobProgress, completeJob, failJob } from "@/lib/repositories/jobRepository";
import { checkQuotaWithEdgeFallback } from "@/lib/edgeRateLimit";
import { TripCreateSchema } from "@/schemas/trip";
import { verifyAndEnrichItinerary } from "@/lib/maps/placeVerification";
import { getForecastForDestination } from "@/lib/weather";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, subscriptionTier: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User account not found" },
        { status: 404 }
      );
    }

    const rawBody = await req.json();
    const parseResult = TripCreateSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join(", ");
      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // Check user rate limit / monthly quota (edge Redis with DB fallback)
    const quota = await checkQuotaWithEdgeFallback(user.id, user.subscriptionTier);
    if (!quota.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Monthly itinerary quota reached (${quota.limit} trips on ${quota.tier} plan). Upgrade for more itineraries.`,
          code: "QUOTA_EXCEEDED",
          quota,
        },
        { status: 429 }
      );
    }

    // Fetch real-time Open-Meteo weather context if destination is specified
    let weatherContext = "";
    try {
      if (data.destination) {
        const forecast = await getForecastForDestination(data.destination);
        if (forecast) {
          const outlook = forecast.daily
            .slice(0, 3)
            .map((d) => `${d.dayName}: ${d.condition} (${d.tempMin}°C-${d.tempMax}°C)`)
            .join(", ");
          weatherContext = `Destination Weather Context: Currently ${forecast.current.condition} at ${forecast.current.temp}°C. Upcoming outlook: ${outlook}. If rainy/cold weather is expected, prioritize sheltered/indoor venues; for clear days, prioritize scenic outdoor spots.`;
        }
      }
    } catch (wErr) {
      console.warn("[generate] Weather context fetch skipped:", wErr);
    }

    // Synthesize structured prompt
    let prompt = data.prompt?.trim() || "";
    if (prompt) {
      // Free-form AI prompt: wrap with strict geographic anchor & anti-hallucination guards
      prompt = `USER TRIP REQUEST:
"${prompt}"

═══════════════════════════════════════════════════════════════════════════
  PRO-LEVEL ARCHITECTURAL & GEOGRAPHIC INSTRUCTIONS (ZERO HALLUCINATION)
═══════════════════════════════════════════════════════════════════════════
1. IDENTIFY DESTINATION: Accurately identify the target city and country from the prompt (e.g., "Rome and Vatican City" → Rome, Italy / Vatican City).
2. STRICT GEOGRAPHIC LOCK: Every single activity, attraction, museum, restaurant, and hotel MUST be physically located within the identified destination.
3. ABSOLUTE PROHIBITION: NEVER suggest or connect places from any other country (e.g. no venues in the UK, France, or other countries when planning for Italy/Rome).
4. THEMATIC CURATION: Tailor the daily schedule to match any user preferences (such as architectural visits, solo/couple travel, historic landmarks, local cuisine, or nature/gardens) using EXCLUSIVELY authentic venues within the destination.
5. NAMING PRECISION: Use the full official local name for each venue (e.g., "Galleria Borghese, Rome", "St. Peter's Basilica, Vatican City").
6. Set 'destination' in the output JSON to reflect the destination clearly.`;
    } else {
      const dest = data.destination || "the specified destination";
      const destCity = data.destination ? data.destination.split(",")[0].trim() : dest;

      // Map traveler type to detailed behavioral and pacing guidelines
      const travelerStyleMap: Record<string, string> = {
        solo: "solo traveler (independent, highly walkable routes, safe vibrant districts, single-friendly dining, self-paced exploration)",
        couple: "couple (romantic atmosphere, scenic viewpoints, intimate dining, picturesque strolls, charming neighborhoods)",
        family: "family with children (kid-friendly pacing, safe pedestrian zones, interactive museums/parks, manageable distances)",
        friends: "group of friends (social atmosphere, lively food markets, group activities, variety of cultural and scenic spots)",
        business: "business traveler (efficient schedule, central upscale venues, refined dining, easy transit)",
      };
      const travelerStyle = travelerStyleMap[data.travelers?.toLowerCase() ?? ""] || data.travelers;

      // Map specific interests to concrete destination-grounded instructions
      const interestGuidelines: string[] = [];
      for (const interest of data.interests) {
        const lower = interest.toLowerCase();
        if (lower.includes("architect") || lower.includes("art")) {
          interestGuidelines.push(`Architecture & Art: Curate iconic structural landmarks, celebrated facades, basilicas, historic piazzas, and world-class museums strictly within ${dest}.`);
        } else if (lower.includes("histor") || lower.includes("culture")) {
          interestGuidelines.push(`History & Culture: Include UNESCO world heritage monuments, archaeological sites, and historic districts strictly within ${dest}.`);
        } else if (lower.includes("food") || lower.includes("dining")) {
          interestGuidelines.push(`Culinary: Recommend authentic local trattorias, traditional neighborhood markets, and regional gastronomic specialties strictly in ${dest}.`);
        } else if (lower.includes("nature") || lower.includes("outdoor")) {
          interestGuidelines.push(`Nature & Outdoors: Highlight destination parks, historic villas/gardens, panoramic viewpoints, and scenic walks strictly inside ${dest}.`);
        } else {
          interestGuidelines.push(`${interest}: Curate top authentic experiences strictly located inside ${dest}.`);
        }
      }

      const parts = [
        `DESTINATION: ${dest}`,
        `MANDATORY GEOGRAPHIC RULE: Every activity MUST be physically located IN ${dest}. Do NOT include places from any other country or distant region.`,
        `Duration: ${data.duration} day${data.duration !== 1 ? "s" : ""}`,
        `Traveler Profile: ${travelerStyle}`,
        `Budget Tier: ${data.budget}`,
        data.budgetAmount
          ? `Total Budget: approximately $${data.budgetAmount} ${data.currency ?? "USD"}`
          : null,
        interestGuidelines.length > 0
          ? `Interest Specializations (STRICTLY WITHIN ${dest}):\n${interestGuidelines.map((g) => `  • ${g}`).join("\n")}`
          : null,
        `Pace Preference: ${data.pace}`,
        data.style ? `Additional Travel Style: ${data.style}` : null,
        data.notes ? `Special Requirements / Must-Sees: ${data.notes}` : null,
        data.startDate ? `Travel Dates: starting ${data.startDate}${data.endDate ? ` through ${data.endDate}` : ""}` : null,
        weatherContext || null,
        `ANTI-HALLUCINATION ENFORCEMENT: Each 'place_name' must be an authentic, verifiable venue in ${dest}. Format as "Venue Name, ${destCity}". Never invent or borrow places from another country.`,
      ].filter(Boolean);

      prompt = `Generate a master-level day-by-day travel itinerary strictly for ${dest}.\n\n${parts.join("\n")}\n\nIMPORTANT: Maintain 100% geographic consistency. Every single place must be in ${dest}.`;
    }


    // Create tracking job in database
    const job = await createJob(user.id, {
      destination: data.destination,
      duration: data.duration,
      travelers: data.travelers,
      budget: data.budget,
    });

    // Background asynchronous execution handler
    const processGeneration = async () => {
      try {
        await updateJobProgress(job.id, 15, "Analyzing destination & seasonal highlights...");

        await updateJobProgress(job.id, 40, "Consulting AI travel architect for custom routes...");
        const { itinerary, usage } = await geminiService.generateItinerary(prompt);

        await updateJobProgress(job.id, 75, "Structuring timeline and daily pacing...");
        const savedItinerary = await createItinerary(user.id, itinerary);

        await updateJobProgress(job.id, 88, "Resolving locations & calculating travel times...");
        try {
          if (savedItinerary?.id) {
            await verifyAndEnrichItinerary(savedItinerary.id);
          }
        } catch (enrichErr) {
          console.warn("[generate] Place verification non-blocking notice:", enrichErr);
        }

        await updateJobProgress(job.id, 98, "Finalizing itinerary details & budget...");
        const estimatedCost = GeminiService.estimateCostUsd(
          usage,
          process.env.GEMINI_MODEL ?? "gemini-2.5-flash"
        );
        console.info(
          `[generate] Job ${job.id} completed. Tokens=${usage.totalTokens} Cost≈$${estimatedCost.toFixed(5)}`
        );

        await completeJob(job.id, {
          itineraryId: savedItinerary.id,
          title: savedItinerary.title,
          destination: savedItinerary.destination,
        });

        return savedItinerary;
      } catch (err: any) {
        console.error(`[generate] Job ${job.id} failed:`, err);
        // Report to Sentry with job context so we can debug failures
        Sentry.captureException(err, {
          tags: { jobId: job.id, destination: data.destination },
          extra: { duration: data.duration, travelers: data.travelers, budget: data.budget },
        });
        await failJob(job.id, err?.message || "Generation error");
        throw err;
      }
    };

    // If async requested (default for smooth SSE stream or workstation experience)
    if (data.async) {
      // Start background process without blocking HTTP response
      processGeneration().catch((err) => {
        console.error("[generate] Background job failure:", err);
      });

      return NextResponse.json({
        success: true,
        jobId: job.id,
        status: "processing",
        message: "Itinerary generation initiated",
      });
    }

    // Synchronous execution fallback
    const savedItinerary = await processGeneration();
    return NextResponse.json({
      success: true,
      jobId: job.id,
      data: savedItinerary,
    });
  } catch (error: any) {
    console.error("[generate] Handler error:", error);
    // Capture top-level handler errors (auth failures, validation errors, etc.)
    Sentry.captureException(error, {
      tags: { route: "/api/generate" },
    });
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to process generation request",
      },
      { status: 500 }
    );
  }
}
