import { getUserFromReq } from '../../../lib/auth'

export default async function handler(req, res) {
  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' })

  // Placeholder — will be populated when Facebook OAuth is complete
  // Once FB token is available, this will call the Marketing API
  return res.json({
    campaigns: null,
    spend: null,
    revenue: null,
    profit: null
  })
}
