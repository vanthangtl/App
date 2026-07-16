// ─── Types ────────────────────────────────────────────────────────────────────

export type ExpenseGroup = 'living' | 'arising' | 'fixed' | 'investment'

export interface BudgetCategory {
  id: string
  name: string
  type: 'income' | 'expense'
  group: ExpenseGroup | null
  icon: string | null
  color: string | null
}

export interface Budget {
  id: string
  user_id: string
  category_id: string
  amount: number
  month: string // ISO date string: "2026-07-01"
  created_at: string
}

export interface BudgetWithDetails extends Budget {
  category: BudgetCategory
  spent: number
  percentage: number
  status: 'good' | 'stable' | 'exceeded'
}

export interface BudgetPageData {
  budgets: BudgetWithDetails[]
  unbudgetedCategories: BudgetCategory[]
  totalBudget: number
  totalSpent: number
  month: string
}

// ─── Pure helpers (no server dependency) ─────────────────────────────────────

/** Normalise a month string to the first day: "2026-07" → "2026-07-01" */
export function toMonthStart(month: string): string {
  if (/^\d{4}-\d{2}$/.test(month)) return `${month}-01`
  return month
}

/** Format a Date to "YYYY-MM" */
export function formatMonth(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/** Compute budget status from percentage */
export function getBudgetStatus(percentage: number): 'good' | 'stable' | 'exceeded' {
  if (percentage > 100) return 'exceeded'
  if (percentage >= 70) return 'stable'
  return 'good'
}
