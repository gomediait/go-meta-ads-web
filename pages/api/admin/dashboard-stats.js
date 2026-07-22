import { getSupabase } from '../../../lib/supabase'
import { requireAdminAuth } from '../../../lib/auth'

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false })

  const sb = getSupabase()

  try {
    // Fetch all stats concurrently
    const [
      { count: usersTotal },
      { count: usersActive },
      { count: usersAgency },
      { count: ticketsTotal },
      { count: ticketsOpen },
      { count: ticketsResolved },
      { count: affiliatesTotal },
      { data: conversions },
      { count: policyChecks },
      { data: siteSettings }
    ] = await Promise.all([
      sb.from('users').select('*', { count: 'exact', head: true }),
      sb.from('users').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      sb.from('users').select('*', { count: 'exact', head: true }).eq('plan', 'agency'),
      sb.from('support_threads').select('*', { count: 'exact', head: true }),
      sb.from('support_threads').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      sb.from('support_threads').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
      sb.from('affiliates').select('*', { count: 'exact', head: true }),
      sb.from('affiliate_conversions').select('status, commission_amount'),
      sb.from('policy_check_logs').select('*', { count: 'exact', head: true }),
      sb.from('site_settings').select('value').eq('key', 'ai_knowledge_prompts').single()
    ])

    // Affiliate revenue calculation
    let pendingCommission = 0
    let confirmedCommission = 0
    ;(conversions || []).forEach(c => {
      if (c.status === 'pending') pendingCommission += (c.commission_amount || 0)
      if (c.status === 'confirmed') confirmedCommission += (c.commission_amount || 0)
    })

    // AI Knowledge stats
    let aiDocsActive = 0
    let aiCharsTotal = 0
    try {
      const prompts = siteSettings?.value ? JSON.parse(siteSettings.value) : []
      aiDocsActive = prompts.filter(p => p.is_active).length
      aiCharsTotal = prompts.reduce((sum, p) => sum + (p.content?.length || 0), 0)
    } catch (e) {}

    // We use a fixed average cost estimate for policy checks for now 
    // e.g. 200 tokens per check * $0.0015/1k = $0.0003 per check
    const policyCostEstimate = policyChecks * 0.0003

    // Also fetch recent users and tickets for the dashboard tables
    const { data: recentUsers } = await sb.from('users')
      .select('id, email, name, phone, plan, expire_at, created_at, updated_at, status')
      .order('created_at', { ascending: false })
      .limit(5)

    const { data: recentTickets } = await sb.from('support_threads')
      .select('*, users(email)')
      .order('updated_at', { ascending: false })
      .limit(5)

    res.json({
      ok: true,
      stats: {
        users: {
          total: usersTotal || 0,
          active: usersActive || 0,
          agency: usersAgency || 0
        },
        tickets: {
          total: ticketsTotal || 0,
          open: ticketsOpen || 0,
          resolved: ticketsResolved || 0
        },
        affiliates: {
          total: affiliatesTotal || 0,
          pendingCommission,
          confirmedCommission
        },
        policy: {
          checks: policyChecks || 0,
          estimatedCostUsd: policyCostEstimate
        },
        ai: {
          activeDocs: aiDocsActive,
          totalChars: aiCharsTotal
        }
      },
      recent: {
        users: recentUsers || [],
        tickets: recentTickets || []
      }
    })
  } catch (error) {
    console.error('Dashboard Stats Error:', error)
    res.status(500).json({ ok: false, error: error.message })
  }
}

export default requireAdminAuth(handler)
