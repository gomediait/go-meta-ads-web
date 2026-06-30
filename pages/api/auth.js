import { getSupabase } from '../../lib/supabase'
import { hashPassword, verifyPassword, signToken, setSessionCookie, clearSessionCookie, getUserFromReq } from '../../lib/auth'
import { isAllowedEmail } from '../../lib/planLimits'
import { sendEmail } from '../../lib/sendEmail'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { action } = req.query
  const db = getSupabase()

  // ─── SEND OTP ────────────────────────────────────────────────
  if (action === 'send_otp') {
    if (req.method !== 'POST') return res.status(405).end()
    const { email } = req.body || {}
    if (!email) return res.status(400).json({ error: 'Thiếu email' })

    const emailLower = email.toLowerCase().trim()
    if (!isAllowedEmail(emailLower))
      return res.status(400).json({ error: 'Email không hợp lệ. Vui lòng dùng Gmail, Outlook, Yahoo hoặc email công ty.' })

    // Rate limit: block if sent in last 60s
    const cutoff = new Date(Date.now() - 60 * 1000).toISOString()
    const { data: recent } = await db.from('email_otps')
      .select('id').eq('email', emailLower).eq('used', false).gte('created_at', cutoff).limit(1).single()
    if (recent) return res.status(429).json({ error: 'Vui lòng chờ 60 giây trước khi gửi lại mã' })

    // Delete old unused OTPs for this email
    await db.from('email_otps').delete().eq('email', emailLower).eq('used', false)

    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    await db.from('email_otps').insert({ email: emailLower, otp, expires_at: expiresAt })

    const sent = await sendEmail(
      emailLower,
      'Mã xác nhận đăng ký — Go Meta Ads Pro',
      `<div style="font-family:sans-serif;max-width:400px;margin:auto;padding:32px">
        <h2 style="color:#0c2a72">Go Meta Ads Pro</h2>
        <p>Mã xác nhận đăng ký tài khoản của bạn:</p>
        <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#fe5f01;padding:16px 0">${otp}</div>
        <p style="color:#666;font-size:13px">Mã có hiệu lực trong <strong>10 phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p>
      </div>`
    )

    if (!sent) {
      // SMTP not configured — return OTP in dev so testing is possible
      const isDev = process.env.NODE_ENV === 'development'
      if (isDev) return res.json({ ok: true, debug_otp: otp, message: '[DEV] SMTP chưa cấu hình, mã OTP trả về để test' })
      return res.status(503).json({ error: 'Không thể gửi email. Hệ thống chưa cấu hình SMTP — vui lòng liên hệ admin.' })
    }

    return res.json({ ok: true, message: 'Đã gửi mã xác nhận về email của bạn' })
  }

  // ─── VERIFY OTP (inline check, không tạo tài khoản) ─────────
  if (action === 'verify_otp') {
    if (req.method !== 'POST') return res.status(405).end()
    const { email, otp } = req.body || {}
    if (!email || !otp) return res.status(400).json({ error: 'Thiếu email hoặc mã xác nhận' })
    const emailLower = email.toLowerCase().trim()
    const { data: record } = await db.from('email_otps')
      .select('id').eq('email', emailLower).eq('otp', otp).eq('used', false)
      .gte('expires_at', new Date().toISOString()).single()
    if (!record) return res.status(400).json({ error: 'Mã xác nhận không đúng hoặc đã hết hạn' })
    return res.json({ ok: true })
  }

  // ─── REGISTER ───────────────────────────────────────────────
  if (action === 'register') {
    if (req.method !== 'POST') return res.status(405).end()
    const { email, password, name, phone, referral_code, otp } = req.body || {}
    if (!email || !password || !name)
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' })
    if (!phone || !/^[0-9]{9,11}$/.test(phone.replace(/\s/g, '')))
      return res.status(400).json({ error: 'Vui lòng nhập số điện thoại hợp lệ (9–11 chữ số)' })
    if (password.length < 6)
      return res.status(400).json({ error: 'Mật khẩu tối thiểu 6 ký tự' })
    if (!otp)
      return res.status(400).json({ error: 'Vui lòng xác minh email trước khi đăng ký' })

    const emailLower = email.toLowerCase().trim()
    if (!isAllowedEmail(emailLower))
      return res.status(400).json({ error: 'Vui lòng sử dụng email chính thống (Gmail, Outlook, email công ty...). Không chấp nhận email tạm thời.' })

    // Verify OTP
    const { data: otpRecord } = await db.from('email_otps')
      .select('id').eq('email', emailLower).eq('otp', otp).eq('used', false)
      .gte('expires_at', new Date().toISOString()).single()
    if (!otpRecord)
      return res.status(400).json({ error: 'Mã xác nhận email không đúng hoặc đã hết hạn. Vui lòng gửi lại mã.' })

    const { data: existing } = await db.from('users').select('id').eq('email', emailLower).single()
    if (existing) return res.status(409).json({ error: 'Email đã được đăng ký' })

    // Verify referral code if provided — must be valid or registration fails
    let referredBy = null
    if (referral_code?.trim()) {
      const { data: aff } = await db.from('affiliates')
        .select('referral_code')
        .eq('referral_code', referral_code.trim().toUpperCase())
        .eq('status', 'active')
        .single()
      if (!aff) return res.status(400).json({ error: 'Mã giới thiệu không hợp lệ hoặc không còn hoạt động. Vui lòng kiểm tra lại hoặc để trống.' })
      referredBy = referral_code.trim().toUpperCase()
    }

    const { data: user, error } = await db.from('users').insert({
      email: emailLower,
      password_hash: hashPassword(password),
      name: name.trim(),
      phone: phone.trim(),
      plan: 'trial',
      status: 'active',
      referred_by: referredBy,
      expire_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // trial 3 ngày
    }).select('id,email,name,plan,status,expire_at,avatar,phone').single()

    if (error) return res.status(500).json({ error: 'Lỗi tạo tài khoản' })

    // Mark OTP as used
    await db.from('email_otps').update({ used: true }).eq('id', otpRecord.id)

    // Generate session_id
    const sid = crypto.randomUUID()
    await db.from('users').update({ session_id: sid }).eq('id', user.id)

    const token = signToken({ id: user.id, email: user.email, plan: user.plan, sid })
    setSessionCookie(res, token)

    // Check effective context
    const { getEffectiveContext } = require('../../lib/teamAccess')
    const ctx = await getEffectiveContext(user.id, db)
    const { data: fbConn } = await db.from('fb_connections')
      .select('fb_name,fb_email,token_expires_at,connected_at')
      .eq('user_id', ctx.ownerId).single()

    return res.json({ ok: true, user: { ...user, fb_connected: !!fbConn, fb_info: fbConn || null, role: ctx.role } })
  }

  // ─── LOGIN ──────────────────────────────────────────────────
  if (action === 'login') {
    if (req.method !== 'POST') return res.status(405).end()
    const { email, password } = req.body || {}
    if (!email || !password)
      return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu' })

    const { data: user } = await db.from('users')
      .select('id,email,name,plan,status,expire_at,avatar,phone,password_hash')
      .eq('email', email.toLowerCase().trim()).single()

    if (!user || !verifyPassword(password, user.password_hash || ''))
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' })
    if (user.status !== 'active')
      return res.status(403).json({ error: 'Tài khoản đã bị khoá' })

    // Generate new session_id — invalidates any other active session
    const sid = crypto.randomUUID()
    await db.from('users').update({ session_id: sid }).eq('id', user.id)

    const { password_hash, ...safeUser } = user
    const token = signToken({ id: user.id, email: user.email, plan: user.plan, sid })
    setSessionCookie(res, token)

    // Check effective context
    const { getEffectiveContext } = require('../../lib/teamAccess')
    const ctx = await getEffectiveContext(user.id, db)
    const { data: fbConn } = await db.from('fb_connections')
      .select('fb_name,fb_email,token_expires_at,connected_at')
      .eq('user_id', ctx.ownerId).single()

    return res.json({ ok: true, user: { ...safeUser, fb_connected: !!fbConn, fb_info: fbConn || null, role: ctx.role } })
  }

  // ─── ME (lấy thông tin user hiện tại) ───────────────────────
  if (action === 'me') {
    if (req.method !== 'GET') return res.status(405).end()
    const payload = getUserFromReq(req)
    if (!payload) return res.status(401).json({ error: 'Chưa đăng nhập' })

    const { data: user } = await db.from('users')
      .select('id,email,name,plan,status,expire_at,avatar,facebook_id,shop_code,session_id,phone')
      .eq('id', payload.id).single()

    if (!user) return res.status(404).json({ error: 'Không tìm thấy tài khoản' })
    if (user.status !== 'active') return res.status(403).json({ error: 'Tài khoản bị khoá' })

    // Session_id check — kick out if another device logged in
    if (payload.sid && user.session_id && payload.sid !== user.session_id) {
      clearSessionCookie(res)
      return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' })
    }

    // Kiểm tra FB connection (sử dụng getEffectiveContext để tự lấy token của Sếp nếu là nhân viên)
    const { getEffectiveContext } = require('../../lib/teamAccess')
    const ctx = await getEffectiveContext(user.id, db)

    const { data: fbConn } = await db.from('fb_connections')
      .select('fb_name,fb_email,token_expires_at,connected_at')
      .eq('user_id', ctx.ownerId).single()

    const { session_id, ...safeUser } = user
    return res.json({ ok: true, user: { ...safeUser, fb_connected: !!fbConn, fb_info: fbConn || null, role: ctx.role } })
  }

  // ─── LOGOUT ─────────────────────────────────────────────────
  if (action === 'logout') {
    clearSessionCookie(res)
    return res.json({ ok: true })
  }

  // ─── FACEBOOK — khởi tạo OAuth flow ────────────────────────
  if (action === 'facebook') {
    if (req.method !== 'POST') return res.status(405).end()
    const currentUser = getUserFromReq(req)
    if (!currentUser) return res.status(401).json({ error: 'Chưa đăng nhập' })

    const appId = process.env.FACEBOOK_APP_ID
    if (!appId) return res.status(503).json({ error: 'Facebook App chưa được cấu hình' })

    const jwt = await import('jsonwebtoken')
    const state = jwt.default.sign(
      { user_id: currentUser.id, ts: Date.now() },
      process.env.JWT_SECRET || 'gmap-secret-change-in-prod',
      { expiresIn: '10m' }
    )

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://adsmeta.gonetwork.vn'
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: `${siteUrl}/api/auth/callback`,
      scope: 'ads_read,ads_management,public_profile,pages_read_engagement,pages_show_list',
      response_type: 'code',
      state,
    })

    const auth_url = `https://www.facebook.com/v23.0/dialog/oauth?${params.toString()}`
    return res.json({ ok: true, auth_url })
  }

  return res.status(404).json({ error: 'Action không tồn tại' })
}
