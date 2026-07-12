import redis from '@/lib/redis'

// --------------------------------------------------------------------------
// Cấu hình — IP-level rate limiting only
// Chức năng khóa tài khoản đã chuyển sang account-lock.ts (PostgreSQL)
// --------------------------------------------------------------------------
const MAX_ATTEMPTS = 3             // Số lần thất bại tối đa từ cùng một IP
const WINDOW_TTL_SECONDS = 30 * 60 // Cửa sổ đếm: 30 phút

// Prefix các key Redis (chỉ theo IP — không theo email)
const PREFIX_ATTEMPTS_IP = 'rl:attempts:ip:'
const PREFIX_LOCK_IP     = 'rl:lock:ip:'
const LOCK_TTL_SECONDS   = 30 * 60 // IP bị block 30 phút

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------
export interface IpRateLimitStatus {
  /** true nếu IP đang bị chặn */
  blocked: boolean
  /** Giây còn lại trước khi IP được thử lại */
  retryAfterSeconds: number
  /** Số lần thất bại từ IP này */
  failedAttempts: number
}

// --------------------------------------------------------------------------
// checkIpRateLimit
// Kiểm tra xem IP có đang bị chặn không.
// Gọi TRƯỚC khi xác thực mật khẩu.
// --------------------------------------------------------------------------
export async function checkIpRateLimit(ip: string): Promise<IpRateLimitStatus> {
  const lockTtl = await redis.ttl(`${PREFIX_LOCK_IP}${ip}`)

  if (lockTtl > 0) {
    return { blocked: true, retryAfterSeconds: lockTtl, failedAttempts: MAX_ATTEMPTS }
  }

  const attemptsRaw = await redis.get<number>(`${PREFIX_ATTEMPTS_IP}${ip}`)
  const failedAttempts = Number(attemptsRaw ?? 0)

  return { blocked: false, retryAfterSeconds: 0, failedAttempts }
}

// --------------------------------------------------------------------------
// recordIpFailedAttempt
// Tăng bộ đếm của IP sau một lần thất bại.
// Nếu đạt MAX_ATTEMPTS → set IP lock.
// --------------------------------------------------------------------------
export async function recordIpFailedAttempt(ip: string): Promise<IpRateLimitStatus> {
  const pipeline = redis.pipeline()
  pipeline.incr(`${PREFIX_ATTEMPTS_IP}${ip}`)
  pipeline.expire(`${PREFIX_ATTEMPTS_IP}${ip}`, WINDOW_TTL_SECONDS)
  const results = await pipeline.exec()

  const newAttempts = results[0] as number

  if (newAttempts >= MAX_ATTEMPTS) {
    await redis.pipeline()
      .set(`${PREFIX_LOCK_IP}${ip}`, '1', { ex: LOCK_TTL_SECONDS })
      .del(`${PREFIX_ATTEMPTS_IP}${ip}`)
      .exec()

    return { blocked: true, retryAfterSeconds: LOCK_TTL_SECONDS, failedAttempts: newAttempts }
  }

  return { blocked: false, retryAfterSeconds: 0, failedAttempts: newAttempts }
}

// --------------------------------------------------------------------------
// clearIpRateLimit
// Xóa counter IP sau khi đăng nhập thành công.
// --------------------------------------------------------------------------
export async function clearIpRateLimit(ip: string): Promise<void> {
  await redis.del(`${PREFIX_ATTEMPTS_IP}${ip}`, `${PREFIX_LOCK_IP}${ip}`)
}
