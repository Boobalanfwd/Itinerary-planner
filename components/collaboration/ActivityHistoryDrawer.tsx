"use client";

import React, { useState, useEffect } from "react";
import { Clock, X, Undo, Redo, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActivityHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function ActivityHistoryDrawer({
  isOpen,
  onClose,
  tripId,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: ActivityHistoryDrawerProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/activity-logs?tripId=${tripId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLogs(data.logs || []);
        }
      }
    } catch (e) {
      console.error("Error loading activity logs:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && tripId) {
      loadLogs();
    }
  }, [isOpen, tripId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-card border-l shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-amber-500/10 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Version History</h3>
            <span className="text-[11px] text-muted-foreground">Collaborator Activity Log</span>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Undo / Redo Toolbar */}
      <div className="p-3 border-b bg-muted/30 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onUndo}
            disabled={!canUndo}
            className="h-7 text-xs rounded-lg"
          >
            <Undo className="w-3.5 h-3.5 mr-1" />
            Undo
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onRedo}
            disabled={!canRedo}
            className="h-7 text-xs rounded-lg"
          >
            <Redo className="w-3.5 h-3.5 mr-1" />
            Redo
          </Button>
        </div>

        <Button variant="ghost" size="sm" onClick={loadLogs} className="h-7 text-[11px] text-muted-foreground">
          <RefreshCw className="w-3 h-3 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && (
          <div className="text-center py-8 text-xs text-muted-foreground">Loading changes...</div>
        )}

        {!isLoading && logs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-foreground text-xs">No edit history yet</p>
            <p className="text-[11px]">As you and your collaborators adjust stops and votes, real-time diffs will appear here.</p>
          </div>
        )}

        {logs.map((log) => (
          <div
            key={log.id}
            className="p-3 rounded-xl bg-background border border-border/70 shadow-sm text-xs space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={
                    log.user?.image ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${log.userId}`
                  }
                  alt={log.user?.name || "Traveler"}
                  className="w-5 h-5 rounded-full object-cover border"
                />
                <span className="font-bold text-foreground">
                  {log.user?.name || "Traveler"}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {new Date(log.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <p className="text-foreground text-xs">{log.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
