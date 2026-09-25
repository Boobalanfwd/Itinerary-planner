"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  MapPin,
  Clock,
  ArrowLeft,
  Navigation,
  ExternalLink,
  Plus,
  Minus,
  Maximize2,
  Compass,
  Layers,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { getDestinationCoords, getCountryCode } from "@/lib/country-code";
import type { MapboxMapViewProps, MapActivityLocation } from "./MapboxMapInner";
import { getDayColor } from "./MapboxMapInner";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

// Slippy map projection helpers
function lng2tileX(lng: number, zoom: number): number {
  return ((lng + 180) / 360) * Math.pow(2, zoom);
}

function lat2tileY(lat: number, zoom: number): number {
  const rad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
    Math.pow(2, zoom)
  );
}

function tileX2lng(x: number, zoom: number): number {
  return (x / Math.pow(2, zoom)) * 360 - 180;
}

function tileY2lat(y: number, zoom: number): number {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, zoom);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

export function MapboxRasterMap({
  destination = "Destination",
  activities = [],
  days = [],
  selectedDay: controlledSelectedDay,
  onSelectDay,
  onBack,
  highlightActivityId,
  className = "",
}: MapboxMapViewProps) {
  const { resolvedTheme } = useTheme();

  // Internal day selection state
  const [internalSelectedDay, setInternalSelectedDay] = useState<number | null>(null);
  const activeDay =
    controlledSelectedDay !== undefined ? controlledSelectedDay : internalSelectedDay;

  const handleSelectDay = (d: number | null) => {
    if (onSelectDay) {
      onSelectDay(d);
    } else {
      setInternalSelectedDay(d);
    }
  };

  // Valid activities with numbers
  const validActivities = useMemo(() => {
    return activities.filter(
      (a) =>
        a.locationLat !== null &&
        a.locationLat !== undefined &&
        !isNaN(Number(a.locationLat)) &&
        a.locationLng !== null &&
        a.locationLng !== undefined &&
        !isNaN(Number(a.locationLng))
    );
  }, [activities]);

  const displayedActivities = useMemo(() => {
    return activeDay !== null
      ? validActivities.filter((a) => a.dayNumber === activeDay)
      : validActivities;
  }, [validActivities, activeDay]);

  const availableDays = useMemo(() => {
    const set = new Set(activities.map((a) => a.dayNumber));
    return Array.from(set).sort((a, b) => a - b);
  }, [activities]);

  // Initial center
  const initialCoords = useMemo(() => {
    if (displayedActivities.length > 0) {
      return {
        lat: Number(displayedActivities[0].locationLat),
        lng: Number(displayedActivities[0].locationLng),
      };
    }
    const dest = destination ? getDestinationCoords(destination) : null;
    if (dest && (dest.lat !== 20.0 || dest.lng !== 0.0)) {
      return dest;
    }
    return { lat: 9.9252, lng: 78.1198 }; // Madurai fallback
  }, [displayedActivities, destination]);

  const [center, setCenter] = useState<{ lat: number; lng: number }>(initialCoords);
  const [zoom, setZoom] = useState<number>(13);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 600,
  });

  const [activeActivity, setActiveActivity] = useState<MapActivityLocation | null>(null);
  const [mapStyleType, setMapStyleType] = useState<"streets" | "dark" | "satellite">("streets");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Update center when activities or destination change
  useEffect(() => {
    if (displayedActivities.length > 0) {
      // Calculate bounding box center
      let minLat = Infinity,
        maxLat = -Infinity,
        minLng = Infinity,
        maxLng = -Infinity;
      displayedActivities.forEach((a) => {
        const lat = Number(a.locationLat);
        const lng = Number(a.locationLng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      });

      const midLat = (minLat + maxLat) / 2;
      const midLng = (minLng + maxLng) / 2;
      setCenter({ lat: midLat, lng: midLng });

      // Estimate appropriate zoom based on span
      const latSpan = maxLat - minLat;
      const lngSpan = maxLng - minLng;
      const maxSpan = Math.max(latSpan, lngSpan);
      if (maxSpan > 0.5) setZoom(10);
      else if (maxSpan > 0.2) setZoom(11);
      else if (maxSpan > 0.08) setZoom(12);
      else setZoom(13);
    }
  }, [activeDay, destination]);

  // Track container dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({
          width: clientWidth || 800,
          height: clientHeight || 600,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Mapbox style ID
  const mapboxStyleId = useMemo(() => {
    if (mapStyleType === "satellite") return "satellite-streets-v12";
    if (mapStyleType === "dark" || resolvedTheme === "dark") return "dark-v11";
    return "streets-v12";
  }, [mapStyleType, resolvedTheme]);

  // Compute visible tile grid
  const currentTileX = lng2tileX(center.lng, zoom);
  const currentTileY = lat2tileY(center.lat, zoom);

  const tileSpanX = Math.ceil(dimensions.width / 256) + 2;
  const tileSpanY = Math.ceil(dimensions.height / 256) + 2;

  const minTileX = Math.floor(currentTileX - tileSpanX / 2);
  const maxTileX = Math.floor(currentTileX + tileSpanX / 2);
  const minTileY = Math.floor(currentTileY - tileSpanY / 2);
  const maxTileY = Math.floor(currentTileY + tileSpanY / 2);

  const tiles = useMemo(() => {
    const result: { x: number; y: number; key: string; left: number; top: number; url: string }[] = [];
    const maxIndex = Math.pow(2, zoom);

    for (let x = minTileX; x <= maxTileX; x++) {
      for (let y = minTileY; y <= maxTileY; y++) {
        if (y < 0 || y >= maxIndex) continue;
        const normalizedX = ((x % maxIndex) + maxIndex) % maxIndex;

        const left = (x - currentTileX) * 256 + dimensions.width / 2;
        const top = (y - currentTileY) * 256 + dimensions.height / 2;

        const url = `https://api.mapbox.com/styles/v1/mapbox/${mapboxStyleId}/tiles/256/${zoom}/${normalizedX}/${y}@2x?access_token=${MAPBOX_TOKEN}`;

        result.push({
          x,
          y,
          key: `${zoom}-${x}-${y}-${mapboxStyleId}`,
          left,
          top,
          url,
        });
      }
    }
    return result;
  }, [minTileX, maxTileX, minTileY, maxTileY, currentTileX, currentTileY, dimensions, zoom, mapboxStyleId]);

  // Compute screen pixel position for a given lat/lng
  const getScreenPos = useCallback(
    (lat: number, lng: number) => {
      const x = (lng2tileX(lng, zoom) - currentTileX) * 256 + dimensions.width / 2;
      const y = (lat2tileY(lat, zoom) - currentTileY) * 256 + dimensions.height / 2;
      return { x, y };
    },
    [currentTileX, currentTileY, dimensions, zoom]
  );

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    const newTileX = currentTileX - dx / 256;
    const newTileY = currentTileY - dy / 256;

    setCenter({
      lng: tileX2lng(newTileX, zoom),
      lat: tileY2lat(newTileY, zoom),
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Zoom controls
  const zoomIn = () => setZoom((z) => Math.min(18, z + 1));
  const zoomOut = () => setZoom((z) => Math.max(3, z - 1));

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(18, z + 1));
    } else if (e.deltaY > 0) {
      setZoom((z) => Math.max(3, z - 1));
    }
  };

  // Group polylines by day
  const routePolylinesByDay = useMemo(() => {
    const groups: { dayNumber: number; points: { x: number; y: number }[] }[] = [];
    const targetDays = activeDay !== null ? [activeDay] : availableDays;

    for (const d of targetDays) {
      const dayActs = validActivities
        .filter((a) => a.dayNumber === d)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

      if (dayActs.length > 1) {
        groups.push({
          dayNumber: d,
          points: dayActs.map((a) => getScreenPos(Number(a.locationLat), Number(a.locationLng))),
        });
      }
    }
    return groups;
  }, [validActivities, activeDay, availableDays, getScreenPos]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className={`relative w-full h-full min-h-[500px] flex flex-col bg-background overflow-hidden select-none cursor-grab active:cursor-grabbing ${className}`}
    >
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {onBack && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onBack}
              className="bg-card/90 backdrop-blur-md shadow-lg border border-border/70 hover:bg-card text-foreground rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back
            </Button>
          )}

          <div className="bg-card/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-border/70 shadow-lg text-xs font-semibold flex items-center gap-2 text-foreground">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span>{destination}</span>
            <Badge
              variant="outline"
              className="text-[10px] ml-1 bg-primary/10 text-primary border-primary/20"
            >
              {displayedActivities.length} Stops
            </Badge>
            <Badge
              variant="secondary"
              className="text-[9px] bg-primary/10 text-primary border-primary/20 font-bold"
            >
              Mapbox View
            </Badge>
          </div>
        </div>

        {/* Day Filter Pills */}
        <div className="flex items-center gap-1.5 bg-card/90 backdrop-blur-md p-1 rounded-xl border border-border/70 shadow-lg overflow-x-auto max-w-full pointer-events-auto">
          <Button
            size="sm"
            variant={activeDay === null ? "default" : "ghost"}
            onClick={() => handleSelectDay(null)}
            className="h-7 px-2.5 text-xs rounded-lg font-medium"
          >
            All Days
          </Button>
          {availableDays.map((d) => (
            <Button
              key={d}
              size="sm"
              variant={activeDay === d ? "default" : "ghost"}
              onClick={() => handleSelectDay(d)}
              className="h-7 px-2.5 text-xs rounded-lg font-medium flex items-center gap-1.5"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getDayColor(d) }}
              />
              Day {d}
            </Button>
          ))}
        </div>
      </div>

      {/* Mapbox Tiles Canvas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={tile.url}
            alt=""
            draggable={false}
            className="absolute select-none pointer-events-none transition-opacity duration-150"
            style={{
              left: `${tile.left}px`,
              top: `${tile.top}px`,
              width: "256px",
              height: "256px",
            }}
          />
        ))}
      </div>

      {/* SVG Route Lines connecting activities */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        {routePolylinesByDay.map((group) => {
          if (group.points.length < 2) return null;
          const pathD = group.points
            .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
            .join(" ");

          return (
            <path
              key={`route-${group.dayNumber}`}
              d={pathD}
              fill="none"
              stroke={getDayColor(group.dayNumber)}
              strokeWidth={4}
              strokeOpacity={0.85}
              strokeDasharray="6, 6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
      </svg>

      {/* Interactive Mapbox Markers */}
      <div className="absolute inset-0 pointer-events-none z-15">
        {displayedActivities.map((act, idx) => {
          const lat = Number(act.locationLat);
          const lng = Number(act.locationLng);
          const { x, y } = getScreenPos(lat, lng);

          // Don't render pins far offscreen
          if (x < -50 || x > dimensions.width + 50 || y < -50 || y > dimensions.height + 50) {
            return null;
          }

          const isSelected = activeActivity?.id === act.id;
          const pinColor = getDayColor(act.dayNumber);

          return (
            <div
              key={act.id}
              onClick={(e) => {
                e.stopPropagation();
                setActiveActivity(act);
              }}
              style={{
                left: `${x}px`,
                top: `${y}px`,
                transform: "translate(-50%, -100%)",
              }}
              className="absolute pointer-events-auto cursor-pointer transition-transform duration-200 hover:scale-115 hover:z-30"
            >
              {/* Custom Upright Mapbox Pin */}
              <div
                style={{
                  filter: isSelected
                    ? "drop-shadow(0 6px 14px rgba(0,0,0,0.45))"
                    : "drop-shadow(0 3px 8px rgba(0,0,0,0.35))",
                }}
                className={`transition-all duration-200 ${
                  isSelected ? "scale-115" : "hover:scale-110"
                }`}
              >
                <svg
                  width={isSelected ? 38 : 32}
                  height={isSelected ? 48 : 42}
                  viewBox="0 0 32 42"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M16 0C7.163 0 0 7.163 0 16c0 10.5 13.5 24.2 15.2 25.8.4.4 1.2.4 1.6 0C18.5 40.2 32 26.5 32 16 32 7.163 24.837 0 16 0z"
                    fill={pinColor}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? 2.5 : 2}
                  />
                  <text
                    x="16"
                    y="18.5"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#ffffff"
                    fontWeight="800"
                    fontSize={isSelected ? 13 : 11.5}
                    fontFamily="system-ui, -apple-system, sans-serif"
                  >
                    {(act.position ?? idx) + 1}
                  </text>
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Activity Popup Card */}
      {activeActivity && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-sm pointer-events-auto">
          <div className="bg-card/95 backdrop-blur-md border border-border/80 rounded-2xl p-4 shadow-xl text-foreground relative">
            <button
              onClick={() => setActiveActivity(null)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: getDayColor(activeActivity.dayNumber) }}
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Day {activeActivity.dayNumber} Stop
              </span>
            </div>

            <h4 className="text-sm font-bold text-foreground mb-1 leading-snug">
              {activeActivity.title || activeActivity.locationName}
            </h4>

            {activeActivity.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2.5">
                {activeActivity.description}
              </p>
            )}

            <div className="flex items-center justify-between text-xs pt-2 border-t border-border/60">
              <div className="flex items-center gap-3 text-muted-foreground">
                {activeActivity.time && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {activeActivity.time}
                  </span>
                )}
                {activeActivity.duration && (
                  <span>{activeActivity.duration} mins</span>
                )}
              </div>

              {activeActivity.locationLat && activeActivity.locationLng && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${activeActivity.locationLat},${activeActivity.locationLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary font-bold hover:underline"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Directions
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mapbox Controls (Zoom & Style switcher) */}
      <div className="absolute bottom-6 right-4 z-20 flex flex-col gap-1.5 pointer-events-auto">
        <Button
          size="icon"
          variant="secondary"
          onClick={zoomIn}
          className="size-8 rounded-xl bg-card/90 backdrop-blur-md shadow-md border border-border/70 hover:bg-card text-foreground"
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={zoomOut}
          className="size-8 rounded-xl bg-card/90 backdrop-blur-md shadow-md border border-border/70 hover:bg-card text-foreground"
        >
          <Minus className="w-4 h-4" />
        </Button>
      </div>

      {/* Mapbox Logo & Attribution */}
      <div className="absolute bottom-2 left-3 z-20 flex items-center gap-2 pointer-events-none">
        <svg
          viewBox="0 0 88 23"
          className="h-4 w-auto opacity-80"
          fill="currentColor"
        >
          <path d="M14.07 10.59a3.86 3.86 0 0 0-3.32-1.89 3.94 3.94 0 0 0-3.9 4 3.93 3.93 0 0 0 3.9 4 3.92 3.92 0 0 0 3.32-1.89v1.64h2.16V8.95H14.1zm-3.52 4.41a2.21 2.21 0 1 1 0-4.41 2.21 2.21 0 0 1 0 4.41zm11.1-6.3v1.63a3.9 3.9 0 0 0-3.32-1.63 3.93 3.93 0 0 0-3.9 4 3.93 3.93 0 0 0 3.9 4 3.88 3.88 0 0 0 3.32-1.64v1.64h2.16V8.7zm-3.52 6.3a2.21 2.21 0 1 1 0-4.41 2.21 2.21 0 0 1 0 4.41zm14.3-6.3v1.63a3.9 3.9 0 0 0-3.32-1.63 3.93 3.93 0 0 0-3.9 4 3.93 3.93 0 0 0 3.9 4 3.88 3.88 0 0 0 3.32-1.64v1.64h2.16V8.7zm-3.52 6.3a2.21 2.21 0 1 1 0-4.41 2.21 2.21 0 0 1 0 4.41zM2.87 8.7H.71v7.97h2.16v-4.66a2.07 2.07 0 0 1 2.07-2.07c.2 0 .42.03.62.08V7.8a2.9 2.9 0 0 0-.7-.09 2.5 2.5 0 0 0-1.99.99zm42.66 0h-2.16v7.97h2.16zm5.82 0a3.94 3.94 0 1 0 0 7.97 3.94 3.94 0 0 0 0-7.97zm0 6.27a2.3 2.3 0 1 1 0-4.57 2.3 2.3 0 0 1 0 4.57zm12.3-6.27l-2.4 3.85-2.4-3.85h-2.52l3.66 5.6-3.76 5.75h2.52l2.5-3.95 2.5 3.95h2.52l-3.76-5.75 3.66-5.6z" />
        </svg>
      </div>

      <div className="absolute bottom-1 right-2 z-20 text-[9px] text-muted-foreground/70 pointer-events-none">
        © Mapbox
      </div>
    </div>
  );
}

export default MapboxRasterMap;
