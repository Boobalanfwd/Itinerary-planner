import { nominatimProvider } from "./nominatim";
import { findPlaceByName, upsertPlace } from "@/lib/repositories/placeRepository";
import { prisma } from "@/lib/prisma";
import {
  getDestinationCoords,
  resolveDestinationCoords,
  getCountryCode,
  getDistanceKm,
} from "@/lib/country-code";

const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  process.env.MAPBOX_TOKEN;

export async function resolvePlace(query: string, nearLocation?: string) {
  // 1. Check local place cache, scoped to destination to avoid cross-country collisions
  const cached = await findPlaceByName(query, nearLocation ?? null);
  if (cached && cached.lat && cached.lng) {
    if (nearLocation) {
      const staticCenter = getDestinationCoords(nearLocation);
      const center = staticCenter.isFallback
        ? await resolveDestinationCoords(nearLocation)
        : staticCenter;

      if (center && !center.isFallback && (center.lat !== 20.0 || center.lng !== 0.0)) {
        const distKm = getDistanceKm(cached.lat, cached.lng, center.lat, center.lng);
        if (distKm > 120) {
          console.warn(
            `[placeVerification] Evicting corrupted cache for "${query}" near "${nearLocation}" (dist=${distKm.toFixed(1)}km)`
          );
        } else {
          return {
            dbId: cached.id,
            placeId: cached.placeId || cached.id,
            name: cached.name,
            formattedAddress: cached.formattedAddress || cached.name,
            lat: cached.lat,
            lng: cached.lng,
            category: cached.category || undefined,
          };
        }
      } else {
        return {
          dbId: cached.id,
          placeId: cached.placeId || cached.id,
          name: cached.name,
          formattedAddress: cached.formattedAddress || cached.name,
          lat: cached.lat,
          lng: cached.lng,
          category: cached.category || undefined,
        };
      }
    }
  }

  // 2. Call OSM Nominatim provider (constrained to destination country/region)
  const resolved = await nominatimProvider.geocode(query, nearLocation);
  if (resolved) {
    const upserted = await upsertPlace({
      name: query,
      formattedAddress: resolved.formattedAddress,
      lat: resolved.lat,
      lng: resolved.lng,
      category: resolved.category,
      placeId: resolved.placeId,
      metadata: resolved.raw,
      destination: nearLocation,
    });
    return {
      ...resolved,
      dbId: upserted.id,
    };
  }

  // 3. Fallback to Mapbox Geocoding with country, proximity, and bounding box
  if (nearLocation && MAPBOX_TOKEN) {
    try {
      const staticCenter = getDestinationCoords(nearLocation);
      const center = staticCenter.isFallback
        ? await resolveDestinationCoords(nearLocation)
        : staticCenter;

      if (center && (center.lat !== 20.0 || center.lng !== 0.0)) {
        const countryCode = getCountryCode(nearLocation)?.toLowerCase();
        const cleanQuery = query.replace(/\(.*?\)/g, "").trim();
        const searchTerms = [
          `${cleanQuery}, ${nearLocation}`,
          cleanQuery.replace(/Mahal/i, "Palace") + `, ${nearLocation}`,
          cleanQuery.replace(/Koyil/i, "Kovil") + `, ${nearLocation}`,
          cleanQuery,
        ];

        for (const term of searchTerms) {
          const params = new URLSearchParams({
            access_token: MAPBOX_TOKEN,
            limit: "5",
            types: "poi,address,place",
            proximity: `${center.lng},${center.lat}`,
            bbox: `${center.lng - 0.35},${center.lat - 0.35},${center.lng + 0.35},${center.lat + 0.35}`,
          });

          if (countryCode) {
            params.set("country", countryCode);
          }

          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
              term
            )}.json?${params.toString()}`
          );

          if (!res.ok) continue;
          const data = await res.json();
          const features = data?.features || [];

          for (const feat of features) {
            const [fLng, fLat] = feat.center || [];
            if (typeof fLat === "number" && typeof fLng === "number") {
              const distKm = getDistanceKm(fLat, fLng, center.lat, center.lng);
              if (distKm <= 120) {
                const mapboxResolved = {
                  placeId: feat.id || `mb-${Date.now()}`,
                  name: query,
                  formattedAddress: feat.place_name || `${query}, ${nearLocation}`,
                  lat: fLat,
                  lng: fLng,
                  category: feat.properties?.category || undefined,
                };

                const upserted = await upsertPlace({
                  name: query,
                  formattedAddress: mapboxResolved.formattedAddress,
                  lat: mapboxResolved.lat,
                  lng: mapboxResolved.lng,
                  category: mapboxResolved.category,
                  placeId: mapboxResolved.placeId,
                  destination: nearLocation,
                });

                return {
                  ...mapboxResolved,
                  dbId: upserted.id,
                };
              }
            }
          }
        }

        // 4. Guaranteed destination placement fallback: center + deterministic slight dispersal
        const hash = Array.from(query).reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const offsetLat = ((hash % 15) - 7) * 0.001;
        const offsetLng = (((hash >> 2) % 15) - 7) * 0.001;
        const fallbackResolved = {
          placeId: `gen-${hash}`,
          name: query,
          formattedAddress: `${query}, ${nearLocation}`,
          lat: center.lat + offsetLat,
          lng: center.lng + offsetLng,
          category: "attraction",
        };

        const upserted = await upsertPlace({
          name: query,
          formattedAddress: fallbackResolved.formattedAddress,
          lat: fallbackResolved.lat,
          lng: fallbackResolved.lng,
          category: fallbackResolved.category,
          placeId: fallbackResolved.placeId,
          destination: nearLocation,
        });

        return {
          ...fallbackResolved,
          dbId: upserted.id,
        };
      }
    } catch (mbErr) {
      console.warn(`[placeVerification] Mapbox fallback error for "${query}":`, mbErr);
    }
  }

  return null;
}

export async function verifyAndEnrichItinerary(itineraryId: string): Promise<void> {
  const itinerary = await prisma.itinerary.findUnique({
    where: { id: itineraryId },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: {
          activities: {
            orderBy: { position: "asc" },
          },
        },
      },
    },
  });

  if (!itinerary) return;

  const staticCenter = getDestinationCoords(itinerary.destination);
  const destCenter = staticCenter.isFallback
    ? await resolveDestinationCoords(itinerary.destination)
    : staticCenter;

  for (const day of itinerary.days) {
    let prevCoords: { lat: number; lng: number } | null = null;
    let prevActivityId: string | null = null;
    let prevActivityCleanNotes: string | null = null;

    for (const activity of day.activities) {
      let currentLat = activity.locationLat;
      let currentLng = activity.locationLng;

      // Validate existing coordinate against destination center
      const isExistingValid =
        currentLat !== null &&
        currentLng !== null &&
        destCenter &&
        (destCenter.lat === 20.0 && destCenter.lng === 0.0
          ? true
          : getDistanceKm(currentLat, currentLng, destCenter.lat, destCenter.lng) <= 120);

      // If coordinates missing or out-of-region, re-resolve place
      if (!currentLat || !currentLng || !isExistingValid) {
        const place = await resolvePlace(activity.title, itinerary.destination);
        if (place) {
          currentLat = place.lat;
          currentLng = place.lng;

          await prisma.activity.update({
            where: { id: activity.id },
            data: {
              locationLat: place.lat,
              locationLng: place.lng,
              address: place.formattedAddress,
              placeId: (place as any).dbId || undefined,
            },
          });
        }
      }

      // Base note without any previous "Next stop: ~" suffix
      const rawNotes = activity.notes || "";
      const cleanNotes = rawNotes.replace(/\s*•?\s*Next stop:\s*~.*$/gi, "").trim();

      // If both current and previous have coordinates, compute travel time
      if (prevCoords && currentLat && currentLng && prevActivityId) {
        const straightDistKm = getDistanceKm(
          currentLat,
          currentLng,
          prevCoords.lat,
          prevCoords.lng
        );

        // Sanity check: only calculate travel time if stops are within 120 km
        if (straightDistKm <= 120) {
          const mode = straightDist < 0.018 ? "walking" : "transit";
          const travel = await nominatimProvider.calculateDistanceAndTime(
            prevCoords,
            { lat: currentLat, lng: currentLng },
            mode
          );

          const nextStopSuffix = `Next stop: ~${travel.durationMinutes} min ${travel.mode} (${(travel.distanceMeters / 1000).toFixed(1)} km)`;
          const updatedNote = prevActivityCleanNotes
            ? `${prevActivityCleanNotes} • ${nextStopSuffix}`
            : nextStopSuffix;

          await prisma.activity.update({
            where: { id: prevActivityId },
            data: { notes: updatedNote },
          });
        } else {
          // Anomalous distance — keep clean note without ridiculous travel time
          if (prevActivityCleanNotes !== rawNotes) {
            await prisma.activity.update({
              where: { id: prevActivityId },
              data: { notes: prevActivityCleanNotes || null },
            });
          }
        }
      }

      if (currentLat && currentLng) {
        prevCoords = { lat: currentLat, lng: currentLng };
        prevActivityId = activity.id;
        prevActivityCleanNotes = cleanNotes;
      }
    }
  }
}
