"use client";

import React, { useState, useEffect, Component, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Compass, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MapboxMapViewProps } from "./MapboxMapInner";

export type { MapActivityLocation, MapboxMapViewProps } from "./MapboxMapInner";

export function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") ||
          canvas.getContext("webgl") ||
          canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

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

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class MapErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[MapErrorBoundary] Mapbox rendering error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-card border border-border/80 rounded-2xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Compass className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-foreground">Mapbox View</h4>
          <p className="text-xs text-muted-foreground max-w-xs">
            There was a temporary issue loading the map view. Click below to reload.
          </p>
          <Button
            size="sm"
            onClick={() => this.setState({ hasError: false })}
            className="rounded-xl gap-1.5 text-xs font-semibold"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Reload Map
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function MapboxMapView(props: MapboxMapViewProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <MapSkeleton />;
  }

  return (
    <MapErrorBoundary>
      <MapboxMapInner {...props} />
    </MapErrorBoundary>
  );
}

export default MapboxMapView;
