'use client'

import { BudgetPageData } from '../types'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TrendingDown, Wallet, PiggyBank } from 'lucide-react'

interface BudgetSummaryProps {
  data: Pick<BudgetPageData, 'totalBudget' | 'totalSpent'>
}

export function BudgetSummary({ data }: BudgetSummaryProps) {
  const { totalBudget, totalSpent } = data
  const remaining = totalBudget - totalSpent
  const overallPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0

  const progressColor =
    overallPct > 100
      ? 'bg-red-500'
      : overallPct >= 70
      ? 'bg-amber-500'
      : 'bg-emerald-500'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Total budget */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
        <CardContent className="pt-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Tổng ngân sách
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {formatVND(totalBudget)}
              </p>
            </div>
            <div className="rounded-lg bg-blue-500/15 p-2">
              <Wallet className="h-4 w-4 text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total spent */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
        <CardContent className="pt-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Đã chi tiêu
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {formatVND(totalSpent)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {totalBudget > 0 ? `${Math.round(overallPct)}% ngân sách` : '—'}
              </p>
            </div>
            <div className="rounded-lg bg-rose-500/15 p-2">
              <TrendingDown className="h-4 w-4 text-rose-400" />
            </div>
          </div>
          {totalBudget > 0 && (
            <div className="mt-3">
              <Progress
                value={overallPct}
                className={`h-1.5 [&>div]:${progressColor}`}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remaining */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
        <CardContent className="pt-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Còn lại
              </p>
              <p
                className={`mt-1 text-2xl font-bold ${
                  remaining < 0 ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {remaining < 0 ? '-' : '+'}{formatVND(Math.abs(remaining))}
              </p>
              {remaining >= 0 && totalBudget > 0 && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Tiết kiệm được {formatVND(remaining)}
                </p>
              )}
            </div>
            <div className="rounded-lg bg-emerald-500/15 p-2">
              <PiggyBank className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function formatVND(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}T`
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`
  return amount.toLocaleString('vi-VN') + 'đ'
}
