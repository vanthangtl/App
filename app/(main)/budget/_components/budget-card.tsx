'use client'

import { useState, useTransition } from 'react'
import { BudgetWithDetails } from '../types'
import { deleteBudgetAction } from '../actions'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Pencil, Trash2 } from 'lucide-react'
import { formatVND } from './budget-summary'

interface BudgetCardProps {
  budget: BudgetWithDetails
  onEdit: (budget: BudgetWithDetails) => void
}

const STATUS_CONFIG = {
  good: {
    label: 'Tốt',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    progressClass: '[&>div]:bg-emerald-500',
    description: 'Chi tiêu thấp hơn mức nên chi – cuối tháng có thể có khoản dư.',
  },
  stable: {
    label: 'Ổn định',
    badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    progressClass: '[&>div]:bg-amber-500',
    description: 'Chi tiêu đang phù hợp – giữ vững để không vượt ngân sách.',
  },
  exceeded: {
    label: 'Đã vượt',
    badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30',
    progressClass: '[&>div]:bg-red-500',
    description: 'Chi tiêu đã vượt quá hạn mức – xem lại các giao dịch để cải thiện.',
  },
}

export function BudgetCard({ budget, onEdit }: BudgetCardProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const config = STATUS_CONFIG[budget.status]
  // Cap display percentage at 100 for the bar; show real % in text
  const barValue = Math.min(budget.percentage, 100)
  const displayPct = Math.round(budget.percentage)

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteBudgetAction(budget.id)
      if (result.error) setError(result.error)
    })
  }

  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur-sm transition-all hover:border-border hover:shadow-lg hover:shadow-black/10">
      <CardContent className="pt-4 pb-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="shrink-0 text-lg leading-none">
              {budget.category.icon ?? getCategoryEmoji(budget.category.name)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">
                {budget.category.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {config.description}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`shrink-0 text-xs font-semibold ${config.badgeClass}`}
          >
            {config.label}
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="mb-1">
          <Progress
            value={barValue}
            className={`h-2 rounded-full bg-muted ${config.progressClass}`}
          />
        </div>

        {/* Amounts */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">
              {formatVND(budget.spent)}
            </span>
            {' '}/ {formatVND(budget.amount)}
          </span>
          <span
            className={`font-semibold tabular-nums ${
              budget.status === 'exceeded'
                ? 'text-red-400'
                : budget.status === 'stable'
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {displayPct}%
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(budget)}
          >
            <Pencil className="h-3 w-3" />
            Sửa
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-red-400"
            onClick={handleDelete}
            disabled={isPending}
          >
            <Trash2 className="h-3 w-3" />
            {isPending ? 'Đang xóa…' : 'Xóa'}
          </Button>
          {error && (
            <p className="text-xs text-red-400 ml-auto">{error}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Fallback emoji by category name keywords
function getCategoryEmoji(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('chợ') || n.includes('siêu thị')) return '🛒'
  if (n.includes('ăn') || n.includes('thức ăn')) return '🍜'
  if (n.includes('café') || n.includes('cà phê')) return '☕'
  if (n.includes('xăng') || n.includes('di chuyển')) return '🚗'
  if (n.includes('điện')) return '⚡'
  if (n.includes('nước')) return '💧'
  if (n.includes('internet') || n.includes('wifi')) return '📡'
  if (n.includes('nhà') || n.includes('thuê')) return '🏠'
  if (n.includes('bảo hiểm')) return '🛡️'
  if (n.includes('mua sắm')) return '🛍️'
  if (n.includes('giải trí')) return '🎮'
  if (n.includes('làm đẹp')) return '💅'
  if (n.includes('sức khỏe') || n.includes('y tế')) return '🏥'
  if (n.includes('du lịch')) return '✈️'
  if (n.includes('quần áo') || n.includes('thời trang')) return '👗'
  if (n.includes('đầu tư')) return '📈'
  if (n.includes('tiết kiệm')) return '🏦'
  if (n.includes('học') || n.includes('sách')) return '📚'
  if (n.includes('người thân') || n.includes('gia đình')) return '👨‍👩‍👧'
  return '💰'
}
