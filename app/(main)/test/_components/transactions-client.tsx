"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Calendar,
  ChevronDown,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TransactionsTable } from "./transactions-table";
import {
  AddTransactionDialog,
  EditTransactionDialog,
  DetailTransactionDialog,
  DeleteTransactionDialog,
} from "./transaction-dialogs";

// ─── Types (exported for child components) ────────────────────────────────────

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD from DB
  description: string;
  category: string;
  source: string;
  amount: number;
}

export interface CategoryOption {
  id: string;
  name: string;
  type: string;
}

export interface AccountOption {
  id: string;
  name: string;
  type: string;
}

// ─── Formatting helpers (exported for dialogs & table) ────────────────────────

export function formatDate(dateStr: string): string {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${d.getFullYear()}`;
}

export function formatAmount(amount: number): string {
  const isNegative = amount < 0;
  const absVal = Math.abs(amount).toLocaleString("vi-VN");
  return `${isNegative ? "-" : ""}${absVal} ₫`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TransactionsClientProps {
  initialTransactions: Transaction[];
  categories: CategoryOption[];
  accounts: AccountOption[];
}

type SortColumn = "date" | "description" | "category" | "source" | "amount";

export function TransactionsClient({
  initialTransactions,
  categories,
  accounts,
}: TransactionsClientProps) {
  // ── Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<"7days" | "30days" | "90days" | "all">("all");

  // ── Sort states
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // ── Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ── Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [viewingTx, setViewingTx] = useState<Transaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

  // ── Unique category / source lists for filter dropdowns
  const categoryNames = useMemo(
    () => categories.map((c) => c.name),
    [categories]
  );
  const accountNames = useMemo(
    () => accounts.map((a) => a.name),
    [accounts]
  );

  // ── Filter & sort logic
  const filteredAndSortedData = useMemo(() => {
    let result = [...initialTransactions];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (tx) =>
          tx.description.toLowerCase().includes(term) ||
          tx.category.toLowerCase().includes(term) ||
          tx.source.toLowerCase().includes(term) ||
          tx.id.toLowerCase().includes(term)
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter((tx) => tx.category === categoryFilter);
    }

    if (sourceFilter !== "all") {
      result = result.filter((tx) => tx.source === sourceFilter);
    }

    if (dateFilter !== "all") {
      const days = dateFilter === "7days" ? 7 : dateFilter === "30days" ? 30 : 90;
      const today = new Date();
      const limitDate = new Date(today);
      limitDate.setDate(today.getDate() - days);
      result = result.filter((tx) => {
        const txDate = new Date(tx.date);
        return txDate >= limitDate && txDate <= today;
      });
    }

    if (sortColumn) {
      result.sort((a, b) => {
        if (sortColumn === "date") {
          return sortDirection === "asc"
            ? new Date(a.date).getTime() - new Date(b.date).getTime()
            : new Date(b.date).getTime() - new Date(a.date).getTime();
        } else if (sortColumn === "amount") {
          return sortDirection === "asc" ? a.amount - b.amount : b.amount - a.amount;
        } else {
          const valA = (a[sortColumn] || "") as string;
          const valB = (b[sortColumn] || "") as string;
          return sortDirection === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
      });
    }

    return result;
  }, [initialTransactions, searchTerm, categoryFilter, sourceFilter, dateFilter, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedData.length / pageSize));

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedData.slice(start, start + pageSize);
  }, [filteredAndSortedData, currentPage, pageSize]);

  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [filteredAndSortedData.length, totalPages, currentPage]);

  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, "...", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  }, [currentPage, totalPages]);

  const startIndex = filteredAndSortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, filteredAndSortedData.length);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") setSortDirection("desc");
      else setSortColumn(null);
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setSourceFilter("all");
    setDateFilter("all");
    setSortColumn(null);
    setCurrentPage(1);
  };

  const dateFilterLabel = {
    "7days": "7 ngày qua",
    "30days": "30 ngày qua",
    "90days": "90 ngày qua",
    all: "Tất cả",
  }[dateFilter];

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Giao dịch
        </h1>
        <p className="text-sm text-muted-foreground">
          Quản lý và theo dõi tất cả giao dịch thu chi của bạn.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-900/30 p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/40">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm giao dịch..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9 h-9 w-64 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-sm rounded-lg focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600"
            />
          </div>

          {/* Reset filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900">
                <Filter className="h-4 w-4 text-muted-foreground" />
                Bộ lọc
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/75" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Tuỳ chọn</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={resetFilters}>Mặc định lại bộ lọc</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Category filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900">
                <span className="text-muted-foreground mr-1">Danh mục:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{categoryFilter === "all" ? "Tất cả" : categoryFilter}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/75 ml-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44 max-h-60 overflow-y-auto">
              <DropdownMenuItem className={cn(categoryFilter === "all" && "bg-accent font-medium")} onClick={() => { setCategoryFilter("all"); setCurrentPage(1); }}>Tất cả</DropdownMenuItem>
              {categoryNames.map((cat) => (
                <DropdownMenuItem key={cat} className={cn(categoryFilter === cat && "bg-accent font-medium")} onClick={() => { setCategoryFilter(cat); setCurrentPage(1); }}>{cat}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Source filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900">
                <span className="text-muted-foreground mr-1">Nguồn tiền:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{sourceFilter === "all" ? "Tất cả" : sourceFilter}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/75 ml-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44 max-h-60 overflow-y-auto">
              <DropdownMenuItem className={cn(sourceFilter === "all" && "bg-accent font-medium")} onClick={() => { setSourceFilter("all"); setCurrentPage(1); }}>Tất cả</DropdownMenuItem>
              {accountNames.map((src) => (
                <DropdownMenuItem key={src} className={cn(sourceFilter === src && "bg-accent font-medium")} onClick={() => { setSourceFilter(src); setCurrentPage(1); }}>{src}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Date filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{dateFilterLabel}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/75" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {(["7days", "30days", "90days", "all"] as const).map((key) => (
                <DropdownMenuItem key={key} className={cn(dateFilter === key && "bg-accent font-medium")} onClick={() => { setDateFilter(key); setCurrentPage(1); }}>
                  {{ "7days": "7 ngày qua", "30days": "30 ngày qua", "90days": "90 ngày qua", all: "Tất cả" }[key]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Add button */}
        <Button
          onClick={() => setIsAddOpen(true)}
          className="h-9 gap-1.5 px-4 font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900"
        >
          <Plus className="h-4 w-4" />
          Thêm mới
        </Button>
      </div>

      {/* Table */}
      <TransactionsTable
        paginatedData={paginatedData}
        allFilteredCount={filteredAndSortedData.length}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        pageNumbers={pageNumbers}
        startIndex={startIndex}
        endIndex={endIndex}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
        onView={setViewingTx}
        onEdit={setEditingTx}
        onDelete={setDeletingTx}
      />

      {/* Dialogs */}
      <AddTransactionDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        categories={categories}
        accounts={accounts}
      />

      <EditTransactionDialog
        transaction={editingTx}
        open={!!editingTx}
        onOpenChange={(o) => { if (!o) setEditingTx(null); }}
        categories={categories}
        accounts={accounts}
      />

      <DetailTransactionDialog
        transaction={viewingTx}
        open={!!viewingTx}
        onOpenChange={(o) => { if (!o) setViewingTx(null); }}
      />

      <DeleteTransactionDialog
        transaction={deletingTx}
        open={!!deletingTx}
        onOpenChange={(o) => { if (!o) setDeletingTx(null); }}
      />
    </div>
  );
}
