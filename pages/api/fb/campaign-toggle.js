import { getUserFromReq } from '../../../lib/auth'
import { getSupabase } from '../../../lib/supabase'
import { getUserFbData } from '../../../lib/metaApi'
import { getEffectiveContext, hasPermission } from '../../../lib/teamAccess'

const META_BASE = 'https://graph.facebook.com/v23.0'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' })

  const { campaign_id, status } = req.body || {}

  if (!campaign_id || !status) {
    return res.status(400).json({ error: 'Thiếu campaign_id hoặc status' })
  }

  if (!['ACTIVE', 'PAUSED'].includes(status)) {
    return res.status(400).json({ error: 'Status phải là ACTIVE hoặc PAUSED' })
  }

  const sb = getSupabase()
  const ctx = await getEffectiveContext(user.id, sb)

  if (!hasPermission(ctx, 'toggle_campaign')) {
    return res.status(403).json({ error: 'Bạn không có quyền bật/tắt chiến dịch' })
  }

  const fbData = await getUserFbData(ctx.ownerId, sb)

  if (!fbData) {
    return res.status(400).json({ error: 'Chưa kết nối Facebook Ads' })
  }

  const { token } = fbData

  try {
    const url = `${META_BASE}/${campaign_id}`
    const body = new URLSearchParams({ status, access_token: token }).toString()

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    })

    const json = await response.json()

    if (json.error) {
      console.error('[campaign-toggle] Meta error:', json.error)
      if (json.error.code === 190) {
        return res.status(401).json({ error: 'TOKEN_EXPIRED' })
      }
      return res.status(400).json({ error: json.error.message || 'Lỗi từ Meta API' })
    }

    return res.json({ ok: true })
  } catch (err) {
    console.error('[campaign-toggle] Error:', err)
    return res.status(500).json({ error: 'Lỗi server' })
  }
}
