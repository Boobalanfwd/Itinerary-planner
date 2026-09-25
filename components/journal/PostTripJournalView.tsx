"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Sparkles,
  Camera,
  MapPin,
  Calendar,
  Share2,
  Sliders,
  Download,
  Plus,
  Play,
  Mic,
  Smile,
  Compass,
  FileText,
  Eye,
  Check,
  Edit2,
  Lock,
  Globe,
  Users,
  Clock,
  ChevronRight,
  Route as RouteIcon,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import dynamic from "next/dynamic";

// Dynamic Mapbox map for interactive journal pins
const DynamicMapboxMap = dynamic(
  () => import("./JournalMapboxMap").then((mod) => mod.JournalMapboxMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-96 bg-muted/40 rounded-2xl flex items-center justify-center text-xs text-muted-foreground animate-pulse">
        Loading Interactive Mapbox Map...
      </div>
    ),
  }
);

interface PostTripJournalViewProps {
  tripId: string;
  trip: any;
  currentUser: any;
  isCollaborator?: boolean;
}

export function PostTripJournalView({
  tripId,
  trip,
  currentUser,
  isCollaborator = true,
}: PostTripJournalViewProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "timeline" | "map" | "book">("summary");

  // Summary State
  const [summary, setSummary] = useState<any>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [selectedTone, setSelectedTone] = useState<"sentimental" | "adventurous" | "funny" | "concise">("sentimental");
  const [optInLocation, setOptInLocation] = useState(false);
  const [isEditingNarrative, setIsEditingNarrative] = useState(false);
  const [editedNarrative, setEditedNarrative] = useState("");

  // Timeline & Entries State
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | "ALL">("ALL");
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);

  // New Entry Form State
  const [newEntryTitle, setNewEntryTitle] = useState("");
  const [newEntryNotes, setNewEntryNotes] = useState("");
  const [newEntryDay, setNewEntryDay] = useState(1);
  const [newEntryMood, setNewEntryMood] = useState("adventurous");
  const [newEntryMediaType, setNewEntryMediaType] = useState<"photo" | "voice" | "text">("photo");
  const [newEntryPhotos, setNewEntryPhotos] = useState<string>("");
  const [newEntryLocationName, setNewEntryLocationName] = useState("");
  const [newEntryLat, setNewEntryLat] = useState("");
  const [newEntryLng, setNewEntryLng] = useState("");

  // Memory Book State
  const [memoryBook, setMemoryBook] = useState<any>(null);
  const [bookLayout, setBookLayout] = useState<"magazine" | "grid" | "scrapbook">("magazine");
  const [bookVisibility, setBookVisibility] = useState<"public" | "collaborators" | "private">("collaborators");
  const [customCaptions, setCustomCaptions] = useState<Record<string, string>>({});
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Load summary and entries
  const loadSummary = async () => {
    try {
      const res = await fetch(`/api/journals/summary?tripId=${tripId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.summary) {
          setSummary(data.summary);
          setEditedNarrative(data.summary.narrative || "");
          if (data.summary.tone) setSelectedTone(data.summary.tone);
        }
      }
    } catch (e) {
      console.error("Error loading summary:", e);
    }
  };

  const loadEntries = async () => {
    try {
      setIsLoadingEntries(true);
      const res = await fetch(`/api/journals?tripId=${tripId}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (e) {
      console.error("Error loading journal entries:", e);
    } finally {
      setIsLoadingEntries(false);
    }
  };

  const loadMemoryBook = async () => {
    try {
      const res = await fetch(`/api/memory-books?tripId=${tripId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.memoryBook) {
          setMemoryBook(data.memoryBook);
          setBookLayout(data.memoryBook.layoutTemplate || "magazine");
          setBookVisibility(data.memoryBook.visibility || "collaborators");
          if (data.memoryBook.customCaptions) setCustomCaptions(data.memoryBook.customCaptions);
        }
      }
    } catch (e) {
      console.error("Error loading memory book:", e);
    }
  };

  useEffect(() => {
    loadSummary();
    loadEntries();
    loadMemoryBook();
  }, [tripId]);

  // Generate / Regenerate AI Summary
  const handleGenerateSummary = async (tone = selectedTone) => {
    try {
      setIsGeneratingSummary(true);
      const res = await fetch("/api/journals/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          tone,
          optInLocationHistory: optInLocation,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setEditedNarrative(data.summary.narrative || "");
        toast.success(`Generated ${tone} narrative summary!`);
      }
    } catch {
      toast.error("Failed to generate summary");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Save manual summary edits
  const handleSaveNarrativeEdit = async () => {
    if (!summary?.id) return;
    try {
      const res = await fetch("/api/journals/summary", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summaryId: summary.id,
          narrative: editedNarrative,
          tone: selectedTone,
        }),
      });
      if (res.ok) {
        toast.success("Summary saved!");
        setIsEditingNarrative(false);
        loadSummary();
      }
    } catch {
      toast.error("Failed to save edits");
    }
  };

  // Add new journal entry
  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntryNotes.trim()) {
      toast.error("Please add a note or story");
      return;
    }

    const photoList = newEntryPhotos
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          dayNumber: newEntryDay,
          title: newEntryTitle.trim() || undefined,
          notes: newEntryNotes.trim(),
          mood: newEntryMood,
          mediaType: newEntryMediaType,
          photos: photoList,
          locationName: newEntryLocationName.trim() || undefined,
          locationLat: newEntryLat ? parseFloat(newEntryLat) : undefined,
          locationLng: newEntryLng ? parseFloat(newEntryLng) : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Memory saved to timeline!");
        setIsAddEntryOpen(false);
        // Reset
        setNewEntryTitle("");
        setNewEntryNotes("");
        setNewEntryPhotos("");
        setNewEntryLocationName("");
        setNewEntryLat("");
        setNewEntryLng("");
        loadEntries();
      }
    } catch {
      toast.error("Failed to add entry");
    }
  };

  // Save Memory Book Customizations
  const handleSaveMemoryBook = async () => {
    try {
      const res = await fetch("/api/memory-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          layoutTemplate: bookLayout,
          visibility: bookVisibility,
          customCaptions,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMemoryBook(data.memoryBook);
        toast.success("Memory Book settings saved!");
      }
    } catch {
      toast.error("Failed to save memory book");
    }
  };

  const copyMemoryBookLink = () => {
    if (!memoryBook?.shareToken) return;
    const url = `${window.location.origin}/memory-book/${memoryBook.shareToken}`;
    navigator.clipboard.writeText(url);
    setCopiedShareLink(true);
    toast.success("Shareable Memory Book link copied!");
    setTimeout(() => setCopiedShareLink(false), 2500);
  };

  const filteredEntries =
    selectedDayFilter === "ALL"
      ? entries
      : entries.filter((e) => e.dayNumber === selectedDayFilter);

  const totalDays = trip?.duration || trip?.days?.length || 3;

  return (
    <div className="space-y-6">
      {/* Navigation Pillar 2 Tabs */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-2xl border">
          <button
            onClick={() => setActiveTab("summary")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === "summary"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nostalgic Summary</span>
          </button>

          <button
            onClick={() => setActiveTab("timeline")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === "timeline"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Visual Timeline ({entries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("map")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === "map"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Memory Map</span>
          </button>

          <button
            onClick={() => setActiveTab("book")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === "book"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Memory Book</span>
          </button>
        </div>

        {/* Action Button */}
        {activeTab === "timeline" && (
          <Button
            size="sm"
            onClick={() => setIsAddEntryOpen(true)}
            className="rounded-xl text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Memory Note
          </Button>
        )}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: NOSTALGIC SUMMARY */}
      {/* ======================================================== */}
      {activeTab === "summary" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Hero Banner with Stats */}
          <div className="relative rounded-3xl overflow-hidden bg-card border shadow-lg p-6 sm:p-8">
            <div className="relative z-10 max-w-2xl">
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                Post-Trip Memory Journal
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-black text-foreground mt-3">
                {trip?.title || `${trip?.destination} Memories`}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                An auto-crafted storytelling journal reflecting on moments, miles, and shared smiles.
              </p>

              {/* Stats Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <span className="text-xl font-black text-amber-600 dark:text-amber-400 block">
                    {summary?.stats?.distanceKm || 185} km
                  </span>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Distance Explored
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-center">
                  <span className="text-xl font-black text-orange-600 dark:text-orange-400 block">
                    {summary?.stats?.placesVisited || 12}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Places Visited
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <span className="text-xl font-black text-amber-600 dark:text-amber-400 block">
                    {summary?.stats?.daysAway || totalDays}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Days Together
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-center">
                  <span className="text-xl font-black text-orange-600 dark:text-orange-400 block">
                    {entries.reduce((acc, e) => acc + (e.photos?.length || 0), 0) || 16}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Photos & Notes
                  </span>
                </div>
              </div>
            </div>

            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-1/3 h-full opacity-15 pointer-events-none bg-gradient-to-l from-amber-500 to-transparent" />
          </div>

          {/* Tone Selector & AI Regeneration Toolbar */}
          <div className="p-4 rounded-2xl bg-card border shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Narrative Tone:
              </span>
              <div className="flex gap-1">
                {(["sentimental", "adventurous", "funny", "concise"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setSelectedTone(t);
                      handleGenerateSummary(t);
                    }}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all",
                      selectedTone === t
                        ? "bg-amber-500 text-white shadow-sm"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Privacy Opt-in for Location History */}
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={optInLocation}
                  onChange={(e) => setOptInLocation(e.target.checked)}
                  className="rounded border-amber-500 text-amber-500 focus:ring-amber-500"
                />
                <span>Include device location history</span>
              </label>

              <Button
                size="sm"
                onClick={() => handleGenerateSummary(selectedTone)}
                disabled={isGeneratingSummary}
                className="h-8 text-xs rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
              >
                <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", isGeneratingSummary && "animate-spin")} />
                {isGeneratingSummary ? "Writing Story..." : "Regenerate Draft"}
              </Button>
            </div>
          </div>

          {/* "On This Day" Resurfacing Widget */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/25 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">
                  ✨ "On This Day" Flashback
                </span>
                <p className="text-xs text-foreground font-medium">
                  {new Date().toLocaleDateString([], { month: "long", day: "numeric" })} — Remembering the cobblestone alleys and laughter in {trip?.destination}.
                </p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground font-semibold">1 Year Ago</span>
          </div>

          {/* Narrative Story Draft (Editable) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-card border shadow-md space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                  The Travel Memoir
                </h3>
                {summary?.aiGenerated && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-semibold border border-amber-500/20">
                    AI Story Draft
                  </span>
                )}
              </div>

              {!isEditingNarrative ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingNarrative(true)}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                  Edit Narrative
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingNarrative(false)}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveNarrativeEdit}
                    className="h-7 text-xs bg-amber-500 text-white rounded-lg"
                  >
                    Save Changes
                  </Button>
                </div>
              )}
            </div>

            {isEditingNarrative ? (
              <textarea
                value={editedNarrative}
                onChange={(e) => setEditedNarrative(e.target.value)}
                rows={8}
                className="w-full p-4 rounded-2xl bg-background border text-sm text-foreground focus:ring-amber-500 outline-none leading-relaxed"
              />
            ) : (
              <div className="prose dark:prose-invert max-w-none text-sm text-foreground/90 leading-relaxed font-sans whitespace-pre-line">
                {summary?.narrative || (
                  <div className="text-center py-8 text-muted-foreground">
                    Click "Regenerate Draft" above to generate your trip's nostalgic story!
                  </div>
                )}
              </div>
            )}

            {/* Standout Highlights */}
            {summary?.highlights && summary.highlights.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Trip Standout Highlights
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {summary.highlights.map((h: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-foreground">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Standout Moments Cards */}
          {summary?.standoutMoments && summary.standoutMoments.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Unforgettable Moments
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {summary.standoutMoments.map((moment: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-card border border-border/70 shadow-sm hover:border-amber-500/40 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs mb-3">
                      0{idx + 1}
                    </div>
                    <h4 className="font-bold text-foreground text-sm">{moment.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                      {moment.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: VISUAL TIMELINE */}
      {/* ======================================================== */}
      {activeTab === "timeline" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Day Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedDayFilter("ALL")}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all",
                selectedDayFilter === "ALL"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              All Days ({entries.length})
            </button>
            {Array.from({ length: totalDays }, (_, i) => i + 1).map((dayNum) => (
              <button
                key={dayNum}
                onClick={() => setSelectedDayFilter(dayNum)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all",
                  selectedDayFilter === dayNum
                    ? "bg-amber-500 text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                Day {dayNum}
              </button>
            ))}
          </div>

          {/* Timeline Feed */}
          {isLoadingEntries ? (
            <div className="text-center py-12 text-xs text-muted-foreground">Loading timeline memories...</div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-16 px-4 bg-muted/20 rounded-3xl border border-dashed border-border/80">
              <Camera className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-bold text-foreground">No photos or notes added yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Capture the trip by clicking "Add Memory Note" to upload photos, quotes, voice notes, or visited pins!
              </p>
              <Button
                size="sm"
                onClick={() => setIsAddEntryOpen(true)}
                className="mt-4 rounded-xl text-xs bg-amber-500 text-white"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Your First Memory
              </Button>
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 border-l-2 border-amber-500/30 space-y-8">
              {filteredEntries.map((entry, idx) => (
                <div key={entry.id} className="relative group">
                  {/* Timeline node */}
                  <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md">
                    <Camera className="w-3 h-3" />
                  </div>

                  {/* Entry Card */}
                  <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-amber-500/40 transition-all">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300">
                          Day {entry.dayNumber || 1}
                        </span>
                        {entry.mood && (
                          <span className="text-[10px] font-semibold text-muted-foreground capitalize">
                            Mood: {entry.mood}
                          </span>
                        )}
                        {entry.locationName && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-500" />
                            {entry.locationName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <img
                          src={
                            entry.author?.image ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.authorId}`
                          }
                          alt=""
                          className="w-4 h-4 rounded-full border"
                        />
                        <span>{entry.author?.name || "Traveler"}</span>
                      </div>
                    </div>

                    {/* Entry Title & Story */}
                    {entry.title && (
                      <h4 className="text-sm font-bold text-foreground mb-1">{entry.title}</h4>
                    )}
                    <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line mb-3">
                      {entry.notes}
                    </p>

                    {/* Photo Grid */}
                    {entry.photos && entry.photos.length > 0 && (
                      <div
                        className={cn(
                          "grid gap-2 mt-3",
                          entry.photos.length === 1
                            ? "grid-cols-1"
                            : entry.photos.length === 2
                            ? "grid-cols-2"
                            : "grid-cols-2 sm:grid-cols-3"
                        )}
                      >
                        {entry.photos.map((photo: string, pIdx: number) => (
                          <div
                            key={pIdx}
                            className="relative overflow-hidden rounded-xl border aspect-video bg-muted group/photo"
                          >
                            <img
                              src={photo}
                              alt="travel memory"
                              className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Memory Modal */}
          {isAddEntryOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-card w-full max-w-lg rounded-2xl border shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-base font-bold text-foreground">Add Travel Memory</h3>
                  <button onClick={() => setIsAddEntryOpen(false)} className="text-muted-foreground hover:text-foreground">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddEntry} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Day</label>
                      <select
                        value={newEntryDay}
                        onChange={(e) => setNewEntryDay(parseInt(e.target.value, 10))}
                        className="w-full h-9 rounded-xl bg-background border px-3 text-xs"
                      >
                        {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>
                            Day {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Mood / Vibe</label>
                      <select
                        value={newEntryMood}
                        onChange={(e) => setNewEntryMood(e.target.value)}
                        className="w-full h-9 rounded-xl bg-background border px-3 text-xs capitalize"
                      >
                        <option value="adventurous">Adventurous ⛰️</option>
                        <option value="relaxed">Relaxed ☕</option>
                        <option value="romantic">Romantic 🌅</option>
                        <option value="thrilled">Thrilled 🎉</option>
                        <option value="nostalgic">Nostalgic ✨</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Title (Optional)</label>
                    <Input
                      placeholder="e.g. Sunset at the cliffs"
                      value={newEntryTitle}
                      onChange={(e) => setNewEntryTitle(e.target.value)}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Story & Memory Notes</label>
                    <textarea
                      placeholder="What was the highlight? What did it taste like, smell like, sound like?"
                      value={newEntryNotes}
                      onChange={(e) => setNewEntryNotes(e.target.value)}
                      rows={3}
                      className="w-full p-2.5 rounded-xl bg-background border text-xs outline-none focus:ring-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Photo URLs (Comma-separated)
                    </label>
                    <Input
                      placeholder="https://images.unsplash.com/..., https://..."
                      value={newEntryPhotos}
                      onChange={(e) => setNewEntryPhotos(e.target.value)}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Location Name</label>
                      <Input
                        placeholder="Cliffside Cafe"
                        value={newEntryLocationName}
                        onChange={(e) => setNewEntryLocationName(e.target.value)}
                        className="h-8 text-xs rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Latitude</label>
                      <Input
                        placeholder="e.g. 14.5995"
                        value={newEntryLat}
                        onChange={(e) => setNewEntryLat(e.target.value)}
                        className="h-8 text-xs rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Longitude</label>
                      <Input
                        placeholder="e.g. 120.9842"
                        value={newEntryLng}
                        onChange={(e) => setNewEntryLng(e.target.value)}
                        className="h-8 text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setIsAddEntryOpen(false)} className="text-xs">
                      Cancel
                    </Button>
                    <Button type="submit" className="text-xs bg-amber-500 hover:bg-amber-600 text-white rounded-xl">
                      Save Memory
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: INTERACTIVE MEMORY MAP */}
      {/* ======================================================== */}
      {activeTab === "map" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Interactive Memory Map</h3>
              <p className="text-xs text-muted-foreground">
                Pins represent your visited places with linked photos and stories.
              </p>
            </div>

            {/* Day Filter Slider / Buttons */}
            <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl">
              <span className="text-[11px] font-bold text-muted-foreground px-2">Filter Day:</span>
              <button
                onClick={() => setSelectedDayFilter("ALL")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold",
                  selectedDayFilter === "ALL" ? "bg-amber-500 text-white" : "text-muted-foreground"
                )}
              >
                All
              </button>
              {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDayFilter(d)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold",
                    selectedDayFilter === d ? "bg-amber-500 text-white" : "text-muted-foreground"
                  )}
                >
                  D{d}
                </button>
              ))}
            </div>
          </div>

          {/* Mapbox Map with Journal Pins & Route */}
          <div className="rounded-3xl overflow-hidden border shadow-lg bg-card">
            <DynamicMapboxMap
              entries={filteredEntries}
              destination={trip?.destination}
              showRouteLine={true}
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: SHAREABLE MEMORY BOOK STUDIO */}
      {/* ======================================================== */}
      {activeTab === "book" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Customization Toolbar */}
          <div className="p-5 rounded-2xl bg-card border shadow-sm flex flex-wrap items-center justify-between gap-4">
            {/* Layout Template Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Layout:
              </span>
              <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
                {(["magazine", "grid", "scrapbook"] as const).map((tmpl) => (
                  <button
                    key={tmpl}
                    onClick={() => {
                      setBookLayout(tmpl);
                      handleSaveMemoryBook();
                    }}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all",
                      bookLayout === tmpl
                        ? "bg-amber-500 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tmpl}
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy Controls */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Privacy:
              </span>
              <select
                value={bookVisibility}
                onChange={(e) => {
                  setBookVisibility(e.target.value as any);
                  handleSaveMemoryBook();
                }}
                className="h-8 rounded-lg bg-background border px-2.5 text-xs text-foreground outline-none"
              >
                <option value="collaborators">Collaborators Only 👥</option>
                <option value="public">Public (Anyone with link) 🌍</option>
                <option value="private">Private (Only me) 🔒</option>
              </select>
            </div>

            {/* Share & Export */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={copyMemoryBookLink}
                className="h-8 text-xs rounded-xl border-amber-500/40 text-amber-700 dark:text-amber-400"
              >
                {copiedShareLink ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5 mr-1" />}
                {copiedShareLink ? "Link Copied" : "Share Book Link"}
              </Button>

              <Button
                size="sm"
                onClick={() => window.print()}
                className="h-8 text-xs rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Export / Print
              </Button>
            </div>
          </div>

          {/* Memory Book Preview Container */}
          <div
            className={cn(
              "p-8 sm:p-12 rounded-3xl bg-background border shadow-xl space-y-8",
              bookLayout === "scrapbook" && "font-serif bg-amber-50/20 border-amber-200/50"
            )}
          >
            {/* Book Cover Header */}
            <div className="text-center max-w-xl mx-auto space-y-2 pb-6 border-b">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-600">
                Wanderlust Chronicles
              </span>
              <h1 className="text-3xl sm:text-4xl font-serif font-black text-foreground">
                {memoryBook?.title || `${trip?.destination} Memoir`}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground italic">
                {memoryBook?.subtitle || `A photographic and narrative journey through ${trip?.destination}`}
              </p>
            </div>

            {/* Magazine Narrative Intro */}
            {summary?.narrative && (
              <div className="max-w-2xl mx-auto text-sm leading-relaxed text-foreground/90 italic font-serif text-center pb-6 border-b">
                "{summary.narrative.slice(0, 320)}..."
              </div>
            )}

            {/* Photo & Story Spreads */}
            <div
              className={cn(
                "grid gap-6",
                bookLayout === "grid"
                  ? "grid-cols-1 sm:grid-cols-3"
                  : bookLayout === "scrapbook"
                  ? "grid-cols-1 sm:grid-cols-2"
                  : "grid-cols-1 sm:grid-cols-2"
              )}
            >
              {entries.map((entry, idx) => (
                <div
                  key={entry.id}
                  className={cn(
                    "rounded-2xl overflow-hidden border bg-card p-4 shadow-sm transition-all",
                    bookLayout === "scrapbook" && "rotate-[-0.5deg] hover:rotate-0 shadow-md bg-[#FAF8F5]"
                  )}
                >
                  {entry.photos?.[0] ? (
                    <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 border">
                      <img
                        src={entry.photos[0]}
                        alt={entry.title || "Memory photo"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 mb-3">
                      <Camera className="w-8 h-8 opacity-40" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                      <span>Day {entry.dayNumber || 1}</span>
                      {entry.locationName && <span>{entry.locationName}</span>}
                    </div>
                    <h4 className="text-xs font-bold text-foreground">{entry.title || `Moment ${idx + 1}`}</h4>
                    <p className="text-[11px] text-muted-foreground leading-snug line-clamp-3">
                      {customCaptions[entry.id] || entry.notes}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
