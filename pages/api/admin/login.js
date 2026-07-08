import { getSupabase } from '../../../lib/supabase'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { serialize } from 'cookie'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' })

  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'Vui lòng nhập Email và Mật khẩu' })
  }

  const sb = getSupabase()

  // Find admin user
  const { data: adminUser, error } = await sb
    .from('admin_users')
    .select('id, email, password_hash, role')
    .eq('email', email)
    .single()

  if (error || !adminUser) {
    // Để bảo mật, không nên báo rõ là sai email hay mật khẩu
    return res.status(401).json({ ok: false, error: 'Email hoặc mật khẩu không chính xác' })
  }

  // Verify password
  const isValid = await bcrypt.compare(password, adminUser.password_hash)
  if (!isValid) {
    return res.status(401).json({ ok: false, error: 'Email hoặc mật khẩu không chính xác' })
  }

  // Create JWT Token
  const token = jwt.sign(
    {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      admin: true
    },
    JWT_SECRET,
    { expiresIn: '12h' } // Token expires in 12 hours
  )

  // Set HttpOnly Cookie
  const serialized = serialize('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 12, // 12 hours
    path: '/',
  })

  res.setHeader('Set-Cookie', serialized)
  return res.status(200).json({ ok: true, message: 'Đăng nhập thành công' })
}
