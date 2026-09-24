const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
const API_URL = "https://api.unsplash.com/search/photos";

// Curated high-quality fallbacks to ensure "Visual Richness" even without an API key
const CURATED_IMAGES: Record<string, string> = {
  tokyo:
    "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=2994&auto=format&fit=crop",
  paris:
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2973&auto=format&fit=crop",
  "new york":
    "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=2940&auto=format&fit=crop",
  london:
    "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=2940&auto=format&fit=crop",
  dubai:
    "https://images.unsplash.com/photo-1512453979798-5ea932a23644?q=80&w=2800&auto=format&fit=crop",
  singapore:
    "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=2852&auto=format&fit=crop",
  kyoto:
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2940&auto=format&fit=crop",
  osaka:
    "https://images.unsplash.com/photo-1590559899731-a38283956c8c?q=80&w=2800&auto=format&fit=crop",
};

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2940&auto=format&fit=crop";

export const getDestinationImage = async (
  destination: string
): Promise<string> => {
  const normalizedDest = destination.toLowerCase();

  // 1. Try API if key exists (Dynamic!)
  if (UNSPLASH_ACCESS_KEY) {
    try {
      // Fetch 5 images to pick a random one for "dynamic" feel
      const res = await fetch(
        `${API_URL}?query=${encodeURIComponent(
          destination
        )}&orientation=landscape&per_page=5`,
        {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        console.log("Unsplash API Response:", data);

        if (data.results && data.results.length > 0) {
          // Pick a random image from the top 5 results
          const randomIndex = Math.floor(Math.random() * data.results.length);
          const photo = data.results[randomIndex];

          // Use the raw URL with custom parameters for better quality and control
          const imageUrl = `${photo.urls.raw}&w=2800&h=1400&fit=crop&q=80&auto=format`;

          console.log("Selected Unsplash Image:", imageUrl);

          // Trigger download endpoint (required by Unsplash API guidelines)
          if (photo.links?.download_location) {
            fetch(photo.links.download_location, {
              headers: {
                Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
              },
            }).catch(() => {
              // Silently fail - this is just for tracking
            });
          }

          return imageUrl;
        } else {
          console.warn("Unsplash API returned no results for:", destination);
        }
      } else {
        console.error("Unsplash API Error:", res.status, res.statusText);
        const errorData = await res.json().catch(() => null);
        if (errorData) {
          console.error("Error details:", errorData);
        }
      }
    } catch (error) {
      console.error("Unsplash API fetch failed:", error);
    }
  }

  // 2. Fallback to curated if API failed or no key
  if (CURATED_IMAGES[normalizedDest]) {
    console.log("Using curated fallback for:", destination);
    return CURATED_IMAGES[normalizedDest];
  }

  console.log("Using default fallback image");
  return DEFAULT_IMAGE;
};
