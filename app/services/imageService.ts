/**
 * app/services/imageService.ts
 * AI-powered destination hero banner image generation and persistence.
 * 
 * 1. Uses Gemini LLM to generate an optimized visual query for the destination.
 * 2. Fetches a high-resolution, verified photo link from Unsplash API using NEXT_PUBLIC_UNSPLASH_ACCESS_KEY.
 * 3. Gracefully falls back to curated high-resolution destination CDN images or local static assets.
 * 4. Persists the image URL in PostgreSQL (coverImage and images fields) for consistent use across the entire app.
 */

import { GoogleGenAI } from "@google/genai";
import prisma from "@/lib/prisma";

// Curated high-resolution fallback photos for popular travel destinations
const FALLBACK_DESTINATION_IMAGES: Record<string, string> = {
  tokyo: "/images/destinations/tokyo.jpg",
  japan: "/images/destinations/tokyo.jpg",
  paris: "/images/destinations/paris.jpg",
  france: "/images/destinations/paris.jpg",
  amalfi: "/images/destinations/amalfi.jpg",
  italy: "/images/destinations/amalfi.jpg",
  reykjavik: "/images/destinations/reykjavik.jpg",
  iceland: "/images/destinations/reykjavik.jpg",
  goa: "/images/destinations/goa.jpg",
  singapore: "/images/destinations/singapore.jpg",
  coimbatore: "/images/destinations/coimbatore.jpg",
  india: "/images/destinations/goa.jpg",
  default: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80",
};

/**
 * Get fallback image based on destination text.
 */
function getCuratedFallback(destination: string): string {
  const norm = destination.toLowerCase();
  for (const [key, url] of Object.entries(FALLBACK_DESTINATION_IMAGES)) {
    if (key !== "default" && norm.includes(key)) {
      return url;
    }
  }
  return FALLBACK_DESTINATION_IMAGES.default;
}

/**
 * Query Gemini LLM to generate an optimized visual search description for the city.
 */
async function generateImageQueryWithLLM(
  destination: string,
  title?: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return `${destination} city landmark skyline`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const prompt = `You are a travel art director. Provide a 3 to 6 word search query for a high-end, iconic, cinematic wide landscape photograph of "${destination}" (Trip title: "${title || destination}").
Focus on the most famous landmark, skyline, or scenic atmosphere of this city.
Return ONLY the search query words, nothing else. No punctuation, no quotes.`;

    const res = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    const text = res.text?.trim().replace(/["'\n\r]/g, "");
    if (text && text.length > 2 && text.length < 100) {
      return text;
    }
  } catch (err) {
    console.warn("[ImageService] LLM query generation error, using fallback:", err);
  }

  return `${destination} city skyline landmark`;
}

/**
 * Fetch a high-resolution photo link from Unsplash API for a query.
 */
async function fetchUnsplashPhoto(query: string): Promise<string | null> {
  const accessKey =
    process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY ||
    process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) return null;

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
      query
    )}&orientation=landscape&per_page=1&client_id=${accessKey}`;

    const res = await fetch(url, { next: { revalidate: 86400 } } as any);
    if (!res.ok) {
      console.warn(`[ImageService] Unsplash API returned status ${res.status}`);
      return null;
    }

    const data = await res.json();
    const first = data?.results?.[0];

    if (first?.urls?.regular) {
      // Return high-resolution landscape version optimized for hero banners
      return first.urls.regular;
    }
  } catch (err) {
    console.warn("[ImageService] Unsplash fetch error:", err);
  }

  return null;
}

/**
 * Resolve an AI-generated/curated city image link for a destination.
 */
export async function resolveDestinationImage(
  destination: string,
  title?: string,
  hintPrompt?: string
): Promise<string> {
  // 1. If LLM provided a hint prompt or we generate one via Gemini
  const query = hintPrompt || (await generateImageQueryWithLLM(destination, title));

  // 2. Try fetching high-res photo from Unsplash with LLM's query
  const unsplashUrl = await fetchUnsplashPhoto(query);
  if (unsplashUrl) {
    return unsplashUrl;
  }

  // 3. Try with destination name alone if prompt had no results
  if (query !== destination) {
    const destPhoto = await fetchUnsplashPhoto(`${destination} travel`);
    if (destPhoto) {
      return destPhoto;
    }
  }

  // 4. Return curated high-resolution city image
  return getCuratedFallback(destination);
}

/**
 * Generate a destination banner image and persist it into the database for consistent use.
 */
export async function generateAndPersistCoverImage(
  itineraryId: string,
  destination: string,
  title?: string
): Promise<string> {
  try {
    const imageUrl = await resolveDestinationImage(destination, title);

    await prisma.itinerary.update({
      where: { id: itineraryId },
      data: {
        coverImage: imageUrl,
        images: {
          set: [imageUrl],
        },
      },
    });

    console.log(`[ImageService] Successfully persisted cover image for itinerary ${itineraryId}:`, imageUrl);
    return imageUrl;
  } catch (err) {
    console.error(`[ImageService] Failed to persist cover image for ${itineraryId}:`, err);
    return getCuratedFallback(destination);
  }
}
