"use client";

import React, { useEffect, useState } from "react";
import { Cloud, Droplets, Wind, Loader, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { getWeatherForLocation, WeatherData } from "../../lib/weatherService";

interface WeatherWidgetProps {
  location: string;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ location }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [viewMode, setViewMode] = useState<"daily" | "hourly">("daily");

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      setError(false);
      try {
        const data = await getWeatherForLocation(location);
        setWeather(data);
      } catch (err) {
        console.error("Weather fetch error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [location]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-2xl p-6 border border-blue-500/30 backdrop-blur-sm">
        <div className="flex items-center justify-center py-8">
          <Loader className="w-8 h-8 text-blue-400 animate-spin" />
          <span className="ml-3 text-blue-300">Loading weather data...</span>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-2xl p-6 border border-blue-500/30 backdrop-blur-sm">
        <div className="flex items-center justify-center py-8 text-blue-300">
          <AlertCircle className="w-6 h-6 mr-2" />
          <span>Weather data unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-2xl p-6 border border-blue-500/30 backdrop-blur-sm"
    >
      {/* Weather Alerts */}
      {weather.alerts && weather.alerts.length > 0 && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-red-300 mb-1">
                ⚠️ {weather.alerts[0].event}
              </h4>
              <p className="text-xs text-red-200 line-clamp-2">
                {weather.alerts[0].description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Weather */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {weather.location}
          </h3>
          <p className="text-blue-300">{weather.current.condition}</p>
        </div>
        <div className="text-right">
          <div className="text-5xl font-bold text-white">
            {weather.current.temp}°C
          </div>
          <div className="text-4xl">{weather.current.icon}</div>
        </div>
      </div>

      {/* Weather Details */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-2 text-blue-200">
          <Droplets className="w-5 h-5" />
          <span>{weather.current.humidity}% Humidity</span>
        </div>
        <div className="flex items-center gap-2 text-blue-200">
          <Wind className="w-5 h-5" />
          <span>{weather.current.windSpeed} km/h Wind</span>
        </div>
      </div>

      {/* Forecast Toggle */}
      <div className="border-t border-blue-500/30 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-blue-300">Forecast</h4>
          {weather.hourly && weather.hourly.length > 0 && (
            <div className="flex gap-1 bg-blue-900/30 rounded-lg p-1">
              <button
                onClick={() => setViewMode("daily")}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  viewMode === "daily"
                    ? "bg-blue-500 text-white"
                    : "text-blue-300 hover:text-white"
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setViewMode("hourly")}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  viewMode === "hourly"
                    ? "bg-blue-500 text-white"
                    : "text-blue-300 hover:text-white"
                }`}
              >
                Hourly
              </button>
            </div>
          )}
        </div>

        {/* Daily Forecast */}
        {viewMode === "daily" && (
          <div className="grid grid-cols-5 gap-2">
            {weather.forecast.map((day, index) => (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-blue-900/30 rounded-lg p-3 text-center hover:bg-blue-900/50 transition-colors"
              >
                <div className="text-xs text-blue-300 mb-1">{day.dayName}</div>
                <div className="text-2xl mb-1">{day.icon}</div>
                <div className="text-xs text-white font-semibold">
                  {day.tempMax}° / {day.tempMin}°
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Hourly Forecast */}
        {viewMode === "hourly" && weather.hourly && (
          <div className="overflow-x-auto -mx-2 px-2">
            <div className="flex gap-3 min-w-max">
              {weather.hourly.map((hour, index) => (
                <motion.div
                  key={`${hour.time}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-blue-900/30 rounded-lg p-3 text-center hover:bg-blue-900/50 transition-colors min-w-[70px]"
                >
                  <div className="text-xs text-blue-300 mb-1">{hour.time}</div>
                  <div className="text-2xl mb-1">{hour.icon}</div>
                  <div className="text-sm text-white font-semibold mb-1">
                    {hour.temp}°
                  </div>
                  {hour.precipitation > 0 && (
                    <div className="text-xs text-blue-400">
                      💧 {hour.precipitation}%
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Activity Recommendations */}
      <div className="mt-4 p-3 bg-blue-900/30 rounded-lg">
        <p className="text-xs text-blue-200">
          💡 <strong>Travel Tip:</strong> {getActivityRecommendation(weather)}
        </p>
      </div>
    </motion.div>
  );
};

function getActivityRecommendation(weather: WeatherData): string {
  const current = weather.current.condition.toLowerCase();
  const hasRainSoon =
    weather.hourly?.some((h) => h.precipitation > 50) || false;
  const temp = weather.current.temp;

  // Temperature-based advice
  if (temp > 30) {
    return "Very hot! Plan indoor activities during midday. Stay hydrated and seek shade.";
  } else if (temp < 5) {
    return "Cold weather! Layer up and plan shorter outdoor activities. Hot drinks recommended.";
  }

  // Condition-based advice
  if (current.includes("rain")) {
    return "Rainy conditions. Perfect for museums, indoor markets, and covered attractions. Pack an umbrella!";
  } else if (current.includes("clear") || current.includes("sun")) {
    if (hasRainSoon) {
      return "Sunny now but rain expected later. Plan outdoor activities for the morning!";
    }
    return "Beautiful weather! Ideal for outdoor sightseeing, parks, and walking tours. Don't forget sunscreen.";
  } else if (current.includes("cloud")) {
    return "Comfortable conditions for all-day exploring. Great for photography without harsh shadows!";
  } else if (current.includes("snow")) {
    return "Snowy conditions! Perfect for winter activities. Dress warmly and watch for slippery surfaces.";
  }

  return "Check hourly forecast to plan your activities around the best weather windows!";
}
