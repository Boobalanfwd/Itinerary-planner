"use client";

import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Share2,
  Calendar,
  Sparkles,
  Map as MapIcon,
  ListOrdered,
  DollarSign,
  Luggage,
  Plus,
  Wand2,
  ChevronUp,
  ChevronDown,
  Clock,
  MapPin,
  X,
  Edit2,
  Trash2,
  Utensils,
  Plane,
  Bed,
  Music,
  Camera,
  ShoppingBag,
  Compass,
  FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ItineraryData, Day, Activity } from "@/app/components/types";
import { DayScrollTabs } from "./DayScrollTabs";
import { ActivitySheet } from "./ActivitySheet";
import { PackingListPanel } from "./PackingListPanel";
import { BudgetSummaryCard } from "./BudgetSummaryCard";
import { ExpenseLogCard } from "./ExpenseLogCard";
import { ItineraryWeatherCard } from "./ItineraryWeatherCard";
import { MapboxMapView, type MapActivityLocation } from "@/components/map/MapboxMapView";
import { EditActivityDialog } from "./EditActivityDialog";
import { AddStopDialog } from "./AddStopDialog";
import { RegenerateDayDialog } from "./RegenerateDayDialog";
import { RefinementBar } from "./RefinementBar";
import { toast } from "sonner";
import * as Flags from "country-flag-icons/react/3x2";
import { getCountryCode } from "@/lib/country-code";
import { useSubscription } from "@/app/hooks/useSubscription";
import { UpgradeModal } from "@/app/components/ui/UpgradeModal";
import { useUndoableActions } from "@/app/hooks/useUndoableActions";

interface MobileItineraryViewProps {
  initialData: ItineraryData;
  onBack: () => void;
  readOnly?: boolean;
}

const DAY_COLORS = [
  "#0D9488", // Teal / Emerald
  "#6366F1", // Indigo
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F97316", // Orange
];

function getDayColor(dayNumber: number): string {
  return DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];
}

const getActivityIcon = (type: string) => {
  const lower = (type || "").toLowerCase();
  if (lower.includes("food") || lower.includes("restaurant") || lower.includes("dining")) return Utensils;
  if (lower.includes("travel") || lower.includes("flight") || lower.includes("transit") || lower.includes("transport")) return Plane;
  if (lower.includes("hotel") || lower.includes("accommodation") || lower.includes("stay")) return Bed;
  if (lower.includes("nightlife") || lower.includes("entertainment") || lower.includes("music")) return Music;
  if (lower.includes("shopping")) return ShoppingBag;
  if (lower.includes("sightseeing") || lower.includes("culture") || lower.includes("art")) return Camera;
  return Compass;
};

export function MobileItineraryView({
  initialData,
  onBack,
  readOnly = false,
}: MobileItineraryViewProps) {
  const { canUseFeature, tier } = useSubscription();
  const [itinerary, setItinerary] = useState<ItineraryData>(initialData);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"timeline" | "map" | "packing" | "budget">("timeline");
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isMapOverlayOpen, setIsMapOverlayOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { scheduleAction } = useUndoableActions();

  // Dialog states
  const [editingActivity, setEditingActivity] = useState<{
    activity: Activity;
    dayNumber: number;
  } | null>(null);

  const [addingStopForDay, setAddingStopForDay] = useState<{
    dayId: string;
    dayNumber: number;
    dayTitle: string;
  } | null>(null);

  const [regeneratingDay, setRegeneratingDay] = useState<{
    dayId?: string;
    dayNumber: number;
    currentTheme?: string;
  } | null>(null);

  // Active day object
  const activeDay = useMemo(() => {
    return (
      itinerary.days.find((d) => d.day === selectedDayNumber) ||
      itinerary.days[0] ||
      null
    );
  }, [itinerary.days, selectedDayNumber]);

  // Map activities for Mapbox
  const mapActivities = useMemo<MapActivityLocation[]>(() => {
    const list: MapActivityLocation[] = [];
    itinerary.days?.forEach((d) => {
      d.activities?.forEach((a, idx) => {
        const rawLat = a.locationLat ?? a.location?.lat;
        const rawLng = a.locationLng ?? a.location?.lng;
        const lat =
          rawLat !== undefined && rawLat !== null && !isNaN(Number(rawLat))
            ? Number(rawLat)
            : null;
        const lng =
          rawLng !== undefined && rawLng !== null && !isNaN(Number(rawLng))
            ? Number(rawLng)
            : null;

        list.push({
          id: a.id || `act-${d.day}-${idx}`,
          title: a.title,
          description: a.description || a.desc || "",
          time: a.time,
          type: a.type,
          cost: a.cost,
          duration: a.duration,
          locationLat: lat,
          locationLng: lng,
          locationName: a.locationName || a.location?.name,
          address: a.address,
          dayNumber: d.day,
          position: a.position ?? idx,
        });
      });
    });
    return list;
  }, [itinerary.days]);

  // Country Flag helper
  const countryCode = useMemo(() => {
    return getCountryCode(itinerary.destination);
  }, [itinerary.destination]);
  const FlagComponent = countryCode ? (Flags as Record<string, React.ComponentType<{ className?: string }>>)[countryCode] : null;

  // Move activity up / down with 4-second Undo support
  const handleMoveActivity = (dayIndex: number, actIndex: number, direction: "up" | "down") => {
    if (readOnly) return;
    const targetIndex = direction === "up" ? actIndex - 1 : actIndex + 1;
    const currentDay = itinerary.days[dayIndex];
    if (!currentDay || targetIndex < 0 || targetIndex >= currentDay.activities.length) return;

    const originalDays = [...itinerary.days];

    const newActivities = [...currentDay.activities];
    const [moved] = newActivities.splice(actIndex, 1);
    newActivities.splice(targetIndex, 0, moved);

    const newDays = [...itinerary.days];
    newDays[dayIndex] = { ...currentDay, activities: newActivities };

    // Optimistically update UI
    setItinerary((prev) => ({ ...prev, days: newDays }));

    // Schedule 4s undoable reorder action (DB sync only if not undone)
    scheduleAction({
      id: `reorder-mobile-${currentDay.id || currentDay.day}`,
      type: "reorder_activities",
      description: "Stop order updated",
      durationMs: 4000,
      undo: () => {
        setItinerary((prev) => ({ ...prev, days: originalDays }));
      },
      commit: async () => {
        if (currentDay.id) {
          const activityIds = newActivities.map((a) => a.id).filter(Boolean) as string[];
          try {
            const res = await fetch(`/api/days/${currentDay.id}/reorder`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ activityIds }),
            });
            if (!res.ok) {
              setItinerary((prev) => ({ ...prev, days: originalDays }));
              toast.error("Failed to save order to server, restored");
            }
          } catch (err) {
            console.error("Error persisting reorder:", err);
            setItinerary((prev) => ({ ...prev, days: originalDays }));
            toast.error("Failed to save order to server, restored");
          }
        }
      },
    });
  };

  // Delete activity with 5-second Undo support
  const handleDeleteActivity = async (activityId: string) => {
    if (readOnly) return;
    const originalDays = [...itinerary.days];

    // Optimistically remove from UI
    setItinerary((prev) => ({
      ...prev,
      days: prev.days.map((d) => ({
        ...d,
        activities: d.activities.filter((a) => a.id !== activityId),
      })),
    }));

    // Schedule 5s undoable delete action (DB sync only if not undone)
    scheduleAction({
      id: `delete-mobile-${activityId}`,
      type: "delete_activity",
      description: "Stop removed from itinerary",
      durationMs: 5000,
      undo: () => {
        setItinerary((prev) => ({ ...prev, days: originalDays }));
      },
      commit: async () => {
        try {
          const res = await fetch(`/api/activities/${activityId}`, { method: "DELETE" });
          if (!res.ok) {
            setItinerary((prev) => ({ ...prev, days: originalDays }));
            toast.error("Failed to delete activity from server, restored");
          }
        } catch {
          setItinerary((prev) => ({ ...prev, days: originalDays }));
          toast.error("Failed to delete activity from server, restored");
        }
      },
    });
  };

  // Save activity edit
  const handleSaveActivity = async (updated: Activity) => {
    setItinerary((prev) => ({
      ...prev,
      days: prev.days.map((d) => ({
        ...d,
        activities: d.activities.map((a) => (a.id === updated.id ? updated : a)),
      })),
    }));
    setEditingActivity(null);
  };

  // Handler: Day regenerated
  const handleDayRegenerated = (updatedDay: any) => {
    setItinerary((prev) => ({
      ...prev,
      days: prev.days.map((d) => {
        if (d.day !== updatedDay.dayNumber && d.id !== updatedDay.id) return d;
        return {
          ...d,
          theme: updatedDay.theme || d.theme,
          title: updatedDay.title || d.title,
          activities: (updatedDay.activities || []).map((a: any) => ({
            id: a.id,
            time: a.time,
            title: a.title,
            description: a.description,
            desc: a.description,
            type: a.type,
            cost: a.cost,
            duration: a.duration,
            locationName: a.locationName,
            locationLat: a.locationLat,
            locationLng: a.locationLng,
            address: a.address,
            position: a.position,
            notes: a.notes,
            location:
              a.locationLat && a.locationLng
                ? { name: a.locationName || a.title, lat: a.locationLat, lng: a.locationLng }
                : undefined,
          })),
        };
      }),
    }));
    setRegeneratingDay(null);
  };

  // Handler: Stop added
  const handleStopAdded = (dayNumber: number, activity: Activity) => {
    setItinerary((prev) => ({
      ...prev,
      days: prev.days.map((d) => {
        if (d.day !== dayNumber) return d;
        return { ...d, activities: [...(d.activities || []), activity] };
      }),
    }));
    setAddingStopForDay(null);
  };

  // Handler: Refinement
  const handleItineraryRefined = (refined: any) => {
    if (!refined) return;
    setItinerary((prev) => ({
      ...prev,
      title: refined.title || prev.title,
      description: refined.description || prev.description,
      days: refined.days
        ? refined.days.map((d: any) => ({
            id: d.id,
            day: d.dayNumber,
            dayNumber: d.dayNumber,
            title: d.title,
            theme: d.theme,
            date: d.date ? (typeof d.date === "string" ? d.date : d.date.toISOString()) : new Date().toISOString(),
            activities: d.activities?.map((a: any) => ({
              id: a.id,
              time: a.time,
              title: a.title,
              description: a.description,
              desc: a.description,
              type: a.type,
              cost: a.cost,
              duration: a.duration,
              locationName: a.locationName,
              locationLat: a.locationLat,
              locationLng: a.locationLng,
              address: a.address,
              position: a.position,
              notes: a.notes,
              location:
                a.locationLat && a.locationLng
                  ? { name: a.locationName || a.title, lat: a.locationLat, lng: a.locationLng }
                  : undefined,
            })) || [],
          }))
        : prev.days,
    }));
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: itinerary.title || `Trip to ${itinerary.destination}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  // PDF export helper
  const handlePdfExport = () => {
    if (!itinerary.id && !itinerary.shareToken) {
      toast.error("Please save the trip before exporting to PDF");
      return;
    }

    const isShared = readOnly || Boolean(itinerary.shareToken);
    const isDev = process.env.NODE_ENV === "development";
    if (!isShared && !isDev && !canUseFeature("pdfExport")) {
      setShowUpgradeModal(true);
      return;
    }

    toast.info("Generating high-resolution PDF itinerary...", { duration: 3000 });
    const targetId = itinerary.shareToken || itinerary.id;
    window.open(`/api/itineraries/${targetId}/export/pdf`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 flex flex-col">
      {/* ── Mobile Sticky Top App Bar ──────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/70 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Back button */}
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Destination Header Title */}
          <div className="flex-1 min-w-0 px-2 text-center">
            <div className="flex items-center justify-center gap-1.5">
              {FlagComponent && (
                <div className="w-4 h-3 rounded-xs overflow-hidden shadow-xs shrink-0">
                  <FlagComponent className="w-full h-full object-cover" />
                </div>
              )}
              <h1 className="text-base font-bold font-serif text-foreground truncate">
                {itinerary.destination}
              </h1>
            </div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground mt-0.5">
              <span>{itinerary.duration}</span>
              <span>•</span>
              <span>{itinerary.days?.length ?? 0} Days</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePdfExport}
              className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
              aria-label="Download PDF"
            >
              <FileDown className="w-4 h-4 text-primary" />
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
              aria-label="Share trip"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Day Scroll Tabs (Visible on Timeline & Map) ──────────────────── */}
      {activeTab === "timeline" && (
        <DayScrollTabs
          days={itinerary.days}
          selectedDay={selectedDayNumber}
          onSelectDay={setSelectedDayNumber}
          getDayColor={getDayColor}
        />
      )}

      {/* ── Main Content Area ───────────────────────────────────────────── */}
      <main className="flex-1 px-4 pt-4">
        {/* ── Timeline Tab ──────────────────────────────────────────────── */}
        {activeTab === "timeline" && activeDay && (
          <div className="space-y-4">
            {/* Day Theme Banner */}
            <div className="p-4 rounded-3xl bg-card border border-border/80 shadow-soft space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-2xl flex items-center justify-center text-white text-sm font-black shadow-xs shrink-0"
                    style={{ backgroundColor: getDayColor(activeDay.day) }}
                  >
                    {activeDay.day}
                  </div>
                  <div>
                    <h2 className="text-base font-bold font-serif text-foreground leading-tight">
                      {activeDay.theme || `Day ${activeDay.day} in ${itinerary.destination}`}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activeDay.activities?.length ?? 0} scheduled stops
                    </p>
                  </div>
                </div>

                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setRegeneratingDay({
                        dayId: activeDay.id,
                        dayNumber: activeDay.day,
                        currentTheme: activeDay.theme,
                      })
                    }
                    className="h-9 min-h-[36px] text-xs rounded-xl gap-1 text-muted-foreground hover:text-primary cursor-pointer px-2"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    Regen
                  </Button>
                )}
              </div>

              {/* Day Weather Snapshot */}
              <ItineraryWeatherCard destination={itinerary.destination} />
            </div>

            {/* Activities List */}
            <div className="space-y-3">
              {activeDay.activities && activeDay.activities.length > 0 ? (
                activeDay.activities.map((act, actIndex) => {
                  const Icon = getActivityIcon(act.type);
                  const isFirst = actIndex === 0;
                  const isLast = actIndex === activeDay.activities.length - 1;
                  const dayIndex = itinerary.days.findIndex((d) => d.day === activeDay.day);

                  return (
                    <div
                      key={act.id || `act-${actIndex}`}
                      className="p-4 rounded-2xl bg-card border border-border/80 shadow-soft flex items-start gap-3 relative transition-all"
                    >
                      {/* Stop Sequence Indicator */}
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0 mt-0.5"
                        style={{ backgroundColor: getDayColor(activeDay.day) }}
                      >
                        {actIndex + 1}
                      </div>

                      {/* Clickable Card Body */}
                      <div
                        onClick={() => setSelectedActivity(act)}
                        className="flex-1 min-w-0 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {act.time && (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                              <Clock className="w-3 h-3" />
                              {act.time}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground capitalize">
                            <Icon className="w-3 h-3" />
                            {act.type}
                          </span>
                          {act.cost !== undefined && act.cost !== null && act.cost > 0 && (
                            <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              ${act.cost}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                          {act.title}
                        </h4>

                        {act.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                            {act.description}
                          </p>
                        )}
                      </div>

                      {/* Mobile Reorder and Actions */}
                      {!readOnly && (
                        <div className="flex flex-col items-center gap-1 shrink-0 -mr-1">
                          <button
                            type="button"
                            disabled={isFirst}
                            onClick={() => handleMoveActivity(dayIndex, actIndex, "up")}
                            className="w-8 h-8 min-h-[32px] min-w-[32px] rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-foreground disabled:opacity-20 cursor-pointer"
                            aria-label="Move up"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={isLast}
                            onClick={() => handleMoveActivity(dayIndex, actIndex, "down")}
                            className="w-8 h-8 min-h-[32px] min-w-[32px] rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-foreground disabled:opacity-20 cursor-pointer"
                            aria-label="Move down"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center rounded-2xl border border-dashed border-border/80 text-muted-foreground text-xs">
                  No stops added for Day {activeDay.day} yet.
                </div>
              )}

              {/* Add Stop Button */}
              {!readOnly && (
                <Button
                  onClick={() =>
                    setAddingStopForDay({
                      dayId: activeDay.id || "",
                      dayNumber: activeDay.day,
                      dayTitle: activeDay.theme || `Day ${activeDay.day}`,
                    })
                  }
                  variant="outline"
                  className="w-full min-h-[48px] rounded-2xl border-dashed border-border/80 hover:border-primary/50 text-muted-foreground hover:text-primary font-semibold text-xs gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Stop to Day {activeDay.day}
                </Button>
              )}
            </div>

            {/* AI Refinement Bar */}
            {!readOnly && (
              <div className="pt-2">
                <RefinementBar
                  itineraryId={itinerary.id}
                  onRefined={handleItineraryRefined}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Map Tab ───────────────────────────────────────────────────── */}
        {activeTab === "map" && (
          <div className="h-[calc(100vh-180px)] rounded-3xl overflow-hidden border border-border/80 shadow-soft bg-card relative">
            <MapboxMapView
              destination={itinerary.destination}
              activities={mapActivities}
              selectedDay={selectedDayNumber}
              onSelectDay={(dayNum) => {
                if (dayNum) setSelectedDayNumber(dayNum);
              }}
              className="w-full h-full"
            />
          </div>
        )}

        {/* ── Packing Checklist Tab ─────────────────────────────────────── */}
        {activeTab === "packing" && (
          <div className="space-y-4">
            <PackingListPanel
              itineraryId={itinerary.id || ""}
              destination={itinerary.destination}
              initialPackingList={itinerary.metadata?.packingList}
              readOnly={readOnly}
            />
          </div>
        )}

        {/* ── Expenses & Budget Tab ─────────────────────────────────────── */}
        {activeTab === "budget" && (
          <div className="space-y-4">
            <BudgetSummaryCard
              days={itinerary.days}
              totalBudget={itinerary.totalBudget ?? itinerary.budget}
              itineraryId={itinerary.id}
              readOnly={readOnly}
            />
            <ExpenseLogCard
              days={itinerary.days}
              readOnly={readOnly}
              onCostUpdated={(activityId, newCost) => {
                setItinerary((prev) => ({
                  ...prev,
                  days: prev.days.map((d) => ({
                    ...d,
                    activities: d.activities.map((a) =>
                      a.id === activityId ? { ...a, cost: newCost ?? undefined } : a
                    ),
                  })),
                }));
              }}
            />
          </div>
        )}
      </main>

      {/* ── Floating Action Button (FAB) for Map on Timeline ───────────── */}
      {activeTab === "timeline" && mapActivities.length > 0 && (
        <div className="fixed bottom-20 right-4 z-40">
          <Button
            onClick={() => setIsMapOverlayOpen(true)}
            className="rounded-full shadow-xl bg-primary hover:bg-primary-hover text-primary-foreground min-h-[48px] px-5 font-bold gap-2 cursor-pointer flex items-center border border-white/20"
          >
            <MapIcon className="w-4 h-4" />
            <span>Map ({mapActivities.length})</span>
          </Button>
        </div>
      )}

      {/* ── Fullscreen Map Overlay Modal (Opened via FAB) ────────────────── */}
      {isMapOverlayOpen && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in fade-in-0 duration-200">
          <div className="flex items-center justify-between p-3 border-b border-border/80 bg-background/95 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-primary" />
              <span className="font-serif font-bold text-sm">
                Map: {itinerary.destination}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsMapOverlayOpen(false)}
              className="w-9 h-9 min-h-[36px] min-w-[36px] rounded-full flex items-center justify-center bg-muted/80 text-foreground cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 w-full h-full relative">
            <MapboxMapView
              destination={itinerary.destination}
              activities={mapActivities}
              selectedDay={selectedDayNumber}
              onSelectDay={(dayNum) => {
                if (dayNum) setSelectedDayNumber(dayNum);
              }}
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* ── Mobile Sticky Bottom Navigation Bar ─────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/70 py-1.5 px-3">
        <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab("timeline")}
            className={`min-h-[48px] py-1.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === "timeline"
                ? "bg-primary/10 text-primary font-bold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span className="text-[10px] leading-none">Timeline</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("map")}
            className={`min-h-[48px] py-1.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === "map"
                ? "bg-primary/10 text-primary font-bold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span className="text-[10px] leading-none">Map</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("packing")}
            className={`min-h-[48px] py-1.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === "packing"
                ? "bg-primary/10 text-primary font-bold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Luggage className="w-4 h-4" />
            <span className="text-[10px] leading-none">Packing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("budget")}
            className={`min-h-[48px] py-1.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === "budget"
                ? "bg-primary/10 text-primary font-bold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span className="text-[10px] leading-none">Budget</span>
          </button>
        </div>
      </nav>

      {/* ── Activity Detail Sheet ─────────────────────────────────────── */}
      <ActivitySheet
        activity={selectedActivity}
        dayNumber={activeDay?.day}
        isOpen={Boolean(selectedActivity)}
        onClose={() => setSelectedActivity(null)}
        onEdit={(act) => {
          setSelectedActivity(null);
          setEditingActivity({ activity: act, dayNumber: activeDay?.day || 1 });
        }}
        onLocateOnMap={(act) => {
          setSelectedActivity(null);
          setIsMapOverlayOpen(true);
        }}
        readOnly={readOnly}
      />

      {/* ── Edit Activity Modal ───────────────────────────────────────── */}
      {!readOnly && (
        <EditActivityDialog
          activity={editingActivity?.activity || null}
          dayNumber={editingActivity?.dayNumber || 1}
          isOpen={Boolean(editingActivity)}
          onClose={() => setEditingActivity(null)}
          onSave={handleSaveActivity}
        />
      )}

      {/* ── Add Stop Modal ────────────────────────────────────────────── */}
      {!readOnly && addingStopForDay && (
        <AddStopDialog
          isOpen={Boolean(addingStopForDay)}
          onClose={() => setAddingStopForDay(null)}
          dayId={addingStopForDay.dayId}
          dayNumber={addingStopForDay.dayNumber}
          dayTitle={addingStopForDay.dayTitle}
          destination={itinerary.destination}
          onAdded={(activity) => handleStopAdded(addingStopForDay.dayNumber, activity)}
        />
      )}

      {/* ── Regenerate Day Modal ──────────────────────────────────────── */}
      {!readOnly && regeneratingDay && (
        <RegenerateDayDialog
          isOpen={Boolean(regeneratingDay)}
          onClose={() => setRegeneratingDay(null)}
          dayId={regeneratingDay.dayId}
          dayNumber={regeneratingDay.dayNumber}
          destination={itinerary.destination}
          currentTheme={regeneratingDay.currentTheme}
          onRegenerated={handleDayRegenerated}
        />
      )}
      {/* ── Upgrade Modal for Free tier PDF gate ───────────────────────── */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="PDF Export"
        currentPlan={tier}
      />
    </div>
  );
}
