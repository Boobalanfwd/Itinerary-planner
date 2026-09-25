"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useTheme } from "next-themes";
import { getDestinationCoords } from "@/lib/country-code";
import { MapPin, Navigation } from "lucide-react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

function isWebGL2Supported(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2"));
  } catch {
    return false;
  }
}

interface JournalMapboxMapProps {
  entries: any[];
  destination?: string;
  showRouteLine?: boolean;
}

export function JournalMapboxMap({
  entries = [],
  destination,
  showRouteLine = true,
}: JournalMapboxMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const { resolvedTheme } = useTheme();

  const [useStaticFallback, setUseStaticFallback] = useState(() => !isWebGL2Supported());

  const mapStyle =
    resolvedTheme === "dark"
      ? "mapbox://styles/mapbox/dark-v11"
      : "mapbox://styles/mapbox/streets-v12";

  // Build static image URL for non-WebGL fallback
  const staticMapUrl = useMemo(() => {
    const styleId = resolvedTheme === "dark" ? "dark-v11" : "streets-v12";
    const pins = entries
      .slice(0, 10)
      .map((entry, idx) => {
        let lat = entry.locationLat;
        let lng = entry.locationLng;
        if (lat === null || lat === undefined || lng === null || lng === undefined) {
          const destCoords = destination ? getDestinationCoords(destination) : null;
          lat = (destCoords?.lat ?? 13.0827) + idx * 0.015;
          lng = (destCoords?.lng ?? 80.2707) + idx * 0.012;
        }
        return `pin-s-${idx + 1}+F59E0B(${lng},${lat})`;
      })
      .join(",");

    if (pins) {
      return `https://api.mapbox.com/styles/v1/mapbox/${styleId}/static/${pins}/auto/800x420@2x?access_token=${MAPBOX_TOKEN}`;
    }

    const destCoords = destination ? getDestinationCoords(destination) : null;
    const centerLng = destCoords?.lng ?? 80.2707;
    const centerLat = destCoords?.lat ?? 13.0827;
    return `https://api.mapbox.com/styles/v1/mapbox/${styleId}/static/${centerLng},${centerLat},11/800x420@2x?access_token=${MAPBOX_TOKEN}`;
  }, [entries, destination, resolvedTheme]);

  useEffect(() => {
    if (!isWebGL2Supported()) {
      setUseStaticFallback(true);
      return;
    }

    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const destCoords = destination ? getDestinationCoords(destination) : null;
    const initialCenter: [number, number] = destCoords
      ? [destCoords.lng, destCoords.lat]
      : [80.2707, 13.0827];

    let map: mapboxgl.Map | null = null;
    try {
      map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: mapStyle,
        center: initialCenter,
        zoom: 11,
        attributionControl: true,
      });
    } catch (err) {
      console.warn("[JournalMapboxMap] WebGL initialization failed, using static Mapbox view:", err);
      setUseStaticFallback(true);
      return;
    }

    map.addControl(
      new mapboxgl.NavigationControl({
        showCompass: true,
        visualizePitch: true,
      }),
      "bottom-right"
    );

    mapInstanceRef.current = map;

    map.on("load", () => {
      map?.resize();
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (map) {
        try {
          map.remove();
        } catch (e) {
          // ignore cleanup errors
        }
      }
      mapInstanceRef.current = null;
    };
  }, []);

  // Update style when theme changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && map.isStyleLoaded()) {
      map.setStyle(mapStyle);
    }
  }, [mapStyle]);

  // Update markers & route line whenever entries change or style reloads
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const renderData = () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const validCoordinates: [number, number][] = [];

      entries.forEach((entry, idx) => {
        let lat = entry.locationLat;
        let lng = entry.locationLng;

        if (lat === null || lat === undefined || lng === null || lng === undefined) {
          const destCoords = destination ? getDestinationCoords(destination) : null;
          const baseLat = destCoords?.lat ?? 13.0827;
          const baseLng = destCoords?.lng ?? 80.2707;
          lat = baseLat + idx * 0.015;
          lng = baseLng + idx * 0.012;
        }

        const coord: [number, number] = [Number(lng), Number(lat)];
        validCoordinates.push(coord);

        const el = document.createElement("div");
        el.className = "journal-mapbox-pin";
        el.style.width = "34px";
        el.style.height = "44px";
        el.style.cursor = "pointer";
        el.style.filter = "drop-shadow(0 4px 10px rgba(245, 158, 11, 0.4))";

        el.innerHTML = `
          <svg
            width="34"
            height="44"
            viewBox="0 0 32 42"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16 0C7.163 0 0 7.163 0 16c0 10.5 13.5 24.2 15.2 25.8.4.4 1.2.4 1.6 0C18.5 40.2 32 26.5 32 16 32 7.163 24.837 0 16 0z"
              fill="url(#amber-grad)"
              stroke="#ffffff"
              stroke-width="2"
            />
            <defs>
              <linearGradient id="amber-grad" x1="0" y1="0" x2="32" y2="42" gradientUnits="userSpaceOnUse">
                <stop stop-color="#F59E0B" />
                <stop offset="1" stop-color="#EA580C" />
              </linearGradient>
            </defs>
            <text
              x="16"
              y="18"
              text-anchor="middle"
              dominant-baseline="middle"
              font-size="12"
            >📍</text>
          </svg>
        `;

        const photoHtml = entry.photos?.[0]
          ? `<img src="${entry.photos[0]}" style="width: 100%; height: 95px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />`
          : "";

        const popupContent = `
          <div style="font-family: inherit; max-width: 200px; padding: 4px;">
            ${photoHtml}
            <div style="font-size: 10px; font-weight: 800; color: #F59E0B; text-transform: uppercase; letter-spacing: 0.5px;">Day ${entry.dayNumber || 1} • ${entry.mood || "Memory"}</div>
            <div style="font-size: 13px; font-weight: 700; color: #111; margin-top: 2px;">${entry.title || entry.locationName || "Visited Place"}</div>
            <p style="font-size: 11px; color: #555; margin-top: 4px; line-height: 1.35;">${(entry.notes || "").slice(0, 85)}...</p>
          </div>
        `;

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat(coord)
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
      });

      const sourceId = "journal-route-source";
      const layerId = "journal-route-layer";

      if (map.getSource(sourceId)) {
        (map.getSource(sourceId) as mapboxgl.GeoJSONSource).setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: showRouteLine && validCoordinates.length > 1 ? validCoordinates : [],
          },
        });
      } else if (showRouteLine && validCoordinates.length > 1) {
        map.addSource(sourceId, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: validCoordinates,
            },
          },
        });

        map.addLayer({
          id: layerId,
          type: "line",
          source: sourceId,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#F59E0B",
            "line-width": 3.5,
            "line-opacity": 0.85,
            "line-dasharray": [2, 2],
          },
        });
      }

      if (validCoordinates.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        validCoordinates.forEach((c) => bounds.extend(c));
        map.fitBounds(bounds, {
          padding: 60,
          maxZoom: 14,
          duration: 800,
        });
      }

      map.resize();
    };

    if (map.isStyleLoaded()) {
      renderData();
    } else {
      map.once("load", renderData);
    }
  }, [entries, destination, showRouteLine]);

  if (useStaticFallback) {
    return (
      <div className="relative w-full h-[420px] rounded-3xl overflow-hidden shadow-inner bg-card group">
        <img
          src={staticMapUrl}
          alt={`Map of ${destination || "Trip Journal"}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-3 left-4 z-10 flex items-center gap-2 pointer-events-none">
          <span className="text-[10px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-xs">
            © Mapbox
          </span>
          <span className="text-[10px] font-semibold text-white/80 bg-black/40 px-2 py-0.5 rounded-full">
            {entries.length} Memory Pins
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[420px] rounded-3xl overflow-hidden shadow-inner bg-card">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}

export default JournalMapboxMap;
