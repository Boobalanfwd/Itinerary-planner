import { describe, it, expect } from "vitest";
import { generateItineraryPDFBuffer, getItineraryPDFFilename } from "@/app/lib/pdfService";
import type { PDFItineraryData } from "@/components/itinerary/pdf/PDFCoverPage";

describe("PDF Service & Export Logic", () => {
  describe("getItineraryPDFFilename", () => {
    it("should generate a clean slugified filename with duration", () => {
      const filename = getItineraryPDFFilename({
        destination: "Tokyo, Japan",
        duration: 7,
      });
      expect(filename).toBe("wander-ai-tokyo-japan-7d.pdf");
    });

    it("should handle destinations with symbols and whitespace", () => {
      const filename = getItineraryPDFFilename({
        destination: "Rome & Vatican City (Italy)!",
        duration: 4,
      });
      expect(filename).toBe("wander-ai-rome-vatican-city-italy-4d.pdf");
    });

    it("should handle missing duration gracefully", () => {
      const filename = getItineraryPDFFilename({
        destination: "Paris",
      });
      expect(filename).toBe("wander-ai-paris.pdf");
    });
  });

  describe("generateItineraryPDFBuffer", () => {
    const mock7DayItinerary: PDFItineraryData = {
      id: "trip-test-7d",
      title: "Complete 7-Day Tokyo Explorer",
      destination: "Tokyo, Japan",
      description: "An intensive immersion into historic neighborhoods, Tsukiji dining, and modern tech districts.",
      duration: 7,
      startDate: new Date("2026-10-01"),
      endDate: new Date("2026-10-07"),
      budgetAmount: 2500,
      currency: "$",
      travelers: "2 Adults",
      days: Array.from({ length: 7 }, (_, i) => ({
        dayNumber: i + 1,
        title: `Day ${i + 1} Discovery in Tokyo`,
        theme: i % 2 === 0 ? "Historic & Cultural Landmarks" : "Culinary & Vibrant Neighborhoods",
        date: new Date(2026, 9, 1 + i),
        activities: [
          {
            id: `act-${i + 1}-1`,
            time: "09:00 AM",
            title: `Morning Sightseeing ${i + 1}`,
            description: "Explore traditional gardens and historic temple grounds.",
            type: "sightseeing",
            locationName: "Senso-ji Temple",
            address: "2-3-1 Asakusa, Taito City, Tokyo",
            cost: 0,
            duration: 90,
            notes: "Arrive before 9 AM to avoid tour buses.",
          },
          {
            id: `act-${i + 1}-2`,
            time: "01:00 PM",
            title: `Authentic Lunch ${i + 1}`,
            description: "Local specialty noodle shop renowned for hand-pulled soba.",
            type: "food",
            locationName: "Soba Kanda",
            address: "Chiyoda City, Tokyo",
            cost: 25,
            duration: 60,
          },
          {
            id: `act-${i + 1}-3`,
            time: "04:30 PM",
            title: `Evening District Walk ${i + 1}`,
            description: "Sunset observation deck and evening shopping promenade.",
            type: "shopping",
            locationName: "Shibuya Sky",
            address: "Shibuya, Tokyo",
            cost: 30,
            duration: 120,
          },
        ],
      })),
    };

    it("should generate a valid PDF buffer starting with %PDF header", async () => {
      const buffer = await generateItineraryPDFBuffer(mock7DayItinerary);
      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(1000);

      // Verify PDF magic bytes '%PDF-'
      const header = buffer.subarray(0, 5).toString("utf-8");
      expect(header).toBe("%PDF-");
    });

    it("should generate the 7-day PDF in less than 8 seconds (DoD criterion)", async () => {
      const start = Date.now();
      const buffer = await generateItineraryPDFBuffer(mock7DayItinerary);
      const elapsed = Date.now() - start;

      expect(buffer.length).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(8000); // Target: < 8s
      console.log(`[Test] 7-day PDF generated in ${elapsed}ms (size: ${buffer.length} bytes)`);
    });

    it("should handle trips with empty activities gracefully without crashing", async () => {
      const emptyTrip: PDFItineraryData = {
        title: "Weekend Getaway",
        destination: "Reykjavik, Iceland",
        duration: 2,
        days: [
          { dayNumber: 1, title: "Arrival & Relaxation", activities: [] },
          { dayNumber: 2, title: "Free Exploration", activities: [] },
        ],
      };

      const buffer = await generateItineraryPDFBuffer(emptyTrip);
      expect(buffer.length).toBeGreaterThan(500);
      const header = buffer.subarray(0, 5).toString("utf-8");
      expect(header).toBe("%PDF-");
    });

    it("should handle Kanyakumari trip with emojis without font corruption or crash", async () => {
      const kanyakumariTrip: PDFItineraryData = {
        id: "kanyakumari-3d",
        title: "3-Day Kanyakumari Coastal & Spiritual Expedition 🌅",
        destination: "Kanyakumari, India 🇮🇳",
        description: "Experience the meeting of three oceans, Vivekananda Rock Memorial 🏛️, and sunset viewpoints.",
        duration: 3,
        startDate: new Date("2026-10-10"),
        endDate: new Date("2026-10-12"),
        budgetAmount: 450,
        currency: "₹",
        days: [
          {
            dayNumber: 1,
            title: "Arrival & Sunset 🌅",
            theme: "Triveni Sangam Confluence",
            date: new Date("2026-10-10"),
            activities: [
              {
                id: "k1",
                time: "10:00 AM",
                title: "Breakfast & Coastal Walk ☕",
                description: "South Indian breakfast overlooking the sea.",
                type: "food",
                locationName: "Saravana Bhavan 📍",
                cost: 350,
                duration: 60,
              },
              {
                id: "k2",
                time: "05:00 PM",
                title: "Sunset View Point 🌇",
                description: "Watch the sun sink into the Arabian Sea.",
                type: "sightseeing",
                locationName: "Sunset Point",
                cost: 0,
                duration: 90,
                notes: "Arrive early for front row seats 💡",
              },
            ],
          },
          {
            dayNumber: 2,
            title: "Monuments in the Ocean",
            date: new Date("2026-10-11"),
            activities: [
              {
                id: "k3",
                time: "09:00 AM",
                title: "Ferry to Vivekananda Rock ⛴️",
                type: "sightseeing",
                locationName: "Vivekananda Rock",
                cost: 50,
                duration: 120,
              },
            ],
          },
          {
            dayNumber: 3,
            title: "Temple & Departure",
            date: new Date("2026-10-12"),
            activities: [
              {
                id: "k4",
                time: "08:00 AM",
                title: "Bhagavathy Amman Temple 🛕",
                type: "culture",
                locationName: "Temple Road",
                cost: 0,
                duration: 60,
              },
            ],
          },
        ],
      };

      const buffer = await generateItineraryPDFBuffer(kanyakumariTrip);
      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(1000);
      const header = buffer.subarray(0, 5).toString("utf-8");
      expect(header).toBe("%PDF-");
    });
  });
});
