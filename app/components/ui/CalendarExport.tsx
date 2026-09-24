"use client";

import React, { useState } from "react";
import { Calendar, ChevronDown, Download, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CalendarExportProps {
  itineraryId: string;
  className?: string;
}

export const CalendarExport: React.FC<CalendarExportProps> = ({
  itineraryId,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleExport = async (format: string) => {
    setDownloading(true);

    try {
      const response = await fetch(`/api/itineraries/${itineraryId}/calendar`);

      if (!response.ok) {
        throw new Error("Failed to generate calendar file");
      }

      // Get the .ics file content
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : "itinerary.ics";

      // Create download link
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      window.URL.revokeObjectURL(url);

      // Show success state
      setDownloaded(true);
      setTimeout(() => {
        setDownloaded(false);
        setIsOpen(false);
      }, 2000);
    } catch (error) {
      console.error("Calendar export error:", error);
      alert("Failed to export calendar. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const calendarOptions = [
    {
      id: "google",
      name: "Google Calendar",
      icon: "📅",
      description: "Download .ics file",
    },
    {
      id: "apple",
      name: "Apple Calendar",
      icon: "🍎",
      description: "Download .ics file",
    },
    {
      id: "outlook",
      name: "Outlook",
      icon: "📧",
      description: "Download .ics file",
    },
    {
      id: "ical",
      name: "iCal File",
      icon: "📄",
      description: "Universal format",
    },
  ];

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={downloading}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-colors disabled:opacity-50"
      >
        {downloaded ? (
          <>
            <Check className="w-5 h-5 text-emerald-400" />
            <span>Downloaded!</span>
          </>
        ) : (
          <>
            <Calendar className="w-5 h-5" />
            <span>Add to Calendar</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && !downloaded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 right-0 w-72 bg-gray-900 border border-white/20 rounded-xl shadow-2xl overflow-hidden z-[100]"
          >
            <div className="p-3 border-b border-white/10">
              <h3 className="text-sm font-semibold text-white">
                Export to Calendar
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Download and import into your calendar app
              </p>
            </div>

            <div className="p-2">
              {calendarOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleExport(option.id)}
                  disabled={downloading}
                  className="w-full flex items-center gap-3 p-3 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 text-left"
                >
                  <span className="text-2xl">{option.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">
                      {option.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {option.description}
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>

            <div className="p-3 bg-white/5 border-t border-white/10">
              <p className="text-xs text-gray-400">
                💡 After downloading, open the .ics file to import into your
                calendar app
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[90]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
