"use client";

import React, { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import {
  getBudgetData,
  calculateBudgetStatus,
  formatCurrency,
  BudgetData,
  BudgetStatus,
} from "../../lib/budgetService";

interface BudgetWidgetProps {
  destination: string;
  onSetBudget: () => void;
  onViewDetails: () => void;
}

export const BudgetWidget: React.FC<BudgetWidgetProps> = ({
  destination,
  onSetBudget,
  onViewDetails,
}) => {
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBudget = () => {
      const data = getBudgetData(destination);
      setBudgetData(data);

      if (data) {
        const status = calculateBudgetStatus(data);
        setBudgetStatus(status);
      }

      setLoading(false);
    };

    loadBudget();

    // Listen for budget updates from other components
    const handleStorageChange = () => {
      loadBudget();
    };

    window.addEventListener("storage", handleStorageChange);
    // Custom event for same-tab updates
    window.addEventListener("budgetUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("budgetUpdated", handleStorageChange);
    };
  }, [destination]);

  if (loading) {
    return (
      <div className="w-full h-32 animate-pulse bg-white/5 rounded-2xl border border-white/10" />
    );
  }

  // Show "Set Budget" prompt if no budget exists
  if (!budgetData || budgetData.totalBudget === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-white shadow-lg overflow-hidden relative group cursor-pointer hover:bg-white/10 transition-colors"
        onClick={onSetBudget}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 opacity-50 group-hover:opacity-100 transition-opacity" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-300">Budget Tracker</h3>
            <p className="text-xs text-gray-400">
              Click to set your trip budget
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!budgetStatus) return null;

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (budgetStatus.percentageSpent / 100) * circumference;

  // Determine ring color based on spending
  const getRingColor = () => {
    if (budgetStatus.percentageSpent >= 90) return "#ef4444"; // red
    if (budgetStatus.percentageSpent >= 75) return "#f59e0b"; // orange
    return "#10b981"; // emerald
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-white shadow-lg overflow-hidden relative group"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 opacity-50 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10 flex items-center justify-between gap-4">
        {/* Circular Progress Ring */}
        <div className="relative flex-shrink-0">
          <svg width="100" height="100" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress circle */}
            <motion.circle
              cx="50"
              cy="50"
              r={radius}
              stroke={getRingColor()}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">
              {Math.round(budgetStatus.percentageSpent)}%
            </span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">
              Spent
            </span>
          </div>
        </div>

        {/* Budget Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wide">
              Budget
            </h3>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-400">
                {formatCurrency(budgetStatus.totalSpent, budgetData.currency)}
              </span>
              <span className="text-xs text-gray-400">
                /{" "}
                {formatCurrency(budgetStatus.totalBudget, budgetData.currency)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <TrendingUp className="w-3 h-3 text-gray-400" />
              <span className="text-gray-400">
                {formatCurrency(budgetStatus.remaining, budgetData.currency)}{" "}
                remaining
              </span>
            </div>
          </div>

          {/* Category Pills */}
          {budgetStatus.categoryBreakdown.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {budgetStatus.categoryBreakdown.slice(0, 3).map((cat) => (
                <div
                  key={cat.category}
                  className="px-2 py-1 rounded-full bg-white/10 text-[10px] font-medium capitalize"
                >
                  {cat.category}:{" "}
                  {formatCurrency(cat.total, budgetData.currency)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* View Details Button */}
        <button
          onClick={onViewDetails}
          className="flex-shrink-0 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-xs font-medium border border-white/10"
        >
          Details
        </button>
      </div>
    </motion.div>
  );
};
