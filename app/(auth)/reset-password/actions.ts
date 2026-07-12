'use server'

import { createClient } from '@/lib/supabase/server'
import { unlockAccount } from '@/lib/account-lock'
import { redirect } from 'next/navigation'

export async function resetPasswordAction(formData: FormData) {
  const newPassword = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  // -----------------------------------------------------------------------
  // Validation đầu vào
  // -----------------------------------------------------------------------
  if (!newPassword || !confirmPassword) {
    return { error: 'Vui lòng nhập đầy đủ mật khẩu.' }
  }

  if (newPassword.length < 8) {
    return { error: 'Mật khẩu phải có ít nhất 8 ký tự.' }
  }

  if (newPassword !== confirmPassword) {
    return { error: 'Mật khẩu xác nhận không khớp.' }
  }

  // -----------------------------------------------------------------------
  // Xác minh session Supabase (user đã được xác thực qua magic link email)
  // -----------------------------------------------------------------------
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      error: 'Phiên xác thực đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu mở khóa lại.',
      sessionExpired: true,
    }
  }

  // -----------------------------------------------------------------------
  // Cập nhật mật khẩu qua Supabase Auth
  // -----------------------------------------------------------------------
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (updateError) {
    console.error('[resetPassword] updateUser error:', updateError)
    return { error: 'Không thể cập nhật mật khẩu. Vui lòng thử lại.' }
  }

  // -----------------------------------------------------------------------
  // Mở khóa tài khoản — reset failed_attempts, is_locked = false
  // -----------------------------------------------------------------------
  await unlockAccount(user.id)

  // Đăng xuất để user đăng nhập lại với mật khẩu mới (session reset)
  await supabase.auth.signOut()

  // Redirect về login với thông báo thành công
  redirect('/login?reason=password_reset')
}
