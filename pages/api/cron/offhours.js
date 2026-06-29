import { getSupabase } from '../../../lib/supabase'
import { getUserFbData, callMeta } from '../../../lib/metaApi'

const META_BASE = 'https://graph.facebook.com/v23.0'



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

  // Get all enabled autocare rules
  const { data: allRules, error } = await sb
    .from('user_autocare_rules')
    .select('*')
    .eq('enabled', true)

  if (error) {
    console.error('[cron/offhours] Error fetching autocare rules:', error)
    return res.status(500).json({ error: 'DB error' })
  }

  const results = []

  // Group rules by user_id to reuse fbData
  const rulesByUser = {}
  for (const rule of allRules || []) {
    if (!rulesByUser[rule.user_id]) rulesByUser[rule.user_id] = []
    rulesByUser[rule.user_id].push(rule)
  }

  for (const [userId, userRules] of Object.entries(rulesByUser)) {
    try {
      const fbData = await getUserFbData(userId, sb)
      if (!fbData) continue

      const { token, accounts } = fbData

      for (const rule of userRules) {
        try {
          let actionTaken = null

          if (rule.pause_at > rule.resume_at) {
            if ((currentTime >= rule.pause_at || currentTime < rule.resume_at) && rule.last_pause_run !== todayStr) {
              actionTaken = 'pause'
            } else if (currentTime >= rule.resume_at && currentTime < rule.pause_at && rule.last_resume_run !== todayStr) {
              actionTaken = 'resume'
            }
          } else {
            if (currentTime >= rule.pause_at && currentTime < rule.resume_at && rule.last_pause_run !== todayStr) {
              actionTaken = 'pause'
            } else if (currentTime >= rule.resume_at && rule.last_resume_run !== todayStr) {
              actionTaken = 'resume'
            }
          }

          if (!actionTaken) continue

          const targetStatus = actionTaken === 'pause' ? 'PAUSED' : 'ACTIVE'
          const filterStatus = actionTaken === 'pause' ? 'ACTIVE' : 'PAUSED'
          const hasSelectedCamps = Array.isArray(rule.selected_campaigns) && rule.selected_campaigns.length > 0
          const hasSelectedAdsets = Array.isArray(rule.selected_adsets) && rule.selected_adsets.length > 0
          const selectedAdsetSet = new Set(rule.selected_adsets || [])

          let changedCampaigns = 0
          let changedAdsets = 0

          for (const account of accounts) {
            try {
              const filtering = JSON.stringify([
                { field: 'effective_status', operator: 'IN', value: [filterStatus] }
              ])

              const campRes = await callMeta(
                `${account.account_id}/campaigns`, token,
                { fields: 'id,name,status', limit: '200', filtering }
              )

              for (const camp of (campRes?.data || [])) {
                if (hasSelectedCamps) {
                  if (!rule.selected_campaigns.includes(camp.id)) continue
                } else if (!hasSelectedAdsets) {
                  // No filter → apply to all
                } else {
                  continue
                }

                try {
                  const body = new URLSearchParams({ status: targetStatus, access_token: token }).toString()
                  await fetch(`${META_BASE}/${camp.id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body
                  })
                  changedCampaigns++
                } catch (e) {
                  console.error('[cron/offhours] Campaign toggle error:', e)
                }
              }

              if (hasSelectedAdsets) {
                const adsetFiltering = JSON.stringify([
                  { field: 'effective_status', operator: 'IN', value: actionTaken === 'pause' ? ['ACTIVE'] : ['PAUSED', 'CAMPAIGN_PAUSED'] }
                ])

                const adsetRes = await callMeta(
                  `${account.account_id}/adsets`, token,
                  { fields: 'id,name,status,effective_status', limit: '500', filtering: adsetFiltering }
                )

                for (const adset of (adsetRes?.data || [])) {
                  if (!selectedAdsetSet.has(adset.id)) continue
                  if (actionTaken === 'resume' && adset.effective_status === 'CAMPAIGN_PAUSED') continue

                  try {
                    const body = new URLSearchParams({ status: targetStatus, access_token: token }).toString()
                    await fetch(`${META_BASE}/${adset.id}`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                      body
                    })
                    changedAdsets++
                  } catch (e) {
                    console.error('[cron/offhours] Adset toggle error:', e)
                  }
                }
              }
            } catch (err) {
              console.error('[cron/offhours] Error for account', account.account_id, err)
            }
          }

          const updateField = actionTaken === 'pause' ? 'last_pause_run' : 'last_resume_run'
          await sb
            .from('user_autocare_rules')
            .update({ [updateField]: todayStr, updated_at: new Date().toISOString() })
            .eq('id', rule.id)

          results.push({ user_id: userId, rule_id: rule.id, rule_name: rule.name, action: actionTaken, changed: changedCampaigns + changedAdsets })
        } catch (err) {
          console.error('[cron/offhours] Error for rule', rule.id, err)
        }
      }
    } catch (err) {
      console.error('[cron/offhours] Error for user', userId, err)
    }
  }



  return res.json({ ok: true, processed: results.length, results })
}
