import { describe, it, expect } from "vitest";
import {
  PackingListSchema,
  PackingCategorySchema,
  PackingItemSchema,
} from "@/schemas/packingList";

describe("PackingListSchema", () => {
  it("should validate a complete valid packing list", () => {
    const input = {
      destination: "Reykjavik, Iceland",
      categories: [
        {
          name: "Outerwear & Layers",
          emoji: "🧥",
          items: [
            { item: "Windproof & waterproof jacket", essential: true, notes: "Gore-Tex recommended" },
            { item: "Thermal base layers (top & bottom)", essential: true },
            { item: "Wool socks (3x)", essential: false },
          ],
        },
        {
          name: "Electronics",
          emoji: "🔌",
          items: [
            { item: "Universal power adapter (Type C/F)", essential: true },
            { item: "Portable power bank 10,000mAh", essential: false },
          ],
        },
      ],
      tips: [
        "Dress in layers rather than one heavy coat",
        "Credit cards are accepted virtually everywhere",
      ],
    };

    const result = PackingListSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.categories.length).toBe(2);
      expect(result.data.categories[0].items[0].essential).toBe(true);
      expect(result.data.tips?.length).toBe(2);
    }
  });

  it("should reject categories without name or emoji", () => {
    const invalidCategory = {
      name: "",
      emoji: "🧳",
      items: [{ item: "Toothbrush", essential: true }],
    };

    const result = PackingCategorySchema.safeParse(invalidCategory);
    expect(result.success).toBe(false);
  });

  it("should reject items with empty item string", () => {
    const invalidItem = {
      item: "",
      essential: true,
    };

    const result = PackingItemSchema.safeParse(invalidItem);
    expect(result.success).toBe(false);
  });
});
