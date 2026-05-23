import { getUserFromReq } from '../../lib/auth'
import { getSupabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' })

  const { action } = req.body || {}
  const sb = getSupabase()

  if (action === 'update_name') {
    const { name } = req.body
    if (!name || !name.trim()) return res.status(400).json({ error: 'Tên không được để trống' })
    const { error } = await sb.from('users').update({ name: name.trim() }).eq('id', user.id)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ ok: true })
  }

  return res.status(400).json({ error: 'Unknown action' })
}
