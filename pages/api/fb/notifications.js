import { getUserFromReq } from '../../../lib/auth'
import { getSupabase } from '../../../lib/supabase'

async function sendTelegram(botToken, chatId, text) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
  })
  return res.json()
}

async function sendLark(webhookUrl, text) {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ msg_type: 'text', content: { text } })
  })
  return res.json()
}

export default async function handler(req, res) {
  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' })

  const sb = getSupabase()

  if (req.method === 'GET') {
    const { data, error } = await sb
      .from('user_notifications')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      return res.json({
        ok: true,
        settings: {
          master_enabled: false,
          tg_enabled: false,
          tg_bot_token: '',
          tg_chat_id: '',
          lark_enabled: false,
          lark_url: '',
          noti_report: true,
          noti_audit: false,
          noti_critical: false,
          schedule_type: 'hours',
          schedule_value: '8,12,18'
        }
      })
    }

    return res.json({ ok: true, settings: data })
  }

  if (req.method === 'POST') {
    const { action } = req.body || {}

    if (action === 'save') {
      const {
        master_enabled,
        tg_enabled, tg_bot_token, tg_chat_id,
        lark_enabled, lark_url,
        noti_report, noti_audit, noti_critical,
        schedule_type, schedule_value
      } = req.body

      const { error } = await sb
        .from('user_notifications')
        .upsert({
          user_id: user.id,
          master_enabled: Boolean(master_enabled),
          tg_enabled: Boolean(tg_enabled),
          tg_bot_token: tg_bot_token || '',
          tg_chat_id: tg_chat_id || '',
          lark_enabled: Boolean(lark_enabled),
          lark_url: lark_url || '',
          noti_report: Boolean(noti_report),
          noti_audit: Boolean(noti_audit),
          noti_critical: Boolean(noti_critical),
          schedule_type: schedule_type || 'hours',
          schedule_value: schedule_value || '8,12,18',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (error) {
        console.error('[notifications save] Error:', error)
        return res.status(500).json({ error: 'Lỗi lưu cài đặt' })
      }

      return res.json({ ok: true })
    }

    if (action === 'test') {
      const { tg_enabled, tg_bot_token, tg_chat_id, lark_enabled, lark_url } = req.body

      const testMessage = `Go Meta Ads Pro — Test notification\nTai khoan: ${user.email}\nThoi gian: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`

      const results = {}

      if (tg_enabled && tg_bot_token && tg_chat_id) {
        try {
          const tgRes = await sendTelegram(tg_bot_token, tg_chat_id, testMessage)
          results.telegram = tgRes.ok ? 'success' : tgRes.description || 'error'
        } catch (err) {
          console.error('[notifications test] Telegram error:', err)
          results.telegram = 'error: ' + err.message
        }
      }

      if (lark_enabled && lark_url) {
        try {
          await sendLark(lark_url, testMessage)
          results.lark = 'success'
        } catch (err) {
          console.error('[notifications test] Lark error:', err)
          results.lark = 'error: ' + err.message
        }
      }

      return res.json({ ok: true, results })
    }

    return res.status(400).json({ error: 'Action không hợp lệ' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
