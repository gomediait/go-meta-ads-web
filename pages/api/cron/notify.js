import { getSupabase } from '../../../lib/supabase'
import { getUserFbData, callMeta } from '../../../lib/metaApi'

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

export default async function handler(req, res) {
  // Verify cron auth
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers['authorization']
  const isVercelCron = !!req.headers['x-vercel-cron']
  const isBearerValid = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isVercelCron && !isBearerValid) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const sb = getSupabase()
  const vnNow = getVietnamTime()
  const currentHour = vnNow.getUTCHours()

  // Get all users with notifications enabled
  const { data: allNotif, error } = await sb
    .from('user_notifications')
    .select('*')
    .eq('master_enabled', true)

  if (error) {
    console.error('[cron/notify] Error fetching notifications:', error)
    return res.status(500).json({ error: 'DB error' })
  }

  const results = []

  for (const notif of allNotif || []) {
    try {
      // Check if current hour matches schedule
      const scheduledHours = (notif.schedule_value || '8,12,18')
        .split(',')
        .map(h => parseInt(h.trim(), 10))

      if (!scheduledHours.includes(currentHour)) continue

      // Get user's FB data and today's insights
      const fbData = await getUserFbData(notif.user_id, sb)
      if (!fbData) continue

      const { token, accounts } = fbData

      let totalSpend = 0
      let totalImpressions = 0
      let totalClicks = 0
      let totalConversions = 0
      let activeCampaigns = 0

      for (const account of accounts) {
        try {
          const insightsRes = await callMeta(
            `${account.account_id}/insights`,
            token,
            {
              fields: 'spend,impressions,clicks,actions',
              date_preset: 'today',
              level: 'account'
            }
          )

          const rows = insightsRes?.data || []
          for (const row of rows) {
            totalSpend += Number(row.spend || 0)
            totalImpressions += Number(row.impressions || 0)
            totalClicks += Number(row.clicks || 0)

            // Count conversions from actions
            const actions = row.actions || []
            const purchaseAction = actions.find(a => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase')
            if (purchaseAction) {
              totalConversions += Number(purchaseAction.value || 0)
            }
          }

          // Count active campaigns
          const campRes = await callMeta(
            `${account.account_id}/campaigns`,
            token,
            {
              fields: 'id',
              filtering: JSON.stringify([{ field: 'effective_status', operator: 'IN', value: ['ACTIVE'] }]),
              summary: 'true'
            }
          )
          activeCampaigns += campRes?.summary?.total_count || (campRes?.data?.length || 0)
        } catch (err) {
          console.error('[cron/notify] Insights error for account', account.account_id, err)
        }
      }

      const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00'
      const vnTime = vnNow.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })

      const message = [
        '📊 <b>Báo cáo Facebook Ads — Go Meta Ads Pro</b>',
        `🕐 Thời điểm: ${vnTime}`,
        '',
        `💸 Chi phí hôm nay: <b>${formatCurrency(totalSpend)} đ</b>`,
        `👁 Lượt hiển thị: <b>${formatNumber(totalImpressions)}</b>`,
        `🖱 Lượt click: <b>${formatNumber(totalClicks)}</b>`,
        `📈 CTR: <b>${ctr}%</b>`,
        totalConversions > 0 ? `🛒 Chuyển đổi: <b>${formatNumber(totalConversions)}</b>` : null,
        `📣 Chiến dịch đang chạy: <b>${activeCampaigns}</b>`,
        '',
        '🔗 Xem chi tiết: https://adsmeta.gonetwork.vn/dashboard/report'
      ].filter(Boolean).join('\n')

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
