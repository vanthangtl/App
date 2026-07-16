'use client'

import { useState, useTransition, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createTransactionAction,
  updateTransactionAction,
  deleteTransactionAction,
  type Transaction,
} from '../actions'

interface AccountOption {
  id: string
  name: string
  type: string
}

interface CategoryOption {
  id: string
  name: string
  type: string
  icon: string | null
  color: string | null
}

// ─── Create / Edit Dialog ─────────────────────────────────────────────────────

interface TransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: Transaction | null
  accounts: AccountOption[]
  categories: CategoryOption[]
  onSuccess: () => void
}

export function TransactionDialog({
  open,
  onOpenChange,
  transaction,
  accounts,
  categories,
  onSuccess,
}: TransactionDialogProps) {
  const isEditing = !!transaction
  const [isPending, startTransition] = useTransition()

  const [form, setForm] = useState({
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: '',
    source: '',
    amount: '',
  })

  // Populate form when editing
  useEffect(() => {
    if (transaction) {
      setForm({
        type: transaction.type,
        date: transaction.date,
        description: transaction.description,
        category: transaction.category,
        source: transaction.source,
        amount: String(Math.abs(transaction.amount)),
      })
    } else {
      setForm({
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: '',
        source: '',
        amount: '',
      })
    }
  }, [transaction, open])

  const filteredCategories = categories.filter(
    (c) => c.type === form.type || c.type === 'both'
  )

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    startTransition(async () => {
      const payload = {
        date: form.date,
        description: form.description,
        category: form.category,
        source: form.source,
        amount,
        type: form.type,
      }

      const result = isEditing
        ? await updateTransactionAction(transaction!.id, payload)
        : await createTransactionAction(payload)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(isEditing ? 'Đã cập nhật giao dịch.' : 'Đã tạo giao dịch mới.')
        onOpenChange(false)
        onSuccess()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Chỉnh sửa giao dịch' : 'Tạo giao dịch mới'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Cập nhật thông tin giao dịch.' : 'Điền thông tin để tạo giao dịch mới.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Type toggle */}
          <div className="space-y-1.5">
            <Label>Loại giao dịch</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['income', 'expense'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('type')(t)}
                  className={`rounded-lg border py-2.5 text-sm font-medium transition-all ${
                    form.type === t
                      ? t === 'income'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-400'
                      : 'border-border bg-transparent text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  {t === 'income' ? '↑ Thu nhập' : '↓ Chi tiêu'}
                </button>
              ))}
            </div>
          </div>

          {/* Date + Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tx-date">Ngày giao dịch</Label>
              <Input
                id="tx-date"
                type="date"
                value={form.date}
                onChange={(e) => set('date')(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tx-amount">Số tiền (VND)</Label>
              <Input
                id="tx-amount"
                type="number"
                min="0"
                step="1000"
                placeholder="0"
                value={form.amount}
                onChange={(e) => set('amount')(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="tx-desc">Nội dung</Label>
            <Input
              id="tx-desc"
              placeholder="Mô tả giao dịch…"
              value={form.description}
              onChange={(e) => set('description')(e.target.value)}
              required
            />
          </div>

          {/* Category + Source */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Danh mục</Label>
              <Select value={form.category} onValueChange={set('category')} required>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      Không có danh mục
                    </SelectItem>
                  ) : (
                    filteredCategories.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.icon ? `${c.icon} ` : ''}{c.name}
                      </SelectItem>
                    ))
                  )}
                  {/* Fallback: manual input handled by allowing free text below */}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Nguồn tiền</Label>
              <Select value={form.source} onValueChange={set('source')} required>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tài khoản" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      Không có tài khoản
                    </SelectItem>
                  ) : (
                    accounts.map((a) => (
                      <SelectItem key={a.id} value={a.name}>
                        {a.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Đang lưu…' : isEditing ? 'Cập nhật' : 'Tạo giao dịch'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

interface DeleteTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction | null
  onSuccess: () => void
}

export function DeleteTransactionDialog({
  open,
  onOpenChange,
  transaction,
  onSuccess,
}: DeleteTransactionDialogProps) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!transaction) return
    startTransition(async () => {
      const result = await deleteTransactionAction(transaction.id)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Đã xóa giao dịch.')
        onOpenChange(false)
        onSuccess()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Xóa giao dịch?</DialogTitle>
          <DialogDescription>
            Hành động này không thể hoàn tác. Giao dịch{' '}
            <span className="font-medium text-foreground">
              "{transaction?.description}"
            </span>{' '}
            sẽ bị xóa vĩnh viễn.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? 'Đang xóa…' : 'Xóa giao dịch'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
