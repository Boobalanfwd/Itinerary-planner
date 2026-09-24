import { useState } from "react";
import { ViewState } from "../components/types";

/**
 * Custom hook for managing view state and navigation
 */
export function useViewState() {
  const [view, setView] = useState<ViewState>("landing");

  /**
   * Navigate to landing page
   */
  const navigateToLanding = (): void => {
    setView("landing");
  };

  /**
   * Navigate to loading view
   */
  const navigateToLoading = (): void => {
    setView("loading");
  };

  /**
   * Navigate to itinerary view
   */
  const navigateToItinerary = (): void => {
    setView("itinerary");
  };

  /**
   * Navigate to map view
   */
  const navigateToMap = (): void => {
    setView("map");
  };

  /**
   * Navigate to error view
   */
  const navigateToError = (): void => {
    setView("error");
  };

  /**
   * Check if currently on a specific view
   */
  const isView = (viewName: ViewState): boolean => {
    return view === viewName;
  };

  return {
    view,
    navigateToLanding,
    navigateToLoading,
    navigateToItinerary,
    navigateToMap,
    navigateToError,
    isView,
  };
}
