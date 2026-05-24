import { getSupabase } from '../../../lib/supabase'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'GoMedia@3038485##$$G'

function verifyAdmin(req) {
  return req.headers['x-admin-token'] === ADMIN_PASSWORD
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false })
  if (!verifyAdmin(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' })

  const sb = getSupabase()
  const { action, ...body } = req.body || {}

  if (action === 'list') {
    const { data: affiliates } = await sb.from('affiliates')
      .select('*, users!affiliates_user_id_fkey(email,name,plan)')
      .order('created_at', { ascending: false })
    return res.json({ ok: true, affiliates: affiliates || [] })
  }

  if (action === 'list_conversions') {
    const { status } = body
    let q = sb.from('affiliate_conversions')
      .select('*, affiliates!affiliate_conversions_affiliate_id_fkey(referral_code, user_id)')
      .order('created_at', { ascending: false })
      .limit(200)
    if (status && status !== 'all') q = q.eq('status', status)
    const { data: conversions } = await q
    return res.json({ ok: true, conversions: conversions || [] })
  }

  if (action === 'confirm_commission') {
    const { conversion_id } = body
    const { data: conv } = await sb.from('affiliate_conversions')
      .select('affiliate_id, commission, status')
      .eq('id', conversion_id)
      .single()
    if (!conv) return res.status(404).json({ ok: false, error: 'Không tìm thấy conversion' })
    if (conv.status === 'confirmed') return res.status(400).json({ ok: false, error: 'Đã xác nhận rồi' })

    await sb.from('affiliate_conversions').update({ status: 'confirmed' }).eq('id', conversion_id)

    // Move from pending to total
    const { data: aff } = await sb.from('affiliates').select('total_earned,pending_earned').eq('id', conv.affiliate_id).single()
    if (aff) {
      await sb.from('affiliates').update({
        total_earned: (aff.total_earned || 0) + conv.commission,
        pending_earned: Math.max(0, (aff.pending_earned || 0) - conv.commission),
      }).eq('id', conv.affiliate_id)
    }
    return res.json({ ok: true })
  }

  if (action === 'reject_commission') {
    const { conversion_id } = body
    const { data: conv } = await sb.from('affiliate_conversions')
      .select('affiliate_id, commission, status')
      .eq('id', conversion_id)
      .single()
    if (!conv) return res.status(404).json({ ok: false, error: 'Không tìm thấy conversion' })
    if (conv.status !== 'pending') return res.status(400).json({ ok: false, error: 'Chỉ có thể từ chối conversion pending' })

    await sb.from('affiliate_conversions').update({ status: 'rejected' }).eq('id', conversion_id)

    const { data: aff } = await sb.from('affiliates').select('pending_earned').eq('id', conv.affiliate_id).single()
    if (aff) {
      await sb.from('affiliates').update({
        pending_earned: Math.max(0, (aff.pending_earned || 0) - conv.commission),
      }).eq('id', conv.affiliate_id)
    }
    return res.json({ ok: true })
  }

  return res.status(400).json({ ok: false, error: 'Action không hợp lệ' })
}
