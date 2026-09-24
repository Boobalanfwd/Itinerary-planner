"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Compass, Sparkles, Plus, MapPin, ArrowRight } from "lucide-react"
import * as Flags from "country-flag-icons/react/3x2"
import { Button } from "@/components/ui/button"
import { DottedWorldMap, MapPin as MapPinType } from "@/components/shared/dotted-world-map"

const POPULAR_DESTINATIONS = [
  { city: "Tokyo, Japan", code: "JP", desc: "Cherry blossoms & culinary neon" },
  { city: "Paris, France", code: "FR", desc: "Art, architecture & historic cafes" },
  { city: "Amalfi Coast, Italy", code: "IT", desc: "Clifftop villages & azure seas" },
  { city: "Bali, Indonesia", code: "ID", desc: "Temples, rice terraces & beaches" },
  { city: "Reykjavik, Iceland", code: "IS", desc: "Glaciers, waterfalls & aurora" },
]

const EMPTY_MAP_PINS: MapPinType[] = [
  { lat: 35.6762, lng: 139.6503, label: "Tokyo", countryCode: "JP", description: "Trending" },
  { lat: 48.8566, lng: 2.3522, label: "Paris", countryCode: "FR", description: "Culture" },
  { lat: 40.634, lng: 14.6027, label: "Amalfi", countryCode: "IT", description: "Coastal" },
  { lat: -8.4095, lng: 115.1889, label: "Bali", countryCode: "ID", description: "Tropical" },
  { lat: 64.1466, lng: -21.9426, label: "Reykjavik", countryCode: "IS", description: "Adventure" },
]

export function DashboardEmptyState() {
  const router = useRouter()

  const handleSelectDestination = (destination: string) => {
    router.push(`/dashboard/create?destination=${encodeURIComponent(destination)}`)
  }

  return (
    <div className="space-y-8 py-2">
      {/* 1. Hero Callout Card */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary-soft/50 via-card to-background p-6 sm:p-10 shadow-soft">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-xs font-bold text-primary">
            <Sparkles className="size-3.5" />
            <span>AI Itinerary Planner</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Plan your next journey with <span className="text-primary font-serif-logo">Wander.AI</span>
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            You don't have any upcoming trips yet. Tell us where you'd like to go, and
            our AI will craft an authentic day-by-day itinerary with verified activities,
            optimized budgets, and interactive maps.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              asChild
              variant="primary"
              size="pill"
              className="h-11 px-6 font-bold shadow-soft gap-2 text-sm"
            >
              <Link href="/dashboard/create">
                <Plus className="size-4" />
                <span>Plan Your First Trip</span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="pill"
              className="h-11 px-5 font-semibold text-sm rounded-full"
            >
              <Link href="/marketplace">
                <Compass className="size-4 text-accent" />
                <span>Explore Community Trips</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Subtle background decoration */}
        <div className="pointer-events-none absolute -bottom-10 -right-10 size-80 rounded-full bg-primary/10 blur-3xl" />
      </div>

      {/* 2. Destination Inspiration Starter Chips */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Popular destinations to start with
          </h3>
          <span className="text-xs text-muted-foreground">Click to quick-plan</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {POPULAR_DESTINATIONS.map((dest) => {
            const FlagComponent = Flags[dest.code as keyof typeof Flags]
            return (
              <button
                key={dest.city}
                onClick={() => handleSelectDestination(dest.city)}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-4 text-left shadow-soft transition-all duration-200 hover:border-primary/40 hover:shadow-soft-md cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {FlagComponent && (
                    <FlagComponent className="size-6 rounded-[3px] shadow-xs shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {dest.city}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {dest.desc}
                    </p>
                  </div>
                </div>

                <ArrowRight className="size-4 text-muted-foreground/60 transition-transform group-hover:translate-x-1 group-hover:text-primary shrink-0" />
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Global Discovery Map */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-accent" />
            <h4 className="text-sm font-bold text-foreground">Global Travel Network</h4>
          </div>
          <span className="text-xs text-muted-foreground">Interactive world view</span>
        </div>

        <div className="w-full flex items-center justify-center min-h-[220px]">
          <DottedWorldMap
            pins={EMPTY_MAP_PINS}
            onPinClick={(pin) => handleSelectDestination(pin.label)}
            height={50}
            dotRadius={0.22}
            className="w-full h-auto max-w-4xl"
          />
        </div>
      </div>
    </div>
  )
}
