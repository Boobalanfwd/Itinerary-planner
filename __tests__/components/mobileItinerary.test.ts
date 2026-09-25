import { describe, it, expect } from "vitest";

const DAY_COLORS = [
  "#0D9488", // Teal / Emerald
  "#6366F1", // Indigo
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F97316", // Orange
];

function getDayColor(dayNumber: number): string {
  return DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];
}

// Activity reorder helper mirroring MobileItineraryView logic
function reorderActivities<T>(items: T[], index: number, direction: "up" | "down"): T[] {
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= items.length) {
    return items; // boundary: unchanged
  }
  const updated = [...items];
  const [moved] = updated.splice(index, 1);
  updated.splice(targetIndex, 0, moved);
  return updated;
}

// Map activity location transformation mirroring MobileItineraryView logic
interface RawActivity {
  id?: string;
  title: string;
  time?: string;
  type?: string;
  locationLat?: number | null;
  locationLng?: number | null;
  location?: { name?: string; lat?: number; lng?: number };
}

function transformToMapLocation(act: RawActivity, dayNumber: number, idx: number) {
  const rawLat = act.locationLat ?? act.location?.lat;
  const rawLng = act.locationLng ?? act.location?.lng;
  const lat =
    rawLat !== undefined && rawLat !== null && !isNaN(Number(rawLat))
      ? Number(rawLat)
      : null;
  const lng =
    rawLng !== undefined && rawLng !== null && !isNaN(Number(rawLng))
      ? Number(rawLng)
      : null;

  return {
    id: act.id || `act-${dayNumber}-${idx}`,
    title: act.title,
    time: act.time,
    type: act.type,
    locationLat: lat,
    locationLng: lng,
    dayNumber,
    position: idx,
  };
}

describe("Mobile Itinerary Logic & Utilities", () => {
  describe("getDayColor", () => {
    it("should return the first color for Day 1", () => {
      expect(getDayColor(1)).toBe("#0D9488");
    });

    it("should return correct colors for subsequent days", () => {
      expect(getDayColor(2)).toBe("#6366F1");
      expect(getDayColor(3)).toBe("#F59E0B");
    });

    it("should cycle through colors when dayNumber exceeds palette length", () => {
      expect(getDayColor(9)).toBe("#0D9488");
      expect(getDayColor(10)).toBe("#6366F1");
    });
  });

  describe("Mobile Activity Reordering", () => {
    const activities = [
      { id: "1", title: "Breakfast at Cafe" },
      { id: "2", title: "Eiffel Tower Visit" },
      { id: "3", title: "Louvre Museum" },
    ];

    it("should move an activity up when valid", () => {
      const result = reorderActivities(activities, 1, "up");
      expect(result[0].id).toBe("2");
      expect(result[1].id).toBe("1");
      expect(result[2].id).toBe("3");
    });

    it("should move an activity down when valid", () => {
      const result = reorderActivities(activities, 1, "down");
      expect(result[0].id).toBe("1");
      expect(result[1].id).toBe("3");
      expect(result[2].id).toBe("2");
    });

    it("should not move the first activity up", () => {
      const result = reorderActivities(activities, 0, "up");
      expect(result).toEqual(activities);
    });

    it("should not move the last activity down", () => {
      const result = reorderActivities(activities, 2, "down");
      expect(result).toEqual(activities);
    });
  });

  describe("Mobile Map Activity Transformation", () => {
    it("should extract coordinates from top-level or nested location", () => {
      const actWithTopLevel: RawActivity = {
        id: "act-1",
        title: "Eiffel Tower",
        time: "10:00",
        type: "sightseeing",
        locationLat: 48.8584,
        locationLng: 2.2945,
      };

      const transformed = transformToMapLocation(actWithTopLevel, 1, 0);
      expect(transformed.locationLat).toBe(48.8584);
      expect(transformed.locationLng).toBe(2.2945);
      expect(transformed.dayNumber).toBe(1);
    });

    it("should fallback to nested location object if top-level is null", () => {
      const actWithNested: RawActivity = {
        title: "Notre Dame",
        location: { lat: 48.853, lng: 2.3499 },
      };

      const transformed = transformToMapLocation(actWithNested, 2, 1);
      expect(transformed.id).toBe("act-2-1");
      expect(transformed.locationLat).toBe(48.853);
      expect(transformed.locationLng).toBe(2.3499);
    });

    it("should handle null or invalid coordinates gracefully", () => {
      const actInvalid: RawActivity = {
        title: "Walk in park",
        locationLat: null,
      };

      const transformed = transformToMapLocation(actInvalid, 1, 2);
      expect(transformed.locationLat).toBeNull();
      expect(transformed.locationLng).toBeNull();
    });
  });
});
