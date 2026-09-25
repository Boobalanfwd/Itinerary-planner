"use client";

import React, { useRef, useEffect } from "react";
import { Day } from "@/app/components/types";
import { Badge } from "@/components/ui/badge";

interface DayScrollTabsProps {
  days: Day[];
  selectedDay: number;
  onSelectDay: (dayNumber: number) => void;
  getDayColor?: (dayNumber: number) => string;
}

export function DayScrollTabs({
  days,
  selectedDay,
  onSelectDay,
  getDayColor = () => "#0D9488",
}: DayScrollTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll active day tab into view smoothly
  useEffect(() => {
    if (activeBtnRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const element = activeBtnRef.current;
      const left = element.offsetLeft - container.offsetWidth / 2 + element.offsetWidth / 2;
      container.scrollTo({ left, behavior: "smooth" });
    }
  }, [selectedDay]);

  return (
    <div className="w-full bg-background/95 backdrop-blur-md border-b border-border/70 py-2.5 px-4 sticky top-0 z-20">
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {days.map((day) => {
          const isSelected = day.day === selectedDay;
          const dayColor = getDayColor(day.day);
          const actCount = day.activities?.length ?? 0;

          // Parse day date if valid
          let dateStr = "";
          try {
            if (day.date) {
              const d = new Date(day.date);
              if (!isNaN(d.getTime())) {
                dateStr = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
              }
            }
          } catch {
            dateStr = "";
          }

          return (
            <button
              key={day.day}
              ref={isSelected ? activeBtnRef : null}
              type="button"
              onClick={() => onSelectDay(day.day)}
              className={`flex-shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl min-h-[44px] transition-all cursor-pointer select-none text-left border ${
                isSelected
                  ? "bg-card border-primary/40 shadow-soft text-foreground ring-2 ring-primary/20 scale-[1.02]"
                  : "bg-muted/40 hover:bg-muted/80 border-border/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {/* Day Number badge with theme color */}
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0"
                style={{ backgroundColor: dayColor }}
              >
                {day.day}
              </div>

              {/* Title & Date */}
              <div className="min-w-0 pr-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold ${isSelected ? "text-foreground" : "text-foreground/90"}`}>
                    Day {day.day}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 rounded-full border-border/60 text-muted-foreground"
                  >
                    {actCount} {actCount === 1 ? "stop" : "stops"}
                  </Badge>
                </div>
                {dateStr && (
                  <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                    {dateStr}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
