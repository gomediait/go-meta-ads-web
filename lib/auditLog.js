import { getSupabase } from './supabase'

function getIp(req) {
  if (!req) return null
  const fwd = req.headers?.['x-forwarded-for']
  if (fwd) return fwd.split(',')[0].trim()
  return req.socket?.remoteAddress || null
}

// Ghi log 1 hành động nhạy cảm (đăng nhập admin, đổi quyền, xoá user...).
// Không bao giờ throw — lỗi ghi log không được phép làm hỏng luồng nghiệp vụ chính.
export async function logAudit({ req, actorType, actorId, actorEmail, action, target, meta }) {
  try {
    const sb = getSupabase()
    await sb.from('audit_logs').insert({
      actor_type: actorType,
      actor_id: actorId != null ? String(actorId) : null,
      actor_email: actorEmail || null,
      action,
      target: target || null,
      meta: meta || null,
      ip: getIp(req),
    })
  } catch (e) {
    console.error('[auditLog] failed:', e.message)
  }
}
