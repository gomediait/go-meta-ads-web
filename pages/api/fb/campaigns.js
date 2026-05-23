import { getUserFromReq } from '../../../lib/auth'
import { getSupabase } from '../../../lib/supabase'
import { getUserFbData, callMeta } from '../../../lib/metaApi'

function extractPurchases(actions) {
  if (!actions || !Array.isArray(actions)) return 0
  const PURCHASE_TYPES = ['purchase', 'offsite_conversion.fb_pixel_purchase', 'omni_purchase']
  for (const at of PURCHASE_TYPES) {
    const found = actions.find(a => a.action_type === at)
    if (found) return Number(found.value) || 0
  }
  return 0
}

function extractRevenue(actionValues) {
  if (!actionValues || !Array.isArray(actionValues)) return 0
  const PURCHASE_TYPES = ['purchase', 'offsite_conversion.fb_pixel_purchase', 'omni_purchase']
  for (const at of PURCHASE_TYPES) {
    const found = actionValues.find(a => a.action_type === at)
    if (found) return Number(found.value) || 0
  }
  return 0
}

function parseInsights(ins) {
  if (!ins) return {}
  const spend = Number(ins.spend) || 0
  const impressions = Number(ins.impressions) || 0
  const clicks = Number(ins.clicks) || 0
  const ctr = Number(ins.ctr) || 0
  const reach = Number(ins.reach) || 0
  const purchases = extractPurchases(ins.actions)
  const revenue = extractRevenue(ins.action_values)
  const purchaseRoas = ins.purchase_roas
    ? Number(Array.isArray(ins.purchase_roas) ? ins.purchase_roas[0]?.value : ins.purchase_roas) || 0
    : spend > 0 && revenue > 0 ? revenue / spend : 0
  const cpa = purchases > 0 ? spend / purchases : 0
  return { spend, impressions, clicks, ctr, reach, purchases, revenue, roas: purchaseRoas, cpa }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' })

  const sb = getSupabase()
  const fbData = await getUserFbData(user.id, sb)

  if (!fbData) {
    return res.json({ ok: true, adsets: [], accounts: [] })
  }

  const { token, accounts } = fbData

  const {
    date_preset = 'today',
    account_id: filterAccountId,
    status: filterStatus = 'ALL',
    compare = 'false'
  } = req.query

  const doCompare = compare === 'true'

  const targetAccounts = filterAccountId
    ? accounts.filter(a => a.account_id === filterAccountId)
    : accounts

  const allAdsets = []

  const insightFields = [
    'spend', 'impressions', 'clicks', 'ctr', 'reach',
    'actions', 'action_values', 'purchase_roas', 'cost_per_action_type'
  ].join(',')

  for (const account of targetAccounts) {
    try {
      // Build effective_status filter
      const statusFilter = []
      if (filterStatus === 'ACTIVE') {
        statusFilter.push('ACTIVE')
      } else if (filterStatus === 'PAUSED') {
        statusFilter.push('PAUSED', 'CAMPAIGN_PAUSED')
      } else {
        statusFilter.push('ACTIVE', 'PAUSED', 'CAMPAIGN_PAUSED')
      }

      const filtering = JSON.stringify([
        { field: 'effective_status', operator: 'IN', value: statusFilter }
      ])

      const adsetsRes = await callMeta(
        `${account.account_id}/adsets`,
        token,
        {
          fields: [
            'id', 'name', 'status', 'effective_status', 'campaign_id',
            'campaign{id,name,status,effective_status,objective}',
            'daily_budget', 'lifetime_budget', 'budget_remaining'
          ].join(','),
          limit: '200',
          filtering
        }
      )

      const adsets = adsetsRes?.data || []
      if (!adsets.length) continue

      // Fetch insights for all adsets in this account
      const insightsRes = await callMeta(
        `${account.account_id}/insights`,
        token,
        {
          fields: `adset_id,${insightFields}`,
          date_preset,
          level: 'adset',
          limit: '500'
        }
      )

      const insightsMap = {}
      for (const ins of (insightsRes?.data || [])) {
        insightsMap[ins.adset_id] = ins
      }

      let insightsYesterdayMap = {}
      if (doCompare) {
        const insYesterday = await callMeta(
          `${account.account_id}/insights`,
          token,
          {
            fields: `adset_id,${insightFields}`,
            date_preset: 'yesterday',
            level: 'adset',
            limit: '500'
          }
        )
        for (const ins of (insYesterday?.data || [])) {
          insightsYesterdayMap[ins.adset_id] = ins
        }
      }

      for (const adset of adsets) {
        const ins = insightsMap[adset.id]
        const insY = insightsYesterdayMap[adset.id]

        const today = parseInsights(ins)
        const yesterday = doCompare ? parseInsights(insY) : null

        const dailyBudget = adset.daily_budget ? Number(adset.daily_budget) / 100 : null
        const lifetimeBudget = adset.lifetime_budget ? Number(adset.lifetime_budget) / 100 : null
        const budgetRemaining = adset.budget_remaining ? Number(adset.budget_remaining) / 100 : null
        const effectiveBudget = dailyBudget || lifetimeBudget || 0
        const budgetUtilPct = effectiveBudget > 0 && today.spend > 0
          ? Math.round((today.spend / effectiveBudget) * 100)
          : 0

        const obj = {
          id: adset.id,
          name: adset.name,
          status: adset.status,
          effective_status: adset.effective_status,
          campaign_id: adset.campaign?.id || adset.campaign_id,
          campaign_name: adset.campaign?.name || '',
          campaign_status: adset.campaign?.status || '',
          campaign_effective_status: adset.campaign?.effective_status || '',
          objective: adset.campaign?.objective || '',
          account_id: account.account_id,
          account_name: account.account_name,
          currency: account.currency || 'VND',
          daily_budget: dailyBudget,
          lifetime_budget: lifetimeBudget,
          budget_remaining: budgetRemaining,
          budget_util_pct: budgetUtilPct,
          spend: today.spend,
          impressions: today.impressions,
          clicks: today.clicks,
          ctr: today.ctr,
          reach: today.reach,
          purchases: today.purchases,
          revenue: today.revenue,
          cpa: today.cpa,
          roas: today.roas,
          ...(doCompare && {
            yesterday_spend: yesterday?.spend ?? 0,
            yesterday_purchases: yesterday?.purchases ?? 0,
            yesterday_cpa: yesterday?.cpa ?? 0,
            yesterday_roas: yesterday?.roas ?? 0
          })
        }

        allAdsets.push(obj)
      }
    } catch (err) {
      console.error('[adsets] Error for account', account.account_id, err)
    }
  }

  // Sort: ACTIVE first, then by spend desc
  allAdsets.sort((a, b) => {
    const aActive = a.effective_status === 'ACTIVE' ? 0 : 1
    const bActive = b.effective_status === 'ACTIVE' ? 0 : 1
    if (aActive !== bActive) return aActive - bActive
    return b.spend - a.spend
  })

  return res.json({ ok: true, adsets: allAdsets, accounts: targetAccounts })
}
