import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { ItineraryPDFDoc } from "@/components/itinerary/pdf/ItineraryPDFDoc";
import type { PDFItineraryData } from "@/components/itinerary/pdf/PDFCoverPage";

/**
 * Generate a PDF Buffer from an itinerary data structure.
 * Target generation speed: < 8s for 7-day itineraries (typically < 1.5s).
 */
export async function generateItineraryPDFBuffer(
  itinerary: PDFItineraryData
): Promise<Buffer> {
  const element = React.createElement(ItineraryPDFDoc, { itinerary });
  const buffer = await renderToBuffer(element as any);
  return buffer;
}

/**
 * Generate a clean, URL-safe filename for the downloaded PDF.
 */
export function getItineraryPDFFilename(itinerary: {
  destination: string;
  duration?: number;
  title?: string;
}): string {
  const destClean = (itinerary.destination || "trip")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const daysStr = itinerary.duration ? `-${itinerary.duration}d` : "";
  return `wander-ai-${destClean}${daysStr}.pdf`;
}
