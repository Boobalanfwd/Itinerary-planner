"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { StatTile } from "@/components/ui/stat-tile"
import { SectionHeader } from "@/components/ui/section-header"
import { AvatarGroup } from "@/components/ui/avatar-group"
import { DottedWorldMap, MapPin } from "@/components/shared/dotted-world-map"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Compass,
  ArrowRight,
  Sparkles,
  Heart,
  Share2,
  Calendar,
  DollarSign,
  Users,
  Clock,
  Search,
  Bell,
  MapPin as MapPinIcon,
  ChevronRight,
} from "lucide-react"

const SAMPLE_PINS: MapPin[] = [
  { lat: 35.6762, lng: 139.6503, label: "Tokyo", countryCode: "JP" },
  { lat: 48.8566, lng: 2.3522, label: "Paris", countryCode: "FR" },
  { lat: 41.9028, lng: 12.4964, label: "Rome", countryCode: "IT" },
  { lat: 40.7128, lng: -74.006, label: "New York", countryCode: "US" },
  { lat: -33.8688, lng: 151.2093, label: "Sydney", countryCode: "AU" },
  { lat: 1.3521, lng: 103.8198, label: "Singapore", countryCode: "SG" },
]

const SAMPLE_AVATARS = [
  { name: "Sophia Miller", fallback: "SM", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" },
  { name: "Alex Chen", fallback: "AC", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" },
  { name: "Elena Rostova", fallback: "ER", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" },
  { name: "Marcus Brody", fallback: "MB" },
  { name: "Jessica Taylor", fallback: "JT" },
]

export default function DevUiPage() {
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null)

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200 p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Top bar with branding & theme toggle */}
        <div className="flex items-center justify-between border-b border-border/80 pb-6">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-soft">
              <Compass className="size-5" />
            </div>
            <div>
              <span className="font-serif-logo text-2xl tracking-wider text-foreground">
                WANDER.AI
              </span>
              <p className="text-xs text-muted-foreground font-medium">Design System & Token Verification</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="new">PHASE U1</Badge>
            <ThemeToggle />
          </div>
        </div>

        {/* 1. Color Tokens Palette */}
        <section className="space-y-4">
          <SectionHeader
            title="Design"
            accentWord="Tokens"
            subtitle="Extracted color tokens from reference aesthetic with full light/dark support"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-primary text-primary-foreground shadow-soft">
              <p className="text-xs font-semibold uppercase opacity-80">Primary</p>
              <p className="text-lg font-bold">#F68B3C</p>
              <p className="text-xs opacity-75 mt-1">Warm Orange</p>
            </div>
            <div className="p-4 rounded-2xl bg-accent text-accent-foreground shadow-soft">
              <p className="text-xs font-semibold uppercase opacity-80">Accent</p>
              <p className="text-lg font-bold">#1DBF8A</p>
              <p className="text-xs opacity-75 mt-1">Emerald Green</p>
            </div>
            <div className="p-4 rounded-2xl bg-foreground text-background shadow-soft">
              <p className="text-xs font-semibold uppercase opacity-80">Ink / Navy</p>
              <p className="text-lg font-bold">#16283B</p>
              <p className="text-xs opacity-75 mt-1">Deep Navy</p>
            </div>
            <div className="p-4 rounded-2xl bg-primary-soft text-primary-soft-foreground border border-primary/20">
              <p className="text-xs font-semibold uppercase opacity-80">Soft Orange</p>
              <p className="text-lg font-bold">#FFF1E6</p>
              <p className="text-xs opacity-75 mt-1">Tint Accent</p>
            </div>
            <div className="p-4 rounded-2xl bg-accent-soft text-accent-soft-foreground border border-accent/20">
              <p className="text-xs font-semibold uppercase opacity-80">Soft Emerald</p>
              <p className="text-lg font-bold">#E6F9F3</p>
              <p className="text-xs opacity-75 mt-1">Mint Tint</p>
            </div>
            <div className="p-4 rounded-2xl bg-indigo text-indigo-foreground shadow-soft">
              <p className="text-xs font-semibold uppercase opacity-80">Feature Badge</p>
              <p className="text-lg font-bold">#2E2A6B</p>
              <p className="text-xs opacity-75 mt-1">Deep Indigo</p>
            </div>
          </div>
        </section>

        {/* 2. Button Variants */}
        <section className="space-y-4">
          <SectionHeader
            title="Button"
            accentWord="Variants"
            subtitle="Custom shadcn Button variants tailored to the design reference"
          />
          <div className="flex flex-wrap items-center gap-4 p-6 rounded-2xl border border-border/80 bg-card shadow-soft">
            <Button variant="primary" size="pill">
              <Sparkles className="size-4" />
              <span>+ New Trip</span>
            </Button>
            <Button variant="primary">
              Plan my trip
              <ArrowRight className="size-4" />
            </Button>
            <Button variant="soft">
              Details
            </Button>
            <Button variant="soft">
              Expand
            </Button>
            <Button variant="accent">
              Explore Itineraries
            </Button>
            <Button variant="outline">
              See an example
            </Button>
            <Button variant="secondary">
              Secondary
            </Button>
            <Button variant="ghost">
              Ghost Link
            </Button>
            <Button variant="destructive" size="sm">
              Delete
            </Button>

            {/* Icon round buttons */}
            <div className="flex items-center gap-2 pl-4 border-l border-border">
              <Button variant="icon-round" size="icon-round" aria-label="Search">
                <Search className="size-4" />
              </Button>
              <Button variant="icon-round" size="icon-round" aria-label="Notifications" className="relative">
                <Bell className="size-4" />
                <span className="absolute top-2 right-2 size-2 rounded-full bg-red-500 ring-2 ring-card" />
              </Button>
              <Button variant="icon-round" size="icon-round" aria-label="Bookmark">
                <Heart className="size-4 text-muted-foreground hover:text-red-500" />
              </Button>
              <Button variant="icon-round" size="icon-round" aria-label="Open">
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* 3. Badge & Chip Variants */}
        <section className="space-y-4">
          <SectionHeader
            title="Badge & Chip"
            accentWord="Variants"
            subtitle="Tinted chips, date badges, and new feature tags"
          />
          <div className="flex flex-wrap items-center gap-3 p-6 rounded-2xl border border-border/80 bg-card shadow-soft">
            <Badge variant="tag-lavender">Cultural</Badge>
            <Badge variant="tag-mint">Outdoor Adventure</Badge>
            <Badge variant="tag-peach">Food & Wine</Badge>
            <Badge variant="new">NEW!</Badge>
            <Badge variant="date">5 Days, 24 Dec 2024</Badge>
            <Badge variant="date-gray">Past Trip</Badge>
            <Badge variant="default">Primary Default</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </section>

        {/* 4. StatTile Component */}
        <section className="space-y-4">
          <SectionHeader
            title="StatTile"
            accentWord="Component"
            subtitle="Right-hand itinerary summary tiles: Budget, Person, Duration"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile
              label="BUDGET"
              value="$2,450"
              subvalue="Estimated total"
              icon={<DollarSign className="size-4" />}
              tone="orange"
            />
            <StatTile
              label="TRAVELERS"
              value="2 Persons"
              subvalue="Couple vacation"
              icon={<Users className="size-4" />}
              tone="mint"
            />
            <StatTile
              label="DURATION"
              value="7 Days"
              subvalue="Dec 24 - Dec 31"
              icon={<Clock className="size-4" />}
              tone="lavender"
            />
            <StatTile
              label="DESTINATION"
              value="Tokyo, Japan"
              subvalue="14 activities planned"
              icon={<MapPinIcon className="size-4" />}
              tone="peach"
            />
          </div>
        </section>

        {/* 5. AvatarGroup & Cards with Hover Lift */}
        <section className="space-y-4">
          <SectionHeader
            title="Cards &"
            accentWord="AvatarGroup"
            subtitle="Rounded-2xl cards with soft shadows, hover lift, and overlapping avatars"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card hoverLift>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="date">7 Days • 15 Jan 2025</Badge>
                  <Button variant="icon-round" size="icon-round-sm">
                    <Heart className="size-3.5" />
                  </Button>
                </div>
                <CardTitle className="text-xl mt-2">Cherry Blossom Tour</CardTitle>
                <CardDescription>Kyoto & Tokyo Highlights</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Experience ancient temples, culinary delights, and bullet trains across Japan.
                </p>
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/70">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-muted-foreground font-semibold uppercase">Travelers</span>
                    <AvatarGroup avatars={SAMPLE_AVATARS} max={3} className="mt-1" />
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-muted-foreground font-semibold uppercase">Est. Budget</span>
                    <p className="text-lg font-bold text-foreground">$3,100</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="soft" className="w-full">
                  Details
                </Button>
              </CardFooter>
            </Card>

            <Card hoverLift>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="tag-mint">AI Suggested</Badge>
                  <Badge variant="tag-peach">Food & Wine</Badge>
                </div>
                <CardTitle className="text-xl mt-2">Amalfi Coastline</CardTitle>
                <CardDescription>Positano & Capri Retreat</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Cliffside villages, Mediterranean sun, and scenic lemon grove paths.
                </p>
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/70">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-muted-foreground font-semibold uppercase">Travelers</span>
                    <AvatarGroup avatars={SAMPLE_AVATARS.slice(1, 4)} max={3} className="mt-1" />
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-muted-foreground font-semibold uppercase">Est. Budget</span>
                    <p className="text-lg font-bold text-foreground">$4,250</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="soft" className="w-full">
                  Details
                </Button>
              </CardFooter>
            </Card>

            <Card hoverLift>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="new">FEATURED</Badge>
                  <Badge variant="tag-lavender">Nordic</Badge>
                </div>
                <CardTitle className="text-xl mt-2">Reykjavik & Glaciers</CardTitle>
                <CardDescription>Iceland Ring Road Adventure</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Geothermal pools, black sand beaches, and the ethereal Northern Lights.
                </p>
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/70">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-muted-foreground font-semibold uppercase">Travelers</span>
                    <AvatarGroup avatars={SAMPLE_AVATARS.slice(0, 2)} max={3} className="mt-1" />
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-muted-foreground font-semibold uppercase">Est. Budget</span>
                    <p className="text-lg font-bold text-foreground">$2,800</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="soft" className="w-full">
                  Details
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* 6. DottedWorldMap Component */}
        <section className="space-y-4">
          <SectionHeader
            title="DottedWorldMap"
            accentWord="Component"
            subtitle="Dot-matrix world map with pulsing emerald pins, country flag icons, and white label cards"
            action={{
              label: "Reset Pins",
              onClick: () => setSelectedPin(null),
            }}
          />
          <Card className="p-4 sm:p-8 bg-card/60 backdrop-blur-sm border border-border/80 overflow-hidden">
            <DottedWorldMap
              pins={SAMPLE_PINS}
              onPinClick={(pin) => setSelectedPin(pin)}
              className="py-4"
            />
            {selectedPin && (
              <div className="mt-4 p-3 rounded-xl bg-primary-soft/80 border border-primary/20 flex items-center justify-between text-sm">
                <span className="font-semibold text-primary-soft-foreground">
                  Selected Destination: {selectedPin.label} ({selectedPin.countryCode})
                </span>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setSelectedPin(null)}
                  className="text-xs text-primary-soft-foreground"
                >
                  Clear
                </Button>
              </div>
            )}
          </Card>
        </section>
      </div>
    </div>
  )
}
