import bcrypt from 'bcryptjs'
import { getSupabase } from '../../../lib/supabase'
import { requireAdminAuth } from '../../../lib/auth'
import { generateBase32Secret, buildOtpauthUri, verifyTotp } from '../../../lib/totp'
import { encryptToken, decryptToken } from '../../../lib/tokenCrypto'
import { logAudit } from '../../../lib/auditLog'

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ ok: false })

  const db = getSupabase()
  const adminId = req.admin.id
  const { action } = req.body || {}

  const { data: admin } = await db.from('admin_users')
    .select('id, email, password_hash, totp_enabled, totp_secret, totp_pending_secret')
    .eq('id', adminId).single()
  if (!admin) return res.status(404).json({ ok: false, error: 'Không tìm thấy tài khoản' })

  if (action === 'status') {
    return res.json({ ok: true, enabled: !!admin.totp_enabled })
  }

  if (action === 'setup') {
    if (admin.totp_enabled) return res.status(400).json({ ok: false, error: '2FA đã được bật. Tắt trước khi thiết lập lại.' })
    const secret = generateBase32Secret()
    await db.from('admin_users').update({ totp_pending_secret: encryptToken(secret) }).eq('id', adminId)
    return res.json({
      ok: true,
      secret,
      otpauth_uri: buildOtpauthUri(secret, admin.email),
    })
  }

  if (action === 'enable') {
    const { code } = req.body
    if (!admin.totp_pending_secret) return res.status(400).json({ ok: false, error: 'Chưa khởi tạo thiết lập 2FA. Bấm "Thiết lập" trước.' })
    const pendingSecret = decryptToken(admin.totp_pending_secret)
    if (!verifyTotp(pendingSecret, code)) return res.status(400).json({ ok: false, error: 'Mã xác thực không đúng' })

    await db.from('admin_users').update({
      totp_secret: encryptToken(pendingSecret),
      totp_enabled: true,
      totp_pending_secret: null,
    }).eq('id', adminId)

    await logAudit({ req, actorType: 'admin', actorId: admin.id, actorEmail: admin.email, action: 'admin_2fa_enable' })
    return res.json({ ok: true })
  }

  if (action === 'disable') {
    const { password, code } = req.body
    if (!admin.totp_enabled) return res.status(400).json({ ok: false, error: '2FA chưa được bật' })

    const passOk = await bcrypt.compare(password || '', admin.password_hash)
    if (!passOk) return res.status(401).json({ ok: false, error: 'Mật khẩu không đúng' })

    const currentSecret = decryptToken(admin.totp_secret)
    if (!verifyTotp(currentSecret, code)) return res.status(400).json({ ok: false, error: 'Mã xác thực không đúng' })

    await db.from('admin_users').update({
      totp_secret: null,
      totp_enabled: false,
      totp_pending_secret: null,
    }).eq('id', adminId)

    await logAudit({ req, actorType: 'admin', actorId: admin.id, actorEmail: admin.email, action: 'admin_2fa_disable' })
    return res.json({ ok: true })
  }

  return res.status(400).json({ ok: false, error: 'Invalid action' })
}

export default requireAdminAuth(handler)
