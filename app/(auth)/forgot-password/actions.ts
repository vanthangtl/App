'use server'

import { createClient } from '@/lib/supabase/server'

export async function forgotPasswordAction(formData: FormData) {
  const email = (formData.get('email') as string)?.toLowerCase().trim()

  if (!email) {
    return { error: 'Vui lòng nhập địa chỉ email.' }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Địa chỉ email không hợp lệ.' }
  }

  try {
    const supabase = await createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    })
  } catch (err) {
    console.error('[forgotPassword] error:', err)
    // Không lộ lỗi để tránh email enumeration
  }

  // Luôn trả về success — tránh lộ email nào tồn tại trong hệ thống
  return { success: true }
}
