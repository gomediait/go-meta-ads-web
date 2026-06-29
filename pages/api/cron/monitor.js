import { getSupabase } from '../../../lib/supabase'
import { getUserFbData, callMeta } from '../../../lib/metaApi'
import { getUserFromReq } from '../../../lib/auth'

async function sendTelegram(chatId, text) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) return
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
  })
}

async function sendLark(webhookUrl, text) {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ msg_type: 'text', content: { text } })
  })
}

export default async function handler(req, res) {
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

  let query = sb.from('user_notifications').select('*').eq('master_enabled', true)
  if (isTest) {
    query = query.eq('user_id', user.id)
  } else {
    query = query.or('noti_audit.eq.true,noti_critical.eq.true')
  }

  const { data: users, error } = await query

  if (error) {
    console.error('[cron/monitor] DB error:', error)
    return res.status(500).json({ error: 'DB error' })
  }

  const results = []

  for (const notif of users || []) {
    try {
      const fbData = await getUserFbData(notif.user_id, sb)
      if (!fbData) continue
      
      const { token, accounts } = fbData
      let alertMessages = []

      for (const account of accounts) {
        let accName = account.name || account.account_id

        // 1. [AUDIT] Cảnh báo trạng thái (VD: Quảng cáo bị từ chối)
        if (notif.noti_audit) {
          try {
            const adsRes = await callMeta(
              `${account.account_id}/ads`,
              token,
              {
                fields: 'name,effective_status',
                filtering: JSON.stringify([{ field: 'effective_status', operator: 'IN', value: ['DISAPPROVED'] }]),
                limit: 5
              }
            )
            const rejectedAds = adsRes?.data || []
            if (rejectedAds.length > 0) {
              const adNames = rejectedAds.map(a => `- ${a.name}`).join('\n')
              alertMessages.push(`❌ [Audit] Tài khoản <b>${accName}</b> đang có ${rejectedAds.length} quảng cáo bị <b>TỪ CHỐI</b>:\n${adNames}`)
            }
          } catch (e) {
            console.error(`[cron/monitor] Audit check failed for ${accName}:`, e)
          }
        }
        
        // 2. [CRITICAL] Cảnh báo khẩn cấp (Ngân sách, CPM)
        // Hiện tại setup khung sườn.
        if (notif.noti_critical) {
          // TODO: Fetch adsets nearing daily_budget or check high CPM
        }
      }
      
      // Nếu là test mode, giả lập 1 lỗi để User xem form
      if (isTest) {
         alertMessages.push(`❌ [Audit] [Dữ liệu giả lập Test]\nTài khoản <b>Go Media Agency 3</b> đang có 2 quảng cáo bị <b>TỪ CHỐI</b> duyệt:\n- Ảnh QC Mới T6\n- Video Khuyến mãi\n\n⚠️ [Critical] [Dữ liệu giả lập Test]\nNhóm quảng cáo <b>Tương tác du lịch</b> đã tiêu 95% ngân sách ngày (Giới hạn: 500.000đ)`)
      }
      
      // Gửi cảnh báo nếu có issue
      if (alertMessages.length > 0) {
         const alertMsg = "🚨 <b>Cảnh Báo Khẩn (GoMeta Pro)</b>\n\n" + alertMessages.join("\n\n")
         
         if (notif.tg_enabled && notif.tg_chat_id) {
           await sendTelegram(notif.tg_chat_id, alertMsg)
         }
         if (notif.lark_enabled && notif.lark_url) {
           await sendLark(notif.lark_url, alertMsg.replace(/<[^>]+>/g, '')) // Loại bỏ HTML tag cho Lark
         }
      }

      results.push({ user_id: notif.user_id, alerts_found: alertMessages.length })
    } catch (err) {
      console.error('[cron/monitor] Error for user', notif.user_id, err)
    }
  }

  return res.json({ ok: true, processed: results.length, results })
}
