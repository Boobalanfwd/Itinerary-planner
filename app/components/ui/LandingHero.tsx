"use client"

import * as React from "react"
import { useState, FormEvent } from "react"
import { motion } from "framer-motion"
import { Sparkles, ArrowRight, Search, Compass, MapPin as MapPinIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DottedWorldMap, MapPin } from "@/components/shared/dotted-world-map"
import { AuthPromptDialog } from "./AuthPromptDialog"

interface LandingHeroProps {
  onGenerate: (prompt: string) => void
  isGenerating: boolean
  isAuthenticated: boolean
  onSeeExample?: () => void
}

const HERO_MAP_PINS: MapPin[] = [
  { lat: 35.6762, lng: 139.6503, label: "Tokyo", countryCode: "JP" },
  { lat: 48.8566, lng: 2.3522, label: "Paris", countryCode: "FR" },
  { lat: 41.9028, lng: 12.4964, label: "Rome", countryCode: "IT" },
  { lat: 40.7128, lng: -74.006, label: "New York", countryCode: "US" },
  { lat: -8.4095, lng: 115.1889, label: "Bali", countryCode: "ID" },
  { lat: -33.8688, lng: 151.2093, label: "Sydney", countryCode: "AU" },
]

export function LandingHero({
  onGenerate,
  isGenerating,
  isAuthenticated,
  onSeeExample,
}: LandingHeroProps) {
  const [inputValue, setInputValue] = useState("")
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null)

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault()
    if (!inputValue.trim()) return

    if (!isAuthenticated) {
      setShowAuthDialog(true)
      return
    }
    onGenerate(inputValue.trim())
  }

  const handleQuickDestination = (query: string) => {
    if (!isAuthenticated) {
      setShowAuthDialog(true)
      return
    }
    setInputValue(query)
    onGenerate(query)
  }

  const handlePinClick = (pin: MapPin) => {
    setSelectedDestination(pin.label)
    setInputValue(`5 days in ${pin.label}`)
  }

  return (
    <section className="relative min-h-[92vh] flex flex-col items-center justify-center pt-28 pb-16 overflow-hidden">
      {/* Decorative Warm Backdrops */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-primary/10 via-accent/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Top Tag */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 mb-6"
        >
          <Badge variant="tag-mint" className="px-3.5 py-1 text-xs">
            <Sparkles className="size-3.5 text-accent mr-1 animate-pulse" />
            AI Travel Studio v3.0 Live
          </Badge>
        </motion.div>

        {/* Big Centered Headline with Emerald Accent and Orange Underline Swoosh */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.12] mb-6"
        >
          Your Dream Journey, <br className="hidden sm:inline" />
          Curated by{" "}
          <span className="relative inline-block text-accent">
            Itinerary Planner
            {/* Hand-drawn Orange SVG Underline Swoosh */}
            <svg
              className="absolute -bottom-2 sm:-bottom-3.5 left-0 w-full overflow-visible pointer-events-none"
              height="16"
              viewBox="0 0 280 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.path
                d="M4 11C60 3 145 2 276 8C210 13 145 13 75 13"
                stroke="#F68B3C"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.1, delay: 0.4, ease: "easeOut" }}
              />
            </svg>
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-9 leading-relaxed"
        >
          Transform travel thoughts into day-by-day, geographically optimized routes.
          Verified sights, local secret dining, real-time budgets, and smart packing in seconds.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-3.5 mb-10"
        >
          <Button
            size="lg"
            variant="primary"
            className="h-12 px-8 text-base shadow-soft font-bold rounded-full group"
            onClick={() => {
              const inputEl = document.getElementById("planner-input")
              if (inputEl) {
                inputEl.focus()
              } else {
                handleSubmit()
              }
            }}
          >
            <span>Plan my trip</span>
            <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="h-12 px-7 text-base font-semibold rounded-full border-border/80 bg-card hover:bg-muted"
            onClick={() => {
              if (onSeeExample) {
                onSeeExample()
              } else {
                document.getElementById("example-itinerary")?.scrollIntoView({ behavior: "smooth" })
              }
            }}
          >
            See an example
          </Button>
        </motion.div>

        {/* Fast Prompt Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="max-w-2xl mx-auto mb-6"
        >
          <form
            onSubmit={handleSubmit}
            className="relative flex items-center bg-card border border-border/90 rounded-full p-2 pl-5 shadow-soft hover:shadow-soft-lg transition-all focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary"
          >
            <Search className="size-5 text-muted-foreground shrink-0" />
            <input
              id="planner-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Where do you want to go? (e.g. 5 days in Tokyo for foodies...)"
              className="w-full bg-transparent border-none text-foreground placeholder:text-muted-foreground focus:outline-none px-3.5 py-2 text-sm sm:text-base font-medium"
            />
            <Button
              type="submit"
              disabled={isGenerating}
              variant="primary"
              size="default"
              className="shrink-0 h-10 px-5 text-sm font-bold rounded-full"
            >
              {isGenerating ? (
                <>
                  <Compass className="size-4 animate-spin mr-1" />
                  <span>Curating...</span>
                </>
              ) : (
                <>
                  <span>Generate</span>
                  <Sparkles className="size-3.5" />
                </>
              )}
            </Button>
          </form>

          {/* Popular Destination Quick Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground/80">Trending:</span>
            {[
              { label: "🇯🇵 Tokyo", query: "5 days in Tokyo, Japan for first-time visitors" },
              { label: "🇫🇷 Paris", query: "4 days in Paris, France with art and bistros" },
              { label: "🇮🇹 Amalfi", query: "6 days in Amalfi Coast, Italy scenic road trip" },
              { label: "🇮🇸 Iceland", query: "7 days in Reykjavik and Golden Circle Iceland" },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleQuickDestination(item.query)}
                className="px-2.5 py-1 rounded-full bg-card hover:bg-muted border border-border/80 text-foreground transition-all hover:scale-105 active:scale-95"
              >
                {item.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Dotted World Map with Location Cards & Pulsing Emerald Dots */}
        <motion.div
          id="destinations"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-8 sm:mt-12 rounded-3xl p-4 sm:p-8 bg-card/60 backdrop-blur-sm border border-border/80 shadow-soft"
        >
          <DottedWorldMap
            pins={HERO_MAP_PINS}
            onPinClick={handlePinClick}
            className="py-2"
          />
          {selectedDestination && (
            <p className="text-xs font-semibold text-primary mt-3">
              Selected: {selectedDestination} — click &quot;Generate&quot; to plan your trip!
            </p>
          )}
        </motion.div>
      </div>

      <AuthPromptDialog
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
      />
    </section>
  )
}
