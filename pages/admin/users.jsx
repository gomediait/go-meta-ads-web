import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { Spinner, EmptyState, AdminPageHeader, AdminTable, AdminCard, AdminButton, AdminInput, AdminSelect } from '../../components/AdminUI'
import { Users, RefreshCw, ShieldCheck, Edit, Unlink } from 'lucide-react'

const PLAN_LABELS = { trial: 'Dùng thử', personal: 'Personal', business: 'Business', agency: 'Agency', 'ca-nhan': 'Cá nhân', 'doanh-nghiep': 'Doanh nghiệp' }
const PLAN_COLORS = { trial: '#64748b', personal: '#3b82f6', business: '#8b5cf6', agency: '#ec4899', 'ca-nhan': '#3b82f6', 'doanh-nghiep': '#8b5cf6' }

// ─── (Đã gỡ bỏ) EditModal / CreateKeyModal / DeleteConfirm — code chết gọi
// /api/order, /api/license không tồn tại trong repo, không có nơi nào render các
// component này (tàn dư từ 1 sản phẩm license/extension khác, không phải Go Meta Ads Web).
// ─── CUSTOMERS TAB ────────────────────────────────────────────────────────────

function WebUsersTab() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [prevPlan, setPrevPlan] = useState('')
  const [toast, setToast] = useState(null)
  const [page] = useState(1)

  const adminToken = typeof window !== 'undefined' ? atob(localStorage.getItem('gmap_admin_token') || '') : ''

  async function callApi(action, extra = {}) {
    const res = await fetch('/api/admin/web-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
      body: JSON.stringify({ action, ...extra }),
    })
    return res.json()
  }

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function load() {
    setLoading(true)
    try {
      const [statsRes, usersRes] = await Promise.all([
        callApi('stats'),
        callApi('list', { search, plan: filterPlan, page, limit: 100 }),
      ])
      if (statsRes.ok) setStats(statsRes)
      if (usersRes.ok) setUsers(usersRes.users || [])
    } catch (e) {
      showToast('Lỗi tải dữ liệu: ' + e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search, filterPlan])

  async function handleSavePlan() {
    setSaving(true)
    try {
      const d = await callApi('update_user', {
        user_id: editing.id,
        plan: editForm.plan,
        expire_at: editForm.expire_at || null,
        name: editForm.name,
        phone: editForm.phone,
        status: editForm.status,
      })
      if (!d.ok) return showToast(d.error || 'Lỗi', 'error')
      showToast('Đã cập nhật thành công')
      setEditing(null)
      load()
    } catch { showToast('Lỗi kết nối', 'error') }
    finally { setSaving(false) }
  }

  async function handleResetFb(user) {
    if (!confirm(`Xoá kết nối Facebook của "${user.email}"?`)) return
    const d = await callApi('reset_fb', { user_id: user.id })
    if (d.ok) { showToast('Đã reset FB'); load() }
    else showToast(d.error || 'Lỗi', 'error')
  }

  async function handleDelete(user) {
    if (!confirm(`XOÁ tài khoản "${user.email}"? Không thể hoàn tác!`)) return
    const d = await callApi('delete', { user_id: user.id })
    if (d.ok) { showToast('Đã xoá tài khoản'); load() }
    else showToast(d.error || 'Lỗi', 'error')
  }

  const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }
  const inp = {
    padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13,
    fontFamily: 'inherit', outline: 'none', background: '#fff', color: 'var(--txt)',
  }

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'error' ? 'var(--red)' : 'var(--grn)',
          color: '#fff', borderRadius: 10, padding: '12px 20px',
          fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,.25)',
        }}>{toast.msg}</div>
      )}

      <AdminPageHeader title="Quản lý Web Users (SaaS)" icon={Users} />

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Tổng users', value: stats.total, color: 'var(--blue)', icon: Users },
            { label: 'Dùng thử', value: stats.plan_counts?.trial || 0, color: 'var(--mut)', icon: ShieldCheck },
            { label: 'Personal', value: stats.plan_counts?.personal || 0, color: 'var(--blue)', icon: Users },
            { label: 'Business', value: stats.plan_counts?.business || 0, color: 'var(--grn)', icon: Users },
            { label: 'Đăng ký hôm nay', value: stats.today_new || 0, color: 'var(--primary)', icon: Users },
          ].map((s, i) => {
            const IconComp = s.icon
            return (
              <AdminCard key={i} style={{ padding: '16px 18px', marginBottom: 0 }}>
                <div style={{ marginBottom: 6, color: s.color }}><IconComp size={24} /></div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--mut)', marginTop: 2 }}>{s.label}</div>
              </AdminCard>
            )
          })}
        </div>
      )}

      {/* Filter */}
      <AdminCard style={{ padding: '14px 20px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <AdminInput
          style={{ width: 250 }}
          placeholder="Tìm theo email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <AdminSelect style={{ width: 200 }} value={filterPlan} onChange={e => setFilterPlan(e.target.value)}>
          <option value="all">Tất cả gói</option>
          <option value="trial">Dùng thử</option>
          <option value="personal">Personal</option>
          <option value="business">Business</option>
          <option value="agency">Agency</option>
        </AdminSelect>
        <AdminButton onClick={load} icon={RefreshCw}>
          Làm mới
        </AdminButton>
        <span style={{ fontSize: 13, color: 'var(--mut)' }}>{users.length} users</span>
      </AdminCard>

      {/* Table */}
      <AdminCard noPadding>
        {loading ? <Spinner /> : users.length === 0 ? <EmptyState icon={<Users size={48} color="var(--bd)" />} text="Không có user nào" /> : (
          <AdminTable columns={['Email', 'Tên', 'Gói', 'Hết hạn', 'Facebook', 'Tài khoản Ads', 'Đăng ký', 'Thao tác']}>
            {users.map((u, i) => {
              const pc = PLAN_COLORS[u.plan] || PLAN_COLORS.trial
              return (
                <tr key={u.id}>
                      <td style={{ padding: '10px 14px', fontSize: 13 }}>
                        <div style={{ fontWeight: 600, color: 'var(--txt)' }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#475569' }}>{u.name || '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ background: pc.bg, color: pc.color, borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                          {PLAN_LABELS[u.plan] || u.plan}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: u.is_expired ? '#ef4444' : u.days_left != null && u.days_left <= 7 ? '#f59e0b' : '#475569' }}>
                        {u.expire_at
                          ? <>{new Date(u.expire_at).toLocaleDateString('vi-VN')}{u.days_left != null && <span style={{ marginLeft: 4 }}>({u.days_left > 0 ? `còn ${u.days_left}d` : 'HẾT HẠN'})</span>}</>
                          : <span style={{ color: 'var(--mut)' }}>Không giới hạn</span>}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12 }}>
                        {u.fb_connected
                          ? <span style={{ color: '#059669', fontWeight: 600 }}>✅ Đã kết nối</span>
                          : <span style={{ color: 'var(--mut)' }}>Chưa kết nối</span>}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#475569' }}>
                        {u.ad_account_count > 0 ? `${u.ad_account_count} TK` : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--mut)', whiteSpace: 'nowrap' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <AdminButton
                            variant="outline"
                            icon={Edit}
                            onClick={() => {
                              setEditing(u)
                              setPrevPlan(u.plan)
                              setEditForm({
                                plan: u.plan,
                                expire_at: u.expire_at ? u.expire_at.slice(0, 10) : '',
                                name: u.name || '',
                                phone: u.phone || '',
                                status: u.status || 'active',
                              })
                            }}
                          >Sửa</AdminButton>
                          {u.fb_connected && (
                            <AdminButton variant="secondary" icon={Unlink} onClick={() => handleResetFb(u)}>
                              Reset FB
                            </AdminButton>
                          )}
                          <button
                            onClick={() => handleDelete(u)}
                            style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                          >🗑</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
          </AdminTable>
        )}
      </AdminCard>

      {/* Edit Modal */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt)', marginBottom: 2 }}>Cập nhật tài khoản</h3>
                <p style={{ fontSize: 12, color: 'var(--mut)' }}>{editing.email}</p>
              </div>
              <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--mut)', lineHeight: 1 }}>×</button>
            </div>

            {/* Section: Thông tin */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #f1f5f9' }}>
              Thông tin cá nhân
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--mut)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Họ tên</label>
                <input style={{ ...inp, width: '100%' }} placeholder="Nguyễn Văn A"
                  value={editForm.name || ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--mut)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Số điện thoại</label>
                <input style={{ ...inp, width: '100%' }} placeholder="0912345678"
                  value={editForm.phone || ''} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>

            {/* Section: Trạng thái */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--mut)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Trạng thái tài khoản</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { value: 'active', label: '✅ Hoạt động', bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
                  { value: 'locked', label: '🔒 Khoá', bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
                ].map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setEditForm(p => ({ ...p, status: opt.value }))}
                    style={{
                      padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      background: editForm.status === opt.value ? opt.bg : '#f8fafc',
                      color: editForm.status === opt.value ? opt.color : '#94a3b8',
                      border: `1.5px solid ${editForm.status === opt.value ? opt.border : '#e2e8f0'}`,
                    }}
                  >{opt.label}</button>
                ))}
              </div>
            </div>

            {/* Section: Gói & Hạn */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #f1f5f9' }}>
              Gói dịch vụ & Thời hạn
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--mut)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Gói dịch vụ</label>
              <select
                style={{ ...inp, width: '100%' }}
                value={editForm.plan}
                onChange={e => {
                  const newPlan = e.target.value
                  setEditForm(p => {
                    // Auto-suggest 30 days from today if switching from trial to paid and no expiry set or already expired
                    const needsExpiry = newPlan !== 'trial' && prevPlan === 'trial'
                    const isExpiredOrEmpty = !p.expire_at || new Date(p.expire_at) < new Date()
                    const newExpiry = (needsExpiry && isExpiredOrEmpty)
                      ? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
                      : p.expire_at
                    return { ...p, plan: newPlan, expire_at: newExpiry }
                  })
                }}
              >
                <option value="trial">Dùng thử</option>
                <option value="personal">Personal</option>
                <option value="business">Business</option>
                <option value="agency">Agency</option>
              </select>
              {editForm.plan !== 'trial' && prevPlan === 'trial' && (
                <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>
                  ⚠️ Đã tự điền +30 ngày. Điều chỉnh ngày hết hạn nếu cần.
                </div>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--mut)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Ngày hết hạn <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--mut)' }}>(để trống = không giới hạn)</span>
              </label>
              <input
                type="date"
                style={{ ...inp, width: '100%', marginBottom: 8 }}
                value={editForm.expire_at || ''}
                onChange={e => setEditForm(p => ({ ...p, expire_at: e.target.value }))}
              />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { label: '+30 ngày', days: 30 },
                  { label: '+90 ngày', days: 90 },
                  { label: '+180 ngày', days: 180 },
                  { label: '+1 năm', days: 365 },
                ].map(({ label, days }) => (
                  <button key={days} type="button"
                    onClick={() => {
                      const base = editForm.expire_at ? new Date(editForm.expire_at + 'T00:00:00') : new Date()
                      base.setDate(base.getDate() + days)
                      setEditForm(p => ({ ...p, expire_at: base.toISOString().slice(0, 10) }))
                    }}
                    style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                  >{label}</button>
                ))}
                <button type="button"
                  onClick={() => setEditForm(p => ({ ...p, expire_at: '' }))}
                  style={{ background: '#f1f5f9', color: 'var(--mut)', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                >Xoá hạn</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
              <button onClick={() => setEditing(null)}
                style={{ ...inp, cursor: 'pointer', background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 20px', fontWeight: 600 }}>
                Huỷ
              </button>
              <button onClick={handleSavePlan} disabled={saving}
                style={{ ...inp, cursor: 'pointer', background: 'var(--blue)', color: '#fff', border: 'none', padding: '10px 24px', fontWeight: 700 }}>
                {saving ? 'Đang lưu...' : '💾 Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Image upload helper (web app endpoint) ──────────────────────────────────
async function uploadImageWeb(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const r = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: e.target.result }),
        })
        const d = await r.json()
        if (!d.ok) throw new Error(d.error || 'Upload thất bại')
        resolve({ url: d.url, thumbnail: d.thumbnail || d.url })
      } catch (err) { reject(err) }
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─── WEB TICKETS TAB ─────────────────────────────────────────────────────────

export default function Page() {
  return (
    <AdminLayout title="Web Users">
      <WebUsersTab />
    </AdminLayout>
  )
}
