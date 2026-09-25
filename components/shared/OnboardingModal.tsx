"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  MapPin,
  Calendar,
  Share2,
  FileDown,
  Compass,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Navigation,
  Globe2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOnboarding } from "@/app/hooks/useOnboarding";

interface OnboardingModalProps {
  onStartPlanning?: () => void;
  overrideOpen?: boolean;
  onCloseOverride?: () => void;
}

export function OnboardingModal({
  onStartPlanning,
  overrideOpen,
  onCloseOverride,
}: OnboardingModalProps) {
  const onboarding = useOnboarding();
  const isOpen = overrideOpen !== undefined ? overrideOpen : onboarding.isOpen;

  // Step 1 interactive typewriter simulation
  const [typedPrompt, setTypedPrompt] = useState("");
  const targetPrompt = "Tokyo, Japan • 7 days • Food & Culture • $2,500";

  useEffect(() => {
    if (!isOpen || onboarding.currentStep !== 1) {
      setTypedPrompt("");
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      setTypedPrompt(targetPrompt.slice(0, i));
      i++;
      if (i > targetPrompt.length) {
        clearInterval(interval);
      }
    }, 45);

    return () => clearInterval(interval);
  }, [isOpen, onboarding.currentStep]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === "Escape") {
        if (onCloseOverride) onCloseOverride();
        else onboarding.skipOnboarding();
      } else if (e.key === "ArrowRight") {
        onboarding.nextStep();
      } else if (e.key === "ArrowLeft") {
        onboarding.prevStep();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCloseOverride, onboarding]);

  if (!isOpen) return null;

  const handleFinish = () => {
    if (onStartPlanning) {
      onStartPlanning();
    }
    if (onCloseOverride) {
      onCloseOverride();
    } else {
      onboarding.completeOnboarding();
    }
  };

  const handleSkip = () => {
    if (onCloseOverride) {
      onCloseOverride();
    } else {
      onboarding.skipOnboarding();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleSkip}
          className="fixed inset-0 bg-background/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="relative w-full max-w-xl bg-card border border-border/80 shadow-2xl rounded-3xl overflow-hidden flex flex-col z-10"
        >
          {/* Top Segmented Progress Bar (like stories) */}
          <div className="grid grid-cols-3 gap-1.5 p-4 pb-0">
            {[1, 2, 3].map((step) => {
              const isPast = step < onboarding.currentStep;
              const isCurrent = step === onboarding.currentStep;

              return (
                <div
                  key={step}
                  onClick={() => onboarding.setStep(step)}
                  className="h-1.5 rounded-full cursor-pointer overflow-hidden bg-muted/60 transition-all hover:bg-muted"
                >
                  <motion.div
                    className="h-full bg-primary"
                    initial={false}
                    animate={{
                      width: isPast || isCurrent ? "100%" : "0%",
                      opacity: isCurrent ? 1 : isPast ? 0.7 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              );
            })}
          </div>

          {/* Header Row: Badge & Action Controls */}
          <div className="flex items-center justify-between px-6 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold px-2.5 py-0.5"
              >
                Step {onboarding.currentStep} of {onboarding.totalSteps}
              </Badge>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                Welcome to Wander.AI
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs text-muted-foreground hover:text-foreground font-medium px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Skip Tour
              </button>
              <button
                type="button"
                onClick={handleSkip}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label="Close onboarding modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dynamic Content Slides */}
          <div className="px-6 py-4 flex-1">
            <AnimatePresence mode="wait">
              {/* ── STEP 1: Generate Your First Trip ────────────────────── */}
              {onboarding.currentStep === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mb-2 shadow-sm">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold font-serif text-foreground">
                      Generate Your First Trip in Seconds
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Describe your dream destination in natural language. Our AI plans day-by-day activities, opening hours, local dining, and estimated budgets.
                    </p>
                  </div>

                  {/* Interactive Mock Input Box */}
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                      <Globe2 className="w-3.5 h-3.5 text-primary" />
                      <span>Natural Language Trip Generator</span>
                    </div>

                    <div className="p-3 bg-background rounded-xl border border-primary/30 shadow-inner flex items-center justify-between min-h-[44px]">
                      <span className="text-xs font-mono font-medium text-foreground">
                        {typedPrompt}
                        <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-primary animate-pulse align-middle" />
                      </span>
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0 ml-2" />
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[11px] bg-card px-2.5 py-1 rounded-lg border border-border/60 text-muted-foreground font-medium">
                        🏯 Senso-ji & Asakusa
                      </span>
                      <span className="text-[11px] bg-card px-2.5 py-1 rounded-lg border border-border/60 text-muted-foreground font-medium">
                        🍣 Tsukiji Seafood
                      </span>
                      <span className="text-[11px] bg-card px-2.5 py-1 rounded-lg border border-border/60 text-muted-foreground font-medium">
                        🗼 Shibuya Crossing
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 2: Explore the Interactive Map ─────────────────── */}
              {onboarding.currentStep === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mb-2 shadow-sm">
                      <Compass className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold font-serif text-foreground">
                      Explore the Interactive Route Map
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Visualize every stop geographically with jewel-tone day pins, synchronized road directions, and estimated walking/driving times.
                    </p>
                  </div>

                  {/* Mock Map Preview Graphic */}
                  <div className="relative rounded-2xl overflow-hidden border border-border/80 bg-muted/30 p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pb-1 border-b border-border/50">
                      <div className="flex items-center gap-1.5 font-semibold text-foreground">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span>Paris Culinary & Culture (5 Days)</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                        Live Route
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2.5 bg-background rounded-xl border border-border/60 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
                          <span className="text-[11px] font-bold text-foreground">Day 1: Historic Heart</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">
                          Cafe de Flore → Louvre → Sainte-Chapelle
                        </p>
                      </div>

                      <div className="p-2.5 bg-background rounded-xl border border-border/60 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#6366F1]" />
                          <span className="text-[11px] font-bold text-foreground">Day 2: Montmartre</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">
                          Sacre-Coeur → Moulin Rouge → Bistro
                        </p>
                      </div>
                    </div>

                    <div className="bg-card p-2 rounded-xl border border-border/60 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Navigation className="w-3 h-3 text-emerald-500" />
                        Optimal Transit & Walking Routes
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        12 min avg
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 3: Export & Share Anywhere ─────────────────────── */}
              {onboarding.currentStep === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mb-2 shadow-sm">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold font-serif text-foreground">
                      Export & Share Anywhere
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Take your travel schedules offline or share them with companions in whichever format suits you best.
                    </p>
                  </div>

                  {/* 3 Feature Pills */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div className="p-3 bg-muted/40 rounded-2xl border border-border/80 flex flex-col gap-1.5">
                      <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                        <FileDown className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-foreground">PDF Export</span>
                      <span className="text-[11px] text-muted-foreground leading-tight">
                        Magazine-style itinerary document with budget logs.
                      </span>
                    </div>

                    <div className="p-3 bg-muted/40 rounded-2xl border border-border/80 flex flex-col gap-1.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-foreground">iCal Calendar</span>
                      <span className="text-[11px] text-muted-foreground leading-tight">
                        1-click sync to Google, Apple, and Outlook calendars.
                      </span>
                    </div>

                    <div className="p-3 bg-muted/40 rounded-2xl border border-border/80 flex flex-col gap-1.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <Share2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-foreground">Public Links</span>
                      <span className="text-[11px] text-muted-foreground leading-tight">
                        Instant live sharing with friends & family.
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Navigation Bar */}
          <div className="px-6 py-4 border-t border-border/70 bg-card/60 flex items-center justify-between gap-3">
            <div>
              {onboarding.currentStep > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onboarding.prevStep}
                  className="rounded-xl text-xs font-semibold gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Skip
                </Button>
              )}
            </div>

            <div>
              {onboarding.currentStep < onboarding.totalSteps ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={onboarding.nextStep}
                  className="rounded-xl text-xs font-semibold gap-1.5 px-4 shadow-sm cursor-pointer"
                >
                  <span>
                    {onboarding.currentStep === 1
                      ? "Next: Interactive Map"
                      : "Next: Export & Sharing"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleFinish}
                  className="rounded-xl text-xs font-bold gap-1.5 px-5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Start Planning Now! 🗺️</span>
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default OnboardingModal;
