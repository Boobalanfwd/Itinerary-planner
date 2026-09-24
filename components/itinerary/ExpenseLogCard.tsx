"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  DollarSign,
  Pencil,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Utensils,
  Camera,
  Plane,
  Bed,
  ShoppingBag,
  Ticket,
  HelpCircle,
  Receipt,
} from "lucide-react";
import { Day } from "@/app/components/types";
import { toast } from "sonner";

interface ExpenseEntry {
  activityId: string;
  dayNumber: number;
  dayTitle?: string;
  activityTitle: string;
  type: string;
  time?: string;
  cost: number | undefined;
}

interface ExpenseLogCardProps {
  days: Day[];
  currency?: string;
  readOnly?: boolean;
  onCostUpdated?: (activityId: string, newCost: number | null) => void;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  food: <Utensils className="w-3.5 h-3.5 text-orange-500" />,
  sightseeing: <Camera className="w-3.5 h-3.5 text-teal-500" />,
  travel: <Plane className="w-3.5 h-3.5 text-blue-500" />,
  hotel: <Bed className="w-3.5 h-3.5 text-purple-500" />,
  shopping: <ShoppingBag className="w-3.5 h-3.5 text-pink-500" />,
  nightlife: <Ticket className="w-3.5 h-3.5 text-yellow-500" />,
  default: <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />,
};

function typeIcon(type: string): React.ReactNode {
  const lower = (type || "").toLowerCase();
  for (const [k, icon] of Object.entries(TYPE_ICON)) {
    if (lower.includes(k)) return icon;
  }
  return TYPE_ICON.default;
}

function InlineCostEditor({
  activityId,
  initialCost,
  currency,
  readOnly,
  onSaved,
}: {
  activityId: string;
  initialCost: number | undefined;
  currency: string;
  readOnly?: boolean;
  onSaved: (activityId: string, cost: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialCost != null ? String(initialCost) : "");
  const [saving, setSaving] = useState(false);
  const [localCost, setLocalCost] = useState<number | undefined>(initialCost);

  const handleSave = async () => {
    const parsed = value.trim() === "" ? null : parseFloat(value);
    if (parsed !== null && isNaN(parsed)) {
      toast.error("Please enter a valid number");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/activities/${activityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cost: parsed }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401 || data.code === "UNAUTHORIZED") {
          toast.error("Sign in to edit expenses");
          setEditing(false);
          return;
        }
        throw new Error(data.error || "Failed to save");
      }

      setLocalCost(parsed ?? undefined);
      onSaved(activityId, parsed);
      setEditing(false);
      toast.success("Expense updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(localCost != null ? String(localCost) : "");
    setEditing(false);
  };

  if (readOnly) {
    return (
      <div className="px-2 py-1">
        {localCost != null ? (
          <span className="text-sm font-mono font-semibold text-foreground">
            {currency}{localCost.toLocaleString()}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/60 italic">—</span>
        )}
      </div>
    );
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">{currency}</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          autoFocus
          placeholder="0"
          className="w-20 px-2 py-1 rounded-lg border border-primary/40 bg-background text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="p-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="p-1 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setValue(localCost != null ? String(localCost) : "");
        setEditing(true);
      }}
      className="group flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-muted/60 transition-colors"
    >
      {localCost != null ? (
        <span className="text-sm font-mono font-semibold text-foreground">
          {currency}{localCost.toLocaleString()}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground/60 italic">Add cost</span>
      )}
      <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

export function ExpenseLogCard({
  days,
  currency = "$",
  readOnly = false,
  onCostUpdated,
}: ExpenseLogCardProps) {
  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(new Set());
  const [costOverrides, setCostOverrides] = useState<Record<string, number | null>>({});

  const entries = useMemo<ExpenseEntry[]>(() => {
    const list: ExpenseEntry[] = [];
    days.forEach((d) => {
      d.activities?.forEach((a) => {
        list.push({
          activityId: a.id || "",
          dayNumber: d.day,
          dayTitle: d.title,
          activityTitle: a.title,
          type: a.type || "sightseeing",
          time: a.time,
          cost: a.cost as number | undefined,
        });
      });
    });
    return list;
  }, [days]);

  const byDay = useMemo(() => {
    const map = new Map<number, { title: string; entries: ExpenseEntry[]; dayTotal: number }>();
    days.forEach((d) => {
      const dayEntries = entries.filter((e) => e.dayNumber === d.day);
      const dayTotal = dayEntries.reduce((sum, e) => {
        const override = e.activityId in costOverrides ? costOverrides[e.activityId] : undefined;
        const cost = override !== undefined ? (override ?? 0) : (e.cost ?? 0);
        return sum + cost;
      }, 0);
      map.set(d.day, { title: d.title || `Day ${d.day}`, entries: dayEntries, dayTotal });
    });
    return map;
  }, [entries, days, costOverrides]);

  const grandTotal = useMemo(() => {
    let total = 0;
    byDay.forEach((v) => (total += v.dayTotal));
    return total;
  }, [byDay]);

  const handleCostSaved = useCallback(
    (activityId: string, newCost: number | null) => {
      setCostOverrides((prev) => ({ ...prev, [activityId]: newCost }));
      onCostUpdated?.(activityId, newCost);
    },
    [onCostUpdated]
  );

  const toggleDay = (dayNum: number) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayNum)) next.delete(dayNum);
      else next.add(dayNum);
      return next;
    });
  };

  return (
    <div className="rounded-3xl bg-card/85 border border-border/80 shadow-soft overflow-hidden backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-2xl bg-emerald-500/10 flex items-center justify-center shadow-xs">
            <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Expense Log</h4>
            <p className="text-[11px] text-muted-foreground">Click any cost to edit inline</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-base font-bold font-mono text-foreground">
            {currency}{grandTotal.toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground font-medium">Total</div>
        </div>
      </div>

      {/* Day Groups */}
      <div className="divide-y divide-border/40 max-h-[420px] overflow-y-auto">
        {Array.from(byDay.entries()).map(([dayNum, { title, entries: dayEntries, dayTotal }]) => {
          const isCollapsed = collapsedDays.has(dayNum);
          return (
            <div key={dayNum}>
              {/* Day header row */}
              <button
                type="button"
                onClick={() => toggleDay(dayNum)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/20 hover:bg-muted/40 transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className="text-xs font-bold text-foreground truncate">
                    Day {dayNum} · {title}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-xs text-muted-foreground">
                    {dayEntries.length} stops
                  </span>
                  <span className="text-xs font-mono font-semibold text-foreground">
                    {currency}{dayTotal.toLocaleString()}
                  </span>
                </div>
              </button>

              {/* Activity rows */}
              {!isCollapsed && (
                <div className="divide-y divide-border/20">
                  {dayEntries.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-muted-foreground italic">
                      No stops yet
                    </div>
                  ) : (
                    dayEntries.map((entry) => {
                      const overrideVal =
                        entry.activityId in costOverrides
                          ? costOverrides[entry.activityId]
                          : undefined;
                      const displayCost =
                        overrideVal !== undefined ? (overrideVal ?? undefined) : entry.cost;

                      return (
                        <div
                          key={entry.activityId}
                          className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex-shrink-0">{typeIcon(entry.type)}</div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate">
                                {entry.activityTitle}
                              </p>
                              {entry.time && (
                                <p className="text-[10px] text-muted-foreground font-mono">
                                  {entry.time}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Inline cost editor */}
                          <div className="flex-shrink-0">
                            {entry.activityId ? (
                              <InlineCostEditor
                                activityId={entry.activityId}
                                initialCost={displayCost}
                                currency={currency}
                                readOnly={readOnly}
                                onSaved={handleCostSaved}
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground font-mono">
                                {displayCost != null
                                  ? `${currency}${displayCost.toLocaleString()}`
                                  : "—"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer total */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/20">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
          Trip Total Expenses
        </span>
        <span className="text-base font-bold font-mono text-foreground">
          {currency}{grandTotal.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
