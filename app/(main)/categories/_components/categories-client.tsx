'use client'

import React, { useState, useTransition } from 'react'
import { Category, ExpenseGroup, seedDefaultCategoriesAction } from '../actions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus, Sparkles, Loader2 } from 'lucide-react'
import { CategoryCard } from './category-card'
import {
  AddExpenseCategoryDialog,
  AddIncomeCategoryDialog,
  UpdateCategoryDialog,
  DeleteCategoryDialog,
} from './category-dialog'

// ─── Expense group metadata ────────────────────────────────────────────────────

export const EXPENSE_GROUPS: {
  key: ExpenseGroup
  label: string
  emoji: string
  description: string
  /** Tailwind classes for the section panel background + border */
  panelClass: string
  /** Tailwind classes for the header accent bar */
  accentClass: string
}[] = [
  {
    key: 'living',
    label: 'Chi tiêu - Sinh hoạt',
    emoji: '🛒',
    description: 'Chợ, siêu thị, ăn uống, di chuyển...',
    panelClass:
      'bg-orange-500/5 border border-orange-500/20 dark:bg-orange-500/8 dark:border-orange-500/25',
    accentClass: 'bg-orange-400 dark:bg-orange-500',
  },
  {
    key: 'arising',
    label: 'Chi phí phát sinh',
    emoji: '⚡',
    description: 'Mua sắm, giải trí, làm đẹp, sức khỏe...',
    panelClass:
      'bg-violet-500/5 border border-violet-500/20 dark:bg-violet-500/8 dark:border-violet-500/25',
    accentClass: 'bg-violet-400 dark:bg-violet-500',
  },
  {
    key: 'fixed',
    label: 'Chi phí cố định',
    emoji: '🏠',
    description: 'Hóa đơn, nhà cửa, người thân...',
    panelClass:
      'bg-sky-500/5 border border-sky-500/20 dark:bg-sky-500/8 dark:border-sky-500/25',
    accentClass: 'bg-sky-400 dark:bg-sky-500',
  },
  {
    key: 'investment',
    label: 'Đầu tư - Tiết kiệm',
    emoji: '📈',
    description: 'Đầu tư, học tập, tiết kiệm...',
    panelClass:
      'bg-emerald-500/5 border border-emerald-500/20 dark:bg-emerald-500/8 dark:border-emerald-500/25',
    accentClass: 'bg-emerald-400 dark:bg-emerald-500',
  },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface CategoriesClientProps {
  initialIncome: Category[]
  initialExpense: Category[]
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function CategoriesClient({
  initialIncome,
  initialExpense,
}: CategoriesClientProps) {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense')

  // Dialog states
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

  // Seed defaults
  const [isSeedPending, startSeedTransition] = useTransition()
  const [seedError, setSeedError] = useState<string | null>(null)

  const handleSeedDefaults = () => {
    setSeedError(null)
    startSeedTransition(async () => {
      const result = await seedDefaultCategoriesAction()
      if (result?.error) setSeedError(result.error)
    })
  }

  // Group expense categories by their group key
  const expenseByGroup = EXPENSE_GROUPS.map((g) => ({
    ...g,
    categories: initialExpense.filter((c) => c.group === g.key),
  }))

  const hasNoCategories =
    initialIncome.length === 0 && initialExpense.length === 0

  return (
    <div className="w-full flex flex-col gap-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Quản lý danh mục
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Phân loại chi tiêu và thu nhập của bạn theo danh mục.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Seed defaults button – only shown when no data */}
          {hasNoCategories && (
            <Button
              variant="outline"
              onClick={handleSeedDefaults}
              disabled={isSeedPending}
              className="flex items-center justify-center gap-2"
            >
              {isSeedPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Thêm danh mục mặc định
            </Button>
          )}

          <Button
            variant={activeTab === 'expense' ? 'default' : 'outline'}
            onClick={() => {
              setActiveTab('expense')
              setIsAddExpenseOpen(true)
            }}
            className="flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Thêm chi tiêu
          </Button>

          <Button
            variant={activeTab === 'income' ? 'default' : 'outline'}
            onClick={() => {
              setActiveTab('income')
              setIsAddIncomeOpen(true)
            }}
            className="flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Thêm thu nhập
          </Button>
        </div>
      </div>

      {/* Seed error */}
      {seedError && (
        <div className="p-3 text-sm bg-destructive/15 text-destructive rounded-md border border-destructive/20">
          {seedError}
        </div>
      )}

      {/* ── Tabs ───────────────────────────────────────────── */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'expense' | 'income')}
        className="flex flex-col w-full"
      >
        <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
          <TabsList className="bg-muted p-1 rounded-lg inline-flex mb-4 min-w-max">
            <TabsTrigger
              value="expense"
              className="px-5 py-2 text-sm font-medium transition-all rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
            >
              💸 Chi tiêu
              {initialExpense.length > 0 && (
                <span className="ml-2 text-xs bg-muted-foreground/20 rounded-full px-1.5 py-0.5">
                  {initialExpense.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="income"
              className="px-5 py-2 text-sm font-medium transition-all rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
            >
              💰 Thu nhập
              {initialIncome.length > 0 && (
                <span className="ml-2 text-xs bg-muted-foreground/20 rounded-full px-1.5 py-0.5">
                  {initialIncome.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── TAB: Chi tiêu ──────────────────────────────────── */}
        <TabsContent value="expense" className="mt-0 space-y-8">
          {initialExpense.length === 0 ? (
            <EmptyState
              label="Chưa có danh mục chi tiêu nào."
              onAdd={() => setIsAddExpenseOpen(true)}
              onSeed={handleSeedDefaults}
              isSeedPending={isSeedPending}
            />
          ) : (
            expenseByGroup.map((group) => (
              <section
                key={group.key}
                className={`rounded-xl p-4 sm:p-5 ${group.panelClass}`}
              >
                {/* Group header */}
                <div className="flex items-center gap-3 mb-4">
                  {/* Accent bar */}
                  <div className={`w-1 h-10 rounded-full flex-shrink-0 ${group.accentClass}`} />

                  <span className="text-xl leading-none">{group.emoji}</span>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold leading-none">
                      {group.label}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {group.description}
                    </p>
                  </div>

                  <span className="flex-shrink-0 text-xs text-muted-foreground bg-background/70 border rounded-full px-2.5 py-1">
                    {group.categories.length} danh mục
                  </span>
                </div>

                {group.categories.length === 0 ? (
                  <div className="border border-dashed rounded-lg p-5 text-center text-sm text-muted-foreground bg-background/40">
                    Chưa có danh mục nào trong nhóm này.
                  </div>
                ) : (
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {group.categories.map((cat) => (
                      <CategoryCard
                        key={cat.id}
                        category={cat}
                        onEdit={() => setEditingCategory(cat)}
                        onDelete={() => {
                          setEditingCategory(null)
                          setDeletingCategory(cat)
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>
            ))
          )}
        </TabsContent>

        {/* ── TAB: Thu nhập ──────────────────────────────────── */}
        <TabsContent value="income" className="mt-0">
          {initialIncome.length === 0 ? (
            <EmptyState
              label="Chưa có danh mục thu nhập nào."
              onAdd={() => setIsAddIncomeOpen(true)}
            />
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {initialIncome.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  onEdit={() => setEditingCategory(cat)}
                  onDelete={() => {
                    setEditingCategory(null)
                    setDeletingCategory(cat)
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ────────────────────────────────────────── */}
      <AddExpenseCategoryDialog
        open={isAddExpenseOpen}
        onOpenChange={setIsAddExpenseOpen}
      />

      <AddIncomeCategoryDialog
        open={isAddIncomeOpen}
        onOpenChange={setIsAddIncomeOpen}
      />

      {editingCategory && (
        <UpdateCategoryDialog
          category={editingCategory}
          open={!!editingCategory}
          onOpenChange={(open) => !open && setEditingCategory(null)}
        />
      )}

      {deletingCategory && (
        <DeleteCategoryDialog
          category={deletingCategory}
          open={!!deletingCategory}
          onOpenChange={(open) => !open && setDeletingCategory(null)}
        />
      )}
    </div>
  )
}

// ─── Empty State Helper ───────────────────────────────────────────────────────

function EmptyState({
  label,
  onAdd,
  onSeed,
  isSeedPending,
}: {
  label: string
  onAdd: () => void
  onSeed?: () => void
  isSeedPending?: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-4 border border-dashed rounded-xl bg-muted/20 gap-3">
      <p className="text-muted-foreground text-sm text-center">{label}</p>
      <div className="flex gap-2 flex-wrap justify-center">
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-1" /> Thêm mới
        </Button>
        {onSeed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSeed}
            disabled={isSeedPending}
          >
            {isSeedPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1" />
            )}
            Dùng danh mục mặc định
          </Button>
        )}
      </div>
    </div>
  )
}
