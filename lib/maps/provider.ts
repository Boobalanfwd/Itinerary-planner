export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface GeocodedPlace {
  placeId: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  category?: string;
  raw?: Record<string, any>;
}

export interface TravelTimeResult {
  distanceMeters: number;
  durationMinutes: number;
  mode: "walking" | "driving" | "transit";
}

export interface MapProvider {
  readonly name: string;

  geocode(
    query: string,
    nearLocation?: string
  ): Promise<GeocodedPlace | null>;

  reverseGeocode(
    lat: number,
    lng: number
  ): Promise<GeocodedPlace | null>;

  calculateDistanceAndTime(
    origin: GeoCoordinates,
    destination: GeoCoordinates,
    mode?: "walking" | "driving" | "transit"
  ): Promise<TravelTimeResult>;
}
