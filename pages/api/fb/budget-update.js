import { getUserFromReq } from '../../../lib/auth'
import { getSupabase } from '../../../lib/supabase'
import { getUserFbData } from '../../../lib/metaApi'
import { getEffectiveContext, hasPermission } from '../../../lib/teamAccess'

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
  const ctx = await getEffectiveContext(user.id, sb)

  if (!hasPermission(ctx, 'toggle_campaign')) {
    return res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa ngân sách' })
  }

  const fbData = await getUserFbData(ctx.ownerId, sb)

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
      if (json.error.code === 190) {
        return res.status(401).json({ error: 'TOKEN_EXPIRED' })
      }
      let detailedError = 'Lỗi không xác định từ Facebook'
      if (json.error) {
        if (json.error.error_user_title && json.error.error_user_msg) {
          detailedError = `${json.error.error_user_title}: ${json.error.error_user_msg}`
        } else if (json.error.error_subcode === 1487674) {
          detailedError = 'Lỗi lịch trình: Vui lòng cài đặt ngày kết thúc cho quảng cáo trên Facebook trước khi tăng ngân sách.'
        } else if (json.error.error_subcode === 1885068) {
          detailedError = 'Lỗi: Chiến dịch đang bật CBO (Ngân sách chiến dịch), không thể tăng ngân sách ở cấp độ nhóm.'
        } else if (json.error.error_subcode === 1885046 || json.error.error_subcode === 1487390) {
          detailedError = 'Lỗi: Ngân sách bạn nhập quá thấp so với mức tối thiểu của Facebook.'
        } else {
          detailedError = `Lỗi Facebook: ${json.error.message}`
        }
      }
      return res.status(400).json({ error: detailedError })
    }

    return res.json({ ok: true, adset_id, new_budget: Number(new_budget), budget_type })
  } catch (err) {
    console.error('[budget-update] Error:', err)
    return res.status(500).json({ error: 'Lỗi server' })
  }
}
