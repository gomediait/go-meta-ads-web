import { getUserFromReq } from '../../../lib/auth'
import { getSupabase } from '../../../lib/supabase'
import { getUserFbData, callMeta } from '../../../lib/metaApi'

const META_BASE = 'https://graph.facebook.com/v23.0'



function resolveAccountId(accountId) {
  return accountId.startsWith('act_') ? accountId : `act_${accountId}`
}


async function toggleEntity(entityId, targetStatus, token) {
  const body = new URLSearchParams({ status: targetStatus, access_token: token }).toString()
  await fetch(`${META_BASE}/${entityId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
}

async function runRuleAction(rule, actionType, fbData) {
  const { token, accounts } = fbData
  const targetStatus = actionType === 'pause' ? 'PAUSED' : 'ACTIVE'
  const filterStatus = actionType === 'pause' ? 'ACTIVE' : 'PAUSED'
  const hasSelectedCamps = Array.isArray(rule.selected_campaigns) && rule.selected_campaigns.length > 0
  const hasSelectedAdsets = Array.isArray(rule.selected_adsets) && rule.selected_adsets.length > 0
  const selectedAdsetSet = new Set(rule.selected_adsets || [])

  let changedCampaigns = 0
  let changedAdsets = 0
  let skippedCampaignPaused = 0

  for (const account of accounts) {
    try {
      const accountId = resolveAccountId(account.account_id)
      const filtering = JSON.stringify([
        { field: 'effective_status', operator: 'IN', value: [filterStatus] }
      ])

      const campRes = await callMeta(
        `${accountId}/campaigns`, token,
        { fields: 'id,name,status', limit: '200', filtering }
      )

      for (const camp of (campRes?.data || [])) {
        if (hasSelectedCamps) {
          if (!rule.selected_campaigns.includes(camp.id)) continue
        } else if (!hasSelectedAdsets) {
          // No filter → apply to all
        } else {
          continue
        }

        try {
          await toggleEntity(camp.id, targetStatus, token)
          changedCampaigns++
        } catch (e) {
          console.error('[autocare run] Campaign toggle error:', camp.id, e)
        }
      }

      if (hasSelectedAdsets) {
        const adsetFiltering = JSON.stringify([
          { field: 'effective_status', operator: 'IN', value: actionType === 'pause' ? ['ACTIVE'] : ['PAUSED', 'CAMPAIGN_PAUSED'] }
        ])

        const adsetRes = await callMeta(
          `${accountId}/adsets`, token,
          { fields: 'id,name,status,effective_status', limit: '500', filtering: adsetFiltering }
        )

        for (const adset of (adsetRes?.data || [])) {
          if (!selectedAdsetSet.has(adset.id)) continue

          if (actionType === 'resume' && adset.effective_status === 'CAMPAIGN_PAUSED') {
            skippedCampaignPaused++
            continue
          }

          try {
            await toggleEntity(adset.id, targetStatus, token)
            changedAdsets++
          } catch (e) {
            console.error('[autocare run] Adset toggle error:', adset.id, e)
          }
        }
      }
    } catch (err) {
      console.error('[autocare run] Error for account', account.account_id, err)
    }
  }

  return { changedCampaigns, changedAdsets, skippedCampaignPaused }
}

export default async function handler(req, res) {
  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' })

  const sb = getSupabase()

  // GET: list all rules for user
  if (req.method === 'GET') {
    const { data, error } = await sb
      .from('user_autocare_rules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ ok: true, rules: data || [] })
  }

  if (req.method === 'POST') {
    const { action, ...body } = req.body || {}

    // Create new rule
    if (action === 'create') {
      const { name, pause_at, resume_at, selected_campaigns, selected_adsets } = body

      const { data, error } = await sb
        .from('user_autocare_rules')
        .insert({
          user_id: user.id,
          name: name || 'Rule mới',
          enabled: true,
          pause_at: pause_at || '22:00',
          resume_at: resume_at || '06:00',
          selected_campaigns: Array.isArray(selected_campaigns) ? selected_campaigns : [],
          selected_adsets: Array.isArray(selected_adsets) ? selected_adsets : [],
        })
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })
      return res.json({ ok: true, rule: data })
    }

    // Update existing rule
    if (action === 'update') {
      const { id, name, enabled, pause_at, resume_at, selected_campaigns, selected_adsets } = body
      if (!id) return res.status(400).json({ error: 'Thiếu id' })

      const update = { updated_at: new Date().toISOString() }
      if (name !== undefined) update.name = name
      if (enabled !== undefined) update.enabled = enabled
      if (pause_at !== undefined) update.pause_at = pause_at
      if (resume_at !== undefined) update.resume_at = resume_at
      if (selected_campaigns !== undefined) update.selected_campaigns = Array.isArray(selected_campaigns) ? selected_campaigns : []
      if (selected_adsets !== undefined) update.selected_adsets = Array.isArray(selected_adsets) ? selected_adsets : []

      const { error } = await sb
        .from('user_autocare_rules')
        .update(update)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) return res.status(500).json({ error: error.message })
      return res.json({ ok: true })
    }

    // Delete rule
    if (action === 'delete') {
      const { id } = body
      if (!id) return res.status(400).json({ error: 'Thiếu id' })

      const { error } = await sb
        .from('user_autocare_rules')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) return res.status(500).json({ error: error.message })
      return res.json({ ok: true })
    }

    // Pause/Resume now for a specific rule
    if (action === 'pause_now' || action === 'resume_now') {
      const { id } = body
      if (!id) return res.status(400).json({ error: 'Thiếu rule id' })

      const { data: rule } = await sb
        .from('user_autocare_rules')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (!rule) return res.json({ ok: false, error: 'Không tìm thấy rule' })

      const fbData = await getUserFbData(user.id, sb)
      if (!fbData) return res.status(400).json({ error: 'Chưa kết nối Facebook Ads' })

      const actionType = action === 'pause_now' ? 'pause' : 'resume'
      const result = await runRuleAction(rule, actionType, fbData)

      return res.json({
        ok: true,
        action: actionType,
        changed_campaigns: result.changedCampaigns,
        changed_adsets: result.changedAdsets,
        skipped_campaign_paused: result.skippedCampaignPaused,
        changed: result.changedCampaigns + result.changedAdsets,
      })
    }



    return res.status(400).json({ error: 'Action không hợp lệ' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
