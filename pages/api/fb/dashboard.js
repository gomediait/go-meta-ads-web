import { getUserFromReq } from '../../../lib/auth'
import { getSupabase } from '../../../lib/supabase'
import { getUserFbData, callMeta, callMetaAll } from '../../../lib/metaApi'

// In-memory cache: key → { data, ts }
const cache = new Map()
const CACHE_TTL = 60_000

function getCacheKey(userId, accountId, range, since, until) {
  return `${userId}:${accountId || 'all'}:${range || ''}:${since || ''}:${until || ''}`
}

function getDateRange(range) {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  let since, until, days

  switch (range) {
    case '7d':
      days = 7
      break
    case '30d':
      days = 30
      break
    case 'this_month':
      since = today.slice(0, 8) + '01'
      until = today
      days = Math.ceil((now - new Date(since)) / 86400000) + 1
      return { since, until, days, isPartial: true }
    default:
      days = 7
  }

  const sinceDate = new Date(now)
  sinceDate.setDate(sinceDate.getDate() - days)
  since = sinceDate.toISOString().slice(0, 10)
  until = today

  return { since, until, days, isPartial: true }
}

function getCompareRange(since, until, days) {
  const s = new Date(since)
  s.setDate(s.getDate() - days)
  const u = new Date(until)
  u.setDate(u.getDate() - days)
  return { since: s.toISOString().slice(0, 10), until: u.toISOString().slice(0, 10) }
}

function fmtLevel(freq) {
  if (freq > 5) return 'danger'
  if (freq > 3) return 'warning'
  return 'ok'
}

const OBJECTIVE_RESULT_MAP = {
  OUTCOME_SALES:       ['purchase', 'omni_purchase'],
  OUTCOME_LEADS:       ['lead', 'complete_registration', 'onsite_conversion.messaging_first_reply'],
  OUTCOME_ENGAGEMENT:  ['post_engagement', 'page_engagement', 'video_view'],
  OUTCOME_TRAFFIC:     ['link_click', 'landing_page_view'],
  OUTCOME_AWARENESS:   ['reach', 'impressions'],
  OUTCOME_APP_PROMOTION: ['app_install', 'omni_app_install'],
}

function extractResults(actions, objective) {
  if (!Array.isArray(actions)) return 0
  const preferred = OBJECTIVE_RESULT_MAP[objective]
  if (preferred) {
    for (const t of preferred) {
      const found = actions.find(a => a.action_type === t)
      if (found) return Number(found.value) || 0
    }
  }
  const fallback = ['purchase', 'lead', 'complete_registration', 'link_click', 'landing_page_view', 'post_engagement']
  for (const t of fallback) {
    const found = actions.find(a => a.action_type === t)
    if (found) return Number(found.value) || 0
  }
  return 0
}

function extractPurchaseRoas(actionRoas) {
  if (!Array.isArray(actionRoas)) return null
  const purchase = actionRoas.find(a => a.action_type === 'omni_purchase')
    || actionRoas.find(a => a.action_type === 'purchase')
  return purchase ? Number(purchase.value) || null : null
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { range = '7d', account_id, since: qSince, until: qUntil } = req.query

  const sb = getSupabase()
  const fbData = await getUserFbData(user.id, sb)

  if (!fbData) {
    return res.json({ ok: true, empty: true })
  }

  const { token, accounts, conn } = fbData

  if (conn.token_expires_at && new Date(conn.token_expires_at) < new Date()) {
    return res.status(401).json({ ok: false, error: 'token_expired', message: 'Token Facebook đã hết hạn. Vui lòng kết nối lại.' })
  }

  // Filter accounts
  const targetAccounts = account_id
    ? accounts.filter(a => a.account_id === account_id)
    : accounts

  if (!targetAccounts.length) {
    return res.json({ ok: true, empty: true })
  }

  // Date ranges
  let dateRange
  if (qSince && qUntil) {
    const days = Math.ceil((new Date(qUntil) - new Date(qSince)) / 86400000) + 1
    dateRange = { since: qSince, until: qUntil, days, isPartial: qUntil >= new Date().toISOString().slice(0, 10) }
  } else {
    dateRange = getDateRange(range)
  }
  const compareRange = getCompareRange(dateRange.since, dateRange.until, dateRange.days)

  // Check cache
  const cacheKey = getCacheKey(user.id, account_id, range, qSince, qUntil)
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return res.json(cached.data)
  }

  // Fetch data from Meta API — target ≤5 calls total
  // 1. Current period insights (Block 1 + 2 + 3)
  // 2. Previous period insights (Block 1 comparison)
  // 3. Campaigns with nested insights (Block 4)
  // All accounts in parallel within each call

  const insightFields = 'spend,impressions,reach,inline_link_clicks,cpm,cost_per_inline_link_click,actions,purchase_roas,frequency'
  const campaignFields = 'name,status,effective_status,objective,insights{spend,impressions,reach,frequency,inline_link_clicks,cost_per_inline_link_click,purchase_roas,actions}'
  const diagnosticFields = 'campaign_id,impressions,quality_ranking,engagement_rate_ranking,conversion_rate_ranking'

  try {
    const allResults = await Promise.allSettled(
      targetAccounts.flatMap(account => [
        // [0] Current period aggregate
        callMeta(`${account.account_id}/insights`, token, {
          fields: insightFields,
          time_range: JSON.stringify({ since: dateRange.since, until: dateRange.until }),
        }),
        // [1] Previous period aggregate
        callMeta(`${account.account_id}/insights`, token, {
          fields: insightFields,
          time_range: JSON.stringify({ since: compareRange.since, until: compareRange.until }),
        }),
        // [2] Current period daily (Block 2 trend)
        callMeta(`${account.account_id}/insights`, token, {
          fields: 'spend,actions,purchase_roas',
          time_range: JSON.stringify({ since: dateRange.since, until: dateRange.until }),
          time_increment: '1',
        }),
        // [3] Campaigns with insights (Block 4)
        callMetaAll(`${account.account_id}/campaigns`, token, {
          fields: campaignFields,
          effective_status: '["ACTIVE","PAUSED","CAMPAIGN_PAUSED","IN_PROCESS"]',
          limit: '100',
        }),
        // [4] Ad-level diagnostics — rankings only available at ad level
        callMetaAll(`${account.account_id}/insights`, token, {
          fields: diagnosticFields,
          level: 'ad',
          time_range: JSON.stringify({ since: dateRange.since, until: dateRange.until }),
          filtering: JSON.stringify([{ field: 'impressions', operator: 'GREATER_THAN', value: 499 }]),
        }),
      ])
    )

    // Process results per account (5 calls each)
    let block1Current = { spend: 0, impressions: 0, reach: 0, linkClicks: 0, cpm: 0, cpcLink: 0, frequency: 0 }
    let block1Previous = { spend: 0, impressions: 0, reach: 0, linkClicks: 0, cpm: 0, cpcLink: 0 }
    let currentPurchaseRoas = null
    let previousPurchaseRoas = null
    let currentActions = []
    let previousActions = []
    const block2Daily = []
    const block4Campaigns = []
    const objectives = new Set()

    for (let i = 0; i < targetAccounts.length; i++) {
      const base = i * 5
      const account = targetAccounts[i]

      // Current insights
      const cur = allResults[base]?.status === 'fulfilled' ? allResults[base].value : null
      const curData = cur?.data?.[0]
      if (curData) {
        block1Current.spend += Number(curData.spend) || 0
        block1Current.impressions += Number(curData.impressions) || 0
        block1Current.reach += Number(curData.reach) || 0
        block1Current.linkClicks += Number(curData.inline_link_clicks) || 0
        if (curData.actions) currentActions.push(...curData.actions)
        const roas = extractPurchaseRoas(curData.purchase_roas)
        if (roas !== null) currentPurchaseRoas = (currentPurchaseRoas || 0) + roas
      }

      // Previous insights
      const prev = allResults[base + 1]?.status === 'fulfilled' ? allResults[base + 1].value : null
      const prevData = prev?.data?.[0]
      if (prevData) {
        block1Previous.spend += Number(prevData.spend) || 0
        block1Previous.impressions += Number(prevData.impressions) || 0
        block1Previous.reach += Number(prevData.reach) || 0
        block1Previous.linkClicks += Number(prevData.inline_link_clicks) || 0
        if (prevData.actions) previousActions.push(...prevData.actions)
        const roas = extractPurchaseRoas(prevData.purchase_roas)
        if (roas !== null) previousPurchaseRoas = (previousPurchaseRoas || 0) + roas
      }

      // Daily trend
      const daily = allResults[base + 2]?.status === 'fulfilled' ? allResults[base + 2].value : null
      if (daily?.data) {
        for (const day of daily.data) {
          const existing = block2Daily.find(d => d.date === day.date_start)
          const spend = Number(day.spend) || 0
          const roas = extractPurchaseRoas(day.purchase_roas)
          const results = extractResults(day.actions)
          const costPerResult = results > 0 ? spend / results : null

          if (existing) {
            existing.spend += spend
            if (roas !== null) existing.roas = (existing.roas || 0) + roas
            existing.results += results
            existing.costPerResult = existing.results > 0 ? existing.spend / existing.results : null
          } else {
            block2Daily.push({ date: day.date_start, spend, roas, results, costPerResult })
          }
        }
      }

      // Ad-level diagnostics → pick ranking from ad with highest impressions per campaign
      const diagData = allResults[base + 4]?.status === 'fulfilled' ? allResults[base + 4].value : null
      const campDiagnostics = {}
      if (diagData?.data) {
        for (const ad of diagData.data) {
          const cid = ad.campaign_id
          if (!cid) continue
          const impr = Number(ad.impressions) || 0
          const existing = campDiagnostics[cid]
          if (!existing || impr > existing.topImpressions) {
            campDiagnostics[cid] = {
              quality_ranking: ad.quality_ranking || null,
              engagement_rate_ranking: ad.engagement_rate_ranking || null,
              conversion_rate_ranking: ad.conversion_rate_ranking || null,
              topImpressions: impr,
            }
          }
        }
      }

      // Campaigns
      const camps = allResults[base + 3]?.status === 'fulfilled' ? allResults[base + 3].value : null
      if (camps?.data) {
        for (const c of camps.data) {
          objectives.add(c.objective)
          const ins = c.insights?.data?.[0] || {}
          const diag = campDiagnostics[c.id] || {}
          block4Campaigns.push({
            id: c.id,
            name: c.name,
            status: c.status,
            effective_status: c.effective_status,
            objective: c.objective,
            account_id: account.account_id,
            account_name: account.account_name,
            spend: Number(ins.spend) || 0,
            impressions: Number(ins.impressions) || 0,
            reach: Number(ins.reach) || 0,
            frequency: Number(ins.frequency) || 0,
            linkClicks: Number(ins.inline_link_clicks) || 0,
            cpcLink: Number(ins.cost_per_inline_link_click) || null,
            purchaseRoas: extractPurchaseRoas(ins.purchase_roas),
            results: extractResults(ins.actions, c.objective),
            costPerResult: null,
            quality_ranking: diag.quality_ranking || null,
            engagement_rate_ranking: diag.engagement_rate_ranking || null,
            conversion_rate_ranking: diag.conversion_rate_ranking || null,
          })
        }
      }
    }

    // Compute derived metrics
    block1Current.frequency = block1Current.reach > 0
      ? block1Current.impressions / block1Current.reach
      : 0
    block1Current.cpm = block1Current.impressions > 0
      ? (block1Current.spend / block1Current.impressions) * 1000
      : 0
    block1Current.cpcLink = block1Current.linkClicks > 0
      ? block1Current.spend / block1Current.linkClicks
      : 0

    block1Previous.frequency = block1Previous.reach > 0
      ? block1Previous.impressions / block1Previous.reach
      : 0

    const isMixedObjectives = objectives.size > 1
    const currentResults = extractResults(currentActions)
    const previousResults = extractResults(previousActions)
    const costPerResult = !isMixedObjectives && currentResults > 0
      ? block1Current.spend / currentResults
      : null
    const prevCostPerResult = !isMixedObjectives && previousResults > 0
      ? block1Previous.spend / previousResults
      : null

    // Campaign cost per result
    for (const c of block4Campaigns) {
      c.costPerResult = c.results > 0 ? c.spend / c.results : null
    }

    // Delta calculations
    function delta(cur, prev) {
      if (prev == null || prev === 0) return cur > 0 ? 100 : 0
      return ((cur - prev) / Math.abs(prev)) * 100
    }

    // Sort daily by date
    block2Daily.sort((a, b) => a.date.localeCompare(b.date))

    // Build response
    const result = {
      ok: true,
      range: {
        since: dateRange.since,
        until: dateRange.until,
        isPartial: dateRange.isPartial,
      },
      compareRange: {
        since: compareRange.since,
        until: compareRange.until,
      },
      currency: targetAccounts[0]?.currency || 'VND',
      block1_kpi: {
        spend: { value: block1Current.spend, previous: block1Previous.spend, deltaPct: +delta(block1Current.spend, block1Previous.spend).toFixed(1) },
        reach: { value: block1Current.reach, previous: block1Previous.reach, deltaPct: +delta(block1Current.reach, block1Previous.reach).toFixed(1) },
        frequency: { value: +block1Current.frequency.toFixed(2), level: fmtLevel(block1Current.frequency) },
        linkClicks: { value: block1Current.linkClicks, previous: block1Previous.linkClicks, deltaPct: +delta(block1Current.linkClicks, block1Previous.linkClicks).toFixed(1) },
        cpm: { value: +block1Current.cpm.toFixed(0), previous: +(block1Previous.impressions > 0 ? (block1Previous.spend / block1Previous.impressions) * 1000 : 0).toFixed(0), deltaPct: +delta(block1Current.cpm, block1Previous.impressions > 0 ? (block1Previous.spend / block1Previous.impressions) * 1000 : 0).toFixed(1) },
        cpcLink: { value: +block1Current.cpcLink.toFixed(0), previous: +(block1Previous.linkClicks > 0 ? block1Previous.spend / block1Previous.linkClicks : 0).toFixed(0), deltaPct: +delta(block1Current.cpcLink, block1Previous.linkClicks > 0 ? block1Previous.spend / block1Previous.linkClicks : 0).toFixed(1) },
        costPerResult: { value: costPerResult ? +costPerResult.toFixed(0) : null, previous: prevCostPerResult ? +prevCostPerResult.toFixed(0) : null, isMixedObjectives },
        purchaseRoas: { value: currentPurchaseRoas ? +currentPurchaseRoas.toFixed(2) : null, previous: previousPurchaseRoas ? +previousPurchaseRoas.toFixed(2) : null },
      },
      block2_trend: { daily: block2Daily },
      block4_campaigns: block4Campaigns,
    }

    // Cache
    cache.set(cacheKey, { data: result, ts: Date.now() })
    // Evict old entries
    if (cache.size > 200) {
      const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts)
      for (let i = 0; i < 50; i++) cache.delete(oldest[i][0])
    }

    return res.json(result)
  } catch (err) {
    console.error('[dashboard API] Error:', err)
    return res.status(500).json({ ok: false, error: 'Internal server error' })
  }
}
