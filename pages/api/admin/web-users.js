import { getSupabase } from '../../../lib/supabase'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'GoMedia@3038485##$$G'

function verifyAdmin(req) {
  const auth = req.headers['x-admin-token'] || ''
  return auth === ADMIN_PASSWORD
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false })
  if (!verifyAdmin(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' })

  const sb = getSupabase()
  const { action, ...body } = req.body || {}

  // ─── LIST USERS ───────────────────────────────────────────────
  if (action === 'list') {
    const { search, plan, page = 1, limit = 50 } = body

    let query = sb.from('users')
      .select('id, email, name, phone, plan, expire_at, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (search) query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`)
    if (plan && plan !== 'all') query = query.eq('plan', plan)

    const from = (page - 1) * limit
    query = query.range(from, from + limit - 1)

    const { data: usersData, error } = await query
    if (error) return res.status(500).json({ ok: false, error: error.message })
    if (!usersData?.length) return res.json({ ok: true, users: [], total: 0 })

    const userIds = usersData.map(u => u.id)

    // Separate queries — no FK join syntax needed
    const [fbRes, acRes] = await Promise.all([
      sb.from('fb_connections').select('user_id, token_expires_at').in('user_id', userIds),
      sb.from('fb_ad_accounts').select('user_id, account_id, account_name').in('user_id', userIds),
    ])

    const fbMap = {}
    for (const f of (fbRes.data || [])) fbMap[f.user_id] = f

    const acMap = {}
    for (const a of (acRes.data || [])) {
      if (!acMap[a.user_id]) acMap[a.user_id] = []
      acMap[a.user_id].push(a.account_name || a.account_id)
    }

    const users = usersData.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      phone: u.phone || '',
      plan: u.plan || 'trial',
      expire_at: u.expire_at,
      created_at: u.created_at,
      updated_at: u.updated_at,
      fb_connected: !!fbMap[u.id],
      fb_token_expires_at: fbMap[u.id]?.token_expires_at || null,
      ad_accounts: acMap[u.id] || [],
      ad_account_count: (acMap[u.id] || []).length,
      is_expired: u.expire_at ? new Date(u.expire_at) < new Date() : false,
      days_left: u.expire_at
        ? Math.ceil((new Date(u.expire_at) - new Date()) / (1000 * 60 * 60 * 24))
        : null,
    }))

    return res.json({ ok: true, users, total: users.length })
  }

  // ─── STATS SUMMARY ────────────────────────────────────────────
  if (action === 'stats') {
    const [totalRes, planRes, recentRes] = await Promise.all([
      sb.from('users').select('id', { count: 'exact', head: true }),
      sb.from('users').select('plan'),
      sb.from('users').select('id, email, plan, created_at').order('created_at', { ascending: false }).limit(5),
    ])

    const planCounts = {}
    for (const u of (planRes.data || [])) {
      const p = u.plan || 'trial'
      planCounts[p] = (planCounts[p] || 0) + 1
    }

    const today = new Date().toISOString().slice(0, 10)
    const todayNew = (planRes.data || []).filter(u =>
      u.created_at?.slice(0, 10) === today
    ).length

    return res.json({
      ok: true,
      total: totalRes.count || 0,
      plan_counts: planCounts,
      today_new: todayNew,
      recent: recentRes.data || [],
    })
  }

  // ─── UPDATE USER (plan, expiry, name, phone, status) ──────────
  if (action === 'update_plan' || action === 'update_user') {
    const { user_id, plan, expire_at, name, phone, status } = body
    if (!user_id) return res.status(400).json({ ok: false, error: 'Thiếu user_id' })

    const validPlans = ['trial', 'personal', 'business', 'agency']
    if (plan && !validPlans.includes(plan)) {
      return res.status(400).json({ ok: false, error: 'Plan không hợp lệ' })
    }

    const update = { updated_at: new Date().toISOString() }
    if (plan) update.plan = plan
    if (expire_at !== undefined) update.expire_at = expire_at || null
    if (name?.trim()) update.name = name.trim()
    if (phone?.trim()) update.phone = phone.trim()
    if (status === 'active' || status === 'locked') update.status = status

    const { error } = await sb.from('users').update(update).eq('id', user_id)
    if (error) return res.status(500).json({ ok: false, error: error.message })
    return res.json({ ok: true })
  }

  // ─── RESET FB CONNECTION ──────────────────────────────────────
  if (action === 'reset_fb') {
    const { user_id } = body
    if (!user_id) return res.status(400).json({ ok: false, error: 'Thiếu user_id' })

    await sb.from('fb_connections').delete().eq('user_id', user_id)
    await sb.from('fb_ad_accounts').delete().eq('user_id', user_id)
    return res.json({ ok: true })
  }

  // ─── DELETE USER ──────────────────────────────────────────────
  if (action === 'delete') {
    const { user_id } = body
    if (!user_id) return res.status(400).json({ ok: false, error: 'Thiếu user_id' })

    const { error } = await sb.from('users').delete().eq('id', user_id)
    if (error) return res.status(500).json({ ok: false, error: error.message })
    return res.json({ ok: true })
  }

  return res.status(400).json({ ok: false, error: 'Action không hợp lệ' })
}
