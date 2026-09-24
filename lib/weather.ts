import { nominatimProvider } from "@/lib/maps/nominatim";

export interface WeatherCondition {
  condition: string;
  icon: string;
}

export function decodeWmoWeatherCode(code: number): WeatherCondition {
  switch (code) {
    case 0:
      return { condition: "Clear Sky", icon: "☀️" };
    case 1:
      return { condition: "Mainly Clear", icon: "🌤️" };
    case 2:
      return { condition: "Partly Cloudy", icon: "⛅" };
    case 3:
      return { condition: "Overcast", icon: "☁️" };
    case 45:
    case 48:
      return { condition: "Foggy", icon: "🌫️" };
    case 51:
    case 53:
    case 55:
      return { condition: "Drizzle", icon: "🌦️" };
    case 61:
    case 63:
    case 65:
      return { condition: "Rain", icon: "🌧️" };
    case 71:
    case 73:
    case 75:
    case 77:
      return { condition: "Snow", icon: "❄️" };
    case 80:
    case 81:
    case 82:
      return { condition: "Rain Showers", icon: "🌦️" };
    case 85:
    case 86:
      return { condition: "Snow Showers", icon: "🌨️" };
    case 95:
      return { condition: "Thunderstorm", icon: "⛈️" };
    case 96:
    case 99:
      return { condition: "Hail & Storms", icon: "⛈️" };
    default:
      return { condition: "Clear", icon: "🌤️" };
  }
}

export interface DailyWeather {
  date: string;
  dayName: string;
  tempMin: number;
  tempMax: number;
  condition: string;
  icon: string;
  precipitationProbability: number;
}

export interface HourlyWeather {
  time: string;
  hour: number;
  temp: number;
  condition: string;
  icon: string;
  precipitation: number;
}

export interface DestinationWeatherData {
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  current: {
    temp: number;
    humidity: number;
    windSpeed: number;
    condition: string;
    icon: string;
  };
  daily: DailyWeather[];
  hourly: HourlyWeather[];
}

export async function getOpenMeteoForecast(
  lat: number,
  lng: number,
  locationName: string = "Destination"
): Promise<DestinationWeatherData | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;

    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.warn(`[Open-Meteo] HTTP ${response.status} for lat:${lat} lng:${lng}`);
      return null;
    }

    const data = await response.json();

    const currentWmo = decodeWmoWeatherCode(data.current?.weather_code ?? 0);

    // Format daily forecast (up to 7 days)
    const daily: DailyWeather[] = [];
    if (data.daily?.time) {
      for (let i = 0; i < data.daily.time.length; i++) {
        const dateStr = data.daily.time[i];
        const dateObj = new Date(dateStr);
        const wmo = decodeWmoWeatherCode(data.daily.weather_code[i] ?? 0);

        daily.push({
          date: dateStr,
          dayName: dateObj.toLocaleDateString("en-US", { weekday: "short" }),
          tempMin: Math.round(data.daily.temperature_2m_min[i]),
          tempMax: Math.round(data.daily.temperature_2m_max[i]),
          condition: wmo.condition,
          icon: wmo.icon,
          precipitationProbability:
            data.daily.precipitation_probability_max?.[i] ?? 0,
        });
      }
    }

    // Format next 24 hourly steps
    const hourly: HourlyWeather[] = [];
    if (data.hourly?.time) {
      const now = new Date();
      let count = 0;
      for (let i = 0; i < data.hourly.time.length && count < 24; i++) {
        const stepTime = new Date(data.hourly.time[i]);
        if (stepTime >= now) {
          const wmo = decodeWmoWeatherCode(data.hourly.weather_code[i] ?? 0);
          hourly.push({
            time: stepTime.toLocaleTimeString("en-US", {
              hour: "numeric",
              hour12: true,
            }),
            hour: stepTime.getHours(),
            temp: Math.round(data.hourly.temperature_2m[i]),
            condition: wmo.condition,
            icon: wmo.icon,
            precipitation: data.hourly.precipitation_probability?.[i] ?? 0,
          });
          count++;
        }
      }
    }

    return {
      location: locationName,
      coordinates: { lat, lng },
      current: {
        temp: Math.round(data.current?.temperature_2m ?? 20),
        humidity: Math.round(data.current?.relative_humidity_2m ?? 50),
        windSpeed: Math.round(data.current?.wind_speed_10m ?? 10),
        condition: currentWmo.condition,
        icon: currentWmo.icon,
      },
      daily,
      hourly,
    };
  } catch (error) {
    console.error("[Open-Meteo] Forecast error:", error);
    return null;
  }
}

export async function getForecastForDestination(
  destination: string
): Promise<DestinationWeatherData | null> {
  // First geocode destination
  const place = await nominatimProvider.geocode(destination);
  if (!place) {
    return null;
  }

  return getOpenMeteoForecast(place.lat, place.lng, destination);
}
