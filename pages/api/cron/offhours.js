import { getSupabase } from '../../../lib/supabase'
import { getUserFbData, callMeta } from '../../../lib/metaApi'

const META_BASE = 'https://graph.facebook.com/v21.0'

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
  const purchases = extractPurchases(ins.actions)
  const revenue = extractRevenue(ins.action_values)
  const cpa = purchases > 0 ? spend / purchases : (spend > 0 ? 999999999 : 0)
  const roas = spend > 0 ? revenue / spend : 0
  return {
    spend, purchases, revenue, cpa, roas,
    impressions: Number(ins.impressions) || 0,
    ctr: Number(ins.ctr) || 0,
  }
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

async function runAutosetRules(sb) {
  const { data: allRules } = await sb
    .from('user_autoset_rules')
    .select('*, users!inner(id)')
    .eq('enabled', true)
    .catch(() => ({ data: [] }))

  if (!allRules?.length) return

  const userIds = [...new Set(allRules.map(r => r.user_id))]

  for (const userId of userIds) {
    const userRules = allRules.filter(r => r.user_id === userId)
    const fbData = await getUserFbData(userId, sb)
    if (!fbData) continue

    const { token, accounts } = fbData

    for (const rule of userRules) {
      const targetAccounts = rule.account_id === 'all'
        ? accounts
        : accounts.filter(a => a.account_id === rule.account_id)

      let affected = 0

      for (const account of targetAccounts) {
        try {
          const adsetsRes = await callMeta(
            `${account.account_id}/adsets`,
            token,
            {
              fields: 'id,name,status,effective_status,daily_budget,lifetime_budget',
              filtering: JSON.stringify([{ field: 'effective_status', operator: 'IN', value: ['ACTIVE', 'PAUSED'] }]),
              limit: '200'
            }
          )

          const adsets = adsetsRes?.data || []
          if (!adsets.length) continue

          const insRes = await callMeta(
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
          for (const ins of (insRes?.data || [])) insMap[ins.adset_id] = ins

          for (const adset of adsets) {
            const metrics = computeMetrics(insMap[adset.id])
            if (!metrics) continue
            const triggered = (rule.conditions || []).every(c =>
              evalCondition(metrics[c.metric] ?? 0, c.operator, c.value)
            )
            if (!triggered) continue

            try {
              if (rule.action === 'pause' && adset.effective_status === 'ACTIVE') {
                const body = new URLSearchParams({ status: 'PAUSED', access_token: token }).toString()
                await fetch(`${META_BASE}/${adset.id}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
                affected++
              } else if (rule.action === 'scale_budget' || rule.action === 'reduce_budget') {
                const daily = adset.daily_budget ? Number(adset.daily_budget) : null
                const lifetime = adset.lifetime_budget ? Number(adset.lifetime_budget) : null
                const current = daily || lifetime
                if (current) {
                  const factor = rule.action === 'scale_budget' ? (Number(rule.scale_factor) || 1.2) : (1 / (Number(rule.scale_factor) || 1.2))
                  const newBudget = Math.round(current * factor)
                  const field = daily ? 'daily_budget' : 'lifetime_budget'
                  const body = new URLSearchParams({ [field]: String(newBudget), access_token: token }).toString()
                  await fetch(`${META_BASE}/${adset.id}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
                  affected++
                }
              }
            } catch (e) {
              console.error('[cron/offhours/autoset] Action error:', adset.id, e)
            }
          }
        } catch (err) {
          console.error('[cron/offhours/autoset] Account error:', account.account_id, err)
        }
      }

      await sb.from('user_autoset_rules').update({
        last_run_at: new Date().toISOString(),
        last_run_summary: affected > 0 ? `${affected} adset bị tác động` : 'Không có adset nào thỏa điều kiện'
      }).eq('id', rule.id)
    }
  }
}

function getVietnamTime() {
  const now = new Date()
  const vnOffset = 7 * 60 * 60 * 1000
  return new Date(now.getTime() + vnOffset)
}

function toHHMM(date) {
  const h = String(date.getUTCHours()).padStart(2, '0')
  const m = String(date.getUTCMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function toDateStr(date) {
  return date.toISOString().slice(0, 10)
}

export default async function handler(req, res) {
  // Verify cron auth: Vercel cron header or Bearer token
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers['authorization']
  const isVercelCron = !!req.headers['x-vercel-cron']
  const isBearerValid = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isVercelCron && !isBearerValid) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const sb = getSupabase()
  const vnNow = getVietnamTime()
  const currentTime = toHHMM(vnNow)
  const todayStr = toDateStr(vnNow)

  // Get all users with offhours enabled
  const { data: allSettings, error } = await sb
    .from('user_offhours')
    .select('*')
    .eq('enabled', true)

  if (error) {
    console.error('[cron/offhours] Error fetching settings:', error)
    return res.status(500).json({ error: 'DB error' })
  }

  const results = []

  for (const settings of allSettings || []) {
    try {
      const fbData = await getUserFbData(settings.user_id, sb)
      if (!fbData) continue

      const { token, accounts } = fbData

      let actionTaken = null

      // Pause logic: current time >= pause_at AND haven't paused today
      if (currentTime >= settings.pause_at && settings.last_pause_run !== todayStr) {
        actionTaken = 'pause'
      }
      // Resume logic: current time >= resume_at AND haven't resumed today
      else if (currentTime >= settings.resume_at && settings.last_resume_run !== todayStr) {
        actionTaken = 'resume'
      }

      if (!actionTaken) continue

      const targetStatus = actionTaken === 'pause' ? 'PAUSED' : 'ACTIVE'
      const filterStatus = actionTaken === 'pause' ? 'ACTIVE' : 'PAUSED'

      let changedCount = 0

      for (const account of accounts) {
        try {
          const filtering = JSON.stringify([
            { field: 'effective_status', operator: 'IN', value: [filterStatus] }
          ])

          const campRes = await callMeta(
            `${account.account_id}/campaigns`,
            token,
            { fields: 'id,name,status', limit: '200', filtering }
          )

          const campaigns = campRes?.data || []

          for (const camp of campaigns) {
            // Apply sp_filter
            if (settings.sp_filter && !camp.name.includes(settings.sp_filter)) {
              continue
            }

            try {
              const url = `https://graph.facebook.com/v21.0/${camp.id}`
              const body = new URLSearchParams({ status: targetStatus, access_token: token }).toString()
              await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body
              })
              changedCount++
            } catch (e) {
              console.error('[cron/offhours] Toggle error:', e)
            }
          }
        } catch (err) {
          console.error('[cron/offhours] Error for account', account.account_id, err)
        }
      }

      // Update last run
      const updateField = actionTaken === 'pause' ? 'last_pause_run' : 'last_resume_run'
      await sb
        .from('user_offhours')
        .update({ [updateField]: todayStr, updated_at: new Date().toISOString() })
        .eq('user_id', settings.user_id)

      results.push({ user_id: settings.user_id, action: actionTaken, changed: changedCount })
    } catch (err) {
      console.error('[cron/offhours] Error for user', settings.user_id, err)
    }
  }

  // Also run autoset rules for all users
  try { await runAutosetRules(sb) } catch (e) { console.error('[cron/offhours] autoset error:', e) }

  return res.json({ ok: true, processed: results.length, results })
}
