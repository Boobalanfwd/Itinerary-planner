"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Compass, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { ViewState } from "../types"

interface LandingNavProps {
  onViewChange?: (view: ViewState) => void
  onExploreClick?: () => void
  onExampleClick?: () => void
}

export function LandingNav({
  onViewChange,
  onExploreClick,
  onExampleClick,
}: LandingNavProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
        isScrolled
          ? "bg-background/85 backdrop-blur-md border-b border-border/80 py-3 shadow-soft-xs"
          : "bg-transparent py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Brand Logo in Small-Caps Serif */}
        <div
          onClick={() => {
            onViewChange?.("landing")
            window.scrollTo({ top: 0, behavior: "smooth" })
          }}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="size-9 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-soft group-hover:scale-105 transition-transform">
            <Compass className="size-5 fill-current" />
          </div>
          <span className="font-serif-logo text-2xl tracking-wider text-foreground font-bold">
            WANDER.AI
          </span>
        </div>

        {/* Center: Desktop Navigation Links (Destinations, Itineraries, Activities) */}
        <nav className="hidden md:flex items-center gap-8 pl-12">
          <a
            href="#destinations"
            onClick={(e) => {
              e.preventDefault()
              const el = document.getElementById("destinations")
              el?.scrollIntoView({ behavior: "smooth" })
            }}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Destinations
          </a>
          <a
            href="#itineraries"
            onClick={(e) => {
              e.preventDefault()
              const el = document.getElementById("example-itinerary")
              el?.scrollIntoView({ behavior: "smooth" })
              onExampleClick?.()
            }}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Itineraries
          </a>
          <Link
            href="/marketplace"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Activities
          </Link>
          <a
            href="#how-it-works"
            onClick={(e) => {
              e.preventDefault()
              const el = document.getElementById("how-it-works")
              el?.scrollIntoView({ behavior: "smooth" })
            }}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            How It Works
          </a>
          <a
            href="#faq"
            onClick={(e) => {
              e.preventDefault()
              const el = document.getElementById("faq")
              el?.scrollIntoView({ behavior: "smooth" })
            }}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            FAQ
          </a>
        </nav>

        {/* Right side spacer to avoid overlapping the orange CornerTab */}
        <div className="flex items-center gap-3 pr-28 sm:pr-36">
          <ThemeToggle />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-card/95 backdrop-blur-xl border-b border-border/80 px-6 py-5 shadow-soft-lg animate-in slide-in-from-top-3 flex flex-col gap-4">
          <a
            href="#destinations"
            onClick={() => {
              setIsMobileMenuOpen(false)
              document.getElementById("destinations")?.scrollIntoView({ behavior: "smooth" })
            }}
            className="text-base font-semibold text-foreground py-1"
          >
            Destinations
          </a>
          <a
            href="#example-itinerary"
            onClick={() => {
              setIsMobileMenuOpen(false)
              document.getElementById("example-itinerary")?.scrollIntoView({ behavior: "smooth" })
            }}
            className="text-base font-semibold text-foreground py-1"
          >
            Itineraries
          </a>
          <Link
            href="/marketplace"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-base font-semibold text-foreground py-1"
          >
            Activities & Explore
          </Link>
          <a
            href="#how-it-works"
            onClick={() => {
              setIsMobileMenuOpen(false)
              document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
            }}
            className="text-base font-semibold text-foreground py-1"
          >
            How It Works
          </a>
          <a
            href="#faq"
            onClick={() => {
              setIsMobileMenuOpen(false)
              document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" })
            }}
            className="text-base font-semibold text-foreground py-1"
          >
            FAQ
          </a>
        </div>
      )}
    </header>
  )
}
