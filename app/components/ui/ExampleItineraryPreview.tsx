"use client"

import * as React from "react"
import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Clock, DollarSign, MapPin, Sparkles, Users, ArrowRight, Heart } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatTile } from "@/components/ui/stat-tile"
import { AvatarGroup } from "@/components/ui/avatar-group"
import { SectionHeader } from "@/components/ui/section-header"

interface ExampleItineraryPreviewProps {
  onPlanTrip?: (prompt: string) => void
}

const EXAMPLE_DAYS = [
  {
    dayNumber: 1,
    title: "Neon Streets & Modern Shibuya",
    date: "Day 1",
    activities: [
      {
        time: "09:30 AM",
        title: "Meiji Jingu Shrine & Forest Walk",
        desc: "Stroll beneath towering cedar trees and pass through massive torii gates into Tokyo's tranquil spiritual heart.",
        cost: "Free",
        tag: "Cultural",
        tagVariant: "tag-lavender" as const,
      },
      {
        time: "01:00 PM",
        title: "Katsu Curry Lunch in Harajuku",
        desc: "Savor artisanal panko pork cutlets with rich spiced curry at a celebrated local backstreet eatery.",
        cost: "$18",
        tag: "Dining",
        tagVariant: "tag-peach" as const,
      },
      {
        time: "03:30 PM",
        title: "Shibuya Crossing & Sky Observatory",
        desc: "Watch the world's busiest pedestrian crossing from 229 meters high at Shibuya Sky during golden hour.",
        cost: "$22",
        tag: "Sightseeing",
        tagVariant: "tag-mint" as const,
      },
    ],
  },
  {
    dayNumber: 2,
    title: "Historic Asakusa & Akihabara",
    date: "Day 2",
    activities: [
      {
        time: "09:00 AM",
        title: "Senso-ji Temple & Nakamise Street",
        desc: "Explore Tokyo's oldest Buddhist temple and taste fresh melonpan and dango from Edo-style stalls.",
        cost: "Free",
        tag: "Heritage",
        tagVariant: "tag-lavender" as const,
      },
      {
        time: "01:30 PM",
        title: "Authentic Tonkotsu Ramen in Ueno",
        desc: "Rich pork bone broth simmered for 18 hours, served with springy noodles and chashu.",
        cost: "$14",
        tag: "Dining",
        tagVariant: "tag-peach" as const,
      },
      {
        time: "04:00 PM",
        title: "Retro Arcade & Tech Safari in Akihabara",
        desc: "Discover multi-floor gaming centers, collector shops, and vintage electronic bazaars.",
        cost: "$25",
        tag: "Culture",
        tagVariant: "tag-mint" as const,
      },
    ],
  },
  {
    dayNumber: 3,
    title: "Tsukiji Outer Market & Ginza Elegance",
    date: "Day 3",
    activities: [
      {
        time: "08:30 AM",
        title: "Tsukiji Fresh Seafood Breakfast",
        desc: "Taste fresh seared wagyu skewers, tamagoyaki omelettes, and bluefin sashimi bowls.",
        cost: "$35",
        tag: "Food & Wine",
        tagVariant: "tag-peach" as const,
      },
      {
        time: "11:30 AM",
        title: "Hamarikyu Gardens Tea Pavilion",
        desc: "Traditional matcha tasting in an authentic tidal pond teahouse dating back to the Shogunate.",
        cost: "$8",
        tag: "Scenic",
        tagVariant: "tag-mint" as const,
      },
    ],
  },
]

export function ExampleItineraryPreview({ onPlanTrip }: ExampleItineraryPreviewProps) {
  const [selectedDay, setSelectedDay] = useState(0)
  const currentDayData = EXAMPLE_DAYS[selectedDay]

  return (
    <section id="example-itinerary" className="py-20 sm:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Generated"
          accentWord="Itinerary Preview"
          subtitle="Explore an interactive sample of what Wander.AI generates in under 10 seconds"
        />

        <div className="mt-8 rounded-3xl border border-border/80 bg-card shadow-soft-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: Trip Cover & High-Level Summary */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border/80 bg-muted/20">
            <div>
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <Badge variant="date">5 Days • Tokyo Highlights</Badge>
                <Badge variant="tag-mint">AI Curated</Badge>
              </div>

              {/* Cover Image */}
              <div className="relative w-full h-52 sm:h-64 rounded-2xl overflow-hidden shadow-soft mb-6 group">
                <Image
                  src="https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&auto=format&fit=crop&q=80"
                  alt="Tokyo cityscape and Tokyo Tower"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
                    <MapPin className="size-3.5 text-primary" />
                    <span>Tokyo, Japan</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-0.5">
                    Neon Lights & Sacred Shrines
                  </h3>
                </div>
              </div>

              {/* Stat Tiles: Budget / Travelers / Duration */}
              <div className="grid grid-cols-3 gap-2.5 mb-6">
                <StatTile
                  label="BUDGET"
                  value="$1,850"
                  tone="orange"
                  className="p-3 rounded-xl"
                />
                <StatTile
                  label="PERSON"
                  value="2 Ppl"
                  tone="mint"
                  className="p-3 rounded-xl"
                />
                <StatTile
                  label="DAYS"
                  value="5 Days"
                  tone="lavender"
                  className="p-3 rounded-xl"
                />
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Balanced between high-energy iconic urban sights and tranquil gardens, with verified subway lines and authentic food recommendations.
              </p>
            </div>

            {/* Bottom Action */}
            <div className="pt-6 mt-6 border-t border-border/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Curated for</span>
                <AvatarGroup
                  avatars={[
                    { name: "Jessica T", fallback: "JT" },
                    { name: "Liam Chen", fallback: "LC" },
                  ]}
                  size="sm"
                />
              </div>

              <Button
                variant="primary"
                size="sm"
                className="text-xs font-bold gap-1.5"
                onClick={() => onPlanTrip?.("5 days in Tokyo Japan highlights for couple")}
              >
                <span>Plan This Trip</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Right Column: Day Tabs & Timeline Activities */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Day Navigation Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-border/70 scrollbar-none">
                {EXAMPLE_DAYS.map((day, idx) => (
                  <button
                    key={day.dayNumber}
                    onClick={() => setSelectedDay(idx)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                      selectedDay === idx
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "bg-muted hover:bg-muted/80 text-foreground"
                    }`}
                  >
                    Day {day.dayNumber}: {day.title.split("&")[0]}
                  </button>
                ))}
              </div>

              <div className="mb-4">
                <h4 className="text-lg font-bold text-foreground">
                  {currentDayData.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  3 morning-to-night sequenced experiences
                </p>
              </div>

              {/* Activity Cards List */}
              <div className="space-y-3.5">
                {currentDayData.activities.map((act, i) => (
                  <motion.div
                    key={act.title}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                    className="p-4 rounded-2xl border border-border/80 bg-card hover:bg-muted/40 transition-colors shadow-soft-xs"
                  >
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary flex items-center gap-1">
                          <Clock className="size-3" />
                          {act.time}
                        </span>
                        <Badge variant={act.tagVariant}>{act.tag}</Badge>
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {act.cost}
                      </span>
                    </div>

                    <h5 className="text-sm sm:text-base font-bold text-foreground mb-1">
                      {act.title}
                    </h5>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {act.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Hint footer */}
            <div className="mt-8 pt-4 border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground">
              <span>All stops include verified Mapbox geocoding & opening hours</span>
              <span className="text-accent font-semibold flex items-center gap-1">
                <Sparkles className="size-3" />
                Ready to customize
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
