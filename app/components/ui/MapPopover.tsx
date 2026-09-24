"use client";

import React, { useState } from "react";
import Map, { Marker } from "react-map-gl/mapbox";
import { MapPin } from "lucide-react";
import { Location } from "../types";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapPopoverProps {
  location: Location;
  children: React.ReactNode;
  onMapClick?: () => void;
}

export const MapPopover: React.FC<MapPopoverProps> = ({
  location,
  children,
  onMapClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (
    !mapboxToken ||
    isNaN(location.lat) ||
    isNaN(location.lng) ||
    location.lat === null ||
    location.lng === null
  ) {
    return <>{children}</>;
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}

      {/* Map Popover */}
      {isHovered && (
        <div
          className="absolute left-full top-0 ml-4 z-50 animate-in fade-in slide-in-from-left-2 duration-200"
          onClick={(e) => {
            e.stopPropagation();
            onMapClick?.();
          }}
        >
          <div className="relative group/map cursor-pointer">
            {/* Glassmorphism Container */}
            <div className="w-[320px] h-[240px] rounded-2xl overflow-hidden border-2 border-white/20 bg-black/40 backdrop-blur-xl shadow-2xl shadow-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 hover:scale-105">
              {/* Map */}
              <Map
                mapboxAccessToken={mapboxToken}
                initialViewState={{
                  longitude: location.lng,
                  latitude: location.lat,
                  zoom: 15,
                }}
                style={{ width: "100%", height: "100%" }}
                mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
                interactive={false}
              >
                {/* Custom Marker */}
                <Marker longitude={location.lng} latitude={location.lat}>
                  <div className="relative animate-bounce">
                    <div className="absolute -inset-2 bg-emerald-500/30 rounded-full blur-md" />
                    <MapPin className="w-8 h-8 text-emerald-400 fill-emerald-500/50 relative z-10" />
                  </div>
                </Marker>
              </Map>

              {/* Location Label Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/90 via-black/60 to-transparent p-4">
                <p className="text-white font-bold text-sm truncate">
                  {location.name}
                </p>
                <p className="text-emerald-400 text-xs font-mono">
                  Click to view details
                </p>
              </div>

              {/* Hover Glow Effect */}
              <div className="absolute inset-0 bg-linear-to-br from-emerald-500/0 via-emerald-500/0 to-cyan-500/0 group-hover/map:from-emerald-500/10 group-hover/map:to-cyan-500/10 transition-all duration-300 pointer-events-none" />
            </div>

            {/* Arrow Pointer */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2">
              <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white/20" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
