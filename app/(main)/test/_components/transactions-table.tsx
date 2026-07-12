"use client";

import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Eye,
  Trash2,
  Edit2,
  MoreHorizontal,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Transaction, formatDate, formatAmount } from "./transactions-client";

type SortColumn = "date" | "description" | "category" | "source" | "amount";

interface TransactionsTableProps {
  paginatedData: Transaction[];
  allFilteredCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  pageNumbers: (number | string)[];
  startIndex: number;
  endIndex: number;
  sortColumn: SortColumn | null;
  sortDirection: "asc" | "desc";
  onSort: (column: SortColumn) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onView: (tx: Transaction) => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

export function TransactionsTable({
  paginatedData,
  allFilteredCount,
  currentPage,
  totalPages,
  pageSize,
  pageNumbers,
  startIndex,
  endIndex,
  sortColumn,
  sortDirection,
  onSort,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onDelete,
}: TransactionsTableProps) {
  const SortIcon = ({ col }: { col: SortColumn }) => (
    <ArrowUpDown
      className={cn(
        "h-3.5 w-3.5",
        sortColumn === col ? "text-zinc-900 dark:text-zinc-100" : "text-muted-foreground/60"
      )}
    />
  );

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950 shadow-xs">
        <Table>
          <TableHeader className="bg-zinc-50/75 dark:bg-zinc-900/50">
            <TableRow>
              <TableHead className="w-[120px] font-semibold text-zinc-700 dark:text-zinc-300">ID</TableHead>
              <TableHead
                className="font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none hover:text-zinc-950 dark:hover:text-zinc-50"
                onClick={() => onSort("date")}
              >
                <div className="flex items-center gap-1">Ngày <SortIcon col="date" /></div>
              </TableHead>
              <TableHead
                className="font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none hover:text-zinc-950 dark:hover:text-zinc-50"
                onClick={() => onSort("description")}
              >
                <div className="flex items-center gap-1">Nội dung <SortIcon col="description" /></div>
              </TableHead>
              <TableHead
                className="font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none hover:text-zinc-950 dark:hover:text-zinc-50"
                onClick={() => onSort("category")}
              >
                <div className="flex items-center gap-1">Danh mục <SortIcon col="category" /></div>
              </TableHead>
              <TableHead
                className="font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none hover:text-zinc-950 dark:hover:text-zinc-50"
                onClick={() => onSort("source")}
              >
                <div className="flex items-center gap-1">Nguồn tiền <SortIcon col="source" /></div>
              </TableHead>
              <TableHead
                className="font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none hover:text-zinc-950 dark:hover:text-zinc-50 text-right"
                onClick={() => onSort("amount")}
              >
                <div className="flex items-center justify-end gap-1">Số tiền <SortIcon col="amount" /></div>
              </TableHead>
              <TableHead className="w-[80px] text-right font-semibold text-zinc-700 dark:text-zinc-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Không tìm thấy giao dịch nào phù hợp.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                  <TableCell className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    {tx.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell className="text-zinc-700 dark:text-zinc-300">
                    {formatDate(tx.date)}
                  </TableCell>
                  <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                    {tx.description}
                  </TableCell>
                  <TableCell className="text-zinc-700 dark:text-zinc-300">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200/50 dark:border-zinc-800/30">
                      {tx.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-zinc-700 dark:text-zinc-300">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-800/30">
                      {tx.source}
                    </span>
                  </TableCell>
                  <TableCell className={cn("text-right font-semibold", tx.amount < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400")}>
                    {formatAmount(tx.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0 rounded-md">
                          <MoreHorizontal className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem className="gap-2" onClick={() => onView(tx)}>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onClick={() => onEdit(tx)}>
                          <Edit2 className="h-4 w-4 text-muted-foreground" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="gap-2 text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/20"
                          onClick={() => onDelete(tx)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        {/* Results counter */}
        <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
          Hiển thị {allFilteredCount === 0 ? 0 : startIndex}–{endIndex} / {allFilteredCount} kết quả
        </div>

        {/* Rows per page */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">Dòng/trang:</span>
          <Select value={pageSize.toString()} onValueChange={(val) => onPageSizeChange(Number(val))}>
            <SelectTrigger className="h-8 w-16 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-semibold rounded-lg text-sm px-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="min-w-[5rem]">
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Page buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="h-8 gap-1 text-zinc-600 dark:text-zinc-400 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            <ChevronLeft className="h-4 w-4" />
            Trước
          </Button>

          {pageNumbers.map((p, idx) => (
            <Button
              key={idx}
              variant={currentPage === p ? "outline" : "ghost"}
              size="sm"
              onClick={() => typeof p === "number" && onPageChange(p)}
              disabled={p === "..."}
              className={cn(
                "h-8 w-8 font-medium",
                currentPage === p
                  ? "bg-zinc-100/80 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              )}
            >
              {p}
            </Button>
          ))}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="h-8 gap-1 text-zinc-600 dark:text-zinc-400 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            Sau
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="h-8 gap-1 text-zinc-600 dark:text-zinc-400 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-900 font-semibold"
          >
            Cuối
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
