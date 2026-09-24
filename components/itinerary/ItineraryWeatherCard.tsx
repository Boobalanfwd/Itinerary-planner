"use client";

import React, { useEffect, useState } from "react";
import { Cloud, Droplets, Wind, Sun, Compass, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { DestinationWeatherData, DailyWeather } from "@/lib/weather";

interface ItineraryWeatherCardProps {
  destination: string;
}

export function ItineraryWeatherCard({ destination }: ItineraryWeatherCardProps) {
  const [weather, setWeather] = useState<DestinationWeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!destination) return;

    let mounted = true;
    const fetchWeather = async () => {
      try {
        const res = await fetch(`/api/weather?destination=${encodeURIComponent(destination)}`);
        const json = await res.json();
        if (mounted && json.success && json.data) {
          setWeather(json.data);
        }
      } catch (err) {
        console.warn("Could not load weather:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchWeather();
    return () => {
      mounted = false;
    };
  }, [destination]);

  if (loading) {
    return (
      <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32 rounded-lg" />
          <Skeleton className="h-5 w-16 rounded-lg" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 flex-1 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="p-5 rounded-3xl bg-card/85 border border-border/80 shadow-soft space-y-3.5 backdrop-blur-sm">
      {/* Top row: Current Weather */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{weather.current.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-foreground font-mono">
                {weather.current.temp}°C
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                {weather.current.condition}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">{weather.location}</p>
          </div>
        </div>

        {/* Current Metrics */}
        <div className="flex items-center gap-3.5 text-xs text-muted-foreground font-mono">
          <div className="flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-sky-500" />
            <span>{weather.current.humidity}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-teal-500" />
            <span>{weather.current.windSpeed} km/h</span>
          </div>
        </div>
      </div>

      {/* 5-Day Forecast Strip */}
      <div className="grid grid-cols-5 gap-2 pt-2.5 border-t border-border/50">
        {weather.daily.slice(0, 5).map((d) => (
          <div
            key={d.date}
            className="flex flex-col items-center justify-center p-2 rounded-2xl bg-muted/40 border border-border/40 text-center"
          >
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {d.dayName}
            </span>
            <span className="text-lg my-0.5">{d.icon}</span>
            <div className="text-xs font-mono font-bold text-foreground">
              {d.tempMax}°
            </div>
            <div className="text-[10px] font-mono text-muted-foreground">
              {d.tempMin}°
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
