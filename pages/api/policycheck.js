import { getUserFromReq } from '../../lib/auth'
import { getSupabase } from '../../lib/supabase'

const DEFAULT_POLICY_DOC = `# META ADVERTISING POLICIES — CHECKLIST

## CẤM TUYỆT ĐỐI
1. BEFORE_AFTER: Ảnh hoặc text so sánh trước/sau về cơ thể, cân nặng, sức khoẻ
2. BODY_SHAMING: Nội dung ám chỉ body không lý tưởng (VD: "bụng mỡ", "đùi to")
3. GUARANTEED_RESULTS: Cam kết kết quả tuyệt đối (VD: "Trắng 100%", "Giảm 10kg chắc chắn")
4. MISLEADING_CLAIMS: Tuyên bố gây hiểu nhầm không có bằng chứng
5. CLICKBAIT: Nội dung câu click bằng thông tin bị ẩn
6. ADULT_CONTENT: Nội dung người lớn, gợi cảm không phù hợp
7. DISCRIMINATION: Phân biệt đối xử về chủng tộc, giới tính, tôn giáo
8. WEAPON_AMMO: Vũ khí, đạn dược, thuốc nổ
9. TOBACCO_DRUGS: Thuốc lá, ma tuý, chất kích thích

## NGÀNH ĐẶC BIỆT
10. HEALTH_CLAIMS: Sức khoẻ cần claims có chứng cứ rõ ràng
11. SUPPLEMENTS: TPCN không được nói "chữa bệnh" hay "điều trị"
12. FINANCE: Cho vay/đầu tư phải khai báo rủi ro, không hứa lợi nhuận cố định
13. DIET_PRODUCTS: Sản phẩm giảm cân không dùng ảnh before/after, không hứa kết quả cụ thể

## TỪ NGỮ ĐỎ (tiếng Việt)
- "giảm X kg trong Y ngày", "tan mỡ", "đốt mỡ", "giảm béo cấp tốc"
- "chữa", "chữa khỏi", "điều trị", "tiêu diệt vi khuẩn"
- "100%", "tuyệt đối", "chắc chắn", "đảm bảo" + kết quả sức khoẻ/làm đẹp
- "trắng sau X ngày", "trắng như Hàn Quốc", "trắng bóc"

## ĐƯỢC PHÉP
- Mô tả sản phẩm trung thực với claims có thể kiểm chứng
- Khuyến mãi, giảm giá với điều kiện rõ ràng
- Testimonial thực nếu không tuyên bố kết quả điển hình`

async function getUsageToday(userId) {
  try {
    const sb = getSupabase()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count } = await sb.from('policy_check_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('checked_at', today.toISOString())
    return count || 0
  } catch { return 0 }
}

async function logUsage(userId, plan, industry, overall) {
  try {
    const sb = getSupabase()
    await sb.from('policy_check_logs').insert({ user_id: userId, plan, industry, overall })
  } catch {}
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false })

  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ ok: false, error: 'Chưa đăng nhập' })

  const sb = getSupabase()
  const { data: dbUser } = await sb.from('users')
    .select('plan, expire_at')
    .eq('id', user.id)
    .single()

  if (!dbUser) return res.status(401).json({ ok: false, error: 'Không tìm thấy tài khoản' })
  if (dbUser.expire_at && new Date(dbUser.expire_at) < new Date()) {
    return res.status(403).json({ ok: false, error: 'Tài khoản đã hết hạn. Vui lòng gia hạn để tiếp tục.' })
  }
  if (!['business', 'agency'].includes(dbUser.plan)) {
    return res.status(403).json({ ok: false, error: 'Tính năng này yêu cầu gói Business trở lên', upgrade: true })
  }

  const dailyLimit = dbUser.plan === 'agency' ? 100 : 30
  const usageToday = await getUsageToday(user.id)
  if (usageToday >= dailyLimit) {
    return res.status(429).json({
      ok: false,
      error: `Đã đạt giới hạn ${dailyLimit} lần kiểm tra/ngày. Reset lúc 00:00.`,
      usage_today: usageToday,
      usage_limit: dailyLimit
    })
  }

  const { content = {}, industry = 'general' } = req.body
  const { headline = '', body: bodyText = '', desc = '' } = content
  if (!headline && !bodyText) return res.status(400).json({ ok: false, error: 'Thiếu nội dung cần kiểm tra' })

  const contentText = [
    headline ? `HEADLINE: ${headline}` : '',
    bodyText ? `PRIMARY TEXT: ${bodyText}` : '',
    desc     ? `DESCRIPTION: ${desc}` : ''
  ].filter(Boolean).join('\n\n')

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) return res.json({ ok: false, error: 'Chưa cấu hình API Key AI. Vui lòng liên hệ admin.' })

  const systemPrompt = `Bạn là chuyên gia kiểm duyệt quảng cáo Meta (Facebook/Instagram).
Nhiệm vụ: Phân tích nội dung quảng cáo và phát hiện vi phạm Meta Advertising Policies.
Ngành: ${industry}.

${DEFAULT_POLICY_DOC}

Trả lời CHÍNH XÁC theo format JSON sau, KHÔNG thêm bất kỳ text nào khác ngoài JSON:
{
  "overall": "safe|warning|violation",
  "summary": "Tóm tắt 1-2 câu về kết quả phân tích",
  "violations": [
    {
      "rule_name": "Tên quy tắc vi phạm",
      "severity": "high|medium|low",
      "explanation": "Giải thích cụ thể tại sao vi phạm",
      "text_highlighted": "Đoạn text vi phạm nếu có"
    }
  ],
  "suggestions": ["Gợi ý cải thiện 1", "Gợi ý 2"]
}`

  try {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Kiểm tra nội dung quảng cáo sau:\n\n${contentText}` }]
      })
    })

    if (!aiRes.ok) {
      return res.json({ ok: false, error: `AI lỗi HTTP ${aiRes.status}. Vui lòng thử lại.` })
    }

    const aiData = await aiRes.json()
    const responseText = aiData.content?.[0]?.text || '{}'
    const cleanJson = responseText.replace(/```json\n?|```\n?/g, '').trim()

    let result
    try { result = JSON.parse(cleanJson) }
    catch { return res.json({ ok: false, error: 'AI trả về định dạng không hợp lệ. Vui lòng thử lại.' }) }

    await logUsage(user.id, dbUser.plan, industry, result.overall)

    return res.status(200).json({
      ok: true,
      ...result,
      usage_today: usageToday + 1,
      usage_limit: dailyLimit
    })
  } catch (e) {
    return res.json({ ok: false, error: 'AI phân tích thất bại: ' + e.message })
  }
}
