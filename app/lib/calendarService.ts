import ical from "ical-generator";

interface CalendarActivity {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  type?: string;
}

interface CalendarItinerary {
  id: string;
  title: string;
  destination: string;
  activities: CalendarActivity[];
}

/**
 * Generate an .ics calendar file from an itinerary
 */
export function generateCalendarFile(itinerary: CalendarItinerary): string {
  const calendar = ical({
    name: `${itinerary.title || itinerary.destination} - AI Itinerary Planner`,
    description: `Travel itinerary for ${itinerary.destination}`,
    prodId: {
      company: "AI Itinerary Planner",
      product: "Travel Planner",
    },
    timezone: "UTC",
  });

  // Add each activity as an event
  itinerary.activities.forEach((activity) => {
    const event = calendar.createEvent({
      id: `activity-${activity.id}@aiitinerary.com`,
      start: activity.startTime,
      end: activity.endTime,
      summary: activity.title,
      description: activity.description || "",
      location: activity.location || itinerary.destination,
      url: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/itinerary/${itinerary.id}`,
    });

    // Set status and busy status using method chaining
    event.status("CONFIRMED" as any);
    event.busystatus("BUSY" as any);

    // Add activity type as category if available
    if (activity.type) {
      event.categories([{ name: activity.type }]);
    }

    // Add alarm/reminder 1 hour before
    const alarm = event.createAlarm({
      trigger: 3600, // 1 hour before in seconds
      description: `Reminder: ${activity.title}`,
    });
    alarm.type("display" as any);
  });

  return calendar.toString();
}

/**
 * Generate calendar file name
 */
export function getCalendarFileName(itinerary: CalendarItinerary): string {
  const sanitized = itinerary.destination
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${sanitized}-itinerary.ics`;
}

/**
 * Parse activity time from itinerary data
 */
export function parseActivityTime(date: Date, timeString?: string): Date {
  const activityDate = new Date(date);

  if (timeString) {
    // Parse time string (e.g., "09:00", "14:30")
    const [hours, minutes] = timeString.split(":").map(Number);
    activityDate.setHours(hours, minutes, 0, 0);
  } else {
    // Default to 9 AM if no time specified
    activityDate.setHours(9, 0, 0, 0);
  }

  return activityDate;
}

/**
 * Calculate end time based on duration
 */
export function calculateEndTime(
  startTime: Date,
  durationMinutes: number = 120 // Default 2 hours
): Date {
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + durationMinutes);
  return endTime;
}
