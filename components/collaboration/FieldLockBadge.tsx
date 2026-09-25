"use client";

import React from "react";
import { Lock, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldLockBadgeProps {
  userName: string;
  userColor?: string;
  isLocked?: boolean;
  fieldLabel?: string;
}

export function FieldLockBadge({
  userName,
  userColor = "#F59E0B",
  isLocked = false,
  fieldLabel,
}: FieldLockBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-white shadow-sm transition-all",
        "animate-pulse"
      )}
      style={{ backgroundColor: userColor }}
    >
      {isLocked ? (
        <Lock className="w-2.5 h-2.5" />
      ) : (
        <Edit3 className="w-2.5 h-2.5" />
      )}
      <span>
        {userName} {isLocked ? "locked" : "editing"} {fieldLabel ? `(${fieldLabel})` : ""}
      </span>
    </div>
  );
}
