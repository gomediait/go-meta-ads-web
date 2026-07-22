import nodemailer from 'nodemailer'
import { getSupabase } from '../../../lib/supabase'
import { requireAdminAuth } from '../../../lib/auth'


const LARK_WEBHOOK = 'https://open.larksuite.com/open-apis/bot/v2/hook/23c53186-2208-4c29-9985-4a6bd836c88a'
const SITE_URL = 'https://adsmeta.gonetwork.vn'



async function sendLark(title, fields, color = 'blue') {
  const elements = fields.map(([label, value]) => ({
    tag: 'div',
    text: { tag: 'lark_md', content: `**${label}:** ${value || '—'}` },
  }))
  try {
    await fetch(LARK_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        msg_type: 'interactive',
        card: {
          header: { title: { tag: 'plain_text', content: title }, template: color },
          elements: [
            ...elements,
            { tag: 'div', text: { tag: 'lark_md', content: `🕐 ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}` } },
          ],
        },
      }),
    })
  } catch {}
}

async function sendEmail(sb, to, subject, html) {
  try {
    const { data: smtp } = await sb.from('smtp_settings').select('*').eq('is_active', true).single()
    if (!smtp?.host || !smtp?.username || !smtp?.password) return false

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port || 587,
      secure: smtp.port === 465,
      auth: { user: smtp.username, pass: smtp.password },
      tls: { rejectUnauthorized: false },
    })
    await transporter.sendMail({
      from: `"${smtp.from_name || 'Go Meta Ads Pro'}" <${smtp.from_email || smtp.username}>`,
      to,
      subject,
      html,
    })
    return true
  } catch (e) {
    console.warn('[Email]', e.message)
    return false
  }
}

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false })

  const sb = getSupabase()
  const { action, ...body } = req.body || {}

  if (action === 'list') {
    const { status, page = 1, limit = 100 } = body
    let q = sb.from('web_tickets')
      .select('id, user_id, user_email, subject, status, priority, message, image_urls, created_at, updated_at, replies')
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
    const { id, message, image_urls = [] } = body
    if (!id || (!message?.trim() && !image_urls?.length)) {
      return res.status(400).json({ ok: false, error: 'Thiếu id hoặc nội dung' })
    }

    const { data: ticket } = await sb.from('web_tickets')
      .select('replies, user_email, subject')
      .eq('id', id)
      .single()

    const replies = Array.isArray(ticket?.replies) ? ticket.replies : []
    replies.push({
      from: 'admin',
      message: message?.trim() || '',
      image_urls: Array.isArray(image_urls) ? image_urls : [],
      created_at: new Date().toISOString(),
    })

    const { error } = await sb.from('web_tickets').update({
      replies,
      status: 'in_progress',
      updated_at: new Date().toISOString(),
    }).eq('id', id)

    if (error) return res.status(500).json({ ok: false, error: error.message })

    // Gửi email cho khách — fire and forget
    if (ticket?.user_email) {
      const shortId = id.slice(0, 8).toUpperCase()
      const imagesHtml = Array.isArray(image_urls) && image_urls.length > 0
        ? `<div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:8px">${image_urls.map(url => `<a href="${url}" target="_blank"><img src="${url}" style="width:80px;height:80px;object-fit:cover;border-radius:6px;border:1px solid #e2e8f0" /></a>`).join('')}</div>`
        : ''

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#0c2a72;padding:20px;border-radius:8px 8px 0 0">
            <h2 style="color:#fff;margin:0">Go Meta Ads Pro — Phản hồi hỗ trợ</h2>
          </div>
          <div style="background:#f8faff;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 8px 8px">
            <p style="color:#1a2332">Ticket <strong>#${shortId}</strong> của bạn đã được phản hồi:</p>
            <div style="background:#fff;border-left:4px solid #0c2a72;padding:14px 18px;border-radius:0 8px 8px 0;margin:16px 0;color:#1a2332;line-height:1.7">
              ${(message || '').replace(/\n/g, '<br>')}
            </div>
            ${imagesHtml}
            <div style="margin-top:20px">
              <a href="${SITE_URL}/dashboard/support" style="display:inline-block;background:#fe5f01;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">
                Xem & Phản hồi tiếp →
              </a>
            </div>
            <p style="color:#64748b;font-size:12px;margin-top:16px">
              Đăng nhập vào tài khoản tại ${SITE_URL} và vào mục "Hỗ trợ kỹ thuật" để xem và trả lời ticket.
            </p>
          </div>
        </div>`

      sendEmail(sb, ticket.user_email, `[Go Meta Ads Pro] Ticket #${shortId} — Admin vừa phản hồi`, html)
    }

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

export default requireAdminAuth(handler)
