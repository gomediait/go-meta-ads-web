import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../lib/AuthContext'
import Link from 'next/link'
import { isPlanAllowed, getMaxTeamMembers } from '../../lib/planLimits'
import { Users, Lock, UserPlus, User, ClipboardList, CheckCircle2, Loader2, X, Plus, ArrowRight } from 'lucide-react'

export default function Team() {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [addEmail, setAddEmail] = useState('')
  const [addRole, setAddRole] = useState('viewer')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const plan = user?.plan || 'trial'
  const canUseTeam = isPlanAllowed(plan, 'team')
  const maxMembers = getMaxTeamMembers(plan)
  const atLimit = maxMembers !== Infinity && members.length >= maxMembers

  useEffect(() => {
    fetchMembers()
  }, [])

  async function fetchMembers() {
    setLoading(true)
    try {
      const r = await fetch('/api/team')
      if (r.ok) {
        const d = await r.json()
        setMembers(d.members || [])
      }
    } catch {}
    finally { setLoading(false) }
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!addEmail.trim()) return
    if (atLimit) { setError(`Gói ${plan} giới hạn ${maxMembers} nhân viên. Nâng cấp để thêm nhiều hơn.`); return }
    setError(''); setSuccess(''); setAdding(true)
    try {
      const r = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', email: addEmail.trim(), role: addRole })
      })
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'Lỗi khi thêm thành viên'); return }
      setSuccess(`Đã thêm ${addEmail} vào nhóm`)
      setAddEmail('')
      fetchMembers()
    } catch { setError('Lỗi kết nối mạng') }
    finally { setAdding(false) }
  }

  async function handleRemove(memberId, email) {
    if (!confirm(`Xoá ${email} khỏi nhóm?`)) return
    try {
      const r = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', member_id: memberId })
      })
      if (r.ok) { fetchMembers() }
    } catch {}
  }

  const ROLE_LABELS = { admin: 'Admin', manager: 'Manager', viewer: 'Viewer' }
  const ROLE_COLORS = { admin: 'var(--primary)', manager: 'var(--blue)', viewer: 'var(--mut)' }

  return (
    <DashboardLayout title="Nhân viên">
      <div className="team-page">

        <div className="page-header">
          <span className="ph-icon"><Users size={32} aria-hidden="true" /></span>
          <div>
            <h1>Quản lý Nhân viên</h1>
            <p>Thêm thành viên và phân quyền truy cập dashboard</p>
          </div>
        </div>

        {!canUseTeam ? (
          <div className="upgrade-card">
            <div className="uc-icon"><Lock size={40} aria-hidden="true" /></div>
            <div className="uc-title">Tính năng dành cho gói Business trở lên</div>
            <div className="uc-desc">Quản lý nhóm nhiều thành viên với phân quyền chi tiết. Đồng bộ CPA và cài đặt cho toàn team.</div>
            <Link href="/mua-goi" className="uc-btn">Nâng cấp ngay <ArrowRight size={14} aria-hidden="true" /></Link>
          </div>
        ) : (
          <>
            {/* Quota indicator */}
            {maxMembers !== Infinity && (
              <div className="quota-bar">
                <span>Nhân viên: <strong>{members.length}/{maxMembers}</strong></span>
                {atLimit && (
                  <Link href="/mua-goi" className="quota-upgrade-link">
                    Nâng cấp để thêm <ArrowRight size={12} aria-hidden="true" />
                  </Link>
                )}
              </div>
            )}

            {/* Add member form */}
            <div className="card add-card">
              <div className="card-title"><UserPlus size={14} aria-hidden="true" /> Thêm thành viên</div>
              <form className="add-form" onSubmit={handleAdd} aria-label="Thêm thành viên mới">
                <input type="email" placeholder="Email nhân viên" className="add-email"
                  value={addEmail} onChange={e => setAddEmail(e.target.value)} required
                  disabled={atLimit} aria-label="Email nhân viên" />
                <select className="add-role" value={addRole} onChange={e => setAddRole(e.target.value)} disabled={atLimit} aria-label="Vai trò thành viên">
                  <option value="viewer">Viewer — Chỉ xem</option>
                  <option value="manager">Manager — Xem & chỉnh sửa</option>
                  <option value="admin">Admin — Toàn quyền</option>
                </select>
                <button type="submit" className="add-btn" disabled={adding || atLimit}>
                  {adding ? <Loader2 size={14} className="spin-icon" aria-hidden="true" /> : atLimit ? <><Lock size={14} aria-hidden="true" /> Đã đủ</> : <><Plus size={14} aria-hidden="true" /> Thêm</>}
                </button>
              </form>
              {error   && <div className="msg-err" role="alert">{error}</div>}
              {success && <div className="msg-ok" role="status"><CheckCircle2 size={14} aria-hidden="true" /> {success}</div>}
            </div>

            {/* Members list */}
            <div className="card">
              <div className="card-title"><User size={14} aria-hidden="true" /> Danh sách thành viên</div>

              {loading && <div className="loading-text">Đang tải...</div>}

              {!loading && members.length === 0 && (
                <div className="empty-state">
                  <div className="es-icon"><Users size={32} aria-hidden="true" /></div>
                  <div className="es-text">Chưa có thành viên nào. Thêm ngay để cộng tác!</div>
                </div>
              )}

              {!loading && members.length > 0 && (
                <div className="member-list" role="list" aria-label="Danh sách thành viên">
                  {members.map(m => (
                    <div key={m.id} className="member-row" role="listitem">
                      <div className="member-avatar">{(m.name || m.email || '?')[0].toUpperCase()}</div>
                      <div className="member-info">
                        <div className="member-name">{m.name || m.email}</div>
                        <div className="member-email">{m.name ? m.email : ''}</div>
                      </div>
                      <span className="member-role" style={{ color: ROLE_COLORS[m.role], background: ROLE_COLORS[m.role] + '18' }}>
                        {ROLE_LABELS[m.role] || m.role}
                      </span>
                      <button className="member-remove" onClick={() => handleRemove(m.id, m.email)} title="Xoá thành viên" aria-label={`Xoá ${m.name || m.email}`}><X size={14} aria-hidden="true" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="perm-table" role="table" aria-label="Bảng phân quyền">
              <div className="card-title" style={{ marginBottom: 12 }}><ClipboardList size={14} aria-hidden="true" /> Bảng phân quyền</div>
              <div className="pt-wrap">
                {[
                  { feature: 'Vai trò',               admin: 'Admin',  manager: 'Manager', viewer: 'Viewer' },
                  { feature: 'Xem dashboard',         admin: true,  manager: true,  viewer: true  },
                  { feature: 'Kiểm soát lãi lỗ',      admin: true,  manager: true,  viewer: true  },
                  { feature: 'Xem báo cáo',            admin: true,  manager: true,  viewer: true  },
                  { feature: 'Kiểm tra vi phạm',       admin: true,  manager: true,  viewer: false },
                  { feature: 'Bật/tắt chiến dịch',     admin: true,  manager: true,  viewer: false },
                  { feature: 'Cài đặt Auto Care',      admin: true,  manager: false, viewer: false },
                  { feature: 'Quản lý nhóm',           admin: true,  manager: false, viewer: false },
                  { feature: 'Kết nối Facebook Ads',   admin: true,  manager: false, viewer: false },
                ].map((row, i) => (
                  <div key={i} className={`pt-row${i === 0 ? ' header' : ''}`}>
                    <div className="pt-feat">{row.feature}</div>
                    {['admin', 'manager', 'viewer'].map(r => (
                      <div key={r} className="pt-cell">
                        {typeof row[r] === 'boolean' ? (row[r] ? <CheckCircle2 size={16} className="perm-yes" aria-label="Có" /> : <span className="perm-no" aria-label="Không">—</span>) : row[r]}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .team-page { padding: 24px; max-width: 800px; margin: 0 auto; }
        .page-header { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }
        .ph-icon { color: var(--primary); display: flex; align-items: center; }
        h1 { font-size: 18px; font-weight: 700; color: var(--txt); margin-bottom: 4px; }
        p  { font-size: 13px; color: var(--mut); }

        .quota-bar { background: var(--s2); border: 1px solid var(--bd); border-radius: 10px; padding: 10px 16px; font-size: 13px; color: var(--mut); margin-bottom: 12px; display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
        .quota-upgrade-link { font-size: 12px; color: var(--primary); font-weight: 700; text-decoration: none; margin-left: 12px; display: inline-flex; align-items: center; gap: 4px; }
        .quota-upgrade-link:hover { opacity: .88; }

        .upgrade-card { display: flex; flex-direction: column; align-items: center; gap: 12px; background: var(--s1); border: 1px solid var(--bd); border-radius: 16px; padding: 48px 32px; text-align: center; }
        .uc-icon { color: var(--mut); display: flex; align-items: center; justify-content: center; }
        .uc-title { font-size: 16px; font-weight: 700; color: var(--txt); }
        .uc-desc { font-size: 13px; color: var(--mut); max-width: 380px; line-height: 1.6; }
        .uc-btn { background: var(--primary); color: var(--s1); border-radius: 9px; padding: 10px 22px; font-size: 13px; font-weight: 700; text-decoration: none; transition: opacity .15s; display: inline-flex; align-items: center; gap: 6px; }
        .uc-btn:hover { opacity: .88; }
        .uc-btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

        .card { background: var(--s1); border: 1px solid var(--bd); border-radius: 14px; padding: 18px; margin-bottom: 16px; }
        .card-title { font-size: 13px; font-weight: 700; color: var(--txt); margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
        .card-title svg { color: var(--blue); }

        .add-form { display: flex; gap: 8px; flex-wrap: wrap; }
        .add-email { flex: 1; min-width: 200px; background: var(--s2); border: 1.5px solid var(--bd); border-radius: 9px; padding: 10px 13px; font-size: 14px; color: var(--txt); outline: none; transition: border-color .15s; font-family: inherit; }
        .add-email:focus { border-color: var(--primary); }
        .add-email:focus-visible { outline: 2px solid var(--primary); outline-offset: 1px; border-color: var(--primary); }
        .add-role { background: var(--s2); border: 1.5px solid var(--bd); border-radius: 9px; padding: 10px 13px; font-size: 14px; color: var(--txt); outline: none; cursor: pointer; font-family: inherit; transition: border-color .15s; }
        .add-role:focus-visible { outline: 2px solid var(--primary); outline-offset: 1px; border-color: var(--primary); }
        .add-btn { background: var(--primary); color: var(--s1); border: none; border-radius: 9px; padding: 10px 18px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; transition: opacity .15s; white-space: nowrap; display: inline-flex; align-items: center; gap: 6px; }
        .add-btn:hover:not(:disabled) { opacity: .88; }
        .add-btn:disabled { opacity: .5; cursor: not-allowed; }
        .add-btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
        .msg-err { margin-top: 10px; font-size: 13px; color: var(--red); display: flex; align-items: center; gap: 4px; }
        .msg-ok  { margin-top: 10px; font-size: 13px; color: var(--grn); display: flex; align-items: center; gap: 4px; }

        .loading-text { font-size: 13px; color: var(--mut); padding: 20px 0; text-align: center; }
        .empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 32px 0; }
        .es-icon { color: var(--mut); opacity: .4; display: flex; align-items: center; justify-content: center; }
        .es-text { font-size: 13px; color: var(--mut); }

        .member-list { display: flex; flex-direction: column; gap: 2px; }
        .member-row { display: flex; align-items: center; gap: 12px; padding: 10px 8px; border-radius: 10px; transition: background .15s; }
        .member-row:hover { background: var(--s2); }
        .member-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--navy), var(--navy2, #1a3a8f)); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: var(--s1); flex-shrink: 0; }
        .member-info { flex: 1; min-width: 0; }
        .member-name { font-size: 14px; font-weight: 600; color: var(--txt); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .member-email { font-size: 12px; color: var(--mut); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .member-role { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
        .member-remove { background: transparent; border: 1px solid transparent; border-radius: 7px; padding: 4px 8px; font-size: 12px; color: var(--mut); cursor: pointer; transition: all .15s; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .member-remove:hover { border-color: var(--red); color: var(--red); }
        .member-remove:focus-visible { outline: 2px solid var(--red); outline-offset: 1px; }

        .perm-table { background: var(--s1); border: 1px solid var(--bd); border-radius: 14px; padding: 18px; }
        .pt-wrap { border: 1px solid var(--bd); border-radius: 10px; overflow: hidden; }
        .pt-row { display: grid; grid-template-columns: 1fr 80px 80px 80px; border-bottom: 1px solid var(--bd); }
        .pt-row.header { background: var(--s2); font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; color: var(--mut); }
        .pt-row:last-child { border-bottom: none; }
        .pt-feat { padding: 9px 14px; font-size: 13px; color: var(--txt); }
        .pt-cell { padding: 9px 14px; font-size: 13px; text-align: center; color: var(--mut); display: flex; align-items: center; justify-content: center; }
        .perm-yes { color: var(--grn); }
        .perm-no { color: var(--mut); font-size: 14px; }

        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .team-page { padding: 16px; }
          .page-header { gap: 10px; margin-bottom: 20px; }
          h1 { font-size: 16px; }
          .upgrade-card { padding: 32px 16px; }
          .add-form { flex-direction: column; }
          .add-email { min-width: 0; }
          .member-row { gap: 8px; padding: 8px 4px; }
          .member-avatar { width: 32px; height: 32px; font-size: 12px; }
          .member-name { font-size: 13px; }
          .pt-row { grid-template-columns: 1fr 60px 60px 60px; }
          .pt-feat { padding: 8px 10px; font-size: 12px; }
          .pt-cell { padding: 8px 6px; font-size: 12px; }
          .quota-upgrade-link { margin-left: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .spin-icon { animation: none; }
          .uc-btn, .add-btn, .add-email, .add-role, .member-row, .member-remove { transition: none; }
        }
      `}</style>
    </DashboardLayout>
  )
}
