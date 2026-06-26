import { getUserFromReq } from '../../../lib/auth'
import { getSupabase } from '../../../lib/supabase'
import { getUserFbData, callMeta } from '../../../lib/metaApi'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' })

  const { keywords, type = 'interest', mode = 'first' } = req.body
  if (!Array.isArray(keywords) || keywords.length === 0) {
    return res.status(400).json({ error: 'Thiếu keywords' })
  }

  const sb = getSupabase()
  const fbData = await getUserFbData(user.id, sb)
  if (!fbData) return res.status(400).json({ error: 'Chưa kết nối Facebook Ads' })

  const { token } = fbData
  const results = []
  const searchType = type === 'behavior' ? 'adTargetingCategory' : 'adinterest'

  for (const keyword of keywords.slice(0, 15)) {
    try {
      const params = { type: searchType, q: keyword, limit: '10' }
      if (type === 'behavior') params.class = 'behaviors'

      const searchRes = await callMeta('search', token, params)
      const matches = (searchRes?.data || []).map(item => ({
        id: item.id,
        name: item.name,
        audience_size: item.audience_size || item.audience_size_lower_bound || 0,
        path: item.path || [],
        type,
        keyword,
      }))

      if (mode === 'suggest') {
        results.push(...matches.slice(0, 8))
      } else if (matches.length > 0) {
        results.push(matches[0])
      }
      console.log(`[targeting-search] ${type} "${keyword}" → ${matches.length} results (mode: ${mode})`)
    } catch (e) {
      console.error('[targeting-search] Error for keyword:', keyword, e)
    }
  }

  return res.json({ ok: true, results })
}
