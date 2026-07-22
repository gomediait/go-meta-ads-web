import { getSupabase } from './supabase'

const DEFAULTS = { maxAttempts: 8, windowMinutes: 15, lockMinutes: 15 }

// Kiểm tra 1 identifier (vd `user-login:${email}`, `admin-login:${email}`) có đang bị khoá tạm không.
export async function checkLock(identifier) {
  const sb = getSupabase()
  const { data } = await sb
    .from('rate_limit_attempts')
    .select('locked_until')
    .eq('identifier', identifier)
    .single()

  if (data?.locked_until && new Date(data.locked_until) > new Date()) {
    const secondsLeft = Math.ceil((new Date(data.locked_until) - new Date()) / 1000)
    return { locked: true, secondsLeft }
  }
  return { locked: false }
}

// Ghi nhận 1 lần thất bại (sai mật khẩu...). Tự khoá khi vượt maxAttempts trong windowMinutes.
export async function recordFailure(identifier, opts = {}) {
  const { maxAttempts, windowMinutes, lockMinutes } = { ...DEFAULTS, ...opts }
  const sb = getSupabase()
  const now = new Date()

  const { data } = await sb
    .from('rate_limit_attempts')
    .select('attempts, first_attempt_at, locked_until')
    .eq('identifier', identifier)
    .single()

  const windowExpired = !data?.first_attempt_at || (now - new Date(data.first_attempt_at)) > windowMinutes * 60000
  const attempts = windowExpired ? 1 : (data?.attempts || 0) + 1
  const locked = attempts >= maxAttempts

  await sb.from('rate_limit_attempts').upsert({
    identifier,
    attempts,
    first_attempt_at: windowExpired ? now.toISOString() : data.first_attempt_at,
    locked_until: locked ? new Date(now.getTime() + lockMinutes * 60000).toISOString() : (windowExpired ? null : data?.locked_until ?? null),
    updated_at: now.toISOString(),
  }, { onConflict: 'identifier' })

  return { locked, attemptsLeft: Math.max(0, maxAttempts - attempts) }
}

// Xoá lịch sử sai khi đăng nhập thành công.
export async function clearAttempts(identifier) {
  const sb = getSupabase()
  await sb.from('rate_limit_attempts').delete().eq('identifier', identifier)
}
