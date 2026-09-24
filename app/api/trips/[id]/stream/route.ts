import { NextRequest } from "next/server";
import { getJobById } from "@/lib/repositories/jobRepository";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const encoder = new TextEncoder();

  // Find job either directly by ID or by finding the most recent job for this trip
  let targetJobId = id;
  const directJob = await getJobById(id);
  if (!directJob) {
    const itinerary = await prisma.itinerary.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (itinerary) {
      const recentJob = await prisma.generationJob.findFirst({
        where: { userId: itinerary.userId },
        orderBy: { createdAt: "desc" },
      });
      if (recentJob) {
        targetJobId = recentJob.id;
      }
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;

      const send = (data: object, event?: string) => {
        if (isClosed) return;
        try {
          const prefix = event ? `event: ${event}\n` : "";
          controller.enqueue(encoder.encode(`${prefix}data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Closed
        }
      };

      const pollInterval = setInterval(async () => {
        if (isClosed) return;
        try {
          const job = await getJobById(targetJobId);
          if (!job) {
            clearInterval(pollInterval);
            send({ error: "Job not found" }, "error");
            controller.close();
            isClosed = true;
            return;
          }

          send({
            status: job.status,
            progress: job.progress,
            step: job.step,
            result: job.result,
            error: job.error,
          });

          if (job.status === "completed" || job.status === "failed") {
            clearInterval(pollInterval);
            controller.close();
            isClosed = true;
          }
        } catch {
          clearInterval(pollInterval);
          if (!isClosed) {
            controller.close();
            isClosed = true;
          }
        }
      }, 800);

      req.signal.addEventListener("abort", () => {
        clearInterval(pollInterval);
        if (!isClosed) {
          controller.close();
          isClosed = true;
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
