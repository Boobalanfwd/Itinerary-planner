"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  Clock,
  MapPin,
  Calendar,
  Navigation,
  DollarSign,
  ArrowLeft,
  ExternalLink,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import "leaflet/dist/leaflet.css";

export interface MapActivityLocation {
  id: string;
  title: string;
  description: string;
  time: string;
  type?: string;
  cost?: number | null;
  duration?: number | null;
  locationLat: number;
  locationLng: number;
  locationName?: string | null;
  address?: string | null;
  dayNumber: number;
  position?: number;
}

export interface LeafletMapViewProps {
  destination?: string;
  activities: MapActivityLocation[];
  days?: { dayNumber: number; title: string; theme?: string | null }[];
  onBack?: () => void;
  highlightActivityId?: string;
  className?: string;
}

// Color palette for itinerary days (modern vibrant jewel tones)
const DAY_COLORS = [
  "#0D9488", // Teal / Emerald
  "#6366F1", // Indigo
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F97316", // Orange
];

function getDayColor(dayNumber: number): string {
  return DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];
}

// Custom Leaflet DivIcon with day color badge and order number
function createCustomPin(order: number, dayNumber: number, isSelected: boolean) {
  const color = getDayColor(dayNumber);
  const size = isSelected ? 38 : 32;

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      color: white;
      border-radius: 50% 50% 50% 4px;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(0,0,0,0.35);
      border: 2px solid white;
      transition: all 0.2s ease-out;
    ">
      <span style="
        transform: rotate(45deg);
        font-weight: 700;
        font-size: ${isSelected ? 13 : 11}px;
        font-family: system-ui, sans-serif;
      ">${order}</span>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-map-pin",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

// Controller component to auto-fit map view to markers
function MapBoundsController({
  points,
}: {
  points: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;

    if (points.length === 1) {
      map.setView(points[0], 14, { animate: true });
      return;
    }

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 15,
      animate: true,
    });
  }, [map, points]);

  return null;
}

export function LeafletMapInner({
  destination = "Destination",
  activities = [],
  days = [],
  onBack,
  highlightActivityId,
  className = "",
}: LeafletMapViewProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedActivity, setSelectedActivity] =
    useState<MapActivityLocation | null>(null);

  // Filter activities by selected day
  const displayedActivities = useMemo(() => {
    return selectedDay !== null
      ? activities.filter((a) => a.dayNumber === selectedDay)
      : activities;
  }, [activities, selectedDay]);

  // Unique list of days
  const availableDays = useMemo(() => {
    const dayNums = Array.from(new Set(activities.map((a) => a.dayNumber))).sort(
      (a, b) => a - b
    );
    return dayNums;
  }, [activities]);

  // Coordinate pairs for bounds and route polylines
  const points = useMemo<[number, number][]>(() => {
    return displayedActivities.map((a) => [a.locationLat, a.locationLng]);
  }, [displayedActivities]);

  // Group polylines by day so each day gets its own distinct color line
  const routePolylinesByDay = useMemo(() => {
    const groups: { dayNumber: number; coords: [number, number][] }[] = [];
    const targetDays = selectedDay !== null ? [selectedDay] : availableDays;

    for (const dayNum of targetDays) {
      const dayActs = activities
        .filter((a) => a.dayNumber === dayNum)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

      if (dayActs.length > 1) {
        groups.push({
          dayNumber: dayNum,
          coords: dayActs.map((a) => [a.locationLat, a.locationLng]),
        });
      }
    }
    return groups;
  }, [activities, selectedDay, availableDays]);

  // Center on destination or first point
  const defaultCenter: [number, number] = points[0] || [35.6762, 139.6503];

  return (
    <div className={`relative w-full h-full min-h-[500px] flex flex-col bg-background overflow-hidden ${className}`}>
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
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
            <Badge variant="outline" className="text-[10px] ml-1 bg-primary/10 text-primary border-primary/20">
              {displayedActivities.length} Stops
            </Badge>
          </div>
        </div>

        {/* Day Filter Pills */}
        <div className="flex items-center gap-1.5 bg-card/90 backdrop-blur-md p-1 rounded-xl border border-border/70 shadow-lg overflow-x-auto max-w-full pointer-events-auto">
          <Button
            size="sm"
            variant={selectedDay === null ? "default" : "ghost"}
            onClick={() => setSelectedDay(null)}
            className="h-7 px-2.5 text-xs rounded-lg font-medium"
          >
            All Days
          </Button>
          {availableDays.map((d) => (
            <Button
              key={d}
              size="sm"
              variant={selectedDay === d ? "default" : "ghost"}
              onClick={() => setSelectedDay(d)}
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

      {/* Main Map Container */}
      <div className="flex-1 w-full h-full relative z-0">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          scrollWheelZoom={true}
          style={{ width: "100%", height: "100%", minHeight: "500px" }}
          className="z-0"
        >
          {/* CartoDB Voyager Tiles (Modern, clean, travel magazine aesthetic) */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            maxZoom={19}
            subdomains="abcd"
          />

          <MapBoundsController points={points} />

          {/* Route polylines connecting stops for each day */}
          {routePolylinesByDay.map((group) => (
            <Polyline
              key={group.dayNumber}
              positions={group.coords}
              color={getDayColor(group.dayNumber)}
              weight={4}
              opacity={0.8}
              dashArray="6, 8"
            />
          ))}

          {/* Interactive activity markers */}
          {displayedActivities.map((activity, idx) => {
            const isHighlighted =
              activity.id === highlightActivityId ||
              activity.id === selectedActivity?.id;

            return (
              <Marker
                key={activity.id}
                position={[activity.locationLat, activity.locationLng]}
                icon={createCustomPin(
                  (activity.position ?? idx) + 1,
                  activity.dayNumber,
                  isHighlighted
                )}
                eventHandlers={{
                  click: () => setSelectedActivity(activity),
                }}
              >
                <Popup className="wander-map-popup">
                  <div className="p-2 max-w-[260px] space-y-2 text-foreground font-sans">
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        style={{
                          backgroundColor: `${getDayColor(activity.dayNumber)}15`,
                          color: getDayColor(activity.dayNumber),
                          borderColor: `${getDayColor(activity.dayNumber)}40`,
                        }}
                        className="text-[10px] px-2 py-0.5 font-semibold"
                      >
                        Day {activity.dayNumber} • {activity.time}
                      </Badge>
                      {activity.cost !== undefined && activity.cost !== null && (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          ${activity.cost}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-sm leading-tight text-foreground">
                        {activity.title}
                      </h4>
                      {activity.locationName && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-primary" />
                          {activity.locationName}
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {activity.description}
                    </p>

                    <div className="pt-1 flex items-center justify-between border-t border-border/50 text-[11px]">
                      {activity.duration && (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {activity.duration}m
                        </span>
                      )}
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${activity.title}, ${activity.address || destination}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        Directions <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Selected Activity Preview Card (Bottom Floating Drawer) */}
      {selectedActivity && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] pointer-events-none">
          <Card className="max-w-md mx-auto p-4 bg-card/95 backdrop-blur-xl border-border/80 shadow-2xl rounded-2xl pointer-events-auto">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge
                    style={{
                      backgroundColor: getDayColor(selectedActivity.dayNumber),
                      color: "white",
                    }}
                    className="text-[10px] font-bold px-2 py-0.5"
                  >
                    Stop {(selectedActivity.position ?? 0) + 1}
                  </Badge>
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {selectedActivity.time}
                  </span>
                </div>
                <h4 className="font-bold text-base text-foreground">
                  {selectedActivity.title}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {selectedActivity.description}
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedActivity(null)}
                className="text-xs h-7 px-2 text-muted-foreground"
              >
                ✕
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default LeafletMapInner;
