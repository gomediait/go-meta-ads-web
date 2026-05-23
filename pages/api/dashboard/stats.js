import { getUserFromReq } from '../../../lib/auth'
import { getSupabase } from '../../../lib/supabase'
import { getUserFbData, callMeta } from '../../../lib/metaApi'

export default async function handler(req, res) {
  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' })

  const sb = getSupabase()
  const fbData = await getUserFbData(user.id, sb)

  if (!fbData) {
    return res.json({ campaigns: null, spend: null, revenue: null, profit: null })
  }

  const { token, accounts } = fbData

  let totalSpend = 0
  let totalActiveCampaigns = 0

  for (const account of accounts) {
    try {
      // Get today's spend
      const insightsRes = await callMeta(
        `${account.account_id}/insights`,
        token,
        {
          fields: 'spend,actions',
          date_preset: 'today'
        }
      )

      const rows = insightsRes?.data || []
      for (const row of rows) {
        totalSpend += Number(row.spend || 0)
      }

      // Count active campaigns
      const campRes = await callMeta(
        `${account.account_id}/campaigns`,
        token,
        {
          fields: 'id',
          filtering: JSON.stringify([{ field: 'effective_status', operator: 'IN', value: ['ACTIVE'] }]),
          summary: 'true',
          limit: '1'
        }
      )

      if (campRes?.summary?.total_count != null) {
        totalActiveCampaigns += Number(campRes.summary.total_count)
      } else if (campRes?.data) {
        totalActiveCampaigns += campRes.data.length
      }
    } catch (err) {
      console.error('[stats] Error for account', account.account_id, err)
    }
  }

  return res.json({
    campaigns: totalActiveCampaigns,
    spend: Math.round(totalSpend * 100) / 100,
    revenue: null,
    profit: null
  })
}
