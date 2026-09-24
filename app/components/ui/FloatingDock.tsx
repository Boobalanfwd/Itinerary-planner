"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Menu, Compass, Map, User, Sparkles, X, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

interface FloatingDockProps {
  onPlanTripClick?: () => void
}

export function FloatingDock({ onPlanTripClick }: FloatingDockProps) {
  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeItem, setActiveItem] = useState<string>("menu")

  return (
    <>
      <div className="fixed bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2 z-40 select-none">
        <nav
          aria-label="Floating Navigation Dock"
          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-full bg-card/90 backdrop-blur-2xl border border-border/90 shadow-soft-xl transition-all"
        >
          {/* 1. Menu */}
          <button
            onClick={() => {
              setActiveItem("menu")
              setIsMenuOpen(true)
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
              activeItem === "menu"
                ? "bg-primary-soft text-primary-soft-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
            )}
            aria-label="Open Navigation Menu"
          >
            <Menu className="size-4 shrink-0" />
            <span className="hidden xs:inline">Menu</span>
          </button>

          {/* 2. Explore */}
          <Link
            href="/marketplace"
            onClick={() => setActiveItem("explore")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
              activeItem === "explore"
                ? "bg-primary-soft text-primary-soft-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
            )}
          >
            <Compass className="size-4 shrink-0 text-accent" />
            <span>Explore</span>
          </Link>

          {/* Center Action: Plan my trip (Pill highlight) */}
          <button
            onClick={() => {
              setActiveItem("plan")
              if (onPlanTripClick) {
                onPlanTripClick()
              } else {
                window.scrollTo({ top: 0, behavior: "smooth" })
                document.getElementById("planner-input")?.focus()
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-primary text-primary-foreground hover:bg-primary-hover shadow-soft active:scale-95 transition-all"
          >
            <Sparkles className="size-3.5" />
            <span className="hidden sm:inline">Plan Trip</span>
          </button>

          {/* 3. Itineraries */}
          <a
            href={isAuthenticated ? "/dashboard/itineraries" : "#example-itinerary"}
            onClick={(e) => {
              setActiveItem("itineraries")
              if (!isAuthenticated) {
                e.preventDefault()
                document.getElementById("example-itinerary")?.scrollIntoView({ behavior: "smooth" })
              }
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
              activeItem === "itineraries"
                ? "bg-primary-soft text-primary-soft-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
            )}
          >
            <Map className="size-4 shrink-0" />
            <span>Itineraries</span>
          </a>

          {/* 4. Account */}
          <Link
            href={isAuthenticated ? "/dashboard" : "/auth/signin"}
            onClick={() => setActiveItem("account")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
              activeItem === "account"
                ? "bg-primary-soft text-primary-soft-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
            )}
          >
            <User className="size-4 shrink-0" />
            <span className="hidden xs:inline">
              {isAuthenticated ? "Dashboard" : "Account"}
            </span>
          </Link>
        </nav>
      </div>

      {/* Menu Drawer Sheet */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] p-6">
          <SheetHeader className="text-left mb-6">
            <SheetTitle className="text-2xl font-bold flex items-center gap-2">
              <span className="font-serif-logo">WANDER.AI</span>
              <span className="text-xs font-normal text-muted-foreground">Directory</span>
            </SheetTitle>
            <SheetDescription>
              Quick navigation to all travel studio features and destinations
            </SheetDescription>
          </SheetHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <Link
              href="/dashboard/create"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-between p-4 rounded-2xl border border-border/80 bg-card hover:bg-muted transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center font-bold">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Create New Trip</p>
                  <p className="text-xs text-muted-foreground">Multi-step AI trip wizard</p>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/marketplace"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-between p-4 rounded-2xl border border-border/80 bg-card hover:bg-muted transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-tag-mint text-accent flex items-center justify-center font-bold">
                  <Compass className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Explore Marketplace</p>
                  <p className="text-xs text-muted-foreground">Community-curated itineraries</p>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/dashboard/itineraries"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-between p-4 rounded-2xl border border-border/80 bg-card hover:bg-muted transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-tag-lavender text-tag-lavender-foreground flex items-center justify-center font-bold">
                  <Map className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">My Itineraries</p>
                  <p className="text-xs text-muted-foreground">View and manage saved trips</p>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/pricing"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-between p-4 rounded-2xl border border-border/80 bg-card hover:bg-muted transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-tag-peach text-tag-peach-foreground flex items-center justify-center font-bold">
                  💎
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Pricing & Tiers</p>
                  <p className="text-xs text-muted-foreground">Unlimited itineraries and PRO features</p>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-full"
            >
              Close Menu
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
