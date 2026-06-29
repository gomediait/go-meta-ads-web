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

function extractResults(actions) {
  if (!actions || !Array.isArray(actions)) return 0
  // Ưu tiên đếm tin nhắn, sau đó là lead, rồi mới đến purchase
  const TYPES = ['onsite_conversion.messaging_conversation_started_7d', 'lead', 'purchase', 'offsite_conversion.fb_pixel_purchase', 'omni_purchase']
  let total = 0
  for (const t of TYPES) {
    const found = actions.find(a => a.action_type === t)
    if (found) total += Number(found.value) || 0
  }
  return total
}

function extractClicks(actions, fallbackClicks) {
  if (actions && Array.isArray(actions)) {
    const found = actions.find(a => a.action_type === 'link_click')
    if (found) return Number(found.value) || 0
  }
  return Number(fallbackClicks || 0)
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
              fields: 'account_name,campaign_name,spend,actions,impressions,clicks',
              date_preset: 'today',
              level: 'campaign',
              filtering: JSON.stringify([{ field: 'spend', operator: 'GREATER_THAN', value: 0 }])
            }
          )

          const rows = insightsRes?.data || []
          let accSpend = 0
          let accResults = 0
          let accImpressions = 0
          let accClicks = 0
          let accName = account.name || account.account_id
          const campaignLines = []

          // Sắp xếp chiến dịch tiêu nhiều nhất lên đầu
          rows.sort((a,b) => Number(b.spend || 0) - Number(a.spend || 0))

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i]
            if (row.account_name) accName = row.account_name
            const cName = row.campaign_name || 'Không rõ'
            const cSpend = Number(row.spend || 0)
            const cResults = extractResults(row.actions)
            const cImps = Number(row.impressions || 0)
            const cClicks = extractClicks(row.actions, row.clicks)

            accSpend += cSpend
            accResults += cResults
            accImpressions += cImps
            accClicks += cClicks

            const cCpa = cResults > 0 ? (cSpend / cResults) : 0
            const cCpc = cClicks > 0 ? (cSpend / cClicks) : 0
            
            let cpaStr = cCpa > 0 ? `${formatCurrency(cCpa)}đ` : '—'
            
            campaignLines.push(`${i+1}️⃣ ${cName}:\n   Chi: ${formatCurrency(cSpend)}đ | KQ: ${cResults} | CPA: ${cpaStr}\n   (Click: ${cClicks} - CPC: ${cCpc > 0 ? formatCurrency(cCpc)+'đ' : '—'})`)
          }

          if (accSpend > 0) {
            totalSpend += accSpend
            totalConversions += accResults

            const accCpa = accResults > 0 ? (accSpend / accResults) : 0
            const accCpc = accClicks > 0 ? (accSpend / accClicks) : 0
            
            const spendStr = `${formatCurrency(accSpend)}đ`
            const cpaStr = accCpa > 0 ? `${formatCurrency(accCpa)}đ` : '—'
            
            let block = `━━━━━━━━━━━━━━━━━━━━\n💼 [Tài khoản] ${accName}\nChi: ${spendStr} | KQ: ${accResults} | CPA: ${cpaStr}\n👁️ Hiển thị: ${formatNumber(accImpressions)} | 🖱️ Click: ${formatNumber(accClicks)} (CPC: ${accCpc > 0 ? formatCurrency(accCpc)+'đ' : '—'})`
            
            if (campaignLines.length > 0) {
               block += `\n\n🔥 <b>Các Chiến Dịch (Tiêu > 0đ):</b>\n` + campaignLines.join('\n')
            }
            accountLines.push(block)
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
        `📩 Tổng Kết quả (Mess/Lead): <b>${formatNumber(totalConversions)}</b>`,
        overallCpa > 0 ? `🎯 CPA TB: <b>${formatCurrency(overallCpa)} đ/kết quả</b>` : null,
      ].filter(Boolean).join('\n')

      const message = [
        '📊 <b>Báo cáo Tổng hợp</b>',
        `🕐 Thời điểm: ${vnTime}`,
        '',
        summaryLines,
        '',
        accountLines.join('\n\n'),
        '━━━━━━━━━━━━━━━━━━━━',
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
