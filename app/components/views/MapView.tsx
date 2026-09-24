"use client";

import React from "react";
import { ItineraryData, Activity } from "../types";
import { MapboxMapView, type MapActivityLocation } from "@/components/map/MapboxMapView";

interface MapViewProps {
  data: ItineraryData;
  onBack: () => void;
  highlightActivity?: Activity;
}

export const MapView: React.FC<MapViewProps> = ({
  data,
  onBack,
  highlightActivity,
}) => {
  // Convert ItineraryData structure to MapActivityLocation array
  const activities = React.useMemo<MapActivityLocation[]>(() => {
    return data.days.flatMap((day) =>
      day.activities.map((act, index) => {
        const rawLat = act.locationLat ?? act.location?.lat;
        const rawLng = act.locationLng ?? act.location?.lng;
        const lat =
          rawLat !== undefined && rawLat !== null && !isNaN(Number(rawLat))
            ? Number(rawLat)
            : null;
        const lng =
          rawLng !== undefined && rawLng !== null && !isNaN(Number(rawLng))
            ? Number(rawLng)
            : null;

        return {
          id: act.id || `act-${day.day}-${index}`,
          title: act.title,
          description: act.description || act.desc || "",
          time: act.time,
          type: act.type,
          cost: act.cost ?? null,
          duration: act.duration ?? null,
          locationLat: lat,
          locationLng: lng,
          locationName: act.locationName || act.location?.name || null,
          address: act.address || act.location?.name || null,
          dayNumber: day.day,
          position: act.position ?? act.order ?? index,
        };
      })
    );
  }, [data.days]);

  const days = React.useMemo(
    () =>
      data.days.map((d) => ({
        dayNumber: d.day,
        title: d.theme || `Day ${d.day}`,
        theme: d.theme,
      })),
    [data.days]
  );

  return (
    <div className="w-full h-full min-h-[500px]">
      <MapboxMapView
        destination={data.destination || "Destination"}
        activities={activities}
        days={days}
        onBack={onBack}
        highlightActivityId={highlightActivity?.id}
      />
    </div>
  );
};

export default MapView;
