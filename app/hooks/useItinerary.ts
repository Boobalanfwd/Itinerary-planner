import { useState, useRef, useEffect } from "react";
import {
  ItineraryData,
  Activity,
  GenerateItineraryResponse,
  ListItinerariesResponse,
} from "../components/types";
import { getDestinationImage } from "../lib/unsplashService";

/**
 * Custom hook for managing itinerary state, generation progress, and operations.
 * Implements Server-Sent Events (SSE) streaming with polling fallback for real-time progress.
 */
export function useItinerary() {
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedItineraries, setSavedItineraries] = useState<ItineraryData[]>([]);

  // Real-time generation progress states
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState("");

  const activeEventSourceRef = useRef<EventSource | null>(null);
  const activePollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup SSE and polling on unmount
  useEffect(() => {
    return () => {
      if (activeEventSourceRef.current) {
        activeEventSourceRef.current.close();
        activeEventSourceRef.current = null;
      }
      if (activePollIntervalRef.current) {
        clearInterval(activePollIntervalRef.current);
        activePollIntervalRef.current = null;
      }
    };
  }, []);

  /**
   * Helper to fetch full itinerary and complete generation
   */
  const completeWithItineraryId = async (
    itineraryId: string,
    resolve: (val: boolean) => void
  ) => {
    try {
      setProgress(100);
      setProgressStep("Finalizing your bespoke itinerary...");
      const itResponse = await fetch(`/api/itineraries/${itineraryId}`);
      const itData = await itResponse.json();

      if (itData.success && itData.data) {
        const imageUrl = await getDestinationImage(itData.data.destination);
        setItineraryData({
          ...itData.data,
          image: itData.data.image || imageUrl,
        });
        setLoading(false);
        resolve(true);
        return;
      }
      throw new Error("Could not retrieve created itinerary");
    } catch (fetchErr: any) {
      console.error("Error fetching completed itinerary:", fetchErr);
      setError("Itinerary created, but failed to load details. Please check your dashboard.");
      setLoading(false);
      resolve(false);
    }
  };

  /**
   * Fallback polling loop when SSE is unavailable or disconnected
   */
  const startPolling = (
    jobId: string,
    resolve: (val: boolean) => void
  ) => {
    if (activePollIntervalRef.current) {
      clearInterval(activePollIntervalRef.current);
    }

    let attempts = 0;
    const maxAttempts = 60; // 60s timeout

    activePollIntervalRef.current = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        if (activePollIntervalRef.current) {
          clearInterval(activePollIntervalRef.current);
          activePollIntervalRef.current = null;
        }
        setError("Generation timed out. Please try again.");
        setLoading(false);
        resolve(false);
        return;
      }

      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const data = await res.json();

        if (data.success && data.job) {
          const job = data.job;
          if (typeof job.progress === "number") {
            setProgress(job.progress);
          }
          if (job.step) {
            setProgressStep(job.step);
          }

          if (job.status === "completed") {
            if (activePollIntervalRef.current) {
              clearInterval(activePollIntervalRef.current);
              activePollIntervalRef.current = null;
            }
            const itineraryId = job.result?.itineraryId;
            if (itineraryId) {
              await completeWithItineraryId(itineraryId, resolve);
            } else {
              setLoading(false);
              resolve(true);
            }
          } else if (job.status === "failed") {
            if (activePollIntervalRef.current) {
              clearInterval(activePollIntervalRef.current);
              activePollIntervalRef.current = null;
            }
            setError(job.error || "Generation encountered an issue.");
            setLoading(false);
            resolve(false);
          }
        }
      } catch (err) {
        console.warn("Polling error:", err);
      }
    }, 1000);
  };

  /**
   * Generate a new itinerary using AI with live SSE progress tracking
   */
  const generateItinerary = async (prompt: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setProgress(5);
    setProgressStep("Contacting AI travel architect...");

    // Clear any previous active streams/intervals
    if (activeEventSourceRef.current) {
      activeEventSourceRef.current.close();
      activeEventSourceRef.current = null;
    }
    if (activePollIntervalRef.current) {
      clearInterval(activePollIntervalRef.current);
      activePollIntervalRef.current = null;
    }

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, async: true }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to initiate itinerary generation");
      }

      // Synchronous return fallback
      if (result.data) {
        const imageUrl = await getDestinationImage(result.data.destination);
        setItineraryData({ ...result.data, image: imageUrl });
        setProgress(100);
        setProgressStep("Itinerary ready!");
        setLoading(false);
        return true;
      }

      // Asynchronous SSE stream tracking
      const jobId = result.jobId;
      if (!jobId) {
        throw new Error("No job identifier returned by generator");
      }

      return new Promise<boolean>((resolve) => {
        let isDone = false;

        const eventSource = new EventSource(`/api/jobs/${jobId}/stream`);
        activeEventSourceRef.current = eventSource;

        const cleanup = () => {
          if (activeEventSourceRef.current) {
            activeEventSourceRef.current.close();
            activeEventSourceRef.current = null;
          }
        };

        eventSource.onmessage = async (e) => {
          if (isDone) return;
          try {
            const data = JSON.parse(e.data);
            if (typeof data.progress === "number") {
              setProgress(data.progress);
            }
            if (data.step) {
              setProgressStep(data.step);
            }

            if (data.status === "completed") {
              isDone = true;
              cleanup();

              const itineraryId = data.result?.itineraryId;
              if (itineraryId) {
                await completeWithItineraryId(itineraryId, resolve);
              } else {
                setLoading(false);
                resolve(true);
              }
            } else if (data.status === "failed") {
              isDone = true;
              cleanup();
              setError(data.error || "Generation encountered an issue.");
              setLoading(false);
              resolve(false);
            }
          } catch (err) {
            console.error("SSE parse error:", err);
          }
        };

        eventSource.onerror = (err) => {
          if (isDone) return;
          console.warn("SSE connection error; switching to HTTP polling:", err);
          cleanup();
          // Fallback to polling
          startPolling(jobId, resolve);
        };
      });
    } catch (err: any) {
      console.error("Generation error:", err);
      const errorMsg = err.message?.includes("overloaded")
        ? "The AI service is currently overloaded. Please wait a moment and try again."
        : err.message?.includes("quota") || err.message?.includes("QUOTA_EXCEEDED")
        ? "Monthly quota reached. Please upgrade your plan for more itineraries."
        : err.message?.includes("Unauthorized") || err.message?.includes("Authentication")
        ? "Please sign in to generate itineraries."
        : err.message || "Our AI travel agents are currently overwhelmed. Please try again.";

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

    const newData = { ...itineraryData };
    newData.days[dayIndex].activities[activityIndex] = updatedActivity;
    setItineraryData(newData);

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
        setSavedItineraries((prev) => prev.filter((i) => i.id !== id));
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
    if (activeEventSourceRef.current) {
      activeEventSourceRef.current.close();
      activeEventSourceRef.current = null;
    }
    if (activePollIntervalRef.current) {
      clearInterval(activePollIntervalRef.current);
      activePollIntervalRef.current = null;
    }
    setItineraryData(null);
    setError(null);
    setLoading(false);
    setProgress(0);
    setProgressStep("");
  };

  return {
    itineraryData,
    loading,
    error,
    progress,
    progressStep,
    savedItineraries,
    generateItinerary,
    loadItineraries,
    loadItinerary,
    updateActivity,
    deleteItinerary,
    clearItinerary,
  };
}
