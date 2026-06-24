import { getUserFromReq } from '../../../lib/auth'
import { getSupabase } from '../../../lib/supabase'
import { getUserFbData, callMeta } from '../../../lib/metaApi'

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

  const { token, accounts } = fbData

  // Build date params
  const dateParams = {}
  if (since && until) {
    dateParams.since = since
    dateParams.until = until
  } else {
    dateParams.date_preset = date_preset || 'today'
  }

  const allData = []
  const dailyRaw = []
  const campaignDailyRaw = []
  const accountList = accounts.map(a => ({ account_id: a.account_id, account_name: a.account_name }))

  for (const account of accounts) {
    try {
      const insightsRes = await callMeta(
        `${account.account_id}/insights`,
        token,
        {
          fields: 'spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,campaign_name,campaign_id',
          level: 'campaign',
          ...dateParams
        }
      )

      for (const row of (insightsRes?.data || [])) {
        allData.push({
          campaign_id: row.campaign_id,
          campaign_name: row.campaign_name,
          account_id: account.account_id,
          account_name: account.account_name,
          spend: Number(row.spend) || 0,
          impressions: Number(row.impressions) || 0,
          clicks: Number(row.clicks) || 0,
          ctr: Number(row.ctr) || 0,
          cpc: Number(row.cpc) || 0,
          cpm: Number(row.cpm) || 0,
          reach: Number(row.reach) || 0,
          frequency: Number(row.frequency) || 0,
          actions: row.actions || []
        })
      }

      // Account-level daily
      const dailyRes = await callMeta(
        `${account.account_id}/insights`,
        token,
        {
          fields: 'spend,impressions,clicks,ctr,cpc,reach',
          time_increment: '1',
          limit: '90',
          ...dateParams
        }
      )

      for (const row of (dailyRes?.data || [])) {
        if (!row.date_start) continue
        dailyRaw.push({
          date: row.date_start,
          account_id: account.account_id,
          spend: Number(row.spend) || 0,
          impressions: Number(row.impressions) || 0,
          clicks: Number(row.clicks) || 0,
          reach: Number(row.reach) || 0,
        })
      }

      // Campaign-level daily (for expand charts)
      const campDailyRes = await callMeta(
        `${account.account_id}/insights`,
        token,
        {
          fields: 'campaign_id,spend,impressions,clicks,reach',
          level: 'campaign',
          time_increment: '1',
          limit: '500',
          ...dateParams
        }
      )

      for (const row of (campDailyRes?.data || [])) {
        if (!row.date_start || !row.campaign_id) continue
        campaignDailyRaw.push({
          date: row.date_start,
          campaign_id: row.campaign_id,
          spend: Number(row.spend) || 0,
          impressions: Number(row.impressions) || 0,
          clicks: Number(row.clicks) || 0,
          reach: Number(row.reach) || 0,
        })
      }
    } catch (err) {
      console.error('[report] Error for account', account.account_id, err)
    }
  }

  // Build daily aggregated (for "all" filter — frontend will re-aggregate per account)
  const dailyMap = {}
  for (const r of dailyRaw) {
    if (!dailyMap[r.date]) dailyMap[r.date] = { date: r.date, spend: 0, impressions: 0, clicks: 0, reach: 0 }
    dailyMap[r.date].spend += r.spend
    dailyMap[r.date].impressions += r.impressions
    dailyMap[r.date].clicks += r.clicks
    dailyMap[r.date].reach += r.reach
  }
  const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))
  for (const d of daily) {
    d.ctr = d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0
    d.cpc = d.clicks > 0 ? d.spend / d.clicks : 0
  }

  const totals = allData.reduce((acc, row) => {
    acc.spend += row.spend
    acc.impressions += row.impressions
    acc.clicks += row.clicks
    acc.reach += row.reach
    return acc
  }, { spend: 0, impressions: 0, clicks: 0, reach: 0 })

  totals.ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0
  totals.cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0

  return res.json({ ok: true, data: allData, totals, daily, dailyRaw, campaignDailyRaw, accounts: accountList })
}
