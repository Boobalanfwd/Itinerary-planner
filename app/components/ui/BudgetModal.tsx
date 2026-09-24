"use client";

import React, { useState, useEffect } from "react";
import { X, DollarSign, Trash2, Edit2, PieChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getBudgetData,
  initializeBudget,
  deleteExpense,
  formatCurrency,
  calculateBudgetStatus,
  BudgetData,
  BudgetExpense,
} from "../../lib/budgetService";
import { ActivityType } from "../types";

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination: string;
}

// Color mapping for activity types
const CATEGORY_COLORS: Partial<Record<ActivityType, string>> = {
  food: "#f59e0b",
  sightseeing: "#10b981",
  hotel: "#8b5cf6",
  travel: "#3b82f6",
  nightlife: "#ec4899",
};

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  destination,
}) => {
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [budgetInput, setBudgetInput] = useState("");
  const [activeTab, setActiveTab] = useState<"setup" | "expenses">("setup");

  useEffect(() => {
    if (isOpen) {
      const data = getBudgetData(destination);
      setBudgetData(data);

      if (data && data.totalBudget > 0) {
        setBudgetInput(data.totalBudget.toString());
        setActiveTab("expenses");
      } else {
        setActiveTab("setup");
      }
    }
  }, [isOpen, destination]);

  const handleSetBudget = () => {
    const amount = parseFloat(budgetInput);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid budget amount");
      return;
    }

    const newBudget = initializeBudget(destination, amount);
    setBudgetData(newBudget);

    // Dispatch custom event for widget update
    window.dispatchEvent(new Event("budgetUpdated"));

    setActiveTab("expenses");
  };

  const handleDeleteExpense = (expenseId: string) => {
    const updated = deleteExpense(destination, expenseId);
    if (updated) {
      setBudgetData(updated);
      window.dispatchEvent(new Event("budgetUpdated"));
    }
  };

  const budgetStatus = budgetData ? calculateBudgetStatus(budgetData) : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Budget Tracker
                    </h2>
                    <p className="text-sm text-gray-400">{destination}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setActiveTab("setup")}
                  className={`flex-1 px-6 py-3 text-sm font-medium transition-colors relative ${
                    activeTab === "setup"
                      ? "text-emerald-400"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Set Budget
                  {activeTab === "setup" && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400"
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("expenses")}
                  className={`flex-1 px-6 py-3 text-sm font-medium transition-colors relative ${
                    activeTab === "expenses"
                      ? "text-emerald-400"
                      : "text-gray-400 hover:text-white"
                  }`}
                  disabled={!budgetData || budgetData.totalBudget === 0}
                >
                  Expenses
                  {activeTab === "expenses" && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400"
                    />
                  )}
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
                {activeTab === "setup" && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Total Trip Budget
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          value={budgetInput}
                          onChange={(e) => setBudgetInput(e.target.value)}
                          placeholder="Enter amount (e.g., 2000)"
                          className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-400">
                        Set your total budget for this trip. You can track
                        expenses for each activity.
                      </p>
                    </div>

                    <button
                      onClick={handleSetBudget}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors"
                    >
                      {budgetData && budgetData.totalBudget > 0
                        ? "Update Budget"
                        : "Set Budget"}
                    </button>

                    {budgetData && budgetData.totalBudget > 0 && (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <p className="text-sm text-emerald-400">
                          Current Budget:{" "}
                          {formatCurrency(
                            budgetData.totalBudget,
                            budgetData.currency
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "expenses" && budgetStatus && (
                  <div className="space-y-6">
                    {/* Budget Summary */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-xs text-gray-400 mb-1">
                          Total Budget
                        </p>
                        <p className="text-lg font-bold text-white">
                          {formatCurrency(
                            budgetStatus.totalBudget,
                            budgetData!.currency
                          )}
                        </p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-xs text-gray-400 mb-1">Spent</p>
                        <p className="text-lg font-bold text-emerald-400">
                          {formatCurrency(
                            budgetStatus.totalSpent,
                            budgetData!.currency
                          )}
                        </p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-xs text-gray-400 mb-1">Remaining</p>
                        <p className="text-lg font-bold text-blue-400">
                          {formatCurrency(
                            budgetStatus.remaining,
                            budgetData!.currency
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Category Breakdown */}
                    {budgetStatus.categoryBreakdown.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <PieChart className="w-4 h-4 text-gray-400" />
                          <h3 className="text-sm font-medium text-gray-300">
                            Category Breakdown
                          </h3>
                        </div>
                        <div className="space-y-2">
                          {budgetStatus.categoryBreakdown.map((cat) => (
                            <div
                              key={cat.category}
                              className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor:
                                      CATEGORY_COLORS[cat.category],
                                  }}
                                />
                                <span className="text-sm font-medium text-white capitalize">
                                  {cat.category}
                                </span>
                                <span className="text-xs text-gray-400">
                                  ({cat.count} items)
                                </span>
                              </div>
                              <span className="text-sm font-bold text-white">
                                {formatCurrency(
                                  cat.total,
                                  budgetData!.currency
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expense List */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-300 mb-3">
                        All Expenses
                      </h3>
                      {budgetData!.expenses.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <p className="text-sm">No expenses yet</p>
                          <p className="text-xs mt-1">
                            Add expenses to activities to track your spending
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {budgetData!.expenses
                            .sort((a, b) => b.timestamp - a.timestamp)
                            .map((expense) => (
                              <motion.div
                                key={expense.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors group"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-white">
                                    {expense.activityTitle}
                                  </p>
                                  {expense.note && (
                                    <p className="text-xs text-gray-400 mt-1">
                                      {expense.note}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <div
                                      className="w-2 h-2 rounded-full"
                                      style={{
                                        backgroundColor:
                                          CATEGORY_COLORS[expense.category],
                                      }}
                                    />
                                    <span className="text-xs text-gray-400 capitalize">
                                      {expense.category}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-bold text-white">
                                    {formatCurrency(
                                      expense.amount,
                                      budgetData!.currency
                                    )}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleDeleteExpense(expense.id)
                                    }
                                    className="opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
