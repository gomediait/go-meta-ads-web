import { getSupabase } from '../../../lib/supabase'
import { getUserFbData, callMeta } from '../../../lib/metaApi'

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
            `act_${account.account_id}/campaigns`,
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
              const url = `https://graph.facebook.com/v18.0/${camp.id}`
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

  return res.json({ ok: true, processed: results.length, results })
}
