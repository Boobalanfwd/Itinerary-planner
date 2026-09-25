"use client";

import React, { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
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
  Luggage,
  FileDown,
  Vote,
  MessageSquare,
  BookOpen,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useTripRealtime } from "@/hooks/useTripRealtime";
import { CollaboratorPresenceBar } from "@/components/collaboration/CollaboratorPresenceBar";
import { LiveCursorsOverlay } from "@/components/collaboration/LiveCursorsOverlay";
import { CollaboratorInviteModal } from "@/components/collaboration/CollaboratorInviteModal";
import { CommentThreadPanel } from "@/components/collaboration/CommentThreadPanel";
import { GroupPollModal } from "@/components/collaboration/GroupPollModal";
import { PollCard } from "@/components/collaboration/PollCard";
import { ActivityHistoryDrawer } from "@/components/collaboration/ActivityHistoryDrawer";
import { PostTripJournalView } from "@/components/journal/PostTripJournalView";
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
import { PackingListPanel } from "./PackingListPanel";
import { AuthPromptDialog } from "@/components/auth/auth-prompt-dialog";
import { toast } from "sonner";
import * as Flags from "country-flag-icons/react/3x2";
import { getCountryCode } from "@/lib/country-code";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileItineraryView } from "./MobileItineraryView";
import { useSubscription } from "@/app/hooks/useSubscription";
import { UpgradeModal } from "@/app/components/ui/UpgradeModal";
import { useUndoableActions } from "@/app/hooks/useUndoableActions";

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
  const isMobile = useIsMobile();
  const { canUseFeature, tier } = useSubscription();
  const [itinerary, setItinerary] = useState<ItineraryData>(initialData);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const [highlightedActivityId, setHighlightedActivityId] = useState<string | undefined>(undefined);
  const [activeMobileTab, setActiveMobileTab] = useState<"timeline" | "map" | "budget" | "packing">("timeline");
  const [activeLeftTab, setActiveLeftTab] = useState<"timeline" | "packing" | "budget">("timeline");
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { scheduleAction } = useUndoableActions();

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

  const searchParams = useSearchParams();
  const urlView = searchParams?.get("view");

  // PILLAR 1 & 2 Main Tab State: "planner" vs "journal"
  const [mainViewMode, setMainViewMode] = useState<"planner" | "journal">(
    urlView === "journal" ? "journal" : "planner"
  );

  useEffect(() => {
    if (urlView === "journal") {
      setMainViewMode("journal");
    } else if (urlView === "planner") {
      setMainViewMode("planner");
    }
  }, [urlView]);

  // Collaboration UI states
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [activeCommentAnchor, setActiveCommentAnchor] = useState<{
    type: "activity" | "place" | "day" | "itinerary";
    id: string;
    title: string;
  } | null>(null);

  // Polls & Comment counts
  const [polls, setPolls] = useState<any[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [collaboratorsList, setCollaboratorsList] = useState<any[]>([]);

  const { data: session } = useSession();
  const currentUser = useMemo(() => {
    return {
      id: session?.user?.id || (session?.user?.email ? `usr-${session.user.email}` : "traveler-guest"),
      name: session?.user?.name || "Fellow Traveler",
      username: (session?.user as any)?.username || session?.user?.name?.toLowerCase().replace(/\s+/g, "_"),
      email: session?.user?.email || undefined,
      image: session?.user?.image || undefined,
      role: "TRAVELER",
    };
  }, [session]);

  const isOwner = useMemo(() => {
    if (!itinerary.userId || !currentUser.id) return true;
    return itinerary.userId === currentUser.id;
  }, [itinerary.userId, currentUser.id]);

  // Load polls and comment badges
  const loadTripPolls = async () => {
    if (!itinerary.id) return;
    try {
      const res = await fetch(`/api/polls?tripId=${itinerary.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setPolls(data.polls || []);
      }
    } catch (e) {
      console.warn("Error loading polls:", e);
    }
  };

  const loadTripComments = async () => {
    if (!itinerary.id) return;
    try {
      const res = await fetch(`/api/comments?tripId=${itinerary.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.badgeCounts) setCommentCounts(data.badgeCounts);
      }
    } catch (e) {
      console.warn("Error loading comment badges:", e);
    }
  };

  const loadCollaborators = async () => {
    if (!itinerary.id) return;
    try {
      const res = await fetch(`/api/collaborators?tripId=${itinerary.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.collaborators) setCollaboratorsList(data.collaborators);
      }
    } catch (e) {
      console.warn("Failed to load collaborators", e);
    }
  };

  useEffect(() => {
    if (itinerary.id) {
      loadTripPolls();
      loadTripComments();
      loadCollaborators();
    }
  }, [itinerary.id]);

  const allItineraryActivities = useMemo(() => {
    const list: any[] = [];
    itinerary.days?.forEach((d) => {
      d.activities?.forEach((a) => {
        list.push({
          id: a.id,
          title: a.title,
          dayNumber: d.day,
          time: a.time,
        });
      });
    });
    return list;
  }, [itinerary.days]);

  const linkedPollsByActivityId = useMemo(() => {
    const map: Record<string, any> = {};
    polls.forEach((p) => {
      if (p.linkedActivityId) {
        map[p.linkedActivityId] = p;
      }
    });
    return map;
  }, [polls]);

  // Real-time multiplayer synchronization hook
  const realtime = useTripRealtime({
    tripId: itinerary.id || "trip-local",
    currentUser,
    onItineraryChange: (change) => {
      if (change.action === "UPDATE" && change.activity) {
        setItinerary((prev) => ({
          ...prev,
          days: prev.days.map((d) => ({
            ...d,
            activities: d.activities.map((act) =>
              act.id === change.activity.id ? change.activity : act
            ),
          })),
        }));
        toast.info("Itinerary updated by collaborator");
      } else if (change.action === "REORDER" && change.dayId && change.activityIds) {
        setItinerary((prev) => ({
          ...prev,
          days: prev.days.map((d) => {
            if (d.id !== change.dayId) return d;
            const actMap = new Map(d.activities.map((a) => [a.id, a]));
            const reordered = change.activityIds
              .map((id: string, idx: number) => {
                const item = actMap.get(id);
                return item ? { ...item, position: idx } : null;
              })
              .filter(Boolean) as Activity[];
            return { ...d, activities: reordered };
          }),
        }));
      } else if (change.action === "DELETE" && change.activityId) {
        setItinerary((prev) => ({
          ...prev,
          days: prev.days.map((d) => ({
            ...d,
            activities: d.activities.filter((act) => act.id !== change.activityId),
          })),
        }));
      } else if (change.action === "CREATE" && change.activity) {
        setItinerary((prev) => ({
          ...prev,
          days: prev.days.map((d) => {
            if (d.id === change.dayId || d.day === change.activity.dayNumber) {
              return { ...d, activities: [...d.activities, change.activity] };
            }
            return d;
          }),
        }));
      }
    },
    onNewComment: (comment) => {
      setCommentCounts((prev) => {
        const key = `${comment.anchorType}:${comment.anchorId}`;
        return { ...prev, [key]: (prev[key] || 0) + 1 };
      });
      toast.info(`New comment from ${comment.user?.name || "Collaborator"}`);
    },
    onPollCreated: (newPoll) => {
      setPolls((prev) => [newPoll, ...prev]);
      toast.info(`New group poll launched: "${newPoll.title}"`);
    },
    onPollUpdated: (updatedPoll) => {
      setPolls((prev) => prev.map((p) => (p.id === updatedPoll.id ? updatedPoll : p)));
    },
    onCollaboratorUpdated: (data) => {
      toast.success(
        data.action === "DECLINE"
          ? "A collaborator declined the invite"
          : "Collaborator list updated live!"
      );
    },
    onActivityLog: (log) => {
      // Optional subtle notification of collaborator action
    },
  });

  // Track cursor movement on canvas
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    realtime.sendCursor(e.clientX, e.clientY);
  };

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

  // Handler: Activity deleted with 5-second Undo support
  const handleDeleteActivity = async (dayNumber: number, activityId: string) => {
    const targetDay = itinerary.days.find((d) => d.day === dayNumber);
    if (!targetDay) return;
    const previousActivities = [...targetDay.activities];

    // Optimistic removal from state
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

    // Schedule 5-second undoable action (DB sync only if not undone)
    scheduleAction({
      id: `delete-${activityId}`,
      type: "delete_activity",
      description: "Stop removed from itinerary",
      durationMs: 5000,
      undo: () => {
        setItinerary((prev) => ({
          ...prev,
          days: prev.days.map((d) => {
            if (d.day !== dayNumber) return d;
            return { ...d, activities: previousActivities };
          }),
        }));
      },
      commit: async () => {
        try {
          const res = await fetch(`/api/activities/${activityId}`, {
            method: "DELETE",
          });

          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            // Revert state if server delete failed
            setItinerary((prev) => ({
              ...prev,
              days: prev.days.map((d) => {
                if (d.day !== dayNumber) return d;
                return { ...d, activities: previousActivities };
              }),
            }));

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
          }
        } catch (err: any) {
          console.error("Delete error:", err);
          setItinerary((prev) => ({
            ...prev,
            days: prev.days.map((d) => {
              if (d.day !== dayNumber) return d;
              return { ...d, activities: previousActivities };
            }),
          }));
          toast.error(err?.message || "Failed to remove stop on server, restored");
        }
      },
    });
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

  const filteredDays = useMemo(() => {
    if (selectedDayNumber === null) return itinerary.days;
    return itinerary.days.filter((d) => d.day === selectedDayNumber);
  }, [itinerary.days, selectedDayNumber]);

  const countryCode = getCountryCode(itinerary.destination);
  const FlagComponent = Flags[countryCode as keyof typeof Flags];

  if (isMobile) {
    return (
      <MobileItineraryView
        initialData={itinerary}
        onBack={onBack}
        readOnly={readOnly}
      />
    );
  }

  return (
    <div onMouseMove={handleCanvasMouseMove} className="min-h-screen bg-background text-foreground pb-24 relative">
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

          {/* Floating Back Button & Multiplayer Presence Bar */}
          <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={onBack}
                className="rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white shadow-xl gap-1.5 font-semibold text-xs px-3.5 py-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>

              {/* Pillar 1 vs Pillar 2 Tab Switcher */}
              <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/20 shadow-xl">
                <button
                  type="button"
                  onClick={() => setMainViewMode("planner")}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                    mainViewMode === "planner"
                      ? "bg-amber-500 text-white shadow-sm"
                      : "text-white/80 hover:text-white"
                  )}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Planner</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMainViewMode("journal")}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                    mainViewMode === "journal"
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
                      : "text-white/80 hover:text-white"
                  )}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Memory Journal</span>
                </button>
              </div>
            </div>

            {/* Multiplayer Collaborator Presence Bar */}
            <CollaboratorPresenceBar
              roster={realtime.roster}
              isConnected={realtime.isConnected}
              latencyMs={realtime.latencyMs}
              onOpenInviteModal={() => setIsInviteModalOpen(true)}
              onOpenHistoryDrawer={() => setIsHistoryDrawerOpen(true)}
            />
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
                className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-none text-white shadow-xl gap-1.5 text-xs font-bold px-4 py-2 transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePdfExport}
                className="rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white shadow-xl gap-1.5 text-xs font-semibold px-3 py-2 transition-colors cursor-pointer"
                title="Download PDF Itinerary"
              >
                <FileDown className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Download PDF</span>
                <span className="sm:hidden">PDF</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCalendarExport}
                className="rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white shadow-xl gap-1.5 text-xs font-semibold px-3 py-2 transition-colors cursor-pointer"
                title="Add to Google Calendar"
              >
                <CalendarPlus className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Google Calendar</span>
                <span className="sm:hidden">Calendar</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Day Filter Pills Bar (Only visible in Planner mode) */}
        {mainViewMode === "planner" && (
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
        )}
      </div>

      {/* ── Mobile View Segmented Tab Switcher (Visible on <md screens, only in Planner mode) ────────── */}
      {mainViewMode === "planner" && (
        <div className="md:hidden sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/70 px-4 py-2">
          <div className="grid grid-cols-4 gap-1 bg-muted/60 p-1 rounded-xl border border-border/50">
            <button
              type="button"
              onClick={() => setActiveMobileTab("timeline")}
              className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                activeMobileTab === "timeline"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span className="truncate">Timeline</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMobileTab("map")}
              className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                activeMobileTab === "map"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span className="truncate">Map</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMobileTab("packing")}
              className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                activeMobileTab === "packing"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Luggage className="w-3.5 h-3.5" />
              <span className="truncate">Packing</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMobileTab("budget")}
              className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                activeMobileTab === "budget"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span className="truncate">Budget</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Main Workstation Content Grid ───────────────────────────────────── */}
      {mainViewMode === "journal" ? (
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <PostTripJournalView
            tripId={itinerary.id || ""}
            trip={itinerary}
            currentUser={currentUser}
            isCollaborator={!readOnly}
          />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* ── Left Column: Timeline, Packing, Budget (col-span-7) ───────────── */}
            <div
              className={`md:col-span-7 xl:col-span-7 space-y-6 ${
                activeMobileTab !== "timeline" ? "hidden md:block" : ""
              }`}
            >
            {/* Desktop Section Switcher Tabs */}
            <div className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border/70 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setActiveLeftTab("timeline")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeLeftTab === "timeline"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5 text-primary" />
                Daily Timeline ({itinerary.days.length} Days)
              </button>
              <button
                type="button"
                onClick={() => setActiveLeftTab("packing")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeLeftTab === "packing"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Luggage className="w-3.5 h-3.5 text-primary" />
                Packing Checklist
              </button>
              <button
                type="button"
                onClick={() => setActiveLeftTab("budget")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeLeftTab === "budget"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-primary" />
                Expenses &amp; Budget
              </button>
            </div>

            {/* ── Content for Packing tab on desktop ─────────────────────────── */}
            {activeLeftTab === "packing" && (
              <PackingListPanel
                itineraryId={itinerary.id || ""}
                destination={itinerary.destination}
                initialPackingList={itinerary.metadata?.packingList}
                readOnly={readOnly}
              />
            )}

            {/* ── Content for Budget tab on desktop ──────────────────────────── */}
            {activeLeftTab === "budget" && (
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

            {/* ── Content for Timeline tab on desktop ────────────────────────── */}
            {activeLeftTab === "timeline" && (
              <>
                <ItineraryWeatherCard destination={itinerary.destination} />

                {/* ── Group Decisions & Polls Section (Pillar 1.5) ───────────── */}
                <div className="p-6 rounded-3xl bg-card/85 border border-border/80 shadow-soft space-y-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                        <Vote className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                          Group Decisions &amp; Polls
                          {polls.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                              {polls.length}
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Vote on activities, restaurants, or hotel options together
                        </p>
                      </div>
                    </div>

                    {!readOnly && (
                      <Button
                        size="sm"
                        onClick={() => setIsPollModalOpen(true)}
                        className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md text-xs font-semibold gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Poll</span>
                      </Button>
                    )}
                  </div>

                  {polls.length === 0 ? (
                    <div className="py-6 px-4 text-center border-2 border-dashed border-border/70 rounded-2xl bg-muted/15 space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">
                        No group polls yet. Launch a quick vote on dinner spots, hotel options, or activities!
                      </p>
                      {!readOnly && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsPollModalOpen(true)}
                          className="rounded-full border-amber-500/30 text-amber-600 hover:bg-amber-500/10 text-xs font-semibold"
                        >
                          Launch First Poll
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {polls.map((poll) => (
                        <PollCard
                          key={poll.id}
                          poll={poll}
                          currentUserId={currentUser.id}
                          isOwner={isOwner}
                          onVoteCast={(pollId, updated) => {
                            setPolls((prev) => prev.map((p) => (p.id === pollId ? updated : p)));
                            realtime.broadcastVote(pollId, updated);
                          }}
                          onNudgeSent={(pollTitle, nonVoters) => {
                            realtime.broadcastNudge(pollTitle, nonVoters);
                          }}
                          onApplyWinnerToSlot={async (actId, optId) => {
                            const chosenOption = poll.options.find((o: any) => o.id === optId);
                            if (chosenOption) {
                              setItinerary((prev) => ({
                                ...prev,
                                days: prev.days.map((d) => ({
                                  ...d,
                                  activities: d.activities.map((a) =>
                                    a.id === actId ? { ...a, title: chosenOption.title } : a
                                  ),
                                })),
                              }));
                              realtime.broadcastEdit({
                                action: "UPDATE",
                                activity: { id: actId, title: chosenOption.title },
                              });
                            }
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-8">
              {filteredDays.map((day) => {
                const dayColor = getDayColor(day.day);
                const dayCost = day.activities?.reduce((sum, act) => sum + (act.cost || 0), 0) || 0;
                const dayAnchorKey = `day:${day.id || `day-${day.day}`}`;
                const dayCommentsCount = commentCounts[dayAnchorKey] || 0;

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
                      <div className="flex items-center gap-2">
                        {/* Day Comments Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setActiveCommentAnchor({
                              type: "day",
                              id: day.id || `day-${day.day}`,
                              title: `Day ${day.day}: ${day.title}`,
                            })
                          }
                          className="rounded-full border-border/70 hover:border-amber-500/50 text-xs font-semibold gap-1.5 shadow-xs hover:bg-amber-500/10 text-foreground px-3.5 py-1.5 transition-all flex-shrink-0 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                          <span className="hidden sm:inline">Comments</span>
                          {dayCommentsCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                              {dayCommentsCount}
                            </span>
                          )}
                        </Button>

                        {!readOnly && (
                          <>
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
                          </>
                        )}
                      </div>
                    </div>

                    {/* Sortable Drag-and-Drop Activity List */}
                    <SortableActivityList
                      dayId={day.id}
                      dayNumber={day.day}
                      dayColor={dayColor}
                      activities={day.activities || []}
                      highlightActivityId={highlightedActivityId}
                      readOnly={readOnly}
                      commentCounts={commentCounts}
                      focusedFields={realtime.focusedFields}
                      activityLocks={realtime.locks}
                      linkedPollsByActivityId={linkedPollsByActivityId}
                      onHoverActivity={(id) => setHighlightedActivityId(id)}
                      onLeaveActivity={() => setHighlightedActivityId(undefined)}
                      onEditActivity={(act) =>
                        setEditingActivity({ activity: act, dayNumber: day.day })
                      }
                      onDeleteActivity={(actId) => handleDeleteActivity(day.day, actId)}
                      onReorderActivities={(reordered) =>
                        handleReorderActivities(day.day, reordered)
                      }
                      onOpenComments={(act) =>
                        setActiveCommentAnchor({
                          type: "activity",
                          id: act.id || "",
                          title: act.title,
                        })
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
            </>
          )}
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

          {/* ── Mobile Packing Checklist Tab ─────────────────────────────────── */}
          {activeMobileTab === "packing" && (
            <div className="md:hidden col-span-12 space-y-4">
              <PackingListPanel
                itineraryId={itinerary.id || ""}
                destination={itinerary.destination}
                initialPackingList={itinerary.metadata?.packingList}
                readOnly={readOnly}
              />
            </div>
          )}
        </div>
      </div>
    )}

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
      {/* ── Upgrade Modal for Free tier PDF gate ─────────────────────────────── */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="PDF Export"
        currentPlan={tier}
      />

      {/* ── Real-Time Multiplayer Cursors Overlay (Pillar 1.4) ──────────────── */}
      <LiveCursorsOverlay cursors={realtime.remoteCursors} />

      {/* ── Collaborator Management Modal (Pillar 1.1) ──────────────────────── */}
      <CollaboratorInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        tripId={itinerary.id || ""}
        tripTitle={itinerary.title || itinerary.destination}
        isOwner={isOwner}
        onInviteSent={(collaborator, invitedUserId, notification) => {
          realtime.broadcastInviteSent(collaborator, invitedUserId, notification);
          setCollaboratorsList((prev) => [...prev, collaborator]);
        }}
      />

      {/* ── Threaded Comment Panel (Pillar 1.2) ─────────────────────────────── */}
      {activeCommentAnchor && (
        <CommentThreadPanel
          isOpen={Boolean(activeCommentAnchor)}
          onClose={() => setActiveCommentAnchor(null)}
          tripId={itinerary.id || ""}
          anchorType={activeCommentAnchor.type}
          anchorId={activeCommentAnchor.id}
          anchorTitle={activeCommentAnchor.title}
          currentUser={currentUser}
          collaborators={collaboratorsList}
          onCommentAdded={(newComment, mentions) => {
            realtime.broadcastComment(newComment, mentions);
            setCommentCounts((prev) => {
              const k = `${newComment.anchorType}:${newComment.anchorId}`;
              return { ...prev, [k]: (prev[k] || 0) + 1 };
            });
          }}
          onCommentResolved={(commentId, resolved) => {
            realtime.broadcastCommentResolve(commentId, resolved);
          }}
          onCommentReacted={(commentId, emoji, reactions) => {
            realtime.broadcastCommentReaction(commentId, emoji, reactions);
          }}
        />
      )}

      {/* ── Group Poll Creation Modal (Pillar 1.5) ───────────────────────────── */}
      <GroupPollModal
        isOpen={isPollModalOpen}
        onClose={() => setIsPollModalOpen(false)}
        tripId={itinerary.id || ""}
        activities={allItineraryActivities}
        onPollCreated={(newPoll) => {
          setPolls((prev) => [newPoll, ...prev]);
          realtime.broadcastPoll(newPoll);
        }}
      />

      {/* ── Activity History / Version Drawer (Pillar 1.3) ───────────────────── */}
      <ActivityHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        tripId={itinerary.id || ""}
      />
    </div>
  );
}
