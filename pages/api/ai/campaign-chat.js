import { getUserFromReq } from '../../../lib/auth'

function buildSummary(campaigns) {
  if (!campaigns?.length) return 'Không có dữ liệu chiến dịch.'
  return campaigns.slice(0, 40).map(c => {
    const s = c.currency === 'USD' ? '$' : '₫'
    const spend   = (c.spend  || 0).toLocaleString()
    const budget  = c.daily_budget ? `${s}${Math.round(c.daily_budget).toLocaleString()}/ngày` : 'CBO'
    const roas    = c.roas   > 0 ? c.roas.toFixed(2)  : '—'
    const cpa     = c.cpa    > 0 ? `${s}${Math.round(c.cpa).toLocaleString()}` : '—'
    const msgs    = c.messages  || 0
    const engage  = c.engagement || 0
    const warns   = []
    if (c.budget_util_pct >= 85)                          warns.push('NS gần hết')
    if (c.spend > 200000 && !c.purchases && !c.leads)     warns.push('Không chuyển đổi')
    if (c.roas > 0 && c.roas < 1)                        warns.push('ROAS<1 lỗ tiền')
    return `• [${c.effective_status}] ${c.name} | Chi: ${s}${spend} | NS: ${budget} | Mua: ${c.purchases||0} | Lead: ${c.leads||0} | Tin nhắn: ${msgs} | Tương tác: ${engage} | ROAS: ${roas} | CPA: ${cpa}${warns.length ? ' ⚠️ ' + warns.join(', ') : ''}`
  }).join('\n')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' })

  const { message, campaigns, history = [] } = req.body
  if (!message?.trim()) return res.status(400).json({ error: 'Thiếu câu hỏi' })

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'AI chưa được cấu hình. Vui lòng thêm ANTHROPIC_API_KEY vào Vercel.' })
  }

  const summary = buildSummary(campaigns)
  const systemPrompt = `Bạn là trợ lý AI chuyên gia về Facebook/Meta Ads, hỗ trợ phân tích và tối ưu chiến dịch quảng cáo.
Hãy trả lời bằng tiếng Việt, ngắn gọn và thực tiễn. Đưa ra nhận xét cụ thể dựa trên số liệu. Không dài dòng.

DỮ LIỆU CHIẾN DỊCH ĐANG XEM (${campaigns?.length || 0} mục):
${summary}`

  const messages = [
    ...history.slice(-8).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message }
  ]

  try {
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      })
    })
    const data = await apiRes.json()
    if (data.error) throw new Error(data.error.message || 'API error')
    return res.json({ reply: data.content?.[0]?.text || 'Không có phản hồi.' })
  } catch (err) {
    console.error('[AI Chat]', err)
    return res.status(500).json({ error: 'Lỗi AI: ' + err.message })
  }
}
