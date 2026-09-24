"use client";

import React, { useState } from "react";
import { Navbar } from "../components/ui/Navbar";
import { Footer } from "../components/ui/Footer";
import {
  Search,
  Plane,
  Calendar,
  Users,
  Clock,
  Loader2,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../components/lib/utils";
import { Button } from "@/components/ui/button";

interface Flight {
  id: string;
  airline: string;
  airlineLogo: string;
  flightNumber: string;
  departure: {
    airport: string;
    code: string;
    time: string;
  };
  arrival: {
    airport: string;
    code: string;
    time: string;
  };
  duration: string;
  stops: number;
  price: number;
  class: string;
  seatsLeft: number;
}

export default function FlightsPage() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [tripType, setTripType] = useState<"one-way" | "round-trip">(
    "round-trip"
  );
  const [flightClass, setFlightClass] = useState("economy");
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [maxPrice, setMaxPrice] = useState(1000);
  const [maxStops, setMaxStops] = useState(2);
  const [preferredAirlines, setPreferredAirlines] = useState<string[]>([]);

  const airlines = [
    "Emirates",
    "Delta",
    "United",
    "British Airways",
    "Qatar Airways",
  ];

  // Mock flight data
  const mockFlights: Flight[] = [
    {
      id: "1",
      airline: "Emirates",
      airlineLogo:
        "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=100",
      flightNumber: "EK 205",
      departure: { airport: "JFK Airport", code: "JFK", time: "10:30 AM" },
      arrival: { airport: "Dubai Int'l", code: "DXB", time: "6:45 AM +1" },
      duration: "12h 15m",
      stops: 0,
      price: 899,
      class: "Economy",
      seatsLeft: 8,
    },
    {
      id: "2",
      airline: "Delta",
      airlineLogo:
        "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=100",
      flightNumber: "DL 142",
      departure: { airport: "JFK Airport", code: "JFK", time: "2:15 PM" },
      arrival: { airport: "Dubai Int'l", code: "DXB", time: "12:30 PM +1" },
      duration: "14h 15m",
      stops: 1,
      price: 725,
      class: "Economy",
      seatsLeft: 15,
    },
    {
      id: "3",
      airline: "United",
      airlineLogo:
        "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=100",
      flightNumber: "UA 990",
      departure: { airport: "JFK Airport", code: "JFK", time: "6:00 PM" },
      arrival: { airport: "Dubai Int'l", code: "DXB", time: "4:20 PM +1" },
      duration: "13h 20m",
      stops: 1,
      price: 680,
      class: "Economy",
      seatsLeft: 18,
    },
  ];

  const handleSearch = () => {
    setLoading(true);
    setTimeout(() => {
      setFlights(mockFlights);
      setLoading(false);
    }, 800);
  };

  const filteredFlights = flights.filter((flight) => {
    const withinBudget = flight.price <= maxPrice;
    const acceptableStops = flight.stops <= maxStops;
    const preferredAirline =
      preferredAirlines.length === 0 ||
      preferredAirlines.includes(flight.airline);

    return withinBudget && acceptableStops && preferredAirline;
  });

  const toggleAirline = (airline: string) => {
    setPreferredAirlines((prev) =>
      prev.includes(airline)
        ? prev.filter((a) => a !== airline)
        : [...prev, airline]
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar onViewChange={() => {}} />

      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-36 pb-12 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto mb-8 space-y-3"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
              <Plane className="w-3.5 h-3.5 rotate-45" />
              <span>Worldwide Flight Search</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Book Your Next Flight
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Compare routes, airlines, and competitive fares seamlessly tailored to your schedule.
            </p>
          </motion.div>

          {/* Search Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-border/80 shadow-soft space-y-5"
          >
            {/* Trip Type Toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTripType("round-trip")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                  tripType === "round-trip"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                Round Trip
              </button>
              <button
                type="button"
                onClick={() => setTripType("one-way")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                  tripType === "one-way"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                One Way
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Origin */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  <Plane className="w-3.5 h-3.5 inline mr-1 rotate-45 text-primary" />
                  From
                </label>
                <input
                  type="text"
                  placeholder="Origin city or airport"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>

              {/* Destination */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  <Plane className="w-3.5 h-3.5 inline mr-1 -rotate-45 text-primary" />
                  To
                </label>
                <input
                  type="text"
                  placeholder="Destination city or airport"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>

              {/* Departure Date */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  <Calendar className="w-3.5 h-3.5 inline mr-1 text-primary" />
                  Departure
                </label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-background border border-border/80 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>

              {/* Return Date */}
              {tripType === "round-trip" ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    <Calendar className="w-3.5 h-3.5 inline mr-1 text-primary" />
                    Return
                  </label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-background border border-border/80 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    <Users className="w-3.5 h-3.5 inline mr-1 text-primary" />
                    Passengers
                  </label>
                  <select
                    value={passengers}
                    onChange={(e) => setPassengers(Number(e.target.value))}
                    className="w-full p-3.5 rounded-2xl bg-background border border-border/80 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? "Passenger" : "Passengers"}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="flex-1 rounded-full py-3.5 font-semibold text-xs gap-2 shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching Available Flights...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Search Flights
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="rounded-full px-5 py-3.5 font-semibold text-xs gap-2 border-border/80 hover:bg-muted"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </Button>
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="pt-4 border-t border-border/60"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Max Price */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Max Price: ${maxPrice}
                      </label>
                      <input
                        type="range"
                        min="100"
                        max="2000"
                        step="50"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        className="w-full accent-primary"
                      />
                    </div>

                    {/* Max Stops */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Stops
                      </label>
                      <div className="flex gap-2">
                        {[0, 1, 2].map((stops) => (
                          <button
                            key={stops}
                            type="button"
                            onClick={() => setMaxStops(stops)}
                            className={cn(
                              "flex-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                              maxStops === stops
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted"
                            )}
                          >
                            {stops === 0
                              ? "Direct"
                              : stops === 1
                              ? "1 Stop"
                              : "2+ Stops"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Airlines */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Preferred Airlines
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {airlines.map((airline) => (
                          <button
                            key={airline}
                            type="button"
                            onClick={() => toggleAirline(airline)}
                            className={cn(
                              "px-2.5 py-1 rounded-full border text-xs font-medium transition-all",
                              preferredAirlines.includes(airline)
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted"
                            )}
                          >
                            {airline}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Results Section */}
      {flights.length > 0 && (
        <section className="py-8 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">
              {filteredFlights.length} flights available
            </h2>
          </div>

          <div className="space-y-4">
            {filteredFlights.map((flight, index) => (
              <motion.div
                key={flight.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card/85 backdrop-blur-sm rounded-3xl p-6 border border-border/80 hover:border-primary/50 shadow-soft hover:shadow-lg transition-all"
              >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                  {/* Airline */}
                  <div className="flex items-center gap-3">
                    <img
                      src={flight.airlineLogo}
                      alt={flight.airline}
                      className="w-12 h-12 rounded-2xl object-cover bg-muted"
                    />
                    <div>
                      <div className="font-bold text-foreground">{flight.airline}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {flight.flightNumber}
                      </div>
                    </div>
                  </div>

                  {/* Departure */}
                  <div>
                    <div className="text-xl font-extrabold text-foreground font-mono">
                      {flight.departure.time}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {flight.departure.code} · {flight.departure.airport}
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="h-px bg-border flex-1" />
                      <Plane className="w-3.5 h-3.5 text-primary rotate-90" />
                      <div className="h-px bg-border flex-1" />
                    </div>
                    <div className="text-xs font-semibold text-foreground font-mono">
                      {flight.duration}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {flight.stops === 0
                        ? "Non-stop"
                        : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
                    </div>
                  </div>

                  {/* Arrival */}
                  <div>
                    <div className="text-xl font-extrabold text-foreground font-mono">
                      {flight.arrival.time}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {flight.arrival.code} · {flight.arrival.airport}
                    </div>
                  </div>

                  {/* Price & CTA */}
                  <div className="text-left md:text-right flex flex-col items-start md:items-end justify-center">
                    <div className="text-2xl font-extrabold text-foreground font-mono">
                      ${flight.price}
                    </div>
                    <div className="text-[11px] text-muted-foreground mb-2">
                      per traveler
                    </div>
                    <Button
                      size="sm"
                      className="rounded-full px-5 py-2 font-semibold text-xs shadow-sm"
                    >
                      Select Flight
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {flights.length === 0 && !loading && (
        <section className="py-16 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">Ready to Take Off?</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Specify your departure origin, arrival destination, and dates above to explore flight offers.
          </p>
        </section>
      )}

      <Footer />
    </div>
  );
}
