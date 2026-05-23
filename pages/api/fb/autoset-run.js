import { getUserFromReq } from '../../../lib/auth'
import { getSupabase } from '../../../lib/supabase'
import { getUserFbData, callMeta } from '../../../lib/metaApi'

const META_BASE = 'https://graph.facebook.com/v18.0'

function extractPurchases(actions) {
  if (!actions || !Array.isArray(actions)) return 0
  const TYPES = ['purchase', 'offsite_conversion.fb_pixel_purchase', 'omni_purchase']
  for (const t of TYPES) {
    const found = actions.find(a => a.action_type === t)
    if (found) return Number(found.value) || 0
  }
  return 0
}

function extractRevenue(actionValues) {
  if (!actionValues || !Array.isArray(actionValues)) return 0
  const TYPES = ['purchase', 'offsite_conversion.fb_pixel_purchase', 'omni_purchase']
  for (const t of TYPES) {
    const found = actionValues.find(a => a.action_type === t)
    if (found) return Number(found.value) || 0
  }
  return 0
}

function computeMetrics(ins) {
  if (!ins) return null
  const spend = Number(ins.spend) || 0
  const impressions = Number(ins.impressions) || 0
  const clicks = Number(ins.clicks) || 0
  const ctr = Number(ins.ctr) || 0
  const purchases = extractPurchases(ins.actions)
  const revenue = extractRevenue(ins.action_values)
  // If no purchases but spent money, CPA is treated as very high (Infinity → use large sentinel)
  const cpa = purchases > 0 ? spend / purchases : (spend > 0 ? 999999999 : 0)
  const roas = spend > 0 ? revenue / spend : 0
  return { spend, impressions, clicks, ctr, purchases, revenue, cpa, roas }
}

function evalCondition(val, op, threshold) {
  const t = Number(threshold)
  switch (op) {
    case 'gt':  return val > t
    case 'lt':  return val < t
    case 'gte': return val >= t
    case 'lte': return val <= t
    default:    return false
  }
}

function ruleTriggered(metrics, conditions) {
  if (!conditions?.length) return false
  return conditions.every(c => evalCondition(metrics[c.metric] ?? 0, c.operator, c.value))
}

async function applyAction(adset, rule, token) {
  if (rule.action === 'pause') {
    if (adset.effective_status !== 'ACTIVE') return 'skipped_not_active'
    const body = new URLSearchParams({ status: 'PAUSED', access_token: token }).toString()
    await fetch(`${META_BASE}/${adset.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    })
    return 'paused'
  }

  if (rule.action === 'scale_budget' || rule.action === 'reduce_budget') {
    const dailyBudget = adset.daily_budget ? Number(adset.daily_budget) : null
    const lifetimeBudget = adset.lifetime_budget ? Number(adset.lifetime_budget) : null
    const currentBudgetCents = dailyBudget || lifetimeBudget
    if (!currentBudgetCents) return 'no_budget'

    const factor = rule.action === 'scale_budget'
      ? (Number(rule.scale_factor) || 1.2)
      : (1 / (Number(rule.scale_factor) || 1.2))
    const newBudgetCents = Math.round(currentBudgetCents * factor)
    const budgetField = dailyBudget ? 'daily_budget' : 'lifetime_budget'

    const body = new URLSearchParams({ [budgetField]: String(newBudgetCents), access_token: token }).toString()
    await fetch(`${META_BASE}/${adset.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    })
    const oldVnd = Math.round(currentBudgetCents / 100)
    const newVnd = Math.round(newBudgetCents / 100)
    return `budget_${oldVnd}_→_${newVnd}`
  }

  return 'unknown_action'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' })

  const sb = getSupabase()
  const fbData = await getUserFbData(user.id, sb)
  if (!fbData) return res.status(400).json({ error: 'Chưa kết nối Facebook Ads' })

  const { token, accounts } = fbData

  const { data: rules } = await sb
    .from('user_autoset_rules')
    .select('*')
    .eq('user_id', user.id)
    .eq('enabled', true)

  if (!rules?.length) {
    return res.json({ ok: true, message: 'Không có rule nào được bật', results: [] })
  }

  const allResults = []

  for (const rule of rules) {
    const targetAccounts = rule.account_id === 'all'
      ? accounts
      : accounts.filter(a => a.account_id === rule.account_id)

    const affected = []

    for (const account of targetAccounts) {
      try {
        const adsetsRes = await callMeta(
          `${account.account_id}/adsets`,
          token,
          {
            fields: 'id,name,status,effective_status,daily_budget,lifetime_budget',
            filtering: JSON.stringify([
              { field: 'effective_status', operator: 'IN', value: ['ACTIVE', 'PAUSED'] }
            ]),
            limit: '200'
          }
        )

        const adsets = adsetsRes?.data || []
        if (!adsets.length) continue

        const insightsRes = await callMeta(
          `${account.account_id}/insights`,
          token,
          {
            fields: 'adset_id,spend,impressions,clicks,ctr,actions,action_values',
            date_preset: rule.time_range || 'today',
            level: 'adset',
            limit: '500'
          }
        )

        const insMap = {}
        for (const ins of (insightsRes?.data || [])) {
          insMap[ins.adset_id] = ins
        }

        for (const adset of adsets) {
          const metrics = computeMetrics(insMap[adset.id])
          if (!metrics) continue
          if (!ruleTriggered(metrics, rule.conditions)) continue

          try {
            const result = await applyAction(adset, rule, token)
            affected.push({
              adset_id: adset.id,
              adset_name: adset.name,
              account_id: account.account_id,
              result,
              metrics: {
                spend: Math.round(metrics.spend),
                purchases: metrics.purchases,
                cpa: metrics.cpa >= 999999999 ? null : Math.round(metrics.cpa),
                roas: Math.round(metrics.roas * 100) / 100
              }
            })
          } catch (e) {
            console.error('[autoset-run] Action error:', adset.id, e)
          }
        }
      } catch (err) {
        console.error('[autoset-run] Account error:', account.account_id, err)
      }
    }

    const summary = affected.length > 0
      ? `${affected.length} adset bị tác động`
      : 'Không có adset nào thỏa điều kiện'

    await sb.from('user_autoset_rules').update({
      last_run_at: new Date().toISOString(),
      last_run_summary: summary
    }).eq('id', rule.id)

    allResults.push({ rule_id: rule.id, rule_name: rule.name, affected, summary })
  }

  return res.json({
    ok: true,
    results: allResults,
    total_affected: allResults.reduce((s, r) => s + r.affected.length, 0)
  })
}
