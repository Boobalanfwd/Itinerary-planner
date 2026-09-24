import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function createJob(
  userId: string | undefined,
  payload: Prisma.InputJsonValue
) {
  return prisma.generationJob.create({
    data: {
      userId,
      status: "pending",
      progress: 0,
      step: "Initializing itinerary generation...",
      payload,
    },
  });
}

export async function updateJobProgress(
  id: string,
  progress: number,
  step?: string
) {
  return prisma.generationJob.update({
    where: { id },
    data: {
      status: "processing",
      progress: Math.min(100, Math.max(0, progress)),
      ...(step && { step }),
    },
  });
}

export async function completeJob(id: string, result: Prisma.InputJsonValue) {
  return prisma.generationJob.update({
    where: { id },
    data: {
      status: "completed",
      progress: 100,
      step: "Itinerary generated successfully",
      result,
    },
  });
}

export async function failJob(id: string, error: string) {
  return prisma.generationJob.update({
    where: { id },
    data: {
      status: "failed",
      error,
      step: "Failed to generate itinerary",
    },
  });
}

export async function getJobById(id: string) {
  return prisma.generationJob.findUnique({
    where: { id },
  });
}
