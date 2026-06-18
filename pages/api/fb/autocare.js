import { getUserFromReq } from '../../../lib/auth'
import { getSupabase } from '../../../lib/supabase'
import { getUserFbData, callMeta } from '../../../lib/metaApi'

function getVietnamTime() {
  const now = new Date()
  // UTC+7
  const vnOffset = 7 * 60 * 60 * 1000
  const vnTime = new Date(now.getTime() + vnOffset)
  return vnTime
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
  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' })

  const sb = getSupabase()

  if (req.method === 'GET') {
    const { data, error } = await sb
      .from('user_offhours')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      // Return defaults
      return res.json({
        ok: true,
        settings: {
          enabled: false,
          pause_at: '22:00',
          resume_at: '06:00',
          sp_filter: '',
          last_pause_run: null,
          last_resume_run: null
        }
      })
    }

    return res.json({ ok: true, settings: data })
  }

  if (req.method === 'POST') {
    const { action } = req.body || {}

    if (action === 'save') {
      const { enabled, pause_at, resume_at, sp_filter } = req.body

      const { error } = await sb
        .from('user_offhours')
        .upsert({
          user_id: user.id,
          enabled: Boolean(enabled),
          pause_at: pause_at || '22:00',
          resume_at: resume_at || '06:00',
          sp_filter: sp_filter || '',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (error) {
        console.error('[autocare save] Error:', error)
        return res.status(500).json({ error: 'Lỗi lưu cài đặt' })
      }

      return res.json({ ok: true })
    }

    if (action === 'run') {
      // Manual trigger — run pause/resume logic now
      const { data: settings } = await sb
        .from('user_offhours')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!settings || !settings.enabled) {
        return res.json({ ok: true, message: 'Auto Care chưa được bật' })
      }

      const fbData = await getUserFbData(user.id, sb)
      if (!fbData) {
        return res.status(400).json({ error: 'Chưa kết nối Facebook Ads' })
      }

      const { token, accounts } = fbData
      const vnNow = getVietnamTime()
      const currentTime = toHHMM(vnNow)
      const todayStr = toDateStr(vnNow)

      let actionTaken = null

      // Determine whether to pause or resume
      if (currentTime >= settings.pause_at) {
        actionTaken = 'pause'
      } else if (currentTime >= settings.resume_at) {
        actionTaken = 'resume'
      }

      if (!actionTaken) {
        return res.json({ ok: true, message: 'Không có hành động nào cần thực hiện lúc này' })
      }

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
            // Apply sp_filter if set
            if (settings.sp_filter && !camp.name.includes(settings.sp_filter)) {
              continue
            }

            try {
              const url = `https://graph.facebook.com/v23.0/${camp.id}`
              const body = new URLSearchParams({ status: targetStatus, access_token: token }).toString()
              await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body
              })
              changedCount++
            } catch (e) {
              console.error('[autocare run] Toggle error:', e)
            }
          }
        } catch (err) {
          console.error('[autocare run] Error for account', account.account_id, err)
        }
      }

      // Update last run time
      const updateField = actionTaken === 'pause' ? 'last_pause_run' : 'last_resume_run'
      await sb
        .from('user_offhours')
        .update({ [updateField]: todayStr, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)

      return res.json({ ok: true, action: actionTaken, changed: changedCount })
    }

    return res.status(400).json({ error: 'Action không hợp lệ' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
