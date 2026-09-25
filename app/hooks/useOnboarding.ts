"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

const ONBOARDING_LOCAL_STORAGE_KEY = "wander_onboarding_complete";

export interface OnboardingState {
  isOpen: boolean;
  currentStep: number;
  isLoading: boolean;
  isCompleted: boolean;
  totalSteps: number;
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;
  skipOnboarding: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  openOnboarding: (step?: number) => void;
  closeOnboarding: () => void;
}

export function useOnboarding(): OnboardingState {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const totalSteps = 3;

  // Initialize and check whether onboarding has been completed
  useEffect(() => {
    let isCancelled = false;

    async function checkOnboardingStatus() {
      if (typeof window === "undefined") return;

      // 1. Fast local check
      const localCompleted = localStorage.getItem(ONBOARDING_LOCAL_STORAGE_KEY) === "true";
      if (localCompleted) {
        if (!isCancelled) {
          setIsCompleted(true);
          setIsLoading(false);
        }
        return;
      }

      // 2. Server check if authenticated
      if (status === "authenticated" && session?.user) {
        try {
          const res = await fetch("/api/users/preferences");
          if (res.ok) {
            const data = await res.json();
            const serverCompleted = Boolean(data.preferences?.onboardingComplete);

            if (serverCompleted) {
              localStorage.setItem(ONBOARDING_LOCAL_STORAGE_KEY, "true");
              if (!isCancelled) {
                setIsCompleted(true);
                setIsLoading(false);
              }
              return;
            }
          }
        } catch (err) {
          console.warn("[useOnboarding] Error checking user preferences:", err);
        }
      }

      // If not completed and not loading session, open with slight delay for smooth entry
      if (!isCancelled) {
        setIsLoading(false);
        setIsCompleted(false);
        // Delay opening modal slightly to let page paint
        const timer = setTimeout(() => {
          if (!isCancelled) setIsOpen(true);
        }, 700);
        return () => clearTimeout(timer);
      }
    }

    if (status !== "loading") {
      checkOnboardingStatus();
    }

    return () => {
      isCancelled = true;
    };
  }, [status, session?.user]);

  const saveCompletion = useCallback(async (isSkipped = false) => {
    setIsCompleted(true);
    setIsOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(ONBOARDING_LOCAL_STORAGE_KEY, "true");
    }

    // Persist to server if user is authenticated
    if (session?.user) {
      try {
        await fetch("/api/users/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            onboardingComplete: true,
            onboardingStep: currentStep,
            onboardingDismissedAt: new Date().toISOString(),
            onboardingSkipped: isSkipped,
          }),
        });
      } catch (err) {
        console.warn("[useOnboarding] Failed to save completion to server:", err);
      }
    }
  }, [session?.user, currentStep]);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev < totalSteps) return prev + 1;
      saveCompletion(false);
      return prev;
    });
  }, [totalSteps, saveCompletion]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  }, []);

  const setStep = useCallback((step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  }, [totalSteps]);

  const skipOnboarding = useCallback(async () => {
    await saveCompletion(true);
  }, [saveCompletion]);

  const completeOnboarding = useCallback(async () => {
    await saveCompletion(false);
  }, [saveCompletion]);

  const resetOnboarding = useCallback(async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ONBOARDING_LOCAL_STORAGE_KEY);
    }
    setIsCompleted(false);
    setCurrentStep(1);
    setIsOpen(true);

    if (session?.user) {
      try {
        await fetch("/api/users/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reset: true }),
        });
      } catch (err) {
        console.warn("[useOnboarding] Failed to reset preferences:", err);
      }
    }
  }, [session?.user]);

  const openOnboarding = useCallback((step = 1) => {
    setCurrentStep(step);
    setIsOpen(true);
  }, []);

  const closeOnboarding = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    currentStep,
    isLoading,
    isCompleted,
    totalSteps,
    nextStep,
    prevStep,
    setStep,
    skipOnboarding,
    completeOnboarding,
    resetOnboarding,
    openOnboarding,
    closeOnboarding,
  };
}
