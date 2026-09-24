export interface FlightStatus {
  flightNumber: string;
  status:
    | "active"
    | "scheduled"
    | "landed"
    | "cancelled"
    | "incident"
    | "diverted"
    | "unknown";
  departure: {
    airport: string;
    timezone: string;
    scheduled: string;
    estimated: string;
    gate?: string;
    terminal?: string;
  };
  arrival: {
    airport: string;
    timezone: string;
    scheduled: string;
    estimated: string;
    gate?: string;
    terminal?: string;
  };
  airline: {
    name: string;
    iata: string;
  };
}

export async function getFlightStatus(
  flightIata: string
): Promise<FlightStatus | null> {
  const apiKey = process.env.AVIATION_STACK_API_KEY;
  if (!apiKey) {
    console.warn("AviationStack API key missing");
    return null;
  }

  try {
    const res = await fetch(
      `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${flightIata}`
    );
    if (!res.ok) throw new Error("AviationStack API error");

    const data = await res.json();
    if (!data.data || data.data.length === 0) return null;

    // Get the most recent flight (AviationStack returns historical data too)
    const flight = data.data[0];

    return {
      flightNumber: flight.flight.iata,
      status: flight.flight_status,
      departure: {
        airport: flight.departure.iata,
        timezone: flight.departure.timezone,
        scheduled: flight.departure.scheduled,
        estimated: flight.departure.estimated,
        gate: flight.departure.gate,
        terminal: flight.departure.terminal,
      },
      arrival: {
        airport: flight.arrival.iata,
        timezone: flight.arrival.timezone,
        scheduled: flight.arrival.scheduled,
        estimated: flight.arrival.estimated,
        gate: flight.arrival.gate,
        terminal: flight.arrival.terminal,
      },
      airline: {
        name: flight.airline.name,
        iata: flight.airline.iata,
      },
    };
  } catch (error) {
    console.error("Flight tracking error:", error);
    return null;
  }
}
