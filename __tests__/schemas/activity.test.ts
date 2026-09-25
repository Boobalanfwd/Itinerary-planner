import { describe, it, expect } from "vitest";
import { ActivitySchema, ActivityTypeEnum, ActivityReorderSchema } from "@/schemas/activity";

describe("ActivitySchema", () => {
  it("should validate a complete valid activity", () => {
    const input = {
      time: "09:30 AM",
      title: "Visit Fushimi Inari Shrine",
      description: "Hike through thousands of vibrant torii gates leading up Mount Inari.",
      type: "SIGHTSEEING",
      locationLat: 34.9671,
      locationLng: 135.7727,
      locationName: "Fushimi Inari Taisha",
      duration: 120,
      cost: 0,
      indoor: false,
    };

    const result = ActivitySchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Visit Fushimi Inari Shrine");
      expect(result.data.type).toBe("SIGHTSEEING");
      expect(result.data.cost).toBe(0);
    }
  });

  it("should fail when required fields (time, title, description) are missing", () => {
    const input = {
      type: "FOOD",
    };

    const result = ActivitySchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issuePaths = result.error.issues.map((i) => i.path[0]);
      expect(issuePaths).toContain("time");
      expect(issuePaths).toContain("title");
      expect(issuePaths).toContain("description");
    }
  });

  it("should default type to SIGHTSEEING and indoor to false", () => {
    const input = {
      time: "12:00 PM",
      title: "Lunch Break",
      description: "Quick lunch at local noodle shop.",
    };

    const result = ActivitySchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("SIGHTSEEING");
      expect(result.data.indoor).toBe(false);
    }
  });

  it("should reject negative costs", () => {
    const input = {
      time: "02:00 PM",
      title: "Museum Tour",
      description: "Guided museum tour",
      cost: -25,
    };

    const result = ActivitySchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("ActivityReorderSchema", () => {
  it("should validate valid list of activity IDs", () => {
    const input = {
      activityIds: ["act_1", "act_2", "act_3"],
    };
    const result = ActivityReorderSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should reject empty activityIds array", () => {
    const input = {
      activityIds: [],
    };
    const result = ActivityReorderSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
