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

  if (action === 'pc_get_doc') {
    const { industry = 'general' } = req.body || req.query
    const key = `policy_doc_${industry}`
    const { data } = await db.from('site_settings').select('value').eq('key', key).single()
    return res.json({ ok: true, doc: data?.value || '' })
  }

  if (action === 'pc_save_doc') {
    const { industry = 'general', content } = req.body
    const key = `policy_doc_${industry}`
    const { error } = await db.from('site_settings').upsert({ key, value: content, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    if (error) return res.status(500).json({ ok: false, error: error.message })
    return res.json({ ok: true })
  }

  if (action === 'pc_stats') {
    // Return recent logs
    const { data, error } = await db.from('policy_check_logs')
      .select('*, users(email)')
      .order('checked_at', { ascending: false })
      .limit(100)
    if (error) return res.status(500).json({ ok: false, error: error.message })
    return res.json({ ok: true, stats: { logs: data || [] } })
  }

  if (action === 'pc_config_get') {
    // Return current limits or any policy settings
    return res.json({ ok: true, config: {} })
  }

  return res.status(400).json({ ok: false, error: 'Invalid action' })
}
