"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Compass, Sparkles, Map, Sliders, Calendar, ArrowRight } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SectionHeader } from "@/components/ui/section-header"

const STEPS = [
  {
    step: "01",
    title: "Define Style & Budget",
    desc: "Specify your destination, dates, budget tier, travel style, and companions. Choose between relaxed exploration or fast-paced sightseeing.",
    badge: "Instant Setup",
    badgeVariant: "tag-peach" as const,
    icon: Sliders,
  },
  {
    step: "02",
    title: "AI Routes & Schedules",
    desc: "Gemini clusters activities by geographic neighborhood to minimize transit time. Verified coordinates, estimated costs, and dining spots.",
    badge: "Smart Sequencing",
    badgeVariant: "tag-mint" as const,
    icon: Sparkles,
  },
  {
    step: "03",
    title: "Refine, Export & Travel",
    desc: "Drag and drop activities, swap dining recommendations, log group expenses, export to Google Calendar, and travel offline with ease.",
    badge: "Collaborative & Offline",
    badgeVariant: "tag-lavender" as const,
    icon: Map,
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="How It"
          accentWord="Works"
          subtitle="Three simple steps to transform travel inspiration into an organized, stress-free itinerary"
          className="text-center md:text-left"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-10">
          {STEPS.map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
              >
                <Card hoverLift className="h-full relative overflow-hidden bg-card/90">
                  {/* Decorative step number watermark */}
                  <span className="absolute -top-4 -right-2 text-7xl font-extrabold text-foreground/[0.04] pointer-events-none select-none font-sans">
                    {item.step}
                  </span>

                  <CardHeader className="space-y-3 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="size-11 rounded-2xl bg-primary-soft text-primary-soft-foreground flex items-center justify-center font-bold shadow-soft-xs">
                        <Icon className="size-5" />
                      </div>
                      <Badge variant={item.badgeVariant}>{item.badge}</Badge>
                    </div>
                    <CardTitle className="text-xl sm:text-2xl pt-2">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
