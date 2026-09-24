"use client";

import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  Share2,
  CalendarPlus,
  Compass,
  Map as MapIcon,
  ListOrdered,
  DollarSign,
  CloudSun,
  Wand2,
  Check,
  RotateCcw,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MapboxMapView, type MapActivityLocation } from "@/components/map/MapboxMapView";
import { ItineraryData, Day, Activity } from "@/app/components/types";
import { SortableActivityList } from "./SortableActivityList";
import { EditActivityDialog } from "./EditActivityDialog";
import { RegenerateDayDialog } from "./RegenerateDayDialog";
import { AddStopDialog } from "./AddStopDialog";
import { RefinementBar } from "./RefinementBar";
import { ItineraryWeatherCard } from "./ItineraryWeatherCard";
import { BudgetSummaryCard } from "./BudgetSummaryCard";
import { ExpenseLogCard } from "./ExpenseLogCard";
import { AuthPromptDialog } from "@/components/auth/auth-prompt-dialog";
import { toast } from "sonner";
import * as Flags from "country-flag-icons/react/3x2";
import { getCountryCode } from "@/lib/country-code";

interface SplitItineraryViewProps {
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

export function SplitItineraryView({
  initialData,
  onBack,
  readOnly = false,
}: SplitItineraryViewProps) {
  const [itinerary, setItinerary] = useState<ItineraryData>(initialData);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const [highlightedActivityId, setHighlightedActivityId] = useState<string | undefined>(undefined);
  const [activeMobileTab, setActiveMobileTab] = useState<"timeline" | "map" | "budget">("timeline");
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);

  // Dialog states
  const [editingActivity, setEditingActivity] = useState<{
    activity: Activity;
    dayNumber: number;
  } | null>(null);

  const [regeneratingDay, setRegeneratingDay] = useState<{
    dayId?: string;
    dayNumber: number;
    currentTheme?: string;
  } | null>(null);

  const [addingStopForDay, setAddingStopForDay] = useState<{
    dayId: string;
    dayNumber: number;
    dayTitle?: string;
  } | null>(null);

  // Map coordinates transformation
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

  // Filtered map activities based on selected day
  const displayedMapActivities = useMemo(() => {
    if (selectedDayNumber === null) return mapActivities;
    return mapActivities.filter((a) => a.dayNumber === selectedDayNumber);
  }, [mapActivities, selectedDayNumber]);

  // Handler: Activity edited
  const handleSaveActivity = (updated: Activity) => {
    setItinerary((prev) => ({
      ...prev,
      days: prev.days.map((d) => {
        if (d.day !== editingActivity?.dayNumber) return d;
        return {
          ...d,
          activities: d.activities.map((act) =>
            act.id === updated.id ? updated : act
          ),
        };
      }),
    }));
  };

  // Handler: Activity deleted
  const handleDeleteActivity = async (dayNumber: number, activityId: string) => {
    try {
      const res = await fetch(`/api/activities/${activityId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (
          res.status === 401 ||
          data.code === "UNAUTHORIZED" ||
          data.error?.toLowerCase().includes("sign in") ||
          data.error?.toLowerCase().includes("unauthorized")
        ) {
          setIsAuthPromptOpen(true);
          toast.error("Please sign in to modify stops on this trip");
          return;
        }

        if (res.status === 403 || data.code === "FORBIDDEN") {
          toast.error("You don't have permission to modify this trip");
          return;
        }

        toast.error(data.error || `Failed to delete activity (${res.status})`);
        return;
      }

      setItinerary((prev) => ({
        ...prev,
        days: prev.days.map((d) => {
          if (d.day !== dayNumber) return d;
          const remaining = d.activities
            .filter((act) => act.id !== activityId)
            .map((act, idx) => ({ ...act, position: idx }));
          return { ...d, activities: remaining };
        }),
      }));

      toast.success("Stop removed from itinerary");
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err?.message || "Failed to remove stop");
    }
  };

  // Handler: Activities reordered in a day
  const handleReorderActivities = (dayNumber: number, newActivities: Activity[]) => {
    setItinerary((prev) => ({
      ...prev,
      days: prev.days.map((d) => {
        if (d.day !== dayNumber) return d;
        return { ...d, activities: newActivities };
      }),
    }));
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
          activities: updatedDay.activities.map((a: any) => ({
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
  };

  // Handler: New stop added via AddStopDialog
  const handleStopAdded = (dayNumber: number, activity: Activity) => {
    setItinerary((prev) => ({
      ...prev,
      days: prev.days.map((d) => {
        if (d.day !== dayNumber) return d;
        return { ...d, activities: [...(d.activities || []), activity] };
      }),
    }));
  };

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

  // Share link handler
  const handleShare = async () => {
    try {
      if (itinerary.shareToken) {
        const shareUrl = `${window.location.origin}/itinerary/share/${itinerary.shareToken}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Public share link copied to clipboard!");
        return;
      }

      if (itinerary.id) {
        const res = await fetch(`/api/itineraries/${itinerary.id}/share`, { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (data.shareUrl) {
          await navigator.clipboard.writeText(data.shareUrl);
          if (data.shareToken) {
            setItinerary((prev) => ({ ...prev, shareToken: data.shareToken }));
          }
          toast.success("Public share link copied to clipboard!");
          return;
        }
      }

      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      toast.success("Trip link copied to clipboard!");
    } catch {
      toast.error("Failed to copy share link");
    }
  };

  // Calendar export helper (Google Calendar)
  const handleCalendarExport = () => {
    if (itinerary.id) {
      toast.info("Opening Google Calendar...", { duration: 2500 });
      window.open(`/api/itineraries/${itinerary.id}/export/gcal`, "_blank");
    } else {
      toast.error("Please save the trip before exporting to Google Calendar");
    }
  };

  const filteredDays = useMemo(() => {
    if (selectedDayNumber === null) return itinerary.days;
    return itinerary.days.filter((d) => d.day === selectedDayNumber);
  }, [itinerary.days, selectedDayNumber]);

  const countryCode = getCountryCode(itinerary.destination);
  const FlagComponent = Flags[countryCode as keyof typeof Flags];

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* ── Top App Bar & Hero Banner ────────────────────────────────────────── */}
      <div className="relative border-b border-border/70 bg-card">
        {/* Destination Cover Banner */}
        <div className="relative h-64 sm:h-80 md:h-[340px] w-full overflow-hidden bg-slate-950">
          {itinerary.image ? (
            <img
              src={itinerary.image}
              alt={itinerary.destination}
              className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-teal-950 via-slate-900 to-black" />
          )}

          {/* Floating Back Button */}
          <div className="absolute top-4 left-4 z-20">
            <Button
              variant="secondary"
              size="sm"
              onClick={onBack}
              className="rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white shadow-xl gap-1.5 font-semibold text-xs px-3.5 py-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>

          {/* Header Metadata Overlay */}
          <div className="absolute bottom-4 left-4 right-4 max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-3 z-20">
            <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-primary text-primary-foreground shadow-md flex items-center gap-1.5">
                  {FlagComponent && (
                    <span className="w-4 h-3 rounded-[2px] overflow-hidden inline-flex items-center shadow-xs flex-shrink-0">
                      <FlagComponent className="w-full h-full object-cover" />
                    </span>
                  )}
                  <span>{itinerary.destination}</span>
                </span>
                {readOnly && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md">
                    Shared Itinerary
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/20 backdrop-blur-md">
                  {itinerary.days.length} Days Trip
                </span>
                {itinerary.tags?.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/15 text-white/90 border border-white/10"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight !text-white drop-shadow-md font-serif">
                {itinerary.title || `${itinerary.destination} Itinerary`}
              </h1>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white shadow-xl gap-1.5 text-xs font-semibold px-4 py-2 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-primary" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCalendarExport}
                className="rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white shadow-xl gap-1.5 text-xs font-semibold px-4 py-2 transition-colors cursor-pointer"
              >
                <CalendarPlus className="w-3.5 h-3.5 text-primary" />
                Google Calendar
              </Button>
            </div>
          </div>
        </div>

        {/* Day Filter Pills Bar */}
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedDayNumber(null)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border cursor-pointer ${
              selectedDayNumber === null
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border/70"
            }`}
          >
            All Days ({itinerary.days.length})
          </button>

          {itinerary.days.map((day) => {
            const isSelected = selectedDayNumber === day.day;
            const color = getDayColor(day.day);
            return (
              <button
                key={day.day}
                type="button"
                onClick={() => setSelectedDayNumber(day.day)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border/70"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-xs"
                  style={{ backgroundColor: color }}
                />
                <span>Day {day.day}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Mobile View Segmented Tab Switcher (Visible on <md screens) ────────── */}
      <div className="md:hidden sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/70 px-4 py-2">
        <div className="grid grid-cols-3 gap-1 bg-muted/60 p-1 rounded-xl border border-border/50">
          <button
            type="button"
            onClick={() => setActiveMobileTab("timeline")}
            className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              activeMobileTab === "timeline"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            Timeline
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileTab("map")}
            className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              activeMobileTab === "map"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            Map ({displayedMapActivities.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileTab("budget")}
            className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              activeMobileTab === "budget"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Expenses
          </button>
        </div>
      </div>

      {/* ── Main Workstation Content Grid ───────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* ── Left Column: Timeline & Widgets (col-span-7) ──────────────────── */}
          <div
            className={`md:col-span-7 xl:col-span-7 space-y-6 ${
              activeMobileTab !== "timeline" ? "hidden md:block" : ""
            }`}
          >
            {/* Weather & Budget Overview Cards */}
            <div className="space-y-4">
              <ItineraryWeatherCard destination={itinerary.destination} />
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
                        a.id === activityId
                          ? { ...a, cost: newCost ?? undefined }
                          : a
                      ),
                    })),
                  }));
                }}
              />
            </div>

            {/* Day Cards List */}
            <div className="space-y-8">
              {filteredDays.map((day) => {
                const dayColor = getDayColor(day.day);
                const dayCost = day.activities?.reduce((sum, act) => sum + (act.cost || 0), 0) || 0;

                return (
                  <div
                    key={day.day}
                    className="p-6 rounded-3xl bg-card/85 border border-border/80 shadow-soft space-y-5 backdrop-blur-sm"
                  >
                    {/* Day Header */}
                    <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-border/50">
                      <div className="flex items-start gap-3.5">
                        <div
                          className="w-11 h-11 rounded-2xl flex flex-col items-center justify-center text-white font-black shadow-md flex-shrink-0"
                          style={{ backgroundColor: dayColor }}
                        >
                          <span className="text-[9px] uppercase tracking-wider leading-none">Day</span>
                          <span className="text-base leading-tight font-black">{day.day}</span>
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                              {day.title}
                            </h3>
                            {day.theme && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                                {day.theme}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                            {day.activities?.length || 0} stops planned • Est. ${dayCost}
                          </p>
                        </div>
                      </div>

                      {/* Day Action Buttons */}
                      {!readOnly && (
                        <div className="flex items-center gap-2">
                          {/* Add Stop Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setAddingStopForDay({
                                dayId: day.id || "",
                                dayNumber: day.day,
                                dayTitle: day.title,
                              })
                            }
                            className="rounded-full border-primary/30 hover:border-primary/60 text-xs font-semibold gap-1.5 shadow-xs hover:bg-primary/10 text-primary px-3.5 py-1.5 transition-all flex-shrink-0 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Add Stop</span>
                          </Button>

                          {/* Regenerate Day Action Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setRegeneratingDay({
                                dayId: day.id,
                                dayNumber: day.day,
                                currentTheme: day.theme,
                              })
                            }
                            className="rounded-full border-border/70 hover:border-primary/50 text-xs font-semibold gap-1.5 shadow-xs hover:bg-primary/10 hover:text-primary px-3.5 py-1.5 transition-all flex-shrink-0 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                            <span className="hidden sm:inline">Regenerate</span>
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Sortable Drag-and-Drop Activity List */}
                    <SortableActivityList
                      dayId={day.id}
                      dayNumber={day.day}
                      dayColor={dayColor}
                      activities={day.activities || []}
                      highlightActivityId={highlightedActivityId}
                      readOnly={readOnly}
                      onHoverActivity={(id) => setHighlightedActivityId(id)}
                      onLeaveActivity={() => setHighlightedActivityId(undefined)}
                      onEditActivity={(act) =>
                        setEditingActivity({ activity: act, dayNumber: day.day })
                      }
                      onDeleteActivity={(actId) => handleDeleteActivity(day.day, actId)}
                      onReorderActivities={(reordered) =>
                        handleReorderActivities(day.day, reordered)
                      }
                    />

                    {/* Dashed "+ Add Stop" footer button for each day */}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() =>
                          setAddingStopForDay({
                            dayId: day.id || "",
                            dayNumber: day.day,
                            dayTitle: day.title,
                          })
                        }
                        className="w-full mt-1 py-3.5 rounded-2xl border-2 border-dashed border-border/70 hover:border-primary/50 text-muted-foreground hover:text-primary text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:bg-primary/5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Add Stop to Day {day.day}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Right Column: Sticky Interactive Mapbox Map (col-span-5) ──────── */}
          <div
            className={`md:col-span-5 xl:col-span-5 md:sticky md:top-20 md:h-[calc(100vh-100px)] rounded-3xl overflow-hidden border border-border/80 shadow-soft bg-card ${
              activeMobileTab !== "map" ? "hidden md:block" : "block min-h-[550px]"
            }`}
          >
            <MapboxMapView
              destination={itinerary.destination}
              activities={mapActivities}
              selectedDay={selectedDayNumber}
              onSelectDay={setSelectedDayNumber}
              highlightActivityId={highlightedActivityId}
              className="w-full h-full"
            />
          </div>

          {/* ── Mobile Expenses & Weather Tab ───────────────────────────────── */}
          {activeMobileTab === "budget" && (
            <div className="md:hidden col-span-12 space-y-4">
              <ItineraryWeatherCard destination={itinerary.destination} />
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
                        a.id === activityId
                          ? { ...a, cost: newCost ?? undefined }
                          : a
                      ),
                    })),
                  }));
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Stop Modal ─────────────────────────────────────────────────── */}
      {!readOnly && (
        <EditActivityDialog
          activity={editingActivity?.activity || null}
          dayNumber={editingActivity?.dayNumber || 1}
          isOpen={Boolean(editingActivity)}
          onClose={() => setEditingActivity(null)}
          onSave={handleSaveActivity}
        />
      )}

      {/* ── Regenerate Day Modal ────────────────────────────────────────────── */}
      {!readOnly && (
        <RegenerateDayDialog
          dayId={regeneratingDay?.dayId}
          dayNumber={regeneratingDay?.dayNumber || 1}
          destination={itinerary.destination}
          currentTheme={regeneratingDay?.currentTheme}
          isOpen={Boolean(regeneratingDay)}
          onClose={() => setRegeneratingDay(null)}
          onRegenerated={handleDayRegenerated}
        />
      )}

      {/* ── Sign In Prompt Dialog ───────────────────────────────────────────── */}
      <AuthPromptDialog
        open={isAuthPromptOpen}
        onOpenChange={setIsAuthPromptOpen}
        title="Sign In to Modify Trip"
        description="Create a free account or sign in to edit, reorder, and delete stops on this itinerary."
      />

      {/* ── Add Stop Dialog ─────────────────────────────────────────────────── */}
      {!readOnly && addingStopForDay && (
        <AddStopDialog
          dayId={addingStopForDay.dayId}
          dayNumber={addingStopForDay.dayNumber}
          dayTitle={addingStopForDay.dayTitle}
          destination={itinerary.destination}
          isOpen={Boolean(addingStopForDay)}
          onClose={() => setAddingStopForDay(null)}
          onAdded={(activity) => handleStopAdded(addingStopForDay.dayNumber, activity)}
        />
      )}
    </div>
  );
}
