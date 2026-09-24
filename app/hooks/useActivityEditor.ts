import { useState } from "react";
import { Activity } from "../components/types";

/**
 * Interface for editing activity state
 */
export interface EditingActivity {
  dayIndex: number;
  activityIndex: number;
  activity: Activity;
}

/**
 * Custom hook for managing activity editing state
 */
export function useActivityEditor() {
  const [editingActivity, setEditingActivity] =
    useState<EditingActivity | null>(null);
  const [highlightedActivity, setHighlightedActivity] = useState<
    Activity | undefined
  >();

  /**
   * Start editing an activity
   */
  const startEditing = (
    dayIndex: number,
    activityIndex: number,
    activity: Activity
  ): void => {
    setEditingActivity({ dayIndex, activityIndex, activity });
  };

  /**
   * Cancel editing
   */
  const cancelEditing = (): void => {
    setEditingActivity(null);
  };

  /**
   * Check if currently editing
   */
  const isEditing = (): boolean => {
    return editingActivity !== null;
  };

  /**
   * Highlight an activity (for map view)
   */
  const highlightActivity = (activity?: Activity): void => {
    setHighlightedActivity(activity);
  };

  /**
   * Clear highlighted activity
   */
  const clearHighlight = (): void => {
    setHighlightedActivity(undefined);
  };

  return {
    editingActivity,
    highlightedActivity,
    startEditing,
    cancelEditing,
    isEditing,
    highlightActivity,
    clearHighlight,
  };
}
