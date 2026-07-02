import { getUserFromReq } from '../../../lib/auth'
import { getSupabase } from '../../../lib/supabase'
import { getUserFbData } from '../../../lib/metaApi'
import { getEffectiveContext, hasPermission } from '../../../lib/teamAccess'

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
  OUTCOME_AWARENESS: { optimization_goal: 'REACH', billing_event: 'IMPRESSIONS' },
  OUTCOME_TRAFFIC: { optimization_goal: 'LINK_CLICKS', billing_event: 'IMPRESSIONS', destination_type: 'WEBSITE' },
  OUTCOME_ENGAGEMENT: { optimization_goal: 'POST_ENGAGEMENT', billing_event: 'IMPRESSIONS', destination_type: 'ON_POST' },
}

const META_ERROR_VI = {
  190: 'Token đã hết hạn. Vui lòng kết nối lại Facebook.',
  200: 'Không có quyền thực hiện thao tác này.',
  100: 'Tham số không hợp lệ.',
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
  const ctx = await getEffectiveContext(user.id, sb)

  if (!hasPermission(ctx, 'manage_autoset')) {
    return res.status(403).json({ error: 'Bạn không có quyền lên AutoSet' })
  }

  const body = req.body || {}
  const { action } = body

  if (action === 'scan') {
    try {
      const fbData = await getUserFbData(ctx.ownerId, sb)
      if (!fbData) return res.json({ ok: false, error: 'Chưa kết nối Facebook' })

      let query = sb.from('user_autoset_pages').select('*').eq('user_id', ctx.ownerId)
      if (body.page_id) query = query.eq('page_id', body.page_id)
      
      const { data: configuredPages } = await query

      if (!configuredPages || configuredPages.length === 0) {
        return res.json({ ok: true, posts: [], message: 'Chưa cấu hình page nào' })
      }

      const { data: createdAds } = await sb
        .from('autoset_created_ads')
        .select('post_id')
        .eq('user_id', ctx.ownerId)

      const createdPostIds = new Set((createdAds || []).map(a => a.post_id))

      const allNewPosts = []

      const diagnostics = []

      for (const page of configuredPages) {
        try {
          // 1. Lấy page access token (dùng metaGet để URL-encode đúng)
          const pageTokenData = await metaGet(page.page_id, fbData.token, { fields: 'access_token,name' })

          if (pageTokenData.error) {
            console.error('[autoset-scan] Cannot access page', page.page_id, pageTokenData.error)
            allNewPosts.push({ __error: true, page_id: page.page_id, page_name: page.page_name, error_msg: `Không truy cập được Page: ${pageTokenData.error.message || JSON.stringify(pageTokenData.error)}` })
            continue
          }

          const pageToken = pageTokenData.access_token
          if (!pageToken) {
            console.warn('[autoset-scan] No page token for', page.page_id, '— thiếu quyền pages_show_list hoặc pages_read_engagement')
          }
          const tokenToUse = pageToken || fbData.token

          // 2. Lấy bài viết (dùng metaGet thay vì raw fetch)
          const d = await metaGet(`${page.page_id}/posts`, tokenToUse, {
            fields: 'id,message,story,full_picture,created_time,permalink_url',
            limit: '30',
          })

          if (d.error) {
            console.error('[autoset-scan] Posts API error for page', page.page_id, d.error)
            allNewPosts.push({ __error: true, page_id: page.page_id, page_name: page.page_name, error_msg: d.error.message || JSON.stringify(d.error) })
            continue
          }

          const fetchedPosts = d.data || []
          let skippedCreated = 0
          let skippedHashtag = 0

          if (fetchedPosts.length === 0) {
            console.warn(`[autoset-scan] Page ${page.page_id} (${page.page_name}): 0 posts returned — kiểm tra quyền pages_read_engagement, hoặc dùng ${pageToken ? 'page token' : 'user token (fallback)'}`)
          }

          for (const post of fetchedPosts) {
            const is_used = createdPostIds.has(post.id)
            if (is_used) { skippedCreated++ }

            if (page.hashtag) {
              const text = (post.message || '') + ' ' + (post.story || '')
              if (!text.includes(page.hashtag)) { skippedHashtag++; continue }
            }

            allNewPosts.push({
              ...post,
              is_used,
              page_id: page.page_id,
              page_name: page.page_name,
              daily_budget: page.daily_budget,
              objective: page.objective,
              ad_account_id: page.ad_account_id,
            })
          }

          diagnostics.push({
            page_id: page.page_id,
            page_name: page.page_name,
            fetched: fetchedPosts.length,
            skipped_created: skippedCreated,
            skipped_hashtag: skippedHashtag,
            used_page_token: !!pageToken,
          })

          console.log(`[autoset-scan] Page ${page.page_name}: ${fetchedPosts.length} fetched, ${skippedCreated} đã có ads, ${skippedHashtag} không khớp hashtag, token: ${pageToken ? 'page' : 'user (fallback)'}`)
        } catch (pageErr) {
          console.error('[autoset-scan] page error:', page.page_id, pageErr)
          allNewPosts.push({ __error: true, page_id: page.page_id, page_name: page.page_name, error_msg: pageErr.message || 'Lỗi không xác định' })
        }
      }

      const errors = allNewPosts.filter(p => p.__error)
      const posts = allNewPosts.filter(p => !p.__error)
      return res.json({ ok: true, posts, errors, diagnostics })
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message })
    }
  }

  if (action === 'delete_history') {
    const { history_id } = body
    if (!history_id) return res.status(400).json({ ok: false, error: 'Thiếu history_id' })
    try {
      const { error } = await sb.from('autoset_created_ads').delete().eq('id', history_id).eq('user_id', ctx.ownerId)
      if (error) throw error
      return res.json({ ok: true })
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message })
    }
  }

  if (action === 'create_ad') {
    const { post_id, page_id, page_name, ad_account_id, daily_budget, objective, post_message } = body

    try {
      const fbData = await getUserFbData(ctx.ownerId, sb)
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
          promoted_object: { page_id },
          bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
          status: 'PAUSED',
        }
        if (objective === 'OUTCOME_TRAFFIC') {
          adsetBody.destination_type = 'WEBSITE'
        } else if (objective === 'OUTCOME_ENGAGEMENT') {
          adsetBody.destination_type = 'ON_POST'
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
        console.error(`[autoset create_ad] Failed at ${failed_step}:`, stepErr.message)
        // Dọn campaign mồ côi trên Meta — xoá campaign sẽ cascade xoá adset/ad bên trong
        if (campaign_id) {
          try {
            const delBody = new URLSearchParams({ access_token: token }).toString()
            await fetch(`${META_BASE}/${campaign_id}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: delBody,
            })
            console.log(`[autoset create_ad] Cleaned up orphan campaign ${campaign_id}`)
          } catch (cleanupErr) {
            console.error(`[autoset create_ad] Cleanup failed for ${campaign_id}:`, cleanupErr.message)
          }
        }
        return res.json({ ok: false, error: stepErr.message })
      }

      // GET-after-POST: lấy trạng thái thực từ Meta
      let adsetReal = null
      try {
        adsetReal = await metaGet(adset_id, token, {
          fields: 'targeting,billing_event,optimization_goal,daily_budget,status'
        })
      } catch { }

      // Insert history record
      const { error: histError } = await sb.from('autoset_created_ads').insert({
        user_id: ctx.ownerId,
        page_id,
        post_id,
        post_message: (post_message || '').slice(0, 500),
        campaign_id,
        adset_id,
        ad_id,
        ad_account_id,
        status: 'paused',
      })
      if (histError) console.error('[autoset create_ad] History insert error:', histError)

      return res.json({
        ok: true,
        campaign_id,
        adset_id,
        ad_id,
        status: 'paused',
        _log_error: histError ? `Lưu lịch sử thất bại: ${histError.message}` : undefined,
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

  // V2: AI-driven ads creation với targeting custom
  if (action === 'create_ad_v2') {
    const {
      campaign_name, adset_name, ad_name,
      objective, destination_type, optimization_goal,
      page_id, post_id, ad_account_id, daily_budget,
      targeting, cta_type, post_message
    } = body

    try {
      const fbData = await getUserFbData(ctx.ownerId, sb)
      if (!fbData) return res.json({ ok: false, error: 'Chưa kết nối Facebook' })
      if (fbData.conn?.token_expires_at && new Date(fbData.conn.token_expires_at) < new Date()) {
        return res.json({ ok: false, error: 'Token Facebook đã hết hạn. Vui lòng kết nối lại.' })
      }

      const token = fbData.token
      if (!ad_account_id) return res.json({ ok: false, error: 'Chưa chọn tài khoản quảng cáo.' })

      const accountId = ad_account_id.startsWith('act_') ? ad_account_id : 'act_' + ad_account_id
      const budgetValue = Number(daily_budget) || 100000

      const objSettings = OBJECTIVE_SETTINGS[objective] || OBJECTIVE_SETTINGS.OUTCOME_ENGAGEMENT
      const finalDestType = objSettings.destination_type || null
      const finalOptGoal = objSettings.optimization_goal
      const finalBillingEvent = objSettings.billing_event

      let campaign_id = null, adset_id = null, creative_id = null, ad_id = null, failed_step = null

      console.log('[create_ad_v2] DEBUG:', {
        objective: objective || 'OUTCOME_ENGAGEMENT',
        finalDestType,
        finalOptGoal,
        finalBillingEvent,
        destination_type_from_request: destination_type,
        page_id,
        budgetValue,
      })

      try {
        // Step 1: Campaign
        const campaignData = await metaPost(`${accountId}/campaigns`, token, {
          name: campaign_name || `Auto - ${(post_message || '').slice(0, 25)}`,
          objective: objective || 'OUTCOME_ENGAGEMENT',
          status: 'PAUSED',
          special_ad_categories: [],
          is_adset_budget_sharing_enabled: false,
        })
        if (campaignData.error) { failed_step = 'campaign'; throw new Error(formatMetaError('Campaign', campaignData.error)) }
        campaign_id = campaignData.id

        // Step 2: Adset — build targeting an toàn
        const safeTargeting = {
          geo_locations: { countries: ['VN'] },
          age_min: 18, age_max: 65,
          targeting_automation: { advantage_audience: 0 },
        }
        if (targeting) {
          if (targeting.age_min) safeTargeting.age_min = targeting.age_min
          if (targeting.age_max) safeTargeting.age_max = targeting.age_max
          if (targeting.genders?.length) safeTargeting.genders = targeting.genders
          if (targeting.flexible_spec?.length) safeTargeting.flexible_spec = targeting.flexible_spec
        }

        const adsetBody = {
          name: adset_name || `Auto Adset`,
          campaign_id,
          daily_budget: budgetValue,
          billing_event: finalBillingEvent,
          optimization_goal: finalOptGoal,
          promoted_object: { page_id },
          bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
          status: 'PAUSED',
          targeting: safeTargeting,
        }
        if (finalDestType) adsetBody.destination_type = finalDestType

        console.log('[create_ad_v2] Adset body:', JSON.stringify(adsetBody, null, 2))
        let adsetData = await metaPost(`${accountId}/adsets`, token, adsetBody)
        if (adsetData.error && adsetData.error.error_subcode === 1487694 && adsetBody.targeting.flexible_spec) {
          console.log('[create_ad_v2] Interest/behavior hết hạn, retry không có flexible_spec')
          delete adsetBody.targeting.flexible_spec
          adsetData = await metaPost(`${accountId}/adsets`, token, adsetBody)
        }
        if (adsetData.error) { failed_step = 'adset'; throw new Error(formatMetaError('Adset', adsetData.error)) }
        adset_id = adsetData.id

        // Step 3: Creative
        const creativeBody = { name: `Auto Creative`, object_story_id: post_id }
        if (cta_type) {
          creativeBody.call_to_action = { type: cta_type }
        }
        const creativeData = await metaPost(`${accountId}/adcreatives`, token, creativeBody)
        if (creativeData.error) { failed_step = 'creative'; throw new Error(formatMetaError('Creative', creativeData.error)) }
        creative_id = creativeData.id

        // Step 4: Ad
        const adData = await metaPost(`${accountId}/ads`, token, {
          name: ad_name || `Auto Ad`,
          adset_id,
          creative: { creative_id },
          status: 'PAUSED',
        })
        if (adData.error) { failed_step = 'ad'; throw new Error(formatMetaError('Ad', adData.error)) }
        ad_id = adData.id
      } catch (stepErr) {
        console.error(`[autoset create_ad_v2] Failed at ${failed_step}:`, stepErr.message)
        if (campaign_id) {
          try {
            const delBody = new URLSearchParams({ access_token: token }).toString()
            await fetch(`${META_BASE}/${campaign_id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: delBody })
          } catch { }
        }
        return res.json({ ok: false, error: stepErr.message })
      }

      // Verify adset targeting
      let adsetReal = null
      try {
        adsetReal = await metaGet(adset_id, token, {
          fields: 'targeting,billing_event,optimization_goal,daily_budget,status'
        })
      } catch { }

      // Save history
      const { error: histError } = await sb.from('autoset_created_ads').insert({
        user_id: ctx.ownerId, page_id, post_id,
        post_message: (post_message || '').slice(0, 500),
        campaign_id, adset_id, ad_id, ad_account_id, status: 'paused',
      })
      if (histError) console.error('[autoset create_ad_v2] History error:', histError)

      return res.json({
        ok: true, campaign_id, adset_id, ad_id, status: 'paused',
        _log_error: histError ? `Lưu lịch sử thất bại: ${histError.message}` : undefined,
        adset_real: adsetReal ? { targeting: adsetReal.targeting, daily_budget: adsetReal.daily_budget, optimization_goal: adsetReal.optimization_goal } : null,
      })
    } catch (err) {
      return res.json({ ok: false, error: err.message })
    }
  }

  // Kích hoạt campaign đã tạo PAUSED
  if (action === 'activate') {
    const { campaign_id, adset_id, ad_id } = body

    try {
      const fbData = await getUserFbData(ctx.ownerId, sb)
      if (!fbData) return res.json({ ok: false, error: 'Chưa kết nối Facebook' })

      if (fbData.conn?.token_expires_at && new Date(fbData.conn.token_expires_at) < new Date()) {
        return res.json({ ok: false, error: 'Token Facebook đã hết hạn. Vui lòng kết nối lại tại mục Cài đặt.' })
      }

      const token = fbData.token

      // Kích hoạt theo thứ tự: Campaign → Adset → Ad
      for (const [step, entityId] of [['Campaign', campaign_id], ['Adset', adset_id], ['Ad', ad_id]]) {
        if (!entityId) continue
        const formBody = new URLSearchParams({ status: 'ACTIVE', access_token: token }).toString()
        const r = await fetch(`${META_BASE}/${entityId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formBody,
        })
        const result = await r.json()
        if (result.error) {
          console.error(`[autoset activate] ${step} ${entityId} error:`, JSON.stringify(result.error))
          return res.json({ ok: false, error: formatMetaError(`Kích hoạt ${step}`, result.error) })
        }
      }

      // Cập nhật trạng thái trong DB
      await sb.from('autoset_created_ads')
        .update({ status: 'active' })
        .eq('campaign_id', campaign_id)
        .eq('user_id', ctx.ownerId)

      return res.json({ ok: true })
    } catch (err) {
      console.error('[autoset activate] Error:', err)
      return res.json({ ok: false, error: err.message })
    }
  }

  if (action === 'history') {
    try {
      const { data: history, error } = await sb
        .from('autoset_created_ads')
        .select('*')
        .eq('user_id', ctx.ownerId)
        .order('created_at', { ascending: false })
        .limit(30)

      if (error) return res.json({ ok: false, error: error.message })
      return res.json({ ok: true, history: history || [] })
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message })
    }
  }

  if (action === 'delete_history') {
    try {
      const { id } = body
      if (!id) return res.status(400).json({ ok: false, error: 'Thiếu id' })
      const { error } = await sb
        .from('autoset_created_ads')
        .delete()
        .eq('id', id)
        .eq('user_id', ctx.ownerId)
      if (error) return res.json({ ok: false, error: error.message })
      return res.json({ ok: true })
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message })
    }
  }

  if (action === 'clear_history') {
    try {
      const { error } = await sb
        .from('autoset_created_ads')
        .delete()
        .eq('user_id', ctx.ownerId)
      if (error) return res.json({ ok: false, error: error.message })
      return res.json({ ok: true })
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message })
    }
  }

  return res.status(400).json({ ok: false, error: 'Action không hợp lệ' })
}
