import { getUserFromReq } from '../../lib/auth'
import { getSupabase } from '../../lib/supabase'
import { isPlanAllowed, getMaxTeamMembers } from '../../lib/planLimits'
import { logAudit } from '../../lib/auditLog'

export default async function handler(req, res) {
  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' })

  const sb = getSupabase()

  const { data: dbUser } = await sb.from('users').select('plan').eq('id', user.id).single()
  if (!dbUser) return res.status(401).json({ error: 'Không tìm thấy tài khoản' })
  if (!isPlanAllowed(dbUser.plan, 'team')) {
    return res.status(403).json({ error: 'Tính năng này không hỗ trợ cho gói của bạn' })
  }

  if (req.method === 'GET') {
    const { data: members } = await sb.from('team_members')
      .select('id, role, created_at, member:user_id(id, name, email)')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    const list = (members || []).map(m => ({
      id: m.id,
      role: m.role,
      name: m.member?.name,
      email: m.member?.email,
      joined: m.created_at
    }))
    return res.json({ ok: true, members: list })
  }

  if (req.method === 'POST') {
    const { action, email, role, member_id } = req.body || {}

    if (action === 'add') {
      if (!email) return res.status(400).json({ error: 'Thiếu email' })
      const { data: target } = await sb.from('users').select('id, name, email').eq('email', email.toLowerCase()).single()
      if (!target) return res.status(404).json({ error: 'Không tìm thấy người dùng với email này. Họ cần đăng ký tài khoản trước.' })
      if (target.id === user.id) return res.status(400).json({ error: 'Không thể thêm chính mình' })

      const { data: existing } = await sb.from('team_members').select('id').eq('owner_id', user.id).eq('user_id', target.id).single()
      if (existing) return res.status(409).json({ error: 'Thành viên này đã có trong nhóm' })

      const { count } = await sb.from('team_members').select('*', { count: 'exact', head: true }).eq('owner_id', user.id)
      const maxMembers = getMaxTeamMembers(dbUser.plan)
      if (count >= maxMembers) {
        return res.status(403).json({ error: `Gói của bạn chỉ cho phép tối đa ${maxMembers} nhân viên` })
      }

      const { error: insErr } = await sb.from('team_members').insert({
        owner_id: user.id, user_id: target.id, email: target.email, name: target.name, role: role || 'viewer'
      })
      if (insErr) return res.status(500).json({ error: insErr.message })
      await logAudit({ req, actorType: 'user', actorId: user.id, actorEmail: user.email, action: 'team_member_add', target: target.email, meta: { role: role || 'viewer' } })
      return res.json({ ok: true, message: `Đã thêm ${target.name || email}` })
    }

    if (action === 'remove') {
      if (!member_id) return res.status(400).json({ error: 'Thiếu member_id' })
      await sb.from('team_members').delete().eq('id', member_id).eq('owner_id', user.id)
      await logAudit({ req, actorType: 'user', actorId: user.id, actorEmail: user.email, action: 'team_member_remove', target: member_id })
      return res.json({ ok: true })
    }

    if (action === 'update_role') {
      const { new_role } = req.body
      if (!member_id || !new_role) return res.status(400).json({ error: 'Thiếu member_id hoặc new_role' })
      await sb.from('team_members').update({ role: new_role }).eq('id', member_id).eq('owner_id', user.id)
      await logAudit({ req, actorType: 'user', actorId: user.id, actorEmail: user.email, action: 'team_role_change', target: member_id, meta: { new_role } })
      return res.json({ ok: true })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
