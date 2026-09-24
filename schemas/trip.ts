import { z } from "zod";
import { ActivitySchema } from "./activity";

export const TripCreateSchema = z
  .object({
    // destination is optional at field level — required only when prompt is absent (see superRefine)
    destination: z.string().min(2, "Destination must be at least 2 characters").max(150).optional(),
    duration: z.coerce.number().int().min(1, "Minimum 1 day").max(30, "Maximum 30 days").default(3),
    budget: z.enum(["budget", "moderate", "luxury", "ultra-luxury"]).default("moderate"),
    budgetAmount: z.coerce.number().positive().optional(),
    currency: z.string().default("USD"),
    travelers: z.string().default("2 adults"),
    interests: z.array(z.string()).default([]),
    pace: z.enum(["relaxed", "balanced", "packed"]).default("balanced"),
    style: z.string().optional(),
    notes: z.string().max(1000).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    prompt: z.string().optional(),
    async: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    // Either `destination` or `prompt` must be provided
    if (!data.destination?.trim() && !data.prompt?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["destination"],
        message: "Destination is required when no freeform prompt is provided",
      });
    }
  });

export type TripCreateInput = z.infer<typeof TripCreateSchema>;

export const TripRefineSchema = z.object({
  instruction: z
    .string()
    .min(3, "Refinement instruction must be at least 3 characters")
    .max(1000, "Refinement instruction must be under 1000 characters"),
  dayNumber: z.number().int().positive().optional(),
});

export type TripRefineInput = z.infer<typeof TripRefineSchema>;

export const DayRegenerateSchema = z.object({
  preferences: z.string().max(500).optional(),
  theme: z.string().max(100).optional(),
});

export type DayRegenerateInput = z.infer<typeof DayRegenerateSchema>;

export const TripUpdateSchema = z.object({
  title: z.string().min(1).max(150).optional(),
  destination: z.string().min(1).max(150).optional(),
  description: z.string().max(1000).optional(),
  budgetAmount: z.number().positive().optional(),
  currency: z.string().optional(),
  travelers: z.string().optional(),
  tags: z.array(z.string()).optional(),
  coverImage: z.string().url().optional(),
  isFavorite: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export type TripUpdateInput = z.infer<typeof TripUpdateSchema>;
