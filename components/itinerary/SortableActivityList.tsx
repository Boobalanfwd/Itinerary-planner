"use client";

import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Activity } from "@/app/components/types";
import { SortableActivityCard } from "./SortableActivityCard";
import { toast } from "sonner";

interface SortableActivityListProps {
  dayId?: string;
  dayNumber: number;
  dayColor?: string;
  activities: Activity[];
  highlightActivityId?: string;
  readOnly?: boolean;
  onHoverActivity?: (id: string) => void;
  onLeaveActivity?: () => void;
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (activityId: string) => Promise<void> | void;
  onReorderActivities: (updatedActivities: Activity[]) => void;
}

export function SortableActivityList({
  dayId,
  dayNumber,
  dayColor = "#0D9488",
  activities,
  highlightActivityId,
  readOnly = false,
  onHoverActivity,
  onLeaveActivity,
  onEditActivity,
  onDeleteActivity,
  onReorderActivities,
}: SortableActivityListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before drag begins, preventing accidental clicks
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const itemIds = activities.map((a, idx) => a.id || `act-${dayNumber}-${idx}`);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = itemIds.indexOf(active.id as string);
    const newIndex = itemIds.indexOf(over.id as string);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistic reorder
    const reordered = arrayMove(activities, oldIndex, newIndex).map((act, pos) => ({
      ...act,
      position: pos,
    }));

    onReorderActivities(reordered);

    // Persist to backend if dayId and valid activity IDs exist
    if (dayId) {
      const validActivityIds = reordered
        .map((a) => a.id)
        .filter((id): id is string => Boolean(id));

      if (validActivityIds.length === reordered.length) {
        try {
          const res = await fetch(`/api/days/${dayId}/reorder`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ activityIds: validActivityIds }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || "Failed to persist order");
          }

          toast.success("Stop order updated", { duration: 2000 });
        } catch (err: any) {
          console.error("Reorder error:", err);
          toast.error("Failed to save new order to server");
          // Revert to original
          onReorderActivities(activities);
        }
      }
    }
  };

  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (activities.length === 0) {
    return (
      <div className="py-8 px-4 text-center border-2 border-dashed border-border/60 rounded-2xl bg-muted/20">
        <p className="text-sm text-muted-foreground">No stops planned for this day yet.</p>
      </div>
    );
  }

  // During SSR / initial hydration before mount, render static list to prevent any aria attribute mismatch
  if (!isMounted) {
    return (
      <div className="space-y-3">
        {activities.map((activity, idx) => (
          <SortableActivityCard
            key={activity.id || `act-${dayNumber}-${idx}`}
            activity={activity}
            index={idx}
            dayNumber={dayNumber}
            dayColor={dayColor}
            isHighlighted={highlightActivityId === activity.id}
            readOnly={readOnly}
            onHover={onHoverActivity}
            onLeave={onLeaveActivity}
            onEdit={onEditActivity}
            onDelete={onDeleteActivity}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      id={`dnd-day-ctx-${dayNumber}`}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {activities.map((activity, idx) => (
            <SortableActivityCard
              key={activity.id || `act-${dayNumber}-${idx}`}
              activity={activity}
              index={idx}
              dayNumber={dayNumber}
              dayColor={dayColor}
              isHighlighted={highlightActivityId === activity.id}
              readOnly={readOnly}
              onHover={onHoverActivity}
              onLeave={onLeaveActivity}
              onEdit={onEditActivity}
              onDelete={onDeleteActivity}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
