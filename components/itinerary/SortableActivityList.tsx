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
import { useUndoableActions } from "@/app/hooks/useUndoableActions";

interface SortableActivityListProps {
  dayId?: string;
  dayNumber: number;
  dayColor?: string;
  activities: Activity[];
  highlightActivityId?: string;
  readOnly?: boolean;
  commentCounts?: Record<string, number>;
  focusedFields?: Record<string, { userId: string; userName: string; userColor: string }>;
  activityLocks?: Record<string, { userId: string; userName: string }>;
  linkedPollsByActivityId?: Record<string, any>;
  onHoverActivity?: (id: string) => void;
  onLeaveActivity?: () => void;
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (activityId: string) => Promise<void> | void;
  onReorderActivities: (updatedActivities: Activity[]) => void;
  onOpenComments?: (activity: Activity) => void;
}

export function SortableActivityList({
  dayId,
  dayNumber,
  dayColor = "#0D9488",
  activities,
  highlightActivityId,
  readOnly = false,
  commentCounts = {},
  focusedFields = {},
  activityLocks = {},
  linkedPollsByActivityId = {},
  onHoverActivity,
  onLeaveActivity,
  onEditActivity,
  onDeleteActivity,
  onReorderActivities,
  onOpenComments,
}: SortableActivityListProps) {
  const { scheduleAction } = useUndoableActions();

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

    const originalActivities = [...activities];

    // Optimistic reorder
    const reordered = arrayMove(activities, oldIndex, newIndex).map((act, pos) => ({
      ...act,
      position: pos,
    }));

    onReorderActivities(reordered);

    // Schedule 4-second undoable reorder action (DB sync only if not undone)
    scheduleAction({
      id: `reorder-${dayId || dayNumber}`,
      type: "reorder_activities",
      description: "Stop order updated",
      durationMs: 4000,
      undo: () => {
        onReorderActivities(originalActivities);
      },
      commit: async () => {
        if (!dayId) return;
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
          } catch (err: any) {
            console.error("Reorder error:", err);
            onReorderActivities(originalActivities);
            toast.error("Failed to save new order to server, restored");
          }
        }
      },
    });
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
        {activities.map((activity, idx) => {
          const actId = activity.id || `act-${dayNumber}-${idx}`;
          const activeEditor = focusedFields[actId];
          const isLocked = Boolean(activityLocks[actId]);
          const commentCount = commentCounts[`activity:${actId}`] || 0;
          const linkedPoll = linkedPollsByActivityId[actId];

          return (
            <SortableActivityCard
              key={actId}
              activity={activity}
              index={idx}
              dayNumber={dayNumber}
              dayColor={dayColor}
              isHighlighted={highlightActivityId === activity.id}
              readOnly={readOnly}
              commentCount={commentCount}
              activeEditor={activeEditor}
              isLocked={isLocked}
              linkedPoll={linkedPoll}
              onHover={onHoverActivity}
              onLeave={onLeaveActivity}
              onEdit={onEditActivity}
              onDelete={onDeleteActivity}
              onOpenComments={onOpenComments}
            />
          );
        })}
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
          {activities.map((activity, idx) => {
            const actId = activity.id || `act-${dayNumber}-${idx}`;
            const activeEditor = focusedFields[actId];
            const isLocked = Boolean(activityLocks[actId]);
            const commentCount = commentCounts[`activity:${actId}`] || 0;
            const linkedPoll = linkedPollsByActivityId[actId];

            return (
              <SortableActivityCard
                key={actId}
                activity={activity}
                index={idx}
                dayNumber={dayNumber}
                dayColor={dayColor}
                isHighlighted={highlightActivityId === activity.id}
                readOnly={readOnly}
                commentCount={commentCount}
                activeEditor={activeEditor}
                isLocked={isLocked}
                linkedPoll={linkedPoll}
                onHover={onHoverActivity}
                onLeave={onLeaveActivity}
                onEdit={onEditActivity}
                onDelete={onDeleteActivity}
                onOpenComments={onOpenComments}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
