"use client"

import * as React from "react"
import Link from "next/link"
import { Calendar, CreditCard, Users, ArrowUpRight, Compass, Sparkles, MapPin } from "lucide-react"
import * as Flags from "country-flag-icons/react/3x2"
import { ItineraryData } from "@/app/components/types"
import { getCountryCode } from "@/lib/country-code"
import { StatTile } from "@/components/ui/stat-tile"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ItinerarySummaryCardProps {
  trip: ItineraryData
}

export function ItinerarySummaryCard({ trip }: ItinerarySummaryCardProps) {
  const countryCode = getCountryCode(trip.destination)
  const FlagComponent = Flags[countryCode as keyof typeof Flags]

  const destinationCity = trip.destination.split(",")[0].trim()
  const destinationCountry = trip.destination.split(",")[1]?.trim() || "Destination"

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
    return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80"
  }, [trip.image, trip.destination])

  const budgetDisplay = React.useMemo(() => {
    if (trip.totalBudget) return `$${trip.totalBudget.toLocaleString()}`
    if (typeof trip.budget === "number") return `$${trip.budget.toLocaleString()}`
    if (trip.budget && trip.budget !== "N/A") return String(trip.budget)
    return "$2,400"
  }, [trip.totalBudget, trip.budget])

  const durationDisplay = React.useMemo(() => {
    if (typeof trip.duration === "number") return `${trip.duration} Days`
    return trip.duration || "5 Days"
  }, [trip.duration])

  const durationNumber = React.useMemo(() => {
    if (typeof trip.duration === "number") return trip.duration
    const parsed = parseInt(String(trip.duration || "3"))
    return isNaN(parsed) ? 3 : parsed
  }, [trip.duration])

  const daysList = React.useMemo(() => {
    if (Array.isArray(trip.days) && trip.days.length > 0) {
      return trip.days.slice(0, 3)
    }
    return [
      { day: 1, title: "Arrival & City Highlights Orientation" },
      { day: 2, title: "Cultural Landmarks & Local Flavors" },
      { day: 3, title: "Panoramic Views & Hidden Neighborhoods" },
    ]
  }, [trip.days])

  return (
    <div className="sticky top-20 rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-soft space-y-4 sm:space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {FlagComponent && (
            <FlagComponent className="size-4.5 rounded-[2px] shadow-xs shrink-0" />
          )}
          <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
            {destinationCity} • {destinationCountry}
          </span>
        </div>

        <Badge variant="tag-mint" className="text-[10px] font-bold">
          Active Plan
        </Badge>
      </div>

      {/* Hero Thumbnail Banner with High Contrast Overlay */}
      <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-muted group">
        <img
          src={coverImage}
          alt={trip.destination}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h4 className="text-base font-bold text-white drop-shadow-md line-clamp-1">
            {trip.title || `${durationDisplay} in ${destinationCity}`}
          </h4>
          <p className="text-[11px] text-white/90 drop-shadow-sm line-clamp-1">
            {trip.description || `AI curated journey with activities and dining`}
          </p>
        </div>
      </div>

      {/* Metrics Triplet: Budget / Person / Duration with balanced unit typography */}
      <div className="grid grid-cols-3 gap-2">
        <StatTile
          label="Budget"
          value={<span className="text-base sm:text-lg font-extrabold">{budgetDisplay}</span>}
          tone="orange"
          size="sm"
          icon={<CreditCard className="size-3.5" />}
        />
        <StatTile
          label="Person"
          value={
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-base sm:text-lg font-extrabold shrink-0">2</span>
              <span className="text-[11px] font-semibold opacity-85 truncate">Persons</span>
            </div>
          }
          tone="mint"
          size="sm"
          icon={<Users className="size-3.5" />}
        />
        <StatTile
          label="Duration"
          value={
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-base sm:text-lg font-extrabold shrink-0">{durationNumber}</span>
              <span className="text-[11px] font-semibold opacity-85 truncate">Days</span>
            </div>
          }
          tone="lavender"
          size="sm"
          icon={<Calendar className="size-3.5" />}
        />
      </div>

      {/* Day-by-Day Quick Preview */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
          <span>Day Highlights</span>
          <span className="text-[11px] font-normal lowercase">{daysList.length} previewed</span>
        </div>

        <div className="space-y-2">
          {daysList.map((dayItem) => (
            <div
              key={dayItem.day}
              className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/40 p-2.5 transition-colors hover:bg-muted/70"
            >
              <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                D{dayItem.day}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground line-clamp-1">
                  {dayItem.title}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Day {dayItem.day} schedule & stops
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Itinerary Action Button */}
      <div className="pt-2">
        <Button
          asChild
          variant="primary"
          size="pill"
          className="w-full font-bold shadow-soft gap-2 h-11 text-sm justify-center"
        >
          <Link href={`/itinerary/${trip.id}`}>
            <span>Open Full Itinerary</span>
            <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
