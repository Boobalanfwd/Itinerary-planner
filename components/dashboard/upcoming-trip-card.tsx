"use client"

import * as React from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowUpRight, Calendar, Sparkles } from "lucide-react"
import * as Flags from "country-flag-icons/react/3x2"
import { ItineraryData } from "@/app/components/types"
import { getCountryCode } from "@/lib/country-code"
import { AvatarGroup } from "@/components/ui/avatar-group"
import { Button } from "@/components/ui/button"

interface UpcomingTripCardProps {
  trip: ItineraryData
}

export function UpcomingTripCard({ trip }: UpcomingTripCardProps) {
  const countryCode = getCountryCode(trip.destination)
  const FlagComponent = Flags[countryCode as keyof typeof Flags]

  // Format date chip: "24 Dec 2024 • 5 Days"
  const formattedDate = React.useMemo(() => {
    const days =
      typeof trip.duration === "number"
        ? `${trip.duration} Days`
        : trip.duration || "5 Days"
    if (trip.startDate) {
      try {
        const date = new Date(trip.startDate)
        return `${format(date, "d MMM yyyy")} • ${days}`
      } catch {
        return days
      }
    }
    if (trip.createdAt) {
      try {
        const date = new Date(trip.createdAt)
        return `${format(date, "d MMM yyyy")} • ${days}`
      } catch {
        return days
      }
    }
    return days
  }, [trip.startDate, trip.createdAt, trip.duration])

  // Destination image fallback
  const coverImage = React.useMemo(() => {
    if (trip.image && trip.image.startsWith("http")) return trip.image
    const clean = (trip.destination || "").toLowerCase()
    if (clean.includes("tokyo") || clean.includes("japan")) return "/images/destinations/tokyo.jpg"
    if (clean.includes("paris") || clean.includes("france")) return "/images/destinations/paris.jpg"
    if (clean.includes("amalfi") || clean.includes("italy") || clean.includes("rome"))
      return "/images/destinations/amalfi.jpg"
    if (clean.includes("reykjavik") || clean.includes("iceland"))
      return "/images/destinations/reykjavik.jpg"
    if (clean.includes("singapore")) return "/images/destinations/singapore.jpg"
    if (clean.includes("goa") || clean.includes("india")) return "/images/destinations/goa.jpg"
    return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80"
  }, [trip.image, trip.destination])

  const destinationCity = trip.destination.split(",")[0].trim()
  const destinationCountry = trip.destination.split(",")[1]?.trim() || "Destination"

  // Sample traveler stack for visual fidelity to Reference Image 2
  const sampleTravelers = [
    { name: "Alex Morgan" },
    { name: "Jordan Lee" },
    { name: "Sam Taylor" },
  ]

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-soft transition-all duration-300 hover:shadow-soft-xl">
      {/* Cover Image with Gradient Vignette */}
      <div className="relative h-64 sm:h-76 w-full overflow-hidden bg-muted">
        <img
          src={coverImage}
          alt={trip.destination}
          className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
        />
        {/* Multilayer gradient for optimal text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3">
          {/* Orange Date Pill */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-soft-xs backdrop-blur-md">
            <Calendar className="size-3.5" />
            <span>{formattedDate}</span>
          </div>

          {/* AI Curated Badge */}
          <div className="inline-flex items-center gap-1 rounded-full bg-black/40 border border-white/20 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
            <Sparkles className="size-3 text-accent" />
            <span>AI Curated</span>
          </div>
        </div>

        {/* Bottom Hero Info */}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                {FlagComponent && (
                  <FlagComponent className="size-4.5 rounded-[2px] shadow-xs shrink-0" />
                )}
                <span className="text-xs uppercase font-bold tracking-wider text-white/80">
                  {destinationCountry}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                {destinationCity}
              </h3>

              {trip.title && (
                <p className="text-xs sm:text-sm text-white/90 line-clamp-1">
                  {trip.title}
                </p>
              )}
            </div>

            {/* Travelers + Action CTA */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <AvatarGroup avatars={sampleTravelers} max={2} size="sm" />
              </div>

              <Button
                asChild
                variant="primary"
                size="pill"
                className="font-bold text-xs sm:text-sm h-10 px-5 shadow-soft gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Link href={`/itinerary/${trip.id}`}>
                  <span>Details</span>
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
