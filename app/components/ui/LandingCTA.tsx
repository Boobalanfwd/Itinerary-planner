"use client"

import * as React from "react"
import Link from "next/link"
import { Sparkles, ArrowRight, Compass } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LandingCTAProps {
  onPlanTripClick?: () => void
}

export function LandingCTA({ onPlanTripClick }: LandingCTAProps) {
  return (
    <section className="py-20 sm:py-28 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden p-8 sm:p-14 border border-border/80 bg-gradient-to-br from-primary-soft/80 via-card to-accent-soft/60 shadow-soft-xl text-center">
          {/* Subtle decorative circles */}
          <div className="absolute -top-16 -left-16 size-48 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 size-48 rounded-full bg-accent/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <div className="inline-flex size-14 rounded-2xl bg-primary text-primary-foreground items-center justify-center shadow-soft mx-auto mb-2">
              <Compass className="size-7" />
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              Ready to Explore the World{" "}
              <span className="text-accent">Without the Stress?</span>
            </h2>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Join thousands of smart travelers who save hours of planning.
              Your dream vacation is only a prompt away.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  if (onPlanTripClick) {
                    onPlanTripClick()
                  } else {
                    window.scrollTo({ top: 0, behavior: "smooth" })
                    document.getElementById("planner-input")?.focus()
                  }
                }}
                className="h-12 px-8 text-base font-bold shadow-soft rounded-full gap-2"
              >
                <span>Plan my trip for free</span>
                <Sparkles className="size-4" />
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 px-7 text-base font-semibold rounded-full border-border/80 bg-card hover:bg-muted"
              >
                <Link href="/marketplace" className="flex items-center gap-2">
                  <span>Browse Community Trips</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
