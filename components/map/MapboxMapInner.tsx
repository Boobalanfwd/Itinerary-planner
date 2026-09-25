"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useTheme } from "next-themes";

import { MapboxRasterMap } from "./MapboxRasterMap";

export function isWebGLSupported(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return false;
    return true;
  } catch {
    return false;
  }
}

import {
  MapPin,
  Clock,
  ArrowLeft,
  Navigation,
  ExternalLink,
  Layers,
  Compass,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDestinationCoords, getCountryCode, getDistanceKm } from "@/lib/country-code";

export interface MapActivityLocation {
  id: string;
  title: string;
  description?: string;
  time?: string;
  type?: string;
  cost?: number | null;
  duration?: number | null;
  locationLat?: number | null;
  locationLng?: number | null;
  locationName?: string | null;
  address?: string | null;
  dayNumber: number;
  position?: number;
}

export interface MapboxMapViewProps {
  destination?: string;
  activities: MapActivityLocation[];
  days?: { dayNumber: number; title: string; theme?: string | null }[];
  selectedDay?: number | null;
  onSelectDay?: (dayNumber: number | null) => void;
  onBack?: () => void;
  highlightActivityId?: string;
  className?: string;
}

// Modern vibrant jewel tones for itinerary days
const DAY_COLORS = [
  "#0D9488", // Teal
  "#6366F1", // Indigo
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F97316", // Orange
];

export function getDayColor(dayNumber: number): string {
  return DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

// Global in-memory route cache across renders & component remounts
const GLOBAL_ROAD_ROUTE_CACHE = new Map<string, [number, number][]>();

/**
 * Deduplicate consecutive coordinates within a threshold to comply with
 * Mapbox Directions API's requirement that successive waypoints cannot be identical.
 */
function getCleanWaypoints(acts: MapActivityLocation[]): [number, number][] {
  const sorted = [...acts].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const pts: [number, number][] = [];

  for (const act of sorted) {
    if (
      act.locationLng !== null &&
      act.locationLng !== undefined &&
      !isNaN(act.locationLng) &&
      act.locationLat !== null &&
      act.locationLat !== undefined &&
      !isNaN(act.locationLat)
    ) {
      const lng = act.locationLng;
      const lat = act.locationLat;

      if (
        pts.length === 0 ||
        Math.abs(pts[pts.length - 1][0] - lng) > 0.0001 ||
        Math.abs(pts[pts.length - 1][1] - lat) > 0.0001
      ) {
        pts.push([lng, lat]);
      }
    }
  }

  return pts;
}

export function MapboxMapInner({
  destination = "Destination",
  activities = [],
  days = [],
  selectedDay: controlledSelectedDay,
  onSelectDay,
  onBack,
  highlightActivityId,
  className = "",
}: MapboxMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupsRef = useRef<mapboxgl.Popup[]>([]);

  const { resolvedTheme } = useTheme();

  // Internal day selection state when un-controlled
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

  const [activeActivity, setActiveActivity] = useState<MapActivityLocation | null>(null);
  const [resolvedActivities, setResolvedActivities] = useState<MapActivityLocation[]>(activities);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [dayRoutes, setDayRoutes] = useState<Record<number, [number, number][]>>({});
  const [is3DMode, setIs3DMode] = useState(false);
  const [useRasterMapbox, setUseRasterMapbox] = useState(() => !isWebGLSupported());

  // Enrich missing coordinates via Mapbox Geocoding only if necessary
  useEffect(() => {
    let isCancelled = false;

    async function getDestinationCenter(): Promise<{ lng: number; lat: number } | null> {
      // 1. Try static known coordinates from country-code map first (only if genuine city, NOT country fallback)
      if (destination) {
        const staticCoords = getDestinationCoords(destination);
        if (
          staticCoords &&
          !staticCoords.isFallback &&
          (staticCoords.lat !== 20.0 || staticCoords.lng !== 0.0)
        ) {
          return { lng: staticCoords.lng, lat: staticCoords.lat };
        }
      }

      // 2. Try Mapbox geocode with candidate fallbacks
      try {
        const destCountry = destination ? getCountryCode(destination)?.toLowerCase() : null;
        const candidates = destination ? [destination] : [];
        if (destination) {
          const parts = destination
            .split(/,|\band\b|&|\//gi)
            .map((s) => s.trim())
            .filter((s) => s.length >= 2);
          if (parts.length > 1) {
            candidates.unshift(...parts);
          }
        }

        for (const cand of candidates) {
          const params = new URLSearchParams({
            types: "place,locality,region,country",
            limit: "1",
            access_token: MAPBOX_TOKEN,
          });
          if (destCountry) {
            params.set("country", destCountry);
          }

          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
              cand
            )}.json?${params.toString()}`
          );
          if (!res.ok) continue;
          const data = await res.json();
          const center = data?.features?.[0]?.center;
          if (center && Array.isArray(center) && center.length === 2) {
            return { lng: center[0], lat: center[1] };
          }
        }
        return null;
      } catch {
        return null;
      }
    }

    async function enrichMissingCoordinates() {
      // Step 1: Get destination center first so we can check both missing AND corrupted coordinates
      const destCenter = await getDestinationCenter();
      const destCountry = destination ? getCountryCode(destination)?.toLowerCase() : null;

      const needsGeocode = activities.filter((a) => {
        if (
          a.locationLat === null ||
          a.locationLat === undefined ||
          isNaN(a.locationLat) ||
          a.locationLng === null ||
          a.locationLng === undefined ||
          isNaN(a.locationLng)
        ) {
          return true;
        }
        // If existing coordinates are > 120km away from destination center, they are wrong — re-geocode!
        if (destCenter) {
          const distKm = getDistanceKm(a.locationLat, a.locationLng, destCenter.lat, destCenter.lng);
          if (distKm > 120) {
            return true;
          }
        }
        return false;
      });

      if (needsGeocode.length === 0) {
        if (resolvedActivities.length !== activities.length) {
          setResolvedActivities(activities);
        }
        return;
      }

      setIsGeocoding(true);

      const enriched = await Promise.all(
        activities.map(async (act) => {
          // If valid coordinate within destination bounds, keep it
          if (
            act.locationLat !== null &&
            act.locationLat !== undefined &&
            !isNaN(act.locationLat) &&
            act.locationLng !== null &&
            act.locationLng !== undefined &&
            !isNaN(act.locationLng)
          ) {
            if (!destCenter) return act;
            const distKm = getDistanceKm(act.locationLat, act.locationLng, destCenter.lat, destCenter.lng);
            if (distKm <= 120) {
              return act;
            }
          }

          const cleanTitle = (act.locationName || act.title).replace(/\(.*?\)/g, "").trim();
          const queries = [
            `${cleanTitle}, ${destination}`,
            cleanTitle,
          ];

          try {
            for (const q of queries) {
              const params = new URLSearchParams({
                access_token: MAPBOX_TOKEN,
                limit: "5",
                types: "poi,address,place",
              });

              if (destCountry) {
                params.set("country", destCountry);
              }

              if (destCenter) {
                params.set("proximity", `${destCenter.lng},${destCenter.lat}`);
                // Bounding box around destination (~65km) strictly prevents cross-country jumps
                params.set(
                  "bbox",
                  `${destCenter.lng - 0.6},${destCenter.lat - 0.6},${destCenter.lng + 0.6},${destCenter.lat + 0.6}`
                );
              }

              const res = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?${params.toString()}`
              );
              if (!res.ok) continue;
              const data = await res.json();
              const features = data?.features ?? [];
              if (features.length === 0) continue;

              // Pick the feature closest to destination center
              let best = features[0];
              if (destCenter && features.length > 1) {
                let minDist = Infinity;
                for (const f of features) {
                  const [fLng, fLat] = f.center ?? [0, 0];
                  const dist = Math.hypot(fLng - destCenter.lng, fLat - destCenter.lat);
                  if (dist < minDist) {
                    minDist = dist;
                    best = f;
                  }
                }
              }

              const center = best?.center;
              if (center && Array.isArray(center) && center.length === 2) {
                if (destCenter) {
                  const distKm = getDistanceKm(center[1], center[0], destCenter.lat, destCenter.lng);
                  if (distKm > 120) {
                    continue;
                  }
                }

                return {
                  ...act,
                  locationLng: center[0],
                  locationLat: center[1],
                  address: best.place_name || act.address,
                };
              }
            }

            // Guaranteed destination fallback if POI search fails: place neatly near destination center
            if (destCenter) {
              const hash = Array.from(act.title).reduce((acc, c) => acc + c.charCodeAt(0), 0);
              const offsetLat = ((hash % 15) - 7) * 0.001;
              const offsetLng = (((hash >> 2) % 15) - 7) * 0.001;
              return {
                ...act,
                locationLat: destCenter.lat + offsetLat,
                locationLng: destCenter.lng + offsetLng,
                address: act.address || `${act.title}, ${destination}`,
              };
            }
          } catch {
            // Ignore geocoding errors
          }
          return act;
        })
      );

      if (!isCancelled) {
        setResolvedActivities(enriched);
        setIsGeocoding(false);
      }
    }

    enrichMissingCoordinates();

    return () => {
      isCancelled = true;
    };
  }, [activities, destination]);


  // Valid activities with coordinates
  const validActivities = useMemo(() => {
    return resolvedActivities.filter(
      (a) =>
        a.locationLat !== null &&
        a.locationLat !== undefined &&
        !isNaN(a.locationLat) &&
        a.locationLng !== null &&
        a.locationLng !== undefined &&
        !isNaN(a.locationLng)
    );
  }, [resolvedActivities]);

  // Unique days list
  const availableDays = useMemo(() => {
    return Array.from(new Set(validActivities.map((a) => a.dayNumber))).sort(
      (a, b) => a - b
    );
  }, [validActivities]);

  // Activities filtered by selected day (for markers)
  const displayedActivities = useMemo(() => {
    return activeDay !== null
      ? validActivities.filter((a) => a.dayNumber === activeDay)
      : validActivities;
  }, [validActivities, activeDay]);

  // Mapbox style based on theme
  const mapStyle = useMemo(() => {
    return resolvedTheme === "dark"
      ? "mapbox://styles/mapbox/dark-v11"
      : "mapbox://styles/mapbox/streets-v12";
  }, [resolvedTheme]);

  // Synchronous route preparation + Parallel Mapbox Directions API fetching
  useEffect(() => {
    let isCancelled = false;

    const allDays = Array.from(
      new Set(validActivities.map((a) => a.dayNumber))
    ).sort((a, b) => a - b);

    if (allDays.length === 0) return;

    // STEP 1: Synchronously initialize route lines for ALL days immediately.
    // Use cached turn-by-turn road route if available, or direct waypoints as instant fallback.
    // This guarantees NO day is ever missing a route line while waiting for directions.
    const initialRoutes: Record<number, [number, number][]> = {};
    const daysToFetch: {
      dayNum: number;
      cacheKey: string;
      waypoints: [number, number][]
    }[] = [];

    for (const dayNum of allDays) {
      const dayActs = validActivities.filter((a) => a.dayNumber === dayNum);
      const waypoints = getCleanWaypoints(dayActs);

      if (waypoints.length >= 2) {
        const cacheKey = `${dayNum}:${waypoints
          .map((p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`)
          .join(";")}`;

        if (GLOBAL_ROAD_ROUTE_CACHE.has(cacheKey)) {
          initialRoutes[dayNum] = GLOBAL_ROAD_ROUTE_CACHE.get(cacheKey)!;
        } else {
          // Instant direct path fallback
          initialRoutes[dayNum] = waypoints;
          daysToFetch.push({ dayNum, cacheKey, waypoints });
        }
      }
    }

    // Set available routes immediately
    setDayRoutes((prev) => ({ ...initialRoutes, ...prev }));

    if (daysToFetch.length === 0) return;

    // STEP 2: Fetch turn-by-turn road routes for all uncached days IN PARALLEL
    Promise.all(
      daysToFetch.map(async ({ dayNum, cacheKey, waypoints }) => {
        try {
          const slice = waypoints.slice(0, 25);
          const coordsParam = slice.map((p) => `${p[0]},${p[1]}`).join(";");
          const res = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsParam}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
          );

          if (!res.ok) {
            console.warn(`[Mapbox] Directions API HTTP ${res.status} for day ${dayNum}`);
            return;
          }

          const data = await res.json();
          const roadCoords = data?.routes?.[0]?.geometry?.coordinates;

          if (Array.isArray(roadCoords) && roadCoords.length > 0) {
            GLOBAL_ROAD_ROUTE_CACHE.set(cacheKey, roadCoords);
            if (!isCancelled) {
              setDayRoutes((prev) => ({
                ...prev,
                [dayNum]: roadCoords,
              }));
            }
          }
        } catch (err) {
          console.warn(`[Mapbox] Directions fetch error for day ${dayNum}:`, err);
        }
      })
    );

    return () => {
      isCancelled = true;
    };
  }, [validActivities]);

  // Synchronize road route layers on the map
  const syncRouteLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const allDayNums = Array.from(
      new Set(validActivities.map((a) => a.dayNumber))
    ).sort((a, b) => a - b);

    allDayNums.forEach((dayNum) => {
      const sourceId = `route-source-day-${dayNum}`;
      const casingLayerId = `route-casing-day-${dayNum}`;
      const layerId = `route-layer-day-${dayNum}`;

      const isVisible = activeDay === null || activeDay === dayNum;
      const coords = dayRoutes[dayNum];

      if (!coords || coords.length < 2) {
        try {
          if (map.getLayer(layerId))
            map.setLayoutProperty(layerId, "visibility", "none");
          if (map.getLayer(casingLayerId))
            map.setLayoutProperty(casingLayerId, "visibility", "none");
        } catch {
          // Ignore style layer lookup errors
        }
        return;
      }

      const geojsonData: GeoJSON.Feature<GeoJSON.LineString> = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: coords,
        },
      };

      try {
        const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource | undefined;
        if (source) {
          source.setData(geojsonData);
        } else {
          map.addSource(sourceId, {
            type: "geojson",
            data: geojsonData,
          });
        }

        // Add casing layer if missing
        if (!map.getLayer(casingLayerId)) {
          map.addLayer({
            id: casingLayerId,
            type: "line",
            source: sourceId,
            layout: {
              "line-join": "round",
              "line-cap": "round",
              visibility: isVisible ? "visible" : "none",
            },
            paint: {
              "line-color": resolvedTheme === "dark" ? "#090d16" : "#ffffff",
              "line-width": 6,
              "line-opacity": 0.9,
            },
          });
        } else {
          map.setLayoutProperty(
            casingLayerId,
            "visibility",
            isVisible ? "visible" : "none"
          );
        }

        // Add main route layer if missing
        if (!map.getLayer(layerId)) {
          map.addLayer({
            id: layerId,
            type: "line",
            source: sourceId,
            layout: {
              "line-join": "round",
              "line-cap": "round",
              visibility: isVisible ? "visible" : "none",
            },
            paint: {
              "line-color": getDayColor(dayNum),
              "line-width": 4,
              "line-opacity": 0.95,
            },
          });
        } else {
          map.setLayoutProperty(
            layerId,
            "visibility",
            isVisible ? "visible" : "none"
          );
        }
      } catch (err) {
        console.warn(`[Mapbox] Error syncing layer for day ${dayNum}:`, err);
      }
    });
  }, [validActivities, dayRoutes, activeDay, resolvedTheme]);

  // Keep refs for fresh callbacks inside map listeners
  const syncRouteLayersRef = useRef(syncRouteLayers);
  syncRouteLayersRef.current = syncRouteLayers;

  // Update markers and bounds
  const updateMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clean old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Clean old popups
    popupsRef.current.forEach((p) => p.remove());
    popupsRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();

    // Group activities by coordinate to disperse overlapping pins (spiderfier)
    const coordCounts = new Map<string, number>();
    const coordSeen = new Map<string, number>();

    displayedActivities.forEach((act) => {
      const key = `${act.locationLat!.toFixed(4)},${act.locationLng!.toFixed(4)}`;
      coordCounts.set(key, (coordCounts.get(key) || 0) + 1);
    });

    displayedActivities.forEach((activity, idx) => {
      const baseLng = activity.locationLng!;
      const baseLat = activity.locationLat!;
      bounds.extend([baseLng, baseLat]);

      // Calculate gentle offset if multiple stops share the exact same coordinates
      const key = `${baseLat.toFixed(4)},${baseLng.toFixed(4)}`;
      const totalAtCoord = coordCounts.get(key) || 1;
      const indexAtCoord = coordSeen.get(key) || 0;
      coordSeen.set(key, indexAtCoord + 1);

      let lng = baseLng;
      let lat = baseLat;

      if (totalAtCoord > 1) {
        // Subtle dispersal ~30 meters so pins don't completely cover one another
        const angle = (indexAtCoord * 2 * Math.PI) / totalAtCoord;
        const radius = 0.0003;
        lng = baseLng + radius * Math.cos(angle);
        lat = baseLat + radius * Math.sin(angle) * 0.8;
      }

      const isHighlighted =
        activity.id === highlightActivityId ||
        activity.id === activeActivity?.id;

      const dayColor = getDayColor(activity.dayNumber);

      // Sequence numbering per day
      const dayActs = validActivities
        .filter((a) => a.dayNumber === activity.dayNumber)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      const dayIdx = dayActs.findIndex((a) => a.id === activity.id);
      const sequenceNum =
        typeof activity.position === "number" &&
        !isNaN(activity.position) &&
        activity.position >= 0
          ? activity.position + 1
          : (dayIdx >= 0 ? dayIdx : idx) + 1;

      const pinWidth = isHighlighted ? 38 : 32;
      const pinHeight = isHighlighted ? 48 : 42;
      const el = document.createElement("div");
      el.className = "custom-mapbox-marker group cursor-pointer";
      el.style.width = `${pinWidth}px`;
      el.style.height = `${pinHeight}px`;
      el.style.transition = "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)";
      el.style.zIndex = isHighlighted ? "30" : "10";
      el.style.filter = isHighlighted
        ? "drop-shadow(0 6px 14px rgba(0,0,0,0.45))"
        : "drop-shadow(0 3px 8px rgba(0,0,0,0.35))";

      el.innerHTML = `
        <svg
          width="${pinWidth}"
          height="${pinHeight}"
          viewBox="0 0 32 42"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 0C7.163 0 0 7.163 0 16c0 10.5 13.5 24.2 15.2 25.8.4.4 1.2.4 1.6 0C18.5 40.2 32 26.5 32 16 32 7.163 24.837 0 16 0z"
            fill="${dayColor}"
            stroke="#ffffff"
            stroke-width="${isHighlighted ? 2.5 : 2}"
          />
          <text
            x="16"
            y="18.5"
            text-anchor="middle"
            dominant-baseline="middle"
            fill="#ffffff"
            font-weight="800"
            font-size="${isHighlighted ? 13 : 11.5}"
            font-family="system-ui, -apple-system, sans-serif"
          >${sequenceNum}</text>
        </svg>
      `;

      const popupHtml = `
        <div class="p-2.5 max-w-[260px] space-y-2 text-foreground font-sans">
          <div class="flex items-center justify-between gap-2">
            <span style="background: ${dayColor}18; color: ${dayColor}; border: 1px solid ${dayColor}35;"
                  class="text-[10px] px-2 py-0.5 rounded-md font-semibold inline-block">
              Day ${activity.dayNumber} ${activity.time ? `• ${activity.time}` : ""}
            </span>
            ${
              activity.cost !== undefined && activity.cost !== null
                ? `<span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">$${activity.cost}</span>`
                : ""
            }
          </div>
          <div>
            <h4 class="font-bold text-sm leading-tight text-foreground">${activity.title}</h4>
            ${
              activity.locationName
                ? `<p class="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                     📍 <span>${activity.locationName}</span>
                   </p>`
                : ""
            }
          </div>
          ${
            activity.description
              ? `<p class="text-xs text-muted-foreground line-clamp-2 leading-relaxed">${activity.description}</p>`
              : ""
          }
          <div class="pt-1 flex items-center justify-between border-t border-border/50 text-[11px]">
            ${
              activity.duration
                ? `<span class="text-muted-foreground">⏱️ ${activity.duration}m</span>`
                : "<span></span>"
            }
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${activity.title}, ${activity.address || destination}`
            )}" target="_blank" rel="noopener noreferrer" class="text-primary font-semibold hover:underline inline-flex items-center gap-1">
              Directions ↗
            </a>
          </div>
        </div>
      `;

      const popup = new mapboxgl.Popup({
        offset: [0, -18],
        closeButton: true,
        closeOnClick: false,
        className: "wander-mapbox-popup",
      }).setHTML(popupHtml);

      popupsRef.current.push(popup);

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: "bottom",
      })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener("click", () => {
        setActiveActivity(activity);
      });

      markersRef.current.push(marker);
    });

    // Auto-fit bounds with smooth camera transition
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: { top: 80, bottom: 60, left: 60, right: 60 },
        maxZoom: 15,
        duration: 800,
      });
    }
  }, [
    displayedActivities,
    highlightActivityId,
    activeActivity,
    validActivities,
    destination,
  ]);

  const updateMarkersRef = useRef(updateMarkers);
  updateMarkersRef.current = updateMarkers;

  // Initialize Mapbox map instance
  useEffect(() => {
    if (!isWebGLSupported()) {
      setUseRasterMapbox(true);
      return;
    }

    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const firstValid = validActivities[0];
    const staticDest = destination ? getDestinationCoords(destination) : null;
    const initialCenter: [number, number] = firstValid
      ? [firstValid.locationLng!, firstValid.locationLat!]
      : staticDest && (staticDest.lat !== 20.0 || staticDest.lng !== 0.0)
      ? [staticDest.lng, staticDest.lat]
      : [139.6917, 35.6895]; // Default fallback

    let map: mapboxgl.Map | null = null;
    try {
      map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: mapStyle,
        center: initialCenter,
        zoom: 12,
        pitch: is3DMode ? 55 : 0,
        attributionControl: true,
      });
    } catch (err) {
      console.warn("[MapboxMap] WebGL failed, switching to Mapbox raster view:", err);
      setUseRasterMapbox(true);
      return;
    }

    map.on("webglcontextlost", (e) => {
      e.originalEvent?.preventDefault();
      console.warn("[MapboxMap] WebGL context lost event:", e);
    });

    map.on("webglcontextrestored", () => {
      syncRouteLayersRef.current();
      updateMarkersRef.current();
      map?.resize();
    });

    map.on("error", (e) => {
      console.warn("[MapboxMap] Mapbox GL event error:", e);
    });

    map.addControl(
      new mapboxgl.NavigationControl({
        showCompass: true,
        visualizePitch: true,
      }),
      "bottom-right"
    );

    map.on("load", () => {
      syncRouteLayersRef.current();
      updateMarkersRef.current();
      map?.resize();
    });

    mapRef.current = map;

    return () => {
      if (map) {
        try {
          map.remove();
        } catch (e) {
          console.warn("[MapboxMap] Error during map.remove():", e);
        }
      }
      mapRef.current = null;
    };
  }, []);

  // Update map style on theme change (avoiding unnecessary initial reload)
  const currentStyleRef = useRef(mapStyle);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (currentStyleRef.current === mapStyle) return;
    currentStyleRef.current = mapStyle;

    map.setStyle(mapStyle);
    map.once("style.load", () => {
      syncRouteLayers();
      updateMarkers();
    });
  }, [mapStyle, syncRouteLayers, updateMarkers]);

  // Sync route layers whenever dayRoutes or activeDay changes
  useEffect(() => {
    syncRouteLayers();
  }, [syncRouteLayers]);

  // Update markers whenever displayed activities change
  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  // Highlight specific activity from parent (timeline hover)
  useEffect(() => {
    if (!highlightActivityId || !mapRef.current) return;
    const target = validActivities.find((a) => a.id === highlightActivityId);
    if (target && target.locationLng && target.locationLat) {
      mapRef.current.flyTo({
        center: [target.locationLng, target.locationLat],
        zoom: Math.max(mapRef.current.getZoom(), 14),
        duration: 700,
      });
    }
  }, [highlightActivityId, validActivities]);

  const toggle3DMode = () => {
    const next3D = !is3DMode;
    setIs3DMode(next3D);
    if (mapRef.current) {
      mapRef.current.easeTo({
        pitch: next3D ? 55 : 0,
        bearing: next3D ? -20 : 0,
        duration: 800,
      });
    }
  };

  if (useRasterMapbox) {
    return (
      <MapboxRasterMap
        destination={destination}
        activities={activities}
        days={days}
        selectedDay={activeDay}
        onSelectDay={handleSelectDay}
        onBack={onBack}
        highlightActivityId={highlightActivityId}
        className={className}
      />
    );
  }

  return (
    <div
      className={`relative w-full h-full min-h-[500px] flex flex-col bg-background overflow-hidden ${className}`}
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
              {isGeocoding ? "Locating..." : `${displayedActivities.length} Stops`}
            </Badge>
            <button
              type="button"
              onClick={toggle3DMode}
              className="text-[10px] px-2 py-0.5 rounded-md font-bold transition-all bg-muted hover:bg-muted/80 text-foreground cursor-pointer border border-border/60"
            >
              {is3DMode ? "3D Mode" : "2D Mode"}
            </button>
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

      {/* Mapbox Canvas Container */}
      <div className="flex-1 w-full h-full relative z-0">
        <div
          ref={mapContainerRef}
          className="w-full h-full min-h-[500px]"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}

export default MapboxMapInner;
