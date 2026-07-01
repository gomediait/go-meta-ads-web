import { getSupabase } from '../../../lib/supabase'
import { getUserFbData, callMeta } from '../../../lib/metaApi'

const META_BASE = 'https://graph.facebook.com/v23.0'

async function sendRuleNotification(sb, userId, ruleName, affectedItems) {
  try {
    const { data: notif } = await sb
      .from('user_notifications')
      .select('tg_enabled, tg_chat_id, lark_enabled, lark_url, master_enabled')
      .eq('user_id', userId)
      .single()

    if (!notif?.master_enabled) return

    const actionMap = {
      paused: '🔴 Đã tắt',
      resumed: '🟢 Bật lại',
      budget_changed: '💰 Đổi NS',
      notified: '🔔 Cảnh báo'
    }

    const lines = affectedItems.slice(0, 10).map(a => {
      const spend = a.metrics?.spend ? `${Number(a.metrics.spend).toLocaleString('vi-VN')}₫` : '—'
      const prefix = actionMap[a.result] || '⚡'
      return `  • [${prefix}] ${a.adset_name} | Chi: ${spend} | CPA: ${a.metrics?.cpa ? Number(a.metrics.cpa).toLocaleString('vi-VN') + '₫' : '—'} | ROAS: ${a.metrics?.roas || '—'}`
    }).join('\n')
    const more = affectedItems.length > 10 ? `\n  ... và ${affectedItems.length - 10} mục khác` : ''
    const time = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
    const msg = `⚡ <b>Hệ thống Auto-care vừa thực thi Rule</b>\n📋 Rule: <b>${ruleName}</b>\n⏰ ${time}\n\n⚠️ <b>${affectedItems.length}</b> mục bị tác động:\n${lines}${more}\n\n🔗 https://adsmeta.gonetwork.vn/dashboard/automated-rules`

    if (notif.tg_enabled && notif.tg_chat_id) {
      const botToken = process.env.TELEGRAM_BOT_TOKEN
      if (botToken) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: notif.tg_chat_id, text: msg, parse_mode: 'HTML' }),
        }).catch(() => { })
      }
    }

    if (notif.lark_enabled && notif.lark_url) {
      await fetch(notif.lark_url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msg_type: 'text', content: { text: msg.replace(/<[^>]+>/g, '') } }),
      }).catch(() => { })
    }
  } catch { }
}

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
    case 'gt': return val > t
    case 'lt': return val < t
    case 'gte': return val >= t
    case 'lte': return val <= t
    default: return false
  }
}

async function applyRuleAction(entity, rule, token) {
  if (rule.action === 'notify_only') return 'notified'

  if (rule.action === 'pause') {
    if (entity.effective_status !== 'ACTIVE') return 'skipped'
    const body = new URLSearchParams({ status: 'PAUSED', access_token: token }).toString()
    await fetch(`${META_BASE}/${entity.id}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
    return 'paused'
  }

  if (rule.action === 'resume') {
    if (entity.effective_status === 'ACTIVE') return 'skipped'
    if (entity.effective_status === 'CAMPAIGN_PAUSED') return 'skipped'
    const body = new URLSearchParams({ status: 'ACTIVE', access_token: token }).toString()
    await fetch(`${META_BASE}/${entity.id}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
    return 'resumed'
  }

  if (rule.action === 'scale_budget' || rule.action === 'reduce_budget') {
    const daily = entity.daily_budget ? Number(entity.daily_budget) : null
    const lifetime = entity.lifetime_budget ? Number(entity.lifetime_budget) : null
    const current = daily || lifetime
    if (!current) return 'no_budget'
    const factor = rule.action === 'scale_budget' ? (Number(rule.scale_factor) || 1.2) : (1 / (Number(rule.scale_factor) || 1.2))
    let newBudget = Math.round(current * factor)
    const capMin = Number(rule.budget_cap_min) || 0
    const capMax = Number(rule.budget_cap_max) || 0
    if (capMin > 0 && newBudget < capMin) newBudget = capMin
    if (capMax > 0 && newBudget > capMax) newBudget = capMax
    if (newBudget === current) return 'unchanged'
    const field = daily ? 'daily_budget' : 'lifetime_budget'
    const body = new URLSearchParams({ [field]: String(newBudget), access_token: token }).toString()
    await fetch(`${META_BASE}/${entity.id}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
    return 'budget_changed'
  }

  return 'unknown'
}

async function runAutosetRules(sb) {
  const { data: allRules } = await sb
    .from('user_autoset_rules')
    .select('*')
    .eq('enabled', true)

  if (!allRules?.length) return

  const userIds = [...new Set(allRules.map(r => r.user_id))]

  for (const userId of userIds) {
    const userRules = allRules.filter(r => r.user_id === userId)
    const fbData = await getUserFbData(userId, sb)
    if (!fbData) continue

    const { token, accounts } = fbData

    for (const rule of userRules) {
      const isCampaignLevel = rule.level === 'campaign'
      const hasSelectedCamps = Array.isArray(rule.selected_campaigns) && rule.selected_campaigns.length > 0
      const hasSelectedAdsets = Array.isArray(rule.selected_adsets) && rule.selected_adsets.length > 0
      const selectedAdsetSet = hasSelectedAdsets ? new Set(rule.selected_adsets) : null

      const targetAccounts = rule.account_id === 'all'
        ? accounts
        : accounts.filter(a => a.account_id === rule.account_id)

      const affected = []

      for (const account of targetAccounts) {
        try {
          if (isCampaignLevel) {
            const campsRes = await callMeta(`${account.account_id}/campaigns`, token, {
              fields: 'id,name,status,effective_status,daily_budget,lifetime_budget',
              filtering: JSON.stringify([{ field: 'effective_status', operator: 'IN', value: ['ACTIVE', 'PAUSED'] }]),
              limit: '200',
            })
            const insRes = await callMeta(`${account.account_id}/insights`, token, {
              fields: 'campaign_id,spend,impressions,clicks,ctr,actions,action_values',
              date_preset: rule.time_range || 'today', level: 'campaign', limit: '500',
            })
            const insMap = {}
            for (const ins of (insRes?.data || [])) insMap[ins.campaign_id] = ins

            for (const camp of (campsRes?.data || [])) {
              if (hasSelectedCamps && !rule.selected_campaigns.includes(camp.id)) continue
              const metrics = computeMetrics(insMap[camp.id])
              if (!metrics) continue
              if (!(rule.conditions || []).every(c => evalCondition(metrics[c.metric] ?? 0, c.operator, c.value))) continue
              try {
                const result = await applyRuleAction(camp, rule, token)
                if (result !== 'skipped' && result !== 'unchanged') {
                  affected.push({ adset_id: camp.id, adset_name: camp.name, result, metrics: { spend: Math.round(metrics.spend), cpa: metrics.cpa >= 999999999 ? null : Math.round(metrics.cpa), roas: Math.round(metrics.roas * 100) / 100 } })
                }
              } catch (e) { console.error('[cron/autoset] Campaign error:', camp.id, e) }
            }
          } else {
            const adsetsRes = await callMeta(`${account.account_id}/adsets`, token, {
              fields: 'id,name,status,effective_status,daily_budget,lifetime_budget,campaign_id',
              filtering: JSON.stringify([{ field: 'effective_status', operator: 'IN', value: ['ACTIVE', 'PAUSED', 'CAMPAIGN_PAUSED'] }]),
              limit: '200',
            })
            const insRes = await callMeta(`${account.account_id}/insights`, token, {
              fields: 'adset_id,spend,impressions,clicks,ctr,actions,action_values',
              date_preset: rule.time_range || 'today', level: 'adset', limit: '500',
            })
            const insMap = {}
            for (const ins of (insRes?.data || [])) insMap[ins.adset_id] = ins

            for (const adset of (adsetsRes?.data || [])) {
              if (hasSelectedAdsets) { if (!selectedAdsetSet.has(adset.id)) continue }
              else if (hasSelectedCamps) { if (!rule.selected_campaigns.includes(adset.campaign_id)) continue }
              const metrics = computeMetrics(insMap[adset.id])
              if (!metrics) continue
              if (!(rule.conditions || []).every(c => evalCondition(metrics[c.metric] ?? 0, c.operator, c.value))) continue
              try {
                const result = await applyRuleAction(adset, rule, token)
                if (result !== 'skipped' && result !== 'unchanged') {
                  affected.push({ adset_id: adset.id, adset_name: adset.name, result, metrics: { spend: Math.round(metrics.spend), cpa: metrics.cpa >= 999999999 ? null : Math.round(metrics.cpa), roas: Math.round(metrics.roas * 100) / 100 } })
                }
              } catch (e) { console.error('[cron/autoset] Adset error:', adset.id, e) }
            }
          }
        } catch (err) {
          console.error('[cron/autoset] Account error:', account.account_id, err)
        }
      }

      const label = isCampaignLevel ? 'campaign' : 'adset'
      const summary = affected.length > 0 ? `${affected.length} ${label} bị tác động` : `Không có ${label} nào thỏa điều kiện`

      if (affected.length > 0) {
        await sendRuleNotification(sb, userId, rule.name, affected)
      }

      if (affected.length > 0) {
        try {
          await sb.from('autoset_rule_logs').insert({
            user_id: userId, rule_id: rule.id, rule_name: rule.name,
            action: rule.action, affected_count: affected.length, details: affected,
          })
        } catch { }
      }

      await sb.from('user_autoset_rules').update({
        last_run_at: new Date().toISOString(),
        last_run_summary: summary,
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

  try {
    await runAutosetRules(sb)
    return res.json({ ok: true })
  } catch (e) {
    console.error('[cron/rules] autoset error:', e)
    return res.status(500).json({ error: e.message })
  }
}
