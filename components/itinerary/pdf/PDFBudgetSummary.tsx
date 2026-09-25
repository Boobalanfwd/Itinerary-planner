import React from "react";
import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { PDFItineraryData } from "./PDFCoverPage";
import {
  WalletIcon,
  CompassIcon,
  LightbulbIcon,
  CheckIcon,
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
    justifyContent: "space-between",
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
  titleSection: {
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 8.5,
    color: "#64748B",
    lineHeight: 1.35,
  },
  kpiGrid: {
    display: "flex",
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    padding: 8,
  },
  kpiHeaderRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 3.5,
    marginBottom: 3,
  },
  kpiLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#64748B",
    textTransform: "uppercase",
  },
  kpiValue: {
    fontSize: 12.5,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 14,
  },
  tableHeader: {
    backgroundColor: "#0F172A",
    display: "flex",
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  tableHeaderCol: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    display: "flex",
    flexDirection: "row",
    paddingVertical: 5.5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    alignItems: "center",
  },
  tableRowEven: {
    backgroundColor: "#F8FAFC",
  },
  colCategory: {
    width: "45%",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
  },
  colCount: {
    width: "25%",
    fontSize: 8,
    color: "#64748B",
    textAlign: "center",
  },
  colAmount: {
    width: "30%",
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    textAlign: "right",
  },
  tipsBox: {
    backgroundColor: "#F0FDFA",
    borderLeftWidth: 3,
    borderLeftColor: "#0D9488",
    borderWidth: 1,
    borderColor: "#CCFBF1",
    borderRadius: 6,
    padding: 10,
    marginBottom: 14,
  },
  tipsHeaderRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 4.5,
    marginBottom: 5,
  },
  tipsTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#0D9488",
  },
  tipItemRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    marginBottom: 3,
  },
  tipItemText: {
    fontSize: 7.5,
    color: "#334155",
    lineHeight: 1.35,
    flex: 1,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 8,
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

export function PDFBudgetSummary({
  itinerary,
}: {
  itinerary: PDFItineraryData;
}) {
  const currency = itinerary.currency || "$";
  const cleanDestination = sanitizePDFText(itinerary.destination) || "Destination";

  // Aggregate category costs
  const categories: Record<string, { count: number; total: number }> = {};
  let totalScheduledCost = 0;
  let totalStops = 0;

  itinerary.days?.forEach((day) => {
    day.activities?.forEach((act) => {
      totalStops += 1;
      const cat = (act.type || "sightseeing").toLowerCase();
      const cost = act.cost || 0;
      totalScheduledCost += cost;

      if (!categories[cat]) {
        categories[cat] = { count: 0, total: 0 };
      }
      categories[cat].count += 1;
      categories[cat].total += cost;
    });
  });

  const totalBudget = itinerary.budgetAmount || totalScheduledCost;
  const remainingBudget = Math.max(0, totalBudget - totalScheduledCost);

  return (
    <Page size="A4" style={styles.page}>
      <View>
        {/* Running Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <CompassIcon size={10} color="#0D9488" />
            <Text style={styles.headerBrand}>WANDER.AI</Text>
            <Text style={styles.headerTitle}>· {cleanDestination} Summary</Text>
          </View>
          <Text style={styles.headerRight}>Budget & Checklist</Text>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Financial Summary & Category Breakdown</Text>
          <Text style={styles.subtitle}>
            Estimated expenditures and activity costs scheduled across {itinerary.duration} days.
          </Text>
        </View>

        {/* KPI Cards */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeaderRow}>
              <WalletIcon size={8} color="#0D9488" />
              <Text style={styles.kpiLabel}>Total Budget</Text>
            </View>
            <Text style={styles.kpiValue}>
              {currency}{totalBudget.toFixed(0)}
            </Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeaderRow}>
              <WalletIcon size={8} color="#0D9488" />
              <Text style={styles.kpiLabel}>Est. Spend</Text>
            </View>
            <Text style={styles.kpiValue}>
              {currency}{totalScheduledCost.toFixed(0)}
            </Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeaderRow}>
              <CheckIcon size={8} color="#0D9488" />
              <Text style={styles.kpiLabel}>Buffer</Text>
            </View>
            <Text style={[styles.kpiValue, { color: "#0D9488" }]}>
              {currency}{remainingBudget.toFixed(0)}
            </Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeaderRow}>
              <CompassIcon size={8} color="#0D9488" />
              <Text style={styles.kpiLabel}>Total Stops</Text>
            </View>
            <Text style={styles.kpiValue}>{totalStops}</Text>
          </View>
        </View>

        {/* Category Breakdown Table */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCol, { width: "45%" }]}>Expense Category</Text>
            <Text style={[styles.tableHeaderCol, { width: "25%", textAlign: "center" }]}>
              Scheduled Items
            </Text>
            <Text style={[styles.tableHeaderCol, { width: "30%", textAlign: "right" }]}>
              Est. Total
            </Text>
          </View>

          {Object.entries(categories).map(([cat, data], idx) => {
            const label = cat.charAt(0).toUpperCase() + cat.slice(1).replace("_", " ");
            return (
              <View
                key={cat}
                style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}
              >
                <Text style={styles.colCategory}>{label}</Text>
                <Text style={styles.colCount}>{data.count} stops</Text>
                <Text style={styles.colAmount}>
                  {data.total > 0 ? `${currency}${data.total.toFixed(0)}` : "Free"}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Helpful Tips Box (Vector icons, no emojis) */}
        <View style={styles.tipsBox}>
          <View style={styles.tipsHeaderRow}>
            <LightbulbIcon size={10} color="#0D9488" />
            <Text style={styles.tipsTitle}>Travel Checklist & Pro-Tips</Text>
          </View>

          <View style={styles.tipItemRow}>
            <CheckIcon size={7} color="#0D9488" />
            <Text style={styles.tipItemText}>
              Always verify museum, monument, and ferry ticket requirements online in advance.
            </Text>
          </View>
          <View style={styles.tipItemRow}>
            <CheckIcon size={7} color="#0D9488" />
            <Text style={styles.tipItemText}>
              Keep offline copies of your booking confirmations, passport, and travel insurance.
            </Text>
          </View>
          <View style={styles.tipItemRow}>
            <CheckIcon size={7} color="#0D9488" />
            <Text style={styles.tipItemText}>
              Use digital contactless payments or carry moderate cash for local market stalls.
            </Text>
          </View>
          <View style={styles.tipItemRow}>
            <CheckIcon size={7} color="#0D9488" />
            <Text style={styles.tipItemText}>
              Access your real-time live itinerary on Wander.AI for updated weather & map navigation.
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Wander.AI · Intelligent Travel Planner</Text>
        <Text
          style={styles.footerText}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
      </View>
    </Page>
  );
}
