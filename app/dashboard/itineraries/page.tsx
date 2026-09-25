"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  Calendar,
  MapPin,
  DollarSign,
  Share2,
  Trash2,
  ExternalLink,
  ArrowUpDown,
  Sparkles,
  Plane,
  X,
  Loader2,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ItineraryData } from "@/app/components/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getCountryCode } from "@/lib/country-code";
import * as Flags from "country-flag-icons/react/3x2";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDebounce } from "@/hooks/useDebounce";

type SortOption = "newest" | "oldest" | "duration" | "budget";
type FilterOption = "all" | "upcoming" | "DRAFT" | "PUBLISHED" | "journal";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80";

function MyItinerariesContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get("filter") as FilterOption | null;

  const [itineraries, setItineraries] = useState<ItineraryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState<FilterOption>(
    urlFilter && ["all", "upcoming", "DRAFT", "PUBLISHED", "journal"].includes(urlFilter)
      ? urlFilter
      : "all"
  );
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [deleteTarget, setDeleteTarget] = useState<ItineraryData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (urlFilter && ["all", "upcoming", "DRAFT", "PUBLISHED", "journal"].includes(urlFilter)) {
      setStatusFilter(urlFilter);
    }
  }, [urlFilter]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchItineraries();
    } else if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/dashboard/itineraries");
    }
  }, [status, router]);

  const fetchItineraries = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/itineraries");
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setItineraries(result.data);
      } else {
        toast.error(result.error || "Failed to load itineraries");
      }
    } catch (error) {
      console.error("[Dashboard] Fetch error:", error);
      toast.error("Failed to load itineraries");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (e: React.MouseEvent, item: ItineraryData) => {
    e.stopPropagation();
    try {
      if (item.shareToken) {
        const shareUrl = `${window.location.origin}/itinerary/share/${item.shareToken}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Public share link copied to clipboard!");
        return;
      }

      if (item.id) {
        const res = await fetch(`/api/itineraries/${item.id}/share`, {
          method: "POST",
        });
        const data = await res.json().catch(() => ({}));
        if (data.shareUrl) {
          await navigator.clipboard.writeText(data.shareUrl);
          if (data.shareToken) {
            setItineraries((prev) =>
              prev.map((it) =>
                it.id === item.id ? { ...it, shareToken: data.shareToken } : it
              )
            );
          }
          toast.success("Public share link copied to clipboard!");
          return;
        }
      }

      const url = `${window.location.origin}/itinerary/${item.id}`;
      await navigator.clipboard.writeText(url);
      toast.success("Trip link copied to clipboard!");
    } catch {
      toast.error("Failed to copy share link");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/itineraries/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete itinerary");
      }

      setItineraries((prev) => prev.filter((it) => it.id !== deleteTarget.id));
      toast.success(`Deleted trip to ${deleteTarget.destination}`);
      setDeleteTarget(null);
    } catch (error) {
      console.error("[Dashboard] Delete error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete itinerary"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter and sort items
  const filteredAndSorted = useMemo(() => {
    return itineraries
      .filter((item) => {
        // Status filter
        if (statusFilter === "DRAFT" || statusFilter === "PUBLISHED") {
          if (item.status !== statusFilter) return false;
        } else if (statusFilter === "upcoming") {
          const today = new Date().toISOString().split("T")[0];
          if (item.startDate && item.startDate < today) return false;
        }

        // Search query (debounced)
        if (debouncedSearchQuery.trim()) {
          const q = debouncedSearchQuery.toLowerCase();
          const matchDest = item.destination?.toLowerCase().includes(q);
          const matchTitle = item.title?.toLowerCase().includes(q);
          const matchTag = item.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchDest && !matchTitle && !matchTag) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        }
        if (sortBy === "oldest") {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        }
        if (sortBy === "duration") {
          const durA = typeof a.duration === "number" ? a.duration : parseInt(String(a.duration)) || 0;
          const durB = typeof b.duration === "number" ? b.duration : parseInt(String(b.duration)) || 0;
          return durB - durA;
        }
        if (sortBy === "budget") {
          const budA = a.totalBudget ?? (typeof a.budget === "number" ? a.budget : 0);
          const budB = b.totalBudget ?? (typeof b.budget === "number" ? b.budget : 0);
          return (budB as number) - (budA as number);
        }
        return 0;
      });
  }, [itineraries, statusFilter, debouncedSearchQuery, sortBy]);

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* ── Page Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                Dashboard
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {itineraries.length} total {itineraries.length === 1 ? "trip" : "trips"}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              My Itineraries
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View, organize, share, and manage all your generated travel plans and memory journals.
            </p>
          </div>

          <Button
            onClick={() => router.push("/dashboard/create")}
            className="rounded-full px-5 py-2.5 font-semibold text-sm gap-2 shadow-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Plan New Trip
          </Button>
        </div>

        {/* ── Controls: Search, Filter, Sort ─────────────────────────────────── */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by destination, title, or tag..."
              className="w-full pl-10 pr-9 py-2 rounded-xl text-sm bg-card border border-border/80 placeholder:text-muted-foreground/60 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters & Sort */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Segmented Control */}
            <div className="flex items-center p-1 rounded-xl bg-muted/50 border border-border/70 text-xs font-semibold overflow-x-auto no-scrollbar">
              {(
                [
                  { label: "All", value: "all" },
                  { label: "Upcoming", value: "upcoming" },
                  { label: "Draft", value: "DRAFT" },
                  { label: "Published", value: "PUBLISHED" },
                  { label: "📖 Journals", value: "journal" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                  className={`px-3 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === tab.value
                      ? "bg-card text-foreground shadow-sm font-bold text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/80 text-xs text-muted-foreground">
              <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
              <span className="font-medium hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-foreground font-semibold focus:outline-none cursor-pointer"
              >
                <option value="newest" className="bg-card text-foreground">Newest</option>
                <option value="oldest" className="bg-card text-foreground">Oldest</option>
                <option value="duration" className="bg-card text-foreground">Duration</option>
                <option value="budget" className="bg-card text-foreground">Budget</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Content Area: Skeletons, Empty, or Grid ────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-border/60 bg-card/60 p-4 space-y-4 overflow-hidden"
              >
                <Skeleton className="h-44 w-full rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="pt-2 flex items-center justify-between">
                  <Skeleton className="h-9 w-24 rounded-xl" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-9 rounded-xl" />
                    <Skeleton className="h-9 w-9 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredAndSorted.length === 0 ? (
          /* Empty State */
          <div className="py-20 text-center rounded-3xl border border-dashed border-border/80 bg-card/40 p-8 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg">
              <Plane className="w-8 h-8 -rotate-45" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-xl font-bold text-foreground">
                {debouncedSearchQuery || statusFilter !== "all"
                  ? "No matching itineraries found"
                  : "No itineraries created yet"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {debouncedSearchQuery || statusFilter !== "all"
                  ? "Try clearing your search query or changing filters to see more trips."
                  : "Start by generating your personalized AI itinerary with activities, maps, and budgeting."}
              </p>
            </div>

            {debouncedSearchQuery || statusFilter !== "all" ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="rounded-xl text-xs font-semibold"
              >
                Reset Filters
              </Button>
            ) : (
              <Button
                onClick={() => router.push("/dashboard/create")}
                className="rounded-xl px-5 py-2.5 font-semibold text-xs gap-2 shadow-md"
              >
                <Plus className="w-4 h-4" />
                Create Your First Trip
              </Button>
            )}
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredAndSorted.map((item, index) => {
                const stopsCount =
                  item.days?.reduce(
                    (sum, d) => sum + (d.activities?.length || 0),
                    0
                  ) || 0;

                const durationNum =
                  typeof item.duration === "number"
                    ? item.duration
                    : parseInt(String(item.duration)) || item.days?.length || 1;

                const budgetVal =
                  item.totalBudget ??
                  (typeof item.budget === "number" ? item.budget : null);

                const formattedDate = item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : null;

                const countryCode = getCountryCode(item.destination);
                const FlagIcon = countryCode && (Flags as Record<string, React.ComponentType<{ className?: string }>>)[countryCode];

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => router.push(`/itinerary/${item.id}`)}
                    className="group relative rounded-3xl border border-border/80 bg-card hover:bg-card/90 hover:border-primary/50 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between"
                  >
                    {/* Top Image Section */}
                    <div>
                      <div className="relative h-48 w-full overflow-hidden bg-muted">
                        <img
                          src={item.image || FALLBACK_COVER}
                          alt={item.destination}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-md">
                            {FlagIcon && (
                              <FlagIcon className="w-4 h-3 rounded-[2px] shadow-sm flex-shrink-0" />
                            )}
                            <span>{item.destination}</span>
                          </span>

                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md uppercase tracking-wider ${
                              item.status === "PUBLISHED"
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            }`}
                          >
                            {item.status || "DRAFT"}
                          </Badge>
                        </div>

                        {/* Destination & Title Overlay */}
                        <div className="absolute bottom-3 left-3 right-3 z-10">
                          <h3 className="text-lg font-bold text-white drop-shadow-md leading-tight line-clamp-1">
                            {item.title || `${item.destination} Itinerary`}
                          </h3>
                          {formattedDate && (
                            <p className="text-[11px] text-white/80 font-mono mt-0.5">
                              Created {formattedDate}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 space-y-3">
                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-2 py-1 border-b border-border/50 text-center">
                          <div className="p-2 rounded-xl bg-muted/40 border border-border/40">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                              Duration
                            </span>
                            <span className="text-xs font-bold font-mono text-foreground flex items-center justify-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3 text-primary" />
                              {durationNum}d
                            </span>
                          </div>

                          <div className="p-2 rounded-xl bg-muted/40 border border-border/40">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                              Stops
                            </span>
                            <span className="text-xs font-bold font-mono text-foreground flex items-center justify-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-primary" />
                              {stopsCount}
                            </span>
                          </div>

                          <div className="p-2 rounded-xl bg-muted/40 border border-border/40">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                              Budget
                            </span>
                            <span className="text-xs font-bold font-mono text-emerald-500 flex items-center justify-center gap-1 mt-0.5">
                              <DollarSign className="w-3 h-3" />
                              {budgetVal != null && Number(budgetVal) > 0
                                ? Number(budgetVal).toLocaleString()
                                : "N/A"}
                            </span>
                          </div>
                        </div>

                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {item.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-muted/60 text-muted-foreground border border-border/40"
                              >
                                #{tag}
                              </span>
                            ))}
                            {item.tags.length > 3 && (
                              <span className="text-[10px] text-muted-foreground self-center">
                                +{item.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-border/40 mt-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/itinerary/${item.id}`);
                        }}
                        className="rounded-full text-xs font-semibold gap-1.5 flex-1 shadow-sm cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open Trip
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/itinerary/${item.id}?view=journal`);
                        }}
                        title="Open Memory Journal for this trip"
                        className="rounded-full text-xs font-semibold gap-1.5 border-amber-500/30 text-amber-600 hover:text-amber-500 hover:bg-amber-500/10 dark:text-amber-400 cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                        <span>Journal</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleShare(e, item)}
                        title="Copy public share link"
                        className="rounded-full text-xs font-semibold px-3 border-border/70 hover:border-primary/40 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(item);
                        }}
                        title="Delete itinerary"
                        className="rounded-full text-xs font-semibold px-3 border-border/70 hover:border-destructive/60 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Dialog ─────────────────────────────────────── */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="rounded-3xl max-w-md border-border bg-card">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2">
              <Trash2 className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-center">
              Delete Itinerary?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm text-muted-foreground">
              Are you sure you want to delete your trip to{" "}
              <strong className="text-foreground">
                {deleteTarget?.destination}
              </strong>
              ? All days, activities, and budget records will be permanently removed.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:justify-center mt-4">
            <AlertDialogCancel
              disabled={isDeleting}
              onClick={() => setDeleteTarget(null)}
              className="rounded-xl font-semibold cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={confirmDelete}
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold gap-2 cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Trip"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function MyItinerariesPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-xs text-muted-foreground mt-3">Loading itineraries...</p>
        </div>
      }
    >
      <MyItinerariesContent />
    </Suspense>
  );
}
