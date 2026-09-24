"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import DottedMap from "dotted-map"
import * as Flags from "country-flag-icons/react/3x2"
import { motion, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Globe } from "lucide-react"

export interface MapPin {
  lat: number
  lng: number
  label: string
  countryCode: string
  avatar?: string
  count?: number
  active?: boolean
  description?: string
}

interface DottedWorldMapProps extends React.HTMLAttributes<HTMLDivElement> {
  pins?: MapPin[]
  onPinClick?: (pin: MapPin) => void
  dotRadius?: number
  height?: number
  grid?: "diagonal" | "vertical"
  interactive?: boolean
  showLabels?: boolean
  mapColor?: string
}

export function DottedWorldMap({
  pins = [],
  onPinClick,
  dotRadius = 0.22,
  height = 55,
  grid = "diagonal",
  interactive = true,
  showLabels = true,
  className,
  ...props
}: DottedWorldMapProps) {
  const shouldReduceMotion = useReducedMotion()
  const [hoveredPin, setHoveredPin] = useState<string | null>(null)

  // Initialize and memoize the DottedMap instance and points
  const { points, mapWidth, mapHeight, pinPositions } = useMemo(() => {
    const map = new DottedMap({ height, grid })
    const pts = map.getPoints()
    // Default width is approximately 2 * height - 1 for diagonal grid
    const svgString = map.getSVG({ radius: dotRadius, color: "#000" })
    const viewBoxMatch = svgString.match(/viewBox="0 0 ([0-9.]+) ([0-9.]+)"/)
    const width = viewBoxMatch ? parseFloat(viewBoxMatch[1]) : height * 2
    const h = viewBoxMatch ? parseFloat(viewBoxMatch[2]) : height

    // Calculate normalized pin positions
    const resolvedPins = pins.map((pin) => {
      try {
        const coords = map.getPin({ lat: pin.lat, lng: pin.lng })
        if (coords && typeof coords.x === "number" && typeof coords.y === "number") {
          return {
            ...pin,
            xPercent: (coords.x / width) * 100,
            yPercent: (coords.y / h) * 100,
          }
        }
      } catch (err) {
        console.warn("Failed to get pin coords for", pin, err)
      }
      // Fallback equirectangular projection approximation
      const xP = ((pin.lng + 180) / 360) * 100
      const yP = ((90 - pin.lat) / 180) * 100
      return {
        ...pin,
        xPercent: xP,
        yPercent: yP,
      }
    })

    return {
      points: pts,
      mapWidth: width,
      mapHeight: h,
      pinPositions: resolvedPins,
    }
  }, [height, grid, dotRadius, pins])

  // Helper to render flag SVG
  const renderFlag = (code: string) => {
    const upper = (code || "").toUpperCase()
    const FlagComponent = Flags[upper as keyof typeof Flags]
    if (FlagComponent) {
      return (
        <FlagComponent
          className="size-3.5 shrink-0 rounded-[2px] shadow-xs object-cover overflow-hidden"
          aria-label={code}
        />
      )
    }
    return <Globe className="size-3.5 text-muted-foreground shrink-0" />
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden select-none flex items-center justify-center",
        className
      )}
      {...props}
    >
      {/* Aspect-ratio container based on mapWidth / mapHeight */}
      <div
        className="relative w-full max-w-full"
        style={{ aspectRatio: `${mapWidth} / ${mapHeight}` }}
      >
        {/* SVG Dot Matrix */}
        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className="absolute inset-0 size-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g className="fill-muted-foreground/25 dark:fill-muted-foreground/35 transition-colors">
            {points.map((pt, i) => (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r={dotRadius}
              />
            ))}
          </g>
        </svg>

        {/* Pins and White Location Cards */}
        {pinPositions.map((pin, idx) => {
          const isHovered = hoveredPin === `${pin.label}-${idx}`
          const isPulsing = !shouldReduceMotion

          return (
            <div
              key={`${pin.label}-${idx}`}
              style={{
                left: `${pin.xPercent}%`,
                top: `${pin.yPercent}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
              onMouseEnter={() => setHoveredPin(`${pin.label}-${idx}`)}
              onMouseLeave={() => setHoveredPin(null)}
              onClick={() => interactive && onPinClick?.(pin)}
            >
              {/* Pulsing Dot Element */}
              <div className="relative flex items-center justify-center size-5 -m-2.5 cursor-pointer">
                {/* Outer animated ping ring */}
                {isPulsing && (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-accent/40"
                    animate={{
                      scale: [1, 2.2, 1],
                      opacity: [0.7, 0, 0.7],
                    }}
                    transition={{
                      duration: 2.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: idx * 0.3,
                    }}
                  />
                )}

                {/* Secondary subtle glow */}
                <span className="absolute size-3 rounded-full bg-accent/30 animate-pulse" />

                {/* Core solid emerald dot */}
                <span className="relative size-2.5 rounded-full bg-accent ring-2 ring-card shadow-xs" />
              </div>

              {/* White Location Pill Bubble (Flag + City) */}
              {showLabels && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2 bottom-full mb-2 whitespace-nowrap",
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
                    "bg-card text-card-foreground border border-border/80 shadow-soft",
                    "text-[11px] font-semibold tracking-tight transition-transform",
                    interactive && "cursor-pointer hover:scale-105 hover:shadow-soft-lg hover:border-primary/40",
                    (isHovered || pin.active) && "ring-2 ring-primary/40 scale-105 border-primary"
                  )}
                >
                  {renderFlag(pin.countryCode)}
                  <span>{pin.label}</span>

                  {/* Little bottom caret */}
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-2 rotate-45 bg-card border-r border-b border-border/80" />
                </motion.div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
