import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { parse, serialize } from 'cookie'

const JWT_SECRET = process.env.JWT_SECRET || 'gmap-secret-change-in-prod'
const COOKIE_NAME = 'gmap_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 ngày

export async function hashPassword(plain) {
  return await bcrypt.hash(plain, 10)
}

export async function verifyPassword(plain, hash) {
  return await bcrypt.compare(plain, hash)
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

export function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/'
  }))
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    expires: new Date(0),
    path: '/'
  }))
}

export function getTokenFromReq(req) {
  const cookies = parse(req.headers.cookie || '')
  return cookies[COOKIE_NAME] || null
}

export function getUserFromReq(req) {
  const token = getTokenFromReq(req)
  if (!token) return null
  return verifyToken(token)
}

export function requireAuth(handler) {
  return async (req, res) => {
    const user = getUserFromReq(req)
    if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' })
    req.user = user
    return handler(req, res)
  }
}

export function signAdminToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' })
}

export function verifyAdminToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded.admin ? decoded : null
  } catch {
    return null
  }
}

export function getAdminFromReq(req) {
  const token = req.cookies?.admin_token || req.headers['x-admin-token']
  if (!token) return null
  return verifyAdminToken(token)
}

export function requireAdminAuth(handler) {
  return async (req, res) => {
    const admin = getAdminFromReq(req)
    if (!admin) return res.status(401).json({ ok: false, error: 'Unauthorized' })
    req.admin = admin
    return handler(req, res)
  }
}

// Token tạm phát ra sau khi admin nhập đúng mật khẩu nhưng CHƯA nhập mã 2FA.
// Cố tình KHÔNG có claim `admin: true` — nếu bị dùng nhầm làm cookie admin_token,
// verifyAdminToken/getAdminFromReq sẽ từ chối vì thiếu claim đó, không thể bỏ qua bước 2FA.
export function signPending2FAToken(payload) {
  return jwt.sign({ ...payload, pending2fa: true }, JWT_SECRET, { expiresIn: '5m' })
}

export function verifyPending2FAToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded.pending2fa ? decoded : null
  } catch {
    return null
  }
}
