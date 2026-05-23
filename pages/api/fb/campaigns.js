import { getUserFromReq } from '../../../lib/auth'
import { getSupabase } from '../../../lib/supabase'
import { getUserFbData, callMeta } from '../../../lib/metaApi'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' })

  const sb = getSupabase()
  const fbData = await getUserFbData(user.id, sb)

  if (!fbData) {
    return res.json({ ok: true, campaigns: [], accounts: [] })
  }

  const { token, accounts } = fbData

  const allCampaigns = []

  for (const account of accounts) {
    try {
      const filtering = JSON.stringify([
        { field: 'effective_status', operator: 'IN', value: ['ACTIVE', 'PAUSED'] }
      ])

      const campaignsRes = await callMeta(
        `${account.account_id}/campaigns`,
        token,
        {
          fields: 'id,name,status,objective,daily_budget,lifetime_budget',
          limit: '100',
          filtering
        }
      )

      const campaigns = campaignsRes?.data || []

      // Get insights for today
      const insightsRes = await callMeta(
        `${account.account_id}/insights`,
        token,
        {
          fields: 'spend,impressions,clicks,ctr,reach,campaign_id',
          date_preset: 'today',
          level: 'campaign'
        }
      )

      const insightsMap = {}
      const insightsData = insightsRes?.data || []
      for (const ins of insightsData) {
        insightsMap[ins.campaign_id] = ins
      }

      for (const camp of campaigns) {
        const ins = insightsMap[camp.id] || {}
        allCampaigns.push({
          id: camp.id,
          name: camp.name,
          status: camp.status,
          objective: camp.objective,
          account_id: account.account_id,
          account_name: account.account_name,
          daily_budget: camp.daily_budget ? Number(camp.daily_budget) / 100 : null,
          lifetime_budget: camp.lifetime_budget ? Number(camp.lifetime_budget) / 100 : null,
          spend: ins.spend ? Number(ins.spend) : 0,
          impressions: ins.impressions ? Number(ins.impressions) : 0,
          clicks: ins.clicks ? Number(ins.clicks) : 0,
          ctr: ins.ctr ? Number(ins.ctr) : 0,
          reach: ins.reach ? Number(ins.reach) : 0
        })
      }
    } catch (err) {
      console.error('[campaigns] Error for account', account.account_id, err)
    }
  }

  return res.json({ ok: true, campaigns: allCampaigns, accounts })
}
