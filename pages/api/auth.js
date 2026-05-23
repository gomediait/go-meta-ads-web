import { getSupabase } from '../../lib/supabase'
import { hashPassword, verifyPassword, signToken, setSessionCookie, clearSessionCookie, getUserFromReq } from '../../lib/auth'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { action } = req.query
  const db = getSupabase()

  // ─── REGISTER ───────────────────────────────────────────────
  if (action === 'register') {
    if (req.method !== 'POST') return res.status(405).end()
    const { email, password, name } = req.body || {}
    if (!email || !password || !name)
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' })
    if (password.length < 6)
      return res.status(400).json({ error: 'Mật khẩu tối thiểu 6 ký tự' })

    const { data: existing } = await db.from('users').select('id').eq('email', email).single()
    if (existing) return res.status(409).json({ error: 'Email đã được đăng ký' })

    const { data: user, error } = await db.from('users').insert({
      email: email.toLowerCase().trim(),
      password_hash: hashPassword(password),
      name: name.trim(),
      plan: 'trial',
      status: 'active',
      expire_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // trial 7 ngày
    }).select('id,email,name,plan,status,expire_at,avatar').single()

    if (error) return res.status(500).json({ error: 'Lỗi tạo tài khoản' })

    const token = signToken({ id: user.id, email: user.email, plan: user.plan })
    setSessionCookie(res, token)
    return res.json({ ok: true, user })
  }

  // ─── LOGIN ──────────────────────────────────────────────────
  if (action === 'login') {
    if (req.method !== 'POST') return res.status(405).end()
    const { email, password } = req.body || {}
    if (!email || !password)
      return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu' })

    const { data: user } = await db.from('users')
      .select('id,email,name,plan,status,expire_at,avatar,password_hash')
      .eq('email', email.toLowerCase().trim()).single()

    if (!user || !verifyPassword(password, user.password_hash || ''))
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' })
    if (user.status !== 'active')
      return res.status(403).json({ error: 'Tài khoản đã bị khoá' })

    const { password_hash, ...safeUser } = user
    const token = signToken({ id: user.id, email: user.email, plan: user.plan })
    setSessionCookie(res, token)
    return res.json({ ok: true, user: safeUser })
  }

  // ─── ME (lấy thông tin user hiện tại) ───────────────────────
  if (action === 'me') {
    if (req.method !== 'GET') return res.status(405).end()
    const payload = getUserFromReq(req)
    if (!payload) return res.status(401).json({ error: 'Chưa đăng nhập' })

    const { data: user } = await db.from('users')
      .select('id,email,name,plan,status,expire_at,avatar,facebook_id,shop_code')
      .eq('id', payload.id).single()

    if (!user) return res.status(404).json({ error: 'Không tìm thấy tài khoản' })
    if (user.status !== 'active') return res.status(403).json({ error: 'Tài khoản bị khoá' })

    // Kiểm tra FB connection
    const { data: fbConn } = await db.from('fb_connections')
      .select('fb_name,fb_email,token_expires_at,connected_at')
      .eq('user_id', user.id).single()

    return res.json({ ok: true, user: { ...user, fb_connected: !!fbConn, fb_info: fbConn || null } })
  }

  // ─── LOGOUT ─────────────────────────────────────────────────
  if (action === 'logout') {
    clearSessionCookie(res)
    return res.json({ ok: true })
  }

  // ─── FACEBOOK CALLBACK (sẽ hoàn thiện sau khi có App ID) ────
  if (action === 'facebook') {
    return res.status(503).json({ error: 'Facebook OAuth chưa được cấu hình' })
  }

  return res.status(404).json({ error: 'Action không tồn tại' })
}
