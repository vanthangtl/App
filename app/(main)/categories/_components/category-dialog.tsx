'use client'

import React, { useState, useEffect, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
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
import { Loader2 } from 'lucide-react'
import {
  Category,
  ExpenseGroup,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from '../actions'
import { EXPENSE_GROUPS } from './categories-client'

// ─── Shared error block ────────────────────────────────────────────────────────

function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="p-3 text-sm bg-destructive/15 text-destructive rounded-md border border-destructive/20">
      {message}
    </div>
  )
}

// ─── Add Expense Category Dialog ──────────────────────────────────────────────

interface AddExpenseCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddExpenseCategoryDialog({
  open,
  onOpenChange,
}: AddExpenseCategoryDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [group, setGroup] = useState<ExpenseGroup | ''>('')

  useEffect(() => {
    if (open) {
      setName('')
      setGroup('')
      setError(null)
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Tên danh mục không được để trống.')
      return
    }
    if (!group) {
      setError('Vui lòng chọn nhóm danh mục.')
      return
    }

    startTransition(async () => {
      const result = await createCategoryAction({
        name,
        type: 'expense',
        group: group as ExpenseGroup,
      })
      if (result?.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Thêm danh mục chi tiêu</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && <ErrorBlock message={error} />}

            {/* Tên danh mục */}
            <div className="grid gap-2">
              <Label htmlFor="expense-name" className="text-sm font-medium">
                Tên danh mục <span className="text-destructive">*</span>
              </Label>
              <Input
                id="expense-name"
                className="h-9"
                placeholder="Ví dụ: Ăn sáng, Taxi, Thuốc..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
                autoFocus
              />
            </div>

            {/* Thuộc nhóm */}
            <div className="grid gap-2">
              <Label htmlFor="expense-group" className="text-sm font-medium">
                Thuộc nhóm <span className="text-destructive">*</span>
              </Label>
              <Select
                value={group}
                onValueChange={(v) => setGroup(v as ExpenseGroup)}
                disabled={isPending}
              >
                <SelectTrigger id="expense-group" className="h-9">
                  <SelectValue placeholder="Chọn nhóm danh mục..." />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_GROUPS.map((g) => (
                    <SelectItem key={g.key} value={g.key}>
                      <span className="flex items-center gap-2">
                        <span>{g.emoji}</span>
                        <span>{g.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {group && (
                <p className="text-xs text-muted-foreground">
                  {EXPENSE_GROUPS.find((g) => g.key === group)?.description}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="w-full sm:w-auto h-10">
                Hủy
              </Button>
            </DialogClose>
            <Button type="submit" className="w-full sm:w-auto h-10" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Thêm mới
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Add Income Category Dialog ───────────────────────────────────────────────

interface AddIncomeCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddIncomeCategoryDialog({
  open,
  onOpenChange,
}: AddIncomeCategoryDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')

  useEffect(() => {
    if (open) {
      setName('')
      setError(null)
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Tên danh mục không được để trống.')
      return
    }

    startTransition(async () => {
      const result = await createCategoryAction({
        name,
        type: 'income',
        group: null,
      })
      if (result?.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Thêm danh mục thu nhập</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && <ErrorBlock message={error} />}

            {/* Tên danh mục */}
            <div className="grid gap-2">
              <Label htmlFor="income-name" className="text-sm font-medium">
                Tên danh mục <span className="text-destructive">*</span>
              </Label>
              <Input
                id="income-name"
                className="h-9"
                placeholder="Ví dụ: Lương tháng, Thưởng dự án..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="w-full sm:w-auto h-10">
                Hủy
              </Button>
            </DialogClose>
            <Button type="submit" className="w-full sm:w-auto h-10" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Thêm mới
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Update Category Dialog ───────────────────────────────────────────────────

interface UpdateCategoryDialogProps {
  category: Category
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UpdateCategoryDialog({
  category,
  open,
  onOpenChange,
}: UpdateCategoryDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [group, setGroup] = useState<ExpenseGroup | ''>('')

  // Populate form from category on open
  useEffect(() => {
    if (open && category) {
      setName(category.name)
      setGroup((category.group as ExpenseGroup) ?? '')
      setError(null)
    }
  }, [open, category])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Tên danh mục không được để trống.')
      return
    }
    if (category.type === 'expense' && !group) {
      setError('Vui lòng chọn nhóm danh mục.')
      return
    }

    startTransition(async () => {
      const result = await updateCategoryAction(category.id, {
        name,
        type: category.type,
        group: category.type === 'expense' ? (group as ExpenseGroup) : null,
      })
      if (result?.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Cập nhật danh mục</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && <ErrorBlock message={error} />}

            {/* Tên danh mục */}
            <div className="grid gap-2">
              <Label htmlFor="update-name" className="text-sm font-medium">
                Tên danh mục <span className="text-destructive">*</span>
              </Label>
              <Input
                id="update-name"
                className="h-9"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
              />
            </div>

            {/* Thuộc nhóm (only for expense) */}
            {category.type === 'expense' && (
              <div className="grid gap-2">
                <Label htmlFor="update-group" className="text-sm font-medium">
                  Thuộc nhóm <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={group}
                  onValueChange={(v) => setGroup(v as ExpenseGroup)}
                  disabled={isPending}
                >
                  <SelectTrigger id="update-group" className="h-9">
                    <SelectValue placeholder="Chọn nhóm danh mục..." />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_GROUPS.map((g) => (
                      <SelectItem key={g.key} value={g.key}>
                        <span className="flex items-center gap-2">
                          <span>{g.emoji}</span>
                          <span>{g.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="w-full sm:w-auto h-10">
                Hủy
              </Button>
            </DialogClose>
            <Button type="submit" className="w-full sm:w-auto h-10" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Delete Category Dialog ───────────────────────────────────────────────────

interface DeleteCategoryDialogProps {
  category: Category
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteCategoryDialog({
  category,
  open,
  onOpenChange,
}: DeleteCategoryDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmName, setConfirmName] = useState('')

  useEffect(() => {
    if (open) {
      setError(null)
      setConfirmName('')
    }
  }, [open])

  const handleDelete = () => {
    setError(null)
    startTransition(async () => {
      const result = await deleteCategoryAction(category.id)
      if (result?.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Xóa danh mục</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {error && <ErrorBlock message={error} />}

          <p className="text-sm text-muted-foreground leading-relaxed">
            Bạn có chắc chắn muốn xóa danh mục{' '}
            <strong>{category.name}</strong> không? Hành động này không thể hoàn
            tác.
          </p>

          <div className="space-y-2">
            <Label htmlFor="confirm-delete-category" className="text-sm font-medium">
              Nhập tên danh mục{' '}
              <span className="text-destructive font-semibold">
                &quot;{category.name}&quot;
              </span>{' '}
              để xác nhận <span className="text-destructive">*</span>
            </Label>
            <Input
              id="confirm-delete-category"
              className="h-9"
              placeholder={category.name}
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              disabled={isPending}
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending || confirmName !== category.name}
            className="w-full sm:w-auto"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xóa danh mục
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
