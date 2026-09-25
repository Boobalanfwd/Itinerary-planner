"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Clock,
  MapPin,
  Utensils,
  Plane,
  Bed,
  Music,
  Camera,
  ShoppingBag,
  Compass,
  Info,
  MessageSquare,
  Vote,
} from "lucide-react";
import { Activity } from "@/app/components/types";
import { ActivityActionsMenu } from "./ActivityActionsMenu";

interface SortableActivityCardProps {
  activity: Activity;
  index: number;
  dayNumber: number;
  dayColor?: string;
  isHighlighted?: boolean;
  readOnly?: boolean;
  commentCount?: number;
  activeEditor?: { userName: string; userColor?: string };
  isLocked?: boolean;
  linkedPoll?: any;
  onHover?: (id: string) => void;
  onLeave?: () => void;
  onEdit: (activity: Activity) => void;
  onDelete: (activityId: string) => Promise<void> | void;
  onOpenComments?: (activity: Activity) => void;
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

const getActivityBadgeStyle = (type: string) => {
  const lower = (type || "").toLowerCase();
  if (lower.includes("food") || lower.includes("restaurant") || lower.includes("dining")) {
    return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20";
  }
  if (lower.includes("travel") || lower.includes("flight") || lower.includes("transit") || lower.includes("transport")) {
    return "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20";
  }
  if (lower.includes("hotel") || lower.includes("accommodation") || lower.includes("stay")) {
    return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20";
  }
  if (lower.includes("nature") || lower.includes("park") || lower.includes("outdoor")) {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
  }
  if (lower.includes("culture") || lower.includes("sightseeing") || lower.includes("art") || lower.includes("museum")) {
    return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20";
  }
  return "bg-muted/70 text-muted-foreground border-border/50";
};

export function SortableActivityCard({
  activity,
  index,
  dayNumber,
  dayColor = "#0D9488",
  isHighlighted = false,
  readOnly = false,
  commentCount = 0,
  activeEditor,
  isLocked = false,
  linkedPoll,
  onHover,
  onLeave,
  onEdit,
  onDelete,
  onOpenComments,
}: SortableActivityCardProps) {
  const cardId = activity.id || `act-${dayNumber}-${index}`;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cardId, disabled: readOnly });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.6 : 1,
  };

  const Icon = getActivityIcon(activity.type);
  const locationLabel = activity.locationName || activity.location?.name || activity.address;
  const badgeClass = getActivityBadgeStyle(activity.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onMouseEnter={() => activity.id && onHover?.(activity.id)}
      onMouseLeave={() => onLeave?.()}
      className={`group relative flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
        isDragging
          ? "bg-card shadow-2xl border-primary ring-2 ring-primary/40 scale-[1.02]"
          : isHighlighted
          ? "bg-card border-primary ring-2 ring-primary/30 shadow-lg shadow-primary/10"
          : "bg-card/70 hover:bg-card border-border/70 hover:border-border hover:shadow-soft"
      }`}
    >
      {/* Drag Handle */}
      {!readOnly && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-0.5 -ml-1.5 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground/40 hover:text-foreground cursor-grab active:cursor-grabbing rounded-xl hover:bg-muted/60 transition-colors"
          title="Drag to reorder stop"
          aria-label="Drag handle"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}

      {/* Stop Sequence Number Pin */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs mt-0.5"
        style={{ backgroundColor: dayColor }}
      >
        {index + 1}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {/* Time Pill */}
            {activity.time && (
              <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                <Clock className="w-3 h-3" />
                {activity.time}
              </span>
            )}

            {/* Category Icon Badge */}
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border capitalize ${badgeClass}`}
            >
              <Icon className="w-3 h-3" />
              {activity.type}
            </span>

            {/* Duration */}
            {activity.duration && (
              <span className="text-[11px] font-mono font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full border border-border/40">
                {activity.duration}m
              </span>
            )}

            {/* Cost */}
            {activity.cost !== undefined && activity.cost !== null && activity.cost > 0 && (
              <span className="inline-flex items-center text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                ${activity.cost}
              </span>
            )}

            {/* Active Editor Presence Badge */}
            {activeEditor && (
              <span
                className="animate-pulse inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs"
                style={{ backgroundColor: activeEditor.userColor || "#F59E0B" }}
              >
                ✏️ {activeEditor.userName} editing
              </span>
            )}

            {/* Linked Poll Indicator */}
            {linkedPoll && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                <Vote className="w-2.5 h-2.5" />
                Poll Attached
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Comment Thread Trigger Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenComments?.(activity);
              }}
              title="Open discussion on this activity"
              className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-amber-600 transition-colors px-2 py-1 rounded-lg hover:bg-amber-500/10"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{commentCount > 0 ? commentCount : ""}</span>
            </button>

            {/* Action Menu */}
            {!readOnly && (
              <ActivityActionsMenu
                activity={activity}
                dayNumber={dayNumber}
                onEdit={() => onEdit(activity)}
                onDelete={onDelete}
              />
            )}
          </div>
        </div>

        {/* Title */}
        <h4 className="font-bold text-foreground text-base tracking-tight leading-snug">
          {activity.title}
        </h4>

        {/* Description */}
        {(activity.description || activity.desc) && (
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {activity.description || activity.desc}
          </p>
        )}

        {/* Location & Travel Footnote */}
        <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {locationLabel && (
            <div className="flex items-center gap-1.5 text-foreground/80 font-medium truncate max-w-[280px]">
              <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="truncate">{locationLabel}</span>
            </div>
          )}

          {activity.notes && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground italic truncate max-w-[280px]">
              <Info className="w-3.5 h-3.5 text-muted-foreground/70 flex-shrink-0" />
              <span className="truncate">{activity.notes}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
