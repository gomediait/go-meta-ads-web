import { getSupabase } from '../../../lib/supabase'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'GoMedia@3038485##$$G'

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
    if (req.headers['x-admin-token'] !== ADMIN_PASSWORD)
      return res.status(401).json({ ok: false, error: 'Unauthorized' })

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

    return res.json({ ok: true })
  }

  return res.status(405).end()
}
