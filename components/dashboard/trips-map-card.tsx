"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Maximize2, MapPin as MapPinIcon, Sparkles } from "lucide-react"
import { ItineraryData } from "@/app/components/types"
import { DottedWorldMap, MapPin } from "@/components/shared/dotted-world-map"
import { SectionHeader } from "@/components/ui/section-header"
import { getDestinationCoords } from "@/lib/country-code"

interface TripsMapCardProps {
  trips: ItineraryData[]
  selectedTripId?: string
  onSelectTrip?: (tripId: string) => void
}

export function TripsMapCard({
  trips,
  selectedTripId,
  onSelectTrip,
}: TripsMapCardProps) {
  const router = useRouter()

  // Convert real user trips to MapPin format
  const pins: MapPin[] = React.useMemo(() => {
    if (trips.length === 0) {
      // Inspiring global default pins when 0 trips
      return [
        {
          lat: 35.6762,
          lng: 139.6503,
          label: "Tokyo",
          countryCode: "JP",
          description: "Top Trending",
        },
        {
          lat: 48.8566,
          lng: 2.3522,
          label: "Paris",
          countryCode: "FR",
          description: "Iconic Culture",
        },
        {
          lat: 40.634,
          lng: 14.6027,
          label: "Amalfi",
          countryCode: "IT",
          description: "Coastal Views",
        },
        {
          lat: -8.4095,
          lng: 115.1889,
          label: "Bali",
          countryCode: "ID",
          description: "Tropical Oasis",
        },
      ]
    }

    return trips.map((trip) => {
      const coords = getDestinationCoords(trip.destination)
      const isSelected = trip.id === selectedTripId
      return {
        lat: coords.lat,
        lng: coords.lng,
        label: coords.city,
        countryCode: coords.countryCode,
        active: isSelected,
        description:
          typeof trip.duration === "number"
            ? `${trip.duration} Days`
            : trip.duration || "Trip",
      }
    })
  }, [trips, selectedTripId])

  const handlePinClick = (pin: MapPin) => {
    const matched = trips.find(
      (t) =>
        t.destination.toLowerCase().includes(pin.label.toLowerCase()) ||
        t.destination.toLowerCase().includes(pin.countryCode.toLowerCase())
    )
    if (matched?.id) {
      if (onSelectTrip) {
        onSelectTrip(matched.id)
      } else {
        router.push(`/itinerary/${matched.id}`)
      }
    }
  }

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Your Trips"
        accentWord="Map"
        subtitle="Pinned destinations from your travel plans"
        action={{
          label: "View all",
          href: "/dashboard/itineraries",
          icon: <Maximize2 className="size-3.5" />,
        }}
        className="mb-3"
      />

      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-2 sm:p-4 shadow-soft">
        {/* Decorative corner tag */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-full bg-background/80 border border-border/80 px-3 py-1 text-[11px] font-bold text-muted-foreground backdrop-blur-md">
          <MapPinIcon className="size-3 text-accent" />
          <span>{trips.length} {trips.length === 1 ? "Destination" : "Destinations"}</span>
        </div>

        {/* World Map Container */}
        <div className="w-full flex items-center justify-center min-h-[220px] sm:min-h-[280px]">
          <DottedWorldMap
            pins={pins}
            onPinClick={handlePinClick}
            height={52}
            dotRadius={0.22}
            className="w-full h-auto max-w-4xl"
          />
        </div>
      </div>
    </div>
  )
}
