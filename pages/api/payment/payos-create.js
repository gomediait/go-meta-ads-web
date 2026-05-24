import { PayOS } from '@payos/node'
import { getUserFromReq } from '../../../lib/auth'
import { getSupabase } from '../../../lib/supabase'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://adsmeta.gonetwork.vn'

const PLAN_MAP = {
  'ca-nhan':      { plan: 'personal', name: 'Personal' },
  'doanh-nghiep': { plan: 'business', name: 'Business' },
  'agency':       { plan: 'agency',   name: 'Agency'   },
}

const BILLING_DAYS = {
  thang: 30,
  nam1:  365,
  nam3:  1095,
  nam5:  1825,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false })

  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ ok: false, error: 'Chưa đăng nhập' })

  const { plan_id, billing_tab, buyer_name, buyer_phone, amount } = req.body || {}

  const planInfo = PLAN_MAP[plan_id]
  if (!planInfo) return res.status(400).json({ ok: false, error: 'Gói không hợp lệ' })
  if (!BILLING_DAYS[billing_tab]) return res.status(400).json({ ok: false, error: 'Chu kỳ thanh toán không hợp lệ' })
  if (!amount || amount < 1000) return res.status(400).json({ ok: false, error: 'Số tiền không hợp lệ' })

  try {
    const payos = new PayOS(
      process.env.PAYOS_CLIENT_ID,
      process.env.PAYOS_API_KEY,
      process.env.PAYOS_CHECKSUM_KEY
    )

    const sb = getSupabase()
    const days = BILLING_DAYS[billing_tab]
    const orderCode = Date.now()

    const { data: order, error: orderErr } = await sb.from('orders').insert({
      user_id: user.id,
      order_code: orderCode,
      plan: planInfo.plan,
      billing_tab,
      amount,
      days,
      status: 'pending',
      buyer_name: buyer_name || user.name || '',
      buyer_email: user.email,
      buyer_phone: buyer_phone || '',
    }).select('id').single()

    if (orderErr) return res.status(500).json({ ok: false, error: 'Lỗi tạo đơn hàng' })

    const paymentData = {
      orderCode,
      amount,
      description: `GMAP ${planInfo.name.toUpperCase()}`,
      items: [{ name: `Go Meta Ads Pro ${planInfo.name}`, quantity: 1, price: amount }],
      buyerName: buyer_name || user.name || '',
      buyerEmail: user.email,
      buyerPhone: buyer_phone || '',
      returnUrl: `${SITE_URL}/payment/success?order_id=${order.id}`,
      cancelUrl: `${SITE_URL}/payment/cancel?order_id=${order.id}`,
    }

    const paymentLink = await payos.createPaymentLink(paymentData)
    return res.json({ ok: true, checkoutUrl: paymentLink.checkoutUrl, order_id: order.id })
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'Lỗi tạo link thanh toán: ' + e.message })
  }
}
