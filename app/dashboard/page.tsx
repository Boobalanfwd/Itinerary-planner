"use client"

import React, { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ItineraryData } from "@/app/components/types"
import { SectionHeader } from "@/components/ui/section-header"
import { UpcomingTripCard } from "@/components/dashboard/upcoming-trip-card"
import { TripsMapCard } from "@/components/dashboard/trips-map-card"
import { PlaceRecommendations } from "@/components/dashboard/place-recommendations"
import { ItinerarySummaryCard } from "@/components/dashboard/itinerary-summary-card"
import { TripHighlightsStrip } from "@/components/dashboard/trip-highlights-strip"
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [trips, setTrips] = useState<ItineraryData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/dashboard")
    }
  }, [status, router])

  // Fetch real user itineraries
  useEffect(() => {
    let isMounted = true

    async function fetchUserTrips() {
      try {
        const res = await fetch("/api/itineraries?limit=10")
        if (!res.ok) {
          if (isMounted) setLoading(false)
          return
        }
        const json = await res.json()
        if (isMounted && json.success && Array.isArray(json.data)) {
          setTrips(json.data)
          if (json.data.length > 0 && !selectedTripId) {
            setSelectedTripId(json.data[0].id || null)
          }
        }
      } catch (err) {
        console.warn("Failed to fetch dashboard trips", err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    if (session?.user) {
      fetchUserTrips()
    } else if (status === "unauthenticated") {
      setLoading(false)
    }

    return () => {
      isMounted = false
    }
  }, [session?.user, status, selectedTripId])

  if (status === "loading" || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DashboardSkeleton />
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  // Active selected trip (defaults to first trip)
  const activeTrip = trips.find((t) => t.id === selectedTripId) || trips[0]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16 space-y-8">
      {/* If user has 0 trips, display elegant onboarding state */}
      {trips.length === 0 ? (
        <DashboardEmptyState />
      ) : (
        /* Full 2-column layout matching Reference Image 2 */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Main Feed Column (8 cols on desktop) */}
          <div className="lg:col-span-8 space-y-8">
            {/* 1. Upcoming Trip Hero Section */}
            <section aria-label="Upcoming Trip">
              <SectionHeader
                title="Upcoming"
                accentWord="Trip"
                subtitle="Your next confirmed travel itinerary"
                action={{
                  label: "View all",
                  href: "/dashboard/itineraries",
                }}
                className="mb-3"
              />
              <UpcomingTripCard trip={activeTrip} />
            </section>

            {/* 2. Your Trips Map */}
            <section aria-label="Your Trips Map">
              <TripsMapCard
                trips={trips}
                selectedTripId={activeTrip?.id}
                onSelectTrip={(id) => setSelectedTripId(id)}
              />
            </section>

            {/* 3. For your [Destination] Trip Places Row */}
            <section aria-label="Trip Recommendations">
              <PlaceRecommendations trip={activeTrip} />
            </section>

            {/* 4. Trip Highlights photo strip (if user has > 1 trip) */}
            <section aria-label="Other Trip Highlights">
              <TripHighlightsStrip trips={trips} />
            </section>
          </div>

          {/* Right Sidebar Itinerary Summary Column (4 cols on desktop) */}
          <div className="lg:col-span-4">
            <aside aria-label="Selected Itinerary Summary">
              <ItinerarySummaryCard trip={activeTrip} />
            </aside>
          </div>
        </div>
      )}
    </div>
  )
}
