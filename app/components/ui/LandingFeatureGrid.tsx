"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Compass, CloudSun, DollarSign, CalendarCheck, MapPin, Share2 } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SectionHeader } from "@/components/ui/section-header"

const FEATURES = [
  {
    icon: Compass,
    title: "Geocoded Non-Stop Routing",
    description: "Every activity is verified on OpenStreetMap and Mapbox. Sights and dining are logically sequenced so you never waste hours crossing the city twice.",
    tag: "Smart Engine",
    tagVariant: "tag-mint" as const,
  },
  {
    icon: CloudSun,
    title: "Dynamic Weather Adaptation",
    description: "Real-time weather forecasts monitor your destination. Seamlessly substitute rainy days with world-class museums, covered markets, and indoor experiences.",
    tag: "Live Forecasts",
    tagVariant: "tag-peach" as const,
  },
  {
    icon: DollarSign,
    title: "Budget Balancing & Expense Logs",
    description: "Track accommodation, transport, meals, and tickets in your preferred currency. Know your estimated daily spend before you ever book a flight.",
    tag: "Budget Guard",
    tagVariant: "tag-lavender" as const,
  },
  {
    icon: CalendarCheck,
    title: "One-Click Calendar Export",
    description: "Synchronize your complete itinerary directly with Apple Calendar or Google Calendar. Every event includes precise coordinates and reservation links.",
    tag: "iCal & GCal",
    tagVariant: "date" as const,
  },
]

export function LandingFeatureGrid() {
  return (
    <section id="features" className="py-16 sm:py-24 relative bg-card/40 border-y border-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Built for"
          accentWord="Effortless Travel"
          subtitle="Everything you need to discover, organize, and experience the world without the hassle of spreadsheets"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          {FEATURES.map((feat, idx) => {
            const Icon = feat.icon
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card hoverLift className="h-full bg-card p-2 sm:p-4">
                  <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                    <div className="size-12 rounded-2xl bg-primary-soft text-primary-soft-foreground flex items-center justify-center shadow-soft-xs">
                      <Icon className="size-6" />
                    </div>
                    <Badge variant={feat.tagVariant}>{feat.tag}</Badge>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <CardTitle className="text-xl font-bold mb-2">
                      {feat.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feat.description}
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
