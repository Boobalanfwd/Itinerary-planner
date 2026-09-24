"use client";

import React from "react";
import { MapboxMapView, type MapboxMapViewProps } from "./MapboxMapView";

// Backwards compatibility alias for components referencing LeafletMapView
export const LeafletMapView = (props: MapboxMapViewProps) => {
  return <MapboxMapView {...props} />;
};

export default LeafletMapView;
