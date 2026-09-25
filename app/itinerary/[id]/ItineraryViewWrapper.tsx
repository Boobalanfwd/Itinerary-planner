"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SplitItineraryView } from "@/components/itinerary/SplitItineraryView";
import { ItineraryData } from "@/app/components/types";

interface ItineraryViewWrapperProps {
  data: ItineraryData;
  children?: React.ReactNode;
}

export function ItineraryViewWrapper({ data, children }: ItineraryViewWrapperProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 2) {
      router.back();
    } else {
      router.push("/dashboard/itineraries");
    }
  };

  if (children) {
    return <>{children}</>;
  }

  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-xs text-muted-foreground font-mono">Loading itinerary...</p>
          </div>
        </div>
      }
    >
      <SplitItineraryView
        initialData={data}
        onBack={handleBack}
      />
    </React.Suspense>
  );
}

