import jwt from 'jsonwebtoken'
import { getSupabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  const token = req.cookies.admin_token || req.headers['x-admin-token']
  if (!token) return res.status(401).json({ ok: false, error: 'Unauthorized' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_development')
    if (!decoded.admin) throw new Error('Not admin')
  } catch(e) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }

  const db = getSupabase()
  const { action } = req.body || req.query

  if (action === 'smtp_get' || req.method === 'GET') {
    const { data } = await db.from('smtp_settings').select('*').limit(1).single()
    return res.json({ ok: true, smtp: data || null })
  }

  if (action === 'smtp_save' || req.method === 'POST') {
    const { host, port, username, password, from_name, is_active } = req.body

    const { data: existing } = await db.from('smtp_settings').select('id').limit(1).single()

    const payload = {
      host,
      port: Number(port) || 587,
      username,
      password,
      from_name: from_name || 'Go Meta Ads Pro',
      is_active: is_active !== undefined ? is_active : true,
      updated_at: new Date().toISOString()
    }

    let error
    if (existing?.id) {
      const { error: err } = await db.from('smtp_settings').update(payload).eq('id', existing.id)
      error = err
    } else {
      const { error: err } = await db.from('smtp_settings').insert(payload)
      error = err
    }

    if (error) return res.status(500).json({ ok: false, error: error.message })
    return res.json({ ok: true })
  }

  return res.status(405).end()
}
