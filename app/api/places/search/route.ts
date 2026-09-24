import { NextRequest, NextResponse } from "next/server";
import { resolvePlace } from "@/lib/maps/placeVerification";
import { nominatimProvider } from "@/lib/maps/nominatim";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();
    const near = searchParams.get("near")?.trim();

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Search query required" },
        { status: 400 }
      );
    }

    const place = await resolvePlace(query, near);

    if (!place) {
      return NextResponse.json({
        success: true,
        places: [],
      });
    }

    return NextResponse.json({
      success: true,
      places: [place],
    });
  } catch (error: any) {
    console.error("[places-search] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Search failed" },
      { status: 500 }
    );
  }
}
