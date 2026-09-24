"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SplitItineraryView } from "@/components/itinerary/SplitItineraryView";
import { ItineraryData } from "@/app/components/types";

interface PublicShareViewWrapperProps {
  data: ItineraryData;
}

export function PublicShareViewWrapper({ data }: PublicShareViewWrapperProps) {
  const router = useRouter();

  const handleBack = () => {
    router.push("/");
  };

  return (
    <SplitItineraryView
      initialData={data}
      onBack={handleBack}
      readOnly={true}
    />
  );
}
