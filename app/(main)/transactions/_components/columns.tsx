'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal, Copy, Check, TrendingUp, TrendingDown } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import type { Transaction } from '../actions'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(Math.abs(amount))
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function CopyIdCell({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)
  const short = id.slice(0, 8).toUpperCase()

  const handleCopy = () => {
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-xs text-muted-foreground">{short}…</span>
      <button
        onClick={handleCopy}
        className="opacity-0 group-hover/row:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        title="Sao chép ID"
      >
        {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  )
}

// ─── Column definitions ───────────────────────────────────────────────────────

interface GetColumnsOptions {
  onEdit: (tx: Transaction) => void
  onDelete: (tx: Transaction) => void
}

export function getColumns({ onEdit, onDelete }: GetColumnsOptions): ColumnDef<Transaction>[] {
  return [
    // Checkbox
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Chọn tất cả"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Chọn hàng"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },

    // ID
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => <CopyIdCell id={row.getValue('id')} />,
      enableSorting: false,
    },

    // Ngày
    {
      accessorKey: 'date',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Ngày
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">{formatDate(row.getValue('date'))}</span>
      ),
    },

    // Nội dung
    {
      accessorKey: 'description',
      header: 'Nội dung',
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate font-medium" title={row.getValue('description')}>
          {row.getValue('description')}
        </div>
      ),
    },

    // Danh mục
    {
      accessorKey: 'category',
      header: 'Danh mục',
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-xs font-normal">
          {row.getValue('category')}
        </Badge>
      ),
    },

    // Nguồn
    {
      accessorKey: 'source',
      header: 'Nguồn tiền',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.getValue('source')}</span>
      ),
    },

    // Số tiền
    {
      accessorKey: 'amount',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Số tiền
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const amount: number = row.getValue('amount')
        const isIncome = amount >= 0
        return (
          <span
            className={`font-semibold tabular-nums text-sm ${
              isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isIncome ? '+' : '-'}{formatVND(amount)}
          </span>
        )
      },
    },

    // Loại
    {
      accessorKey: 'type',
      header: 'Loại',
      cell: ({ row }) => {
        const type: string = row.getValue('type')
        const isIncome = type === 'income'
        return (
          <Badge
            className={`gap-1 text-xs font-medium ${
              isIncome
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                : 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
            }`}
            variant="outline"
          >
            {isIncome ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isIncome ? 'Thu nhập' : 'Chi tiêu'}
          </Badge>
        )
      },
    },

    // Actions
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => {
        const tx = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Mở menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(tx.id)}>
                Sao chép ID
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(tx)}>
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(tx)}
                className="text-destructive focus:text-destructive"
              >
                Xóa giao dịch
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableSorting: false,
      enableHiding: false,
    },
  ]
}
