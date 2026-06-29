import { getUserFromReq } from '../../../lib/auth'
import { getSupabase } from '../../../lib/supabase'
import { getUserFbData } from '../../../lib/metaApi'

const META_BASE = 'https://graph.facebook.com/v23.0'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' })

  const { adset_id, new_budget, budget_type = 'daily' } = req.body || {}

  if (!adset_id) return res.status(400).json({ error: 'Thiếu adset_id' })
  if (!new_budget || isNaN(Number(new_budget)) || Number(new_budget) <= 0) {
    return res.status(400).json({ error: 'Ngân sách không hợp lệ' })
  }
  if (!['daily', 'lifetime'].includes(budget_type)) {
    return res.status(400).json({ error: 'budget_type phải là daily hoặc lifetime' })
  }

  const sb = getSupabase()
  const fbData = await getUserFbData(user.id, sb)

  if (!fbData) {
    return res.status(400).json({ error: 'Chưa kết nối Facebook Ads' })
  }

  const { token } = fbData

  try {
    const budgetInCents = Math.round(Number(new_budget))
    const budgetField = budget_type === 'daily' ? 'daily_budget' : 'lifetime_budget'

    const url = `${META_BASE}/${adset_id}`
    const body = new URLSearchParams({
      [budgetField]: String(budgetInCents),
      access_token: token
    }).toString()

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    })

    const json = await response.json()

    if (json.error) {
      console.error('[budget-update] Meta error:', json.error)
      const detailedError = `Lỗi Meta: ${JSON.stringify(json.error)}`
      return res.status(400).json({ error: detailedError })
    }

    return res.json({ ok: true, adset_id, new_budget: Number(new_budget), budget_type })
  } catch (err) {
    console.error('[budget-update] Error:', err)
    return res.status(500).json({ error: 'Lỗi server' })
  }
}
