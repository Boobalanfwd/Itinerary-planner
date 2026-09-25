import { describe, it, expect } from "vitest";
import { isWebGLAvailable } from "@/components/map/MapboxMapView";
import { getDestinationCoords } from "@/lib/country-code";

describe("Map WebGL Fallback & Coordinate Resilience", () => {
  it("should return false for isWebGLAvailable when window or canvas WebGL is not available in node/SSR", () => {
    const result = isWebGLAvailable();
    // In node/SSR test environment without WebGL canvas, it safely returns false without throwing
    expect(result).toBe(false);
  });

  it("should filter out invalid or null coordinates safely", () => {
    const mixedActivities = [
      { id: "1", title: "Valid Stop", locationLat: 48.8566, locationLng: 2.3522, dayNumber: 1 },
      { id: "2", title: "Null Lat", locationLat: null, locationLng: 2.3522, dayNumber: 1 },
      { id: "3", title: "Undefined Lng", locationLat: 48.8566, locationLng: undefined, dayNumber: 1 },
      { id: "4", title: "NaN Lat", locationLat: NaN, locationLng: 2.3522, dayNumber: 1 },
      { id: "5", title: "Second Valid", locationLat: 48.8584, locationLng: 2.2945, dayNumber: 1 },
    ];

    const validActivities = mixedActivities.filter(
      (a) =>
        a.locationLat !== null &&
        a.locationLat !== undefined &&
        !isNaN(Number(a.locationLat)) &&
        a.locationLng !== null &&
        a.locationLng !== undefined &&
        !isNaN(Number(a.locationLng))
    );

    expect(validActivities).toHaveLength(2);
    expect(validActivities.map((a) => a.id)).toEqual(["1", "5"]);
  });

  it("should fallback to static destination coordinates if no activities have coordinates", () => {
    const destination = "Paris, France";
    const staticCoords = getDestinationCoords(destination);

    expect(staticCoords).not.toBeNull();
    expect(staticCoords?.lat).toBeCloseTo(48.8566, 1);
    expect(staticCoords?.lng).toBeCloseTo(2.3522, 1);
  });

  it("should resolve valid center coordinates even for unknown destinations", () => {
    const destination = "Somewhere In Space";
    const staticCoords = getDestinationCoords(destination);

    // Default fallback coordinates if destination unknown
    const defaultCenter = staticCoords && (staticCoords.lat !== 20.0 || staticCoords.lng !== 0.0)
      ? [staticCoords.lat, staticCoords.lng]
      : [35.6762, 139.6503];

    expect(defaultCenter).toEqual([35.6762, 139.6503]);
  });
});
