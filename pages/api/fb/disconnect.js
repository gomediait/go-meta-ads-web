import { getUserFromReq } from '../../../lib/auth'
import { getSupabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' })

  const sb = getSupabase()
  await sb.from('fb_connections').delete().eq('user_id', user.id)
  await sb.from('fb_ad_accounts').delete().eq('user_id', user.id)
  await sb.from('users').update({ facebook_id: null }).eq('id', user.id)

  return res.json({ ok: true })
}
