import { describe, it, expect } from "vitest";
import { TripCreateSchema, TripRefineSchema, DayRegenerateSchema } from "@/schemas/trip";

describe("TripCreateSchema", () => {
  it("should validate a complete valid input with destination", () => {
    const input = {
      destination: "Kyoto, Japan",
      duration: 5,
      budget: "luxury",
      travelers: "2 adults",
      interests: ["culture", "food", "temples"],
      pace: "balanced",
    };

    const result = TripCreateSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.destination).toBe("Kyoto, Japan");
      expect(result.data.duration).toBe(5);
      expect(result.data.budget).toBe("luxury");
    }
  });

  it("should validate input with only freeform prompt and no destination", () => {
    const input = {
      prompt: "A 4-day romantic food and wine holiday in Tuscany",
      duration: 4,
    };

    const result = TripCreateSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.prompt).toBe("A 4-day romantic food and wine holiday in Tuscany");
      expect(result.data.duration).toBe(4);
    }
  });

  it("should fail validation when both destination and prompt are missing or empty", () => {
    const input = {
      destination: "   ",
      prompt: "",
      duration: 3,
    };

    const result = TripCreateSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(issues.some((i) => i.path.includes("destination"))).toBe(true);
    }
  });

  it("should reject duration greater than 30 days", () => {
    const input = {
      destination: "Paris, France",
      duration: 31,
    };

    const result = TripCreateSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("Maximum 30 days");
    }
  });

  it("should reject duration less than 1 day", () => {
    const input = {
      destination: "Paris, France",
      duration: 0,
    };

    const result = TripCreateSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject invalid budget values", () => {
    const input = {
      destination: "Tokyo, Japan",
      budget: "dirt-cheap", // invalid enum value
    };

    const result = TripCreateSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should coerce string durations into numbers", () => {
    const input = {
      destination: "London, UK",
      duration: "7",
    };

    const result = TripCreateSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.duration).toBe(7);
      expect(typeof result.data.duration).toBe("number");
    }
  });

  it("should set default values for budget, pace, and travelers", () => {
    const input = {
      destination: "Barcelona, Spain",
    };

    const result = TripCreateSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.budget).toBe("moderate");
      expect(result.data.pace).toBe("balanced");
      expect(result.data.travelers).toBe("2 adults");
      expect(result.data.duration).toBe(3);
    }
  });
});

describe("TripRefineSchema", () => {
  it("should accept valid instruction", () => {
    const input = {
      instruction: "Add more vegan restaurant options for dinner",
      dayNumber: 2,
    };
    const result = TripRefineSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should reject instructions shorter than 3 characters", () => {
    const input = {
      instruction: "hi",
    };
    const result = TripRefineSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("DayRegenerateSchema", () => {
  it("should accept valid preferences and theme", () => {
    const input = {
      preferences: "Focus on modern art museums and outdoor parks",
      theme: "Arts & Culture Day",
    };
    const result = DayRegenerateSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});
