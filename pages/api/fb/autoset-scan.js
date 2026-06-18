import { getUserFromReq } from '../../../lib/auth'
import { getSupabase } from '../../../lib/supabase'
import { getUserFbData } from '../../../lib/metaApi'

const META_BASE = 'https://graph.facebook.com/v23.0'

async function metaPost(path, token, body) {
  const r = await fetch(`${META_BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, access_token: token }),
  })
  return r.json()
}

async function metaGet(path, token, params = {}) {
  const query = new URLSearchParams({ access_token: token, ...params }).toString()
  const r = await fetch(`${META_BASE}/${path}?${query}`)
  return r.json()
}

const OBJECTIVE_SETTINGS = {
  OUTCOME_TRAFFIC:    { optimization_goal: 'LINK_CLICKS',      billing_event: 'IMPRESSIONS' },
  OUTCOME_ENGAGEMENT: { optimization_goal: 'POST_ENGAGEMENT',  billing_event: 'IMPRESSIONS' },
  OUTCOME_AWARENESS:  { optimization_goal: 'REACH',            billing_event: 'IMPRESSIONS' },
  OUTCOME_LEADS:      { optimization_goal: 'LEAD_GENERATION',  billing_event: 'IMPRESSIONS' },
}

const META_ERROR_VI = {
  190:     'Token đã hết hạn. Vui lòng kết nối lại Facebook.',
  200:     'Không có quyền thực hiện thao tác này.',
  100:     'Tham số không hợp lệ.',
  1487052: 'Ngân sách thấp hơn mức tối thiểu cho tài khoản này.',
  1487079: 'Mục tiêu tối ưu không khớp với loại chiến dịch.',
  1487163: 'Thiếu Facebook Page.',
  1487390: 'Sai cặp billing_event và optimization_goal.',
  1487749: 'Objective không hợp lệ. Chỉ dùng OUTCOME_TRAFFIC/ENGAGEMENT/AWARENESS.',
  1341012: 'Không có quyền truy cập Page này.',
  1885183: 'Lỗi cấu hình ngân sách chiến dịch.',
  3858258: 'Không tải được ảnh từ bài viết.',
}

function formatMetaError(step, error) {
  const viMsg = META_ERROR_VI[error.error_subcode]
  if (viMsg) return `[${step}] ${viMsg}`
  // Code 100 (Invalid parameter) quá chung — luôn hiện full detail
  const detail = error.error_user_msg || error.message || ''
  return `[${step}] ${detail} | ${JSON.stringify(error)}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' })

  const sb = getSupabase()
  const body = req.body || {}
  const { action } = body

  if (action === 'scan') {
    try {
      const fbData = await getUserFbData(user.id, sb)
      if (!fbData) return res.json({ ok: false, error: 'Chưa kết nối Facebook' })

      const { data: configuredPages } = await sb
        .from('user_autoset_pages')
        .select('*')
        .eq('user_id', user.id)

      if (!configuredPages || configuredPages.length === 0) {
        return res.json({ ok: true, posts: [], message: 'Chưa cấu hình page nào' })
      }

      const { data: createdAds } = await sb
        .from('autoset_created_ads')
        .select('post_id')
        .eq('user_id', user.id)

      const createdPostIds = new Set((createdAds || []).map(a => a.post_id))

      const allNewPosts = []

      for (const page of configuredPages) {
        try {
          const pageTokenRes = await fetch(
            `${META_BASE}/${page.page_id}?fields=access_token&access_token=${fbData.token}`
          )
          const pageTokenData = await pageTokenRes.json()
          const pageToken = pageTokenData.access_token || fbData.token

          const url = `${META_BASE}/${page.page_id}/posts?fields=id,message,story,full_picture,created_time,permalink_url&limit=30&access_token=${pageToken}`
          const r = await fetch(url)
          const d = await r.json()

          if (d.error) {
            console.error('[autoset-scan] FB API error for page', page.page_id, d.error)
            allNewPosts.push({ __error: true, page_id: page.page_id, page_name: page.page_name, error_msg: d.error.message || JSON.stringify(d.error) })
            continue
          }
          if (!d.data) continue

          for (const post of d.data) {
            if (createdPostIds.has(post.id)) continue

            if (page.hashtag) {
              const text = (post.message || '') + ' ' + (post.story || '')
              if (!text.includes(page.hashtag)) continue
            }

            allNewPosts.push({
              ...post,
              page_id: page.page_id,
              page_name: page.page_name,
              daily_budget: page.daily_budget,
              objective: page.objective,
              ad_account_id: page.ad_account_id,
            })
          }
        } catch (pageErr) {
          console.error('[autoset-scan] page error:', page.page_id, pageErr)
        }
      }

      const errors = allNewPosts.filter(p => p.__error)
      const posts  = allNewPosts.filter(p => !p.__error)
      return res.json({ ok: true, posts, errors })
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message })
    }
  }

  if (action === 'create_ad') {
    const { post_id, page_id, page_name, ad_account_id, daily_budget, objective, post_message } = body

    try {
      const fbData = await getUserFbData(user.id, sb)
      if (!fbData) return res.json({ ok: false, error: 'Chưa kết nối Facebook' })

      // Validate token expiry
      if (fbData.conn?.token_expires_at && new Date(fbData.conn.token_expires_at) < new Date()) {
        return res.json({ ok: false, error: 'Token Facebook đã hết hạn. Vui lòng kết nối lại tại mục Cài đặt.' })
      }

      const token = fbData.token
      if (!ad_account_id) return res.json({ ok: false, error: 'Chưa chọn tài khoản quảng cáo. Vào mục "Tài khoản quảng cáo mặc định" để lưu tài khoản trước.' })

      const accountId = (ad_account_id || '').startsWith('act_')
        ? ad_account_id
        : 'act_' + ad_account_id
      const budgetApiValue = Number(daily_budget) || 100000

      const objSettings = OBJECTIVE_SETTINGS[objective] || OBJECTIVE_SETTINGS.OUTCOME_TRAFFIC
      const { optimization_goal, billing_event } = objSettings

      const campaignName = `Auto - ${page_name} - ${(post_message || '').slice(0, 25)}`

      console.log('[autoset create_ad] params:', { accountId, objective, budgetApiValue, post_id, page_id })

      let campaign_id = null
      let adset_id = null
      let creative_id = null
      let ad_id = null
      let failed_step = null

      try {
        // Step 1: Create campaign (PAUSED)
        const campaignData = await metaPost(`${accountId}/campaigns`, token, {
          name: campaignName,
          objective,
          status: 'PAUSED',
          special_ad_categories: [],
          is_adset_budget_sharing_enabled: false,
        })
        if (campaignData.error) {
          failed_step = 'campaign'
          throw new Error(formatMetaError('Bước 1 - Campaign', campaignData.error))
        }
        campaign_id = campaignData.id

        // Step 2: Create adset (PAUSED)
        const adsetBody = {
          name: `Auto Adset - ${page_name}`,
          campaign_id,
          daily_budget: budgetApiValue,
          billing_event,
          optimization_goal,
          targeting: {
            geo_locations: { countries: ['VN'] },
            age_min: 18,
            age_max: 65,
          },
          bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
          status: 'PAUSED',
        }
        if (objective === 'OUTCOME_TRAFFIC') {
          adsetBody.destination_type = 'WEBSITE'
        }
        const adsetData = await metaPost(`${accountId}/adsets`, token, adsetBody)
        if (adsetData.error) {
          failed_step = 'adset'
          throw new Error(formatMetaError('Bước 2 - Adset', adsetData.error))
        }
        adset_id = adsetData.id

        // Step 3: Create adcreative (dùng bài viết Page)
        const creativeData = await metaPost(`${accountId}/adcreatives`, token, {
          name: `Auto Creative - ${page_name}`,
          object_story_id: post_id,
        })
        if (creativeData.error) {
          failed_step = 'creative'
          throw new Error(formatMetaError('Bước 3 - Creative', creativeData.error))
        }
        creative_id = creativeData.id

        // Step 4: Create ad (PAUSED)
        const adData = await metaPost(`${accountId}/ads`, token, {
          name: `Auto Ad - ${(post_message || '').slice(0, 30)}`,
          adset_id,
          creative: { creative_id },
          status: 'PAUSED',
        })
        if (adData.error) {
          failed_step = 'ad'
          throw new Error(formatMetaError('Bước 4 - Ad', adData.error))
        }
        ad_id = adData.id
      } catch (stepErr) {
        // MARK campaign mồ côi nếu bước sau lỗi
        if (campaign_id) {
          try {
            await sb.from('autoset_created_ads').insert({
              user_id: user.id,
              page_id,
              post_id,
              post_message: (post_message || '').slice(0, 500),
              campaign_id,
              adset_id,
              ad_id,
              ad_account_id,
            })
          } catch {}
        }
        return res.json({ ok: false, error: stepErr.message })
      }

      // GET-after-POST: lấy trạng thái thực từ Meta
      let adsetReal = null
      try {
        adsetReal = await metaGet(adset_id, token, {
          fields: 'targeting,billing_event,optimization_goal,daily_budget,status'
        })
      } catch {}

      // Insert history record
      await sb.from('autoset_created_ads').insert({
        user_id: user.id,
        page_id,
        post_id,
        post_message: (post_message || '').slice(0, 500),
        campaign_id,
        adset_id,
        ad_id,
        ad_account_id,
        status: 'paused',
      })

      return res.json({
        ok: true,
        campaign_id,
        adset_id,
        ad_id,
        status: 'paused',
        adset_real: adsetReal?.targeting ? {
          targeting: adsetReal.targeting,
          daily_budget: adsetReal.daily_budget,
          optimization_goal: adsetReal.optimization_goal,
        } : null,
      })
    } catch (err) {
      return res.json({ ok: false, error: err.message })
    }
  }

  // Kích hoạt campaign đã tạo PAUSED
  if (action === 'activate') {
    const { campaign_id, adset_id, ad_id } = body

    try {
      const fbData = await getUserFbData(user.id, sb)
      if (!fbData) return res.json({ ok: false, error: 'Chưa kết nối Facebook' })
      const token = fbData.token

      // Kích hoạt theo thứ tự: Campaign → Adset → Ad
      for (const [step, entityId] of [['Campaign', campaign_id], ['Adset', adset_id], ['Ad', ad_id]]) {
        if (!entityId) continue
        const result = await metaPost(entityId, token, { status: 'ACTIVE' })
        if (result.error) {
          return res.json({ ok: false, error: formatMetaError(`Kích hoạt ${step}`, result.error) })
        }
      }

      // Cập nhật trạng thái trong DB
      await sb.from('autoset_created_ads')
        .update({ status: 'active' })
        .eq('campaign_id', campaign_id)
        .eq('user_id', user.id)

      return res.json({ ok: true })
    } catch (err) {
      return res.json({ ok: false, error: err.message })
    }
  }

  if (action === 'history') {
    try {
      const { data: history, error } = await sb
        .from('autoset_created_ads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)

      if (error) return res.json({ ok: false, error: error.message })
      return res.json({ ok: true, history: history || [] })
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message })
    }
  }

  return res.status(400).json({ ok: false, error: 'Action không hợp lệ' })
}
