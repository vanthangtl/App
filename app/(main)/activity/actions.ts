'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const SESSION_COOKIE = 'app_session_token'

/**
 * Thu hồi một session theo ID (không phải session hiện tại).
 */
export async function revokeSessionAction(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Chưa đăng nhập.' }

  const cookieStore = await cookies()
  const currentToken = cookieStore.get(SESSION_COOKIE)?.value

  const admin = createAdminClient()

  // Lấy session cần xóa để đảm bảo nó thuộc về user này
  const { data: session, error: fetchError } = await admin
    .from('user_sessions')
    .select('id, session_token')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchError || !session) {
    return { error: 'Không tìm thấy phiên đăng nhập.' }
  }

  // Không cho xóa session hiện tại từ trang này
  if (session.session_token === currentToken) {
    return { error: 'Không thể thu hồi phiên đăng nhập hiện tại từ đây. Dùng nút Đăng xuất.' }
  }

  const { error } = await admin
    .from('user_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) return { error: 'Không thể thu hồi phiên. Vui lòng thử lại.' }

  revalidatePath('/activity')
  return { success: true }
}

/**
 * Thu hồi tất cả session KHÁC session hiện tại.
 */
export async function revokeAllOtherSessionsAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Chưa đăng nhập.' }

  const cookieStore = await cookies()
  const currentToken = cookieStore.get(SESSION_COOKIE)?.value

  if (!currentToken) return { error: 'Không tìm thấy phiên hiện tại.' }

  const admin = createAdminClient()

  const { error } = await admin
    .from('user_sessions')
    .delete()
    .eq('user_id', user.id)
    .neq('session_token', currentToken)

  if (error) return { error: 'Không thể thu hồi các phiên khác.' }

  revalidatePath('/activity')
  return { success: true }
}
