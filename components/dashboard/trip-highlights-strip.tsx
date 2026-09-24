"use client"

import * as React from "react"
import Link from "next/link"
import { Sparkles, ArrowRight } from "lucide-react"
import * as Flags from "country-flag-icons/react/3x2"
import { ItineraryData } from "@/app/components/types"
import { getCountryCode } from "@/lib/country-code"
import { SectionHeader } from "@/components/ui/section-header"
import { Badge } from "@/components/ui/badge"

interface TripHighlightsStripProps {
  trips: ItineraryData[]
}

export function TripHighlightsStrip({ trips }: TripHighlightsStripProps) {
  if (trips.length <= 1) return null

  return (
    <div className="space-y-3 pt-2">
      <SectionHeader
        title="Trip"
        accentWord="Highlights"
        subtitle="Quick jump into your planned adventures"
        action={{
          label: "View all",
          href: "/dashboard/itineraries",
          icon: <ArrowRight className="size-3.5" />,
        }}
        className="mb-3"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {trips.slice(1, 4).map((trip) => {
          const countryCode = getCountryCode(trip.destination)
          const FlagComponent = Flags[countryCode as keyof typeof Flags]
          const city = trip.destination.split(",")[0].trim()

          const coverImage =
            trip.image ||
            `/images/destinations/${
              trip.destination.toLowerCase().includes("tokyo")
                ? "tokyo.jpg"
                : trip.destination.toLowerCase().includes("paris")
                ? "paris.jpg"
                : trip.destination.toLowerCase().includes("amalfi")
                ? "amalfi.jpg"
                : "tokyo.jpg"
            }`

          return (
            <Link
              key={trip.id}
              href={`/itinerary/${trip.id}`}
              className="group relative flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-soft transition-all duration-200 hover:border-primary/40 hover:shadow-soft-md"
            >
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                <img
                  src={coverImage}
                  alt={trip.destination}
                  className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-110"
                />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5">
                  {FlagComponent && (
                    <FlagComponent className="size-3.5 rounded-[2px] shrink-0" />
                  )}
                  <span className="text-xs font-bold text-foreground truncate">
                    {city}
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  {trip.title || trip.destination}
                </p>

                <div className="flex items-center gap-2">
                  <Badge variant="date" className="text-[10px] h-4 py-0 px-1.5">
                    {trip.duration}
                  </Badge>
                  {trip.budget && (
                    <span className="text-[11px] font-semibold text-primary">
                      {trip.budget}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
