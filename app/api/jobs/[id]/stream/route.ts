import { NextRequest } from "next/server";
import { getJobById } from "@/lib/repositories/jobRepository";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;

      const send = (data: object, event?: string) => {
        if (isClosed) return;
        try {
          const prefix = event ? `event: ${event}\n` : "";
          controller.enqueue(encoder.encode(`${prefix}data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Controller might already be closed
        }
      };

      // Initial check
      const initialJob = await getJobById(id);
      if (!initialJob) {
        send({ error: "Job not found" }, "error");
        controller.close();
        isClosed = true;
        return;
      }

      send({
        status: initialJob.status,
        progress: initialJob.progress,
        step: initialJob.step,
        result: initialJob.result,
      });

      if (initialJob.status === "completed" || initialJob.status === "failed") {
        controller.close();
        isClosed = true;
        return;
      }

      // Interval polling
      const pollInterval = setInterval(async () => {
        if (isClosed) return;
        try {
          const job = await getJobById(id);
          if (!job) {
            clearInterval(pollInterval);
            send({ error: "Job vanished" }, "error");
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

      // Listen for client disconnect
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
