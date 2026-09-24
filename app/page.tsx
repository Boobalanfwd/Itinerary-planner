"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle } from "lucide-react";
import { CornerTab } from "./components/ui/CornerTab";
import { LandingNav } from "./components/ui/LandingNav";
import { LandingHero } from "./components/ui/LandingHero";
import { FloatingDock } from "./components/ui/FloatingDock";
import { HowItWorks } from "./components/ui/HowItWorks";
import { LandingFeatureGrid } from "./components/ui/LandingFeatureGrid";
import { ExampleItineraryPreview } from "./components/ui/ExampleItineraryPreview";
import { FaqSection } from "./components/ui/FaqSection";
import { LandingCTA } from "./components/ui/LandingCTA";
import { LandingFooter } from "./components/ui/LandingFooter";
import { LoadingView } from "./components/views/LoadingView";
import { ErrorView } from "./components/views/ErrorView";
import { ItineraryView } from "./components/views/ItineraryView";
import { MapView } from "./components/views/MapView";
import { EditActivityModal } from "./components/ui/EditActivityModal";
import { AIChatAssistant } from "./components/ui/AIChatAssistant";
import { InstallPrompt } from "./components/ui/InstallPrompt";
import { SmartRecommendations } from "./components/ui/SmartRecommendations";
import { UpgradeModal } from "./components/ui/UpgradeModal";
import { useItinerary } from "./hooks/useItinerary";
import { useViewState } from "./hooks/useViewState";
import { useActivityEditor } from "./hooks/useActivityEditor";
import { useSubscription } from "./hooks/useSubscription";

/**
 * Main Page Component — Wander.AI Landing & In-App Generator Views
 */
export default function Page() {
  // Get authentication status
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  // Chat assistant state
  const [showChat, setShowChat] = useState(false);

  // Subscription state
  const { canCreateItinerary, tier } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Custom hooks for state management
  const {
    itineraryData,
    loading,
    error,
    generateItinerary,
    updateActivity,
    clearItinerary,
  } = useItinerary();

  const {
    view,
    navigateToLanding,
    navigateToLoading,
    navigateToItinerary,
    navigateToMap,
    navigateToError,
  } = useViewState();

  const {
    editingActivity,
    highlightedActivity,
    startEditing,
    cancelEditing,
    highlightActivity,
    clearHighlight,
  } = useActivityEditor();

  /**
   * Handle itinerary generation
   */
  const handleGenerate = async (prompt: string) => {
    // Check subscription limits for authenticated users
    if (isAuthenticated && !canCreateItinerary()) {
      setShowUpgradeModal(true);
      return;
    }

    navigateToLoading();
    window.scrollTo({ top: 0, behavior: "smooth" });

    const success = await generateItinerary(prompt);

    if (success) {
      navigateToItinerary();
    } else {
      navigateToError();
    }
  };

  /**
   * Handle back to landing page
   */
  const handleBackToLanding = () => {
    navigateToLanding();
    clearItinerary();
    clearHighlight();
  };

  /**
   * Handle back from map view
   */
  const handleBackFromMap = () => {
    navigateToItinerary();
    clearHighlight();
  };

  /**
   * Handle activity save
   */
  const handleSaveActivity = (updatedActivity: any) => {
    if (!editingActivity) return;

    updateActivity(
      editingActivity.dayIndex,
      editingActivity.activityIndex,
      updatedActivity
    );
    cancelEditing();
  };

  /**
   * Handle view map
   */
  const handleViewMap = (activity?: any) => {
    highlightActivity(activity);
    navigateToMap();
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200 selection:bg-primary-soft selection:text-primary-soft-foreground">
      {/* Orange Corner Tab attached to top-right edge */}
      <CornerTab />

      {/* Top Navigation */}
      <LandingNav
        onViewChange={navigateToLanding}
        onExampleClick={() => {
          document.getElementById("example-itinerary")?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {/* Floating Bottom Dock (Mobile & Desktop) */}
      <FloatingDock
        onPlanTripClick={() => {
          if (view !== "landing") {
            navigateToLanding();
          }
          window.scrollTo({ top: 0, behavior: "smooth" });
          setTimeout(() => {
            document.getElementById("planner-input")?.focus();
          }, 100);
        }}
      />

      {/* Install Prompt */}
      <InstallPrompt />

      {/* Landing Page View */}
      {view === "landing" && (
        <main>
          {/* Hero with emerald accent, hand-drawn orange swoosh, and DottedWorldMap */}
          <LandingHero
            onGenerate={handleGenerate}
            isGenerating={loading}
            isAuthenticated={isAuthenticated}
            onSeeExample={() => {
              document.getElementById("example-itinerary")?.scrollIntoView({ behavior: "smooth" });
            }}
          />

          {/* How It Works (3 Steps) */}
          <HowItWorks />

          {/* Feature Grid */}
          <LandingFeatureGrid />

          {/* Example Itinerary Preview Card */}
          <ExampleItineraryPreview onPlanTrip={handleGenerate} />

          {/* FAQ Accordion */}
          <FaqSection />

          {/* Smart Recommendations (if previous data exists) */}
          {itineraryData && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-12">
              <SmartRecommendations
                currentDestination={itineraryData.destination}
                currentTags={itineraryData.tags}
                onSelectRecommendation={handleGenerate}
              />
            </div>
          )}

          {/* Final Call to Action */}
          <LandingCTA
            onPlanTripClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              document.getElementById("planner-input")?.focus();
            }}
          />

          {/* Footer with legal links */}
          <LandingFooter />
        </main>
      )}

      {/* Loading View */}
      {view === "loading" && <LoadingView />}

      {/* Error View */}
      {view === "error" && (
        <ErrorView
          message={error || "An error occurred"}
          onRetry={handleBackToLanding}
        />
      )}

      {/* Itinerary View */}
      {view === "itinerary" && itineraryData && (
        <ItineraryView
          data={itineraryData}
          onBack={handleBackToLanding}
          onEditActivity={startEditing}
          onViewMap={handleViewMap}
        />
      )}

      {/* Map View */}
      {view === "map" && itineraryData && (
        <MapView
          data={itineraryData}
          onBack={handleBackFromMap}
          highlightActivity={highlightedActivity}
        />
      )}

      {/* Edit Activity Modal */}
      {editingActivity && (
        <EditActivityModal
          activity={editingActivity.activity}
          dayNumber={itineraryData?.days[editingActivity.dayIndex].day || 1}
          onSave={handleSaveActivity}
          onClose={cancelEditing}
        />
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="Unlimited Itineraries"
        currentPlan={tier}
      />

      {/* AI Chat Assistant */}
      {showChat && (
        <AIChatAssistant
          onClose={() => setShowChat(false)}
          onItineraryGenerate={(prompt) => {
            handleGenerate(prompt);
            setShowChat(false);
          }}
        />
      )}

      {/* Floating Chat Button */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          aria-label="Open AI Travel Assistant"
          className="fixed bottom-24 right-5 sm:bottom-8 sm:right-8 size-14 rounded-full bg-primary text-primary-foreground shadow-soft-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-30 group"
        >
          <MessageCircle className="size-6 text-white" />
          <span className="absolute -top-1 -right-1 size-3.5 bg-accent rounded-full ring-2 ring-card animate-pulse" />
        </button>
      )}
    </div>
  );
}
