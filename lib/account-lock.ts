import { createAdminClient } from '@/lib/supabase/admin'

// --------------------------------------------------------------------------
// Cấu hình
// --------------------------------------------------------------------------
const MAX_FAILED_ATTEMPTS = 3         // Số lần sai tối đa trước khi khóa
const UNLOCK_TOKEN_TTL_MINUTES = 5    // Thời hạn token mở khóa (phút)

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------
export interface LockStatus {
  exists: boolean       // Tài khoản có tồn tại trong account_lockouts không
  isLocked: boolean
  failedAttempts: number
  remaining: number     // Số lần còn lại trước khi bị khóa
}

export interface UnlockTokenResult {
  valid: boolean
  userId?: string
  reason?: 'not_found' | 'expired' | 'used'
}

// --------------------------------------------------------------------------
// getOrCreateLockRecord
// Lấy hoặc tạo mới record trong account_lockouts cho userId.
// --------------------------------------------------------------------------
async function getOrCreateLockRecord(userId: string) {
  const admin = createAdminClient()

  // Thử upsert để tạo record nếu chưa có
  const { error: upsertError } = await admin
    .from('account_lockouts')
    .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true })

  if (upsertError) {
    console.error('[account-lock] upsert error:', upsertError)
  }

  const { data } = await admin
    .from('account_lockouts')
    .select('*')
    .eq('user_id', userId)
    .single()

  return data
}

// --------------------------------------------------------------------------
// getAccountLockStatusByEmail
// Kiểm tra trạng thái khóa tài khoản dựa trên email (dùng ở login).
// Trả về null nếu email không tồn tại.
// --------------------------------------------------------------------------
export async function getAccountLockStatusByEmail(email: string): Promise<LockStatus | null> {
  const admin = createAdminClient()

  // Dùng server-side filter thay vì tải toàn bộ user list
  const { data: listData, error } = await admin.auth.admin.listUsers(
    { filter: `email.eq.${email.toLowerCase().trim()}` } as Parameters<typeof admin.auth.admin.listUsers>[0]
  )
  if (error || !listData.users.length) return null

  return getAccountLockStatusByUserId(listData.users[0].id)
}

// --------------------------------------------------------------------------
// getAccountLockStatusByUserId
// --------------------------------------------------------------------------
export async function getAccountLockStatusByUserId(userId: string): Promise<LockStatus> {
  const admin = createAdminClient()

  const { data } = await admin
    .from('account_lockouts')
    .select('failed_attempts, is_locked')
    .eq('user_id', userId)
    .maybeSingle()

  const failedAttempts = data?.failed_attempts ?? 0
  const isLocked = data?.is_locked ?? false

  return {
    exists: data !== null,
    isLocked,
    failedAttempts,
    remaining: Math.max(0, MAX_FAILED_ATTEMPTS - failedAttempts),
  }
}

// --------------------------------------------------------------------------
// incrementFailedAttempts
// Tăng counter. Nếu đạt MAX_FAILED_ATTEMPTS → khóa tài khoản.
// Trả về trạng thái mới sau khi tăng.
// --------------------------------------------------------------------------
export async function incrementFailedAttempts(userId: string): Promise<LockStatus> {
  const admin = createAdminClient()

  // 1. Upsert: nếu chưa có record thì tạo với failed_attempts=1,
  //    nếu đã có thì bỏ qua (ignoreDuplicates) để không reset counter
  await admin.from('account_lockouts').upsert(
    { user_id: userId, failed_attempts: 0, updated_at: new Date().toISOString() },
    { onConflict: 'user_id', ignoreDuplicates: true }
  )

  // 2. Lấy giá trị hiện tại và tăng +1 trong cùng 1 round-trip
  const { data: current } = await admin
    .from('account_lockouts')
    .select('failed_attempts')
    .eq('user_id', userId)
    .single()

  const newAttempts = (current?.failed_attempts ?? 0) + 1
  const shouldLock = newAttempts >= MAX_FAILED_ATTEMPTS

  await admin
    .from('account_lockouts')
    .update({
      failed_attempts: newAttempts,
      is_locked: shouldLock,
      locked_at: shouldLock ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  return {
    exists: true,
    isLocked: shouldLock,
    failedAttempts: newAttempts,
    remaining: Math.max(0, MAX_FAILED_ATTEMPTS - newAttempts),
  }
}

// --------------------------------------------------------------------------
// clearFailedAttempts
// Xóa counter sau khi đăng nhập thành công.
// --------------------------------------------------------------------------
export async function clearFailedAttempts(userId: string): Promise<void> {
  const admin = createAdminClient()
  await admin
    .from('account_lockouts')
    .upsert(
      {
        user_id: userId,
        failed_attempts: 0,
        is_locked: false,
        locked_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
}

// --------------------------------------------------------------------------
// createUnlockToken
// Tạo token ngẫu nhiên, lưu vào DB với TTL 5 phút.
// Trả về token để nhúng vào email.
// --------------------------------------------------------------------------
export async function createUnlockToken(userId: string): Promise<string> {
  const admin = createAdminClient()

  // Tạo token ngẫu nhiên (hex 32 bytes = 64 ký tự)
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32))
  const token = Array.from(tokenBytes).map((b) => b.toString(16).padStart(2, '0')).join('')

  const expiresAt = new Date(Date.now() + UNLOCK_TOKEN_TTL_MINUTES * 60 * 1000)

  const { error } = await admin
    .from('account_lockouts')
    .update({
      unlock_token: token,
      unlock_token_expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (error) {
    console.error('[account-lock] createUnlockToken error:', error)
    throw new Error('Không thể tạo token mở khóa.')
  }

  return token
}

// --------------------------------------------------------------------------
// validateUnlockToken
// Kiểm tra token hợp lệ và chưa hết hạn.
// --------------------------------------------------------------------------
export async function validateUnlockToken(token: string): Promise<UnlockTokenResult> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('account_lockouts')
    .select('user_id, unlock_token_expires_at')
    .eq('unlock_token', token)
    .maybeSingle()

  if (error || !data) {
    return { valid: false, reason: 'not_found' }
  }

  if (!data.unlock_token_expires_at) {
    return { valid: false, reason: 'used' }
  }

  const now = new Date()
  const expiresAt = new Date(data.unlock_token_expires_at)
  if (now > expiresAt) {
    return { valid: false, reason: 'expired' }
  }

  return { valid: true, userId: data.user_id }
}

// --------------------------------------------------------------------------
// unlockAccount
// Reset tài khoản: bỏ khóa, xóa counter, vô hiệu hóa token.
// Gọi SAU KHI đã đổi mật khẩu thành công.
// --------------------------------------------------------------------------
export async function unlockAccount(userId: string): Promise<void> {
  const admin = createAdminClient()

  const { error } = await admin
    .from('account_lockouts')
    .update({
      failed_attempts: 0,
      is_locked: false,
      locked_at: null,
      unlock_token: null,             // Vô hiệu hóa token đã dùng
      unlock_token_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (error) {
    console.error('[account-lock] unlockAccount error:', error)
  }
}
