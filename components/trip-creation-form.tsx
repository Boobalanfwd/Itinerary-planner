"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Compass,
  Clock,
  Heart,
  ArrowRight,
  Check,
  Loader2,
  Utensils,
  Landmark,
  Trees,
  Palette,
  ShoppingBag,
  Wine,
  SunMedium,
  Mountain,
  Camera,
  Layers,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import * as Flags from "country-flag-icons/react/3x2";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AuthPromptDialog } from "@/components/auth/auth-prompt-dialog";

// Preset popular destinations with ISO country codes for SVG flags
const POPULAR_DESTINATIONS = [
  { name: "Tokyo, Japan", code: "JP" },
  { name: "Paris, France", code: "FR" },
  { name: "Rome, Italy", code: "IT" },
  { name: "Bali, Indonesia", code: "ID" },
  { name: "New York, USA", code: "US" },
  { name: "Barcelona, Spain", code: "ES" },
  { name: "Kyoto, Japan", code: "JP" },
  { name: "London, UK", code: "GB" },
  { name: "Swiss Alps, Switzerland", code: "CH" },
];

// Duration presets
const DURATION_PRESETS = [
  { days: 3, label: "3 Days", sub: "Weekend getaway" },
  { days: 5, label: "5 Days", sub: "Highlights tour" },
  { days: 7, label: "7 Days", sub: "1 Full week" },
  { days: 10, label: "10 Days", sub: "In-depth voyage" },
  { days: 14, label: "14 Days", sub: "2 Weeks grand" },
];

// Budget tiers
const BUDGET_TIERS = [
  {
    id: "budget",
    title: "Budget",
    icon: "🎒",
    desc: "Hostels, street food, public transport",
    est: "$50–$100/day",
  },
  {
    id: "moderate",
    title: "Moderate",
    icon: "⚖️",
    desc: "3–4★ hotels, casual dining, standard tours",
    est: "$150–$250/day",
  },
  {
    id: "luxury",
    title: "Luxury",
    icon: "💎",
    desc: "5★ resorts, fine dining, private drivers",
    est: "$400+/day",
  },
];

// Traveler types
const TRAVELER_TYPES = [
  { id: "solo", label: "Solo", icon: "🎒" },
  { id: "couple", label: "Couple", icon: "💑" },
  { id: "family", label: "Family", icon: "👨‍👩‍👧" },
  { id: "friends", label: "Friends", icon: "👥" },
  { id: "business", label: "Business", icon: "💼" },
];

// Interests tags
const INTEREST_TAGS = [
  { id: "Food & Dining", label: "Food & Cuisine", icon: Utensils },
  { id: "History & Culture", label: "History & Culture", icon: Landmark },
  { id: "Nature & Outdoors", label: "Nature & Outdoors", icon: Trees },
  { id: "Art & Museums", label: "Art & Museums", icon: Palette },
  { id: "Nightlife & Bars", label: "Nightlife & Bars", icon: Wine },
  { id: "Shopping", label: "Shopping", icon: ShoppingBag },
  { id: "Relaxation & Spa", label: "Relaxation & Spa", icon: SunMedium },
  { id: "Adventure & Sports", label: "Adventure & Sports", icon: Mountain },
  { id: "Photography", label: "Photography", icon: Camera },
];

// Pace choices
const PACE_OPTIONS = [
  { id: "relaxed", label: "Relaxed", desc: "1–2 stops/day, slow and easy", icon: "☕" },
  { id: "balanced", label: "Balanced", desc: "3–4 stops/day, standard rhythm", icon: "🚶" },
  { id: "packed", label: "Fast-Paced", desc: "5+ stops/day, see everything", icon: "⚡" },
];

export interface TripCreationData {
  destination: string;
  duration: number;
  startDate?: string;
  budgetTier: string;
  customBudget?: string;
  travelerType: string;
  interests: string[];
  pace: string;
  notes?: string;
  prompt?: string;
}

interface TripCreationFormProps {
  onSuccess?: (itineraryId: string) => void;
  className?: string;
}

export function TripCreationForm({ onSuccess, className = "" }: TripCreationFormProps) {
  const router = useRouter();

  // Mode: "structured" (unified all-in-one form) vs "prompt" (free-form AI text)
  const [activeTab, setActiveTab] = useState<"structured" | "prompt">("structured");

  // Form State
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState(5);
  const [customDays, setCustomDays] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [budgetTier, setBudgetTier] = useState("moderate");
  const [customBudget, setCustomBudget] = useState("");
  const [travelerType, setTravelerType] = useState("couple");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "Food & Dining",
    "History & Culture",
  ]);
  const [pace, setPace] = useState("balanced");
  const [notes, setNotes] = useState("");

  // Free-form prompt state
  const [freeformPrompt, setFreeformPrompt] = useState("");

  // Loading & Submission State
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [streamProgress, setStreamProgress] = useState(15);
  const [streamStep, setStreamStep] = useState("Analyzing your destination & travel vibe...");
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingMessages = [
    "Analyzing your destination & travel vibe...",
    "Consulting local highlights and neighborhood flow...",
    "Curating realistic daily schedules & activities...",
    "Formatting your personalized day-by-day itinerary...",
  ];

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSelectDays = (days: number) => {
    setDuration(days);
    setCustomDays("");
  };

  const handleCustomDaysChange = (val: string) => {
    setCustomDays(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0 && num <= 30) {
      setDuration(num);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === "structured") {
      if (!destination.trim()) {
        toast.error("Please enter a destination to explore.");
        return;
      }
      if (duration < 1 || duration > 30) {
        toast.error("Duration must be between 1 and 30 days.");
        return;
      }
    } else {
      if (!freeformPrompt.trim()) {
        toast.error("Please describe your trip request.");
        return;
      }
    }

    setIsGenerating(true);
    setStreamProgress(15);
    setStreamStep("Analyzing your destination & travel vibe...");
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
    }, 2800);

    try {
      let requestPayload: any;

      if (activeTab === "structured") {
        requestPayload = {
          destination: destination.trim(),
          duration,
          budget: budgetTier,
          budgetAmount: customBudget ? parseFloat(customBudget) : undefined,
          travelers: travelerType,
          interests: selectedInterests,
          pace,
          notes: notes.trim(),
          startDate: startDate || undefined,
          async: true,
        };
      } else {
        requestPayload = {
          prompt: freeformPrompt.trim(),
          async: true,
        };
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      if (res.status === 401) {
        clearInterval(stepInterval);
        setIsGenerating(false);
        setShowAuthModal(true);
        toast.info("Please sign in or create an account to save your generated itinerary.");
        return;
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate itinerary.");
      }

      // If async job was created, listen via SSE stream
      if (data.jobId) {
        setStreamProgress(25);
        setStreamStep("Consulting AI travel architect...");

        const eventSource = new EventSource(`/api/jobs/${data.jobId}/stream`);

        eventSource.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.progress) {
              setStreamProgress(payload.progress);
            }
            if (payload.step) {
              setStreamStep(payload.step);
            }

            if (payload.status === "completed") {
              eventSource.close();
              clearInterval(stepInterval);
              setStreamProgress(100);
              toast.success("Itinerary created successfully!");
              const targetId = payload.result?.itineraryId;
              if (onSuccess && targetId) {
                onSuccess(targetId);
              } else if (targetId) {
                router.push(`/itinerary/${targetId}`);
              }
            } else if (payload.status === "failed") {
              eventSource.close();
              clearInterval(stepInterval);
              setIsGenerating(false);
              toast.error(payload.error || "Generation failed. Please try again.");
            }
          } catch {
            // Keep listening
          }
        };

        eventSource.onerror = () => {
          eventSource.close();
          // Fallback polling
          const pollInterval = setInterval(async () => {
            try {
              const pollRes = await fetch(`/api/jobs/${data.jobId}`);
              const pollData = await pollRes.json();
              if (pollData.job?.status === "completed") {
                clearInterval(pollInterval);
                clearInterval(stepInterval);
                setIsGenerating(false);
                const targetId = pollData.job.result?.itineraryId;
                if (targetId) router.push(`/itinerary/${targetId}`);
              } else if (pollData.job?.status === "failed") {
                clearInterval(pollInterval);
                clearInterval(stepInterval);
                setIsGenerating(false);
                toast.error(pollData.job?.error || "Generation failed.");
              }
            } catch {
              clearInterval(pollInterval);
              clearInterval(stepInterval);
              setIsGenerating(false);
            }
          }, 1500);
        };
        return;
      }

      // Synchronous fallback
      clearInterval(stepInterval);
      toast.success("Itinerary created successfully!");

      if (onSuccess && data.data?.id) {
        onSuccess(data.data.id);
      } else if (data.data?.id) {
        router.push(`/itinerary/${data.data.id}`);
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      setIsGenerating(false);
      console.error("[TripCreationForm] Error:", err);
      toast.error(err.message || "An error occurred while generating. Please try again.");
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      {/* Tab Switcher Header */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "structured" | "prompt")}
        className="w-full mb-8"
      >
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border/60">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              AI Travel Architect
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Plan a New Journey
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Custom-tailored routes, verified stops, and local recommendations.
            </p>
          </div>

          <TabsList className="bg-muted/70 p-1 rounded-full border border-border/60">
            <TabsTrigger
              value="structured"
              disabled={isGenerating}
              className="rounded-full text-xs font-semibold px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
            >
              <Layers className="w-3.5 h-3.5 mr-1.5" />
              Guided Form
            </TabsTrigger>
            <TabsTrigger
              value="prompt"
              disabled={isGenerating}
              className="rounded-full text-xs font-semibold px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
            >
              <Compass className="w-3.5 h-3.5 mr-1.5" />
              Free-form AI
            </TabsTrigger>
          </TabsList>
        </div>

        {/* GUIDED STRUCTURED FORM */}
        <TabsContent value="structured">
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* Section 1: Destination */}
            <Card className="rounded-3xl border border-border/80 bg-card/70 backdrop-blur-sm shadow-soft overflow-hidden">
              <CardContent className="p-6 sm:p-7 space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold inline-flex items-center justify-center">
                    1
                  </span>
                  <span className="text-sm font-bold text-foreground">Where would you like to go?</span>
                </div>

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary pointer-events-none flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <Input
                    type="text"
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Tokyo, Japan or Amalfi Coast, Italy"
                    className="text-base py-6 pl-12 pr-12 bg-background/90 border-border/80 rounded-2xl focus-visible:ring-primary focus-visible:border-primary/50 shadow-xs"
                    disabled={isGenerating}
                  />
                  {destination && (
                    <button
                      type="button"
                      onClick={() => setDestination("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted/70 transition-colors"
                      tabIndex={-1}
                      aria-label="Clear destination"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Popular Chips with Country Flags */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2.5 font-medium">Or choose a trending destination:</p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_DESTINATIONS.map((item) => {
                      const FlagComponent = Flags[item.code as keyof typeof Flags];
                      const isSelected = destination === item.name;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setDestination(item.name)}
                          className={`text-xs px-3.5 py-1.5 rounded-full border transition-all flex items-center gap-2 cursor-pointer ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm shadow-primary/25 scale-[1.02]"
                              : "bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground border-border/70 hover:border-primary/40"
                          }`}
                          disabled={isGenerating}
                        >
                          {FlagComponent ? (
                            <span className="w-4 h-3 rounded-[2px] overflow-hidden inline-flex items-center shadow-xs flex-shrink-0">
                              <FlagComponent className="w-full h-full object-cover" />
                            </span>
                          ) : null}
                          <span>{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Duration & Dates */}
            <Card className="rounded-3xl border border-border/80 bg-card/70 backdrop-blur-sm shadow-soft">
              <CardContent className="p-6 sm:p-7 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold inline-flex items-center justify-center">
                      2
                    </span>
                    <span className="text-sm font-bold text-foreground">How long is your trip?</span>
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 font-mono">
                    {duration} {duration === 1 ? "Day" : "Days"} selected
                  </span>
                </div>

                {/* Preset Day Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {DURATION_PRESETS.map((preset) => {
                    const isSelected = duration === preset.days && !customDays;
                    return (
                      <button
                        key={preset.days}
                        type="button"
                        onClick={() => handleSelectDays(preset.days)}
                        disabled={isGenerating}
                        className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-[1.02]"
                            : "bg-background/80 hover:bg-muted/60 text-foreground border-border/70 hover:border-primary/40"
                        }`}
                      >
                        <p className="font-bold text-sm">{preset.label}</p>
                        <p
                          className={`text-[11px] mt-0.5 ${
                            isSelected ? "text-primary-foreground/90 font-medium" : "text-muted-foreground"
                          }`}
                        >
                          {preset.sub}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Days & Start Date Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1.5 block">
                      Custom Number of Days (1–30)
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={customDays}
                      onChange={(e) => handleCustomDaysChange(e.target.value)}
                      placeholder="e.g. 4, 8, 12..."
                      className="bg-background/90 rounded-2xl border-border/80 focus-visible:ring-primary"
                      disabled={isGenerating}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1.5 block">
                      Start Date (Optional)
                    </Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-background/90 rounded-2xl border-border/80 focus-visible:ring-primary"
                      disabled={isGenerating}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Budget & Travel Party */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Budget */}
              <Card className="rounded-3xl border border-border/80 bg-card/70 backdrop-blur-sm shadow-soft">
                <CardContent className="p-6 sm:p-7 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold inline-flex items-center justify-center">
                      3
                    </span>
                    <span className="text-sm font-bold text-foreground">What is your budget style?</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    {BUDGET_TIERS.map((tier) => {
                      const isSelected = budgetTier === tier.id;
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => setBudgetTier(tier.id)}
                          disabled={isGenerating}
                          className={`p-3 rounded-2xl border flex flex-col items-center text-center transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-[1.02]"
                              : "bg-background/80 hover:bg-muted/60 text-foreground border-border/70 hover:border-primary/30"
                          }`}
                        >
                          <span className="text-2xl mb-1">{tier.icon}</span>
                          <span className="font-bold text-xs">{tier.title}</span>
                          <span
                            className={`text-[10px] mt-0.5 font-mono ${
                              isSelected ? "text-primary-foreground/90" : "text-muted-foreground"
                            }`}
                          >
                            {tier.est}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1.5 block">
                      Or specify total budget (USD)
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="e.g. 2500"
                        value={customBudget}
                        onChange={(e) => setCustomBudget(e.target.value)}
                        className="bg-background/90 pl-9 rounded-2xl border-border/80 focus-visible:ring-primary"
                        disabled={isGenerating}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Who is traveling & Pace */}
              <Card className="rounded-3xl border border-border/80 bg-card/70 backdrop-blur-sm shadow-soft">
                <CardContent className="p-6 sm:p-7 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold inline-flex items-center justify-center">
                      4
                    </span>
                    <span className="text-sm font-bold text-foreground">Who is traveling?</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TRAVELER_TYPES.map((type) => {
                      const isSelected = travelerType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setTravelerType(type.id)}
                          disabled={isGenerating}
                          className={`p-2.5 rounded-2xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-sm font-bold"
                              : "bg-background/80 hover:bg-muted/60 text-foreground border-border/70 hover:border-primary/30"
                          }`}
                        >
                          <span className="text-base">{type.icon}</span>
                          <span className="text-xs font-semibold">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2 text-foreground font-semibold text-xs mb-2">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span>Trip Pace</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {PACE_OPTIONS.map((item) => {
                        const isSelected = pace === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setPace(item.id)}
                            disabled={isGenerating}
                            className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary shadow-sm font-bold"
                                : "bg-background/80 hover:bg-muted/60 text-foreground border-border/70 hover:border-primary/30"
                            }`}
                          >
                            <span className="text-base block mb-0.5">{item.icon}</span>
                            <span className="text-xs font-bold block">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section 4: Interests & Experiences */}
            <Card className="rounded-3xl border border-border/80 bg-card/70 backdrop-blur-sm shadow-soft">
              <CardContent className="p-6 sm:p-7 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold inline-flex items-center justify-center">
                      5
                    </span>
                    <span className="text-sm font-bold text-foreground">What experiences interest you?</span>
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    {selectedInterests.length} selected
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {INTEREST_TAGS.map((tag) => {
                    const isSelected = selectedInterests.includes(tag.id);
                    const Icon = tag.icon;
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleInterest(tag.id)}
                        disabled={isGenerating}
                        className={`p-3 rounded-2xl border flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.01]"
                            : "bg-background/80 hover:bg-muted/60 text-foreground border-border/70 hover:border-primary/30"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-xl flex-shrink-0 ${
                            isSelected
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold flex-1 truncate">{tag.label}</span>
                        {isSelected && <Check className="w-4 h-4 ml-auto text-primary-foreground flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Section 5: Specific Requests & Notes */}
            <Card className="rounded-3xl border border-border/80 bg-card/70 backdrop-blur-sm shadow-soft">
              <CardContent className="p-6 sm:p-7 space-y-3">
                <Label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold inline-flex items-center justify-center">
                    6
                  </span>
                  <span>Specific requests or dietary requirements (Optional)</span>
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Vegetarian food options, must visit teamLab Planets, traveling with a 4-year-old, avoid steep stairs..."
                  rows={3}
                  className="bg-background/90 rounded-2xl border-border/80 focus-visible:ring-primary resize-none"
                  disabled={isGenerating}
                />
              </CardContent>
            </Card>

            {/* Generate Action Button */}
            <Button
              type="submit"
              size="lg"
              disabled={isGenerating || !destination.trim()}
              className="w-full py-7 text-base font-bold rounded-full bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg shadow-primary/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-3"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating Your Custom Itinerary...</span>
                </>
              ) : (
                <>
                  <span>Generate Complete Itinerary</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>
        </TabsContent>

        {/* FREE-FORM PROMPT TAB */}
        <TabsContent value="prompt">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="rounded-3xl border border-border/80 bg-card/70 backdrop-blur-sm shadow-soft">
              <CardContent className="p-6 sm:p-7 space-y-4">
                <Label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Compass className="w-4 h-4 text-primary" />
                  <span>Describe your dream trip in your own words</span>
                </Label>

                <div className="relative">
                  <Textarea
                    value={freeformPrompt}
                    onChange={(e) => setFreeformPrompt(e.target.value)}
                    placeholder="Describe your ideal vacation (e.g. '7 days in Tokyo and Kyoto for a couple with a $3,000 budget, interested in matcha, old temples, and ramen spots')..."
                    rows={6}
                    className="bg-background/90 rounded-2xl border-border/80 text-base p-4 resize-none focus-visible:ring-primary"
                    disabled={isGenerating}
                  />
                  <div className="text-right text-xs text-muted-foreground font-mono mt-1">
                    {freeformPrompt.length}/600 chars
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2.5 font-medium">Or try an example prompt:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {[
                      "7 days in Tokyo, Japan with $2000 budget, focusing on anime, tech, and street food",
                      "5 days romantic getaway in Paris and Versailles with Michelin-starred dining",
                      "10 days outdoor adventure in Iceland along the Ring Road with hot springs",
                      "4 days architectural and cultural tour of Rome and Vatican City",
                    ].map((example, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFreeformPrompt(example)}
                        className="text-left text-xs p-3.5 rounded-2xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 hover:border-primary/40 transition-all cursor-pointer"
                        disabled={isGenerating}
                      >
                        "{example}"
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              size="lg"
              disabled={isGenerating || !freeformPrompt.trim()}
              className="w-full py-7 text-base font-bold rounded-full bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg shadow-primary/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-3"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating Itinerary...</span>
                </>
              ) : (
                <>
                  <span>Generate from Prompt</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      {/* Loading Overlay Modal */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <div className="bg-card border border-border/80 p-8 sm:p-10 rounded-3xl max-w-md w-full text-center shadow-2xl space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-3xl bg-primary/20 animate-ping opacity-60" />
                <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/30">
                  <Compass className="w-10 h-10 text-primary-foreground animate-spin [animation-duration:6s]" />
                </div>
              </div>

              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20">
                  <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                  AI Travel Architect At Work
                </span>
                <h3 className="text-xl font-extrabold text-foreground tracking-tight">
                  Crafting Your Itinerary
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground min-h-[2.5rem] transition-all">
                  {streamStep || loadingMessages[loadingStep]}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground font-semibold font-mono">
                  <span>Progress</span>
                  <span className="text-primary font-bold">{streamProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden p-0.5 border border-border/60">
                  <div
                    className="bg-gradient-to-r from-primary via-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out shadow-xs"
                    style={{ width: `${streamProgress}%` }}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground italic">
                Wander.AI checks realistic travel times, neighborhoods, and meal breaks.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guest Mode Conversion Modal */}
      <AuthPromptDialog
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        title="Sign in to create your itinerary"
        description="Save this trip to your account, customize routes, and access your itinerary anytime on any device."
        callbackUrl="/dashboard/create"
      />
    </div>
  );
}
export default TripCreationForm;
