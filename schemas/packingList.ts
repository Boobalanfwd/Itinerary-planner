import { z } from "zod";

export const PackingItemSchema = z.object({
  id: z.string().optional(),
  item: z.string().min(1),
  essential: z.boolean().default(false),
  notes: z.string().max(200).optional(),
});

export const PackingCategorySchema = z.object({
  name: z.string().min(1),
  emoji: z.string(),
  items: z.array(PackingItemSchema).min(1).max(25),
});

export const PackingListSchema = z.object({
  categories: z.array(PackingCategorySchema).min(1).max(15),
  tips: z.array(z.string()).max(10).optional(),
  destination: z.string().optional(),
  generatedAt: z.string().optional(),
});

export type PackingItem = z.infer<typeof PackingItemSchema>;
export type PackingCategory = z.infer<typeof PackingCategorySchema>;
export type PackingList = z.infer<typeof PackingListSchema>;
