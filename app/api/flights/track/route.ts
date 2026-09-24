import { NextRequest, NextResponse } from "next/server";
import { getFlightStatus } from "@/app/lib/flightService";

export async function GET(req: NextRequest) {
  const flightNumber = req.nextUrl.searchParams.get("flight");

  if (!flightNumber) {
    return NextResponse.json(
      { error: "Missing flight number" },
      { status: 400 }
    );
  }

  const status = await getFlightStatus(flightNumber);

  // Return dummy data if API fails or no key (for demo purposes)
  if (!status) {
    return NextResponse.json({
      flightNumber: flightNumber,
      status: "scheduled",
      airline: { name: "Demo Airline", iata: "DA" },
      departure: {
        airport: "JFK",
        scheduled: new Date().toISOString(),
        estimated: new Date().toISOString(),
      },
      arrival: {
        airport: "LHR",
        scheduled: new Date(Date.now() + 25200000).toISOString(),
        estimated: new Date(Date.now() + 25200000).toISOString(),
      },
    });
  }

  return NextResponse.json(status);
}
