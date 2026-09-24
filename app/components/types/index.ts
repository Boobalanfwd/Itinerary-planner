/**
 * Types and Interfaces for AI Itinerary Planner
 */

export type ActivityType =
  | "ACTIVITY"
  | "FLIGHT"
  | "ACCOMMODATION"
  | "RESTAURANT"
  | "TRANSPORTATION"
  | "FOOD_DRINK"
  | "ACTIVITIES"
  | "SIGHTSEEING"
  | "ENTERTAINMENT"
  | "SHOPPING"
  | "MISCELLANEOUS"
  | "travel"
  | "food"
  | "hotel"
  | "nightlife"
  | "sightseeing"
  | "shopping";

export interface Location {
  lat: number;
  lng: number;
  name: string;
}

export interface FlightInfo {
  airline?: string;
  flightNumber?: string;
  departure?: string;
  arrival?: string;
  departureTime?: string;
  arrivalTime?: string;
  terminal?: string;
  seat?: string;
  bookingRef?: string;
}

export interface Activity {
  id?: string;
  time: string;
  title: string;
  description?: string;
  desc?: string;
  type: ActivityType;
  location?: Location;
  locationName?: string;
  locationLat?: number;
  locationLng?: number;
  address?: string;
  bookingUrl?: string;
  notes?: string;
  expenseId?: string;
  duration?: number;
  cost?: number;
  order?: number;
  position?: number;
  flightInfo?: FlightInfo;
}


export interface Day {
  id?: string; // Database ID (optional for new days)
  day: number;
  title: string;
  theme?: string;
  date: string;
  activities: Activity[];
}

export interface ItineraryData {
  id?: string; // Database ID (optional for new itineraries)
  destination: string;
  duration: string | number; // Allow number for day count
  budget: string | number; // Allow number for amount
  totalBudget?: number; // Explicit budget field
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  tags: string[];
  days: Day[];
  image?: string;
  title?: string; // Explicit title field
  description?: string; // Description field
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  visibility?: "PRIVATE" | "PUBLIC" | "SHARED";
  shareToken?: string;
  createdAt?: Date;
  updatedAt?: Date;

  // Social fields
  isPublic?: boolean;
  allowCloning?: boolean;
  viewCount?: number;
  likeCount?: number;
  cloneCount?: number;
  reviewCount?: number;
  averageRating?: number;
}

export type ViewState = "landing" | "loading" | "itinerary" | "error" | "map";

// API Request/Response Types
export interface GenerateItineraryRequest {
  prompt: string;
}

export interface GenerateItineraryResponse {
  success: boolean;
  data?: ItineraryData;
  error?: string;
}

export interface ListItinerariesResponse {
  success: boolean;
  data?: ItineraryData[];
  total?: number;
  error?: string;
}
