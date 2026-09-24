"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Compass } from "lucide-react";
import type { MapboxMapViewProps } from "./MapboxMapInner";

export type { MapActivityLocation, MapboxMapViewProps } from "./MapboxMapInner";

function MapSkeleton() {
  return (
    <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-muted/20 backdrop-blur-sm gap-3 p-6 text-center">
      <div className="relative">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm animate-pulse">
          <Compass
            className="w-6 h-6 animate-spin text-primary"
            style={{ animationDuration: "3s" }}
          />
        </div>
      </div>
      <div className="space-y-1.5 max-w-[240px]">
        <Skeleton className="h-4 w-36 mx-auto rounded-md" />
        <Skeleton className="h-3 w-48 mx-auto rounded-md" />
      </div>
    </div>
  );
}

const MapboxMapInner = dynamic(
  () => import("./MapboxMapInner").then((m) => m.MapboxMapInner),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  }
);

export function MapboxMapView(props: MapboxMapViewProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <MapSkeleton />;
  }

  return <MapboxMapInner {...props} />;
}

export default MapboxMapView;
