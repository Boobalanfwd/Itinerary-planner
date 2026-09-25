"use client";

import React from "react";
import { RemoteCursor } from "@/hooks/useTripRealtime";

interface LiveCursorsOverlayProps {
  cursors: Record<string, RemoteCursor>;
}

export function LiveCursorsOverlay({ cursors }: LiveCursorsOverlayProps) {
  const cursorList = Object.values(cursors);
  if (cursorList.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {cursorList.map((cursor) => {
        // Prevent rendering cursors outside screen bounds
        const x = Math.max(10, Math.min(window.innerWidth - 30, cursor.x));
        const y = Math.max(10, Math.min(window.innerHeight - 30, cursor.y));

        return (
          <div
            key={cursor.userId}
            className="absolute transition-all duration-100 ease-out will-change-transform"
            style={{
              transform: `translate(${x}px, ${y}px)`,
            }}
          >
            {/* SVG Cursor Pointer */}
            <svg
              className="w-5 h-5 drop-shadow-md"
              viewBox="0 0 24 24"
              fill={cursor.userColor}
              stroke="white"
              strokeWidth="1.5"
            >
              <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.36z" />
            </svg>

            {/* Floating Name & Avatar Badge */}
            <div
              className="ml-3 -mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-white text-[11px] font-semibold shadow-lg whitespace-nowrap animate-in fade-in"
              style={{ backgroundColor: cursor.userColor }}
            >
              {cursor.userAvatar && (
                <img
                  src={cursor.userAvatar}
                  alt={cursor.userName}
                  className="w-3.5 h-3.5 rounded-full object-cover border border-white/60"
                />
              )}
              <span>{cursor.userName}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
