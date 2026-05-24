import { getSupabase } from '../../lib/supabase'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { code } = req.body || {}
  if (!code?.trim()) return res.status(400).json({ error: 'Vui lòng nhập mã affiliate' })

  const sb = getSupabase()
  const { data: aff } = await sb
    .from('affiliates')
    .select('referral_code, status, total_earned, pending_earned, created_at')
    .eq('referral_code', code.trim().toUpperCase())
    .single()

  if (!aff) return res.status(404).json({ error: 'Không tìm thấy mã affiliate này' })

  return res.json({
    ok: true,
    referral_code: aff.referral_code,
    status: aff.status,
    total_earned: aff.total_earned || 0,
    pending_earned: aff.pending_earned || 0,
  })
}
