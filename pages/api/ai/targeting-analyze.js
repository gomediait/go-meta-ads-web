import { getUserFromReq } from '../../../lib/auth'

const SYSTEM_PROMPT = `Bạn là chuyên gia Facebook Ads targeting. Phân tích insight/chân dung khách hàng và trả về targeting JSON cho Meta Ads API.

QUY TẮC BẮT BUỘC:
- CHỈ trả về JSON thuần, KHÔNG giải thích, KHÔNG markdown
- locations: mảng tên thành phố/tỉnh bằng tiếng Anh chuẩn Meta (VD: "Da Nang", "Ho Chi Minh City")
- age_min / age_max: số nguyên, min 18, max 65
- genders: [] = tất cả, [1] = nam, [2] = nữ
- interests: mảng keyword tiếng Anh phổ biến trên Meta (VD: "Travel", "Hotels", "Agoda")
- behaviors: mảng keyword tiếng Anh (VD: "Frequent travelers", "Engaged shoppers")
- location_types: ["home","recent"] mặc định, ["travel_in"] nếu insight nhắc "du lịch"/"khách vãng lai"

SUY LUẬN OBJECTIVE (nếu user chưa chọn):
- "tin nhắn", "tư vấn", "inbox", "chat" → OUTCOME_ENGAGEMENT
- "mua hàng", "đặt hàng", "order", "checkout", "đặt bàn" → OUTCOME_SALES
- "đăng ký", "form", "lead", "để lại số" → OUTCOME_LEADS
- "ghé web", "truy cập", "xem trang" → OUTCOME_TRAFFIC
- "biết đến", "ra mắt", "nhận diện", "viral" → OUTCOME_AWARENESS
- "tải app", "cài đặt ứng dụng" → OUTCOME_APP_PROMOTION
- Khi ambiguous, ưu tiên: SALES > LEADS > ENGAGEMENT > TRAFFIC > AWARENESS

MAPPING OBJECTIVE → DESTINATION → OPTIMIZATION:
- OUTCOME_ENGAGEMENT + "chat/tin nhắn/tư vấn" → MESSENGER + CONVERSATIONS
- OUTCOME_ENGAGEMENT + "tương tác/like/comment" → ON_POST + POST_ENGAGEMENT
- OUTCOME_ENGAGEMENT + "xem video" → ON_VIDEO + THRUPLAY
- OUTCOME_TRAFFIC → WEBSITE + LINK_CLICKS
- OUTCOME_SALES + "chat" → MESSENGER + CONVERSATIONS
- OUTCOME_SALES + "web/checkout" → WEBSITE + OFFSITE_CONVERSIONS
- OUTCOME_LEADS + "form" → ON_AD + LEAD_GENERATION
- OUTCOME_LEADS + "chat" → MESSENGER + CONVERSATIONS
- OUTCOME_AWARENESS → undefined + REACH
- OUTCOME_APP_PROMOTION → APP + APP_INSTALLS

CTA MAPPING:
- MESSENGER → MESSAGE_PAGE
- WEBSITE (traffic) → LEARN_MORE
- WEBSITE (sales) → SHOP_NOW
- ON_AD (leads) → SIGN_UP
- ON_POST → LEARN_MORE
- APP → INSTALL_MOBILE_APP

FORMAT OUTPUT:
{
  "objective": "OUTCOME_ENGAGEMENT",
  "objective_confidence": 0.92,
  "objective_reasoning": "Insight nhắc 'tư vấn qua chat' → mục tiêu là Conversations",
  "destination_type": "MESSENGER",
  "optimization_goal": "CONVERSATIONS",
  "cta_type": "MESSAGE_PAGE",
  "alternative_options": [
    { "objective": "OUTCOME_SALES", "destination_type": "MESSENGER", "optimization_goal": "CONVERSATIONS", "when_to_use": "Nếu muốn đo doanh số qua chat" }
  ],
  "locations": ["Da Nang"],
  "age_min": 22,
  "age_max": 45,
  "genders": [],
  "interests": ["Travel", "Hotels"],
  "behaviors": ["Frequent travelers"],
  "location_types": ["travel_in"],
  "suggestion": "Target khách du lịch tại Đà Nẵng, tối ưu tin nhắn Messenger"
}`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' })

  let { insight_text, file_base64, industry, selected_objective } = req.body

  if (file_base64 && !insight_text) {
    try {
      const pdf = require('pdf-parse')
      const buffer = Buffer.from(file_base64, 'base64')
      const data = await pdf(buffer)
      insight_text = data.text
    } catch (e) {
      return res.status(400).json({ error: 'Không đọc được file PDF: ' + e.message })
    }
  }

  if (!insight_text?.trim()) {
    return res.status(400).json({ error: 'Vui lòng nhập insight khách hàng hoặc upload file PDF' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: 'AI chưa được cấu hình. Vui lòng thêm ANTHROPIC_API_KEY.' })
  }

  const parts = []
  if (industry) parts.push(`Ngành: ${industry}`)
  if (selected_objective) parts.push(`User đã chọn objective: ${selected_objective}. Hãy dùng objective này, chỉ suy luận destination + targeting.`)
  else parts.push(`User CHƯA chọn objective. Hãy suy luận objective phù hợp nhất từ insight.`)
  parts.push(`\nInsight khách hàng:\n${insight_text.slice(0, 3000)}`)

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
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: parts.join('\n') }
        ],
      })
    })

    if (!apiRes.ok) {
      const errText = await apiRes.text()
      console.error('[targeting-analyze] AI error:', apiRes.status, errText.slice(0, 300))
      return res.status(502).json({ error: `AI lỗi HTTP ${apiRes.status}` })
    }

    const data = await apiRes.json()
    const reply = data.choices?.[0]?.message?.content
    if (!reply) return res.status(502).json({ error: 'Không có phản hồi từ AI' })

    const jsonMatch = reply.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[targeting-analyze] Non-JSON:', reply.slice(0, 300))
      return res.status(502).json({ error: 'AI trả về format không hợp lệ', raw: reply })
    }

    const targeting = JSON.parse(jsonMatch[0])
    return res.json({ ok: true, targeting, extracted_text: insight_text.slice(0, 500) })
  } catch (err) {
    console.error('[targeting-analyze]', err)
    return res.status(500).json({ error: 'Lỗi phân tích: ' + err.message })
  }
}
