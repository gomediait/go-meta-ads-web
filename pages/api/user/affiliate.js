import { getUserFromReq } from '../../../lib/auth'
import { getSupabase } from '../../../lib/supabase'
import { isPlanAllowed } from '../../../lib/planLimits'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://adsmeta.gonetwork.vn'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default async function handler(req, res) {
  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ ok: false, error: 'Chưa đăng nhập' })

  const sb = getSupabase()

  // Check plan
  const { data: dbUser } = await sb.from('users').select('plan,expire_at').eq('id', user.id).single()
  if (!dbUser) return res.status(401).json({ ok: false, error: 'Không tìm thấy tài khoản' })
  if (!isPlanAllowed(dbUser.plan, 'affiliate')) {
    return res.status(403).json({ ok: false, error: 'Tính năng Affiliate yêu cầu gói Personal trở lên' })
  }

  if (req.method === 'GET') {
    const { action } = req.query

    if (action === 'info' || !action) {
      // Get affiliate info
      const { data: affiliate } = await sb.from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!affiliate) return res.json({ ok: true, affiliate: null })

      const { data: conversions } = await sb.from('affiliate_conversions')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false })
        .limit(50)

      return res.json({ ok: true, affiliate, conversions: conversions || [] })
    }

    return res.status(400).json({ ok: false, error: 'Action không hợp lệ' })
  }

  if (req.method === 'POST') {
    const { action, bank_name, bank_account, bank_owner } = req.body || {}

    if (action === 'register') {
      // Check not already registered
      const { data: existing } = await sb.from('affiliates').select('id').eq('user_id', user.id).single()
      if (existing) return res.status(409).json({ ok: false, error: 'Bạn đã đăng ký affiliate rồi' })

      if (!bank_name?.trim() || !bank_account?.trim() || !bank_owner?.trim()) {
        return res.status(400).json({ ok: false, error: 'Vui lòng nhập đầy đủ thông tin ngân hàng' })
      }

      // Generate unique referral code
      let code = generateCode()
      let attempts = 0
      while (attempts < 10) {
        const { data: clash } = await sb.from('affiliates').select('id').eq('referral_code', code).single()
        if (!clash) break
        code = generateCode()
        attempts++
      }

      const { data: affiliate, error } = await sb.from('affiliates').insert({
        user_id: user.id,
        referral_code: code,
        bank_name: bank_name.trim(),
        bank_account: bank_account.trim(),
        bank_owner: bank_owner.trim(),
        status: 'active',
      }).select().single()

      if (error) return res.status(500).json({ ok: false, error: error.message })
      return res.json({ ok: true, affiliate })
    }

    if (action === 'update_bank') {
      if (!bank_name?.trim() || !bank_account?.trim() || !bank_owner?.trim()) {
        return res.status(400).json({ ok: false, error: 'Vui lòng nhập đầy đủ thông tin ngân hàng' })
      }
      const { error } = await sb.from('affiliates').update({
        bank_name: bank_name.trim(),
        bank_account: bank_account.trim(),
        bank_owner: bank_owner.trim(),
      }).eq('user_id', user.id)
      if (error) return res.status(500).json({ ok: false, error: error.message })
      return res.json({ ok: true })
    }

    return res.status(400).json({ ok: false, error: 'Action không hợp lệ' })
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' })
}
