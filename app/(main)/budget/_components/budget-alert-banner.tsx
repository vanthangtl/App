'use client'

import { BudgetWithDetails } from '../types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, TrendingUp } from 'lucide-react'

interface BudgetAlertBannerProps {
  budgets: BudgetWithDetails[]
}

export function BudgetAlertBanner({ budgets }: BudgetAlertBannerProps) {
  const exceeded = budgets.filter((b) => b.status === 'exceeded')
  const nearLimit = budgets.filter(
    (b) => b.status === 'stable' && b.percentage >= 80
  )

  if (exceeded.length === 0 && nearLimit.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {exceeded.map((b) => {
        const overAmount = b.spent - b.amount
        return (
          <Alert key={b.id} variant="destructive" className="border-red-500/50 bg-red-500/10">
            <TrendingUp className="h-4 w-4" />
            <AlertTitle className="font-semibold">
              🚨 Vượt ngân sách: {b.category.name}
            </AlertTitle>
            <AlertDescription className="text-sm">
              Đã chi{' '}
              <span className="font-semibold">{formatVND(b.spent)}</span> — vượt{' '}
              <span className="font-semibold text-red-400">{formatVND(overAmount)}</span> so với hạn mức{' '}
              {formatVND(b.amount)}. Xem lại các giao dịch để cải thiện chi tiêu.
            </AlertDescription>
          </Alert>
        )
      })}

      {nearLimit.map((b) => (
        <Alert
          key={b.id}
          className="border-amber-500/50 bg-amber-500/10 text-amber-200 [&>svg]:text-amber-400"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-semibold text-amber-200">
            ⚠️ Sắp vượt ngân sách: {b.category.name}
          </AlertTitle>
          <AlertDescription className="text-amber-300/80 text-sm">
            Đã dùng{' '}
            <span className="font-semibold text-amber-200">
              {Math.round(b.percentage)}%
            </span>{' '}
            ngân sách ({formatVND(b.spent)} / {formatVND(b.amount)}) — hãy kiểm soát chi tiêu để
            không vượt hạn mức.
          </AlertDescription>
        </Alert>
      ))}
    </div>
  )
}

function formatVND(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}T`
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`
  return amount.toLocaleString('vi-VN') + 'đ'
}
