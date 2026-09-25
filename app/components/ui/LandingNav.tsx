"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Compass, Menu, X, ArrowRight, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { ViewState } from "../types"

interface LandingNavProps {
  onViewChange?: (view: ViewState) => void
  onExploreClick?: () => void
  onExampleClick?: () => void
}

/**
 * LandingNav — shown only on the public landing page (/).
 *
 * Auth-aware behaviour:
 *   - LOGGED OUT  →  marketing links + "Sign In" + "Get Started" CTA
 *   - LOGGED IN   →  same logo + "Go to Dashboard" CTA (page.tsx redirects
 *                    anyway, so this state is transient)
 */
export function LandingNav({
  onViewChange,
  onExploreClick,
  onExampleClick,
}: LandingNavProps) {
  const { status } = useSession()
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isAuthenticated = status === "authenticated"

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollTo = (id: string) => {
    setIsMobileMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

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
        {/* ── Brand logo ─────────────────────────────────────────────────── */}
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

        {/* ── Desktop: marketing nav links (logged-out only) ─────────────── */}
        {!isAuthenticated && (
          <nav className="hidden md:flex items-center gap-7 pl-10" aria-label="Main navigation">
            <button
              onClick={() => scrollTo("how-it-works")}
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollTo("features")}
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => {
                scrollTo("example-itinerary")
                onExampleClick?.()
              }}
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Sample Trips
            </button>
            <button
              onClick={() => scrollTo("faq")}
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              FAQ
            </button>
          </nav>
        )}

        {/* ── Right-side actions ─────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          {isAuthenticated ? (
            /* Logged-in transient state: take them to dashboard */
            <Link
              href="/dashboard"
              className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-sm hover:bg-primary/90 transition-colors"
            >
              <LayoutDashboard className="size-3.5" />
              Dashboard
            </Link>
          ) : (
            <>
              {/* Sign In link */}
              <Link
                href="/auth/signin"
                className="hidden md:inline-flex items-center px-3.5 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-muted/70 transition-colors"
              >
                Sign In
              </Link>

              {/* Get Started CTA */}
              <Link
                href="/auth/register"
                className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-sm hover:bg-primary/90 transition-colors"
              >
                Get Started
                <ArrowRight className="size-3.5" />
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle Navigation Menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown menu ────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-card/95 backdrop-blur-xl border-b border-border/80 px-6 py-5 shadow-soft-lg animate-in slide-in-from-top-3 flex flex-col gap-4">
          {!isAuthenticated ? (
            <>
              <button
                onClick={() => scrollTo("how-it-works")}
                className="text-base font-semibold text-foreground py-1 text-left cursor-pointer"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollTo("features")}
                className="text-base font-semibold text-foreground py-1 text-left cursor-pointer"
              >
                Features
              </button>
              <button
                onClick={() => {
                  scrollTo("example-itinerary")
                  onExampleClick?.()
                }}
                className="text-base font-semibold text-foreground py-1 text-left cursor-pointer"
              >
                Sample Trips
              </button>
              <button
                onClick={() => scrollTo("faq")}
                className="text-base font-semibold text-foreground py-1 text-left cursor-pointer"
              >
                FAQ
              </button>
              <div className="pt-2 border-t border-border/60 flex flex-col gap-2">
                <Link
                  href="/auth/signin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Get Started Free
                </Link>
              </div>
            </>
          ) : (
            <Link
              href="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 text-base font-semibold text-foreground py-1"
            >
              <LayoutDashboard className="size-4 text-primary" />
              Go to Dashboard
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
