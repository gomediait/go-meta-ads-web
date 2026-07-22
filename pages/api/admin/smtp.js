import { getSupabase } from '../../../lib/supabase'
import { requireAdminAuth } from '../../../lib/auth'
import { logAudit } from '../../../lib/auditLog'

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  const db = getSupabase()
  const { action } = req.body || req.query

  if (action === 'smtp_get' || req.method === 'GET') {
    const { data } = await db.from('smtp_settings').select('id, host, port, username, from_name, from_email, is_active, updated_at').limit(1).single()
    return res.json({ ok: true, smtp: data ? { ...data, has_password: true } : null })
  }

  if (action === 'smtp_save' || req.method === 'POST') {
    const { host, port, username, password, from_name, is_active } = req.body

    const { data: existing } = await db.from('smtp_settings').select('id, password').limit(1).single()

    const payload = {
      host,
      port: Number(port) || 587,
      username,
      from_name: from_name || 'Go Meta Ads Pro',
      is_active: is_active !== undefined ? is_active : true,
      updated_at: new Date().toISOString()
    }
    // Chỉ ghi đè mật khẩu khi admin thực sự nhập giá trị mới
    if (password) payload.password = password

    let error
    if (existing?.id) {
      const { error: err } = await db.from('smtp_settings').update(payload).eq('id', existing.id)
      error = err
    } else {
      if (!password) return res.status(400).json({ ok: false, error: 'Thiếu mật khẩu SMTP' })
      const { error: err } = await db.from('smtp_settings').insert(payload)
      error = err
    }

    if (error) return res.status(500).json({ ok: false, error: error.message })
    await logAudit({ req, actorType: 'admin', actorId: req.admin.id, actorEmail: req.admin.email, action: 'smtp_config_save' })
    return res.json({ ok: true })
  }

  if (action === 'smtp_test') {
    const nodemailer = (await import('nodemailer')).default
    const { data: smtp } = await db.from('smtp_settings').select('*').eq('is_active', true).limit(1).single()
    if (!smtp?.host || !smtp?.username || !smtp?.password) {
      return res.json({ ok: false, error: 'Chưa cấu hình đủ SMTP (host/username/password)' })
    }
    try {
      const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port || 587,
        secure: smtp.port === 465,
        auth: { user: smtp.username, pass: smtp.password },
        tls: { rejectUnauthorized: false },
      })
      await transporter.sendMail({
        from: `"${smtp.from_name || 'Go Meta Ads Pro'}" <${smtp.from_email || smtp.username}>`,
        to: smtp.username,
        subject: 'Test SMTP — Go Meta Ads Pro',
        html: '<p>Đây là email test cấu hình SMTP từ trang Admin.</p>',
      })
      return res.json({ ok: true })
    } catch (e) {
      return res.json({ ok: false, error: e.message })
    }
  }

  return res.status(405).end()
}

export default requireAdminAuth(handler)
