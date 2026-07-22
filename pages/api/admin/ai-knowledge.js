import { getSupabase } from '../../../lib/supabase'
import { requireAdminAuth } from '../../../lib/auth'

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  const db = getSupabase()
  const { action } = req.body || req.query
  const SETTINGS_KEY = 'ai_knowledge_prompts'

  // Helper to read current prompts array
  const getPrompts = async () => {
    const { data } = await db.from('site_settings').select('value').eq('key', SETTINGS_KEY).single()
    try {
      return data?.value ? JSON.parse(data.value) : []
    } catch {
      return []
    }
  }

  // Helper to save prompts array
  const savePrompts = async (promptsArray) => {
    await db.from('site_settings').upsert({
      key: SETTINGS_KEY,
      value: JSON.stringify(promptsArray),
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' })
  }

  if (action === 'ai_list') {
    const prompts = await getPrompts()
    return res.json({ ok: true, data: prompts })
  }

  if (action === 'ai_save') {
    const { id, title, content, category } = req.body
    let prompts = await getPrompts()
    if (id) {
      // Edit
      prompts = prompts.map(p => p.id === id ? { ...p, title, content, category, updated_at: new Date().toISOString() } : p)
    } else {
      // Create
      prompts.push({
        id: Math.random().toString(36).substr(2, 9),
        title,
        content,
        category: category || 'general',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
    await savePrompts(prompts)
    return res.json({ ok: true })
  }

  if (action === 'ai_toggle') {
    const { id, is_active } = req.body
    let prompts = await getPrompts()
    prompts = prompts.map(p => p.id === id ? { ...p, is_active } : p)
    await savePrompts(prompts)
    return res.json({ ok: true })
  }

  if (action === 'ai_delete') {
    const { id } = req.body
    let prompts = await getPrompts()
    prompts = prompts.filter(p => p.id !== id)
    await savePrompts(prompts)
    return res.json({ ok: true })
  }

  return res.status(400).json({ ok: false, error: 'Invalid action' })
}

export default requireAdminAuth(handler)
