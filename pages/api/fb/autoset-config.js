import { getUserFromReq } from '../../../lib/auth'
import { getSupabase } from '../../../lib/supabase'
import { getUserFbData } from '../../../lib/metaApi'

const PLAN_MAX_PAGES = {
  trial: 0,
  personal: 1,
  business: 2,
  agency: 10,
}

export default async function handler(req, res) {
  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' })

  const sb = getSupabase()

  if (req.method === 'GET') {
    try {
      const [pagesResult, configResult] = await Promise.all([
        sb.from('user_autoset_pages').select('*').eq('user_id', user.id),
        sb.from('user_autoset_config').select('*').eq('user_id', user.id).single(),
      ])

      const pages = pagesResult.data || []
      const config = configResult.data || null
      const plan = user.plan || 'trial'
      const max_pages = PLAN_MAX_PAGES[plan] ?? 0

      return res.json({
        ok: true,
        pages,
        default_account: config?.default_ad_account_id || null,
        max_pages,
      })
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message })
    }
  }

  if (req.method === 'POST') {
    const body = req.body || {}
    const { action } = body

    if (action === 'save_account') {
      try {
        const { error } = await sb.from('user_autoset_config').upsert(
          {
            user_id: user.id,
            default_ad_account_id: body.default_ad_account_id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        if (error) return res.json({ ok: false, error: error.message })
        return res.json({ ok: true })
      } catch (err) {
        return res.status(500).json({ ok: false, error: err.message })
      }
    }

    if (action === 'get_my_pages') {
      try {
        const fbData = await getUserFbData(user.id, sb)
        if (!fbData) return res.json({ ok: false, error: 'Chưa kết nối Facebook' })

        const url = `https://graph.facebook.com/v23.0/me/accounts?access_token=${fbData.token}&fields=id,name,category&limit=50`
        const r = await fetch(url)
        const d = await r.json()

        if (d.error) return res.json({ ok: false, error: d.error.message })
        return res.json({ ok: true, pages: d.data || [] })
      } catch (err) {
        return res.status(500).json({ ok: false, error: err.message })
      }
    }

    if (action === 'add_page') {
      try {
        const plan = user.plan || 'trial'
        const max_pages = PLAN_MAX_PAGES[plan] ?? 0

        const { data: existing } = await sb
          .from('user_autoset_pages')
          .select('id')
          .eq('user_id', user.id)

        if ((existing || []).length >= max_pages) {
          return res.json({ ok: false, error: `Gói của bạn chỉ cho phép tối đa ${max_pages} page` })
        }

        // Page audit: kiểm tra quyền truy cập Page
        const fbData = await getUserFbData(user.id, sb)
        if (fbData) {
          const auditRes = await fetch(
            `https://graph.facebook.com/v23.0/${body.page_id}?fields=access_token&access_token=${fbData.token}`
          )
          const auditData = await auditRes.json()
          if (auditData.error) {
            return res.json({ ok: false, error: `Không có quyền truy cập Page "${body.page_name}". Kiểm tra lại kết nối Facebook.` })
          }
          const pageToken = auditData.access_token
          if (pageToken) {
            const postsAudit = await fetch(
              `https://graph.facebook.com/v23.0/${body.page_id}/posts?limit=1&access_token=${pageToken}`
            )
            const postsData = await postsAudit.json()
            if (postsData.error) {
              return res.json({ ok: false, error: `Không thể đọc bài viết từ Page "${body.page_name}". Cần quyền pages_read_engagement.` })
            }
          }
        }

        const { error } = await sb.from('user_autoset_pages').insert({
          user_id: user.id,
          page_id: body.page_id,
          page_name: body.page_name,
          hashtag: body.hashtag || null,
          daily_budget: Number(body.daily_budget) || 100000,
          objective: body.objective || 'OUTCOME_TRAFFIC',
          ad_account_id: body.ad_account_id,
        })

        if (error) return res.json({ ok: false, error: error.message })
        return res.json({ ok: true })
      } catch (err) {
        return res.status(500).json({ ok: false, error: err.message })
      }
    }

    if (action === 'remove_page') {
      try {
        const { error } = await sb
          .from('user_autoset_pages')
          .delete()
          .eq('user_id', user.id)
          .eq('page_id', body.page_id)

        if (error) return res.json({ ok: false, error: error.message })
        return res.json({ ok: true })
      } catch (err) {
        return res.status(500).json({ ok: false, error: err.message })
      }
    }

    return res.status(400).json({ ok: false, error: 'Action không hợp lệ' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
