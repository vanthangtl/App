"use client";

import React, { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Transaction,
  CategoryOption,
  AccountOption,
  formatDate,
  formatAmount,
} from "./transactions-client";
import {
  createTransactionAction,
  updateTransactionAction,
  deleteTransactionAction,
} from "../actions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().split("T")[0];

/** Format raw digits as "1.000.000" (dot-separated thousands) */
const formatThousands = (raw: string) => {
  const cleaned = raw.replace(/\D/g, "");
  return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

/** Strip dots to get the raw numeric string */
const stripDots = (formatted: string) => formatted.replace(/\./g, "");

// ─── Shared form field styles ─────────────────────────────────────────────────

const inputCls =
  "col-span-3 h-9 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500";

const labelCls =
  "text-right text-xs font-semibold text-zinc-600 dark:text-zinc-400";

// ─── Shared Form Body ─────────────────────────────────────────────────────────

interface FormBodyProps {
  prefix: string;
  formDate: string;
  formDesc: string;
  formCategory: string;
  formSource: string;
  formAmountDisplay: string; // formatted "1.000.000"
  formIsNegative: boolean;
  formError: string;
  categories: CategoryOption[];
  accounts: AccountOption[];
  onDateChange: (v: string) => void;
  onDescChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onSourceChange: (v: string) => void;
  onAmountInput: (v: string) => void;
  onSignToggle: () => void;
}

function FormBody({
  prefix,
  formDate,
  formDesc,
  formCategory,
  formSource,
  formAmountDisplay,
  formIsNegative,
  formError,
  categories,
  accounts,
  onDateChange,
  onDescChange,
  onCategoryChange,
  onSourceChange,
  onAmountInput,
  onSignToggle,
}: FormBodyProps) {
  return (
    <div className="grid gap-4 py-4">
      {formError && (
        <div className="text-xs text-red-500 font-medium bg-red-50 dark:bg-red-950/20 p-2.5 rounded border border-red-200 dark:border-red-900/30">
          {formError}
        </div>
      )}

      {/* Ngày */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${prefix}-date`} className={labelCls}>Ngày</Label>
        <Input
          id={`${prefix}-date`}
          type="date"
          value={formDate}
          onChange={(e) => onDateChange(e.target.value)}
          className={inputCls}
          required
        />
      </div>

      {/* Nội dung */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${prefix}-description`} className={labelCls}>Nội dung</Label>
        <Input
          id={`${prefix}-description`}
          placeholder="Ví dụ: Ăn trưa văn phòng"
          value={formDesc}
          onChange={(e) => onDescChange(e.target.value)}
          className={inputCls}
          required
        />
      </div>

      {/* Danh mục */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${prefix}-category`} className={labelCls}>Danh mục</Label>
        <div className="col-span-3">
          <Select value={formCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-full h-9 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
              <SelectValue placeholder="Chọn danh mục" />
            </SelectTrigger>
            <SelectContent>
              {categories.length === 0 ? (
                <SelectItem value="__empty__" disabled>
                  Chưa có danh mục nào
                </SelectItem>
              ) : (
                categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Nguồn tiền */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${prefix}-source`} className={labelCls}>Nguồn tiền</Label>
        <div className="col-span-3">
          <Select value={formSource} onValueChange={onSourceChange}>
            <SelectTrigger className="w-full h-9 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
              <SelectValue placeholder="Chọn nguồn tiền" />
            </SelectTrigger>
            <SelectContent>
              {accounts.length === 0 ? (
                <SelectItem value="__empty__" disabled>
                  Chưa có tài khoản nào
                </SelectItem>
              ) : (
                accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.name}>
                    {acc.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Số tiền */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${prefix}-amount`} className={labelCls}>Số tiền (đ)</Label>
        <div className="col-span-3 flex gap-2">
          {/* Chi / Thu toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSignToggle}
            className={cn(
              "h-9 min-w-[52px] font-bold border",
              formIsNegative
                ? "text-red-600 border-red-300 dark:text-red-400 dark:border-red-700 bg-red-50 dark:bg-red-950/20"
                : "text-green-600 border-green-300 dark:text-green-400 dark:border-green-700 bg-green-50 dark:bg-green-950/20"
            )}
          >
            {formIsNegative ? "Chi" : "Thu"}
          </Button>
          <Input
            id={`${prefix}-amount`}
            inputMode="numeric"
            placeholder="500.000"
            value={formAmountDisplay}
            onChange={(e) => onAmountInput(e.target.value)}
            className={cn(inputCls, "col-span-1 flex-1")}
            required
          />
        </div>
      </div>
    </div>
  );
}

// ─── Add Dialog ────────────────────────────────────────────────────────────────

interface AddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryOption[];
  accounts: AccountOption[];
}

export function AddTransactionDialog({
  open,
  onOpenChange,
  categories,
  accounts,
}: AddDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [formDate, setFormDate] = useState(today());
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState(categories[0]?.name ?? "");
  const [formSource, setFormSource] = useState(accounts[0]?.name ?? "");
  const [formAmountDisplay, setFormAmountDisplay] = useState(""); // "1.000.000"
  const [formIsNegative, setFormIsNegative] = useState(true);
  const [formError, setFormError] = useState("");

  const resetForm = () => {
    setFormDate(today());
    setFormDesc("");
    setFormCategory(categories[0]?.name ?? "");
    setFormSource(accounts[0]?.name ?? "");
    setFormAmountDisplay("");
    setFormIsNegative(true);
    setFormError("");
  };

  const handleAmountInput = (raw: string) => {
    setFormAmountDisplay(formatThousands(raw));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const rawAmount = stripDots(formAmountDisplay);
    if (!rawAmount) {
      setFormError("Vui lòng nhập số tiền.");
      return;
    }

    const numericAmount = formIsNegative ? -Number(rawAmount) : Number(rawAmount);

    startTransition(async () => {
      const result = await createTransactionAction({
        date: formDate,
        description: formDesc,
        category: formCategory,
        source: formSource,
        amount: numericAmount.toString(),
      });

      if (result?.error) {
        setFormError(result.error);
      } else {
        resetForm();
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-[440px] bg-white dark:bg-zinc-950">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-zinc-900 dark:text-zinc-50">Thêm giao dịch mới</DialogTitle>
            <DialogDescription>Nhập thông tin giao dịch bên dưới và click "Thêm giao dịch" để lưu.</DialogDescription>
          </DialogHeader>

          <FormBody
            prefix="add"
            formDate={formDate}
            formDesc={formDesc}
            formCategory={formCategory}
            formSource={formSource}
            formAmountDisplay={formAmountDisplay}
            formIsNegative={formIsNegative}
            formError={formError}
            categories={categories}
            accounts={accounts}
            onDateChange={setFormDate}
            onDescChange={setFormDesc}
            onCategoryChange={setFormCategory}
            onSourceChange={setFormSource}
            onAmountInput={handleAmountInput}
            onSignToggle={() => setFormIsNegative((p) => !p)}
          />

          <DialogFooter className="pt-4 border-t border-zinc-100 dark:border-zinc-800 -mx-4 -mb-4 px-4 bg-zinc-50/50 dark:bg-zinc-900/30 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Hủy bỏ</Button>
            <Button type="submit" size="sm" disabled={isPending} className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
              {isPending ? "Đang lưu..." : "Thêm giao dịch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Dialog ───────────────────────────────────────────────────────────────

interface EditDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryOption[];
  accounts: AccountOption[];
}

export function EditTransactionDialog({
  transaction,
  open,
  onOpenChange,
  categories,
  accounts,
}: EditDialogProps) {
  const [isPending, startTransition] = useTransition();

  const absAmount = transaction ? Math.abs(transaction.amount) : 0;
  const [formDate, setFormDate] = useState(transaction?.date ?? today());
  const [formDesc, setFormDesc] = useState(transaction?.description ?? "");
  const [formCategory, setFormCategory] = useState(transaction?.category ?? "");
  const [formSource, setFormSource] = useState(transaction?.source ?? "");
  const [formAmountDisplay, setFormAmountDisplay] = useState(
    absAmount ? formatThousands(absAmount.toString()) : ""
  );
  const [formIsNegative, setFormIsNegative] = useState((transaction?.amount ?? 0) < 0);
  const [formError, setFormError] = useState("");

  // Sync when transaction changes
  React.useEffect(() => {
    if (transaction) {
      setFormDate(transaction.date);
      setFormDesc(transaction.description);
      setFormCategory(transaction.category);
      setFormSource(transaction.source);
      const abs = Math.abs(transaction.amount);
      setFormAmountDisplay(formatThousands(abs.toString()));
      setFormIsNegative(transaction.amount < 0);
      setFormError("");
    }
  }, [transaction]);

  const handleAmountInput = (raw: string) => {
    setFormAmountDisplay(formatThousands(raw));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;
    setFormError("");

    const rawAmount = stripDots(formAmountDisplay);
    if (!rawAmount) {
      setFormError("Vui lòng nhập số tiền.");
      return;
    }

    const numericAmount = formIsNegative ? -Number(rawAmount) : Number(rawAmount);

    startTransition(async () => {
      const result = await updateTransactionAction(transaction.id, {
        date: formDate,
        description: formDesc,
        category: formCategory,
        source: formSource,
        amount: numericAmount.toString(),
      });

      if (result?.error) {
        setFormError(result.error);
      } else {
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-white dark:bg-zinc-950">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-zinc-900 dark:text-zinc-50">Chỉnh sửa giao dịch</DialogTitle>
            <DialogDescription>Thay đổi thông tin và click "Cập nhật" để lưu lại.</DialogDescription>
          </DialogHeader>

          <FormBody
            prefix="edit"
            formDate={formDate}
            formDesc={formDesc}
            formCategory={formCategory}
            formSource={formSource}
            formAmountDisplay={formAmountDisplay}
            formIsNegative={formIsNegative}
            formError={formError}
            categories={categories}
            accounts={accounts}
            onDateChange={setFormDate}
            onDescChange={setFormDesc}
            onCategoryChange={setFormCategory}
            onSourceChange={setFormSource}
            onAmountInput={handleAmountInput}
            onSignToggle={() => setFormIsNegative((p) => !p)}
          />

          <DialogFooter className="pt-4 border-t border-zinc-100 dark:border-zinc-800 -mx-4 -mb-4 px-4 bg-zinc-50/50 dark:bg-zinc-900/30 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Hủy bỏ</Button>
            <Button type="submit" size="sm" disabled={isPending} className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
              {isPending ? "Đang lưu..." : "Cập nhật"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Detail Dialog ─────────────────────────────────────────────────────────────

interface DetailDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DetailTransactionDialog({ transaction, open, onOpenChange }: DetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-zinc-50">Chi tiết giao dịch</DialogTitle>
          <DialogDescription>Xem chi tiết toàn bộ thông tin của mã giao dịch này.</DialogDescription>
        </DialogHeader>

        {transaction && (
          <div className="grid gap-3 py-4 text-sm">
            {[
              { label: "Mã ID đầy đủ", value: transaction.id, mono: true },
              { label: "Ngày", value: formatDate(transaction.date) },
              { label: "Nội dung", value: transaction.description },
              { label: "Danh mục", value: transaction.category },
              { label: "Nguồn tiền", value: transaction.source },
            ].map(({ label, value, mono }) => (
              <div key={label} className="grid grid-cols-3 border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
                <span className="text-zinc-500 font-medium">{label}:</span>
                <span className={cn("col-span-2 text-zinc-900 dark:text-zinc-100 font-semibold", mono && "font-mono text-xs break-all select-all")}>{value}</span>
              </div>
            ))}
            <div className="grid grid-cols-3 pb-1">
              <span className="text-zinc-500 font-medium">Số tiền:</span>
              <span className={cn("col-span-2 font-bold text-base", transaction.amount < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400")}>
                {formatAmount(transaction.amount)}
              </span>
            </div>
          </div>
        )}

        <DialogFooter className="pt-4 border-t border-zinc-100 dark:border-zinc-800 -mx-4 -mb-4 px-4 bg-zinc-50/50 dark:bg-zinc-900/30 flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Đóng chi tiết</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Dialog ─────────────────────────────────────────────────────────────

interface DeleteDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteTransactionDialog({ transaction, open, onOpenChange }: DeleteDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (!transaction) return;
    setError("");
    startTransition(async () => {
      const result = await deleteTransactionAction(transaction.id);
      if (result?.error) {
        setError(result.error);
      } else {
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="text-red-600 dark:text-red-400">Xác nhận xóa giao dịch</DialogTitle>
          <DialogDescription>Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa giao dịch này không?</DialogDescription>
        </DialogHeader>

        {transaction && (
          <div className="py-2 text-sm text-zinc-700 dark:text-zinc-300 space-y-1">
            <p>Nội dung: <span className="font-semibold text-zinc-900 dark:text-zinc-50">{transaction.description}</span></p>
            <p>Danh mục: <span className="font-semibold text-zinc-900 dark:text-zinc-50">{transaction.category}</span></p>
            <p>Nguồn tiền: <span className="font-semibold text-zinc-900 dark:text-zinc-50">{transaction.source}</span></p>
            <p>Số tiền: <span className="font-bold text-zinc-900 dark:text-zinc-50">{formatAmount(transaction.amount)}</span></p>
          </div>
        )}

        {error && (
          <div className="text-xs text-red-500 font-medium bg-red-50 dark:bg-red-950/20 p-2.5 rounded border border-red-200 dark:border-red-900/30">
            {error}
          </div>
        )}

        <DialogFooter className="pt-4 border-t border-zinc-100 dark:border-zinc-800 -mx-4 -mb-4 px-4 bg-zinc-50/50 dark:bg-zinc-900/30 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Hủy bỏ</Button>
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800"
            onClick={handleConfirm}
          >
            {isPending ? "Đang xóa..." : "Xóa bỏ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
