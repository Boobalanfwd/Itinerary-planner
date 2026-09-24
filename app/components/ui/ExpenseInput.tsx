"use client";

import React, { useState } from "react";
import { DollarSign, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  addExpense,
  formatCurrency,
  getBudgetData,
} from "../../lib/budgetService";
import { ActivityType } from "../types";

interface ExpenseInputProps {
  destination: string;
  activityTitle: string;
  activityType: ActivityType;
  existingExpenseId?: string;
  onExpenseAdded?: () => void;
}

export const ExpenseInput: React.FC<ExpenseInputProps> = ({
  destination,
  activityTitle,
  activityType,
  existingExpenseId,
  onExpenseAdded,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [existingAmount, setExistingAmount] = useState<number | null>(null);

  // Load existing expense amount if present
  React.useEffect(() => {
    if (existingExpenseId) {
      const budgetData = getBudgetData(destination);
      if (budgetData) {
        const expense = budgetData.expenses.find(
          (e) => e.id === existingExpenseId
        );
        if (expense) {
          setExistingAmount(expense.amount);
        }
      }
    }
  }, [existingExpenseId, destination]);

  const handleSave = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const result = addExpense(destination, {
      amount: parsedAmount,
      category: activityType,
      activityTitle,
      note: note.trim() || undefined,
    });

    if (result) {
      // Dispatch custom event for widget update
      window.dispatchEvent(new Event("budgetUpdated"));

      setAmount("");
      setNote("");
      setIsOpen(false);

      if (onExpenseAdded) {
        onExpenseAdded();
      }
    }
  };

  const handleCancel = () => {
    setAmount("");
    setNote("");
    setIsOpen(false);
  };

  // If expense already exists, show it
  if (existingAmount !== null && !isOpen) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-lg"
      >
        <Check className="w-3 h-3 text-emerald-400" />
        <span className="text-xs font-medium text-emerald-400">
          {formatCurrency(existingAmount)}
        </span>
        <button
          onClick={() => setIsOpen(true)}
          className="ml-1 text-xs text-emerald-400 hover:text-emerald-300 underline"
        >
          Edit
        </button>
      </motion.div>
    );
  }

  return (
    <div className="relative">
      <AnimatePresence>
        {!isOpen ? (
          <motion.button
            key="add-button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg transition-colors text-xs font-medium text-gray-300 hover:text-white"
          >
            <DollarSign className="w-3 h-3" />
            Add Expense
          </motion.button>
        ) : (
          <motion.div
            key="input-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-white/5 border border-white/10 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount"
                    className="w-full pl-7 pr-2 py-1.5 bg-white/10 border border-white/10 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    autoFocus
                  />
                </div>
              </div>

              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note (optional)"
                className="w-full px-2 py-1.5 bg-white/10 border border-white/10 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded transition-colors"
                >
                  <Check className="w-3 h-3" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-2 py-1.5 bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white text-xs rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
