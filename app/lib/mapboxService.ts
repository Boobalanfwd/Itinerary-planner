export interface MapboxPlace {
  id: string;
  name: string;
  address: string;
  category?: string;
  coordinates: [number, number];
  distance?: number;
}

export async function searchPlaces(
  query: string,
  proximity: [number, number],
  limit: number = 10,
  types: string = "poi"
): Promise<MapboxPlace[]> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    console.error("Mapbox token is missing");
    return [];
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?proximity=${proximity[0]},${
        proximity[1]
      }&limit=${limit}&types=${types}&access_token=${token}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch places");
    }

    const data = await response.json();

    return data.features.map((feature: any) => ({
      id: feature.id,
      name: feature.text,
      address: feature.place_name,
      category: feature.properties.category,
      coordinates: feature.center,
    }));
  } catch (error) {
    console.error("Error searching Mapbox places:", error);
    return [];
  }
}
