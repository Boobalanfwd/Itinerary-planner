"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Loader2, Trash2, TrendingUp, PiggyBank } from "lucide-react";
import { toast } from "sonner";

interface BudgetDialogProps {
  itineraryId: string;
  currentBudget?: number | null;
  totalExpenses: number;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (newBudget: number | null) => void;
}

const QUICK_ADD_AMOUNTS = [100, 250, 500, 1000];

export function BudgetDialog({
  itineraryId,
  currentBudget,
  totalExpenses,
  isOpen,
  onClose,
  onUpdate,
}: BudgetDialogProps) {
  const [budgetInput, setBudgetInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBudgetInput(currentBudget != null ? String(currentBudget) : "");
    }
  }, [isOpen, currentBudget]);

  const parsedBudget = parseFloat(budgetInput);
  const isValidBudget = budgetInput.trim() !== "" && !isNaN(parsedBudget) && parsedBudget >= 0;
  const utilization =
    isValidBudget && parsedBudget > 0 ? Math.min(100, Math.round((totalExpenses / parsedBudget) * 100)) : null;

  const handleSave = async () => {
    if (!isValidBudget) {
      toast.error("Please enter a valid budget amount");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/itineraries/${itineraryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budgetAmount: parsedBudget }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update budget");

      toast.success(`Budget set to $${parsedBudget.toLocaleString()}`);
      onUpdate(parsedBudget);
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save budget");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      const res = await fetch(`/api/itineraries/${itineraryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budgetAmount: null }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to remove budget");

      toast.success("Budget removed");
      onUpdate(null);
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to remove budget");
    } finally {
      setIsRemoving(false);
    }
  };

  const handleMatchExpenses = () => {
    setBudgetInput(String(Math.ceil(totalExpenses)));
  };

  const handleQuickAdd = (amount: number) => {
    const current = parseFloat(budgetInput) || 0;
    setBudgetInput(String(current + amount));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <PiggyBank className="w-5 h-5 text-emerald-500" />
            {currentBudget != null ? "Edit Trip Budget" : "Set Trip Budget"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Track your spending against a total trip budget
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Expense overview */}
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-muted/50 border border-border/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Total estimated expenses</span>
            </div>
            <span className="font-bold font-mono text-foreground text-base">
              ${totalExpenses.toLocaleString()}
            </span>
          </div>

          {/* Budget input */}
          <div className="space-y-2">
            <Label htmlFor="budget-input" className="text-sm font-semibold flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-primary" />
              Total Budget Amount
            </Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">$</span>
              <Input
                id="budget-input"
                type="number"
                min="0"
                step="50"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder="e.g. 2000"
                className="rounded-xl pl-7 font-mono text-base"
                autoFocus
              />
            </div>
          </div>

          {/* Quick-add chips */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Quick add to budget</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_ADD_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickAdd(amt)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors"
                >
                  +${amt.toLocaleString()}
                </button>
              ))}
              <button
                type="button"
                onClick={handleMatchExpenses}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-colors"
              >
                Match Expenses
              </button>
            </div>
          </div>

          {/* Budget utilization preview */}
          {utilization !== null && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-muted-foreground">
                <span>Budget Utilization Preview</span>
                <span
                  className={`font-mono ${
                    utilization > 100 ? "text-destructive font-bold" : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {utilization}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    utilization > 100 ? "bg-destructive" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, utilization)}%` }}
                />
              </div>
              {utilization > 100 && (
                <p className="text-xs text-destructive font-medium">
                  ⚠️ Estimated expenses exceed your budget by ${(totalExpenses - parsedBudget).toLocaleString()}
                </p>
              )}
              {utilization <= 100 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ ${(parsedBudget - totalExpenses).toLocaleString()} remaining after estimated expenses
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 gap-2 flex-col sm:flex-row">
          {/* Remove budget — only show if one already exists */}
          {currentBudget != null && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={isRemoving || isSaving}
              className="rounded-xl gap-2 sm:mr-auto"
            >
              {isRemoving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Remove Budget
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving || isRemoving}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!isValidBudget || isSaving || isRemoving}
            className="rounded-xl gap-2 min-w-[120px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4" />
                Save Budget
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
