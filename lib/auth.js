import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { parse, serialize } from 'cookie'

const JWT_SECRET = process.env.JWT_SECRET || 'gmap-secret-change-in-prod'
const COOKIE_NAME = 'gmap_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 ngày

export function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10)
}

export function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash)
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
