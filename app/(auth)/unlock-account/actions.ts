'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAccountLockStatusByEmail } from '@/lib/account-lock'

export async function requestUnlockAction(formData: FormData) {
  const email = (formData.get('email') as string)?.toLowerCase().trim()

  if (!email) {
    return { error: 'Vui lòng nhập địa chỉ email.' }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Địa chỉ email không hợp lệ.' }
  }

  // -----------------------------------------------------------------------
  // Tìm user theo email (admin API)
  // -----------------------------------------------------------------------
  const admin = createAdminClient()
  const { data: listData, error: listError } = await admin.auth.admin.listUsers()

  if (listError) {
    console.error('[requestUnlock] listUsers error:', listError)
    return { success: true } // Tránh lộ thông tin hệ thống
  }

  const user = listData.users.find((u) => u.email?.toLowerCase() === email)

  // Phòng Email Enumeration: Luôn trả về thành công dù email có tồn tại hay không
  if (!user) {
    return { success: true }
  }

  // Kiểm tra tài khoản có đang bị khóa không
  const lockStatus = await getAccountLockStatusByEmail(email)
  if (!lockStatus?.isLocked) {
    // Tài khoản không bị khóa — vẫn trả về success để tránh enumeration
    return { success: true }
  }

  // -----------------------------------------------------------------------
  // Gửi email reset mật khẩu qua Supabase Auth (built-in email service)
  // Supabase sẽ gửi email với link dẫn đến NEXT_PUBLIC_APP_URL/reset-password
  // -----------------------------------------------------------------------
  try {
    const supabase = await createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    })

    if (resetError) {
      console.error('[requestUnlock] resetPasswordForEmail error:', resetError)
      return { error: 'Không thể gửi email. Vui lòng thử lại sau ít phút.' }
    }
  } catch (err) {
    console.error('[requestUnlock] error:', err)
    return { error: 'Không thể gửi email. Vui lòng thử lại sau ít phút.' }
  }

  return { success: true }
}
