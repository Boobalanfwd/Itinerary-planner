"use client";

import { useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";

export interface UndoableActionOptions {
  id: string;
  type: "delete_activity" | "reorder_activities" | "edit_activity" | string;
  description: string;
  durationMs?: number;
  undo: () => void;
  commit: () => Promise<void> | void;
}

export interface ActionHistoryEntry {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
}

interface PendingActionInternal {
  id: string;
  timer: ReturnType<typeof setTimeout>;
  toastId: string | number;
  undo: () => void;
  commit: () => Promise<void> | void;
}

const MAX_HISTORY_LENGTH = 10;

export function useUndoableActions() {
  const pendingActionsRef = useRef<Map<string, PendingActionInternal>>(new Map());
  const historyRef = useRef<ActionHistoryEntry[]>([]);

  // Cleanup & auto-commit on unmount so no pending changes are lost
  useEffect(() => {
    const pending = pendingActionsRef.current;
    return () => {
      pending.forEach((action) => {
        clearTimeout(action.timer);
        try {
          action.commit();
        } catch (err) {
          console.error(`[useUndoableActions] Error committing action ${action.id} on unmount:`, err);
        }
      });
      pending.clear();
    };
  }, []);

  const undoAction = useCallback((actionId: string) => {
    const action = pendingActionsRef.current.get(actionId);
    if (!action) return;

    // Clear execution timer
    clearTimeout(action.timer);
    pendingActionsRef.current.delete(actionId);

    // Dismiss existing toast
    toast.dismiss(action.toastId);

    // Execute undo callback to restore state
    try {
      action.undo();
      toast.info("Action undone", { duration: 2500 });
    } catch (err) {
      console.error(`[useUndoableActions] Error during undo for ${actionId}:`, err);
      toast.error("Failed to undo action");
    }
  }, []);

  const scheduleAction = useCallback(
    ({
      id,
      type,
      description,
      durationMs = 5000,
      undo,
      commit,
    }: UndoableActionOptions) => {
      // If an existing action with the same ID is pending, commit it immediately before scheduling new
      const existing = pendingActionsRef.current.get(id);
      if (existing) {
        clearTimeout(existing.timer);
        toast.dismiss(existing.toastId);
        try {
          existing.commit();
        } catch (err) {
          console.error(`[useUndoableActions] Error auto-committing superseded action ${id}:`, err);
        }
        pendingActionsRef.current.delete(id);
      }

      // Record in history stack
      historyRef.current.unshift({
        id,
        type,
        description,
        timestamp: new Date(),
      });
      if (historyRef.current.length > MAX_HISTORY_LENGTH) {
        historyRef.current.pop();
      }

      // Trigger interactive Sonner toast with Undo action button
      const toastId = toast(description, {
        duration: durationMs,
        action: {
          label: "Undo",
          onClick: () => undoAction(id),
        },
      });

      // Schedule delayed DB sync / commit
      const timer = setTimeout(async () => {
        pendingActionsRef.current.delete(id);
        try {
          await commit();
        } catch (err) {
          console.error(`[useUndoableActions] Error committing action ${id}:`, err);
          // Rollback if commit failed
          try {
            undo();
            toast.error("Failed to sync change with server, restored");
          } catch (rollbackErr) {
            console.error(`[useUndoableActions] Error during rollback for ${id}:`, rollbackErr);
          }
        }
      }, durationMs);

      pendingActionsRef.current.set(id, {
        id,
        timer,
        toastId,
        undo,
        commit,
      });

      return toastId;
    },
    [undoAction]
  );

  const getHistory = useCallback(() => {
    return [...historyRef.current];
  }, []);

  const hasPendingActions = useCallback(() => {
    return pendingActionsRef.current.size > 0;
  }, []);

  return {
    scheduleAction,
    undoAction,
    getHistory,
    hasPendingActions,
  };
}

export default useUndoableActions;
