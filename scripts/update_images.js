const fs = require("fs");
const path = require("path");

const envFile = fs.readFileSync(path.join(__dirname, "../.env"), "utf8");
const env = {};
for (const line of envFile.split("\n")) {
  const parts = line.split("=");
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join("=").trim().replace(/^"|"$/g, "");
  }
}

const { GoogleGenAI } = require("@google/genai");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const FALLBACK_DESTINATION_IMAGES = {
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

function getCuratedFallback(destination) {
  const norm = (destination || "").toLowerCase();
  for (const [key, url] of Object.entries(FALLBACK_DESTINATION_IMAGES)) {
    if (key !== "default" && norm.includes(key)) {
      return url;
    }
  }
  return FALLBACK_DESTINATION_IMAGES.default;
}

async function resolveImage(destination, title) {
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const model = env.GEMINI_MODEL || "gemini-2.5-flash";

  const prompt = `You are a travel art director. Provide a 3 to 6 word search query for a high-end, iconic, cinematic wide landscape photograph of "${destination}" (Trip title: "${title || destination}").
Focus on the most famous landmark, skyline, or scenic atmosphere of this city.
Return ONLY the search query words, nothing else. No punctuation, no quotes.`;

  let query = `${destination} city skyline landmark`;
  try {
    const res = await ai.models.generateContent({ model, contents: prompt });
    const text = res.text ? res.text.trim().replace(/["'\n\r]/g, "") : "";
    if (text) query = text;
  } catch(e) {
    console.warn("LLM query error:", e.message);
  }
  console.log(`[${destination}] LLM Generated Image Query: "${query}"`);

  const unsplashKey = env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
  if (unsplashKey) {
    try {
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=1&client_id=${unsplashKey}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.results && data.results[0] && data.results[0].urls && data.results[0].urls.regular) {
        return data.results[0].urls.regular;
      }
    } catch(err) {
      console.warn("Unsplash fetch error:", err.message);
    }
  }
  return getCuratedFallback(destination);
}

async function run() {
  const itineraries = await prisma.itinerary.findMany({
    select: { id: true, destination: true, title: true, coverImage: true, images: true }
  });

  console.log(`Found ${itineraries.length} itineraries in DB.`);

  for (const it of itineraries) {
    console.log(`\nResolving image for: ${it.id} (${it.destination} - ${it.title})...`);
    const imgUrl = await resolveImage(it.destination, it.title);
    console.log(`=> Image Link: ${imgUrl}`);

    const updated = await prisma.itinerary.update({
      where: { id: it.id },
      data: {
        coverImage: imgUrl,
        images: { set: [imgUrl] }
      },
      select: { id: true, destination: true, coverImage: true }
    });
    console.log(`Successfully persisted image link for ${updated.id}!`);
  }
}

run().finally(() => prisma.$disconnect());
