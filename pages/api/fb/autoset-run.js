import { getUserFromReq } from '../../../lib/auth'
import { getSupabase } from '../../../lib/supabase'
import { getUserFbData, callMeta } from '../../../lib/metaApi'

const META_BASE = 'https://graph.facebook.com/v23.0'

async function sendTelegram(chatId, text) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken || !chatId) return
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    })
  } catch (e) { console.error('[autoset-run] Telegram error:', e) }
}

async function sendLark(webhookUrl, text) {
  if (!webhookUrl) return
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msg_type: 'text', content: { text } })
    })
  } catch (e) { console.error('[autoset-run] Lark error:', e) }
}

async function sendNotification(sb, userId, ruleName, affectedAdsets) {
  const { data: notif } = await sb
    .from('user_notifications')
    .select('tg_enabled, tg_chat_id, lark_enabled, lark_url, master_enabled')
    .eq('user_id', userId)
    .single()

  if (!notif?.master_enabled) return

  const adsetLines = affectedAdsets.slice(0, 10).map(a => {
    const spend = a.metrics.spend ? `${Number(a.metrics.spend).toLocaleString('vi-VN')}₫` : '—'
    const cpa = a.metrics.cpa ? `${Number(a.metrics.cpa).toLocaleString('vi-VN')}₫` : '—'
    return `  • ${a.adset_name} | Chi: ${spend} | KQ: ${a.metrics.results || 0} | CPA: ${cpa}`
  }).join('\n')

  const more = affectedAdsets.length > 10 ? `\n  ... và ${affectedAdsets.length - 10} adset khác` : ''
  const time = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })

  const message = [
    `🔔 <b>Cảnh báo Quy tắc tự động</b>`,
    `📋 Rule: <b>${ruleName}</b>`,
    `⏰ ${time}`,
    ``,
    `⚠️ <b>${affectedAdsets.length} adset</b> thỏa điều kiện:`,
    adsetLines,
    more,
    ``,
    `🔗 Xem chi tiết: https://adsmeta.gonetwork.vn/dashboard/automated-rules`
  ].filter(Boolean).join('\n')

  if (notif.tg_enabled && notif.tg_chat_id) {
    await sendTelegram(notif.tg_chat_id, message)
  }

  if (notif.lark_enabled && notif.lark_url) {
    await sendLark(notif.lark_url, message.replace(/<[^>]+>/g, ''))
  }
}

function extractResults(actions) {
  if (!actions || !Array.isArray(actions)) return 0
  const TYPES = ['onsite_conversion.messaging_conversation_started_7d', 'lead', 'purchase', 'offsite_conversion.fb_pixel_purchase', 'omni_purchase']
  let total = 0
  for (const t of TYPES) {
    const found = actions.find(a => a.action_type === t)
    if (found) total += Number(found.value) || 0
  }
  return total
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
  const results = extractResults(ins.actions)
  const revenue = extractRevenue(ins.action_values)
  // Nếu có tiêu tiền nhưng không có kết quả, CPA sẽ bị gán số cực lớn để tự động kích hoạt rule "Tắt khi CPA > threshold"
  const cpa = results > 0 ? spend / results : (spend > 0 ? 999999999 : 0)
  const roas = spend > 0 ? revenue / spend : 0
  return { spend, impressions, clicks, ctr, results, revenue, cpa, roas }
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
  if (rule.action === 'notify_only') {
    return 'notified'
  }

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

  if (rule.action === 'resume') {
    if (adset.effective_status === 'ACTIVE') return 'skipped_already_active'
    if (adset.effective_status === 'CAMPAIGN_PAUSED') return 'skipped_campaign_paused'
    const body = new URLSearchParams({ status: 'ACTIVE', access_token: token }).toString()
    await fetch(`${META_BASE}/${adset.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    })
    return 'resumed'
  }

  if (rule.action === 'scale_budget' || rule.action === 'reduce_budget') {
    const dailyBudget = adset.daily_budget ? Number(adset.daily_budget) : null
    const lifetimeBudget = adset.lifetime_budget ? Number(adset.lifetime_budget) : null
    const currentBudget = dailyBudget || lifetimeBudget
    if (!currentBudget) return 'no_budget'

    const factor = rule.action === 'scale_budget'
      ? (Number(rule.scale_factor) || 1.2)
      : (1 / (Number(rule.scale_factor) || 1.2))
    let newBudget = Math.round(currentBudget * factor)

    const capMin = Number(rule.budget_cap_min) || 0
    const capMax = Number(rule.budget_cap_max) || 0
    if (capMin > 0 && newBudget < capMin) newBudget = capMin
    if (capMax > 0 && newBudget > capMax) newBudget = capMax
    if (newBudget === currentBudget) return 'budget_unchanged_cap'

    const budgetField = dailyBudget ? 'daily_budget' : 'lifetime_budget'
    const body = new URLSearchParams({ [budgetField]: String(newBudget), access_token: token }).toString()
    await fetch(`${META_BASE}/${adset.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    })
    return `budget_${currentBudget}_→_${newBudget}`
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
  const isDryRun = req.body?.dry_run === true

  const { data: rules } = await sb
    .from('user_autoset_rules')
    .select('*')
    .eq('user_id', user.id)
    .eq('enabled', true)

  if (!rules?.length) {
    return res.json({ ok: true, message: 'Không có rule nào được bật', results: [], dry_run: isDryRun })
  }

  const allResults = []

  for (const rule of rules) {
    const hasSelectedCamps = Array.isArray(rule.selected_campaigns) && rule.selected_campaigns.length > 0
    const hasSelectedAdsets = Array.isArray(rule.selected_adsets) && rule.selected_adsets.length > 0
    const selectedAdsetSet = hasSelectedAdsets ? new Set(rule.selected_adsets) : null

    const isCampaignLevel = rule.level === 'campaign'

    const targetAccounts = rule.account_id === 'all'
      ? accounts
      : accounts.filter(a => a.account_id === rule.account_id)

    const affected = []
    let debugAdsetsTotal = 0
    let debugInsightsTotal = 0
    let debugSkippedNoInsights = 0
    let debugSkippedCondition = 0

    for (const account of targetAccounts) {
      try {
        if (isCampaignLevel) {
          // ── CAMPAIGN LEVEL ─────────────────────────────
          const campsRes = await callMeta(
            `${account.account_id}/campaigns`,
            token,
            {
              fields: 'id,name,status,effective_status,daily_budget,lifetime_budget',
              filtering: JSON.stringify([
                { field: 'effective_status', operator: 'IN', value: ['ACTIVE', 'PAUSED'] }
              ]),
              limit: '200'
            }
          )

          const camps = campsRes?.data || []
          if (!camps.length) continue

          const insightsRes = await callMeta(
            `${account.account_id}/insights`,
            token,
            {
              fields: 'campaign_id,spend,impressions,clicks,ctr,actions,action_values',
              date_preset: rule.time_range || 'today',
              level: 'campaign',
              limit: '500'
            }
          )

          const insMap = {}
          for (const ins of (insightsRes?.data || [])) {
            insMap[ins.campaign_id] = ins
          }

          debugAdsetsTotal += camps.length
          debugInsightsTotal += Object.keys(insMap).length

          for (const camp of camps) {
            if (hasSelectedCamps && !rule.selected_campaigns.includes(camp.id)) continue

            const metrics = computeMetrics(insMap[camp.id])
            if (!metrics) { debugSkippedNoInsights++; continue }
            if (!ruleTriggered(metrics, rule.conditions)) { debugSkippedCondition++; continue }

            try {
              const result = isDryRun ? `dry_run_${rule.action}` : await applyAction(camp, rule, token)
              affected.push({
                adset_id: camp.id,
                adset_name: camp.name,
                account_id: account.account_id,
                result,
                metrics: {
                  spend: Math.round(metrics.spend),
                  results: metrics.results,
                  cpa: metrics.cpa >= 999999999 ? null : Math.round(metrics.cpa),
                  roas: Math.round(metrics.roas * 100) / 100
                }
              })
            } catch (e) {
              console.error('[autoset-run] Campaign action error:', camp.id, e)
            }
          }

        } else {
          // ── ADSET LEVEL (existing) ─────────────────────
          const adsetsRes = await callMeta(
            `${account.account_id}/adsets`,
            token,
            {
              fields: 'id,name,status,effective_status,daily_budget,lifetime_budget,campaign_id',
              filtering: JSON.stringify([
                { field: 'effective_status', operator: 'IN', value: ['ACTIVE', 'PAUSED', 'CAMPAIGN_PAUSED'] }
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

          debugAdsetsTotal += adsets.length
          debugInsightsTotal += Object.keys(insMap).length

          for (const adset of adsets) {
            if (hasSelectedAdsets) {
              if (!selectedAdsetSet.has(adset.id)) continue
            } else if (hasSelectedCamps) {
              if (!rule.selected_campaigns.includes(adset.campaign_id)) continue
            }

            const metrics = computeMetrics(insMap[adset.id])
            if (!metrics) { debugSkippedNoInsights++; continue }
            if (!ruleTriggered(metrics, rule.conditions)) { debugSkippedCondition++; continue }

            try {
              const result = isDryRun ? `dry_run_${rule.action}` : await applyAction(adset, rule, token)
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
        } // end else (adset level)
      } catch (err) {
        console.error('[autoset-run] Account error:', account.account_id, err)
      }
    }

    const entityLabel = isCampaignLevel ? 'campaign' : 'adset'
    const summary = affected.length > 0
      ? `${affected.length} ${entityLabel} ${isDryRun ? 'sẽ bị tác động (dry-run)' : 'bị tác động'}`
      : `Không có ${entityLabel} nào thỏa điều kiện`

    let logError = null

    if (!isDryRun) {
      // Gửi thông báo nếu notify_only
      if (rule.action === 'notify_only' && affected.length > 0) {
        try {
          await sendNotification(sb, user.id, rule.name, affected)
        } catch (e) {
          console.error('[autoset-run] Notification error:', e)
        }
      }

      // Lưu log
      const { error: insertErr } = await sb.from('autoset_rule_logs').insert({
        user_id: user.id,
        rule_id: rule.id,
        rule_name: rule.name,
        action: rule.action,
        affected_count: affected.length,
        details: affected,
      })
      logError = insertErr
      if (logError) {
        console.error('[autoset-run] Log insert error:', logError)
      }

      await sb.from('user_autoset_rules').update({
        last_run_at: new Date().toISOString(),
        last_run_summary: summary,
      }).eq('id', rule.id)
    }

    allResults.push({
      rule_id: rule.id, rule_name: rule.name, affected, summary,
      _log_error: logError ? logError.message : null,
      _debug: {
        time_range: rule.time_range,
        adsets_total: debugAdsetsTotal,
        insights_total: debugInsightsTotal,
        skipped_filter: debugAdsetsTotal - debugSkippedNoInsights - debugSkippedCondition - affected.length,
        skipped_no_insights: debugSkippedNoInsights,
        skipped_condition: debugSkippedCondition,
        matched: affected.length,
      }
    })
  }

  return res.json({
    ok: true,
    dry_run: isDryRun,
    results: allResults,
    total_affected: allResults.reduce((s, r) => s + r.affected.length, 0),
  })
}
