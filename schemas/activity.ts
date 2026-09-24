import { z } from "zod";

export const ActivityTypeEnum = z.enum([
  "SIGHTSEEING",
  "FOOD",
  "ACCOMMODATION",
  "TRANSPORTATION",
  "ENTERTAINMENT",
  "SHOPPING",
  "OUTDOOR",
  "CULTURE",
  "NIGHTLIFE",
  "WELLNESS",
  "FLIGHT",
  "ACTIVITY",
  "RESTAURANT",
  "MISCELLANEOUS",
]);

export type ActivityType = z.infer<typeof ActivityTypeEnum>;

export const ActivitySchema = z.object({
  id: z.string().optional(),
  dayId: z.string().optional(),
  time: z.string().min(1, "Time is required"),
  title: z.string().min(1, "Title is required").max(150),
  description: z.string().min(1, "Description is required"),
  type: ActivityTypeEnum.default("SIGHTSEEING"),
  locationLat: z.number().nullable().optional(),
  locationLng: z.number().nullable().optional(),
  locationName: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  duration: z.number().int().positive().nullable().optional(),
  cost: z.number().min(0).nullable().optional(),
  bookingUrl: z.string().url().nullable().optional().or(z.literal("")),
  notes: z.string().nullable().optional(),
  position: z.number().int().min(0).optional(),
  indoor: z.boolean().default(false),
  placeId: z.string().nullable().optional(),
});

export type ActivityInput = z.infer<typeof ActivitySchema>;

export const ActivityReorderSchema = z.object({
  activityIds: z.array(z.string()).min(1, "At least one activity required"),
});

export type ActivityReorderInput = z.infer<typeof ActivityReorderSchema>;
