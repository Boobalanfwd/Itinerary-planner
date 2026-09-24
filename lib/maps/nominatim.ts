import {
  MapProvider,
  GeocodedPlace,
  GeoCoordinates,
  TravelTimeResult,
} from "./provider";
import {
  getCountryCode as resolveCountryCode,
  getCountryCodes as resolveCountryCodes,
  getDestinationCoords,
  getDistanceKm,
} from "@/lib/country-code";

/**
 * Bounding boxes for destinations where country code alone is insufficient.
 * Format: [west, south, east, north] (lng/lat)
 */
const DESTINATION_BBOX: Record<string, [number, number, number, number]> = {
  maldives: [72.5, -1.0, 74.0, 7.5],
  bali: [114.4, -8.9, 115.8, -8.0],
  santorini: [25.3, 36.3, 25.5, 36.5],
  mykonos: [25.2, 37.4, 25.5, 37.5],
  hawaii: [-160.3, 18.9, -154.8, 22.2],
  "machu picchu": [-73.0, -13.3, -72.4, -13.0],
};

function getCountryCode(destination: string): string | null {
  const code = resolveCountryCode(destination);
  return code ? code.toLowerCase() : null;
}

function getCountryCodes(destination: string): string[] {
  const codes = resolveCountryCodes(destination);
  return codes.map((c) => c.toLowerCase());
}

function getDestinationBbox(destination: string): [number, number, number, number] | null {
  const normalized = destination.toLowerCase().trim();
  for (const [key, bbox] of Object.entries(DESTINATION_BBOX)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return bbox;
    }
  }
  return null;
}

/**
 * Validate that a coordinate is strictly within the expected destination region.
 * Rejects any coordinates that are across borders, across continents, or outside plausible distance.
 */
function isCoordinateInRegion(
  lat: number,
  lng: number,
  destination: string,
  countryCode?: string | null
): boolean {
  if (!destination) return true;

  // Check explicit bounding boxes first (high precision)
  const bbox = getDestinationBbox(destination);
  if (bbox) {
    const [west, south, east, north] = bbox;
    return lng >= west && lng <= east && lat >= south && lat <= north;
  }

  // Special geographic validations for island nations and archipelagos
  const normalized = destination.toLowerCase();
  if (normalized.includes("maldives")) {
    return lng >= 72.0 && lng <= 74.5 && lat >= -1.5 && lat <= 8.0;
  }
  if (normalized.includes("seychelles")) {
    return lng >= 55.0 && lng <= 56.5 && lat >= -10.5 && lat <= -3.5;
  }
  if (normalized.includes("mauritius")) {
    return lng >= 56.5 && lng <= 57.8 && lat >= -21.0 && lat <= -19.5;
  }

  // Distance check from destination center (only when not a generic country capital fallback)
  const center = getDestinationCoords(destination);
  if (center && !center.isFallback && (center.lat !== 20.0 || center.lng !== 0.0)) {
    const distKm = getDistanceKm(lat, lng, center.lat, center.lng);
    // Disallow any coordinates > 120km away from city/destination center
    if (distKm > 120) {
      console.warn(
        `[Nominatim] Rejected coordinate [${lat}, ${lng}] — ${distKm.toFixed(1)} km away from "${destination}" center [${center.lat}, ${center.lng}]`
      );
      return false;
    }
  }

  return true;
}

export class NominatimProvider implements MapProvider {
  readonly name = "openstreetmap-nominatim";
  private readonly baseUrl = "https://nominatim.openstreetmap.org";
  private readonly userAgent = "WanderAI/1.0 (travel-planner@wander.ai)";

  /**
   * Geocode a place or attraction name to geographic coordinates.
   * Constrains results to the destination country via countrycodes parameter.
   */
  async geocode(
    query: string,
    nearLocation?: string
  ): Promise<GeocodedPlace | null> {
    try {
      const countryCodesList = nearLocation ? getCountryCodes(nearLocation) : [];
      const countryCodesParam = countryCodesList.length > 0 ? countryCodesList.join(",") : null;
      const bbox = nearLocation ? getDestinationBbox(nearLocation) : null;

      // Extract candidate location suffixes for compound destinations like "Rome and Vatican City"
      const locationCandidates: string[] = [];
      if (nearLocation) {
        const parts = nearLocation
          .split(/,|\band\b|&|\//gi)
          .map((p) => p.trim())
          .filter((p) => p.length >= 2);
        if (parts.length > 1) {
          locationCandidates.push(...parts);
        }
        locationCandidates.push(nearLocation);
      }

      // Try queries in order of specificity: primary city/part, then full destination, then query alone
      const queriesToTry: string[] = [];
      for (const loc of locationCandidates) {
        queriesToTry.push(`${query}, ${loc}`);
      }
      queriesToTry.push(query);

      for (const q of queriesToTry) {
        const params = new URLSearchParams({
          q,
          format: "json",
          addressdetails: "1",
          limit: "5",
        });

        if (countryCodesParam) {
          params.set("countrycodes", countryCodesParam);
        }

        if (bbox) {
          const [west, south, east, north] = bbox;
          params.set("viewbox", `${west},${north},${east},${south}`);
          params.set("bounded", "1");
        }

        const url = `${this.baseUrl}/search?${params.toString()}`;
        const response = await fetch(url, {
          headers: {
            "User-Agent": this.userAgent,
            Accept: "application/json",
          },
        });

        if (!response.ok) continue;

        const results = await response.json();
        if (!Array.isArray(results) || results.length === 0) continue;

        // Filter results within destination region
        const validResults = results.filter((r: any) => {
          const lat = parseFloat(r.lat);
          const lng = parseFloat(r.lon);
          return isCoordinateInRegion(lat, lng, nearLocation || "", countryCodesParam);
        });

        if (validResults.length > 0) {
          const best = validResults[0];
          return {
            placeId: `osm-${best.place_id || best.osm_id}`,
            name: query,
            formattedAddress: best.display_name,
            lat: parseFloat(best.lat),
            lng: parseFloat(best.lon),
            category: best.type || best.class || undefined,
            raw: best,
          };
        }
      }

      // If constrained search found nothing, try unconstrained fallback BUT strictly enforce isCoordinateInRegion
      if (nearLocation) {
        return this.geocodeUnconstrained(query, nearLocation, countryCodesParam);
      }
      return null;
    } catch (error) {
      console.error(`[Nominatim] Geocode error for "${query}":`, error);
      return null;
    }
  }

  /**
   * Fallback geocode without country constraints (used when constrained search fails).
   * Strictly validates that any accepted coordinate is inside the expected region.
   */
  private async geocodeUnconstrained(
    query: string,
    nearLocation?: string,
    countryCode?: string | null
  ): Promise<GeocodedPlace | null> {
    try {
      const url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": this.userAgent,
          Accept: "application/json",
        },
      });

      if (!response.ok) return null;

      const results = await response.json();
      if (!Array.isArray(results) || results.length === 0) return null;

      for (const match of results) {
        const lat = parseFloat(match.lat);
        const lng = parseFloat(match.lon);
        // REJECT if coordinate is outside expected region
        if (nearLocation && !isCoordinateInRegion(lat, lng, nearLocation, countryCode)) {
          continue;
        }
        return {
          placeId: `osm-${match.place_id || match.osm_id}`,
          name: query,
          formattedAddress: match.display_name,
          lat,
          lng,
          category: match.type || match.class || undefined,
          raw: match,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to an address.
   */
  async reverseGeocode(lat: number, lng: number): Promise<GeocodedPlace | null> {
    try {
      const url = `${this.baseUrl}/reverse?lat=${lat}&lon=${lng}&format=json`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": this.userAgent,
          Accept: "application/json",
        },
      });

      if (!response.ok) return null;

      const data = await response.json();
      return {
        placeId: `osm-${data.place_id || data.osm_id}`,
        name: data.name || data.display_name?.split(",")[0] || "Location",
        formattedAddress: data.display_name,
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lon),
        category: data.type || data.class || undefined,
        raw: data,
      };
    } catch (error) {
      console.error("[Nominatim] Reverse geocode error:", error);
      return null;
    }
  }

  /**
   * Calculate distance using Haversine formula and estimate travel time based on mode.
   */
  async calculateDistanceAndTime(
    origin: GeoCoordinates,
    destination: GeoCoordinates,
    mode: "walking" | "driving" | "transit" = "walking"
  ): Promise<TravelTimeResult> {
    const R = 6371e3; // Earth's radius in meters
    const phi1 = (origin.lat * Math.PI) / 180;
    const phi2 = (destination.lat * Math.PI) / 180;
    const deltaPhi = ((destination.lat - origin.lat) * Math.PI) / 180;
    const deltaLambda = ((destination.lng - origin.lng) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(deltaLambda / 2) *
        Math.sin(deltaLambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightDistanceMeters = Math.round(R * c);

    // Urban street grid circuity multiplier ~1.25x straight-line distance
    const routeDistanceMeters = Math.round(straightDistanceMeters * 1.25);

    let speedKmh: number;
    let bufferMinutes = 0;

    switch (mode) {
      case "driving":
        speedKmh = 30; // Urban driving average
        bufferMinutes = 5; // Parking & traffic buffer
        break;
      case "transit":
        speedKmh = 22; // Bus/Metro average including stops
        bufferMinutes = 7; // Wait & transfer buffer
        break;
      case "walking":
      default:
        speedKmh = 4.8; // Average walking pace (km/h)
        bufferMinutes = 0;
        break;
    }

    const travelHours = routeDistanceMeters / 1000 / speedKmh;
    const durationMinutes = Math.max(
      3,
      Math.round(travelHours * 60 + bufferMinutes)
    );

    return {
      distanceMeters: routeDistanceMeters,
      durationMinutes,
      mode,
    };
  }
}

export const nominatimProvider = new NominatimProvider();
export default nominatimProvider;
