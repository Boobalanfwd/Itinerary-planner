import React from "react";
import { Page, View, Text, StyleSheet, Image } from "@react-pdf/renderer";
import {
  PinIcon,
  CalendarIcon,
  ClockIcon,
  WalletIcon,
  CompassIcon,
  sanitizePDFText,
} from "./PDFIcons";

export interface PDFItineraryData {
  id?: string;
  title?: string;
  destination: string;
  description?: string | null;
  duration: number;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  budgetAmount?: number | null;
  currency?: string;
  travelers?: string | null;
  coverImage?: string | null;
  days: {
    dayNumber: number;
    title: string;
    theme?: string | null;
    date?: string | Date | null;
    description?: string | null;
    activities: {
      id?: string;
      time?: string;
      title: string;
      description?: string | null;
      type?: string;
      locationName?: string | null;
      address?: string | null;
      cost?: number | null;
      duration?: number | null;
      notes?: string | null;
    }[];
  }[];
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    padding: 38,
    fontFamily: "Helvetica",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: "#0D9488",
    paddingBottom: 10,
    marginBottom: 20,
  },
  brandRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandBadge: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    letterSpacing: 1.5,
  },
  brandTagline: {
    fontSize: 8,
    color: "#0D9488",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    marginTop: 1,
  },
  docTypePill: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  docType: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroContainer: {
    marginBottom: 18,
    borderRadius: 8,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: 170,
    objectFit: "cover",
    borderRadius: 8,
  },
  heroFallback: {
    width: "100%",
    height: 120,
    backgroundColor: "#0F172A",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  heroFallbackSub: {
    fontSize: 8.5,
    color: "#14B8A6",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  heroFallbackText: {
    color: "#F8FAFC",
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  titleSection: {
    marginBottom: 18,
  },
  destinationPill: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F0FDFA",
    borderWidth: 1,
    borderColor: "#99F6E4",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  destinationPillText: {
    color: "#0D9488",
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    lineHeight: 1.25,
    marginBottom: 8,
  },
  description: {
    fontSize: 9.5,
    color: "#334155",
    lineHeight: 1.45,
  },
  statsGrid: {
    display: "flex",
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 6,
    padding: 9,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statHeaderRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 7.5,
    color: "#64748B",
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 12,
    color: "#0F172A",
    fontFamily: "Helvetica-Bold",
  },
  highlightsSection: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#0D9488",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  highlightsTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    marginBottom: 4,
  },
  highlightsText: {
    fontSize: 8.5,
    color: "#475569",
    lineHeight: 1.4,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 10,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#94A3B8",
  },
  footerUrl: {
    fontSize: 8,
    color: "#0D9488",
    fontFamily: "Helvetica-Bold",
  },
});

function formatDate(dateValue?: string | Date | null): string {
  if (!dateValue) return "";
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

export function PDFCoverPage({ itinerary }: { itinerary: PDFItineraryData }) {
  const totalActivities = itinerary.days.reduce(
    (acc, day) => acc + (day.activities?.length || 0),
    0
  );

  const startDateFormatted = formatDate(itinerary.startDate || itinerary.days[0]?.date);
  const endDateFormatted = formatDate(itinerary.endDate);
  const dateRange = startDateFormatted
    ? endDateFormatted
      ? `${startDateFormatted} – ${endDateFormatted}`
      : startDateFormatted
    : `${itinerary.duration} Days`;

  const totalCost = itinerary.days.reduce((sum, d) => {
    return sum + (d.activities?.reduce((actSum, a) => actSum + (a.cost || 0), 0) || 0);
  }, 0);

  const cleanDestination = sanitizePDFText(itinerary.destination) || "Destination";
  const cleanTitle =
    sanitizePDFText(itinerary.title) ||
    `${itinerary.duration}-Day Trip to ${cleanDestination}`;
  const cleanDescription = sanitizePDFText(itinerary.description);

  return (
    <Page size="A4" style={styles.page}>
      <View>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.brandRow}>
              <CompassIcon size={14} color="#0D9488" />
              <Text style={styles.brandBadge}>WANDER.AI</Text>
            </View>
            <Text style={styles.brandTagline}>INTELLIGENT TRAVEL ITINERARIES</Text>
          </View>
          <View style={styles.docTypePill}>
            <Text style={styles.docType}>Official Travel Briefing</Text>
          </View>
        </View>

        {/* Hero Image or Fallback */}
        <View style={styles.heroContainer}>
          {itinerary.coverImage ? (
            <Image src={itinerary.coverImage} style={styles.heroImage} />
          ) : (
            <View style={styles.heroFallback}>
              <Text style={styles.heroFallbackSub}>Curated Itinerary</Text>
              <Text style={styles.heroFallbackText}>{cleanDestination.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Title and Destination */}
        <View style={styles.titleSection}>
          <View style={styles.destinationPill}>
            <PinIcon size={10} color="#0D9488" />
            <Text style={styles.destinationPillText}>{cleanDestination}</Text>
          </View>
          <Text style={styles.title}>{cleanTitle}</Text>
          {cleanDescription ? (
            <Text style={styles.description}>{cleanDescription}</Text>
          ) : null}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statHeaderRow}>
              <CalendarIcon size={8.5} color="#0D9488" />
              <Text style={styles.statLabel}>Dates</Text>
            </View>
            <Text style={styles.statValue}>{dateRange}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeaderRow}>
              <ClockIcon size={8.5} color="#0D9488" />
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <Text style={styles.statValue}>{itinerary.duration} Days</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeaderRow}>
              <CompassIcon size={8.5} color="#0D9488" />
              <Text style={styles.statLabel}>Stops</Text>
            </View>
            <Text style={styles.statValue}>{totalActivities} Planned</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeaderRow}>
              <WalletIcon size={8.5} color="#0D9488" />
              <Text style={styles.statLabel}>Est. Spend</Text>
            </View>
            <Text style={styles.statValue}>
              {itinerary.currency || "$"}
              {(itinerary.budgetAmount || totalCost).toFixed(0)}
            </Text>
          </View>
        </View>

        {/* Highlights summary */}
        <View style={styles.highlightsSection}>
          <Text style={styles.highlightsTitle}>Trip Overview & Daily Highlights</Text>
          <Text style={styles.highlightsText}>
            This itinerary includes curated daily stops across {itinerary.duration} days in{" "}
            {cleanDestination}. Sights, cultural landmarks, and dining experiences are logically
            sequenced by neighborhood with scheduled timings, precise addresses, and estimated
            activity costs.
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Generated with Wander.AI · Real-time travel intelligence
        </Text>
        <Text style={styles.footerUrl}>wanderai.com</Text>
      </View>
    </Page>
  );
}
