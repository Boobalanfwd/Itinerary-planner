"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Plane,
  Hotel,
  Utensils,
  Search,
  Plus,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Star,
  ChevronRight,
  X,
} from "lucide-react";
import { ItineraryData } from "@/app/components/types";
import { useRouter } from "next/navigation";
import { getBookingUrl } from "@/app/lib/bookingService";
import FlightCard from "@/app/components/ui/FlightCard";

interface BookingPageProps {
  data: ItineraryData;
}

export default function BookingPage({ data }: BookingPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "flights" | "hotels" | "restaurants"
  >("flights");

  const tabs = [
    { id: "flights", label: "Flights", icon: Plane, color: "blue" },
    { id: "hotels", label: "Stays", icon: Hotel, color: "emerald" },
    { id: "restaurants", label: "Dining", icon: Utensils, color: "orange" },
  ] as const;

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Trip Bookings
              </h1>
              <p className="text-sm text-gray-400">{data.destination}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? `bg-${tab.color}-500/20 text-${tab.color}-400 ring-1 ring-${tab.color}-500/50`
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "flights" && <FlightsSection data={data} />}
            {activeTab === "hotels" && <HotelsSection data={data} />}
            {activeTab === "restaurants" && <RestaurantsSection data={data} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function FlightsSection({ data }: { data: ItineraryData }) {
  // Filter activities to show only FLIGHT type
  const flights = data.days.flatMap((day) =>
    day.activities.filter((act) => act.type === "FLIGHT")
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Plane className="w-5 h-5 text-blue-400" />
          Your Flights
        </h2>
        <button className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Flight
        </button>
      </div>

      {flights.length === 0 ? (
        <EmptyState
          icon={Plane}
          title="No flights added yet"
          description="Add your flight details to keep track of your journey."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4">
            {flights.map(
              (act) =>
                act.flightInfo && (
                  <FlightCard key={act.id} flight={act.flightInfo} />
                )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function HotelsSection({ data }: { data: ItineraryData }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (targetQuery: string = query) => {
    const q = targetQuery.trim();
    if (!q) return;
    setLoading(true);
    try {
      const searchQuery = q.includes(data.destination)
        ? q
        : `${q} in ${data.destination}`;

      const res = await fetch(
        `/api/places/search?query=${encodeURIComponent(
          searchQuery
        )}&lat=0&lng=0`
      );

      if (res.ok) {
        const json = await res.json();
        setResults(json.places || []);
      }
    } catch (e) {
      console.error("Search failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      handleSearch(debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Hotel className="w-5 h-5 text-emerald-400" />
          Where to Stay
        </h2>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder={`Search hotels in ${data.destination}...`}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400">Searching...</div>
      ) : results.length > 0 ? (
        <div className="grid gap-4">
          {results.map((place) => (
            <div
              key={place.id}
              className="p-4 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center group hover:bg-white/10 transition-colors"
            >
              <div>
                <h3 className="font-medium text-white">{place.name}</h3>
                <p className="text-sm text-gray-400">{place.address}</p>
              </div>
              <button className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors">
                Select
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Hotel}
          title="Find your perfect stay"
          description="Search for top-rated hotels near your destination."
        />
      )}
    </div>
  );
}

function RestaurantsSection({ data }: { data: ItineraryData }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (targetQuery: string = query) => {
    const q = targetQuery.trim();
    if (!q) return;
    setLoading(true);
    try {
      const searchQuery = q.includes(data.destination)
        ? q
        : `${q} in ${data.destination}`;
      const res = await fetch(
        `/api/places/search?query=${encodeURIComponent(
          searchQuery
        )}&lat=0&lng=0`
      );

      if (res.ok) {
        const json = await res.json();
        setResults(json.places || []);
      }
    } catch (e) {
      console.error("Search failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      handleSearch(debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Utensils className="w-5 h-5 text-orange-400" />
          Dining Options
        </h2>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder={`Search restaurants in ${data.destination}...`}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400">Searching...</div>
      ) : results.length > 0 ? (
        <div className="grid gap-4">
          {results.map((place) => (
            <div
              key={place.id}
              className="p-4 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center group hover:bg-white/10 transition-colors"
            >
              <div>
                <h3 className="font-medium text-white">{place.name}</h3>
                <p className="text-sm text-gray-400">{place.address}</p>
              </div>
              <a
                href={getBookingUrl("restaurant", { name: place.name })}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-lg text-sm font-medium hover:bg-orange-500/30 transition-colors"
              >
                Reserve
              </a>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Utensils}
          title="Discover local cuisine"
          description="Find best-rated restaurants and cafes for your trip."
        />
      )}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className="py-12 bg-white/5 rounded-2xl border border-white/10 border-dashed flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-400 max-w-xs">{description}</p>
    </div>
  );
}
