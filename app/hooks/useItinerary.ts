import { useState } from "react";
import {
  ItineraryData,
  Activity,
  GenerateItineraryResponse,
  ListItinerariesResponse,
} from "../components/types";
import { getDestinationImage } from "../lib/unsplashService";

/**
 * Custom hook for managing itinerary state and operations
 */
export function useItinerary() {
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedItineraries, setSavedItineraries] = useState<ItineraryData[]>([]);

  /**
   * Generate a new itinerary using AI and save to database
   */
  const generateItinerary = async (prompt: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Call API to generate and save itinerary
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const result: GenerateItineraryResponse = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to generate itinerary");
      }

      // Get high-quality image from Unsplash
      const imageUrl = await getDestinationImage(result.data.destination);

      // Update state with complete itinerary data
      setItineraryData({ ...result.data, image: imageUrl });
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error("Generation error:", err);

      // Parse error into user-friendly message
      const errorMsg = err.message?.includes("overloaded")
        ? "The AI service is currently overloaded. Please wait a moment and try again."
        : err.message?.includes("quota")
        ? "API quota exceeded. Please try again later or check your API key."
        : err.message?.includes("Unauthorized")
        ? "Please sign in to generate itineraries."
        : err.message?.includes("invalid")
        ? "Invalid API configuration. Please check your API key."
        : "Our AI travel agents are currently overwhelmed. Please try again.";
      setError(errorMsg);
      setLoading(false);
      return false;
    }
  };

  /**
   * Load saved itineraries from database
   */
  const loadItineraries = async (): Promise<void> => {
    try {
      const response = await fetch("/api/itineraries");
      const result: ListItinerariesResponse = await response.json();

      if (result.success && result.data) {
        setSavedItineraries(result.data);
      }
    } catch (err) {
      console.error("Error loading itineraries:", err);
    }
  };

  /**
   * Load a specific itinerary by ID
   */
  const loadItinerary = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch(`/api/itineraries/${id}`);
      const result = await response.json();

      if (result.success && result.data) {
        setItineraryData(result.data);
      }
    } catch (err) {
      console.error("Error loading itinerary:", err);
      setError("Failed to load itinerary");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update an activity in the itinerary
   */
  const updateActivity = async (
    dayIndex: number,
    activityIndex: number,
    updatedActivity: Activity
  ): Promise<void> => {
    if (!itineraryData) return;

    // Update local state immediately for responsive UI
    const newData = { ...itineraryData };
    newData.days[dayIndex].activities[activityIndex] = updatedActivity;
    setItineraryData(newData);

    // If activity has an ID, update in database
    if (updatedActivity.id) {
      try {
        await fetch(`/api/activities/${updatedActivity.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedActivity),
        });
      } catch (err) {
        console.error("Error updating activity:", err);
        // Revert on error
        setItineraryData(itineraryData);
      }
    }
  };

  /**
   * Delete an itinerary
   */
  const deleteItinerary = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/itineraries/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        // Remove from saved itineraries list
        setSavedItineraries((prev) => prev.filter((i) => i.id !== id));

        // Clear current itinerary if it's the one being deleted
        if (itineraryData?.id === id) {
          setItineraryData(null);
        }

        return true;
      }

      return false;
    } catch (err) {
      console.error("Error deleting itinerary:", err);
      return false;
    }
  };

  /**
   * Clear current itinerary and reset state
   */
  const clearItinerary = (): void => {
    setItineraryData(null);
    setError(null);
    setLoading(false);
  };

  return {
    itineraryData,
    loading,
    error,
    savedItineraries,
    generateItinerary,
    loadItineraries,
    loadItinerary,
    updateActivity,
    deleteItinerary,
    clearItinerary,
  };
}
