import { getSupabase } from '../../../lib/supabase'
import bcrypt from 'bcryptjs'
import { serialize } from 'cookie'
import { signAdminToken, signPending2FAToken } from '../../../lib/auth'
import { checkLock, recordFailure, clearAttempts } from '../../../lib/rateLimit'
import { logAudit } from '../../../lib/auditLog'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' })

  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'Vui lòng nhập Email và Mật khẩu' })
  }

  const emailLower = email.toLowerCase().trim()
  const lockId = `admin-login:${emailLower}`
  const lock = await checkLock(lockId)
  if (lock.locked) {
    return res.status(429).json({ ok: false, error: `Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${Math.ceil(lock.secondsLeft / 60)} phút.` })
  }

  const sb = getSupabase()

  // Find admin user
  const { data: adminUser, error } = await sb
    .from('admin_users')
    .select('id, email, password_hash, role, totp_enabled')
    .eq('email', emailLower)
    .single()

  if (error || !adminUser) {
    await recordFailure(lockId)
    // Để bảo mật, không nên báo rõ là sai email hay mật khẩu
    return res.status(401).json({ ok: false, error: 'Email hoặc mật khẩu không chính xác' })
  }

  // Verify password
  const isValid = await bcrypt.compare(password, adminUser.password_hash)
  if (!isValid) {
    await recordFailure(lockId)
    return res.status(401).json({ ok: false, error: 'Email hoặc mật khẩu không chính xác' })
  }

  await clearAttempts(lockId)

  // Nếu đã bật 2FA — chưa cấp admin_token, chỉ cấp token tạm chờ nhập mã
  if (adminUser.totp_enabled) {
    const preToken = signPending2FAToken({ id: adminUser.id, email: adminUser.email })
    return res.status(200).json({ ok: true, requires2fa: true, pre_token: preToken })
  }

  // Create JWT Token
  const token = signAdminToken({
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    admin: true
  })

  // Set HttpOnly Cookie
  const serialized = serialize('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 12, // 12 hours
    path: '/',
  })

  res.setHeader('Set-Cookie', serialized)
  await logAudit({ req, actorType: 'admin', actorId: adminUser.id, actorEmail: adminUser.email, action: 'admin_login' })
  return res.status(200).json({ ok: true, message: 'Đăng nhập thành công' })
}
