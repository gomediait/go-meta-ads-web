import { getAdminFromReq } from '../../../lib/auth'

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false })

  const admin = getAdminFromReq(req)
  if (!admin) {
    return res.status(401).json({ ok: false, error: 'Chưa đăng nhập' })
  }

  return res.status(200).json({ ok: true, admin })
}
