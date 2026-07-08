import { serialize } from 'cookie'

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false })

  const serialized = serialize('admin_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: -1, // Expire immediately
    path: '/',
  })

  res.setHeader('Set-Cookie', serialized)
  return res.status(200).json({ ok: true, message: 'Đăng xuất thành công' })
}
