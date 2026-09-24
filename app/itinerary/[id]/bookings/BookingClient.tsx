"use client";

import React, { useState } from "react";
import { Plane, Hotel, Utensils, Search, ExternalLink } from "lucide-react";
import { Activity } from "@/app/components/types";
import { FlightCard } from "@/app/components/ui/FlightCard";
import { getBookingUrl } from "@/app/lib/bookingService";

interface BookingClientProps {
  initialFlights: Activity[];
  destination: string;
  startDate?: string;
  endDate?: string;
}

export default function BookingClient({
  initialFlights,
  destination,
  startDate,
  endDate,
}: BookingClientProps) {
  const [activeTab, setActiveTab] = useState<"flights" | "stays" | "dining">(
    "flights"
  );

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
        <button
          onClick={() => setActiveTab("flights")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "flights"
              ? "bg-blue-500 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4" />
            Flights
          </div>
        </button>
        <button
          onClick={() => setActiveTab("stays")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "stays"
              ? "bg-emerald-500 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <Hotel className="w-4 h-4" />
            Stays
          </div>
        </button>
        <button
          onClick={() => setActiveTab("dining")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "dining"
              ? "bg-orange-500 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4" />
            Dining
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === "flights" && (
          <div className="space-y-4">
            {initialFlights.length > 0 ? (
              initialFlights.map((flight) =>
                flight.flightInfo ? (
                  <FlightCard key={flight.id} flight={flight.flightInfo} />
                ) : null
              )
            ) : (
              <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                <Plane className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No flights tracked yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "stays" && (
          <HotelsSection
            destination={destination}
            startDate={startDate}
            endDate={endDate}
          />
        )}

        {activeTab === "dining" && (
          <RestaurantsSection destination={destination} />
        )}
      </div>
    </div>
  );
}

// Sub-components reusing logic from previous implementation
function HotelsSection({
  destination,
  startDate,
  endDate,
}: {
  destination: string;
  startDate?: string;
  endDate?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchHotels = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/places/search?q=${encodeURIComponent(
          query
        )}&type=hotel&proximity=ip`
      ); // simplified
      const data = await res.json();
      if (data.features) {
        setResults(
          data.features.map((f: any) => ({
            id: f.id,
            name: f.text,
            address: f.place_name,
          }))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder={`Search hotels in ${destination}...`}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchHotels()}
        />
        <button
          onClick={searchHotels}
          disabled={loading}
          className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* Results */}
      <div className="grid gap-4">
        {results.map((place) => (
          <div
            key={place.id}
            className="p-4 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center group hover:bg-white/10 transition-colors"
          >
            <div>
              <h3 className="font-medium text-white">{place.name}</h3>
              <p className="text-sm text-gray-400 truncate max-w-md">
                {place.address}
              </p>
            </div>
            <a
              href={getBookingUrl("hotel", {
                name: place.name,
                destination: destination,
                checkIn: startDate?.split("T")[0],
                checkOut: endDate?.split("T")[0],
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors flex items-center gap-2"
            >
              Select <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ))}
        {results.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500 text-sm">
            Search for hotels to see results
          </div>
        )}
      </div>
    </div>
  );
}

function RestaurantsSection({ destination }: { destination: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchDining = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/places/search?q=${encodeURIComponent(query)}&type=restaurant`
      );
      const data = await res.json();
      if (data.features) {
        setResults(
          data.features.map((f: any) => ({
            id: f.id,
            name: f.text,
            address: f.place_name,
          }))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder={`Search restaurants in ${destination}...`}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500/50"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchDining()}
        />
        <button
          onClick={searchDining}
          disabled={loading}
          className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg font-medium hover:bg-orange-500/30 transition-colors disabled:opacity-50"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      <div className="grid gap-4">
        {results.map((place) => (
          <div
            key={place.id}
            className="p-4 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center group hover:bg-white/10 transition-colors"
          >
            <div>
              <h3 className="font-medium text-white">{place.name}</h3>
              <p className="text-sm text-gray-400 truncate max-w-md">
                {place.address}
              </p>
            </div>
            <a
              href={getBookingUrl("restaurant", { name: place.name })}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-lg text-sm font-medium hover:bg-orange-500/30 transition-colors flex items-center gap-2"
            >
              Reserve <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
