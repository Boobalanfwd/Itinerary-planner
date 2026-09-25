"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Sparkles,
  MapPin,
  Clock,
  Navigation,
  CheckCircle2,
  Plane,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface LoadingViewProps {
  progress?: number;
  step?: string;
  destination?: string;
}

const MILESTONES = [
  { threshold: 15, label: "Destination Analysis", icon: MapPin },
  { threshold: 40, label: "AI Route Curation", icon: Sparkles },
  { threshold: 75, label: "Pacing & Schedule", icon: Clock },
  { threshold: 88, label: "Geocoding & Venues", icon: Navigation },
  { threshold: 100, label: "Final Details", icon: CheckCircle2 },
];

const TRAVEL_TIPS = [
  "Did you know? Walking is often the fastest way to discover secret courtyards and authentic family eateries.",
  "AI Tip: Grouping activities by geographic neighborhood saves an average of 45 minutes of transit each day.",
  "Pro Traveler: Keep digital offline copies of your passport and reservations in cloud storage.",
  "Tip: Packing light with coordinated layers allows effortless hopping between historic sites and evening dining.",
  "Wander Fact: Local morning markets provide the best insight into authentic regional cuisine.",
];

export const LoadingView: React.FC<LoadingViewProps> = ({
  progress = 5,
  step = "Contacting AI travel architect...",
  destination,
}) => {
  const [tipIndex, setTipIndex] = useState(0);

  // Rotate tips every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TRAVEL_TIPS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  // Estimate seconds remaining based on progress
  const estimatedSeconds = useMemo(() => {
    if (clampedProgress >= 98) return 1;
    if (clampedProgress >= 88) return 3;
    if (clampedProgress >= 75) return 5;
    if (clampedProgress >= 40) return 8;
    return 12;
  }, [clampedProgress]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground relative overflow-hidden px-4 py-12">
      {/* ── Ambient Radial Glows ───────────────────────────────────────── */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-primary/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col items-center text-center space-y-8">
        {/* ── Central Animated Compass & Rings ─────────────────────────── */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Outer pulsed glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/25"
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Counter-rotating cyan ring */}
          <div className="absolute inset-2 rounded-full border-t-2 border-r-2 border-teal-500/70 animate-[spin_4s_linear_infinite]" />

          {/* Fast spinning primary ring */}
          <div className="absolute inset-4 rounded-full border-b-2 border-l-2 border-primary animate-[spin_2.5s_linear_infinite_reverse]" />

          {/* Compass Icon */}
          <div className="relative w-14 h-14 rounded-2xl bg-card border border-border/80 shadow-soft flex items-center justify-center text-primary backdrop-blur-md">
            <Compass className="w-7 h-7 text-primary animate-[spin_10s_linear_infinite]" />
          </div>

          {/* Floating Sparkle indicator */}
          <motion.div
            className="absolute -top-1 -right-1 p-1 rounded-full bg-primary/20 border border-primary/40 text-primary shadow-xs"
            animate={{ y: [-2, 2, -2] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </motion.div>
        </div>

        {/* ── Header Title & Step Description ─────────────────────────── */}
        <div className="space-y-2 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-1">
            <Plane className="w-3.5 h-3.5" />
            <span>AI Itinerary Generation</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-foreground">
            {destination ? `Crafting ${destination}` : "Architecting Your Trip"}
          </h2>

          {/* Animated live step text */}
          <div className="h-10 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={step}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="text-sm font-medium text-muted-foreground"
              >
                {step}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Progress Bar & Numbers ──────────────────────────────────── */}
        <div className="w-full space-y-2.5">
          <div className="flex items-center justify-between text-xs px-1 font-medium">
            <span className="text-foreground font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              {clampedProgress}% Completed
            </span>
            <span className="text-muted-foreground">
              Est. ~{estimatedSeconds}s remaining
            </span>
          </div>

          {/* Animated Custom Progress Bar */}
          <div className="relative h-3 w-full bg-muted/60 rounded-full overflow-hidden border border-border/60 p-0.5 shadow-inner">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 via-primary to-indigo-500 relative"
              initial={{ width: "5%" }}
              animate={{ width: `${clampedProgress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
            </motion.div>
          </div>
        </div>

        {/* ── Milestone Stages Checklist ──────────────────────────────── */}
        <div className="w-full grid grid-cols-5 gap-1.5 pt-2">
          {MILESTONES.map((m, index) => {
            const isDone = clampedProgress >= m.threshold;
            const isCurrent =
              clampedProgress < m.threshold &&
              (index === 0 || clampedProgress >= MILESTONES[index - 1].threshold);
            const Icon = m.icon;

            return (
              <div
                key={m.label}
                className={`flex flex-col items-center p-2 rounded-xl border transition-all text-[11px] ${
                  isDone
                    ? "bg-primary/10 border-primary/30 text-primary font-semibold shadow-xs"
                    : isCurrent
                    ? "bg-card border-border/80 text-foreground animate-pulse"
                    : "bg-muted/30 border-transparent text-muted-foreground/60"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 mb-1 ${
                    isDone
                      ? "text-primary"
                      : isCurrent
                      ? "text-teal-500"
                      : "text-muted-foreground/50"
                  }`}
                />
                <span className="text-center line-clamp-1 leading-tight">
                  {m.label.split(" ")[0]}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Rotating Pro Travel Tips Callout ─────────────────────────── */}
        <div className="w-full pt-4">
          <div className="p-4 rounded-2xl border border-border/70 bg-card/75 backdrop-blur-md text-xs text-muted-foreground shadow-soft">
            <AnimatePresence mode="wait">
              <motion.p
                key={tipIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
                className="leading-relaxed"
              >
                {TRAVEL_TIPS[tipIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
