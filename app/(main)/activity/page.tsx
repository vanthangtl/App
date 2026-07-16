import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Activity, Shield, Smartphone } from 'lucide-react'
import { SessionCard } from './session-card'
import { RevokeAllButton } from './revoke-all-button'

export const metadata = {
  title: 'Hoạt động & Thiết bị | Tài chính Cá nhân',
  description: 'Quản lý các phiên đăng nhập và thiết bị của bạn',
}

const SESSION_COOKIE = 'app_session_token'

export default async function ActivityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const currentToken = cookieStore.get(SESSION_COOKIE)?.value

  const admin = createAdminClient()

  // Lấy tất cả sessions của user, sắp xếp theo last_seen_at mới nhất
  const { data: sessions, error } = await admin
    .from('user_sessions')
    .select('id, device_name, browser, os, ip_address, created_at, last_seen_at, session_token')
    .eq('user_id', user.id)
    .order('last_seen_at', { ascending: false })

  if (error) {
    console.error('[activity] Error fetching sessions:', error)
  }

  const allSessions = (sessions ?? []).map((s) => ({
    ...s,
    isCurrent: s.session_token === currentToken,
  }))

  const currentSession = allSessions.find((s) => s.isCurrent)
  const otherSessions = allSessions.filter((s) => !s.isCurrent)
  const hasOtherSessions = otherSessions.length > 0

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Hoạt động & Thiết bị</h1>
            <p className="text-sm text-muted-foreground">
              Quản lý tất cả phiên đăng nhập đang hoạt động
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tổng phiên</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{allSessions.length}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Thiết bị khác</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{otherSessions.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 col-span-2 sm:col-span-1">
          <p className="text-xs font-medium text-emerald-400 uppercase tracking-wide">Trạng thái</p>
          <div className="mt-1 flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400" />
            <p className="text-sm font-semibold text-emerald-400">An toàn</p>
          </div>
        </div>
      </div>

      {/* Phiên hiện tại */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Phiên hiện tại
          </h2>
        </div>
        {currentSession ? (
          <SessionCard session={currentSession} />
        ) : (
          <p className="rounded-xl border border-dashed border-border/50 p-4 text-center text-sm text-muted-foreground">
            Không tìm thấy thông tin phiên hiện tại.
          </p>
        )}
      </section>

      {/* Các thiết bị khác */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Thiết bị khác ({otherSessions.length})
            </h2>
          </div>
          <RevokeAllButton hasOtherSessions={hasOtherSessions} />
        </div>

        {hasOtherSessions ? (
          <div className="space-y-3">
            {otherSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/50 p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Shield className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">Không có thiết bị nào khác</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tài khoản của bạn chỉ đang đăng nhập trên thiết bị này.
            </p>
          </div>
        )}
      </section>

      {/* Ghi chú bảo mật */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <p className="text-xs font-medium text-amber-400 uppercase tracking-wide mb-1">Lưu ý bảo mật</p>
        <p className="text-sm text-muted-foreground">
          Nếu bạn thấy một thiết bị không quen, hãy thu hồi phiên đó ngay lập tức và{' '}
          <a href="/forgot-password" className="text-primary underline-offset-4 hover:underline">
            đổi mật khẩu
          </a>{' '}
          để bảo vệ tài khoản.
        </p>
      </div>
    </div>
  )
}
