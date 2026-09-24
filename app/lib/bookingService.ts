export function getBookingUrl(
  type: "flight" | "hotel" | "restaurant",
  details: any
): string {
  const { destination, checkIn, checkOut, guests, name } = details;

  switch (type) {
    case "flight":
      // Skyscanner format (simplified, would ideally need airport codes)
      // https://www.skyscanner.com/transport/flights/lond/nyca/241225/241231/
      return `https://www.skyscanner.com/transport/flights/${encodeURIComponent(
        details.origin || "anywhere"
      )}/${encodeURIComponent(destination)}`;

    case "hotel":
      // Booking.com search
      return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
        name || destination
      )}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${guests || 2}`;

    case "restaurant":
      // OpenTable or Google Maps search fallback
      return `https://www.google.com/maps/search/${encodeURIComponent(
        name + " restaurant"
      )}`;

    default:
      return "#";
  }
}
