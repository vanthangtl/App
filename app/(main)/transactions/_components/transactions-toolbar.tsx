'use client'

import { useCallback, useTransition } from 'react'
import { Search, SlidersHorizontal, Plus, Trash2, X, CalendarIcon } from 'lucide-react'
import { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { bulkDeleteTransactionsAction } from '../actions'
import { toast } from 'sonner'
import type { Transaction } from '../actions'

// Column label mapping
const COLUMN_LABELS: Record<string, string> = {
  id: 'ID',
  date: 'Ngày',
  description: 'Nội dung',
  category: 'Danh mục',
  source: 'Nguồn tiền',
  amount: 'Số tiền',
  type: 'Loại',
}

interface TransactionsToolbarProps {
  table: Table<Transaction>
  search: string
  onSearchChange: (v: string) => void
  typeFilter: string
  onTypeFilterChange: (v: string) => void
  dateFrom: string
  onDateFromChange: (v: string) => void
  dateTo: string
  onDateToChange: (v: string) => void
  onCreateNew: () => void
  onRefresh: () => void
}

export function TransactionsToolbar({
  table,
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onCreateNew,
  onRefresh,
}: TransactionsToolbarProps) {
  const [isPending, startTransition] = useTransition()
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const hasSelection = selectedRows.length > 0

  const handleBulkDelete = useCallback(() => {
    if (!confirm(`Xóa ${selectedRows.length} giao dịch đã chọn?`)) return
    const ids = selectedRows.map((r) => r.original.id)
    startTransition(async () => {
      const result = await bulkDeleteTransactionsAction(ids)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`Đã xóa ${ids.length} giao dịch.`)
        table.resetRowSelection()
        onRefresh()
      }
    })
  }, [selectedRows, table, onRefresh])

  const clearFilters = () => {
    onSearchChange('')
    onTypeFilterChange('all')
    onDateFromChange('')
    onDateToChange('')
  }

  const hasActiveFilters = search || typeFilter !== 'all' || dateFrom || dateTo

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: search + filters + create button */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Tìm kiếm nội dung, danh mục, ID…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Type filter */}
        <Select value={typeFilter} onValueChange={onTypeFilterChange}>
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue placeholder="Loại giao dịch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            <SelectItem value="income">Thu nhập</SelectItem>
            <SelectItem value="expense">Chi tiêu</SelectItem>
          </SelectContent>
        </Select>

        {/* Date from */}
        <div className="relative">
          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="h-9 pl-9 w-[155px]"
            title="Từ ngày"
          />
        </div>

        {/* Date to */}
        <div className="relative">
          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="h-9 pl-9 w-[155px]"
            title="Đến ngày"
          />
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-2 text-muted-foreground">
            <X className="h-4 w-4 mr-1" />
            Xóa lọc
          </Button>
        )}

        {/* Column visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 ml-auto">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Cột
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuLabel>Hiển thị cột</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  onCheckedChange={(value) => col.toggleVisibility(!!value)}
                >
                  {COLUMN_LABELS[col.id] ?? col.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* CTA: Create */}
        <Button onClick={onCreateNew} size="sm" className="h-9 gap-2">
          <Plus className="h-4 w-4" />
          Tạo giao dịch
        </Button>
      </div>

      {/* Row 2: bulk actions (only when rows selected) */}
      {hasSelection && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
          <span className="text-sm text-destructive font-medium">
            {selectedRows.length} giao dịch được chọn
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={isPending}
            className="h-7 gap-1.5 ml-auto"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isPending ? 'Đang xóa…' : 'Xóa đã chọn'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.resetRowSelection()}
            className="h-7"
          >
            Bỏ chọn
          </Button>
        </div>
      )}
    </div>
  )
}
