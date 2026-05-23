import { getUserFromReq } from '../../../lib/auth'
import { getSupabase } from '../../../lib/supabase'

const LARK_WEBHOOK = 'https://open.larksuite.com/open-apis/bot/v2/hook/23c53186-2208-4c29-9985-4a6bd836c88a'

async function sendLark(title, fields, color = 'blue') {
  const elements = fields.map(([label, value]) => ({
    tag: 'div',
    text: { tag: 'lark_md', content: `**${label}:** ${value || '—'}` },
  }))
  const body = {
    msg_type: 'interactive',
    card: {
      header: { title: { tag: 'plain_text', content: title }, template: color },
      elements: [
        ...elements,
        { tag: 'div', text: { tag: 'lark_md', content: `🕐 ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}` } },
      ],
    },
  }
  try {
    await fetch(LARK_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  } catch {}
}

export default async function handler(req, res) {
  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' })

  const sb = getSupabase()

  if (req.method === 'GET') {
    const { data } = await sb.from('web_tickets')
      .select('id, subject, status, priority, message, created_at, updated_at, replies')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    return res.json({ ok: true, tickets: data || [] })
  }

  if (req.method === 'POST') {
    const { action, ...body } = req.body || {}

    if (action === 'create') {
      const { subject, message, priority = 'normal', issue_type = 'Khác' } = body
      if (!subject?.trim()) return res.status(400).json({ error: 'Vui lòng nhập tiêu đề' })
      if (!message?.trim()) return res.status(400).json({ error: 'Vui lòng nhập nội dung' })

      const { data, error } = await sb.from('web_tickets').insert({
        user_id: user.id,
        user_email: user.email,
        subject: subject.trim(),
        message: message.trim(),
        priority,
        issue_type,
        status: 'open',
        replies: [],
      }).select().single()

      if (error) return res.status(500).json({ error: error.message })

      // Lark notification — fire and forget
      sendLark('🎫 Ticket hỗ trợ mới (Web)', [
        ['Email', user.email],
        ['Tên', user.name || '—'],
        ['Tiêu đề', subject.trim()],
        ['Loại', issue_type],
        ['Ưu tiên', priority],
        ['Nội dung', message.trim().slice(0, 200) + (message.length > 200 ? '...' : '')],
      ], 'orange')

      return res.json({ ok: true, ticket: data })
    }

    if (action === 'reply') {
      const { ticket_id, message } = body
      if (!message?.trim()) return res.status(400).json({ error: 'Vui lòng nhập nội dung' })

      const { data: ticket } = await sb.from('web_tickets')
        .select('replies, user_id')
        .eq('id', ticket_id)
        .single()

      if (!ticket || ticket.user_id !== user.id) {
        return res.status(404).json({ error: 'Không tìm thấy ticket' })
      }

      const replies = Array.isArray(ticket.replies) ? ticket.replies : []
      replies.push({ from: 'user', message: message.trim(), created_at: new Date().toISOString() })

      const { error } = await sb.from('web_tickets').update({
        replies,
        status: 'open',
        updated_at: new Date().toISOString(),
      }).eq('id', ticket_id)

      if (error) return res.status(500).json({ error: error.message })
      return res.json({ ok: true })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
