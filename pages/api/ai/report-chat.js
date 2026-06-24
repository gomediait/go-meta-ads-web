import { getUserFromReq } from '../../../lib/auth'

function buildReportSummary(reportData) {
  const { totals, campaigns, daily, preset, accountFilter } = reportData || {}
  const lines = []

  lines.push(`KHOẢNG THỜI GIAN: ${preset || 'today'}`)
  lines.push(`TÀI KHOẢN: ${accountFilter === 'all' ? 'Tất cả' : accountFilter}`)

  if (totals) {
    lines.push(`\nTỔNG QUAN:`)
    lines.push(`  Chi phí: ₫${Math.round(totals.spend || 0).toLocaleString()}`)
    lines.push(`  Impressions: ${Math.round(totals.impressions || 0).toLocaleString()}`)
    lines.push(`  Clicks: ${Math.round(totals.clicks || 0).toLocaleString()}`)
    lines.push(`  CTR: ${(totals.ctr || 0).toFixed(2)}%`)
    lines.push(`  CPC: ₫${Math.round(totals.cpc || 0).toLocaleString()}`)
    lines.push(`  Reach: ${Math.round(totals.reach || 0).toLocaleString()}`)
  }

  if (campaigns?.length) {
    lines.push(`\nCHI TIẾT ${campaigns.length} CHIẾN DỊCH:`)
    for (const c of campaigns.slice(0, 20)) {
      const spendPct = totals?.spend > 0 ? ((c.spend / totals.spend) * 100).toFixed(1) : '0'
      lines.push(`• ${c.campaign_name} | Chi: ₫${Math.round(c.spend).toLocaleString()} (${spendPct}%) | Impr: ${Math.round(c.impressions).toLocaleString()} | Clicks: ${c.clicks} | CTR: ${(c.ctr || 0).toFixed(2)}% | CPC: ₫${Math.round(c.cpc || 0).toLocaleString()} | Reach: ${Math.round(c.reach || 0).toLocaleString()}`)
    }
  }

  if (daily?.length) {
    lines.push(`\nXU HƯỚNG THEO NGÀY (${daily.length} ngày):`)
    for (const d of daily) {
      lines.push(`  ${d.date}: Chi ₫${Math.round(d.spend).toLocaleString()} | Impr: ${Math.round(d.impressions).toLocaleString()} | Clicks: ${d.clicks} | CTR: ${(d.ctr || 0).toFixed(2)}%`)
    }
  }

  return lines.join('\n')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' })

  const { message, reportData, history = [] } = req.body
  if (!message?.trim()) return res.status(400).json({ error: 'Thiếu câu hỏi' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: 'AI chưa được cấu hình. Vui lòng thêm ANTHROPIC_API_KEY vào Vercel.' })
  }

  const summary = buildReportSummary(reportData)
  const systemPrompt = `Bạn là chuyên gia phân tích Facebook/Meta Ads. Dựa trên data báo cáo được cung cấp, hãy phân tích và trả lời câu hỏi.

QUY TẮC:
- Trả lời bằng tiếng Việt, ngắn gọn và thực tiễn
- Luôn dùng số liệu cụ thể từ data (₫, %, số)
- So sánh giữa các chiến dịch khi phù hợp
- Nếu phát hiện vấn đề (CTR thấp, CPC cao, chi nhiều không hiệu quả), cảnh báo rõ ràng
- Đề xuất hành động cụ thể (tăng/giảm budget, tắt campaign, v.v.)
- Khi phân tích xu hướng, nhận xét rõ tăng/giảm và nguyên nhân có thể

DỮ LIỆU BÁO CÁO:
${summary}`

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-8).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message }
  ]

  try {
    const apiRes = await fetch('https://api.shopaikey.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages,
      })
    })

    if (!apiRes.ok) {
      const errText = await apiRes.text()
      console.error('[report-chat] ShopAIKey error:', apiRes.status, errText.slice(0, 300))
      return res.status(502).json({ error: `AI lỗi HTTP ${apiRes.status}. Vui lòng thử lại.` })
    }

    const data = await apiRes.json()
    const reply = data.choices?.[0]?.message?.content
    if (!reply) {
      console.error('[report-chat] Unexpected response:', JSON.stringify(data).slice(0, 300))
      return res.json({ reply: 'Không có phản hồi từ AI.' })
    }
    return res.json({ reply })
  } catch (err) {
    console.error('[report-chat]', err)
    return res.status(500).json({ error: 'Lỗi kết nối AI: ' + err.message })
  }
}
