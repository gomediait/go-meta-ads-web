import { serialize } from 'cookie'
import { getSupabase } from '../../../lib/supabase'
import { signAdminToken, verifyPending2FAToken } from '../../../lib/auth'
import { decryptToken } from '../../../lib/tokenCrypto'
import { verifyTotp } from '../../../lib/totp'
import { checkLock, recordFailure, clearAttempts } from '../../../lib/rateLimit'
import { logAudit } from '../../../lib/auditLog'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false })

  const { pre_token, code } = req.body || {}
  if (!pre_token || !code) return res.status(400).json({ ok: false, error: 'Thiếu thông tin xác thực' })

  const pending = verifyPending2FAToken(pre_token)
  if (!pending) return res.status(401).json({ ok: false, error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' })

  const lockId = `admin-2fa:${pending.id}`
  const lock = await checkLock(lockId)
  if (lock.locked) {
    return res.status(429).json({ ok: false, error: `Nhập sai mã quá nhiều lần. Vui lòng thử lại sau ${Math.ceil(lock.secondsLeft / 60)} phút.` })
  }

  const sb = getSupabase()
  const { data: adminUser } = await sb
    .from('admin_users')
    .select('id, email, role, totp_enabled, totp_secret')
    .eq('id', pending.id)
    .single()

  if (!adminUser?.totp_enabled || !adminUser.totp_secret) {
    return res.status(400).json({ ok: false, error: '2FA chưa được bật cho tài khoản này' })
  }

  const secret = decryptToken(adminUser.totp_secret)
  if (!verifyTotp(secret, code)) {
    await recordFailure(lockId, { maxAttempts: 5, windowMinutes: 10, lockMinutes: 10 })
    return res.status(401).json({ ok: false, error: 'Mã xác thực không đúng' })
  }

  await clearAttempts(lockId)

  const token = signAdminToken({
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    admin: true,
  })

  const serialized = serialize('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 12,
    path: '/',
  })

  res.setHeader('Set-Cookie', serialized)
  await logAudit({ req, actorType: 'admin', actorId: adminUser.id, actorEmail: adminUser.email, action: 'admin_login' })
  return res.status(200).json({ ok: true, message: 'Đăng nhập thành công' })
}
