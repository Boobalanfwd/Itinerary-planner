"use client"

import * as React from "react"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { SectionHeader } from "@/components/ui/section-header"
import { Card } from "@/components/ui/card"

const FAQS = [
  {
    question: "How does the AI itinerary generation work?",
    answer:
      "Wander.AI combines Google Gemini models with verified geographic databases (Mapbox and OpenStreetMap). It analyzes your target destination, pace preference, travel companions, and budget to sequence realistic, non-backtracking day plans with real travel times.",
  },
  {
    question: "Can I customize activities and days after generating?",
    answer:
      "Yes! You have complete freedom to drag-and-drop activities between days, add custom stops, regenerate individual days, log expenses, and swap activities with one click.",
  },
  {
    question: "Can I export my itinerary to Google Calendar or Apple Calendar?",
    answer:
      "Absolutely. Wander.AI provides one-click export for both Apple iCal (.ics) and Google Calendar. Every event includes precise map coordinates, arrival times, and reservation links.",
  },
  {
    question: "How does group planning and sharing work?",
    answer:
      "Every itinerary has a private shareable link. You can send it to friends or family so they can view the schedule and map in real time without needing an account.",
  },
  {
    question: "Is Wander.AI free to use?",
    answer:
      "You can start creating itineraries for free with standard AI recommendations and map features. For power travelers, our PRO plan unlocks unlimited generations, real-time flight tracking, and export features.",
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="py-20 sm:py-28 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Frequently Asked"
          accentWord="Questions"
          subtitle="Everything you need to know about planning trips with Wander.AI"
          className="text-center"
        />

        <Card className="p-6 sm:p-8 mt-8 border border-border/80 bg-card shadow-soft">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b border-border/70 py-1">
                <AccordionTrigger className="text-left font-bold text-foreground hover:no-underline py-4 text-base">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      </div>
    </section>
  )
}
