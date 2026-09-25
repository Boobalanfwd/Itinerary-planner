"use client";

import React, { useState } from "react";
import { PresenceUser } from "@/hooks/useTripRealtime";
import { Users, Wifi, UserPlus, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CollaboratorPresenceBarProps {
  roster: PresenceUser[];
  isConnected: boolean;
  latencyMs: number | null;
  onOpenInviteModal: () => void;
  onOpenHistoryDrawer: () => void;
}

export function CollaboratorPresenceBar({
  roster,
  isConnected,
  latencyMs,
  onOpenInviteModal,
  onOpenHistoryDrawer,
}: CollaboratorPresenceBarProps) {
  const [hoveredUser, setHoveredUser] = useState<PresenceUser | null>(null);

  return (
    <div className="flex items-center gap-3 bg-card/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-500/20 shadow-sm transition-all hover:border-amber-500/40">
      {/* Live status dot */}
      <div className="flex items-center gap-1.5 pr-2 border-r border-border/60">
        <span className="relative flex h-2.5 w-2.5">
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              isConnected ? "bg-emerald-400" : "bg-amber-400"
            )}
          />
          <span
            className={cn(
              "relative inline-flex rounded-full h-2.5 w-2.5",
              isConnected ? "bg-emerald-500" : "bg-amber-500"
            )}
          />
        </span>
        <span className="text-[11px] font-semibold text-muted-foreground hidden sm:inline">
          {isConnected ? (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              Live
              {latencyMs !== null && (
                <span className="text-[10px] text-muted-foreground font-normal">
                  ({latencyMs}ms)
                </span>
              )}
            </span>
          ) : (
            "Connecting..."
          )}
        </span>
      </div>

      {/* Collaborator Avatars Stack */}
      <div className="flex items-center -space-x-2 overflow-hidden py-0.5">
        {roster.slice(0, 5).map((user) => (
          <div
            key={user.userId}
            className="relative group cursor-pointer transition-transform hover:scale-115 hover:z-20"
            onMouseEnter={() => setHoveredUser(user)}
            onMouseLeave={() => setHoveredUser(null)}
          >
            <div
              className="w-7 h-7 rounded-full p-[1.5px] shadow-sm transition-all"
              style={{ backgroundColor: user.color }}
            >
              <img
                src={
                  user.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.userId}`
                }
                alt={user.name}
                className="w-full h-full object-cover rounded-full bg-background"
              />
            </div>

            {/* Idle status badge */}
            {user.isIdle && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-amber-400 border-2 border-background rounded-full" />
            )}

            {/* Active editing pulsing badge */}
            {user.focusedField && !user.isIdle && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full animate-pulse" />
            )}
          </div>
        ))}

        {roster.length > 5 && (
          <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold text-muted-foreground">
            +{roster.length - 5}
          </div>
        )}
      </div>

      {/* Floating Tooltip for hovered user */}
      {hoveredUser && (
        <div className="absolute top-12 left-10 z-50 bg-popover text-popover-foreground text-xs rounded-xl shadow-xl border p-2.5 min-w-[160px] animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: hoveredUser.color }}
            />
            <span className="font-semibold text-sm">{hoveredUser.name}</span>
          </div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-amber-500" />
            <span>Role: {hoveredUser.role}</span>
          </div>
          {hoveredUser.focusedField && (
            <div className="mt-1.5 pt-1.5 border-t text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              ✏️ Currently editing {hoveredUser.focusedField.label || "an activity"}
            </div>
          )}
          {hoveredUser.isIdle && (
            <div className="mt-1 text-[10px] text-amber-500">Away (idle)</div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 pl-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenInviteModal}
          className="h-7 text-xs px-2.5 rounded-full font-medium border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500"
        >
          <UserPlus className="w-3.5 h-3.5 mr-1" />
          <span>Invite</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenHistoryDrawer}
          title="Trip Activity Log & Version History"
          className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
        >
          <Clock className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
