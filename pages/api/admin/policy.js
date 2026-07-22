import { getSupabase } from '../../../lib/supabase'
import { requireAdminAuth } from '../../../lib/auth'

const DOC_KEY_PREFIX = 'policy_doc_'
const CONFIG_KEY = 'policy_check_config'
const COST_PER_CHECK_USD = 0.00025
const USD_TO_VND = 26000

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  const db = getSupabase()
  const { action } = req.body || req.query

  if (action === 'pc_get_doc') {
    const { data } = await db.from('site_settings').select('key, value, updated_at').like('key', `${DOC_KEY_PREFIX}%`)
    const docs = (data || []).map(row => ({
      industry: row.key.slice(DOC_KEY_PREFIX.length),
      content: row.value,
      updated_at: row.updated_at,
    }))
    return res.json({ ok: true, docs })
  }

  if (action === 'pc_save_doc') {
    const { industry = 'general', content } = req.body
    const key = `${DOC_KEY_PREFIX}${industry}`
    const { error } = await db.from('site_settings').upsert({ key, value: content, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    if (error) return res.status(500).json({ ok: false, error: error.message })
    return res.json({ ok: true })
  }

  if (action === 'pc_reset_doc') {
    const { industry = 'general' } = req.body
    const key = `${DOC_KEY_PREFIX}${industry}`
    const { error } = await db.from('site_settings').delete().eq('key', key)
    if (error) return res.status(500).json({ ok: false, error: error.message })
    return res.json({ ok: true })
  }

  if (action === 'pc_stats') {
    const { from, to } = req.body || req.query
    let query = db.from('policy_check_logs')
      .select('user_id, plan, overall, checked_at, users(email)')
      .order('checked_at', { ascending: false })
      .limit(2000)
    if (from) query = query.gte('checked_at', from)
    if (to) query = query.lte('checked_at', `${to}T23:59:59`)

    const { data, error } = await query
    if (error) return res.status(500).json({ ok: false, error: error.message })

    const logs = data || []
    const total = logs.length
    const violations = logs.filter(l => l.overall === 'violation').length
    const violation_rate = total ? Math.round((violations / total) * 100) : 0

    const byUser = new Map()
    for (const l of logs) {
      const key = l.users?.email || l.user_id
      const cur = byUser.get(key) || { key, plan: l.plan, count: 0, last: l.checked_at }
      cur.count += 1
      if (!cur.last || l.checked_at > cur.last) cur.last = l.checked_at
      byUser.set(key, cur)
    }
    const top_users = [...byUser.values()].sort((a, b) => b.count - a.count).slice(0, 10)

    const estimated_cost_usd = +(total * COST_PER_CHECK_USD).toFixed(4)
    const estimated_cost_vnd = Math.round(estimated_cost_usd * USD_TO_VND)

    return res.json({
      ok: true,
      total,
      violations,
      violation_rate,
      unique_users: byUser.size,
      estimated_cost_usd,
      estimated_cost_vnd,
      top_users,
    })
  }

  if (action === 'pc_config_get') {
    const { data } = await db.from('site_settings').select('value').eq('key', CONFIG_KEY).single()
    let cfg = {}
    try { cfg = data?.value ? JSON.parse(data.value) : {} } catch { cfg = {} }
    return res.json({
      ok: true,
      config: {
        model: cfg.model || 'claude-haiku-4-5-20251001',
        rateLimitBusiness: cfg.rate_limit_business ?? 30,
        rateLimitAgency: cfg.rate_limit_agency ?? 100,
        enabled: cfg.enabled !== false,
      }
    })
  }

  if (action === 'pc_config_save') {
    const { model, rate_limit_business, rate_limit_agency, enabled } = req.body
    const value = JSON.stringify({ model, rate_limit_business, rate_limit_agency, enabled })
    const { error } = await db.from('site_settings').upsert({ key: CONFIG_KEY, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    if (error) return res.status(500).json({ ok: false, error: error.message })
    return res.json({ ok: true })
  }

  if (action === 'policy_check') {
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) return res.json({ ok: false, error: 'Chưa cấu hình ANTHROPIC_API_KEY' })
    const { content = {} } = req.body
    try {
      const aiRes = await fetch('https://api.shopaikey.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anthropicKey}` },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 50,
          messages: [
            { role: 'system', content: 'Bạn là trợ lý test kết nối. Chỉ trả lời "OK".' },
            { role: 'user', content: `Test: ${content.headline || ''} ${content.body || ''}` }
          ]
        })
      })
      if (!aiRes.ok) return res.json({ ok: false, error: `AI lỗi HTTP ${aiRes.status}` })
      return res.json({ ok: true })
    } catch (e) {
      return res.json({ ok: false, error: e.message })
    }
  }

  return res.status(400).json({ ok: false, error: 'Invalid action' })
}

export default requireAdminAuth(handler)
