import { getUserFromReq } from '../../../lib/auth'
import { getSupabase } from '../../../lib/supabase'
import { getUserFbData, callMeta, callMetaAll } from '../../../lib/metaApi'

const PURCHASE_TYPES  = ['purchase', 'offsite_conversion.fb_pixel_purchase', 'omni_purchase']
const CART_TYPES      = ['add_to_cart', 'omni_add_to_cart']
const CHECKOUT_TYPES  = ['initiate_checkout', 'omni_initiated_checkout']
const VIEW_TYPES      = ['view_content', 'omni_view_content']
const LEAD_TYPES      = ['lead', 'onsite_conversion.lead_grouped']
const MSG_TYPES       = ['messaging_conversation_started_7d', 'onsite_conversion.messaging_conversation_started_7d']
const ENGAGE_TYPES    = ['post_engagement', 'page_engagement']
const REACTION_TYPES  = ['post_reaction']
const COMMENT_TYPES   = ['comment']
const SHARE_TYPES     = ['post']
const VIDEO_TYPES     = ['video_view']
const THRUPLAY_TYPES  = ['video_thruplay_watched']

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

function extractFirstFromArray(arr) {
  if (!arr || !Array.isArray(arr) || !arr.length) return 0
  return Number(arr[0].value) || 0
}

function buildCostMap(costPerActionType) {
  if (!costPerActionType || !Array.isArray(costPerActionType)) return {}
  const map = {}
  for (const item of costPerActionType) {
    map[item.action_type] = parseFloat(item.value) || 0
  }
  return map
}

function costFromMap(costMap, types) {
  for (const t of types) {
    if (costMap[t] != null && costMap[t] > 0) return costMap[t]
  }
  return null
}

function parseInsights(ins) {
  if (!ins) return {}
  const spend       = Number(ins.spend) || 0
  const impressions = Number(ins.impressions) || 0
  const clicks      = Number(ins.clicks) || 0
  const ctr         = Number(ins.ctr) || 0
  const reach       = Number(ins.reach) || 0
  const cpm         = impressions > 0 ? (spend / impressions * 1000) : 0

  // frequency: ưu tiên từ Meta (cross-device dedup), fallback tính tay
  const frequency   = ins.frequency != null ? Number(ins.frequency) || 0
                    : (reach > 0 ? impressions / reach : 0)

  // inline_link_clicks: chính xác hơn link_click từ actions
  const inlineLinkClicks = Number(ins.inline_link_clicks) || 0
  const inlineLinkClickCtr = Number(ins.inline_link_click_ctr) || 0

  // outbound_clicks: click ra ngoài Facebook (array format)
  const outboundClicks = extractFirstFromArray(ins.outbound_clicks)

  // linkClicks: ưu tiên inline_link_clicks, fallback actions
  const linkClicks   = inlineLinkClicks || extractAction(ins.actions, ['link_click', 'outbound_click'])

  const purchases    = extractAction(ins.actions, PURCHASE_TYPES)
  const addToCart    = extractAction(ins.actions, CART_TYPES)
  const checkout     = extractAction(ins.actions, CHECKOUT_TYPES)
  const viewContent  = extractAction(ins.actions, VIEW_TYPES)
  const leads        = extractAction(ins.actions, LEAD_TYPES)
  const messages     = extractAction(ins.actions, MSG_TYPES)
  const engagement   = extractAction(ins.actions, ENGAGE_TYPES)
  const reactions    = extractAction(ins.actions, REACTION_TYPES)
  const comments     = extractAction(ins.actions, COMMENT_TYPES)
  const shares       = extractAction(ins.actions, SHARE_TYPES)
  const videoViews   = extractAction(ins.actions, VIDEO_TYPES)
  const thruplays    = extractAction(ins.actions, THRUPLAY_TYPES)
  const revenue      = extractRevenue(ins.action_values)
  const purchaseRoas = ins.purchase_roas
    ? Number(Array.isArray(ins.purchase_roas) ? ins.purchase_roas[0]?.value : ins.purchase_roas) || 0
    : (spend > 0 && revenue > 0 ? revenue / spend : 0)

  // cost_per_action_type: ưu tiên Meta (attribution chính xác), fallback tính tay
  const costMap        = buildCostMap(ins.cost_per_action_type)
  const cpa            = costFromMap(costMap, PURCHASE_TYPES)  ?? (purchases > 0 ? spend / purchases : 0)
  const cpc            = costFromMap(costMap, ['link_click'])   ?? (clicks > 0 ? spend / clicks : 0)
  const costPerMsg     = costFromMap(costMap, MSG_TYPES)        ?? (messages > 0 ? spend / messages : 0)
  const costPerEngage  = costFromMap(costMap, ENGAGE_TYPES)     ?? (engagement > 0 ? spend / engagement : 0)
  const costPerLead    = costFromMap(costMap, LEAD_TYPES)       ?? (leads > 0 ? spend / leads : 0)

  return {
    spend, impressions, clicks, ctr, reach, frequency, cpm,
    linkClicks, inlineLinkClicks, inlineLinkClickCtr, outboundClicks,
    purchases, addToCart, checkout, viewContent, leads,
    messages, engagement, reactions, comments, shares, videoViews, thruplays,
    revenue, roas: purchaseRoas, cpa, cpc, costPerMsg, costPerEngage, costPerLead,
  }
}

const INSIGHT_FIELDS = [
  'spend', 'impressions', 'clicks', 'ctr', 'reach',
  'actions', 'action_values', 'purchase_roas',
  'frequency', 'inline_link_clicks', 'inline_link_click_ctr',
  'cost_per_action_type', 'outbound_clicks',
].join(',')

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
    since, until,                          // custom date range
    account_id: filterAccountId,
    status: filterStatus  = 'ALL',
    compare        = 'false',
    level          = 'adset',
    campaign_id: filterCampaignId,
    objective: filterObjective,
  } = req.query

  const doCompare   = compare === 'true'
  const isCampaign  = level === 'campaign'
  const targetAccounts = filterAccountId
    ? accounts.filter(a => a.account_id === filterAccountId)
    : accounts

  // Time params — prefer custom range over preset
  const timeParams = (since && until)
    ? { time_range: JSON.stringify({ since, until }) }
    : { date_preset }

  const allItems = []
  const metaErrors = []

  // Meta API returns budgets in minor currency unit (cents) for USD/EUR/etc.
  // For zero-decimal currencies (VND, JPY, KRW, IDR) Meta returns the raw amount directly.
  const ZERO_DECIMAL = new Set(['VND', 'JPY', 'KRW', 'IDR', 'CLP', 'ISK', 'HUF', 'TWD'])

  for (const account of targetAccounts) {
    const budgetDiv = ZERO_DECIMAL.has(account.currency || 'VND') ? 1 : 100

    const parseBudget = (raw) => {
      if (!raw) return null
      const n = Number(raw)
      return n ? n / budgetDiv : null
    }

    try {
      if (isCampaign) {
        // ── INSIGHTS-FIRST: campaign level ──────────────────────────
        // Fetch insights (covers ALL campaigns with spend, including archived/deleted)
        // + current campaign meta in parallel for budget/status
        const [insRes, metaRes, insResY] = await Promise.all([
          callMetaAll(`${account.account_id}/insights`, token, {
            fields: `campaign_id,campaign_name,objective,${INSIGHT_FIELDS}`,
            ...timeParams,
            level: 'campaign',
          }),
          callMetaAll(`${account.account_id}/campaigns`, token, {
            fields: 'id,status,effective_status,objective,daily_budget,lifetime_budget,budget_remaining',
            filtering: JSON.stringify([{ field: 'effective_status', operator: 'IN', value: ['ACTIVE', 'PAUSED', 'ARCHIVED'] }]),
          }),
          doCompare ? callMetaAll(`${account.account_id}/insights`, token, {
            fields: `campaign_id,${INSIGHT_FIELDS}`,
            date_preset: 'yesterday',
            level: 'campaign',
          }) : Promise.resolve(null),
        ])

        if (insRes?.error) {
          const msg = insRes.error.message || JSON.stringify(insRes.error)
          metaErrors.push({ account: account.account_id, error: msg })
          console.error('[campaigns] insights error (campaign):', account.account_id, insRes.error)
        }
        const insData  = insRes?.data  || []
        const metaMap  = Object.fromEntries((metaRes?.data  || []).map(c => [c.id, c]))
        const insMapY  = Object.fromEntries((insResY?.data  || []).map(x => [x.campaign_id, x]))

        for (const ins of insData) {
          const meta            = metaMap[ins.campaign_id] || {}
          const effectiveStatus = meta.effective_status || 'ARCHIVED'

          // Status filter
          if (filterStatus === 'ACTIVE' && effectiveStatus !== 'ACTIVE') continue
          if (filterStatus === 'PAUSED' && !['PAUSED', 'CAMPAIGN_PAUSED'].includes(effectiveStatus)) continue

          const objective = ins.objective || meta.objective || ''
          if (filterObjective && objective !== filterObjective) continue

          const today           = parseInsights(ins)
          const yesterday       = doCompare ? parseInsights(insMapY[ins.campaign_id]) : null
          const dailyBudget     = parseBudget(meta.daily_budget)
          const lifetimeBudget  = parseBudget(meta.lifetime_budget)
          const budgetRemaining = parseBudget(meta.budget_remaining)
          const effectiveBudget = dailyBudget || lifetimeBudget || 0
          const budgetUtilPct   = effectiveBudget > 0 && today.spend > 0
            ? Math.round((today.spend / effectiveBudget) * 100) : 0

          allItems.push({
            id: ins.campaign_id,
            name: ins.campaign_name || ins.campaign_id,
            status: meta.status || effectiveStatus,
            effective_status: effectiveStatus,
            objective, level: 'campaign',
            account_id: account.account_id, account_name: account.account_name,
            currency: account.currency || 'VND',
            daily_budget: dailyBudget, lifetime_budget: lifetimeBudget,
            budget_remaining: budgetRemaining, budget_util_pct: budgetUtilPct,
            ...today,
            ...(doCompare && {
              yesterday_spend:     yesterday?.spend     ?? 0,
              yesterday_purchases: yesterday?.purchases ?? 0,
              yesterday_cpa:       yesterday?.cpa       ?? 0,
              yesterday_roas:      yesterday?.roas      ?? 0,
              yesterday_revenue:   yesterday?.revenue   ?? 0,
            })
          })
        }

      } else {
        // ── INSIGHTS-FIRST: adset level ─────────────────────────────
        const insightFiltering = []
        if (filterCampaignId) {
          insightFiltering.push({ field: 'campaign.id', operator: 'EQUAL', value: filterCampaignId })
        }

        const adsetMetaFiltering = filterCampaignId
          ? [
              { field: 'effective_status', operator: 'IN', value: ['ACTIVE', 'PAUSED', 'CAMPAIGN_PAUSED', 'ARCHIVED'] },
              { field: 'campaign.id', operator: 'EQUAL', value: filterCampaignId }
            ]
          : [{ field: 'effective_status', operator: 'IN', value: ['ACTIVE', 'PAUSED', 'CAMPAIGN_PAUSED', 'ARCHIVED'] }]

        const [insRes, metaRes, insResY] = await Promise.all([
          callMetaAll(`${account.account_id}/insights`, token, {
            fields: `adset_id,adset_name,campaign_id,campaign_name,${INSIGHT_FIELDS}`,
            ...timeParams,
            level: 'adset',
            ...(insightFiltering.length && { filtering: JSON.stringify(insightFiltering) }),
          }),
          callMetaAll(`${account.account_id}/adsets`, token, {
            fields: [
              'id', 'status', 'effective_status', 'campaign_id',
              'campaign{id,name,status,effective_status,objective}',
              'daily_budget', 'lifetime_budget', 'budget_remaining'
            ].join(','),
            filtering: JSON.stringify(adsetMetaFiltering),
          }),
          doCompare ? callMetaAll(`${account.account_id}/insights`, token, {
            fields: `adset_id,${INSIGHT_FIELDS}`,
            date_preset: 'yesterday',
            level: 'adset',
            ...(insightFiltering.length && { filtering: JSON.stringify(insightFiltering) }),
          }) : Promise.resolve(null),
        ])

        if (insRes?.error) {
          const msg = insRes.error.message || JSON.stringify(insRes.error)
          metaErrors.push({ account: account.account_id, error: msg })
          console.error('[campaigns] insights error (adset):', account.account_id, insRes.error)
        }
        const insData = insRes?.data  || []
        const metaMap = Object.fromEntries((metaRes?.data  || []).map(a => [a.id, a]))
        const insMapY = Object.fromEntries((insResY?.data  || []).map(x => [x.adset_id, x]))

        for (const ins of insData) {
          const meta            = metaMap[ins.adset_id] || {}
          const effectiveStatus = meta.effective_status || 'ARCHIVED'
          const objective       = meta.campaign?.objective || ''

          // Status filter
          if (filterStatus === 'ACTIVE' && effectiveStatus !== 'ACTIVE') continue
          if (filterStatus === 'PAUSED' && !['PAUSED', 'CAMPAIGN_PAUSED'].includes(effectiveStatus)) continue
          if (filterObjective && objective !== filterObjective) continue

          const today           = parseInsights(ins)
          const yesterday       = doCompare ? parseInsights(insMapY[ins.adset_id]) : null
          const dailyBudget     = parseBudget(meta.daily_budget)
          const lifetimeBudget  = parseBudget(meta.lifetime_budget)
          const budgetRemaining = parseBudget(meta.budget_remaining)
          const effectiveBudget = dailyBudget || lifetimeBudget || 0
          const budgetUtilPct   = effectiveBudget > 0 && today.spend > 0
            ? Math.round((today.spend / effectiveBudget) * 100) : 0

          allItems.push({
            id: ins.adset_id,
            name: ins.adset_name || ins.adset_id,
            status: meta.status || effectiveStatus,
            effective_status: effectiveStatus,
            campaign_id: ins.campaign_id,
            campaign_name: ins.campaign_name || meta.campaign?.name || '',
            campaign_status: meta.campaign?.status || '',
            campaign_effective_status: meta.campaign?.effective_status || '',
            objective, level: 'adset',
            account_id: account.account_id, account_name: account.account_name,
            currency: account.currency || 'VND',
            daily_budget: dailyBudget, lifetime_budget: lifetimeBudget,
            budget_remaining: budgetRemaining, budget_util_pct: budgetUtilPct,
            ...today,
            ...(doCompare && {
              yesterday_spend:     yesterday?.spend     ?? 0,
              yesterday_purchases: yesterday?.purchases ?? 0,
              yesterday_cpa:       yesterday?.cpa       ?? 0,
              yesterday_roas:      yesterday?.roas      ?? 0,
              yesterday_revenue:   yesterday?.revenue   ?? 0,
            })
          })
        }
      }
    } catch (err) {
      console.error('[campaigns] Error for account', account.account_id, err)
    }
  }

  allItems.sort((a, b) => {
    const aScore = (a.effective_status === 'ACTIVE' ? 2 : 0) + ((a.spend || 0) > 0 ? 1 : 0)
    const bScore = (b.effective_status === 'ACTIVE' ? 2 : 0) + ((b.spend || 0) > 0 ? 1 : 0)
    if (aScore !== bScore) return bScore - aScore
    return (b.spend || 0) - (a.spend || 0)
  })

  return res.json({
    ok: true,
    adsets: allItems,
    accounts: targetAccounts,
    ...(metaErrors.length && { meta_errors: metaErrors })
  })
}
