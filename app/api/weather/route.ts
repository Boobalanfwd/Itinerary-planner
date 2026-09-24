import { NextRequest, NextResponse } from "next/server";
import {
  getForecastForDestination,
  getOpenMeteoForecast,
} from "@/lib/weather";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const destination = searchParams.get("destination")?.trim();
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");

    if (latParam && lngParam) {
      const lat = parseFloat(latParam);
      const lng = parseFloat(lngParam);
      if (!isNaN(lat) && !isNaN(lng)) {
        const forecast = await getOpenMeteoForecast(lat, lng, destination || "Destination");
        if (forecast) {
          return NextResponse.json({ success: true, data: forecast });
        }
      }
    }

    if (destination) {
      const forecast = await getForecastForDestination(destination);
      if (forecast) {
        return NextResponse.json({ success: true, data: forecast });
      }
    }

    return NextResponse.json(
      { success: false, error: "Unable to retrieve forecast for location" },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("[weather-api] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Weather query failed" },
      { status: 500 }
    );
  }
}
