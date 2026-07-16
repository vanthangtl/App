'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BudgetPageData, BudgetWithDetails } from '../types'
import { BudgetSummary } from './budget-summary'
import { BudgetAlertBanner } from './budget-alert-banner'
import { BudgetCard } from './budget-card'
import { BudgetDialog } from './budget-dialog'
import { Button } from '@/components/ui/button'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface BudgetClientProps {
  initialData: BudgetPageData
}

const GROUP_LABELS: Record<string, string> = {
  living: '🏡 Sinh hoạt',
  arising: '✨ Phát sinh',
  fixed: '📌 Cố định',
  investment: '📈 Đầu tư',
}

const GROUP_ORDER = ['living', 'arising', 'fixed', 'investment']

export function BudgetClient({ initialData }: BudgetClientProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<BudgetWithDetails | null>(null)

  const { budgets, unbudgetedCategories, totalBudget, totalSpent, month } = initialData

  // ── Month navigation ──────────────────────────────────────────────────────
  function navigateMonth(delta: number) {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    router.push(`/budget?month=${newMonth}`)
  }

  const displayMonth = formatMonthLabel(month)
  const isCurrentMonth = month === formatMonthNow()

  // ── Dialog handlers ───────────────────────────────────────────────────────
  function openCreate() {
    setEditingBudget(null)
    setDialogOpen(true)
  }

  function openEdit(budget: BudgetWithDetails) {
    setEditingBudget(budget)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingBudget(null)
  }

  // ── Group budgets by category group ──────────────────────────────────────
  const grouped: Record<string, BudgetWithDetails[]> = {}
  for (const b of budgets) {
    const grp = b.category.group ?? 'other'
    if (!grouped[grp]) grouped[grp] = []
    grouped[grp].push(b)
  }

  const sortedGroups = GROUP_ORDER.filter((g) => grouped[g]?.length)
  if (grouped['other']?.length) sortedGroups.push('other')

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ngân sách Chi tiêu</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quản lý hạn mức chi tiêu theo từng danh mục
          </p>
        </div>

        {/* Month picker */}
        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigateMonth(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[120px] text-center">
            <span className="text-sm font-semibold">{displayMonth}</span>
            {isCurrentMonth && (
              <span className="ml-2 text-xs text-emerald-400 font-medium">Hiện tại</span>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigateMonth(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Button size="sm" className="gap-1.5" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Thêm ngân sách
          </Button>
        </div>
      </div>

      {/* ── Smart alert banners ─────────────────────────────────────────────── */}
      {budgets.length > 0 && <BudgetAlertBanner budgets={budgets} />}

      {/* ── Summary cards ──────────────────────────────────────────────────── */}
      {budgets.length > 0 && (
        <BudgetSummary data={{ totalBudget, totalSpent }} />
      )}

      {/* ── Budget grid by group ───────────────────────────────────────────── */}
      {sortedGroups.length > 0 ? (
        <div className="flex flex-col gap-8">
          {sortedGroups.map((grp) => (
            <section key={grp}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {GROUP_LABELS[grp] ?? grp}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {grouped[grp].map((b) => (
                  <BudgetCard key={b.id} budget={b} onEdit={openEdit} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/20 py-16 gap-4">
          <div className="text-5xl">🐷</div>
          <div className="text-center">
            <p className="font-semibold text-foreground">Chưa có ngân sách nào</p>
            <p className="text-sm text-muted-foreground mt-1">
              Thêm ngân sách để bắt đầu kiểm soát chi tiêu tháng này
            </p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Thêm ngân sách đầu tiên
          </Button>
        </div>
      )}

      {/* ── Dialog ─────────────────────────────────────────────────────────── */}
      <BudgetDialog
        open={dialogOpen}
        onClose={closeDialog}
        month={month}
        editingBudget={editingBudget}
        unbudgetedCategories={
          editingBudget
            ? unbudgetedCategories
            : unbudgetedCategories
        }
      />
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-')
  return `Tháng ${parseInt(m)}/${y}`
}

function formatMonthNow(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
