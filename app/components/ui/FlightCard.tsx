"use client";

import React, { useState } from "react";
import {
  Plane,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Bell,
} from "lucide-react";
import { motion } from "framer-motion";

export interface FlightStatus {
  status: "scheduled" | "active" | "landed" | "cancelled" | "delayed";
  departureGate?: string;
  arrivalGate?: string;
  departureDelay?: number;
  arrivalDelay?: number;
}

export interface FlightCardProps {
  flight: {
    airline?: string;
    flightNumber?: string;
    departure?: any;
    arrival?: any;
    departureTime?: string;
    arrivalTime?: string;
    duration?: number | string;
    bookingRef?: string;
    [key: string]: any;
  };
  className?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "landed":
    case "active":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    case "delayed":
      return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
    case "cancelled":
      return "text-red-400 bg-red-500/10 border-red-500/20";
    default:
      return "text-gray-400 bg-gray-500/10 border-gray-500/20";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "landed":
    case "active":
      return <CheckCircle className="w-3.5 h-3.5" />;
    case "delayed":
      return <AlertTriangle className="w-3.5 h-3.5" />;
    case "cancelled":
      return <XCircle className="w-3.5 h-3.5" />;
    default:
      return <Clock className="w-3.5 h-3.5" />;
  }
};

const formatTime = (time?: string) => {
  if (!time) return "--:--";
  return time;
};

const formatDuration = (duration?: number | string) => {
  if (!duration) return "";
  if (typeof duration === "string") return duration;
  const h = Math.floor(duration / 60);
  const m = duration % 60;
  return `${h}h ${m}m`;
};

export function FlightCard({ flight, className = "" }: FlightCardProps) {
  const [status] = useState<FlightStatus | null>(null);
  const [alertActive, setAlertActive] = useState(false);

  const toggleAlert = async () => {
    setAlertActive(!alertActive);
    if (!alertActive) {
      try {
        await fetch("/api/alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "FLIGHT",
            criteria: { flightNumber: flight.flightNumber },
          }),
        });
      } catch (e) {
        console.error("Failed to create alert", e);
        setAlertActive(false);
      }
    }
  };

  const depAirport =
    typeof flight.departure === "object" && flight.departure !== null
      ? flight.departure.airport || "DEP"
      : typeof flight.departure === "string"
      ? flight.departure
      : "DEP";

  const depAirportName =
    typeof flight.departure === "object" && flight.departure !== null
      ? flight.departure.airportName || ""
      : "";

  const arrAirport =
    typeof flight.arrival === "object" && flight.arrival !== null
      ? flight.arrival.airport || "ARR"
      : typeof flight.arrival === "string"
      ? flight.arrival
      : "ARR";

  const arrAirportName =
    typeof flight.arrival === "object" && flight.arrival !== null
      ? flight.arrival.airportName || ""
      : "";

  const displayDepartureTime =
    typeof flight.departure === "object" && flight.departure !== null
      ? flight.departure.time || flight.departureTime || ""
      : flight.departureTime || "";

  const displayArrivalTime =
    typeof flight.arrival === "object" && flight.arrival !== null
      ? flight.arrival.time || flight.arrivalTime || ""
      : flight.arrivalTime || "";

  const displayDepGate =
    typeof flight.departure === "object" && flight.departure !== null
      ? flight.departure.gate
      : undefined;

  const displayArrGate =
    typeof flight.arrival === "object" && flight.arrival !== null
      ? flight.arrival.gate
      : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/5 border border-white/10 rounded-xl overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="bg-white/5 px-4 py-3 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Plane className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{flight.airline || "Flight"}</p>
            <p className="text-xs text-gray-400">{flight.flightNumber || ""}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleAlert}
            title={alertActive ? "Turn off price alerts" : "Track price"}
            className={`p-1.5 rounded-full transition-colors ${
              alertActive
                ? "bg-yellow-500/20 text-yellow-400"
                : "hover:bg-white/10 text-gray-400"
            }`}
          >
            <Bell
              className={`w-4 h-4 ${alertActive ? "fill-yellow-400" : ""}`}
            />
          </button>

          {status ? (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                status.status
              )}`}
            >
              {getStatusIcon(status.status)}
              <span className="capitalize">{status.status}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border text-gray-400 bg-gray-500/10 border-gray-500/20">
              <span className="capitalize">Scheduled</span>
            </div>
          )}
        </div>
      </div>

      {/* Flight Path */}
      <div className="p-4 grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
        {/* Departure */}
        <div className="text-left">
          <p className="text-2xl font-bold text-white leading-none">
            {depAirport}
          </p>
          {depAirportName && (
            <p className="text-xs text-gray-400 mt-1 truncate max-w-[100px]">
              {depAirportName}
            </p>
          )}
          <p className="text-lg font-semibold text-blue-200 mt-2">
            {formatTime(displayDepartureTime)}
          </p>
          {displayDepGate && (
            <p className="text-xs text-gray-500">Gate {displayDepGate}</p>
          )}
        </div>

        {/* Visual Path */}
        <div className="flex flex-col items-center justify-center w-full px-2">
          {flight.duration && (
            <p className="text-xs text-gray-500 mb-1">
              {formatDuration(flight.duration)}
            </p>
          )}
          <div className="relative w-full flex items-center">
            <div className="w-2 h-2 rounded-full bg-white/20"></div>
            <div className="h-[2px] bg-white/20 flex-1 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <Plane className="w-4 h-4 text-gray-400 rotate-90" />
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-white/20"></div>
          </div>
          {flight.bookingRef && (
            <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-wider">
              Ref: {flight.bookingRef}
            </p>
          )}
        </div>

        {/* Arrival */}
        <div className="text-right">
          <p className="text-2xl font-bold text-white leading-none">
            {arrAirport}
          </p>
          {arrAirportName && (
            <p className="text-xs text-gray-400 mt-1 truncate max-w-[100px]">
              {arrAirportName}
            </p>
          )}
          <p className="text-lg font-semibold text-blue-200 mt-2">
            {formatTime(displayArrivalTime)}
          </p>
          {displayArrGate && (
            <p className="text-xs text-gray-500">Gate {displayArrGate}</p>
          )}
        </div>
      </div>

      {/* Booking Reference */}
      {flight.bookingRef && (
        <div className="px-4 py-3 bg-white/5 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-gray-400 uppercase tracking-wider">
            Booking Ref
          </span>
          <span className="text-sm font-mono font-medium text-white tracking-widest">
            {flight.bookingRef}
          </span>
        </div>
      )}
    </motion.div>
  );
}
export default FlightCard;
