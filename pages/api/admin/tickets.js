import { getSupabase } from '../../../lib/supabase'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'GoMedia@3038485##$$G'

function verifyAdmin(req) {
  return req.headers['x-admin-token'] === ADMIN_PASSWORD
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false })
  if (!verifyAdmin(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' })

  const sb = getSupabase()
  const { action, ...body } = req.body || {}

  if (action === 'list') {
    const { status, page = 1, limit = 100 } = body
    let q = sb.from('web_tickets')
      .select('id, user_id, user_email, subject, status, priority, created_at, updated_at, replies')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
    if (status && status !== 'all') q = q.eq('status', status)
    const { data, error } = await q
    if (error) return res.status(500).json({ ok: false, error: error.message })
    return res.json({ ok: true, tickets: data || [] })
  }

  if (action === 'get') {
    const { id } = body
    const { data, error } = await sb.from('web_tickets').select('*').eq('id', id).single()
    if (error) return res.status(404).json({ ok: false, error: 'Không tìm thấy ticket' })
    return res.json({ ok: true, ticket: data })
  }

  if (action === 'reply') {
    const { id, message } = body
    if (!id || !message) return res.status(400).json({ ok: false, error: 'Thiếu id hoặc message' })
    const { data: ticket } = await sb.from('web_tickets').select('replies').eq('id', id).single()
    const replies = Array.isArray(ticket?.replies) ? ticket.replies : []
    replies.push({ from: 'admin', message, created_at: new Date().toISOString() })
    const { error } = await sb.from('web_tickets').update({
      replies,
      status: 'in_progress',
      updated_at: new Date().toISOString()
    }).eq('id', id)
    if (error) return res.status(500).json({ ok: false, error: error.message })
    return res.json({ ok: true })
  }

  if (action === 'update_status') {
    const { id, status } = body
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed']
    if (!validStatuses.includes(status)) return res.status(400).json({ ok: false, error: 'Status không hợp lệ' })
    const { error } = await sb.from('web_tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) return res.status(500).json({ ok: false, error: error.message })
    return res.json({ ok: true })
  }

  if (action === 'delete') {
    const { id } = body
    const { error } = await sb.from('web_tickets').delete().eq('id', id)
    if (error) return res.status(500).json({ ok: false, error: error.message })
    return res.json({ ok: true })
  }

  return res.status(400).json({ ok: false, error: 'Action không hợp lệ' })
}
