import { getSupabase } from '../../../lib/supabase'
import { getUserFbData, callMeta } from '../../../lib/metaApi'
import { getUserFromReq } from '../../../lib/auth'

function getVietnamTime() {
  const now = new Date()
  const vnOffset = 7 * 60 * 60 * 1000
  return new Date(now.getTime() + vnOffset)
}

async function sendTelegram(chatId, text) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) return
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

function formatNumber(n) {
  return Number(n || 0).toLocaleString('vi-VN')
}

function formatCurrency(n) {
  return formatNumber(Math.round(n || 0))
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

export default async function handler(req, res) {
  // Verify cron auth
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers['authorization']
  const isVercelCron = !!req.headers['x-vercel-cron']
  const isBearerValid = cronSecret && authHeader === `Bearer ${cronSecret}`
  
  const user = getUserFromReq(req)
  const isTest = req.query.test === 'true' && user

  if (!isVercelCron && !isBearerValid && !isTest) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const sb = getSupabase()
  
  // Lấy đúng giờ VN
  const vnTimeStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    hour12: false
  }).format(new Date())
  const currentHour = parseInt(vnTimeStr, 10)
  const vnNow = getVietnamTime()

  // Build query
  let query = sb.from('user_notifications').select('*').eq('master_enabled', true)
  if (isTest) {
    query = query.eq('user_id', user.id)
  }

  const { data: allNotif, error } = await query

  if (error) {
    console.error('[cron/notify] Error fetching notifications:', error)
    return res.status(500).json({ error: 'DB error' })
  }

  const results = []

  for (const notif of allNotif || []) {
    try {
      // Check schedule (bypass if testing)
      if (!isTest) {
        const scheduledHours = (notif.schedule_value || '8,12,18')
          .split(',')
          .map(h => parseInt(h.trim(), 10))

        if (!scheduledHours.includes(currentHour)) continue
      }

      // Get user's FB data and today's insights
      const fbData = await getUserFbData(notif.user_id, sb)
      if (!fbData) continue

      const { token, accounts } = fbData

      let totalSpend = 0
      let totalConversions = 0
      let totalRevenue = 0
      
      const accountLines = []

      for (const account of accounts) {
        try {
          const insightsRes = await callMeta(
            `${account.account_id}/insights`,
            token,
            {
              fields: 'account_name,spend,actions,action_values',
              date_preset: 'today',
              level: 'account'
            }
          )

          const rows = insightsRes?.data || []
          let accSpend = 0
          let accConversions = 0
          let accRevenue = 0
          let accName = account.name || account.account_id

          for (const row of rows) {
            if (row.account_name) accName = row.account_name
            accSpend += Number(row.spend || 0)
            accConversions += extractPurchases(row.actions)
            accRevenue += extractRevenue(row.action_values)
          }

          if (accSpend > 0) {
            totalSpend += accSpend
            totalConversions += accConversions
            totalRevenue += accRevenue

            const accCpa = accConversions > 0 ? (accSpend / accConversions) : 0
            const accRoas = accSpend > 0 ? (accRevenue / accSpend).toFixed(2) : 0
            
            const spendStr = `${formatCurrency(accSpend)}đ`
            const cpaStr = accCpa > 0 ? `${formatCurrency(accCpa)}đ` : '—'
            const roasStr = accRevenue > 0 ? accRoas : '—'
            
            accountLines.push(`▪️ <b>${accName}</b>\n   Chi: ${spendStr} | CPA: ${cpaStr} | Đơn: ${accConversions} | ROAS: ${roasStr}`)
          }
        } catch (err) {
          console.error('[cron/notify] Insights error for account', account.account_id, err)
        }
      }

      if (totalSpend === 0) continue // Skip if no spend today

      const vnTime = vnNow.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
      const overallCpa = totalConversions > 0 ? (totalSpend / totalConversions) : 0
      
      const summaryLines = [
        `💸 Tổng Chi: <b>${formatCurrency(totalSpend)} đ</b>`,
        totalConversions > 0 ? `🛒 Tổng Đơn: <b>${formatNumber(totalConversions)}</b>` : null,
        overallCpa > 0 ? `🎯 CPA TB: <b>${formatCurrency(overallCpa)} đ/đơn</b>` : null,
      ].filter(Boolean).join('\n')

      const message = [
        '📊 <b>Báo cáo Tổng hợp (Tất cả tài khoản)</b>',
        `🕐 Thời điểm: ${vnTime}`,
        '',
        summaryLines,
        '',
        '<b>Chi tiết từng tài khoản:</b>',
        accountLines.join('\n'),
        '',
        '🔗 Xem chi tiết: https://adsmeta.gonetwork.vn/dashboard/report'
      ].join('\n')

      let sent = false

      if (notif.tg_enabled && notif.tg_chat_id) {
        try {
          await sendTelegram(notif.tg_chat_id, message)
          sent = true
        } catch (err) {
          console.error('[cron/notify] Telegram error:', err)
        }
      }

      if (notif.lark_enabled && notif.lark_url) {
        try {
          // Strip HTML for Lark plain text
          const plainMsg = message.replace(/<[^>]+>/g, '')
          await sendLark(notif.lark_url, plainMsg)
          sent = true
        } catch (err) {
          console.error('[cron/notify] Lark error:', err)
        }
      }

      results.push({ user_id: notif.user_id, sent, hour: currentHour })
    } catch (err) {
      console.error('[cron/notify] Error for user', notif.user_id, err)
    }
  }

  return res.json({ ok: true, processed: results.length, results })
}
