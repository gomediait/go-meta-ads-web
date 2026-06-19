import { getUserFromReq } from '../../../lib/auth'
import { getSupabase } from '../../../lib/supabase'
import { getUserFbData, callMetaAll } from '../../../lib/metaApi'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' })

  const { date_preset, since, until } = req.query

  const sb = getSupabase()
  const fbData = await getUserFbData(user.id, sb)

  if (!fbData) {
    return res.json({ ok: true, data: [], totals: { spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0, reach: 0 } })
  }

  const { token, accounts, conn } = fbData

  if (conn.token_expires_at && new Date(conn.token_expires_at) < new Date()) {
    return res.status(401).json({ ok: false, error: 'token_expired', message: 'Token Facebook đã hết hạn. Vui lòng kết nối lại.' })
  }

  // Build date params
  const dateParams = {}
  if (since && until) {
    dateParams.since = since
    dateParams.until = until
  } else {
    dateParams.date_preset = date_preset || 'today'
  }

  const results = await Promise.allSettled(
    accounts.map(account =>
      callMetaAll(
        `${account.account_id}/insights`,
        token,
        {
          fields: 'spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,campaign_name,campaign_id',
          level: 'campaign',
          ...dateParams
        }
      ).then(insightsRes => {
        return (insightsRes?.data || []).map(row => ({
          campaign_id: row.campaign_id,
          campaign_name: row.campaign_name,
          account_id: account.account_id,
          account_name: account.account_name,
          spend: row.spend ? Number(row.spend) : 0,
          impressions: row.impressions ? Number(row.impressions) : 0,
          clicks: row.clicks ? Number(row.clicks) : 0,
          ctr: row.ctr ? Number(row.ctr) : 0,
          cpc: row.cpc ? Number(row.cpc) : 0,
          cpm: row.cpm ? Number(row.cpm) : 0,
          reach: row.reach ? Number(row.reach) : 0,
          frequency: row.frequency ? Number(row.frequency) : 0,
          actions: row.actions || []
        }))
      })
    )
  )

  const allData = results.flatMap(r => {
    if (r.status === 'fulfilled') return r.value
    console.error('[report] Error for account:', r.reason)
    return []
  })

  // Calculate totals
  const totals = allData.reduce((acc, row) => {
    acc.spend += row.spend
    acc.impressions += row.impressions
    acc.clicks += row.clicks
    acc.reach += row.reach
    return acc
  }, { spend: 0, impressions: 0, clicks: 0, reach: 0 })

  totals.ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0
  totals.cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0

  return res.json({ ok: true, data: allData, totals })
}
