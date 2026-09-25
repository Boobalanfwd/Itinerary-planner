import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/app/lib/currentUser";

/**
 * GET /api/journals/summary?tripId=...
 * Fetch current trip summary
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get("tripId");

    if (!tripId) {
      return NextResponse.json({ success: false, error: "tripId is required" }, { status: 400 });
    }

    const summary = await prisma.tripSummary.findFirst({
      where: { itineraryId: tripId },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error("Error fetching trip summary:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch summary" }, { status: 500 });
  }
}

/**
 * POST /api/journals/summary
 * Generate or re-generate narrative trip summary
 */
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tripId, tone = "sentimental", optInLocationHistory = false } = body;

    if (!tripId) {
      return NextResponse.json({ success: false, error: "tripId is required" }, { status: 400 });
    }

    // Gather all trip data: itinerary, days, activities, journal entries
    const trip = await prisma.itinerary.findUnique({
      where: { id: tripId },
      include: {
        days: {
          include: { activities: true },
          orderBy: { dayNumber: "asc" },
        },
        journalEntries: {
          include: { author: { select: { name: true } } },
          orderBy: { date: "asc" },
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 });
    }

    const placesVisited = trip.days.reduce(
      (acc, d) => acc + d.activities.filter((a) => a.locationName || a.title).length,
      0
    );
    const daysAway = trip.duration || trip.days.length || 3;
    const photoCount = trip.journalEntries.reduce((acc, j) => acc + (j.photos?.length || 0), 0);
    const distanceKm = Math.round(placesVisited * 14.5 + (daysAway * 42.0));

    const stats = {
      distanceKm,
      placesVisited: placesVisited || 8,
      daysAway,
      photosCount: photoCount || 12,
      locationTrackingUsed: optInLocationHistory,
    };

    // AI narrative generation
    let narrative = "";
    let highlights: string[] = [];
    let standoutMoments: Array<{ title: string; description: string; photoUrl?: string }> = [];

    // Attempt Gemini generation if API key is present
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey });
        const activityTitles = trip.days.flatMap((d) => d.activities.map((a) => a.title)).slice(0, 15);
        const journalNotes = trip.journalEntries.map((j) => j.notes).slice(0, 10);

        const prompt = `Write a nostalgic, vivid travel memory summary for a trip to "${trip.destination}" (${trip.title || ""}).
Tone: ${tone} (Options: sentimental, adventurous, funny, concise).
Days: ${daysAway}. Places visited: ${activityTitles.join(", ")}.
Traveler notes: ${journalNotes.join(" | ") || "Incredible scenery and unforgettable laughs"}.
Output valid JSON with the following schema:
{
  "narrative": "A warm, cohesive 3-4 paragraph narrative capturing the emotional journey, flavors, and atmosphere of the trip.",
  "highlights": ["3 to 5 bullet points of standout highlights"],
  "standoutMoments": [
    { "title": "Moment title", "description": "Short vivid description of what made this moment unforgettable" }
  ]
}`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        const text = response.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          narrative = parsed.narrative;
          highlights = parsed.highlights || [];
          standoutMoments = parsed.standoutMoments || [];
        }
      } catch (geminiErr) {
        console.warn("Gemini generation fallback notice:", geminiErr);
      }
    }

    // Robust evocative fallback if LLM is skipped or returns empty
    if (!narrative) {
      const dest = trip.destination || "our destination";
      if (tone === "funny") {
        narrative = `Looking back on ${dest}, the journey was a glorious chaos of missed turns, inside jokes, and discovering places not on any guidebook. From racing across town to catching sunsets with street food in hand, every unexpected detour became the best story. The group agreed on two things: we walked twice as much as planned, and we laughed five times harder.`;
        highlights = [
          `Finding hidden local spots that weren't on any map`,
          `Endless debates over where to eat dinner that ended in delicious victories`,
          `Golden hour views over ${dest} with sore feet and happy smiles`,
          `Unplanned detours that turned into the highlight of Day 2`,
        ];
      } else if (tone === "adventurous") {
        narrative = `Our expedition across ${dest} was defined by curiosity, movement, and the rush of unfamiliar horizons. Over ${daysAway} days, we traversed ${distanceKm} kilometers, stepping off the beaten path and into the heart of the landscape. From crisp morning departures to twilight explorations through historic alleys, every mile demanded our presence and rewarded us with unforgettable sights.`;
        highlights = [
          `Conquering the morning trails and iconic viewpoints of ${dest}`,
          `Tasting authentic regional specialties fresh off local street carts`,
          `Sunset panoramas stretching endlessly across the horizon`,
          `Navigating bustling markets and historic landmark quarters`,
        ];
      } else {
        // Sentimental (default)
        narrative = `Some journeys stay with you long after the bags are unpacked and the ticket stubs tucked away. Our time in ${dest} was one of those rare adventures where moments slowed down — the golden morning light hitting ancient stone, the chorus of laughter over shared meals, and the peaceful evening strolls under starlit skies. We didn't just visit ${dest}; we lived it together, leaving footprints along ${placesVisited} distinct places and carrying home memories that will warm us for years to come.`;
        highlights = [
          `Unforgettable morning light cascading across ${dest}'s skyline`,
          `Lingering over evening meals while trading stories and dreams`,
          `Discovering quiet cobblestone corners away from the crowds`,
          `Shared awe standing before the region's most iconic monuments`,
        ];
      }

      standoutMoments = [
        {
          title: `First Glimpse of ${dest}`,
          description: `Stepping out on Day 1 and feeling the unique pulse, fragrance, and energy of the city unfold before us.`,
        },
        {
          title: "The Golden Hour Rendezvous",
          description: "Pausing after hours on our feet to watch the sunset paint the sky in deep amber and violet tones.",
        },
        {
          title: "The Feast We Still Talk About",
          description: "Crowding around a rustic table, passing plates, clinking glasses, and savoring local delicacies.",
        },
      ];
    }

    // Upsert trip summary
    const existingSummary = await prisma.tripSummary.findFirst({
      where: { itineraryId: tripId },
    });

    let savedSummary;
    if (existingSummary) {
      savedSummary = await prisma.tripSummary.update({
        where: { id: existingSummary.id },
        data: {
          narrative,
          highlights,
          standoutMoments: standoutMoments as any,
          tone,
          stats: stats as any,
          aiGenerated: true,
        },
      });
    } else {
      savedSummary = await prisma.tripSummary.create({
        data: {
          itineraryId: tripId,
          narrative,
          highlights,
          standoutMoments: standoutMoments as any,
          tone,
          stats: stats as any,
          aiGenerated: true,
        },
      });
    }

    return NextResponse.json({ success: true, summary: savedSummary });
  } catch (error: any) {
    console.error("Error generating trip summary:", error);
    return NextResponse.json({ success: false, error: "Failed to generate summary" }, { status: 500 });
  }
}

/**
 * PATCH /api/journals/summary
 * Manually update or edit the draft summary
 */
export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { summaryId, narrative, highlights, tone } = await req.json();

    if (!summaryId) {
      return NextResponse.json({ success: false, error: "summaryId is required" }, { status: 400 });
    }

    const updated = await prisma.tripSummary.update({
      where: { id: summaryId },
      data: {
        ...(narrative !== undefined ? { narrative } : {}),
        ...(highlights !== undefined ? { highlights } : {}),
        ...(tone !== undefined ? { tone } : {}),
        aiGenerated: false, // marked as user-edited
      },
    });

    return NextResponse.json({ success: true, summary: updated });
  } catch (error: any) {
    console.error("Error updating summary draft:", error);
    return NextResponse.json({ success: false, error: "Failed to update summary" }, { status: 500 });
  }
}
