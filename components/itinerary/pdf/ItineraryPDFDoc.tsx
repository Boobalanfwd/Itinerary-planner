import React from "react";
import { Document } from "@react-pdf/renderer";
import { PDFCoverPage, type PDFItineraryData } from "./PDFCoverPage";
import { PDFDaySection } from "./PDFDaySection";
import { PDFBudgetSummary } from "./PDFBudgetSummary";

export interface ItineraryPDFDocProps {
  itinerary: PDFItineraryData;
}

export function ItineraryPDFDoc({ itinerary }: ItineraryPDFDocProps) {
  return (
    <Document
      title={itinerary.title || `${itinerary.destination} Itinerary`}
      author="Wander.AI"
      subject={`Travel Itinerary for ${itinerary.destination}`}
      keywords={`travel, itinerary, ${itinerary.destination}, vacation, guide`}
    >
      {/* 1. Executive Cover Page */}
      <PDFCoverPage itinerary={itinerary} />

      {/* 2. Continuous Day-by-Day Schedule (No large gaps between days) */}
      <PDFDaySection itinerary={itinerary} />

      {/* 3. Financial Summary & Travel Checklist */}
      <PDFBudgetSummary itinerary={itinerary} />
    </Document>
  );
}

export default ItineraryPDFDoc;
