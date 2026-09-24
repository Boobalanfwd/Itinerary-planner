"use client";

import React, { useMemo, useState } from "react";
import {
  DollarSign,
  Utensils,
  Camera,
  Plane,
  Bed,
  Pencil,
  PlusCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Day } from "@/app/components/types";
import { BudgetDialog } from "./BudgetDialog";

interface BudgetSummaryCardProps {
  days: Day[];
  totalBudget?: number | string;
  itineraryId?: string;
  currency?: string;
  readOnly?: boolean;
  onBudgetUpdated?: (newBudget: number | null) => void;
}

export function BudgetSummaryCard({
  days,
  totalBudget,
  itineraryId,
  currency = "$",
  readOnly = false,
  onBudgetUpdated,
}: BudgetSummaryCardProps) {
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [localBudget, setLocalBudget] = useState<number | null | undefined>(undefined);

  // Effective budget: local override > prop
  const effectiveBudget: number | null | undefined =
    localBudget !== undefined ? localBudget : undefined;

  const numericBudget = useMemo(() => {
    const b = effectiveBudget !== undefined ? effectiveBudget : totalBudget;
    if (!b && b !== 0) return 0;
    if (typeof b === "number") return b;
    const clean = String(b).replace(/[^0-9.]/g, "");
    return parseFloat(clean) || 0;
  }, [effectiveBudget, totalBudget]);

  const { totalCost, categories } = useMemo(() => {
    let sum = 0;
    const cats: Record<string, number> = {
      sightseeing: 0,
      food: 0,
      travel: 0,
      hotel: 0,
      other: 0,
    };

    days.forEach((d) => {
      d.activities?.forEach((a) => {
        if (a.cost && typeof a.cost === "number") {
          sum += a.cost;
          const lower = (a.type || "").toLowerCase();
          if (
            lower.includes("sightseeing") ||
            lower.includes("culture") ||
            lower.includes("activity") ||
            lower.includes("activities")
          ) {
            cats.sightseeing += a.cost;
          } else if (lower.includes("food") || lower.includes("restaurant")) {
            cats.food += a.cost;
          } else if (
            lower.includes("travel") ||
            lower.includes("flight") ||
            lower.includes("transit") ||
            lower.includes("transport")
          ) {
            cats.travel += a.cost;
          } else if (
            lower.includes("hotel") ||
            lower.includes("accommodation")
          ) {
            cats.hotel += a.cost;
          } else {
            cats.other += a.cost;
          }
        }
      });
    });

    return { totalCost: Math.round(sum), categories: cats };
  }, [days]);

  const percentage =
    numericBudget > 0
      ? Math.min(100, Math.round((totalCost / numericBudget) * 100))
      : 0;
  const daysCount = Math.max(1, days.length);
  const avgPerDay = Math.round(totalCost / daysCount);

  const handleBudgetUpdate = (newBudget: number | null) => {
    setLocalBudget(newBudget);
    onBudgetUpdated?.(newBudget);
  };

  const isOverBudget = numericBudget > 0 && totalCost > numericBudget;

  return (
    <>
      <div className="p-5 rounded-3xl bg-card/85 border border-border/80 shadow-soft space-y-4 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">
                Estimated Trip Expenses
              </h4>
              <p className="text-xs text-muted-foreground font-mono">
                {daysCount} Days • Avg {currency}
                {avgPerDay}/day
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div
                className={`text-lg font-bold font-mono ${
                  isOverBudget ? "text-destructive" : "text-foreground"
                }`}
              >
                {currency}
                {totalCost.toLocaleString()}
              </div>
              {numericBudget > 0 && (
                <div className="text-xs font-medium text-muted-foreground font-mono">
                  of {currency}
                  {numericBudget.toLocaleString()} Budget
                </div>
              )}
            </div>

            {/* Edit / Set Budget button */}
            {!readOnly && itineraryId && (
              <button
                type="button"
                onClick={() => setIsBudgetDialogOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:shadow-xs
                  bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/60 hover:border-primary/40 cursor-pointer"
                title={numericBudget > 0 ? "Edit budget" : "Set a budget"}
              >
                {numericBudget > 0 ? (
                  <>
                    <Pencil className="w-3 h-3" />
                    Edit
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-3 h-3 text-primary" />
                    <span className="text-primary font-bold">Set Budget</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar (if budget specified) */}
        {numericBudget > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold text-muted-foreground font-mono">
              <span>Budget Utilization</span>
              <span
                className={
                  percentage > 100
                    ? "text-destructive font-bold"
                    : "text-foreground font-mono"
                }
              >
                {percentage}%
              </span>
            </div>
            <Progress
              value={percentage}
              className={`h-2.5 rounded-full ${
                isOverBudget ? "[&>div]:bg-destructive" : "[&>div]:bg-emerald-500"
              }`}
            />
            {isOverBudget && (
              <p className="text-[11px] text-destructive font-medium">
                ⚠️ Over budget by {currency}
                {(totalCost - numericBudget).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Category Breakdown Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/50">
          <div className="p-2.5 rounded-2xl bg-muted/40 border border-border/40 space-y-0.5">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
              <Camera className="w-3 h-3 text-indigo-500" /> Sightseeing
            </div>
            <div className="font-mono text-xs font-bold text-foreground">
              {currency}
              {categories.sightseeing.toLocaleString()}
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-muted/40 border border-border/40 space-y-0.5">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
              <Utensils className="w-3 h-3 text-amber-500" /> Food & Dining
            </div>
            <div className="font-mono text-xs font-bold text-foreground">
              {currency}
              {categories.food.toLocaleString()}
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-muted/40 border border-border/40 space-y-0.5">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
              <Plane className="w-3 h-3 text-sky-500" /> Transport
            </div>
            <div className="font-mono text-xs font-bold text-foreground">
              {currency}
              {categories.travel.toLocaleString()}
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-muted/40 border border-border/40 space-y-0.5">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
              <Bed className="w-3 h-3 text-purple-500" /> Lodging
            </div>
            <div className="font-mono text-xs font-bold text-foreground">
              {currency}
              {categories.hotel.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Budget Dialog */}
      {itineraryId && (
        <BudgetDialog
          itineraryId={itineraryId}
          currentBudget={
            localBudget !== undefined
              ? localBudget
              : typeof totalBudget === "number"
              ? totalBudget
              : undefined
          }
          totalExpenses={totalCost}
          isOpen={isBudgetDialogOpen}
          onClose={() => setIsBudgetDialogOpen(false)}
          onUpdate={handleBudgetUpdate}
        />
      )}
    </>
  );
}
