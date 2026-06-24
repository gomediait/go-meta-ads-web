import { getUserFromReq } from '../../../lib/auth'
import { getSupabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' })

  const sb = getSupabase()

  if (req.method === 'GET') {
    const { action: getAction } = req.query || {}

    if (getAction === 'history') {
      const limit = Number(req.query.limit) || 50
      const { data, error } = await sb
        .from('autoset_rule_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) return res.status(500).json({ error: error.message })
      return res.json({ ok: true, logs: data || [] })
    }

    const { data, error } = await sb
      .from('user_autoset_rules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ ok: true, rules: data || [] })
  }

  if (req.method === 'POST') {
    const { action, ...body } = req.body || {}

    if (action === 'create') {
      const { name, conditions, ruleAction: ruleAct, action: ruleActLegacy, scale_factor, budget_cap_min, budget_cap_max, account_id, time_range, level, selected_campaigns, selected_adsets } = body
      const ruleAction = ruleAct || ruleActLegacy
      if (!conditions?.length) return res.status(400).json({ error: 'Cần ít nhất 1 điều kiện' })
      const validActions = ['pause', 'resume', 'scale_budget', 'reduce_budget', 'notify_only']
      if (!validActions.includes(ruleAction)) return res.status(400).json({ error: 'Action không hợp lệ' })

      const { data, error } = await sb
        .from('user_autoset_rules')
        .insert({
          user_id: user.id,
          name: name || 'Rule mới',
          enabled: true,
          conditions,
          action: ruleAction,
          scale_factor: scale_factor || 1.2,
          budget_cap_min: Number(budget_cap_min) || 0,
          budget_cap_max: Number(budget_cap_max) || 0,
          account_id: account_id || 'all',
          time_range: time_range || 'today',
          level: level || 'adset',
          selected_campaigns: Array.isArray(selected_campaigns) ? selected_campaigns : [],
          selected_adsets: Array.isArray(selected_adsets) ? selected_adsets : [],
        })
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })
      return res.json({ ok: true, rule: data })
    }

    if (action === 'update') {
      const { id, name, enabled, conditions, ruleAction: ruleAct, action: ruleActLegacy, scale_factor, budget_cap_min, budget_cap_max, account_id, time_range, level, selected_campaigns, selected_adsets } = body
      const ruleAction = ruleAct || ruleActLegacy
      if (!id) return res.status(400).json({ error: 'Thiếu id' })

      const update = { updated_at: new Date().toISOString() }
      if (name !== undefined) update.name = name
      if (enabled !== undefined) update.enabled = enabled
      if (conditions !== undefined) update.conditions = conditions
      if (ruleAction !== undefined) update.action = ruleAction
      if (scale_factor !== undefined) update.scale_factor = scale_factor
      if (budget_cap_min !== undefined) update.budget_cap_min = Number(budget_cap_min) || 0
      if (budget_cap_max !== undefined) update.budget_cap_max = Number(budget_cap_max) || 0
      if (account_id !== undefined) update.account_id = account_id
      if (level !== undefined) update.level = level
      if (selected_campaigns !== undefined) update.selected_campaigns = Array.isArray(selected_campaigns) ? selected_campaigns : []
      if (selected_adsets !== undefined) update.selected_adsets = Array.isArray(selected_adsets) ? selected_adsets : []
      if (time_range !== undefined) update.time_range = time_range

      const { error } = await sb
        .from('user_autoset_rules')
        .update(update)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) return res.status(500).json({ error: error.message })
      return res.json({ ok: true })
    }

    if (action === 'delete') {
      const { id } = body
      if (!id) return res.status(400).json({ error: 'Thiếu id' })

      const { error } = await sb
        .from('user_autoset_rules')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) return res.status(500).json({ error: error.message })
      return res.json({ ok: true })
    }

    return res.status(400).json({ error: 'Action không hợp lệ' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
