import { describe, it, expect } from "vitest";
import { decodeWmoWeatherCode } from "@/lib/weather";

describe("decodeWmoWeatherCode", () => {
  it("should decode WMO code 0 to Clear Sky with sun icon", () => {
    const result = decodeWmoWeatherCode(0);
    expect(result.condition).toBe("Clear Sky");
    expect(result.icon).toBe("☀️");
  });

  it("should decode WMO code 1 to Mainly Clear", () => {
    const result = decodeWmoWeatherCode(1);
    expect(result.condition).toBe("Mainly Clear");
  });

  it("should decode WMO code 3 to Overcast with cloud icon", () => {
    const result = decodeWmoWeatherCode(3);
    expect(result.condition).toBe("Overcast");
    expect(result.icon).toBe("☁️");
  });

  it("should decode WMO code 61 to Rain", () => {
    const result = decodeWmoWeatherCode(61);
    expect(result.condition).toBe("Rain");
  });

  it("should decode WMO code 71 to Snow with snowflake icon", () => {
    const result = decodeWmoWeatherCode(71);
    expect(result.condition).toBe("Snow");
    expect(result.icon).toBe("❄️");
  });

  it("should decode WMO code 95 to Thunderstorm", () => {
    const result = decodeWmoWeatherCode(95);
    expect(result.condition).toBe("Thunderstorm");
  });

  it("should return fallback Clear condition for unknown WMO codes", () => {
    const result = decodeWmoWeatherCode(9999);
    expect(result.condition).toBe("Clear");
    expect(result.icon).toBe("🌤️");
  });
});
