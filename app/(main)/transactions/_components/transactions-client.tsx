'use client'

import { useState, useCallback, useTransition, useEffect, useMemo, useRef } from 'react'
import {
  SortingState,
  VisibilityState,
  RowSelectionState,
  ColumnDef,
  Updater,
  useReactTable,
  getCoreRowModel,
} from '@tanstack/react-table'
import { ReceiptText } from 'lucide-react'
import { TransactionsToolbar } from './transactions-toolbar'
import { TransactionsTable } from './transactions-table'
import { TransactionDialog, DeleteTransactionDialog } from './transaction-dialog'
import { getColumns } from './columns'
import {
  fetchTransactionsAction,
  type Transaction,
  type FetchTransactionsResult,
} from '../actions'

interface AccountOption { id: string; name: string; type: string }
interface CategoryOption { id: string; name: string; type: string; icon: string | null; color: string | null }

interface TransactionsClientProps {
  initialData: FetchTransactionsResult
  accounts: AccountOption[]
  categories: CategoryOption[]
}

const DEFAULT_PAGE_SIZE = 10

export function TransactionsClient({ initialData, accounts, categories }: TransactionsClientProps) {
  // ── Pagination ──────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [search, setSearchRaw] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // ── Debounce search ──────────────────────────────────────────────────────────
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearchChange = useCallback((v: string) => {
    setSearchRaw(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(v)
      setPage(1)
    }, 350)
  }, [])

  // ── Table state ──────────────────────────────────────────────────────────────
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // ── Server data ──────────────────────────────────────────────────────────────
  const [result, setResult] = useState<FetchTransactionsResult>(initialData)
  const [isLoading, startTransition] = useTransition()

  const fetchData = useCallback(() => {
    const sortCol = sorting[0]
    startTransition(async () => {
      const data = await fetchTransactionsAction({
        page,
        pageSize,
        search: debouncedSearch,
        type: typeFilter as 'all' | 'income' | 'expense',
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy: sortCol?.id ?? 'date',
        sortOrder: sortCol?.desc === false ? 'asc' : 'desc',
      })
      setResult(data)
      setRowSelection({})
    })
  }, [page, pageSize, debouncedSearch, typeFilter, dateFrom, dateTo, sorting])

  // Re-fetch whenever dependencies change
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Reset page when filters change
  const handleTypeFilter = (v: string) => { setTypeFilter(v); setPage(1) }
  const handleDateFrom = (v: string) => { setDateFrom(v); setPage(1) }
  const handleDateTo = (v: string) => { setDateTo(v); setPage(1) }

  // ── Dialog state ─────────────────────────────────────────────────────────────
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null)

  // ── Table columns ─────────────────────────────────────────────────────────────
  const columns = useMemo(
    () => getColumns({
      onEdit: (tx) => setEditingTx(tx),
      onDelete: (tx) => setDeletingTx(tx),
    }),
    []
  )

  // Expose table instance to toolbar (we need to pass a shared ref or use composition)
  // Solution: pass table props down, let TransactionsTable own the useReactTable instance
  // and expose it via render-prop or forward ref. Simpler: pass table state to toolbar directly.

  // Summary stats (from current page + totalCount from server)
  const incomeTotal = result.data
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Math.abs(t.amount), 0)
  const expenseTotal = result.data
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Math.abs(t.amount), 0)

  const formatVND = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(n)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ReceiptText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản lý Giao dịch</h1>
            <p className="text-sm text-muted-foreground">
              {result.totalCount} giao dịch trong kho dữ liệu
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex gap-4 text-sm">
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Thu (trang này)</p>
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">{formatVND(incomeTotal)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Chi (trang này)</p>
            <p className="font-semibold text-rose-600 dark:text-rose-400">{formatVND(expenseTotal)}</p>
          </div>
        </div>
      </div>

      {/* Inner table with toolbar */}
      <TransactionsTableWithToolbar
        data={result.data}
        columns={columns}
        totalCount={result.totalCount}
        totalPages={result.totalPages}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
        sorting={sorting}
        onSortingChange={(s) => { setSorting(s); setPage(1) }}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        isLoading={isLoading}
        search={search}
        onSearchChange={handleSearchChange}
        typeFilter={typeFilter}
        onTypeFilterChange={handleTypeFilter}
        dateFrom={dateFrom}
        onDateFromChange={handleDateFrom}
        dateTo={dateTo}
        onDateToChange={handleDateTo}
        onCreateNew={() => setIsCreateOpen(true)}
        onRefresh={fetchData}
      />

      {/* Dialogs */}
      <TransactionDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        accounts={accounts}
        categories={categories}
        onSuccess={fetchData}
      />
      <TransactionDialog
        open={!!editingTx}
        onOpenChange={(open) => !open && setEditingTx(null)}
        transaction={editingTx}
        accounts={accounts}
        categories={categories}
        onSuccess={fetchData}
      />
      <DeleteTransactionDialog
        open={!!deletingTx}
        onOpenChange={(open) => !open && setDeletingTx(null)}
        transaction={deletingTx}
        onSuccess={fetchData}
      />
    </div>
  )
}

// ─── Composite: table + toolbar share table state ────────────────────────────

function TransactionsTableWithToolbar({
  data,
  columns,
  totalCount,
  totalPages,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sorting,
  onSortingChange,
  columnVisibility,
  onColumnVisibilityChange,
  rowSelection,
  onRowSelectionChange,
  isLoading,
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
}: {
  data: Transaction[]
  columns: ColumnDef<Transaction>[]
  totalCount: number
  totalPages: number
  page: number
  pageSize: number
  onPageChange: (p: number) => void
  onPageSizeChange: (s: number) => void
  sorting: SortingState
  onSortingChange: (s: SortingState) => void
  columnVisibility: VisibilityState
  onColumnVisibilityChange: (v: VisibilityState) => void
  rowSelection: RowSelectionState
  onRowSelectionChange: (s: RowSelectionState) => void
  isLoading: boolean
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
}) {
  const resolveUpdater = <T,>(updaterOrValue: Updater<T>, prev: T): T =>
    typeof updaterOrValue === 'function'
      ? (updaterOrValue as (old: T) => T)(prev)
      : updaterOrValue

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, rowSelection },
    onSortingChange: (u) => onSortingChange(resolveUpdater(u, sorting)),
    onColumnVisibilityChange: (u) => onColumnVisibilityChange(resolveUpdater(u, columnVisibility)),
    onRowSelectionChange: (u) => onRowSelectionChange(resolveUpdater(u, rowSelection)),
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    manualFiltering: true,
    pageCount: totalPages,
    getRowId: (row) => row.id,
  })

  return (
    <div className="space-y-4">
      <TransactionsToolbar
        table={table}
        search={search}
        onSearchChange={onSearchChange}
        typeFilter={typeFilter}
        onTypeFilterChange={onTypeFilterChange}
        dateFrom={dateFrom}
        onDateFromChange={onDateFromChange}
        dateTo={dateTo}
        onDateToChange={onDateToChange}
        onCreateNew={onCreateNew}
        onRefresh={onRefresh}
      />
      <TransactionsTable
        data={data}
        columns={columns}
        totalCount={totalCount}
        totalPages={totalPages}
        page={page}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        sorting={sorting}
        onSortingChange={onSortingChange}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={onColumnVisibilityChange}
        rowSelection={rowSelection}
        onRowSelectionChange={onRowSelectionChange}
        isLoading={isLoading}
        table={table}
      />
    </div>
  )
}
