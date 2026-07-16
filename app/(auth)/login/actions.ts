'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { checkIpRateLimit, recordIpFailedAttempt, clearIpRateLimit } from '@/lib/rate-limit'
import {
  incrementFailedAttempts,
  clearFailedAttempts,
} from '@/lib/account-lock'
import { parseUserAgent } from '@/lib/user-agent'

const SESSION_COOKIE = 'app_session_token'

/**
 * Lấy IP thực của request từ các header phổ biến.
 */
async function getClientIp(): Promise<string> {
  const headerStore = await headers()
  const forwarded = headerStore.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return headerStore.get('x-real-ip') ?? '127.0.0.1'
}

/**
 * Tìm userId theo email qua admin API — dùng server-side filter thay vì
 * listUsers() để tránh tải toàn bộ danh sách user.
 */
async function findUserIdByEmail(email: string): Promise<string | null> {
  const admin = createAdminClient()
  // listUsers với filter server-side — chỉ trả về user khớp email
  const { data, error } = await admin.auth.admin.listUsers({ filter: `email.eq.${email.toLowerCase().trim()}` } as Parameters<typeof admin.auth.admin.listUsers>[0])
  if (error || !data.users.length) return null
  return data.users[0].id
}

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Vui lòng nhập đầy đủ email và mật khẩu.' }
  }

  const ip = await getClientIp()

  // -----------------------------------------------------------------------
  // 1. Kiểm tra IP rate limit (Redis) — chống brute-force đổi email liên tục
  // -----------------------------------------------------------------------
  const ipStatus = await checkIpRateLimit(ip)
  if (ipStatus.blocked) {
    const minutes = Math.ceil(ipStatus.retryAfterSeconds / 60)
    return {
      error: `Quá nhiều lần thử từ địa chỉ mạng này. Vui lòng thử lại sau ${minutes} phút.`,
    }
  }

  // -----------------------------------------------------------------------
  // 2. Kiểm tra trạng thái khóa tài khoản (PostgreSQL)
  //    Tìm userId trước để dùng xuyên suốt flow
  // -----------------------------------------------------------------------
  const userId = await findUserIdByEmail(email)

  if (userId) {
    const { getAccountLockStatusByUserId } = await import('@/lib/account-lock')
    const lockStatus = await getAccountLockStatusByUserId(userId)
    if (lockStatus.isLocked) {
      return {
        error: 'Tài khoản đã bị khóa do quá nhiều lần đăng nhập sai.',
        accountLocked: true,
      }
    }
  }

  // -----------------------------------------------------------------------
  // 3. Xác thực với Supabase Auth
  // -----------------------------------------------------------------------
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    // Ghi nhận thất bại IP (luôn luôn)
    await recordIpFailedAttempt(ip)

    // Ghi nhận thất bại tài khoản (chỉ khi email tồn tại trong hệ thống)
    if (userId) {
      const afterFail = await incrementFailedAttempts(userId)

      if (afterFail.isLocked) {
        return {
          error: 'Tài khoản đã bị khóa do nhập sai mật khẩu quá 3 lần. Vui lòng mở khóa qua email.',
          accountLocked: true,
        }
      }

      const suffix =
        afterFail.remaining > 0
          ? ` (còn ${afterFail.remaining} lần trước khi tài khoản bị khóa)`
          : ''
      return { error: `Email hoặc mật khẩu không đúng.${suffix}` }
    }

    return { error: 'Email hoặc mật khẩu không đúng.' }
  }

  // -----------------------------------------------------------------------
  // 4. Đăng nhập thành công → xóa counters
  // -----------------------------------------------------------------------
  await Promise.all([
    clearIpRateLimit(ip),
    clearFailedAttempts(data.user.id),
  ])

  const admin = createAdminClient()

  // Multi-device: KHÔNG xóa session cũ — mỗi thiết bị có session riêng
  // Lấy metadata từ request
  const headerStore = await headers()
  const rawUserAgent = headerStore.get('user-agent') ?? ''
  const { deviceName, browser, os } = parseUserAgent(rawUserAgent)

  // Tạo và lưu session token mới kèm metadata thiết bị
  const sessionToken = crypto.randomUUID()

  // Thử insert với đầy đủ metadata trước
  let { error: insertError } = await admin
    .from('user_sessions')
    .insert({
      user_id: data.user.id,
      session_token: sessionToken,
      device_name: deviceName,
      browser,
      os,
      ip_address: ip,
      user_agent: rawUserAgent,
    })

  // Nếu lỗi do cột chưa tồn tại (migration chưa chạy) → fallback chỉ insert các cột bắt buộc
  if (insertError && (insertError.code === '42703' || insertError.message?.includes('column'))) {
    console.warn('[loginAction] Metadata columns missing, falling back to base insert. Run migration: add_session_metadata.sql')
    const fallback = await admin
      .from('user_sessions')
      .insert({ user_id: data.user.id, session_token: sessionToken })
    insertError = fallback.error
  }

  if (insertError) {
    console.error('[loginAction] Failed to create session:', insertError)
    return { error: 'Không thể tạo phiên đăng nhập. Vui lòng thử lại.' }
  }

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  redirect('/dashboard')
}

export async function signOutAction() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminClient()

  if (sessionToken) {
    // Chỉ xóa session hiện tại (multi-device: giữ các session khác)
    await admin.from('user_sessions').delete().eq('session_token', sessionToken)
  } else if (user) {
    // Fallback: không có token → xóa toàn bộ session của user
    await admin.from('user_sessions').delete().eq('user_id', user.id)
  }

  // Revoke Supabase session hiện tại
  if (user) {
    const accessToken = (await supabase.auth.getSession()).data.session?.access_token
    if (accessToken) {
      await admin.auth.admin.signOut(accessToken, 'local')
    }
  }

  cookieStore.delete(SESSION_COOKIE)
  await supabase.auth.signOut()
  redirect('/login')
}
