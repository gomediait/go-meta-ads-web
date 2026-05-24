import { getUserFromReq } from '../../../lib/auth'
import { getSupabase } from '../../../lib/supabase'
import { getUserFbData, callMeta } from '../../../lib/metaApi'

const PURCHASE_TYPES   = ['purchase', 'offsite_conversion.fb_pixel_purchase', 'omni_purchase']
const CART_TYPES       = ['add_to_cart', 'omni_add_to_cart']
const CHECKOUT_TYPES   = ['initiate_checkout', 'omni_initiated_checkout']
const VIEW_TYPES       = ['view_content', 'omni_view_content']
const LEAD_TYPES       = ['lead', 'onsite_conversion.lead_grouped']

function extractAction(actions, types) {
  if (!actions || !Array.isArray(actions)) return 0
  for (const t of types) {
    const found = actions.find(a => a.action_type === t)
    if (found) return Number(found.value) || 0
  }
  return 0
}

function extractRevenue(actionValues) {
  if (!actionValues || !Array.isArray(actionValues)) return 0
  for (const t of PURCHASE_TYPES) {
    const found = actionValues.find(a => a.action_type === t)
    if (found) return Number(found.value) || 0
  }
  return 0
}

function parseInsights(ins) {
  if (!ins) return {}
  const spend        = Number(ins.spend) || 0
  const impressions  = Number(ins.impressions) || 0
  const clicks       = Number(ins.clicks) || 0
  const ctr          = Number(ins.ctr) || 0
  const reach        = Number(ins.reach) || 0
  const frequency    = Number(ins.frequency) || 0
  const cpm          = Number(ins.cpm) || (impressions > 0 ? (spend / impressions * 1000) : 0)
  const linkClicks   = Number(ins.inline_link_clicks) || 0
  const purchases    = extractAction(ins.actions, PURCHASE_TYPES)
  const addToCart    = extractAction(ins.actions, CART_TYPES)
  const checkout     = extractAction(ins.actions, CHECKOUT_TYPES)
  const viewContent  = extractAction(ins.actions, VIEW_TYPES)
  const leads        = extractAction(ins.actions, LEAD_TYPES)
  const revenue      = extractRevenue(ins.action_values)
  const purchaseRoas = ins.purchase_roas
    ? Number(Array.isArray(ins.purchase_roas) ? ins.purchase_roas[0]?.value : ins.purchase_roas) || 0
    : (spend > 0 && revenue > 0 ? revenue / spend : 0)
  const cpa = purchases > 0 ? spend / purchases : 0
  return {
    spend, impressions, clicks, ctr, reach, frequency, cpm,
    linkClicks, purchases, addToCart, checkout, viewContent, leads,
    revenue, roas: purchaseRoas, cpa
  }
}

const INSIGHT_FIELDS = [
  'spend', 'impressions', 'clicks', 'ctr', 'reach', 'frequency', 'cpm',
  'inline_link_clicks', 'actions', 'action_values', 'purchase_roas'
].join(',')

function buildStatusFilter(filterStatus, isCampaign) {
  if (filterStatus === 'ACTIVE') return ['ACTIVE']
  if (filterStatus === 'PAUSED') return isCampaign ? ['PAUSED'] : ['PAUSED', 'CAMPAIGN_PAUSED']
  return isCampaign ? ['ACTIVE', 'PAUSED'] : ['ACTIVE', 'PAUSED', 'CAMPAIGN_PAUSED']
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' })

  const sb = getSupabase()
  const fbData = await getUserFbData(user.id, sb)
  if (!fbData) return res.json({ ok: true, adsets: [], accounts: [] })

  const { token, accounts } = fbData
  const {
    date_preset    = 'today',
    account_id: filterAccountId,
    status: filterStatus = 'ALL',
    compare        = 'false',
    level          = 'adset',
    campaign_id: filterCampaignId,
    objective: filterObjective,
  } = req.query

  const doCompare    = compare === 'true'
  const isCampaign   = level === 'campaign'
  const targetAccounts = filterAccountId
    ? accounts.filter(a => a.account_id === filterAccountId)
    : accounts

  const allItems = []

  for (const account of targetAccounts) {
    try {
      const statusFilter = buildStatusFilter(filterStatus, isCampaign)
      const filtering    = [{ field: 'effective_status', operator: 'IN', value: statusFilter }]

      if (isCampaign) {
        // ── CAMPAIGN LEVEL ──────────────────────────────────────────
        const campaignsRes = await callMeta(
          `${account.account_id}/campaigns`, token,
          {
            fields: 'id,name,status,effective_status,objective,daily_budget,lifetime_budget,budget_remaining',
            limit: '200',
            filtering: JSON.stringify(filtering)
          }
        )
        const campaigns = campaignsRes?.data || []
        if (!campaigns.length) continue

        const [insRes, insResY] = await Promise.all([
          callMeta(`${account.account_id}/insights`, token, {
            fields: `campaign_id,${INSIGHT_FIELDS}`, date_preset, level: 'campaign', limit: '500'
          }),
          doCompare ? callMeta(`${account.account_id}/insights`, token, {
            fields: `campaign_id,${INSIGHT_FIELDS}`, date_preset: 'yesterday', level: 'campaign', limit: '500'
          }) : Promise.resolve(null)
        ])

        const insMap  = Object.fromEntries((insRes?.data  || []).map(x => [x.campaign_id, x]))
        const insMapY = Object.fromEntries((insResY?.data || []).map(x => [x.campaign_id, x]))

        for (const c of campaigns) {
          if (filterObjective && c.objective !== filterObjective) continue
          const today     = parseInsights(insMap[c.id])
          const yesterday = doCompare ? parseInsights(insMapY[c.id]) : null
          const dailyBudget    = c.daily_budget     ? Number(c.daily_budget)     / 100 : null
          const lifetimeBudget = c.lifetime_budget  ? Number(c.lifetime_budget)  / 100 : null
          const budgetRemaining= c.budget_remaining ? Number(c.budget_remaining) / 100 : null
          const effectiveBudget = dailyBudget || lifetimeBudget || 0
          const budgetUtilPct   = effectiveBudget > 0 && today.spend > 0
            ? Math.round((today.spend / effectiveBudget) * 100) : 0

          allItems.push({
            id: c.id, name: c.name, status: c.status, effective_status: c.effective_status,
            objective: c.objective || '', level: 'campaign',
            account_id: account.account_id, account_name: account.account_name,
            currency: account.currency || 'VND',
            daily_budget: dailyBudget, lifetime_budget: lifetimeBudget,
            budget_remaining: budgetRemaining, budget_util_pct: budgetUtilPct,
            ...today,
            ...(doCompare && {
              yesterday_spend: yesterday?.spend ?? 0, yesterday_purchases: yesterday?.purchases ?? 0,
              yesterday_cpa: yesterday?.cpa ?? 0, yesterday_roas: yesterday?.roas ?? 0,
              yesterday_revenue: yesterday?.revenue ?? 0,
            })
          })
        }

      } else {
        // ── ADSET LEVEL ─────────────────────────────────────────────
        if (filterCampaignId) {
          filtering.push({ field: 'campaign.id', operator: 'EQUAL', value: filterCampaignId })
        }

        const adsetsRes = await callMeta(
          `${account.account_id}/adsets`, token,
          {
            fields: [
              'id', 'name', 'status', 'effective_status', 'campaign_id',
              'campaign{id,name,status,effective_status,objective}',
              'daily_budget', 'lifetime_budget', 'budget_remaining'
            ].join(','),
            limit: '200',
            filtering: JSON.stringify(filtering)
          }
        )
        const adsets = adsetsRes?.data || []
        if (!adsets.length) continue

        const [insRes, insResY] = await Promise.all([
          callMeta(`${account.account_id}/insights`, token, {
            fields: `adset_id,${INSIGHT_FIELDS}`, date_preset, level: 'adset', limit: '500'
          }),
          doCompare ? callMeta(`${account.account_id}/insights`, token, {
            fields: `adset_id,${INSIGHT_FIELDS}`, date_preset: 'yesterday', level: 'adset', limit: '500'
          }) : Promise.resolve(null)
        ])

        const insMap  = Object.fromEntries((insRes?.data  || []).map(x => [x.adset_id, x]))
        const insMapY = Object.fromEntries((insResY?.data || []).map(x => [x.adset_id, x]))

        for (const adset of adsets) {
          const objective = adset.campaign?.objective || ''
          if (filterObjective && objective !== filterObjective) continue
          const today     = parseInsights(insMap[adset.id])
          const yesterday = doCompare ? parseInsights(insMapY[adset.id]) : null
          const dailyBudget    = adset.daily_budget     ? Number(adset.daily_budget)     / 100 : null
          const lifetimeBudget = adset.lifetime_budget  ? Number(adset.lifetime_budget)  / 100 : null
          const budgetRemaining= adset.budget_remaining ? Number(adset.budget_remaining) / 100 : null
          const effectiveBudget = dailyBudget || lifetimeBudget || 0
          const budgetUtilPct   = effectiveBudget > 0 && today.spend > 0
            ? Math.round((today.spend / effectiveBudget) * 100) : 0

          allItems.push({
            id: adset.id, name: adset.name, status: adset.status, effective_status: adset.effective_status,
            campaign_id: adset.campaign?.id || adset.campaign_id,
            campaign_name: adset.campaign?.name || '',
            campaign_status: adset.campaign?.status || '',
            campaign_effective_status: adset.campaign?.effective_status || '',
            objective, level: 'adset',
            account_id: account.account_id, account_name: account.account_name,
            currency: account.currency || 'VND',
            daily_budget: dailyBudget, lifetime_budget: lifetimeBudget,
            budget_remaining: budgetRemaining, budget_util_pct: budgetUtilPct,
            ...today,
            ...(doCompare && {
              yesterday_spend: yesterday?.spend ?? 0, yesterday_purchases: yesterday?.purchases ?? 0,
              yesterday_cpa: yesterday?.cpa ?? 0, yesterday_roas: yesterday?.roas ?? 0,
              yesterday_revenue: yesterday?.revenue ?? 0,
            })
          })
        }
      }
    } catch (err) {
      console.error('[campaigns] Error for account', account.account_id, err)
    }
  }

  allItems.sort((a, b) => {
    const aAct = a.effective_status === 'ACTIVE' ? 0 : 1
    const bAct = b.effective_status === 'ACTIVE' ? 0 : 1
    if (aAct !== bAct) return aAct - bAct
    return b.spend - a.spend
  })

  return res.json({ ok: true, adsets: allItems, accounts: targetAccounts })
}
