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
    router.back();
  };

  if (children) {
    return <>{children}</>;
  }

  return (
    <SplitItineraryView
      initialData={data}
      onBack={handleBack}
    />
  );
}

