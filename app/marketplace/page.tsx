"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  TrendingUp,
  Clock,
  Heart,
  Star,
  Loader2,
  Compass,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { ItineraryCard } from "../components/ui/ItineraryCard";
import { Navbar } from "../components/ui/Navbar";
import { Footer } from "../components/ui/Footer";
import { Button } from "@/components/ui/button";

export default function MarketplacePage() {
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("trending");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchItineraries();
  }, [filter, searchQuery, page]);

  const fetchItineraries = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/marketplace?filter=${filter}&search=${searchQuery}&page=${page}`
      );
      const data = await response.json();

      if (data.success) {
        if (page === 1) {
          setItineraries(data.itineraries);
        } else {
          setItineraries((prev) => [...prev, ...data.itineraries]);
        }
        setHasMore(data.pagination.hasMore);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setPage(1);
  };

  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar onViewChange={() => {}} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-4">
            <Compass className="w-3.5 h-3.5" />
            <span>Community Travel Hub</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-3">
            Discover Global Itineraries
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Explore, clone, and personalize curated itineraries designed by passionate travelers from around the world.
          </p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by destination, country, or keyword..."
                className="w-full pl-10 pr-9 py-2.5 bg-card border border-border/80 rounded-2xl text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
              <FilterButton
                active={filter === "trending"}
                onClick={() => handleFilterChange("trending")}
                icon={<TrendingUp className="w-3.5 h-3.5" />}
                label="Trending"
              />
              <FilterButton
                active={filter === "recent"}
                onClick={() => handleFilterChange("recent")}
                icon={<Clock className="w-3.5 h-3.5" />}
                label="Recent"
              />
              <FilterButton
                active={filter === "popular"}
                onClick={() => handleFilterChange("popular")}
                icon={<Heart className="w-3.5 h-3.5" />}
                label="Popular"
              />
              <FilterButton
                active={filter === "top-rated"}
                onClick={() => handleFilterChange("top-rated")}
                icon={<Star className="w-3.5 h-3.5" />}
                label="Top Rated"
              />
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && page === 1 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-xs font-mono text-muted-foreground">Loading travel inspirations...</span>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {itineraries.map((itinerary, index) => (
                <ItineraryCard
                  key={itinerary.id}
                  itinerary={itinerary}
                  index={index}
                />
              ))}
            </div>

            {/* Empty State */}
            {itineraries.length === 0 && !loading && (
              <div className="text-center py-20 rounded-3xl border border-dashed border-border/80 bg-card/40 p-8 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Compass className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  No itineraries found
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  We couldn&apos;t find any trips matching your criteria. Try adjusting your search query or switching filters.
                </p>
                {searchQuery && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSearch("")}
                    className="rounded-full text-xs font-semibold mt-2"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            )}

            {/* Load More */}
            {hasMore && !loading && itineraries.length > 0 && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  className="rounded-full px-7 py-2.5 font-semibold text-xs border-border/80 hover:bg-muted shadow-sm"
                >
                  Load More Itineraries
                </Button>
              </div>
            )}

            {/* Loading More */}
            {loading && page > 1 && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  active,
  onClick,
  icon,
  label,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/60"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};
