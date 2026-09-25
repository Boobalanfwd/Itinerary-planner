import React from "react";
import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { PDFItineraryData } from "./PDFCoverPage";
import {
  PinIcon,
  ClockIcon,
  LightbulbIcon,
  CompassIcon,
  sanitizePDFText,
} from "./PDFIcons";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 36,
    fontFamily: "Helvetica",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: "#0D9488",
    paddingBottom: 8,
    marginBottom: 16,
  },
  headerLeft: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  headerBrand: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 8.5,
    color: "#64748B",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerRight: {
    fontSize: 8,
    color: "#94A3B8",
    fontFamily: "Helvetica-Bold",
  },
  dayContainer: {
    marginBottom: 14,
  },
  dayHeader: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayTitleBlock: {
    flex: 1,
    paddingRight: 10,
  },
  dayBadgeRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  dayBadge: {
    backgroundColor: "#0D9488",
    color: "#FFFFFF",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  dayDate: {
    fontSize: 8,
    color: "#64748B",
    fontFamily: "Helvetica-Bold",
  },
  dayTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    marginBottom: 2,
  },
  dayTheme: {
    fontSize: 8,
    color: "#0D9488",
    fontFamily: "Helvetica-Oblique",
  },
  dayStats: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    backgroundColor: "#FFFFFF",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dayCost: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
  },
  dayActivitiesCount: {
    fontSize: 7.5,
    color: "#64748B",
  },
  activitiesList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  activityCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderLeftWidth: 3,
    borderLeftColor: "#0D9488",
    borderRadius: 6,
    padding: 9,
  },
  activityTopRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  activityMetaLeft: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  timePill: {
    backgroundColor: "#0F172A",
    color: "#FFFFFF",
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  typePill: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
    textTransform: "uppercase",
  },
  durationRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  durationText: {
    fontSize: 7,
    color: "#475569",
    fontFamily: "Helvetica-Bold",
  },
  activityCost: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
  },
  activityTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    marginBottom: 3,
  },
  activityLocationRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  activityLocation: {
    fontSize: 8,
    color: "#475569",
    flex: 1,
  },
  activityDesc: {
    fontSize: 8,
    color: "#334155",
    lineHeight: 1.35,
    marginBottom: 3,
  },
  activityTipBox: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0FDFA",
    borderLeftWidth: 2,
    borderLeftColor: "#0D9488",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  activityTipText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Oblique",
    color: "#0F766E",
    flex: 1,
  },
  dayDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    marginVertical: 12,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 6,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7.5,
    color: "#94A3B8",
  },
});

function getTypePillStyle(type?: string) {
  const t = (type || "").toLowerCase();
  if (t.includes("food") || t.includes("restaurant") || t.includes("meal") || t.includes("cafe")) {
    return { backgroundColor: "#FEF3C7", color: "#B45309" };
  }
  if (t.includes("sight") || t.includes("attraction") || t.includes("tour")) {
    return { backgroundColor: "#F0FDFA", color: "#0D9488" };
  }
  if (t.includes("culture") || t.includes("museum") || t.includes("historic") || t.includes("temple")) {
    return { backgroundColor: "#F3E8FF", color: "#7E22CE" };
  }
  if (t.includes("nature") || t.includes("park") || t.includes("beach") || t.includes("outdoor")) {
    return { backgroundColor: "#DCFCE7", color: "#15803D" };
  }
  if (t.includes("transit") || t.includes("travel") || t.includes("transport")) {
    return { backgroundColor: "#E0F2FE", color: "#0369A1" };
  }
  return { backgroundColor: "#F1F5F9", color: "#475569" };
}

function formatDayDate(dateValue?: string | Date | null): string {
  if (!dateValue) return "";
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function PDFDaySection({
  itinerary,
}: {
  itinerary: PDFItineraryData;
}) {
  const currency = itinerary.currency || "$";
  const cleanDestination = sanitizePDFText(itinerary.destination) || "Destination";

  return (
    <Page size="A4" style={styles.page} wrap>
      {/* Running Header on every page */}
      <View style={styles.header} fixed>
        <View style={styles.headerLeft}>
          <CompassIcon size={10} color="#0D9488" />
          <Text style={styles.headerBrand}>WANDER.AI</Text>
          <Text style={styles.headerTitle}>· {cleanDestination} Daily Itinerary</Text>
        </View>
        <Text style={styles.headerRight}>{itinerary.duration}-Day Plan</Text>
      </View>

      {/* Sequential Day-by-Day Flow */}
      {itinerary.days?.map((day, dayIdx) => {
        const dayCost =
          day.activities?.reduce((sum, act) => sum + (act.cost || 0), 0) || 0;
        const dateFormatted = formatDayDate(day.date);
        const cleanDayTitle =
          sanitizePDFText(day.title) || `Day ${day.dayNumber} Exploration`;
        const cleanDayTheme = sanitizePDFText(day.theme);

        return (
          <View key={day.dayNumber || dayIdx} style={styles.dayContainer}>
            {/* Day Header Banner (kept with first activity via wrap={false}) */}
            <View style={styles.dayHeader} wrap={false}>
              <View style={styles.dayTitleBlock}>
                <View style={styles.dayBadgeRow}>
                  <Text style={styles.dayBadge}>DAY {day.dayNumber}</Text>
                  {dateFormatted ? <Text style={styles.dayDate}>{dateFormatted}</Text> : null}
                </View>
                <Text style={styles.dayTitle}>{cleanDayTitle}</Text>
                {cleanDayTheme ? <Text style={styles.dayTheme}>{cleanDayTheme}</Text> : null}
              </View>

              <View style={styles.dayStats}>
                <Text style={styles.dayCost}>
                  {dayCost > 0 ? `${currency}${dayCost.toFixed(0)}` : "Free"}
                </Text>
                <Text style={styles.dayActivitiesCount}>
                  {day.activities?.length || 0} stops
                </Text>
              </View>
            </View>

            {/* Activities for this Day */}
            <View style={styles.activitiesList}>
              {day.activities && day.activities.length > 0 ? (
                day.activities.map((act, actIdx) => {
                  const cleanActTitle =
                    sanitizePDFText(act.title) || "Scheduled Activity";
                  const cleanDesc = sanitizePDFText(act.description);
                  const cleanNotes = sanitizePDFText(act.notes);
                  const cleanLocName = sanitizePDFText(act.locationName);
                  const cleanAddress = sanitizePDFText(act.address);
                  const locationDisplay =
                    cleanLocName && cleanAddress && cleanLocName !== cleanAddress
                      ? `${cleanLocName} · ${cleanAddress}`
                      : cleanLocName || cleanAddress;

                  const typePillStyle = getTypePillStyle(act.type);

                  return (
                    <View key={act.id || actIdx} style={styles.activityCard} wrap={false}>
                      {/* Top Row: Time, Type, Duration, Cost */}
                      <View style={styles.activityTopRow}>
                        <View style={styles.activityMetaLeft}>
                          {act.time ? (
                            <Text style={styles.timePill}>{sanitizePDFText(act.time)}</Text>
                          ) : null}
                          {act.type ? (
                            <Text
                              style={[
                                styles.typePill,
                                {
                                  backgroundColor: typePillStyle.backgroundColor,
                                  color: typePillStyle.color,
                                },
                              ]}
                            >
                              {sanitizePDFText(act.type)}
                            </Text>
                          ) : null}
                          {act.duration ? (
                            <View style={styles.durationRow}>
                              <ClockIcon size={7} color="#475569" />
                              <Text style={styles.durationText}>{act.duration} min</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.activityCost}>
                          {act.cost && act.cost > 0 ? `${currency}${act.cost}` : "Free"}
                        </Text>
                      </View>

                      {/* Title */}
                      <Text style={styles.activityTitle}>{cleanActTitle}</Text>

                      {/* Location Row (Vector Pin Icon, never overlaps) */}
                      {locationDisplay ? (
                        <View style={styles.activityLocationRow}>
                          <PinIcon size={8} color="#0D9488" />
                          <Text style={styles.activityLocation}>{locationDisplay}</Text>
                        </View>
                      ) : null}

                      {/* Description */}
                      {cleanDesc ? (
                        <Text style={styles.activityDesc}>{cleanDesc}</Text>
                      ) : null}

                      {/* Pro-Tip Box */}
                      {cleanNotes ? (
                        <View style={styles.activityTipBox}>
                          <LightbulbIcon size={8} color="#0D9488" />
                          <Text style={styles.activityTipText}>Tip: {cleanNotes}</Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })
              ) : (
                <View
                  style={{
                    padding: 12,
                    alignItems: "center",
                    backgroundColor: "#F8FAFC",
                    borderRadius: 6,
                  }}
                  wrap={false}
                >
                  <Text style={{ fontSize: 8.5, color: "#94A3B8" }}>
                    Free exploration day — no fixed stops scheduled.
                  </Text>
                </View>
              )}
            </View>

            {/* Separator between days (only if not last day) */}
            {dayIdx < (itinerary.days?.length || 0) - 1 ? (
              <View style={styles.dayDivider} wrap={false} />
            ) : null}
          </View>
        );
      })}

      {/* Running Footer on every page */}
      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>Wander.AI · Intelligent Travel Planner</Text>
        <Text
          style={styles.footerText}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
      </View>
    </Page>
  );
}
