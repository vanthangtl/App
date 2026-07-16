'use client'

import { useState, useEffect, useTransition } from 'react'
import { BudgetCategory, BudgetWithDetails } from '../types'
import { upsertBudgetAction } from '../actions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface BudgetDialogProps {
  open: boolean
  onClose: () => void
  month: string // "YYYY-MM"
  /** If editing, pass existing budget; if creating, pass null */
  editingBudget: BudgetWithDetails | null
  /** Available categories (no budget yet) for creating */
  unbudgetedCategories: BudgetCategory[]
}

const GROUP_LABELS: Record<string, string> = {
  living: 'Sinh hoạt',
  arising: 'Phát sinh',
  fixed: 'Cố định',
  investment: 'Đầu tư',
}

export function BudgetDialog({
  open,
  onClose,
  month,
  editingBudget,
  unbudgetedCategories,
}: BudgetDialogProps) {
  const [categoryId, setCategoryId] = useState<string>('')
  const [amountStr, setAmountStr] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isEdit = !!editingBudget

  // Populate form when editing
  useEffect(() => {
    if (editingBudget) {
      setCategoryId(editingBudget.category_id)
      setAmountStr(String(editingBudget.amount))
    } else {
      setCategoryId('')
      setAmountStr('')
    }
    setError(null)
  }, [editingBudget, open])

  function handleClose() {
    setCategoryId('')
    setAmountStr('')
    setError(null)
    onClose()
  }

  function handleSubmit() {
    setError(null)

    const amount = parseAmountInput(amountStr)
    if (!amount || amount <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ (vd: 3000000 hoặc 3M).')
      return
    }

    const catId = isEdit ? editingBudget!.category_id : categoryId
    if (!catId) {
      setError('Vui lòng chọn danh mục.')
      return
    }

    startTransition(async () => {
      const result = await upsertBudgetAction(catId, amount, month)
      if (result.error) {
        setError(result.error)
      } else {
        handleClose()
      }
    })
  }

  // Group unbudgeted categories
  const grouped = groupByGroup(unbudgetedCategories)

  const displayMonth = formatMonthLabel(month)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Sửa ngân sách' : 'Thêm ngân sách'} — {displayMonth}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Category selector — show only when creating */}
          {isEdit ? (
            <div className="space-y-1.5">
              <Label className="text-sm">Danh mục</Label>
              <div className="rounded-md border border-border/50 bg-muted/40 px-3 py-2 text-sm font-medium">
                {editingBudget!.category.name}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="budget-category" className="text-sm">
                Danh mục <span className="text-red-400">*</span>
              </Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="budget-category">
                  <SelectValue placeholder="Chọn danh mục chi tiêu…" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(grouped).map(([grp, cats]) => (
                    <div key={grp}>
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {GROUP_LABELS[grp] ?? grp}
                      </div>
                      {cats.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.icon ? `${c.icon} ` : ''}{c.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                  {unbudgetedCategories.length === 0 && (
                    <div className="px-2 py-3 text-sm text-center text-muted-foreground">
                      Tất cả danh mục đã có ngân sách.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Amount input */}
          <div className="space-y-1.5">
            <Label htmlFor="budget-amount" className="text-sm">
              Hạn mức ngân sách <span className="text-red-400">*</span>
            </Label>
            <div className="relative">
              <Input
                id="budget-amount"
                placeholder="vd: 3000000 hoặc 3M"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                đ
              </span>
            </div>
            {amountStr && !isNaN(parseAmountInput(amountStr)) && parseAmountInput(amountStr) > 0 && (
              <p className="text-xs text-muted-foreground">
                ≈ {formatVNDFull(parseAmountInput(amountStr))}
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-400 -mt-1">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Đang lưu…' : isEdit ? 'Cập nhật' : 'Thêm ngân sách'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByGroup(
  cats: BudgetCategory[]
): Record<string, BudgetCategory[]> {
  const result: Record<string, BudgetCategory[]> = {}
  for (const c of cats) {
    const grp = c.group ?? 'other'
    if (!result[grp]) result[grp] = []
    result[grp].push(c)
  }
  return result
}

/** Parse "3M", "3.5M", "500K", or plain numbers */
function parseAmountInput(raw: string): number {
  if (!raw) return NaN
  const s = raw.trim().toUpperCase()
  if (s.endsWith('M')) return parseFloat(s.slice(0, -1)) * 1_000_000
  if (s.endsWith('K')) return parseFloat(s.slice(0, -1)) * 1_000
  if (s.endsWith('T')) return parseFloat(s.slice(0, -1)) * 1_000_000_000
  return parseFloat(s.replace(/[,. ]/g, ''))
}

function formatVNDFull(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-')
  return `Tháng ${parseInt(m)}/${y}`
}
