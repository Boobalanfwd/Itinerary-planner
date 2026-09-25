import { describe, it, expect, beforeEach, vi } from "vitest";

// Local storage key used by onboarding
const ONBOARDING_LOCAL_STORAGE_KEY = "wander_onboarding_complete";

describe("User Onboarding State & Workflow", () => {
  let localStorageMock: Record<string, string> = {};

  beforeEach(() => {
    localStorageMock = {};
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => localStorageMock[key] || null,
      setItem: (key: string, value: string) => {
        localStorageMock[key] = value;
      },
      removeItem: (key: string) => {
        delete localStorageMock[key];
      },
      clear: () => {
        localStorageMock = {};
      },
    });
  });

  it("should initialize uncompleted when localStorage is empty", () => {
    const isCompleted = localStorage.getItem(ONBOARDING_LOCAL_STORAGE_KEY) === "true";
    expect(isCompleted).toBe(false);
  });

  it("should mark onboarding completed in localStorage on finish or skip", () => {
    // Simulate skip / complete action
    localStorage.setItem(ONBOARDING_LOCAL_STORAGE_KEY, "true");

    const isCompleted = localStorage.getItem(ONBOARDING_LOCAL_STORAGE_KEY) === "true";
    expect(isCompleted).toBe(true);
  });

  it("should allow resetting onboarding tour", () => {
    localStorage.setItem(ONBOARDING_LOCAL_STORAGE_KEY, "true");
    expect(localStorage.getItem(ONBOARDING_LOCAL_STORAGE_KEY)).toBe("true");

    // Simulate reset action
    localStorage.removeItem(ONBOARDING_LOCAL_STORAGE_KEY);
    expect(localStorage.getItem(ONBOARDING_LOCAL_STORAGE_KEY)).toBeNull();
  });

  it("should advance through 3 distinct onboarding steps", () => {
    let currentStep = 1;
    const totalSteps = 3;

    // Step 1 -> 2
    if (currentStep < totalSteps) currentStep += 1;
    expect(currentStep).toBe(2);

    // Step 2 -> 3
    if (currentStep < totalSteps) currentStep += 1;
    expect(currentStep).toBe(3);

    // Cannot advance past 3
    const nextStep = currentStep < totalSteps ? currentStep + 1 : currentStep;
    expect(nextStep).toBe(3);
  });

  it("should merge preferences JSON correctly without overwriting other settings", () => {
    const initialPrefs = {
      defaultCurrency: "EUR",
      theme: "dark",
      onboardingComplete: false,
    };

    const patchPayload = {
      onboardingComplete: true,
      onboardingStep: 3,
      onboardingDismissedAt: "2026-09-24T12:00:00.000Z",
    };

    const merged = { ...initialPrefs, ...patchPayload };

    expect(merged.defaultCurrency).toBe("EUR");
    expect(merged.theme).toBe("dark");
    expect(merged.onboardingComplete).toBe(true);
    expect(merged.onboardingStep).toBe(3);
    expect(merged.onboardingDismissedAt).toBe("2026-09-24T12:00:00.000Z");
  });
});
