import { NextRequest, NextResponse } from "next/server";
import { getJobById } from "@/lib/repositories/jobRepository";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Job ID required" },
        { status: 400 }
      );
    }

    const job = await getJobById(id);

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        step: job.step,
        result: job.result,
        error: job.error,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("[job-status] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to retrieve job status" },
      { status: 500 }
    );
  }
}
