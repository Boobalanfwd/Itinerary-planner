import { ActivityType } from "../components/types";

// Budget-related interfaces
export interface BudgetExpense {
  id: string;
  amount: number;
  category: ActivityType;
  activityTitle: string;
  note?: string;
  timestamp: number;
}

export interface BudgetData {
  totalBudget: number;
  expenses: BudgetExpense[];
  currency: string;
}

export interface CategorySpending {
  category: ActivityType;
  total: number;
  count: number;
}

export interface BudgetStatus {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentageSpent: number;
  categoryBreakdown: CategorySpending[];
}

// LocalStorage key prefix
const BUDGET_KEY_PREFIX = "itinerary_budget_";

/**
 * Get budget data for a specific destination from localStorage
 */
export const getBudgetData = (destination: string): BudgetData | null => {
  if (typeof window === "undefined") return null;

  try {
    const key =
      BUDGET_KEY_PREFIX + destination.toLowerCase().replace(/\s+/g, "_");
    const stored = localStorage.getItem(key);

    if (!stored) return null;

    const data = JSON.parse(stored) as BudgetData;
    return data;
  } catch (error) {
    console.error("Failed to load budget data:", error);
    return null;
  }
};

/**
 * Save budget data to localStorage
 */
export const saveBudgetData = (
  destination: string,
  data: BudgetData
): boolean => {
  if (typeof window === "undefined") return false;

  try {
    const key =
      BUDGET_KEY_PREFIX + destination.toLowerCase().replace(/\s+/g, "_");
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Failed to save budget data:", error);
    // Handle quota exceeded error
    if (error instanceof Error && error.name === "QuotaExceededError") {
      console.warn("LocalStorage quota exceeded. Consider clearing old data.");
    }
    return false;
  }
};

/**
 * Initialize budget with total amount
 */
export const initializeBudget = (
  destination: string,
  totalBudget: number,
  currency: string = "USD"
): BudgetData => {
  const budgetData: BudgetData = {
    totalBudget,
    expenses: [],
    currency,
  };

  saveBudgetData(destination, budgetData);
  return budgetData;
};

/**
 * Add a new expense
 */
export const addExpense = (
  destination: string,
  expense: Omit<BudgetExpense, "id" | "timestamp">
): BudgetData | null => {
  const budgetData = getBudgetData(destination);
  if (!budgetData) return null;

  const newExpense: BudgetExpense = {
    ...expense,
    id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };

  budgetData.expenses.push(newExpense);
  saveBudgetData(destination, budgetData);

  return budgetData;
};

/**
 * Update an existing expense
 */
export const updateExpense = (
  destination: string,
  expenseId: string,
  updates: Partial<Omit<BudgetExpense, "id" | "timestamp">>
): BudgetData | null => {
  const budgetData = getBudgetData(destination);
  if (!budgetData) return null;

  const expenseIndex = budgetData.expenses.findIndex((e) => e.id === expenseId);
  if (expenseIndex === -1) return null;

  budgetData.expenses[expenseIndex] = {
    ...budgetData.expenses[expenseIndex],
    ...updates,
  };

  saveBudgetData(destination, budgetData);
  return budgetData;
};

/**
 * Delete an expense
 */
export const deleteExpense = (
  destination: string,
  expenseId: string
): BudgetData | null => {
  const budgetData = getBudgetData(destination);
  if (!budgetData) return null;

  budgetData.expenses = budgetData.expenses.filter((e) => e.id !== expenseId);
  saveBudgetData(destination, budgetData);

  return budgetData;
};

/**
 * Calculate spending breakdown by category
 */
export const calculateCategoryBreakdown = (
  expenses: BudgetExpense[]
): CategorySpending[] => {
  const categoryMap = new Map<ActivityType, CategorySpending>();

  expenses.forEach((expense) => {
    const existing = categoryMap.get(expense.category);
    if (existing) {
      existing.total += expense.amount;
      existing.count += 1;
    } else {
      categoryMap.set(expense.category, {
        category: expense.category,
        total: expense.amount,
        count: 1,
      });
    }
  });

  return Array.from(categoryMap.values()).sort((a, b) => b.total - a.total);
};

/**
 * Calculate overall budget status
 */
export const calculateBudgetStatus = (budgetData: BudgetData): BudgetStatus => {
  const totalSpent = budgetData.expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  const remaining = budgetData.totalBudget - totalSpent;
  const percentageSpent =
    budgetData.totalBudget > 0
      ? (totalSpent / budgetData.totalBudget) * 100
      : 0;

  return {
    totalBudget: budgetData.totalBudget,
    totalSpent,
    remaining,
    percentageSpent,
    categoryBreakdown: calculateCategoryBreakdown(budgetData.expenses),
  };
};

/**
 * Format currency amount
 */
export const formatCurrency = (
  amount: number,
  currency: string = "USD"
): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
