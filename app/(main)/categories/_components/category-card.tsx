'use client'

import { Category } from '../actions'
import { EXPENSE_GROUPS } from './categories-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SquarePen, Trash2, ShoppingCart, Zap, Home, TrendingUp, Wallet } from 'lucide-react'

// ─── Group icon mapping ────────────────────────────────────────────────────────

function GroupIcon({ group }: { group: string | null }) {
  switch (group) {
    case 'living':
      return <ShoppingCart className="h-4 w-4" />
    case 'arising':
      return <Zap className="h-4 w-4" />
    case 'fixed':
      return <Home className="h-4 w-4" />
    case 'investment':
      return <TrendingUp className="h-4 w-4" />
    default:
      return <Wallet className="h-4 w-4" />
  }
}

// ─── Card gradient by type/group ──────────────────────────────────────────────

function getCardGradient(type: string, group: string | null) {
  if (type === 'income') {
    return 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-200/50 hover:border-emerald-400/50 dark:from-emerald-950/20 dark:to-teal-950/20 dark:border-emerald-800/40'
  }
  switch (group) {
    case 'living':
      return 'bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-200/50 hover:border-orange-400/50 dark:from-orange-950/20 dark:to-amber-950/20 dark:border-orange-800/40'
    case 'arising':
      return 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-200/50 hover:border-purple-400/50 dark:from-purple-950/20 dark:to-pink-950/20 dark:border-purple-800/40'
    case 'fixed':
      return 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-200/50 hover:border-blue-400/50 dark:from-blue-950/20 dark:to-indigo-950/20 dark:border-blue-800/40'
    case 'investment':
      return 'bg-gradient-to-br from-cyan-500/10 to-sky-500/10 border-cyan-200/50 hover:border-cyan-400/50 dark:from-cyan-950/20 dark:to-sky-950/20 dark:border-cyan-800/40'
    default:
      return 'bg-gradient-to-br from-slate-500/10 to-zinc-500/10 border-slate-200/50 hover:border-slate-400/50 dark:from-slate-950/20 dark:to-zinc-950/20 dark:border-slate-800/40'
  }
}

// ─── Badge variant by type ────────────────────────────────────────────────────

function getGroupLabel(group: string | null) {
  const found = EXPENSE_GROUPS.find((g) => g.key === group)
  return found ? found.label : null
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CategoryCardProps {
  category: Category
  onEdit: () => void
  onDelete: () => void
}

export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  const gradient = getCardGradient(category.type, category.group)
  const groupLabel = category.type === 'expense' ? getGroupLabel(category.group) : null

  return (
    <Card
      className={`w-full border shadow-sm transition-all duration-200 ${gradient}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          {/* Icon + name */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex-shrink-0 p-1.5 rounded-md bg-background border shadow-sm">
              <GroupIcon group={category.group} />
            </div>
            <span className="text-sm font-semibold leading-tight truncate">
              {category.name}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={onEdit}
            >
              <SquarePen className="h-3.5 w-3.5" />
              <span className="sr-only">Sửa</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="sr-only">Xóa</span>
            </Button>
          </div>
        </div>

        {/* Badge */}
        {groupLabel && (
          <div className="mt-2">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
              {groupLabel}
            </Badge>
          </div>
        )}
        {category.type === 'income' && (
          <div className="mt-2">
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 font-normal bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            >
              Thu nhập
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
