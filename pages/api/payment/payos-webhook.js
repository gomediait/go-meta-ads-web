import PayOS from '@payos/node'
import { getSupabase } from '../../../lib/supabase'
import { AFFILIATE_COMMISSION } from '../../../lib/planLimits'

const LARK_WEBHOOK = 'https://open.larksuite.com/open-apis/bot/v2/hook/23c53186-2208-4c29-9985-4a6bd836c88a'

export const config = { api: { bodyParser: true } }

async function sendLark(title, fields, color = 'green') {
  const elements = fields.map(([label, value]) => ({
    tag: 'div',
    text: { tag: 'lark_md', content: `**${label}:** ${value || '—'}` },
  }))
  try {
    await fetch(LARK_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        msg_type: 'interactive',
        card: {
          header: { title: { tag: 'plain_text', content: title }, template: color },
          elements: [
            ...elements,
            { tag: 'div', text: { tag: 'lark_md', content: `🕐 ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}` } },
          ],
        },
      }),
    })
  } catch {}
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ code: '00', desc: 'success' })

  try {
    const payos = new PayOS(
      process.env.PAYOS_CLIENT_ID,
      process.env.PAYOS_API_KEY,
      process.env.PAYOS_CHECKSUM_KEY
    )

    const sb = getSupabase()

    let webhookData
    try {
      webhookData = payos.verifyPaymentWebhookData(req.body)
    } catch {
      // Invalid signature — still return 200 so PayOS doesn't retry endlessly
      return res.status(200).json({ code: '00', desc: 'success' })
    }

    const { orderCode, code } = webhookData
    if (code !== '00') {
      return res.status(200).json({ code: '00', desc: 'success' })
    }

    // Find order
    const { data: order } = await sb.from('orders')
      .select('*')
      .eq('order_code', orderCode)
      .single()

    if (!order || order.status === 'paid') {
      return res.status(200).json({ code: '00', desc: 'success' })
    }

    // Mark order as paid
    await sb.from('orders').update({
      status: 'paid',
      paid_at: new Date().toISOString(),
    }).eq('id', order.id)

    // Get user
    const { data: dbUser } = await sb.from('users')
      .select('id,email,name,plan,expire_at,referred_by')
      .eq('id', order.user_id)
      .single()

    if (!dbUser) return res.status(200).json({ code: '00', desc: 'success' })

    // Calculate new expire_at
    const now = new Date()
    const currentExpire = dbUser.expire_at ? new Date(dbUser.expire_at) : now
    const baseDate = currentExpire > now ? currentExpire : now
    const newExpire = new Date(baseDate.getTime() + order.days * 24 * 60 * 60 * 1000)

    const isRenewal = dbUser.plan === order.plan && currentExpire > now

    // Update user plan
    await sb.from('users').update({
      plan: order.plan,
      expire_at: newExpire.toISOString(),
    }).eq('id', order.user_id)

    // Handle affiliate commission
    if (dbUser.referred_by) {
      try {
        const { data: affiliate } = await sb.from('affiliates')
          .select('id,pending_earned')
          .eq('referral_code', dbUser.referred_by)
          .eq('status', 'active')
          .single()

        if (affiliate) {
          const rates = AFFILIATE_COMMISSION[order.plan] || AFFILIATE_COMMISSION.personal
          const rate = isRenewal ? rates.renewal : rates.new
          const commission = Math.round(order.amount * rate)

          await sb.from('affiliate_conversions').insert({
            affiliate_id: affiliate.id,
            referred_user_id: order.user_id,
            order_id: order.id,
            plan: order.plan,
            amount: order.amount,
            commission,
            rate,
            type: isRenewal ? 'renewal' : 'new',
            status: 'pending',
          })

          await sb.from('affiliates').update({
            pending_earned: (affiliate.pending_earned || 0) + commission,
          }).eq('id', affiliate.id)
        }
      } catch {}
    }

    sendLark('💰 Thanh toán thành công — PayOS', [
      ['Email', dbUser.email],
      ['Tên', dbUser.name || '—'],
      ['Gói', order.plan],
      ['Chu kỳ', order.billing_tab],
      ['Số tiền', order.amount.toLocaleString('vi-VN') + 'đ'],
      ['Gia hạn đến', newExpire.toLocaleDateString('vi-VN')],
      ['Loại', isRenewal ? 'Gia hạn' : 'Mới'],
    ], 'green')

    return res.status(200).json({ code: '00', desc: 'success' })
  } catch (err) {
    console.error('PayOS webhook error:', err)
    return res.status(200).json({ code: '00', desc: 'success' })
  }
}
