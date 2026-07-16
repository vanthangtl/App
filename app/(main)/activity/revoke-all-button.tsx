'use client'

import { useTransition } from 'react'
import { LogOut, AlertTriangle } from 'lucide-react'
import { revokeAllOtherSessionsAction } from './actions'
import { toast } from 'sonner'

interface RevokeAllButtonProps {
  hasOtherSessions: boolean
}

export function RevokeAllButton({ hasOtherSessions }: RevokeAllButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleRevokeAll() {
    if (!confirm('Bạn có chắc muốn đăng xuất khỏi tất cả thiết bị khác không?')) return

    startTransition(async () => {
      const result = await revokeAllOtherSessionsAction()
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Đã đăng xuất khỏi tất cả thiết bị khác.')
      }
    })
  }

  if (!hasOtherSessions) return null

  return (
    <button
      onClick={handleRevokeAll}
      disabled={isPending}
      className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive transition-all hover:bg-destructive/20 hover:border-destructive/60 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      {isPending ? 'Đang xử lý…' : 'Đăng xuất tất cả thiết bị khác'}
      <LogOut className="h-4 w-4 shrink-0" />
    </button>
  )
}
