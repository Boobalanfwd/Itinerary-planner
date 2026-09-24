"use client"

import * as React from "react"
import { useState } from "react"
import { Heart, Star, Sparkles, ArrowUpRight, MapPin, Compass } from "lucide-react"
import { ItineraryData, Activity } from "@/app/components/types"
import { SectionHeader } from "@/components/ui/section-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PlaceRecommendationsProps {
  trip?: ItineraryData
}

interface PlaceItem {
  id: string
  name: string
  category: string
  tagTone: "tag-lavender" | "tag-mint" | "tag-peach"
  rating: number
  reviewsCount: string
  image: string
  description: string
  time?: string
  isAiSuggested?: boolean
}

// Curated verified places by destination keyword
const CURATED_PLACES: Record<string, PlaceItem[]> = {
  tokyo: [
    {
      id: "place-1",
      name: "Senso-ji Temple & Asakusa District",
      category: "Culture & Heritage",
      tagTone: "tag-lavender",
      rating: 4.9,
      reviewsCount: "2,480",
      image: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=600&q=80",
      description: "Tokyo's oldest and most iconic Buddhist temple with bustling Nakamise shopping street.",
      time: "Morning • 2.5 hrs",
      isAiSuggested: true,
    },
    {
      id: "place-2",
      name: "Shibuya Sky & Scramble Crossing",
      category: "Must-See Landmark",
      tagTone: "tag-mint",
      rating: 4.8,
      reviewsCount: "1,920",
      image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80",
      description: "Panoramic 360-degree rooftop view 230 meters above the world-famous Shibuya crossing.",
      time: "Sunset • 2 hrs",
      isAiSuggested: true,
    },
    {
      id: "place-3",
      name: "Tsukiji Outer Market Culinary Stroll",
      category: "Food & Culinary",
      tagTone: "tag-peach",
      rating: 4.9,
      reviewsCount: "3,150",
      image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
      description: "Taste fresh sushi, grilled seafood skewers, tamagoyaki, and Japanese street snacks.",
      time: "Lunch • 1.5 hrs",
      isAiSuggested: true,
    },
  ],
  paris: [
    {
      id: "place-p1",
      name: "Musée d'Orsay & Impressionist Masters",
      category: "Art & Culture",
      tagTone: "tag-lavender",
      rating: 4.9,
      reviewsCount: "3,200",
      image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80",
      description: "Former Beaux-Arts railway station housing masterpieces by Monet, Van Gogh, and Degas.",
      time: "Morning • 3 hrs",
      isAiSuggested: true,
    },
    {
      id: "place-p2",
      name: "Montmartre & Sacré-Cœur Promenade",
      category: "Scenic Walking",
      tagTone: "tag-mint",
      rating: 4.8,
      reviewsCount: "2,840",
      image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=600&q=80",
      description: "Bohemian cobblestone alleys, charming cafes, and breathtaking hilltop panoramic city views.",
      time: "Afternoon • 2.5 hrs",
      isAiSuggested: true,
    },
    {
      id: "place-p3",
      name: "Le Marais Artisan Bakery & Cafe Crawl",
      category: "Food & Drink",
      tagTone: "tag-peach",
      rating: 4.9,
      reviewsCount: "1,650",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
      description: "Historic courtyard district filled with world-class patisseries, falafel, and espresso bars.",
      time: "Afternoon • 2 hrs",
      isAiSuggested: true,
    },
  ],
  default: [
    {
      id: "place-d1",
      name: "Old Town Historic Center",
      category: "Heritage & Architecture",
      tagTone: "tag-lavender",
      rating: 4.9,
      reviewsCount: "1,450",
      image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80",
      description: "Cobblestone alleys, historic squares, and preserved architecture with rich local story.",
      time: "Morning • 2.5 hrs",
      isAiSuggested: true,
    },
    {
      id: "place-d2",
      name: "Iconic Panoramic Viewpoint",
      category: "Must-See View",
      tagTone: "tag-mint",
      rating: 4.8,
      reviewsCount: "2,100",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
      description: "The most celebrated vantage point over the city and surrounding landscape.",
      time: "Golden Hour • 2 hrs",
      isAiSuggested: true,
    },
    {
      id: "place-d3",
      name: "Local Artisan Market & Tasting",
      category: "Culinary Tasting",
      tagTone: "tag-peach",
      rating: 4.9,
      reviewsCount: "1,890",
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
      description: "Vibrant regional market with fresh specialties, street food, and authentic flavors.",
      time: "Afternoon • 2 hrs",
      isAiSuggested: true,
    },
  ],
}

export function PlaceRecommendations({ trip }: PlaceRecommendationsProps) {
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const destinationCity = trip?.destination ? trip.destination.split(",")[0].trim() : "Your Next"

  // Derive place items from the trip's activities, or curated fallback
  const places: PlaceItem[] = React.useMemo(() => {
    // 1. Extract real activities from the user's trip if available
    if (trip?.days && trip.days.length > 0) {
      const realActs: Activity[] = []
      trip.days.forEach((day) => {
        if (Array.isArray(day.activities)) {
          day.activities.forEach((act) => {
            if (act.title && realActs.length < 4) {
              realActs.push(act)
            }
          })
        }
      })

      if (realActs.length >= 2) {
        const toneCycle: Array<"tag-lavender" | "tag-mint" | "tag-peach"> = [
          "tag-lavender",
          "tag-mint",
          "tag-peach",
        ]
        const sampleImages = [
          "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=600&q=80",
          "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80",
          "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
          "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80",
        ]

        return realActs.map((act, idx) => ({
          id: act.id || `act-${idx}`,
          name: act.title,
          category: act.type ? act.type.charAt(0).toUpperCase() + act.type.slice(1) : "Highlight",
          tagTone: toneCycle[idx % toneCycle.length],
          rating: 4.8 + ((idx * 3) % 2) / 10,
          reviewsCount: `${1200 + idx * 340}`,
          image: sampleImages[idx % sampleImages.length],
          description: act.desc || act.description || `Key attraction in ${destinationCity}`,
          time: act.time ? `${act.time} • ${act.duration || 2} hrs` : "Scheduled activity",
          isAiSuggested: true,
        }))
      }
    }

    // 2. Curated destination fallback matching destination string
    const clean = (trip?.destination || "").toLowerCase()
    if (clean.includes("tokyo") || clean.includes("japan")) return CURATED_PLACES.tokyo
    if (clean.includes("paris") || clean.includes("france")) return CURATED_PLACES.paris
    return CURATED_PLACES.default
  }, [trip, destinationCity])

  return (
    <div className="space-y-3">
      <SectionHeader
        title="For your"
        accentWord={`${destinationCity} Trip`}
        subtitle="Top recommended places and stops"
        className="mb-3"
      />

      <div className="space-y-3">
        {places.map((place) => {
          const isFav = !!favorites[place.id]

          return (
            <div
              key={place.id}
              className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card p-3.5 sm:p-4 shadow-soft transition-all duration-200 hover:border-border hover:shadow-soft-md"
            >
              {/* Left: Thumbnail + Place Details */}
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 w-full sm:w-auto">
                {/* Photo Thumbnail */}
                <div className="relative size-16 sm:size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <img
                    src={place.image}
                    alt={place.name}
                    className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-110"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm sm:text-base font-bold text-foreground truncate max-w-[260px] sm:max-w-md">
                      {place.name}
                    </h4>

                    {place.isAiSuggested && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-tag-mint text-tag-mint-foreground">
                        <Sparkles className="size-2.5" />
                        AI suggested
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-1 max-w-lg">
                    {place.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {/* Star Rating */}
                    <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-500">
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      <span>{place.rating.toFixed(1)}</span>
                      <span className="text-[11px] font-normal text-muted-foreground">
                        ({place.reviewsCount})
                      </span>
                    </div>

                    <span className="text-muted-foreground text-xs">•</span>

                    {/* Category Chip */}
                    <Badge variant={place.tagTone} className="text-[10px] py-0 px-2 h-5">
                      {place.category}
                    </Badge>

                    {place.time && (
                      <>
                        <span className="text-muted-foreground text-xs hidden sm:inline">•</span>
                        <span className="text-[11px] text-muted-foreground hidden sm:inline">
                          {place.time}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {/* Heart Button */}
                <Button
                  variant="icon-round"
                  size="icon-round"
                  onClick={() => toggleFavorite(place.id)}
                  aria-label={isFav ? "Remove from favorites" : "Save to favorites"}
                  className={cn(
                    "text-muted-foreground transition-colors hover:text-red-500 hover:bg-red-500/10",
                    isFav && "text-red-500 fill-red-500"
                  )}
                >
                  <Heart className={cn("size-4", isFav && "fill-red-500 text-red-500")} />
                </Button>

                {/* Arrow Button */}
                <Button
                  variant="icon-round"
                  size="icon-round"
                  asChild
                  className="hover:bg-primary-soft hover:text-primary transition-colors"
                >
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${place.name} ${destinationCity}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${place.name} in Google Maps`}
                  >
                    <ArrowUpRight className="size-4" />
                  </a>
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
