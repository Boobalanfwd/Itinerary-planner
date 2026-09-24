"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useTheme } from "next-themes";
import { Search, X, MapPin, Loader2 } from "lucide-react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface LocationPickerValue {
  locationName: string;
  address: string;
  lat: number;
  lng: number;
}

interface LocationPickerMapProps {
  initialDestination?: string;
  value?: LocationPickerValue | null;
  onChange: (location: LocationPickerValue | null) => void;
}

interface GeocodingFeature {
  id: string;
  place_name: string;
  text: string;
  center: [number, number];
}

export function LocationPickerMap({
  initialDestination,
  value,
  onChange,
}: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const { resolvedTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodingFeature[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mapStyle =
    resolvedTheme === "dark"
      ? "mapbox://styles/mapbox/dark-v11"
      : "mapbox://styles/mapbox/streets-v12";

  // Place marker and emit value
  const placeMarker = useCallback(
    (lat: number, lng: number, name: string, address: string) => {
      if (!mapRef.current) return;

      // Remove old marker
      if (markerRef.current) {
        markerRef.current.remove();
      }

      // Create new marker element
      const el = document.createElement("div");
      el.className = "location-picker-marker";
      el.innerHTML = `
        <div style="
          width: 36px; height: 36px; border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg); background: #0D9488;
          border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.35);
          display: flex; align-items: center; justify-content: center;
        ">
          <div style="transform: rotate(45deg); color: white; font-size: 14px; font-weight: bold;">📍</div>
        </div>
      `;

      markerRef.current = new mapboxgl.Marker({ element: el, draggable: true })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);

      // Drag end → reverse geocode
      markerRef.current.on("dragend", async () => {
        const lngLat = markerRef.current!.getLngLat();
        const reversed = await reverseGeocode(lngLat.lat, lngLat.lng);
        onChange({
          locationName: reversed.name,
          address: reversed.address,
          lat: lngLat.lat,
          lng: lngLat.lng,
        });
      });

      onChange({ locationName: name, address, lat, lng });
      mapRef.current.flyTo({ center: [lng, lat], zoom: 14, duration: 800 });
    },
    [onChange]
  );

  // Reverse geocode to get name from coordinates
  const reverseGeocode = async (
    lat: number,
    lng: number
  ): Promise<{ name: string; address: string }> => {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=poi,address,place&limit=1`
      );
      const data = await res.json();
      const feature = data.features?.[0];
      return {
        name: feature?.text || feature?.place_name?.split(",")?.[0] || "Selected Location",
        address: feature?.place_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      };
    } catch {
      return {
        name: "Selected Location",
        address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      };
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      zoom: 11,
      center: [139.6917, 35.6895], // Default to Tokyo; will geocode destination
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("click", async (e) => {
      const { lat, lng } = e.lngLat;
      const reversed = await reverseGeocode(lat, lng);
      placeMarker(lat, lng, reversed.name, reversed.address);
      setSearchQuery(reversed.name);
    });

    mapRef.current = map;

    // Geocode initial destination to center the map
    if (initialDestination) {
      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(initialDestination)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
      )
        .then((r) => r.json())
        .then((data) => {
          const center = data.features?.[0]?.center;
          if (center && mapRef.current) {
            mapRef.current.setCenter(center);
          }
        })
        .catch(() => {});
    }

    // If value already set, place marker
    if (value) {
      map.on("load", () => {
        placeMarker(value.lat, value.lng, value.locationName, value.address);
        setSearchQuery(value.locationName);
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update style on theme change
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setStyle(mapStyle);
    }
  }, [mapStyle]);

  // Debounced search
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!q.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const proximity = mapRef.current
          ? `&proximity=${mapRef.current.getCenter().lng},${mapRef.current.getCenter().lat}`
          : "";
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}&types=poi,address,place&limit=5${proximity}`
        );
        const data = await res.json();
        setSuggestions(data.features || []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  const handleSelectSuggestion = (feature: GeocodingFeature) => {
    const [lng, lat] = feature.center;
    const name = feature.text || feature.place_name.split(",")[0];
    const address = feature.place_name;
    placeMarker(lat, lng, name, address);
    setSearchQuery(name);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleClearLocation = () => {
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    onChange(null);
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-2">
      {/* Search Input */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Search for a place or click the map..."
            className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-border/70 bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 w-4 h-4 text-primary animate-spin" />
          )}
          {!isSearching && searchQuery && (
            <button
              type="button"
              onClick={handleClearLocation}
              className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Autocomplete Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover border border-border/70 rounded-xl shadow-xl overflow-hidden">
            {suggestions.map((f) => (
              <button
                key={f.id}
                type="button"
                onMouseDown={() => handleSelectSuggestion(f)}
                className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/60 transition-colors"
              >
                <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{f.text || f.place_name.split(",")[0]}</p>
                  <p className="text-xs text-muted-foreground truncate">{f.place_name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-52 rounded-xl overflow-hidden border border-border/70 shadow-sm"
      />

      {/* Coordinates badge */}
      {value && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{value.address}</span>
          <span className="ml-auto font-mono text-[10px] text-primary/70 flex-shrink-0">
            {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
          </span>
        </div>
      )}

      {!value && (
        <p className="text-xs text-muted-foreground text-center py-1">
          Search for a place or click anywhere on the map to drop a pin
        </p>
      )}
    </div>
  );
}
