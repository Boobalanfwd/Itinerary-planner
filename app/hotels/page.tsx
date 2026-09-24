"use client";

import React, { useState } from "react";
import { Navbar } from "../components/ui/Navbar";
import { Footer } from "../components/ui/Footer";
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Star,
  Loader2,
  SlidersHorizontal,
  Wifi,
  Car,
  Utensils,
  Dumbbell,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../components/lib/utils";
import { Button } from "@/components/ui/button";

interface Hotel {
  id: string;
  name: string;
  location: string;
  image: string;
  rating: number;
  reviews: number;
  pricePerNight: number;
  amenities: string[];
  distance: number;
  stars: number;
}

export default function HotelsPage() {
  const [searchLocation, setSearchLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [minStars, setMinStars] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const amenitiesList = [
    { name: "WiFi", icon: <Wifi className="w-3.5 h-3.5" /> },
    { name: "Parking", icon: <Car className="w-3.5 h-3.5" /> },
    { name: "Restaurant", icon: <Utensils className="w-3.5 h-3.5" /> },
    { name: "Gym", icon: <Dumbbell className="w-3.5 h-3.5" /> },
  ];

  // Mock hotel data
  const mockHotels: Hotel[] = [
    {
      id: "1",
      name: "Grand Luxury Hotel & Spa",
      location: "Downtown",
      image:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
      rating: 4.8,
      reviews: 1240,
      pricePerNight: 299,
      amenities: ["WiFi", "Parking", "Restaurant", "Gym"],
      distance: 0.5,
      stars: 5,
    },
    {
      id: "2",
      name: "Seaside Resort & Villas",
      location: "Beachfront",
      image:
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
      rating: 4.9,
      reviews: 980,
      pricePerNight: 450,
      amenities: ["WiFi", "Restaurant", "Gym"],
      distance: 1.2,
      stars: 5,
    },
    {
      id: "3",
      name: "City Central Hotel",
      location: "City Center",
      image:
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
      rating: 4.5,
      reviews: 750,
      pricePerNight: 129,
      amenities: ["WiFi", "Restaurant"],
      distance: 0.1,
      stars: 3,
    },
  ];

  const handleSearch = () => {
    setLoading(true);
    setTimeout(() => {
      setHotels(mockHotels);
      setLoading(false);
    }, 800);
  };

  const filteredHotels = hotels.filter((hotel) => {
    const withinPrice =
      hotel.pricePerNight >= priceRange[0] &&
      hotel.pricePerNight <= priceRange[1];
    const meetsStars = hotel.stars >= minStars;
    const hasAmenities =
      selectedAmenities.length === 0 ||
      selectedAmenities.every((amenity) => hotel.amenities.includes(amenity));

    return withinPrice && meetsStars && hasAmenities;
  });

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
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
              <MapPin className="w-3.5 h-3.5" />
              <span>Curated Stays & Resorts</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Find Your Perfect Stay
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Explore handpicked hotels, luxury villas, and boutique accommodations tailored to your itinerary.
            </p>
          </motion.div>

          {/* Search Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-border/80 shadow-soft space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Location */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  <MapPin className="w-3.5 h-3.5 inline mr-1 text-primary" />
                  Destination
                </label>
                <input
                  type="text"
                  placeholder="City, region, or landmark"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>

              {/* Check-in */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  <Calendar className="w-3.5 h-3.5 inline mr-1 text-primary" />
                  Check-in Date
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-background border border-border/80 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>

              {/* Check-out */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  <Calendar className="w-3.5 h-3.5 inline mr-1 text-primary" />
                  Check-out Date
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-background border border-border/80 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>

              {/* Guests */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  <Users className="w-3.5 h-3.5 inline mr-1 text-primary" />
                  Guests
                </label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full p-3.5 rounded-2xl bg-background border border-border/80 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? "Guest" : "Guests"}
                    </option>
                  ))}
                </select>
              </div>
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
                    Searching Curated Hotels...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Search Hotels
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
                    {/* Price Range */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Max Nightly Budget: ${priceRange[1]}
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="1000"
                        step="25"
                        value={priceRange[1]}
                        onChange={(e) =>
                          setPriceRange([priceRange[0], Number(e.target.value)])
                        }
                        className="w-full accent-primary"
                      />
                    </div>

                    {/* Star Rating */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Minimum Rating
                      </label>
                      <div className="flex gap-2">
                        {[0, 3, 4, 5].map((stars) => (
                          <button
                            key={stars}
                            type="button"
                            onClick={() => setMinStars(stars)}
                            className={cn(
                              "flex-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                              minStars === stars
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted"
                            )}
                          >
                            {stars === 0 ? "Any" : `${stars}★+`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Amenities */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Key Amenities
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {amenitiesList.map((amenity) => (
                          <button
                            key={amenity.name}
                            type="button"
                            onClick={() => toggleAmenity(amenity.name)}
                            className={cn(
                              "px-2.5 py-1 rounded-full border text-xs font-medium transition-all flex items-center gap-1.5",
                              selectedAmenities.includes(amenity.name)
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted"
                            )}
                          >
                            {amenity.icon}
                            {amenity.name}
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
      {hotels.length > 0 && (
        <section className="py-8 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">
              {filteredHotels.length} accommodations found
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHotels.map((hotel, index) => (
              <motion.div
                key={hotel.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-card/85 backdrop-blur-sm rounded-3xl border border-border/80 hover:border-primary/50 shadow-soft hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 overflow-hidden bg-muted">
                    <img
                      src={hotel.image}
                      alt={hotel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 text-xs font-bold flex items-center gap-1 shadow-md">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>{hotel.rating}</span>
                    </div>
                    <div className="absolute bottom-3 left-3 flex gap-0.5">
                      {Array.from({ length: hotel.stars }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-3.5 h-3.5 text-amber-400 fill-amber-400"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-base font-bold text-foreground leading-tight">
                        {hotel.name}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        {hotel.location} · {hotel.distance} km from center
                      </p>
                    </div>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-1.5">
                      {hotel.amenities.slice(0, 4).map((amenity) => (
                        <span
                          key={amenity}
                          className="px-2 py-0.5 rounded-lg bg-muted/60 text-muted-foreground text-[11px] font-medium border border-border/40"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <div>
                      <div className="text-xl font-extrabold text-foreground font-mono">
                        ${hotel.pricePerNight}
                      </div>
                      <div className="text-[10px] text-muted-foreground">per night</div>
                    </div>
                    <Button
                      size="sm"
                      className="rounded-full px-5 py-2 font-semibold text-xs shadow-sm"
                    >
                      Book Stay
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {hotels.length === 0 && !loading && (
        <section className="py-16 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">Discover Handpicked Stays</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Input your destination and trip dates above to browse top-rated accommodations worldwide.
          </p>
        </section>
      )}

      <Footer />
    </div>
  );
}
