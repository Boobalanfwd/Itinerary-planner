import { getOpenMeteoForecast, getForecastForDestination } from "@/lib/weather";

export interface HourlyForecast {
  time: string;
  temp: number;
  condition: string;
  icon: string;
  precipitation: number;
  hour: number;
}

export interface WeatherAlert {
  event: string;
  severity: "minor" | "moderate" | "severe" | "extreme";
  description: string;
  start: string;
  end: string;
}

export interface DailyForecast {
  date: string;
  dayName: string;
  tempMin: number;
  tempMax: number;
  condition: string;
  icon: string;
}

export interface WeatherData {
  current: {
    temp: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    icon: string;
  };
  forecast: DailyForecast[];
  hourly?: HourlyForecast[];
  alerts?: WeatherAlert[];
  location: string;
}

export async function fetchWeather(
  location: string,
  coordinates?: { lat: number; lon: number }
): Promise<WeatherData> {
  try {
    let result = coordinates
      ? await getOpenMeteoForecast(coordinates.lat, coordinates.lon, location)
      : await getForecastForDestination(location);

    if (!result) {
      return {
        current: {
          temp: 21,
          condition: "Partly Cloudy",
          humidity: 48,
          windSpeed: 12,
          icon: "⛅",
        },
        forecast: [
          { date: "Day 1", dayName: "Today", tempMin: 15, tempMax: 23, condition: "Sunny", icon: "☀️" },
          { date: "Day 2", dayName: "Tomorrow", tempMin: 14, tempMax: 22, condition: "Partly Cloudy", icon: "⛅" },
          { date: "Day 3", dayName: "Next", tempMin: 16, tempMax: 24, condition: "Clear", icon: "🌤️" },
        ],
        location,
      };
    }

    return {
      current: {
        temp: result.current.temp,
        condition: result.current.condition,
        humidity: result.current.humidity,
        windSpeed: result.current.windSpeed,
        icon: result.current.icon,
      },
      forecast: result.daily.map((d) => ({
        date: d.date,
        dayName: d.dayName,
        tempMin: d.tempMin,
        tempMax: d.tempMax,
        condition: d.condition,
        icon: d.icon,
      })),
      hourly: result.hourly.map((h) => ({
        time: h.time,
        temp: h.temp,
        condition: h.condition,
        icon: h.icon,
        precipitation: h.precipitation,
        hour: h.hour,
      })),
      location: result.location,
    };
  } catch (error) {
    console.error("[fetchWeather] Error:", error);
    return {
      current: {
        temp: 20,
        condition: "Mild",
        humidity: 50,
        windSpeed: 10,
        icon: "⛅",
      },
      forecast: [],
      location,
    };
  }
}

export const getWeatherForLocation = fetchWeather;
export default fetchWeather;
