import { getSupabase } from '../../../lib/supabase'
import { getAdminFromReq } from '../../../lib/auth'
import { logAudit } from '../../../lib/auditLog'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  const db = getSupabase()

  // Public GET — returns all settings as key/value map
  if (req.method === 'GET') {
    const { data } = await db.from('site_settings').select('key,value')
    const settings = {}
    for (const row of data || []) settings[row.key] = row.value || ''
    return res.json({ ok: true, settings })
  }

  // Admin POST — upsert settings
  if (req.method === 'POST') {
    const admin = getAdminFromReq(req)
    if (!admin) return res.status(401).json({ ok: false, error: 'Unauthorized' })

    const { settings } = req.body || {}
    if (!settings || typeof settings !== 'object')
      return res.status(400).json({ ok: false, error: 'Invalid body' })

    const rows = Object.entries(settings).map(([key, value]) => ({
      key,
      value: value?.toString().trim() || null,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await db.from('site_settings').upsert(rows, { onConflict: 'key' })
    if (error) return res.status(500).json({ ok: false, error: error.message })

    await logAudit({ req, actorType: 'admin', actorId: admin.id, actorEmail: admin.email, action: 'site_settings_save', meta: { keys: Object.keys(settings) } })
    return res.json({ ok: true })
  }

  return res.status(405).end()
}
