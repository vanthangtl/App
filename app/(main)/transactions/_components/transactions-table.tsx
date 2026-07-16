'use client'

import {
  ColumnDef,
  SortingState,
  VisibilityState,
  RowSelectionState,
  Table as TTable,
  flexRender,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, ReceiptText } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import type { Transaction } from '../actions'

interface TransactionsTableProps {
  data: Transaction[]
  columns: ColumnDef<Transaction>[]
  totalCount: number
  totalPages: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  sorting: SortingState
  onSortingChange: (s: SortingState) => void
  columnVisibility: VisibilityState
  onColumnVisibilityChange: (v: VisibilityState) => void
  rowSelection: RowSelectionState
  onRowSelectionChange: (s: RowSelectionState) => void
  isLoading: boolean
  table: TTable<Transaction>
}

export function TransactionsTable({
  columns,
  totalCount,
  totalPages,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isLoading,
  table,
}: TransactionsTableProps) {
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalCount)

  return (
    <div className="space-y-3">
      {/* Table */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/40 hover:bg-muted/40">
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="h-10 text-xs font-semibold uppercase tracking-wide">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: Math.min(pageSize, 8) }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, ci) => (
                    <TableCell key={ci}>
                      <Skeleton className="h-4 w-full rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <ReceiptText className="h-10 w-10 opacity-30" />
                    <p className="font-medium">Không tìm thấy giao dịch nào</p>
                    <p className="text-sm">Thử thay đổi bộ lọc hoặc tạo giao dịch mới.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  className="group/row transition-colors hover:bg-muted/30 data-[state=selected]:bg-primary/5"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="text-sm text-muted-foreground">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin inline" />
          ) : (
            <>
              Hiển thị{' '}
              <span className="font-medium text-foreground">{from}–{to}</span>{' '}
              trong{' '}
              <span className="font-medium text-foreground">{totalCount}</span>{' '}
              giao dịch
            </>
          )}
        </p>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Mỗi trang</span>
            <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Trang {page} / {totalPages || 1}
          </span>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => onPageChange(1)} disabled={page === 1 || isLoading}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => onPageChange(page - 1)} disabled={page === 1 || isLoading}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => onPageChange(page + 1)} disabled={page >= totalPages || isLoading}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => onPageChange(totalPages)} disabled={page >= totalPages || isLoading}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
