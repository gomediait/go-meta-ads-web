import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development'

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false })

  const token = req.cookies.admin_token
  if (!token) {
    return res.status(401).json({ ok: false, error: 'Chưa đăng nhập' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (!decoded.admin) throw new Error('Not admin')
    return res.status(200).json({ ok: true, admin: decoded })
  } catch (error) {
    return res.status(401).json({ ok: false, error: 'Token không hợp lệ hoặc đã hết hạn' })
  }
}
