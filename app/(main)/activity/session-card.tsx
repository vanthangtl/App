'use client'

import { useState, useTransition } from 'react'
import { Monitor, Smartphone, Tablet, Globe, Clock, MapPin, LogOut, Shield, Wifi } from 'lucide-react'
import { revokeSessionAction } from './actions'
import { toast } from 'sonner'

interface Session {
  id: string
  device_name: string | null
  browser: string | null
  os: string | null
  ip_address: string | null
  created_at: string
  last_seen_at: string
  isCurrent: boolean
}

interface SessionCardProps {
  session: Session
}

function getDeviceIcon(os: string | null, deviceName: string | null) {
  const text = `${os ?? ''} ${deviceName ?? ''}`.toLowerCase()
  if (/iphone|android.*phone|mobile/.test(text)) {
    return <Smartphone className="h-5 w-5" />
  }
  if (/ipad|tablet/.test(text)) {
    return <Tablet className="h-5 w-5" />
  }
  return <Monitor className="h-5 w-5" />
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Vừa xong'
  if (diffMins < 60) return `${diffMins} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  if (diffDays < 7) return `${diffDays} ngày trước`
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function SessionCard({ session }: SessionCardProps) {
  const [isPending, startTransition] = useTransition()
  const [revoked, setRevoked] = useState(false)

  function handleRevoke() {
    startTransition(async () => {
      const result = await revokeSessionAction(session.id)
      if (result?.error) {
        toast.error(result.error)
      } else {
        setRevoked(true)
        toast.success('Đã đăng xuất thiết bị thành công.')
      }
    })
  }

  if (revoked) return null

  return (
    <div
      className={`relative rounded-2xl border p-5 transition-all duration-300 ${
        session.isCurrent
          ? 'border-emerald-500/40 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.08)]'
          : 'border-border/50 bg-card hover:border-border hover:bg-card/80'
      }`}
    >
      {/* Badge phiên hiện tại */}
      {session.isCurrent && (
        <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
          <Wifi className="h-3 w-3 animate-pulse" />
          Phiên này
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Icon thiết bị */}
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
            session.isCurrent
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-border/60 bg-muted text-muted-foreground'
          }`}
        >
          {getDeviceIcon(session.os, session.device_name)}
        </div>

        {/* Thông tin thiết bị */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">
            {session.device_name ?? 'Thiết bị không xác định'}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {[session.browser, session.os].filter(Boolean).join(' · ') || 'Không rõ trình duyệt'}
          </p>

          {/* Metadata */}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {session.ip_address && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Globe className="h-3.5 w-3.5 shrink-0" />
                {session.ip_address}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              Đăng nhập: {formatDateTime(session.created_at)}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              Hoạt động: {formatRelativeTime(session.last_seen_at)}
            </span>
          </div>
        </div>

        {/* Nút đăng xuất */}
        {!session.isCurrent && (
          <button
            onClick={handleRevoke}
            disabled={isPending}
            className="ml-2 flex shrink-0 items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition-all hover:bg-destructive/20 hover:border-destructive/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            {isPending ? 'Đang xử lý…' : 'Đăng xuất'}
          </button>
        )}
      </div>

      {/* Shield indicator cho phiên hiện tại */}
      {session.isCurrent && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
          <Shield className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          <span className="text-xs text-emerald-400">
            Đây là phiên đăng nhập hiện tại của bạn — không thể thu hồi từ đây.
          </span>
        </div>
      )}
    </div>
  )
}
