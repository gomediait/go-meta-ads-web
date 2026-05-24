import { getUserFromReq } from '../../../lib/auth'
import { getSupabase } from '../../../lib/supabase'
import { getUserFbData } from '../../../lib/metaApi'

async function metaPost(path, token, body) {
  const r = await fetch(`https://graph.facebook.com/v21.0/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, access_token: token }),
  })
  return r.json()
}

const OBJECTIVE_SETTINGS = {
  OUTCOME_TRAFFIC:    { optimization_goal: 'LINK_CLICKS',      billing_event: 'IMPRESSIONS' },
  OUTCOME_ENGAGEMENT: { optimization_goal: 'POST_ENGAGEMENT',  billing_event: 'IMPRESSIONS' },
  OUTCOME_AWARENESS:  { optimization_goal: 'REACH',            billing_event: 'IMPRESSIONS' },
  OUTCOME_LEADS:      { optimization_goal: 'LEAD_GENERATION',  billing_event: 'IMPRESSIONS' },
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
          const url = `https://graph.facebook.com/v21.0/${page.page_id}/posts?fields=id,message,story,full_picture,created_time,permalink_url&limit=30&access_token=${fbData.token}`
          const r = await fetch(url)
          const d = await r.json()

          if (d.error || !d.data) continue

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

      return res.json({ ok: true, posts: allNewPosts })
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message })
    }
  }

  if (action === 'create_ad') {
    const { post_id, page_id, page_name, ad_account_id, daily_budget, objective, post_message } = body

    try {
      const fbData = await getUserFbData(user.id, sb)
      if (!fbData) return res.json({ ok: false, error: 'Chưa kết nối Facebook' })

      const token = fbData.token
      const accountId = (ad_account_id || '').startsWith('act_')
        ? ad_account_id
        : 'act_' + ad_account_id
      const budgetApiValue = (Number(daily_budget) || 100000) * 100

      const objSettings = OBJECTIVE_SETTINGS[objective] || OBJECTIVE_SETTINGS.OUTCOME_TRAFFIC
      const { optimization_goal, billing_event } = objSettings

      const campaignName = `Auto - ${page_name} - ${(post_message || '').slice(0, 25)}`

      // Step 1: Create campaign
      const campaignData = await metaPost(`${accountId}/campaigns`, token, {
        name: campaignName,
        objective,
        status: 'ACTIVE',
        special_ad_categories: [],
      })
      if (campaignData.error) throw new Error(campaignData.error.message || 'Lỗi tạo campaign')
      const campaign_id = campaignData.id

      // Step 2: Create adset
      const adsetData = await metaPost(`${accountId}/adsets`, token, {
        name: 'Auto Adset',
        campaign_id,
        daily_budget: budgetApiValue,
        billing_event,
        optimization_goal,
        targeting: {
          geo_locations: { countries: ['VN'] },
          age_min: 18,
          age_max: 65,
        },
        start_time: Math.floor(Date.now() / 1000),
        status: 'ACTIVE',
      })
      if (adsetData.error) throw new Error(adsetData.error.message || 'Lỗi tạo adset')
      const adset_id = adsetData.id

      // Step 3: Create adcreative
      const creativeData = await metaPost(`${accountId}/adcreatives`, token, {
        name: 'Auto Creative',
        object_story_id: post_id,
      })
      if (creativeData.error) throw new Error(creativeData.error.message || 'Lỗi tạo creative')
      const creative_id = creativeData.id

      // Step 4: Create ad
      const adData = await metaPost(`${accountId}/ads`, token, {
        name: 'Auto Ad',
        adset_id,
        creative: { creative_id },
        status: 'ACTIVE',
      })
      if (adData.error) throw new Error(adData.error.message || 'Lỗi tạo ad')
      const ad_id = adData.id

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
      })

      return res.json({ ok: true, campaign_id, adset_id, ad_id })
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
