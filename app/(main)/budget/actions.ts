'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  toMonthStart,
  getBudgetStatus,
  type BudgetCategory,
  type Budget,
  type BudgetWithDetails,
  type BudgetPageData,
} from './types'

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchBudgetPageData(month: string): Promise<BudgetPageData> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const emptyResult: BudgetPageData = {
    budgets: [],
    unbudgetedCategories: [],
    totalBudget: 0,
    totalSpent: 0,
    month,
  }

  if (!user) return emptyResult

  const monthStart = toMonthStart(month)
  // End of month: first day of next month
  const d = new Date(monthStart)
  d.setMonth(d.getMonth() + 1)
  const monthEnd = d.toISOString().split('T')[0] // "YYYY-MM-DD"

  // 1. Fetch all expense categories
  const { data: categoriesData, error: catErr } = await supabase
    .from('categories')
    .select('id, name, type, group, icon, color')
    .eq('user_id', user.id)
    .eq('type', 'expense')
    .order('name', { ascending: true })

  if (catErr) {
    console.error('[fetchBudgetPageData] categories error:', catErr)
    return emptyResult
  }

  const allExpenseCategories = (categoriesData ?? []) as BudgetCategory[]

  // 2. Fetch budgets for this month
  const { data: budgetsData, error: budgetErr } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)
    .eq('month', monthStart)

  if (budgetErr) {
    console.error('[fetchBudgetPageData] budgets error:', budgetErr)
    return emptyResult
  }

  const rawBudgets = (budgetsData ?? []) as Budget[]

  // 3. Fetch transactions for this month (expenses: amount < 0)
  const { data: txData, error: txErr } = await supabase
    .from('transactions')
    .select('category, amount')
    .eq('user_id', user.id)
    .gte('date', monthStart)
    .lt('date', monthEnd)
    .lt('amount', 0)

  if (txErr) {
    console.error('[fetchBudgetPageData] transactions error:', txErr)
  }

  // 4. Aggregate spending per category name
  const spendingByName: Record<string, number> = {}
  for (const tx of txData ?? []) {
    const catName = tx.category as string
    const amt = Math.abs(tx.amount as number)
    spendingByName[catName] = (spendingByName[catName] ?? 0) + amt
  }

  // Category lookup by id
  const categoryById: Record<string, BudgetCategory> = {}
  for (const cat of allExpenseCategories) {
    categoryById[cat.id] = cat
  }

  // 5. Build BudgetWithDetails
  const budgetedCategoryIds = new Set<string>()
  const budgets: BudgetWithDetails[] = []

  for (const b of rawBudgets) {
    const category = categoryById[b.category_id]
    if (!category) continue

    budgetedCategoryIds.add(b.category_id)
    const spent = spendingByName[category.name] ?? 0
    const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0
    const status = getBudgetStatus(percentage)

    budgets.push({ ...b, category, spent, percentage, status })
  }

  // Sort: exceeded → stable → good, then by name
  const statusOrder: Record<string, number> = { exceeded: 0, stable: 1, good: 2 }
  budgets.sort((a, b) => {
    const so = statusOrder[a.status] - statusOrder[b.status]
    if (so !== 0) return so
    return a.category.name.localeCompare(b.category.name, 'vi')
  })

  const unbudgetedCategories = allExpenseCategories.filter(
    (c) => !budgetedCategoryIds.has(c.id)
  )

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)

  return { budgets, unbudgetedCategories, totalBudget, totalSpent, month }
}

// ─── Upsert ───────────────────────────────────────────────────────────────────

export async function upsertBudgetAction(
  categoryId: string,
  amount: number,
  month: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Bạn phải đăng nhập.' }

  if (!categoryId) return { error: 'Vui lòng chọn danh mục.' }
  if (!amount || amount <= 0) return { error: 'Số tiền phải lớn hơn 0.' }

  const monthStart = toMonthStart(month)

  const { error } = await supabase.from('budgets').upsert(
    {
      user_id: user.id,
      category_id: categoryId,
      amount,
      month: monthStart,
    },
    { onConflict: 'user_id,category_id,month' }
  )

  if (error) return { error: error.message }

  revalidatePath('/budget')
  return { success: true }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteBudgetAction(
  budgetId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Bạn phải đăng nhập.' }

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', budgetId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/budget')
  return { success: true }
}
