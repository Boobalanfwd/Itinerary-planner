"use client";

import React from "react";
import {
  Clock,
  MapPin,
  ExternalLink,
  DollarSign,
  Utensils,
  Plane,
  Bed,
  Music,
  Camera,
  ShoppingBag,
  Compass,
  Edit2,
  Navigation,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity } from "@/app/components/types";

interface ActivitySheetProps {
  activity: Activity | null;
  dayNumber?: number;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (activity: Activity) => void;
  onLocateOnMap?: (activity: Activity) => void;
  readOnly?: boolean;
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

export function ActivitySheet({
  activity,
  dayNumber,
  isOpen,
  onClose,
  onEdit,
  onLocateOnMap,
  readOnly = false,
}: ActivitySheetProps) {
  if (!activity) return null;

  const Icon = getActivityIcon(activity.type);
  const locationLabel =
    activity.locationName || activity.location?.name || activity.address;

  const googleMapsUrl =
    activity.locationLat && activity.locationLng
      ? `https://www.google.com/maps/search/?api=1&query=${activity.locationLat},${activity.locationLng}`
      : locationLabel
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationLabel)}`
      : null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-[32px] max-h-[85vh] overflow-y-auto px-6 pt-3 pb-8 bg-card border-border/80 shadow-2xl"
      >
        {/* Drag handle pill */}
        <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30 mx-auto mb-4" />

        <SheetHeader className="text-left space-y-3 pb-4 border-b border-border/60">
          <div className="flex flex-wrap items-center gap-2">
            {/* Time Pill */}
            {activity.time && (
              <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                <Clock className="w-3.5 h-3.5" />
                {activity.time}
              </span>
            )}

            {/* Category */}
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border capitalize bg-muted/60 text-foreground border-border/60">
              <Icon className="w-3.5 h-3.5 text-primary" />
              {activity.type}
            </span>

            {/* Duration */}
            {activity.duration && (
              <span className="text-xs font-mono text-muted-foreground bg-muted/40 px-2 py-1 rounded-full border border-border/40">
                {activity.duration} mins
              </span>
            )}

            {/* Cost */}
            {activity.cost !== undefined && activity.cost !== null && activity.cost > 0 && (
              <span className="inline-flex items-center text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                ${activity.cost}
              </span>
            )}
          </div>

          <div>
            <SheetTitle className="text-xl sm:text-2xl font-bold font-serif text-foreground leading-snug">
              {activity.title}
            </SheetTitle>
            {dayNumber && (
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                Day {dayNumber} Stop
              </SheetDescription>
            )}
          </div>
        </SheetHeader>

        {/* Details Content */}
        <div className="py-5 space-y-5 text-sm">
          {/* Description */}
          {activity.description && (
            <div className="space-y-1.5">
              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Overview
              </h5>
              <p className="text-foreground/90 leading-relaxed text-sm">
                {activity.description}
              </p>
            </div>
          )}

          {/* Location & Map Links */}
          {locationLabel && (
            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/70 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">
                    {locationLabel}
                  </p>
                  {activity.address && activity.address !== locationLabel && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {activity.address}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                {onLocateOnMap && activity.locationLat && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onClose();
                      onLocateOnMap(activity);
                    }}
                    className="h-9 min-h-[36px] text-xs rounded-xl flex-1 gap-1.5 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Locate on Map
                  </Button>
                )}

                {googleMapsUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="h-9 min-h-[36px] text-xs rounded-xl flex-1 gap-1.5 border-border/70 hover:bg-accent cursor-pointer"
                  >
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Google Maps
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Notes / Tips */}
          {activity.notes && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
              <h5 className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                Travel Note / Tip
              </h5>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {activity.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <SheetFooter className="flex flex-row items-center gap-3 pt-2">
          {!readOnly && onEdit && (
            <Button
              onClick={() => {
                onClose();
                onEdit(activity);
              }}
              className="flex-1 min-h-[44px] rounded-2xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold gap-2 shadow-sm cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
              Edit Stop
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 min-h-[44px] rounded-2xl border-border/70 hover:bg-accent font-medium cursor-pointer"
          >
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
