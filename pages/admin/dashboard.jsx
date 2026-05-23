import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { checkAdminAuth, adminLogout } from '../../lib/adminAuth'
import { uploadImage } from '../../lib/uploadImage'

const API = 'https://go-meta-ads-backend.vercel.app'

async function apiPost(endpoint, body) {
  const res = await fetch(`${API}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function Badge({ status }) {
  const map = {
    pending:     { bg: '#fef3c7', color: '#92400e', label: 'Chờ xử lý' },
    confirmed:   { bg: '#d1fae5', color: '#065f46', label: 'Đã xác nhận' },
    cancelled:   { bg: '#fee2e2', color: '#7f1d1d', label: 'Đã hủy' },
    open:        { bg: '#dbeafe', color: '#1e3a8a', label: 'Mở' },
    in_progress: { bg: '#fef3c7', color: '#92400e', label: 'Đang xử lý' },
    resolved:    { bg: '#d1fae5', color: '#065f46', label: 'Đã giải quyết' },
    active:      { bg: '#d1fae5', color: '#065f46', label: 'Hoạt động' },
    inactive:    { bg: '#f1f5f9', color: '#475569', label: 'Không hoạt động' },
    expired:     { bg: '#fee2e2', color: '#7f1d1d', label: 'Hết hạn' },
    disabled:    { bg: '#f1f5f9', color: '#475569', label: 'Vô hiệu' },
  }
  const s = map[status] || { bg: '#f1f5f9', color: '#475569', label: status || 'N/A' }
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 700,
      background: s.bg,
      color: s.color,
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  )
}

function Spinner() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
      <div style={{
        display: 'inline-block',
        width: 20,
        height: 20,
        border: '3px solid #e2e8f0',
        borderTop: '3px solid #00c7de',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <p style={{ marginTop: 10, fontSize: 13 }}>Đang tải...</p>
    </div>
  )
}

function ErrorBox({ msg }) {
  if (!msg) return null
  return (
    <div style={{
      background: '#fee2e2',
      border: '1px solid #fca5a5',
      borderRadius: 8,
      padding: '10px 14px',
      color: '#b91c1c',
      fontSize: 13,
      marginBottom: 16,
    }}>
      ⚠️ {msg}
    </div>
  )
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 0', color: '#94a3b8' }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>{icon || '📭'}</div>
      <p style={{ fontSize: 14 }}>{text || 'Không có dữ liệu'}</p>
    </div>
  )
}

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false)
  function doCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button
      onClick={doCopy}
      title="Sao chép"
      style={{
        marginLeft: 4,
        background: copied ? '#d1fae5' : 'rgba(0,199,222,0.1)',
        border: '1px solid rgba(0,199,222,0.3)',
        borderRadius: 4,
        padding: '1px 6px',
        fontSize: 11,
        color: copied ? '#065f46' : '#00c7de',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {copied ? '✓' : '⎘'}
    </button>
  )
}

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const [loading, setLoading] = useState(true)
  const [webStats, setWebStats] = useState(null)
  const [webRecent, setWebRecent] = useState([])
  const [openTickets, setOpenTickets] = useState(0)

  const adminToken = typeof window !== 'undefined' ? atob(localStorage.getItem('gmap_admin_token') || '') : ''

  async function callAdmin(action, extra = {}) {
    const res = await fetch('/api/admin/web-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
      body: JSON.stringify({ action, ...extra }),
    })
    return res.json()
  }

  async function callAdminTickets(action, extra = {}) {
    const res = await fetch('/api/admin/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
      body: JSON.stringify({ action, ...extra }),
    })
    return res.json()
  }

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, recentRes, ticketsRes] = await Promise.allSettled([
          callAdmin('stats'),
          callAdmin('list', { page: 1, limit: 5 }),
          callAdminTickets('list', { status: 'open', limit: 100 }),
        ])
        if (statsRes.status === 'fulfilled' && statsRes.value?.ok) setWebStats(statsRes.value)
        if (recentRes.status === 'fulfilled' && recentRes.value?.ok) setWebRecent(recentRes.value.users || [])
        if (ticketsRes.status === 'fulfilled' && ticketsRes.value?.ok) setOpenTickets(ticketsRes.value.tickets?.length || 0)
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [])

  const card = { background: '#fff', borderRadius: 12, padding: '20px 22px', boxShadow: '0 1px 8px rgba(0,0,0,.07)', flex: 1, minWidth: 0 }
  const planColor = { trial: '#94a3b8', personal: '#3b82f6', business: '#10b981', agency: '#f59e0b' }
  const planLabel = { trial: 'Dùng thử', personal: 'Personal', business: 'Business', agency: 'Agency' }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a2332', marginBottom: 8 }}>📊 Tổng quan hệ thống</h2>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Web SaaS — adsmeta.gonetwork.vn</p>

      {loading ? <Spinner /> : (
        <>
          {/* Web SaaS Metrics */}
          <div style={{ marginBottom: 12, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8' }}>
            🌐 WEB USERS (SaaS)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'Tổng users', value: webStats?.total ?? '—', color: '#0c2a72', icon: '👤' },
              { label: 'Dùng thử', value: webStats?.plan_counts?.trial ?? 0, color: '#64748b', icon: '🔓' },
              { label: 'Personal', value: webStats?.plan_counts?.personal ?? 0, color: '#2563eb', icon: '💳' },
              { label: 'Business', value: webStats?.plan_counts?.business ?? 0, color: '#059669', icon: '💼' },
              { label: 'Agency', value: webStats?.plan_counts?.agency ?? 0, color: '#d97706', icon: '🏢' },
            ].map(c => (
              <div key={c.label} style={card}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{c.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
            <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 40 }}>✨</div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#7c3aed' }}>{webStats?.today_new ?? 0}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Đăng ký hôm nay</div>
              </div>
            </div>
            <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
              <div style={{ fontSize: 40 }}>🎫</div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: openTickets > 0 ? '#ef4444' : '#10b981' }}>{openTickets}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Ticket chờ xử lý</div>
              </div>
            </div>
          </div>

          {/* Recent users */}
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,.07)', overflow: 'hidden', marginBottom: 28 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1a2332' }}>👤 Users đăng ký gần nhất</h3>
            </div>
            {webRecent.length === 0 ? <EmptyState text="Chưa có user nào" /> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Email', 'Gói', 'Facebook', 'Ngày đăng ký'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {webRecent.map((u, i) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 ? '#fafbfc' : '#fff' }}>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, color: '#1a2332' }}>{u.email}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ background: `${planColor[u.plan] || '#94a3b8'}18`, color: planColor[u.plan] || '#94a3b8', borderRadius: 999, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>
                          {planLabel[u.plan] || u.plan}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: u.fb_connected ? '#059669' : '#94a3b8' }}>
                        {u.fb_connected ? '✅ Đã kết nối' : 'Chưa'}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#94a3b8' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── EDIT ORDER MODAL ─────────────────────────────────────────────────────────
const PLAN_OPTIONS = [
  { value: 'ca-nhan', label: 'Cá nhân' },
  { value: 'doanh-nghiep', label: 'Doanh nghiệp' },
  { value: 'agency', label: 'Agency' },
  { value: 'thu-nghiem', label: 'Thử nghiệm' },
]
const BILLING_OPTIONS = [
  { value: 'thang', label: '1 Tháng' },
  { value: 'nam1', label: '1 Năm' },
  { value: 'nam3', label: '3 Năm' },
  { value: 'nam5', label: '5 Năm' },
  { value: 'trial', label: 'Dùng thử' },
]

function computeCK(name, plan, billing) {
  if (!name) return ''
  const planMap = { 'ca-nhan': 'CN', 'doanh-nghiep': 'DN', 'agency': 'AGC', 'thu-nghiem': 'TN' }
  const billMap = { 'thang': '1T', 'nam1': '1N', 'nam3': '3N', 'nam5': '5N', 'trial': 'TRIAL' }
  return `GMAP-${planMap[plan] || plan}-${billMap[billing] || billing}-${name.split(' ').pop().toUpperCase()}`
}

function EditModal({ order, onClose, onSaved }) {
  const isNew = !order

  // Parse extra info từ note JSON (tách khỏi ghi chú thật)
  const extraInfo = (() => {
    try { return order?.note ? JSON.parse(order.note) : {} } catch { return {} }
  })()
  const isNoteJSON = order?.note && order.note.trim().startsWith('{')

  // Tính ngày bắt đầu (lấy từ created_at của order)
  const startDateStr = order?.created_at ? new Date(order.created_at).toISOString().slice(0,10) : new Date().toISOString().slice(0,10)

  // Tính ngày kết thúc dự kiến từ billing_tab (nếu chưa có trong extraInfo)
  const calcDefaultExpire = () => {
    if (extraInfo.expire_date_estimate) {
      // Chuyển DD/MM/YYYY → YYYY-MM-DD
      const parts = extraInfo.expire_date_estimate.split('/')
      if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`
    }
    const d = new Date(startDateStr)
    const bt = order?.billing_tab || 'thang'
    if (bt === 'thang') d.setMonth(d.getMonth() + 1)
    else if (bt === 'nam1') d.setFullYear(d.getFullYear() + 1)
    else if (bt === 'nam3') d.setFullYear(d.getFullYear() + 3)
    else if (bt === 'nam5') d.setFullYear(d.getFullYear() + 5)
    else if (bt === 'trial') d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0,10)
  }

  const [form, setForm] = useState({
    full_name:    order?.full_name  || '',
    phone:        order?.phone      || '',
    email:        order?.email      || '',
    shop_name:    order?.shop_name  || '',
    plan_id:      order?.plan_id    || 'ca-nhan',
    billing_tab:  order?.billing_tab || 'thang',
    price_label:  order?.price_label || '',
    referral_code: order?.referral_code || '',
    status:       order?.status     || 'pending',
    license_key:  order?.license_key || '',
    expire_date:  isNew ? '' : calcDefaultExpire(), // ngày kết thúc có thể chỉnh
    note:         isNoteJSON ? '' : (order?.note || ''),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const ck = computeCK(form.full_name, form.plan_id, form.billing_tab)

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSave() {
    if (!form.phone && !form.email) { setError('Cần có SĐT hoặc Email'); return }
    setSaving(true); setError('')
    try {
      const payload = {
        ...form,
        ck_content: ck,
        plan_name: PLAN_OPTIONS.find(p => p.value === form.plan_id)?.label || form.plan_id,
      }
      if (isNew) {
        await apiPost('/api/order', { action: 'create', ...payload })
      } else {
        await apiPost('/api/order', { action: 'update', id: order.id, ...payload })

        // Đồng bộ ngày kết thúc vào bảng licenses nếu có key và expire_date
        if (form.license_key && form.expire_date) {
          await apiPost('/api/license', {
            action: 'update_expire',
            key: form.license_key,
            expire_at: form.expire_date,
          }).catch(() => {}) // không block nếu lỗi
        }
      }
      onSaved()
    } catch (e) {
      setError('Lỗi: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 13,
    color: '#1a2332',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  }
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }
  const fieldWrap = { display: 'flex', flexDirection: 'column' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a2332' }}>
            {isNew ? '➕ Thêm khách hàng mới' : `✏️ Sửa đơn hàng #${order.id?.slice(0, 8) || '—'}`}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {error && <ErrorBox msg={error} />}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
            <div style={fieldWrap}>
              <label style={labelStyle}>Họ tên *</label>
              <input style={inputStyle} value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Nguyễn Văn A" />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Số điện thoại</label>
              <input style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0901234567" />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Shop / Công ty</label>
              <input style={inputStyle} value={form.shop_name} onChange={e => set('shop_name', e.target.value)} placeholder="Tên shop hoặc công ty" />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Gói</label>
              <select style={inputStyle} value={form.plan_id} onChange={e => set('plan_id', e.target.value)}>
                {PLAN_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Thời hạn</label>
              <select style={inputStyle} value={form.billing_tab} onChange={e => set('billing_tab', e.target.value)}>
                {BILLING_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Giá (VD: 390.000đ)</label>
              <input style={inputStyle} value={form.price_label} onChange={e => set('price_label', e.target.value)} placeholder="390.000đ" />
            </div>
            {/* Hiển thị extra info từ đơn hàng nếu có */}
            {!isNew && extraInfo.period_label && (
              <div style={{ gridColumn: '1/-1', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#065f46' }}>
                ℹ️ <b>Thông tin gói:</b> {extraInfo.period_label} · Tổng: {extraInfo.price_total?.toLocaleString('vi-VN')}đ · HH dự kiến: {extraInfo.expire_date_estimate}
              </div>
            )}
            <div style={fieldWrap}>
              <label style={labelStyle}>Nội dung CK (tự tính)</label>
              <input style={{ ...inputStyle, background: '#f8faff', color: '#64748b' }} value={ck} readOnly />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Mã giới thiệu</label>
              <input style={inputStyle} value={form.referral_code} onChange={e => set('referral_code', e.target.value)} placeholder="REF123" />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Trạng thái</label>
              <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="pending">Chờ xử lý</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
            <div style={{ ...fieldWrap, gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Key được cấp</label>
              <input style={inputStyle} value={form.license_key} onChange={e => set('license_key', e.target.value)} placeholder="GMAP-XXXX-XXXX-XXXX" />
            </div>
            {/* Ngày bắt đầu & kết thúc */}
            <div style={fieldWrap}>
              <label style={labelStyle}>📅 Ngày bắt đầu kích hoạt</label>
              <input
                style={{ ...inputStyle, background: '#f8faff', color: '#64748b', cursor: 'default' }}
                value={startDateStr ? new Date(startDateStr).toLocaleDateString('vi-VN') : '—'}
                readOnly
              />
              <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>Tự động theo ngày tạo đơn</span>
            </div>
            <div style={fieldWrap}>
              <label style={{ ...labelStyle, color: form.expire_date ? '#0c2a72' : '#64748b' }}>
                🔚 Ngày kết thúc gói {form.license_key && <span style={{ color: '#10b981', fontWeight: 700 }}>← đồng bộ với extension</span>}
              </label>
              <input
                style={{ ...inputStyle, borderColor: form.expire_date ? '#00c7de' : '#e2e8f0' }}
                type="date"
                value={form.expire_date || ''}
                onChange={e => set('expire_date', e.target.value)}
                min={startDateStr}
              />
              {form.expire_date && (
                <span style={{ fontSize: 11, color: '#059669', marginTop: 3 }}>
                  {(() => {
                    const d = Math.ceil((new Date(form.expire_date) - new Date()) / 86400000)
                    return d > 0 ? `Còn ${d} ngày` : `Đã hết hạn ${Math.abs(d)} ngày`
                  })()}
                  {form.license_key ? ' — Sẽ cập nhật vào extension khi lưu' : ' — Cấp key để đồng bộ với extension'}
                </span>
              )}
            </div>
            <div style={{ ...fieldWrap, gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Ghi chú</label>
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                value={form.note}
                onChange={e => set('note', e.target.value)}
                placeholder="Ghi chú nội bộ..."
              />
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '9px 20px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8faff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '9px 24px',
              border: 'none',
              borderRadius: 8,
              background: isNew ? '#f97316' : '#00c7de',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              fontFamily: 'inherit',
            }}
          >
            {saving ? 'Đang lưu...' : isNew ? '✨ Tạo mới' : '💾 Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── CREATE KEY MODAL ─────────────────────────────────────────────────────────
function CreateKeyModal({ order, onClose, onDone }) {
  const planMap = { 'ca-nhan': 'personal', 'doanh-nghiep': 'business', 'agency': 'agency', 'thu-nghiem': 'personal' }

  const [shopCode, setShopCode] = useState(
    (order?.shop_name || order?.full_name || '').replace(/\s+/g, '').slice(0, 6).toUpperCase()
  )
  const [plan, setPlan] = useState(order?.plan_id || 'personal')
  const [duration, setDuration] = useState(() => {
    // Tự điền thời hạn từ đơn hàng
    const bt = order?.billing_tab || 'nam1'
    if (bt === 'thang') return 'thang'
    if (bt === 'trial') return 'thang' // trial = 1 ngày → dùng custom
    return bt
  })
  const [customDate, setCustomDate] = useState(() => {
    // Nếu trial → expire = ngày mai
    if (order?.billing_tab === 'trial') {
      const d = new Date(); d.setDate(d.getDate() + 1)
      return d.toISOString().slice(0, 10)
    }
    return ''
  })
  const [previewKey, setPreviewKey] = useState('') // Key đang preview (chưa lưu)
  const [confirmedKey, setConfirmedKey] = useState('') // Key đã lưu thành công
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const resolvedPlan = planMap[plan] || plan

  function getExpireAt() {
    if (duration === 'custom') return customDate
    const now = new Date()
    if (duration === 'thang') now.setMonth(now.getMonth() + 1)
    else if (duration === 'nam1') now.setFullYear(now.getFullYear() + 1)
    else if (duration === 'nam3') now.setFullYear(now.getFullYear() + 3)
    else if (duration === 'nam5') now.setFullYear(now.getFullYear() + 5)
    return now.toISOString().slice(0, 10)
  }

  // Tính và hiển thị ngày hết hạn preview
  function formatExpirePreview() {
    const iso = getExpireAt()
    if (!iso) return null
    const d = new Date(iso)
    const today = new Date()
    const diffDays = Math.ceil((d - today) / (1000 * 60 * 60 * 24))
    return {
      dateStr: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      daysLeft: diffDays,
    }
  }
  const expirePreview = (duration !== 'custom' || customDate) ? formatExpirePreview() : null

  // Tạo random key local (chưa lưu DB)
  function generatePreview() {
    if (!shopCode.trim()) { setError('Nhập shop code trước'); return }
    setError('')
    const rand6 = Math.random().toString(36).substring(2, 8).toUpperCase()
    const rand4 = Math.floor(1000 + Math.random() * 9000).toString()
    const code = shopCode.toUpperCase().slice(0, 6)
    setPreviewKey(`GMAP-${code}-${rand6}-${rand4}`)
  }

  // Xác nhận lưu key vào DB
  async function handleConfirm() {
    if (!previewKey) { setError('Chưa có key để lưu'); return }
    setSaving(true)
    setError('')
    try {
      const expire_at = getExpireAt()
      if (!expire_at) { setError('Chọn thời hạn'); setSaving(false); return }

      // Lưu vào Supabase qua API create_admin nhưng với key đã chọn
      // Gọi create_admin sẽ tạo key mới random → ta cần override key
      // Workaround: gọi thẳng upsert với key đã preview
      const res = await apiPost('/api/license', {
        action: 'create_admin',
        shop_code: shopCode.toUpperCase().slice(0, 6),
        plan: resolvedPlan,
        expire_at,
        name: order?.full_name || '',
        phone: order?.phone || '',
        email: order?.email || '',
        preset_key: previewKey, // backend sẽ dùng preset_key nếu có
      })

      const finalKey = res.key || previewKey
      setConfirmedKey(finalKey)

      // Cập nhật order: link key + confirmed
      if (order?.id) {
        await apiPost('/api/order', {
          action: 'update',
          id: order.id,
          license_key: finalKey,
          status: 'confirmed',
        }).catch(() => {})
      }
    } catch (e) {
      setError('Lỗi lưu key: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  function copyKey(k) {
    navigator.clipboard.writeText(k).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 13,
    color: '#1a2332',
    background: '#fff',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  }
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1a2332' }}>
            🔑 Cấp key cho {order?.full_name || order?.name || '—'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>

        <div style={{ padding: '18px 22px' }}>
          {/* Info */}
          {(() => {
            // Parse extra info từ note JSON
            let extra = {}
            try { extra = order?.note ? JSON.parse(order.note) : {} } catch(e) { extra = {} }
            return (
              <div style={{ background: '#f8faff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#1a2332' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                  <span>👤 <b>Tên:</b> {order?.full_name || '—'}</span>
                  <span>📞 <b>SĐT:</b> {order?.phone || '—'}</span>
                  <span>📧 <b>Email:</b> {order?.email || '—'}</span>
                  <span>🏪 <b>Shop:</b> {order?.shop_name || '—'}</span>
                  <span>📦 <b>Gói:</b> {order?.plan_name || order?.plan_id || '—'}</span>
                  <span>⏱ <b>Thời hạn:</b> {extra.period_label || order?.billing_tab || '—'}</span>
                  <span>💰 <b>Tổng tiền:</b> {order?.price_label || (extra.price_total ? extra.price_total.toLocaleString('vi-VN') + 'đ' : '—')}</span>
                  <span>📅 <b>HH dự kiến:</b> {extra.expire_date_estimate || '—'}</span>
                  <span style={{ gridColumn: '1/-1' }}>💳 <b>Nội dung CK:</b> <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>{order?.ck_content || '—'}</code></span>
                </div>
              </div>
            )
          })()}

          {error && <ErrorBox msg={error} />}

          {!confirmedKey && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Shop Code (max 6 ký tự, viết hoa)</label>
                <input
                  style={inputStyle}
                  value={shopCode}
                  onChange={e => setShopCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="SHOP01"
                />
              </div>
              <div>
                <label style={labelStyle}>Gói</label>
                <select style={inputStyle} value={plan} onChange={e => setPlan(e.target.value)}>
                  <option value="personal">Personal</option>
                  <option value="business">Business</option>
                  <option value="agency">Agency</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Thời hạn</label>
                <select style={inputStyle} value={duration} onChange={e => setDuration(e.target.value)}>
                  <option value="thang">1 Tháng</option>
                  <option value="nam1">1 Năm</option>
                  <option value="nam3">3 Năm</option>
                  <option value="nam5">5 Năm</option>
                  <option value="custom">Tùy chọn ngày</option>
                </select>
              </div>
              {duration === 'custom' && (
                <div>
                  <label style={labelStyle}>Ngày hết hạn tùy chọn</label>
                  <input style={inputStyle} type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} min={new Date().toISOString().slice(0,10)} />
                </div>
              )}

              {/* Hiển thị ngày hết hạn dự kiến */}
              {expirePreview && (
                <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>📅 Ngày kích hoạt hôm nay → Hết hạn:</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#065f46' }}>
                    {new Date().toLocaleDateString('vi-VN')} → <span style={{ color: '#10b981' }}>{expirePreview.dateStr}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#059669', marginTop: 2 }}>
                    ({expirePreview.daysLeft} ngày sử dụng) — Đồng bộ ngay với extension sau khi lưu
                  </div>
                </div>
              )}

              {/* BƯỚC 2: Random key */}
              <div>
                <label style={labelStyle}>🎲 Tạo key preview (chưa lưu)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={generatePreview} style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: 8, background: '#f0f9ff', color: '#0c2a72', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: '1.5px dashed #00c7de' }}>
                    🎲 Random key mới
                  </button>
                </div>
              </div>

              {/* Preview key */}
              {previewKey && (
                <div style={{ background: '#f0fdfe', border: '2px solid #00c7de', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Preview key (chưa lưu — có thể random lại):</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#00c7de', letterSpacing: 1, wordBreak: 'break-all', marginBottom: 10 }}>
                    {previewKey}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={generatePreview} style={{ flex: 1, padding: '8px 0', border: '1px solid #e2e8f0', borderRadius: 7, background: '#fff', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      🔄 Random lại
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={saving}
                      style={{ flex: 2, padding: '8px 0', border: 'none', borderRadius: 7, background: saving ? '#94a3b8' : '#10b981', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                    >
                      {saving ? '⏳ Đang lưu...' : '✅ Xác nhận & Cấp key'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Key đã được xác nhận lưu */}
          {confirmedKey && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ background: '#f0fdf4', border: '2px solid #10b981', borderRadius: 12, padding: '20px 16px', marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: '#065f46', margin: '0 0 6px', fontWeight: 600 }}>✅ Key đã được cấp thành công!</p>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#065f46', letterSpacing: 1, wordBreak: 'break-all' }}>
                  {confirmedKey}
                </div>
                <p style={{ fontSize: 11, color: '#64748b', margin: '8px 0 0' }}>Đơn hàng đã chuyển sang Đã xác nhận</p>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button
                  onClick={() => copyKey(confirmedKey)}
                  style={{ padding: '9px 20px', border: '1px solid #10b981', borderRadius: 8, background: copied ? '#d1fae5' : '#fff', color: '#065f46', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {copied ? '✓ Đã sao chép' : '⎘ Sao chép key'}
                </button>
                <button
                  onClick={() => { copyKey(confirmedKey); onDone() }}
                  style={{ padding: '9px 20px', border: 'none', borderRadius: 8, background: '#10b981', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Sao chép & Đóng
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '14px 22px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={confirmedKey ? onDone : onClose} style={{ padding: '8px 18px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8faff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── DELETE CONFIRM ───────────────────────────────────────────────────────────
function DeleteConfirm({ id, name, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setLoading(true)
    setError('')
    try {
      await apiPost('/api/order', { action: 'delete', id })
      onDeleted()
    } catch (e) {
      if (e.message.includes('404') || e.message.includes('not found') || e.message.includes('500')) {
        setError('Chức năng đang cập nhật. Vui lòng thử lại sau.')
      } else {
        setError('Lỗi: ' + e.message)
      }
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 400, padding: '28px 28px 22px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🗑️</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#1a2332' }}>Xác nhận xóa</h3>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Bạn có chắc muốn xóa đơn hàng của <b>{name || 'khách hàng này'}</b>? Hành động này không thể hoàn tác.
          </p>
        </div>
        {error && <ErrorBox msg={error} />}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={onClose}
            style={{ padding: '9px 22px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8faff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Hủy
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            style={{ padding: '9px 22px', border: 'none', borderRadius: 8, background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'inherit' }}
          >
            {loading ? 'Đang xóa...' : '🗑 Xóa'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── CUSTOMERS TAB ────────────────────────────────────────────────────────────
function CustomersTab() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedRow, setExpandedRow] = useState(null)
  const [editModal, setEditModal] = useState({ open: false, order: null })
  const [createKeyModal, setCreateKeyModal] = useState({ open: false, order: null })
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: '' })

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiPost('/api/order', { action: 'list', limit: 200 })
      const data = res?.orders || res?.data || []
      setOrders(data)
    } catch (e) {
      setError('Không thể tải danh sách đơn: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const filtered = orders.filter(o => {
    const q = searchQuery.toLowerCase()
    const matchSearch = !q ||
      (o.full_name || o.name || '').toLowerCase().includes(q) ||
      (o.phone || '').includes(q) ||
      (o.email || '').toLowerCase().includes(q) ||
      (o.license_key || o.key || '').toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  async function handleExport() {
    try {
      const res = await apiPost('/api/order', { action: 'export' })
      const url = res?.url || res?.download_url
      if (url) { window.open(url, '_blank'); return }
      // Fallback: build CSV from current data
      const headers = ['ID', 'Tên', 'SĐT', 'Email', 'Gói', 'Billing', 'Giá', 'Key', 'Trạng thái', 'Ngày']
      const rows = filtered.map(o => [
        o.id || '', o.full_name || o.name || '', o.phone || '', o.email || '',
        o.plan_id || '', o.billing || '', o.price || '',
        o.license_key || o.key || '', o.status || '',
        o.created_at ? new Date(o.created_at).toLocaleDateString('vi-VN') : '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      const csv = [headers.join(','), ...rows].join('\n')
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
    } catch (e) {
      alert('Export lỗi: ' + e.message)
    }
  }

  const thStyle = { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }
  const tdStyle = { padding: '10px 12px', fontSize: 12, color: '#1a2332', verticalAlign: 'middle' }
  const btnIcon = (title, emoji, onClick, color = '#64748b') => (
    <button
      title={title}
      onClick={onClick}
      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, padding: '3px 5px', color, fontFamily: 'inherit' }}
    >
      {emoji}
    </button>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a2332' }}>👥 Quản lý khách hàng</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setEditModal({ open: true, order: null })}
            style={{ padding: '8px 16px', border: 'none', borderRadius: 8, background: '#f97316', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ＋ Thêm khách hàng
          </button>
          <button
            onClick={handleExport}
            style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#1a2332', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ⬇ Export CSV
          </button>
          <button
            onClick={fetchOrders}
            style={{ padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#64748b', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            🔄 Làm mới
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="🔍 Tìm theo tên, SĐT, email, key..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: 220,
            padding: '9px 14px',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            fontSize: 13,
            color: '#1a2332',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#1a2332', background: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="cancelled">Đã hủy</option>
        </select>
        <span style={{ alignSelf: 'center', fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>
          {filtered.length} / {orders.length} đơn
        </span>
      </div>

      <ErrorBox msg={error} />

      {loading ? <Spinner /> : (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <EmptyState icon="👥" text={orders.length === 0 ? 'Chưa có đơn hàng nào' : 'Không tìm thấy kết quả phù hợp'} />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960 }}>
                <thead>
                  <tr style={{ background: '#0c2a72' }}>
                    <th style={{ ...thStyle, width: 32 }}>#</th>
                    <th style={thStyle}>Khách hàng</th>
                    <th style={thStyle}>SĐT</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Gói</th>
                    <th style={thStyle}>Billing</th>
                    <th style={thStyle}>Giá</th>
                    <th style={thStyle}>Nội dung CK</th>
                    <th style={thStyle}>Key</th>
                    <th style={thStyle}>Trạng thái</th>
                    <th style={thStyle}>Ngày</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o, i) => {
                    const isExpanded = expandedRow === (o.id || i)
                    const key = o.license_key || o.key || ''
                    const ck = o.transfer_content || computeCK(o.full_name || o.name, o.plan_id, o.billing)
                    return [
                      <tr
                        key={o.id || i}
                        onClick={() => setExpandedRow(isExpanded ? null : (o.id || i))}
                        style={{
                          background: i % 2 === 0 ? '#fff' : '#f8faff',
                          cursor: 'pointer',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,199,222,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#f8faff'}
                      >
                        <td style={{ ...tdStyle, color: '#94a3b8' }}>{i + 1}</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{o.full_name || o.name || '—'}</td>
                        <td style={tdStyle}>{o.phone || '—'}</td>
                        <td style={{ ...tdStyle, color: '#64748b', fontSize: 11 }}>{o.email || '—'}</td>
                        <td style={{ ...tdStyle, fontSize: 11 }}>{o.plan_id || '—'}</td>
                        <td style={{ ...tdStyle, fontSize: 11 }}>{o.billing || '—'}</td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: '#059669' }}>
                          {o.price ? Number(o.price).toLocaleString('vi-VN') + '₫' : '—'}
                        </td>
                        <td style={{ ...tdStyle, fontSize: 11, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ck}>
                          {ck || '—'}
                        </td>
                        <td style={tdStyle}>
                          {key ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <span style={{ color: '#00c7de', fontWeight: 700, fontSize: 11, fontFamily: 'monospace', letterSpacing: 0.5 }}>
                                {key}
                              </span>
                              <CopyButton value={key} />
                            </span>
                          ) : <span style={{ color: '#94a3b8', fontSize: 11 }}>Chưa cấp</span>}
                        </td>
                        <td style={tdStyle}><Badge status={o.status} /></td>
                        <td style={{ ...tdStyle, fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          {o.created_at ? new Date(o.created_at).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                          {btnIcon('Sửa đơn', '✏️', () => setEditModal({ open: true, order: o }), '#0c2a72')}
                          {btnIcon('Cấp key', '🔑', () => setCreateKeyModal({ open: true, order: o }), '#f59e0b')}
                          {btnIcon('Xóa', '🗑', () => setDeleteConfirm({ open: true, id: o.id, name: o.full_name || o.name }), '#ef4444')}
                        </td>
                      </tr>,
                      isExpanded && (
                        <tr key={`${o.id || i}-expand`} style={{ background: '#f0fdfe' }}>
                          <td colSpan={12} style={{ padding: '14px 20px', fontSize: 13, color: '#1a2332' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '6px 20px' }}>
                              <span><b>Shop/Công ty:</b> {o.shop_name || o.company || '—'}</span>
                              <span><b>Mã giới thiệu:</b> {o.referral_code || '—'}</span>
                              <span><b>ID đơn:</b> <code style={{ fontSize: 11, background: '#e2e8f0', padding: '1px 5px', borderRadius: 4 }}>{o.id || '—'}</code></span>
                              <span><b>Ngày tạo:</b> {o.created_at ? new Date(o.created_at).toLocaleString('vi-VN') : '—'}</span>
                              {o.note && <span style={{ gridColumn: '1 / -1' }}><b>Ghi chú:</b> {o.note}</span>}
                            </div>
                          </td>
                        </tr>
                      )
                    ]
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {editModal.open && (
        <EditModal
          order={editModal.order}
          onClose={() => setEditModal({ open: false, order: null })}
          onSaved={() => { setEditModal({ open: false, order: null }); fetchOrders() }}
        />
      )}
      {createKeyModal.open && (
        <CreateKeyModal
          order={createKeyModal.order}
          onClose={() => setCreateKeyModal({ open: false, order: null })}
          onDone={() => { setCreateKeyModal({ open: false, order: null }); fetchOrders() }}
        />
      )}
      {deleteConfirm.open && (
        <DeleteConfirm
          id={deleteConfirm.id}
          name={deleteConfirm.name}
          onClose={() => setDeleteConfirm({ open: false, id: null, name: '' })}
          onDeleted={() => { setDeleteConfirm({ open: false, id: null, name: '' }); fetchOrders() }}
        />
      )}
    </div>
  )
}

// ─── CHECK KEY TAB ────────────────────────────────────────────────────────────
function CheckKeyTab() {
  const [keyInput, setKeyInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function handleCheck() {
    const trimmed = keyInput.trim().toUpperCase()
    if (!trimmed) { setError('Nhập key cần kiểm tra'); return }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await apiPost('/api/license', { action: 'verify', key: trimmed })
      setResult(res?.data || res)
    } catch (e) {
      setError('Lỗi kiểm tra: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  function daysLeft(expire) {
    if (!expire) return null
    const diff = new Date(expire) - new Date()
    return Math.ceil(diff / 86400000)
  }

  const infoRow = (label, value) => (
    <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '10px 0' }}>
      <span style={{ width: 160, fontSize: 13, color: '#64748b', fontWeight: 600, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#1a2332' }}>{value || '—'}</span>
    </div>
  )

  const days = result ? daysLeft(result.expire_at || result.expires_at) : null

  return (
    <div style={{ maxWidth: 560 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a2332', marginBottom: 24 }}>🔑 Kiểm tra Key</h2>

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            placeholder="GMAP-XXXX-XXXX-XXXX"
            value={keyInput}
            onChange={e => setKeyInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleCheck()}
            style={{
              flex: 1,
              padding: '10px 14px',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              fontSize: 14,
              fontFamily: 'monospace',
              letterSpacing: 1,
              color: '#1a2332',
              outline: 'none',
            }}
          />
          <button
            onClick={handleCheck}
            disabled={loading}
            style={{ padding: '10px 22px', border: 'none', borderRadius: 8, background: '#0c2a72', color: '#fff', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}
          >
            {loading ? 'Đang kiểm tra...' : '🔍 Kiểm tra'}
          </button>
        </div>
      </div>

      <ErrorBox msg={error} />

      {result && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <div style={{ background: '#0c2a72', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Kết quả</span>
            <Badge status={result.status || (result.is_active ? 'active' : 'inactive')} />
          </div>
          <div style={{ padding: '0 20px' }}>
            {infoRow('Key', <><code style={{ fontFamily: 'monospace', color: '#00c7de', fontWeight: 700 }}>{result.key || result.license_key || keyInput}</code><CopyButton value={result.key || result.license_key || keyInput} /></>)}
            {infoRow('Tên khách', result.customer_name || result.name || result.full_name)}
            {infoRow('Gói', result.plan || result.plan_id)}
            {infoRow('Hết hạn', result.expire_at || result.expires_at
              ? `${new Date(result.expire_at || result.expires_at).toLocaleDateString('vi-VN')} (còn ${days !== null ? `${days} ngày` : '?'})`
              : null)}
            {infoRow('Thiết bị locked', result.device_id ? `Có (${result.device_id})` : 'Chưa lock')}
            {result.permissions && infoRow('Permissions', Array.isArray(result.permissions) ? result.permissions.join(', ') : String(result.permissions))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── AFFILIATE TAB ────────────────────────────────────────────────────────────
function AffiliateTab() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  async function handleLoad() {
    setLoading(true)
    setError('')
    try {
      const res = await apiPost('/api/affiliate', { action: 'list' })
      const list = res?.affiliates || res?.data || []
      setData(list)
      setLoaded(true)
    } catch (e) {
      // Try fetching via lookup if list not available
      setError('Không thể tải danh sách affiliate: ' + e.message)
      setLoaded(true)
    } finally {
      setLoading(false)
    }
  }

  const thStyle = { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#fff' }
  const tdStyle = { padding: '10px 12px', fontSize: 12, color: '#1a2332' }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a2332' }}>🤝 Affiliate</h2>
        <button
          onClick={handleLoad}
          disabled={loading}
          style={{ padding: '9px 18px', border: 'none', borderRadius: 8, background: '#0c2a72', color: '#fff', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
        >
          {loading ? 'Đang tải...' : '📥 Load từ hệ thống'}
        </button>
      </div>

      <ErrorBox msg={error} />

      {!loaded ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 40, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🤝</div>
          <p style={{ fontSize: 14 }}>Nhấn "Load từ hệ thống" để tải danh sách affiliate</p>
        </div>
      ) : loading ? <Spinner /> : (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          {data.length === 0 ? <EmptyState icon="🤝" text="Chưa có affiliate nào" /> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0c2a72' }}>
                    {['Mã giới thiệu', 'Tên', 'SĐT', 'Email', 'Ngân hàng', 'STK', 'Hoa hồng', 'Trạng thái', 'Ngày'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((a, i) => (
                    <tr key={a.id || i} style={{ background: i % 2 === 0 ? '#fff' : '#f8faff' }}>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#00c7de', fontFamily: 'monospace' }}>{a.referral_code || a.code || '—'}</td>
                      <td style={tdStyle}>{a.full_name || a.name || '—'}</td>
                      <td style={tdStyle}>{a.phone || '—'}</td>
                      <td style={tdStyle}>{a.email || '—'}</td>
                      <td style={tdStyle}>{a.bank_name || '—'}</td>
                      <td style={tdStyle}>{a.bank_account || '—'}</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#059669' }}>{a.commission || a.commission_rate || '—'}</td>
                      <td style={tdStyle}><Badge status={a.status || 'active'} /></td>
                      <td style={{ ...tdStyle, fontSize: 11, color: '#94a3b8' }}>
                        {a.created_at ? new Date(a.created_at).toLocaleDateString('vi-VN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── TICKET IMAGE GRID (admin) ────────────────────────────────────────────────
function TicketImageGrid({ urls, onRemove }) {
  const [fullImg, setFullImg] = useState(null)
  if (!urls || urls.length === 0) return null
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {urls.map((u, i) => {
          const src = typeof u === 'string' ? u : (u.thumbnail || u.url)
          const full = typeof u === 'string' ? u : u.url
          return (
            <div key={i} style={{ position: 'relative' }}>
              <img
                src={src}
                alt=""
                onClick={() => setFullImg(full)}
                style={{
                  width: 80, height: 80,
                  objectFit: 'cover',
                  borderRadius: 6,
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                }}
              />
              {onRemove && (
                <button
                  onClick={() => onRemove(i)}
                  style={{
                    position: 'absolute', top: -6, right: -6,
                    width: 18, height: 18,
                    background: '#ef4444',
                    border: 'none',
                    borderRadius: '50%',
                    color: '#fff',
                    fontSize: 10,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'inherit',
                    padding: 0,
                    lineHeight: 1,
                  }}
                >✕</button>
              )}
            </div>
          )
        })}
      </div>
      {fullImg && (
        <div
          onClick={() => setFullImg(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
          }}
        >
          <img src={fullImg} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8 }} />
        </div>
      )}
    </>
  )
}

// ─── TICKET STATUS BADGE (admin) ──────────────────────────────────────────────
function TicketStatusBadge({ status }) {
  const map = {
    open:        { bg: '#fee2e2', color: '#b91c1c', label: 'Mở' },
    in_progress: { bg: '#fef3c7', color: '#92400e', label: 'Đang xử lý' },
    resolved:    { bg: '#d1fae5', color: '#065f46', label: 'Đã giải quyết' },
    closed:      { bg: '#f1f5f9', color: '#475569', label: 'Đã đóng' },
  }
  const s = map[status] || { bg: '#f1f5f9', color: '#475569', label: status || 'N/A' }
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 700,
      background: s.bg,
      color: s.color,
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  )
}

// ─── TICKETS TAB ──────────────────────────────────────────────────────────────
function TicketsTab() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)

  // Per-ticket reply state
  const [replyText, setReplyText] = useState({})        // id → text
  const [replyImages, setReplyImages] = useState({})    // id → [{url, thumbnail}]
  const [replyUploading, setReplyUploading] = useState({}) // id → bool
  const [replyLoading, setReplyLoading] = useState({})  // id → bool
  const [toast, setToast] = useState('')

  // Detail store: id → ticket detail with replies
  const [details, setDetails] = useState({})

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await apiPost('/api/ticket', { action: 'list', limit: 100 })
      const data = res?.tickets || res?.data || []
      setTickets(data)
    } catch (e) {
      setError('Không thể tải tickets: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function fetchDetail(id) {
    try {
      const res = await apiPost('/api/ticket', { action: 'get', ticket_id: id })
      if (res?.ok) {
        // Lưu cả ticket lẫn replies riêng
        setDetails(prev => ({
          ...prev,
          [id]: {
            ...(res.ticket || {}),
            replies: res.replies || []
          }
        }))
      }
    } catch (e) { console.warn('fetchDetail error:', e.message) }
  }

  async function handleExpand(t) {
    const id = t.id
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    if (!details[id]) await fetchDetail(id)
  }

  async function updateStatus(id, newStatus) {
    try {
      await apiPost('/api/ticket', { action: 'update', id, status: newStatus })
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
      if (details[id]) setDetails(prev => ({ ...prev, [id]: { ...prev[id], status: newStatus } }))
    } catch (e) {
      alert('Lỗi cập nhật: ' + e.message)
    }
  }

  async function handleImageUpload(id, e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setReplyUploading(prev => ({ ...prev, [id]: true }))
    try {
      const existing = replyImages[id] || []
      const slots = Math.min(files.length, 3 - existing.length)
      const uploaded = await Promise.all(files.slice(0, slots).map(f => uploadImage(f)))
      setReplyImages(prev => ({ ...prev, [id]: [...(prev[id] || []), ...uploaded].slice(0, 3) }))
    } catch (err) {
      alert('Upload ảnh thất bại: ' + err.message)
    } finally {
      setReplyUploading(prev => ({ ...prev, [id]: false }))
      e.target.value = ''
    }
  }

  async function handleSendReply(id) {
    const msg = (replyText[id] || '').trim()
    const imgs = replyImages[id] || []
    if (!msg && imgs.length === 0) return
    setReplyLoading(prev => ({ ...prev, [id]: true }))
    try {
      await apiPost('/api/ticket', {
        action: 'reply',
        ticket_id: id,
        role: 'admin',
        message: msg,
        image_urls: imgs.map(u => u.url),
      })
      setReplyText(prev => ({ ...prev, [id]: '' }))
      setReplyImages(prev => ({ ...prev, [id]: [] }))
      await fetchDetail(id)
      setToast('Đã gửi phản hồi!')
      setTimeout(() => setToast(''), 2500)
    } catch (e) {
      alert('Gửi lỗi: ' + e.message)
    } finally {
      setReplyLoading(prev => ({ ...prev, [id]: false }))
    }
  }

  const filtered = statusFilter === 'all'
    ? tickets
    : tickets.filter(t => t.status === statusFilter)

  const thStyle = { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }
  const tdStyle = { padding: '10px 12px', fontSize: 12, color: '#1a2332', verticalAlign: 'middle' }

  const FILTER_TABS = [
    { id: 'all', label: 'Tất cả' },
    { id: 'open', label: 'open' },
    { id: 'in_progress', label: 'in_progress' },
    { id: 'resolved', label: 'resolved' },
    { id: 'closed', label: 'closed' },
  ]

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: '#10b981', color: '#fff',
          padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 13,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a2332' }}>🎫 Tickets hỗ trợ</h2>
        <button
          onClick={load}
          style={{ padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#64748b', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          🔄 Làm mới
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {FILTER_TABS.map(f => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            style={{
              padding: '6px 14px',
              border: statusFilter === f.id ? 'none' : '1px solid #e2e8f0',
              borderRadius: 20,
              background: statusFilter === f.id ? '#0c2a72' : '#fff',
              color: statusFilter === f.id ? '#fff' : '#64748b',
              fontSize: 12,
              fontWeight: statusFilter === f.id ? 700 : 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {f.label}
            {f.id !== 'all' && (
              <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.8 }}>
                ({tickets.filter(t => t.status === f.id).length})
              </span>
            )}
            {f.id === 'all' && (
              <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.8 }}>({tickets.length})</span>
            )}
          </button>
        ))}
      </div>

      <ErrorBox msg={error} />

      {loading ? <Spinner /> : (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          {filtered.length === 0 ? <EmptyState icon="🎫" text="Không có ticket nào" /> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960 }}>
                <thead>
                  <tr style={{ background: '#0c2a72' }}>
                    {['ID', 'Key', 'SĐT', 'Email', 'Loại', 'Mô tả', 'Ảnh', 'Trạng thái', 'Ngày', 'Thao tác'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t, i) => {
                    const isExpanded = expandedId === t.id
                    const detail = details[t.id]
                    const replies = detail?.replies || detail?.messages || []
                    const isClosed = (detail?.status || t.status) === 'closed'
                    const desc = t.description || t.message || ''
                    const imgUrls = t.image_urls || []
                    const curStatus = detail?.status || t.status || 'open'

                    return [
                      <tr
                        key={t.id || i}
                        onClick={() => handleExpand(t)}
                        style={{
                          background: i % 2 === 0 ? '#fff' : '#f8faff',
                          cursor: 'pointer',
                          borderBottom: isExpanded ? 'none' : undefined,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,199,222,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#f8faff'}
                      >
                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>
                          {(t.id || '').slice(0, 8)}
                        </td>
                        <td style={{ ...tdStyle, color: '#00c7de', fontFamily: 'monospace', fontSize: 11 }}>
                          {t.license_key || t.key || '—'}
                        </td>
                        <td style={tdStyle}>{t.phone || '—'}</td>
                        <td style={{ ...tdStyle, fontSize: 11 }}>{t.email || '—'}</td>
                        <td style={{ ...tdStyle, fontSize: 11 }}>{t.issue_type || t.type || t.category || '—'}</td>
                        <td style={{ ...tdStyle, maxWidth: 180 }}>
                          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                            {desc.slice(0, 60)}{desc.length > 60 ? '...' : ''}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {imgUrls.length > 0 ? (
                            <span style={{ fontSize: 11, color: '#00c7de', fontWeight: 600 }}>
                              🖼 {imgUrls.length}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={tdStyle}><TicketStatusBadge status={curStatus} /></td>
                        <td style={{ ...tdStyle, fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          {t.created_at ? new Date(t.created_at).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td style={{ ...tdStyle, whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                          {/* Status dropdown */}
                          <select
                            value={curStatus}
                            onChange={e => updateStatus(t.id, e.target.value)}
                            style={{
                              padding: '4px 6px',
                              border: '1px solid #e2e8f0',
                              borderRadius: 6,
                              fontSize: 11,
                              fontFamily: 'inherit',
                              color: '#1a2332',
                              background: '#fff',
                              cursor: 'pointer',
                              marginRight: 4,
                            }}
                          >
                            <option value="open">open</option>
                            <option value="in_progress">in_progress</option>
                            <option value="resolved">resolved</option>
                            <option value="closed">closed</option>
                          </select>
                          {/* Reply button */}
                          <button
                            onClick={() => handleExpand(t)}
                            style={{
                              padding: '4px 8px',
                              border: 'none',
                              borderRadius: 6,
                              background: isExpanded ? '#e0f2fe' : '#0c2a72',
                              color: isExpanded ? '#0c2a72' : '#fff',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              marginRight: 4,
                            }}
                          >
                            💬
                          </button>
                          {/* Close shortcut */}
                          {curStatus !== 'closed' && (
                            <button
                              onClick={() => updateStatus(t.id, 'closed')}
                              title="Đóng ticket"
                              style={{
                                padding: '4px 8px',
                                border: 'none',
                                borderRadius: 6,
                                background: '#fee2e2',
                                color: '#b91c1c',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                              }}
                            >
                              🗑
                            </button>
                          )}
                          {/* Reopen */}
                          {curStatus === 'closed' && (
                            <button
                              onClick={() => updateStatus(t.id, 'open')}
                              title="Mở lại ticket"
                              style={{
                                padding: '4px 8px',
                                border: 'none',
                                borderRadius: 6,
                                background: '#d1fae5',
                                color: '#065f46',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                              }}
                            >
                              ↩
                            </button>
                          )}
                        </td>
                      </tr>,

                      /* ─── Expanded row ─── */
                      isExpanded && (
                        <tr key={`${t.id}-expand`}>
                          <td colSpan={10} style={{ padding: 0, background: '#f0fdfe', borderBottom: '2px solid rgba(0,199,222,0.2)' }}>
                            <div style={{ padding: '20px 24px' }}>

                              {/* Full description + images */}
                              <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Mô tả đầy đủ</div>
                                <div style={{
                                  background: '#fff', border: '1px solid #e2e8f0',
                                  borderRadius: 8, padding: '12px 16px',
                                  fontSize: 13, color: '#1a2332', lineHeight: 1.7,
                                }}>
                                  {desc || '—'}
                                </div>
                                {imgUrls.length > 0 && (
                                  <TicketImageGrid urls={imgUrls} />
                                )}
                              </div>

                              {/* Replies thread */}
                              {replies.length > 0 && (
                                <div style={{ marginBottom: 16 }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 10 }}>
                                    Lịch sử phản hồi ({replies.length})
                                  </div>
                                  <div style={{
                                    maxHeight: 400, overflowY: 'auto',
                                    display: 'flex', flexDirection: 'column', gap: 10,
                                    padding: '4px 0',
                                  }}>
                                    {replies.map((r, ri) => {
                                      const isAdmin = r.role === 'admin'
                                      return (
                                        <div key={ri} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-start' : 'flex-end', gap: 8 }}>
                                          {isAdmin && (
                                            <div style={{
                                              width: 28, height: 28, borderRadius: '50%',
                                              background: '#0c2a72',
                                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                                              fontSize: 12, flexShrink: 0, alignSelf: 'flex-end',
                                              color: '#fff', fontWeight: 700,
                                            }}>A</div>
                                          )}
                                          <div style={{
                                            maxWidth: '70%',
                                            background: isAdmin ? '#e8f0fe' : '#e0f2fe',
                                            border: isAdmin ? '1px solid #c7d7fd' : '1px solid #bae6fd',
                                            color: '#1a2332',
                                            padding: '10px 14px',
                                            borderRadius: isAdmin ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                                            fontSize: 13,
                                            lineHeight: 1.6,
                                          }}>
                                            <div>{r.message || r.text || ''}</div>
                                            {r.image_urls && r.image_urls.length > 0 && (
                                              <TicketImageGrid urls={r.image_urls} />
                                            )}
                                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                                              {r.created_at ? new Date(r.created_at).toLocaleString('vi-VN') : ''}
                                            </div>
                                          </div>
                                          {!isAdmin && (
                                            <div style={{
                                              width: 28, height: 28, borderRadius: '50%',
                                              background: '#00c7de',
                                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                                              fontSize: 12, flexShrink: 0, alignSelf: 'flex-end',
                                              color: '#fff', fontWeight: 700,
                                            }}>U</div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Admin reply form */}
                              {!isClosed ? (
                                <div style={{
                                  background: '#fff',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: 10, padding: '16px',
                                }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 10 }}>
                                    Ghi phản hồi admin
                                  </div>
                                  <textarea
                                    rows={3}
                                    value={replyText[t.id] || ''}
                                    onChange={e => setReplyText(prev => ({ ...prev, [t.id]: e.target.value }))}
                                    placeholder="Nhập nội dung phản hồi..."
                                    style={{
                                      width: '100%',
                                      padding: '10px 13px',
                                      border: '1px solid #e2e8f0',
                                      borderRadius: 8,
                                      fontSize: 13,
                                      fontFamily: 'inherit',
                                      color: '#1a2332',
                                      resize: 'vertical',
                                      minHeight: 80,
                                      boxSizing: 'border-box',
                                      outline: 'none',
                                      marginBottom: 10,
                                    }}
                                  />
                                  {/* Image upload */}
                                  <div style={{ marginBottom: 10 }}>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
                                      Đính kèm ảnh (tùy chọn)
                                    </label>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      onChange={e => handleImageUpload(t.id, e)}
                                      disabled={replyUploading[t.id]}
                                      style={{ fontSize: 12 }}
                                    />
                                    {replyUploading[t.id] && (
                                      <div style={{ fontSize: 12, color: '#00c7de', marginTop: 6 }}>Đang upload...</div>
                                    )}
                                    {(replyImages[t.id] || []).length > 0 && (
                                      <TicketImageGrid
                                        urls={replyImages[t.id]}
                                        onRemove={idx => setReplyImages(prev => ({
                                          ...prev,
                                          [t.id]: (prev[t.id] || []).filter((_, i) => i !== idx),
                                        }))}
                                      />
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleSendReply(t.id)}
                                    disabled={replyLoading[t.id] || replyUploading[t.id] || (!(replyText[t.id] || '').trim() && !(replyImages[t.id] || []).length)}
                                    style={{
                                      padding: '9px 20px',
                                      border: 'none',
                                      borderRadius: 8,
                                      background: '#0c2a72',
                                      color: '#fff',
                                      fontSize: 13,
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      fontFamily: 'inherit',
                                      opacity: replyLoading[t.id] ? 0.7 : 1,
                                    }}
                                  >
                                    {replyLoading[t.id] ? '⏳ Đang gửi...' : '📤 Gửi phản hồi'}
                                  </button>
                                </div>
                              ) : (
                                <div style={{
                                  padding: '10px 16px', borderRadius: 8,
                                  background: '#f1f5f9',
                                  border: '1px solid #e2e8f0',
                                  color: '#64748b', fontSize: 13, textAlign: 'center',
                                }}>
                                  Ticket đã đóng
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ),
                    ]
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── DOWNLOADS TAB ────────────────────────────────────────────────────────────
// Label mapping cho user_type
const USER_TYPE_MAP = {
  individual:  '👤 Cá nhân chạy ads',
  small_biz:   '🏪 Doanh nghiệp nhỏ',
  medium_biz:  '🏢 Doanh nghiệp vừa/lớn',
  agency:      '🏬 Agency',
  other:       '❓ Khác',
}

// Trạng thái hành trình tiếp nhận
const DL_STATUS = [
  { value: 'new',          label: 'Chưa tiếp nhận',      color: '#94a3b8', bg: '#f1f5f9' },
  { value: 'contacted',    label: 'Đã liên hệ',           color: '#f59e0b', bg: '#fffbeb' },
  { value: 'trial_given',  label: 'Đã cấp key dùng thử', color: '#3b82f6', bg: '#eff6ff' },
  { value: 'negotiating',  label: 'Đang tư vấn',          color: '#8b5cf6', bg: '#f5f3ff' },
  { value: 'purchased',    label: 'Đã mua gói',           color: '#10b981', bg: '#f0fdf4' },
  { value: 'not_interested', label: 'Không quan tâm',     color: '#ef4444', bg: '#fef2f2' },
]

function DlStatusBadge({ status }) {
  const s = DL_STATUS.find(x => x.value === status) || DL_STATUS[0]
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: s.color, background: s.bg }}>
      {s.label}
    </span>
  )
}

function DownloadsTab() {
  const [downloads, setDownloads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [editNotes, setEditNotes] = useState({}) // id → note text
  const [saving, setSaving] = useState({})

  async function load() {
    setLoading(true)
    try {
      const res = await apiPost('/api/download', { action: 'list', limit: 200 })
      setDownloads(res?.data || [])
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id, status) {
    setSaving(s => ({ ...s, [id]: true }))
    try {
      await apiPost('/api/download', { action: 'update', id, status })
      setDownloads(list => list.map(d => d.id === id ? { ...d, status } : d))
    } catch (e) { alert('Lỗi: ' + e.message) } finally { setSaving(s => ({ ...s, [id]: false })) }
  }

  async function saveNote(id) {
    const note = editNotes[id] ?? downloads.find(d => d.id === id)?.admin_note ?? ''
    setSaving(s => ({ ...s, [id + '_note']: true }))
    try {
      await apiPost('/api/download', { action: 'update', id, admin_note: note })
      setDownloads(list => list.map(d => d.id === id ? { ...d, admin_note: note } : d))
      setExpandedId(null)
    } catch (e) { alert('Lỗi: ' + e.message) } finally { setSaving(s => ({ ...s, [id + '_note']: false })) }
  }

  function exportCSV() {
    const headers = ['STT', 'Họ tên', 'SĐT/Zalo', 'Email', 'Loại người dùng', 'Trạng thái', 'Ghi chú', 'Ngày']
    const rows = downloads.map((d, i) => [
      i + 1, d.full_name || '', d.contact || '', d.email || '',
      USER_TYPE_MAP[d.user_type] || d.user_type || '',
      DL_STATUS.find(s => s.value === d.status)?.label || 'Chưa tiếp nhận',
      d.admin_note || '',
      d.created_at ? new Date(d.created_at).toLocaleDateString('vi-VN') : '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `download_leads_${new Date().toISOString().slice(0,10)}.csv`; a.click()
  }

  const th = { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }
  const td = { padding: '10px 12px', fontSize: 12.5, color: '#1a2332', verticalAlign: 'middle' }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a2332' }}>📥 Yêu cầu tải Extension</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Danh sách khách hàng tiềm năng — click vào dòng để cập nhật ghi chú</p>
        </div>
        <button onClick={exportCSV} style={{ padding: '9px 18px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#1a2332', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          ⬇ Export CSV
        </button>
      </div>
      <ErrorBox msg={error} />
      {loading ? <Spinner /> : (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          {downloads.length === 0 ? <EmptyState icon="📥" text="Chưa có yêu cầu tải nào" /> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0c2a72' }}>
                  {['#', 'Họ tên', 'SĐT/Zalo', 'Email', 'Nhóm khách', 'Trạng thái', 'Ghi chú NV', 'Ngày', 'Cập nhật'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {downloads.map((d, i) => (
                  <>
                    <tr
                      key={d.id || i}
                      style={{ background: i % 2 === 0 ? '#fff' : '#f8faff', cursor: 'pointer' }}
                      onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                    >
                      <td style={{ ...td, color: '#94a3b8', width: 36 }}>{i + 1}</td>
                      <td style={{ ...td, fontWeight: 600 }}>{d.full_name || '—'}</td>
                      <td style={td}>{d.contact || '—'}</td>
                      <td style={{ ...td, color: '#0c2a72' }}>{d.email || '—'}</td>
                      <td style={td}>{USER_TYPE_MAP[d.user_type] || d.user_type || '—'}</td>
                      <td style={td}><DlStatusBadge status={d.status || 'new'} /></td>
                      <td style={{ ...td, color: '#64748b', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.admin_note || <span style={{ color: '#e2e8f0' }}>—</span>}
                      </td>
                      <td style={{ ...td, fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {d.created_at ? new Date(d.created_at).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td style={td} onClick={e => e.stopPropagation()}>
                        <select
                          value={d.status || 'new'}
                          onChange={e => updateStatus(d.id, e.target.value)}
                          disabled={saving[d.id]}
                          style={{ padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 11, fontFamily: 'inherit', color: '#1a2332', cursor: 'pointer', background: '#fff' }}
                        >
                          {DL_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </td>
                    </tr>
                    {/* Expand row for note editing */}
                    {expandedId === d.id && (
                      <tr key={`${d.id}-expand`} style={{ background: '#f8faff' }}>
                        <td colSpan={9} style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>
                                📝 Ghi chú nội bộ (nhân viên tiếp nhận)
                              </label>
                              <textarea
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', minHeight: 70, color: '#1a2332', boxSizing: 'border-box' }}
                                value={editNotes[d.id] !== undefined ? editNotes[d.id] : (d.admin_note || '')}
                                onChange={e => setEditNotes(n => ({ ...n, [d.id]: e.target.value }))}
                                placeholder="Ghi chú về khách hàng này, lịch sử liên hệ..."
                              />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <button onClick={() => saveNote(d.id)} disabled={saving[d.id + '_note']} style={{ padding: '8px 16px', border: 'none', borderRadius: 8, background: '#10b981', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                                {saving[d.id + '_note'] ? '...' : '💾 Lưu ghi chú'}
                              </button>
                              <button onClick={() => setExpandedId(null)} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                Đóng
                              </button>
                            </div>
                          </div>
                          {/* Thông tin đầy đủ */}
                          <div style={{ marginTop: 10, padding: '10px 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#64748b', display: 'flex', flexWrap: 'wrap', gap: '6px 20px' }}>
                            <span>👤 <b style={{ color: '#1a2332' }}>{d.full_name}</b></span>
                            <span>📞 <b style={{ color: '#1a2332' }}>{d.contact || '—'}</b></span>
                            <span>📧 {d.email}</span>
                            <span>🏢 {USER_TYPE_MAP[d.user_type] || d.user_type}</span>
                            <span>📅 {d.created_at ? new Date(d.created_at).toLocaleString('vi-VN') : '—'}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

// ─── PIXELS TAB ───────────────────────────────────────────────────────────────
function PixelsTab() {
  const [copied, setCopied] = useState(false)

  const envVars = [
    { label: 'Facebook Pixel ID', env: 'NEXT_PUBLIC_FB_PIXEL_ID', placeholder: '123456789012345' },
    { label: 'Google Tag Manager', env: 'NEXT_PUBLIC_GTM_ID', placeholder: 'GTM-XXXXXXX' },
    { label: 'Google Analytics 4', env: 'NEXT_PUBLIC_GA4_ID', placeholder: 'G-XXXXXXXXXX' },
    { label: 'TikTok Pixel', env: 'NEXT_PUBLIC_TIKTOK_PIXEL_ID', placeholder: 'CXXXXXXXXXXXXXXX' },
    { label: 'Google Ads Conversion', env: 'NEXT_PUBLIC_GOOGLE_ADS_ID', placeholder: 'AW-XXXXXXXXXX' },
  ]
  const [values, setValues] = useState({})

  function copyInstructions() {
    const lines = envVars.map(v => `${v.env}=${values[v.env] || '[YOUR_ID]'}`).join('\n')
    const text = `# Go Meta Ads Pro — Vercel Environment Variables\n# Vào Vercel → Settings → Environment Variables → Thêm từng dòng → Redeploy\n\n${lines}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const inputStyle = {
    flex: 1,
    padding: '9px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 13,
    color: '#1a2332',
    fontFamily: 'monospace',
    outline: 'none',
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a2332', marginBottom: 6 }}>📈 Cấu hình Tracking Pixels</h2>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
        Đã inject vào website. Nhập ID vào đây để xem hướng dẫn cài đặt vào Vercel.
      </p>

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {envVars.map(v => (
            <div key={v.env} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 190, fontSize: 13, fontWeight: 600, color: '#1a2332', flexShrink: 0 }}>{v.label}</span>
              <input
                style={inputStyle}
                placeholder={v.placeholder}
                value={values[v.env] || ''}
                onChange={e => setValues(prev => ({ ...prev, [v.env]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#0c2a72', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <p style={{ color: '#93c5fd', fontSize: 12, fontWeight: 700, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 1 }}>
          Hướng dẫn cài đặt Vercel
        </p>
        <ol style={{ color: '#cbd5e1', fontSize: 13, margin: 0, paddingLeft: 18, lineHeight: 2 }}>
          <li>Vào <b style={{ color: '#fff' }}>vercel.com</b> → Project <b style={{ color: '#fff' }}>go-meta-ads-web</b></li>
          <li>Chọn <b style={{ color: '#fff' }}>Settings</b> → <b style={{ color: '#fff' }}>Environment Variables</b></li>
          <li>Nhấn <b style={{ color: '#fff' }}>Add New</b> → nhập từng biến bên dưới</li>
          <li>Sau khi thêm xong → <b style={{ color: '#fff' }}>Redeploy</b> project</li>
        </ol>
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '12px 16px', marginTop: 12, fontFamily: 'monospace', fontSize: 12 }}>
          {envVars.map(v => (
            <div key={v.env} style={{ marginBottom: 4 }}>
              <span style={{ color: '#7dd3fc' }}>{v.env}</span>
              <span style={{ color: '#94a3b8' }}>=</span>
              <span style={{ color: '#fcd34d' }}>{values[v.env] || v.placeholder}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={copyInstructions}
        style={{
          padding: '10px 22px',
          border: 'none',
          borderRadius: 8,
          background: copied ? '#059669' : '#00c7de',
          color: '#fff',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'background 0.2s',
        }}
      >
        {copied ? '✓ Đã sao chép!' : '📋 Copy hướng dẫn env vars'}
      </button>
    </div>
  )
}

// ─── AI KNOWLEDGE TAB ────────────────────────────────────────────────────────
const AI_CATEGORIES = [
  { value: 'faq',          label: '❓ Câu hỏi thường gặp' },
  { value: 'guide',        label: '📖 Hướng dẫn sử dụng' },
  { value: 'product_info', label: '📦 Thông tin sản phẩm' },
  { value: 'policy',       label: '⚖️ Chính sách' },
  { value: 'pricing',      label: '💰 Bảng giá' },
  { value: 'general',      label: '📋 Chung' },
]

function AiKnowledgeTab() {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [saving, setSaving]   = useState(false)

  // Form thêm/sửa
  const [showForm, setShowForm]     = useState(false)
  const [editId, setEditId]         = useState(null)
  const [formTitle, setFormTitle]   = useState('')
  const [formContent, setFormContent] = useState('')
  const [formCategory, setFormCategory] = useState('general')

  // File upload state
  const [fileLoading, setFileLoading] = useState(false)
  const fileRef = useRef(null)

  async function fetchList() {
    setLoading(true)
    try {
      const res = await apiPost('/api/ticket', { action: 'ai_list' })
      setList(res?.data || [])
    } catch(e) { setError(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { fetchList() }, [])

  function openNew() {
    setEditId(null); setFormTitle(''); setFormContent(''); setFormCategory('general'); setShowForm(true)
  }
  function openEdit(item) {
    setEditId(item.id); setFormTitle(item.title); setFormContent(item.content); setFormCategory(item.category || 'general'); setShowForm(true)
  }

  async function handleSave() {
    if (!formTitle.trim() || !formContent.trim()) { alert('Cần có tiêu đề và nội dung'); return }
    setSaving(true)
    try {
      await apiPost('/api/ticket', { action: 'ai_save', id: editId||undefined, title: formTitle.trim(), content: formContent.trim(), category: formCategory })
      setShowForm(false); fetchList()
    } catch(e) { alert('Lỗi: ' + e.message) } finally { setSaving(false) }
  }

  async function toggleActive(item) {
    await apiPost('/api/ticket', { action: 'ai_toggle', id: item.id, is_active: !item.is_active })
    setList(l => l.map(x => x.id === item.id ? { ...x, is_active: !item.is_active } : x))
  }

  async function deleteItem(id) {
    if (!confirm('Xóa tài liệu này?')) return
    await apiPost('/api/ticket', { action: 'ai_delete', id })
    setList(l => l.filter(x => x.id !== id))
  }

  // Đọc file và điền vào form content
  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileLoading(true)
    try {
      const name = file.name.toLowerCase()
      let text = ''

      if (name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.csv')) {
        // Đọc trực tiếp
        text = await file.text()
      } else if (name.endsWith('.pdf')) {
        // Đọc PDF cơ bản: tìm các chuỗi text trong binary
        const buf = await file.arrayBuffer()
        const bytes = new Uint8Array(buf)
        const raw = new TextDecoder('latin1').decode(bytes)
        // Extract text between BT/ET markers
        const matches = raw.match(/BT[\s\S]*?ET/g) || []
        const pieces = []
        for (const block of matches) {
          const strs = block.match(/\(((?:[^()\\]|\\.)*)\)\s*Tj/g) || []
          strs.forEach(s => {
            const m = s.match(/\(((?:[^()\\]|\\.)*)\)/)
            if (m) pieces.push(m[1].replace(/\\n/g,' ').replace(/\\\(/g,'(').replace(/\\\)/g,')').trim())
          })
        }
        text = pieces.filter(Boolean).join('\n') || '[PDF phức tạp — vui lòng copy và paste nội dung thủ công]'
      } else if (name.endsWith('.docx')) {
        // DOCX cần thư viện bên ngoài — yêu cầu copy paste thủ công
        text = '[File DOCX — vui lòng mở file bằng Word, copy toàn bộ nội dung và paste vào đây]'
      } else {
        text = await file.text().catch(() => '[Không đọc được file này, vui lòng paste nội dung thủ công]')
      }

      setFormContent(text.slice(0, 50000)) // max 50K chars
      if (!formTitle) setFormTitle(file.name.replace(/\.[^.]+$/, ''))
      setShowForm(true)
    } catch(e) {
      alert('Lỗi đọc file: ' + e.message)
    } finally {
      setFileLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const totalChars = list.reduce((s, x) => s + (x.content?.length || 0), 0)
  const activeCount = list.filter(x => x.is_active).length

  const inp = { width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#1a2332', background: '#fff', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a2332' }}>🧠 AI Knowledge Base</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            {activeCount}/{list.length} tài liệu đang bật · {(totalChars/1000).toFixed(1)}K ký tự · AI đọc khi trả lời khách hàng
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <label style={{ padding: '9px 16px', border: '1.5px dashed #00c7de', borderRadius: 8, background: '#f0fdfe', color: '#0c2a72', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            {fileLoading ? '⏳ Đang đọc...' : '📂 Upload file'}
            <input ref={fileRef} type="file" accept=".txt,.md,.pdf,.docx,.csv" onChange={handleFile} style={{ display: 'none' }} disabled={fileLoading} />
          </label>
          <button onClick={openNew} style={{ padding: '9px 18px', border: 'none', borderRadius: 8, background: '#0c2a72', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            ＋ Thêm thủ công
          </button>
        </div>
      </div>

      {/* Hướng dẫn */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 16px', marginBottom: 20, fontSize: 13, color: '#78350f' }}>
        💡 <b>Mẹo:</b> Thêm FAQ, hướng dẫn sử dụng, chính sách... AI sẽ đọc tất cả tài liệu <b>đang bật</b> để trả lời khách hàng chính xác hơn. Upload .txt hoặc paste nội dung trực tiếp. PDF/DOCX phức tạp nên copy paste thủ công.
      </div>

      <ErrorBox msg={error} />

      {/* Form thêm/sửa */}
      {showForm && (
        <div style={{ background: '#fff', border: '1.5px solid #00c7de', borderRadius: 12, padding: '20px 24px', marginBottom: 20, boxShadow: '0 4px 16px rgba(0,199,222,0.12)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#0c2a72' }}>
            {editId ? '✏️ Chỉnh sửa tài liệu' : '➕ Thêm tài liệu mới'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '10px 16px', marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>Tiêu đề *</label>
              <input style={inp} value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="VD: Hướng dẫn đặt CPA mục tiêu" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>Danh mục</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={formCategory} onChange={e => setFormCategory(e.target.value)}>
                {AI_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>
              Nội dung * <span style={{ color: '#94a3b8', fontWeight: 400 }}>({formContent.length.toLocaleString()} ký tự)</span>
            </label>
            <textarea
              style={{ ...inp, minHeight: 200, resize: 'vertical', lineHeight: 1.6 }}
              value={formContent}
              onChange={e => setFormContent(e.target.value)}
              placeholder="Nhập hoặc paste nội dung tài liệu..."
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '8px 18px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8faff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Hủy</button>
            <button onClick={handleSave} disabled={saving} style={{ padding: '8px 20px', border: 'none', borderRadius: 8, background: saving ? '#94a3b8' : '#10b981', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {saving ? '⏳ Đang lưu...' : '💾 Lưu tài liệu'}
            </button>
          </div>
        </div>
      )}

      {/* Danh sách */}
      {loading ? <Spinner /> : (
        <div>
          {list.length === 0 ? (
            <EmptyState icon="🧠" text="Chưa có tài liệu nào. Thêm để AI học!" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {list.map(item => (
                <div key={item.id} style={{ background: '#fff', border: `1.5px solid ${item.is_active ? '#e2e8f0' : '#f1f5f9'}`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 14, opacity: item.is_active ? 1 : 0.55 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#1a2332' }}>{item.title}</span>
                      <span style={{ fontSize: 11, background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                        {AI_CATEGORIES.find(c => c.value === item.category)?.label || item.category}
                      </span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{(item.content?.length||0).toLocaleString()} ký tự</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {item.content}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => toggleActive(item)} title={item.is_active ? 'Tắt' : 'Bật'} style={{ padding: '5px 10px', border: `1px solid ${item.is_active ? '#10b981' : '#e2e8f0'}`, borderRadius: 6, background: item.is_active ? '#f0fdf4' : '#f8faff', color: item.is_active ? '#10b981' : '#94a3b8', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {item.is_active ? '✅ Bật' : '⭕ Tắt'}
                    </button>
                    <button onClick={() => openEdit(item)} style={{ padding: '5px 10px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', color: '#0c2a72', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✏️</button>
                    <button onClick={() => deleteItem(item.id)} style={{ padding: '5px 10px', border: '1px solid #fecaca', borderRadius: 6, background: '#fef2f2', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── SMTP TAB ─────────────────────────────────────────────────────────────────
function SMTPTab() {
  const [form, setForm] = useState({
    host: '',
    port: 587,
    username: '',
    password: '',
    from_email: '',
    from_name: 'Go Meta Ads Pro',
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null) // 'active' | 'inactive' | null
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function fetchSmtp() {
      setLoading(true)
      try {
        const res = await apiPost('/api/ticket', { action: 'smtp_get' })
        if (res?.smtp) {
          setForm(prev => ({
            ...prev,
            host: res.smtp.host || '',
            port: res.smtp.port || 587,
            username: res.smtp.username || '',
            password: res.smtp.password || '',
            from_email: res.smtp.from_email || '',
            from_name: res.smtp.from_name || 'Go Meta Ads Pro',
          }))
          setStatus(res.smtp.is_active ? 'active' : (res.smtp.host ? 'inactive' : null))
        }
      } catch {
        // no smtp config yet, ignore
      } finally {
        setLoading(false)
      }
    }
    fetchSmtp()
  }, [])

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSave() {
    if (!form.host || !form.username || !form.password) {
      setError('Vui lòng điền đầy đủ Host, Username và Password')
      return
    }
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await apiPost('/api/ticket', {
        action: 'smtp_save',
        host: form.host,
        port: Number(form.port) || 587,
        username: form.username,
        password: form.password,
        from_email: form.from_email || form.username,
        from_name: form.from_name,
      })
      if (res?.ok) {
        setStatus('active')
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(res?.error || 'Lưu thất bại')
      }
    } catch (e) {
      setError('Lỗi: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 13px',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 13,
    color: '#1a2332',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  }
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#1a2332', marginBottom: 6 }

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a2332' }}>📧 Cài đặt Email / SMTP</h2>
        {status && (
          <span style={{
            display: 'inline-block',
            padding: '4px 14px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            background: status === 'active' ? '#d1fae5' : '#f1f5f9',
            color: status === 'active' ? '#065f46' : '#475569',
          }}>
            {status === 'active' ? '● Đang hoạt động' : '○ Chưa cấu hình'}
          </span>
        )}
      </div>

      <ErrorBox msg={error} />

      {loading ? <Spinner /> : (
        <>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', marginBottom: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 14 }}>
                <div>
                  <label style={labelStyle}>SMTP Host</label>
                  <input
                    style={inputStyle}
                    value={form.host}
                    onChange={e => set('host', e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Port</label>
                  <input
                    style={inputStyle}
                    type="number"
                    value={form.port}
                    onChange={e => set('port', e.target.value)}
                    placeholder="587"
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Username / Email gửi</label>
                <input
                  style={inputStyle}
                  type="email"
                  value={form.username}
                  onChange={e => set('username', e.target.value)}
                  placeholder="youremail@gmail.com"
                />
              </div>

              <div>
                <label style={labelStyle}>Password / App Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    style={{ ...inputStyle, paddingRight: 44 }}
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 16, color: '#64748b', fontFamily: 'inherit',
                    }}
                  >
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Tên hiển thị (From Name)</label>
                <input
                  style={inputStyle}
                  value={form.from_name}
                  onChange={e => set('from_name', e.target.value)}
                  placeholder="Go Meta Ads Pro"
                />
              </div>
            </div>
          </div>

          {/* Guide */}
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 10,
            padding: '14px 18px',
            fontSize: 13,
            color: '#92400e',
            marginBottom: 20,
            lineHeight: 1.7,
          }}>
            <b>Với Gmail:</b> dùng App Password tại{' '}
            <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: '#0c2a72', fontWeight: 600 }}>
              myaccount.google.com/apppasswords
            </a>
            {' '}(cần bật 2FA). Port: 587 (TLS) hoặc 465 (SSL).
          </div>

          {saved && (
            <div style={{
              padding: '10px 16px', borderRadius: 8,
              background: '#d1fae5', border: '1px solid #6ee7b7',
              color: '#065f46', fontSize: 13, fontWeight: 600,
              marginBottom: 16,
            }}>
              ✅ Đã lưu cài đặt SMTP thành công!
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '11px 28px',
              border: 'none',
              borderRadius: 8,
              background: saving ? '#94a3b8' : '#0c2a72',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              opacity: saving ? 0.8 : 1,
            }}
          >
            {saving ? '⏳ Đang lưu...' : '💾 Lưu cài đặt'}
          </button>
        </>
      )}
    </div>
  )
}

// ─── POLICY CHECK TAB ─────────────────────────────────────────────────────────
const PC_INDUSTRIES = [
  { value: 'general', label: 'Tổng quát (mặc định)' },
  { value: 'health', label: 'Y tế / Sức khoẻ / TPCN' },
  { value: 'beauty', label: 'Làm đẹp / Mỹ phẩm' },
  { value: 'finance', label: 'Tài chính / Đầu tư' },
  { value: 'weight_loss', label: 'Giảm cân / Giảm béo' },
  { value: 'ecommerce', label: 'Thương mại điện tử' },
  { value: 'education', label: 'Giáo dục / Khoá học' },
  { value: 'realestate', label: 'Bất động sản' },
  { value: 'crypto', label: 'Tiền điện tử / NFT' },
]

function PolicyCheckTab() {
  const [subTab, setSubTab] = useState('docs')
  const cardStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginBottom: 20 }
  const subBtnStyle = (active) => ({
    padding: '8px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', background: active ? '#0c2a72' : '#e2e8f0', color: active ? '#fff' : '#475569',
    fontFamily: 'inherit', transition: 'all .15s',
  })

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0c2a72', marginBottom: 20 }}>🛡️ AI Kiểm tra Vi phạm Chính sách Meta</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[['docs','📄 Tài liệu Chính sách'],['stats','📊 Thống kê'],['config','⚙️ Cấu hình AI']].map(([id, label]) => (
          <button key={id} style={subBtnStyle(subTab === id)} onClick={() => setSubTab(id)}>{label}</button>
        ))}
      </div>
      {subTab === 'docs'   && <PolicyDocsSubTab cardStyle={cardStyle} />}
      {subTab === 'stats'  && <PolicyStatsSubTab cardStyle={cardStyle} />}
      {subTab === 'config' && <PolicyConfigSubTab cardStyle={cardStyle} />}
    </div>
  )
}

function PolicyDocsSubTab({ cardStyle }) {
  const [industry, setIndustry] = useState('general')
  const [content, setContent]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [meta, setMeta]         = useState(null)
  const [allDocs, setAllDocs]   = useState([])

  async function fetchDocs() {
    setLoading(true)
    try {
      const r = await apiPost('/api/ai-chat', { action: 'pc_get_doc' })
      setAllDocs(r.docs || [])
      const doc = (r.docs || []).find(d => d.industry === industry)
      if (doc) { setContent(doc.content); setMeta(doc) }
      else { setContent(''); setMeta(null) }
    } catch (e) { alert('Lỗi tải: ' + e.message) } finally { setLoading(false) }
  }

  useEffect(() => { fetchDocs() }, [])

  useEffect(() => {
    const doc = allDocs.find(d => d.industry === industry)
    if (doc) { setContent(doc.content); setMeta(doc) }
    else { setContent(''); setMeta(null) }
  }, [industry, allDocs])

  async function handleSave() {
    if (!content.trim()) { alert('Nội dung không được để trống'); return }
    setSaving(true)
    try {
      await apiPost('/api/ai-chat', { action: 'pc_save_doc', industry, content })
      await fetchDocs()
      alert('✅ Đã lưu tài liệu chính sách')
    } catch (e) { alert('Lỗi lưu: ' + e.message) } finally { setSaving(false) }
  }

  async function handleReset() {
    if (!confirm(`Reset tài liệu ngành "${industry}" về mặc định?`)) return
    try {
      await apiPost('/api/ai-chat', { action: 'pc_reset_doc', industry })
      await fetchDocs()
      alert('✅ Đã reset về mặc định')
    } catch (e) { alert('Lỗi: ' + e.message) }
  }

  return (
    <div style={cardStyle}>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 1.6 }}>
        Tài liệu này được AI đọc khi kiểm tra nội dung quảng cáo. Cập nhật khi Meta thay đổi policy hoặc cần tuỳ chỉnh cho từng ngành.
      </p>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5, textTransform: 'uppercase' }}>Ngành</label>
          <select value={industry} onChange={e => setIndustry(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit' }}>
            {PC_INDUSTRIES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
          </select>
        </div>
        {meta && <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>Cập nhật: {new Date(meta.updated_at).toLocaleDateString('vi-VN')}</span>}
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>⏳ Đang tải...</div> : (
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Nhập nội dung tài liệu policy cho ngành này. Nếu để trống, AI sẽ dùng tài liệu mặc định."
          style={{ width: '100%', minHeight: 420, padding: '12px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'Consolas, monospace', lineHeight: 1.7, resize: 'vertical', outline: 'none' }}
        />
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button onClick={handleSave} disabled={saving || loading} style={{ padding: '9px 20px', background: '#0c2a72', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          {saving ? '⏳ Đang lưu...' : '💾 Lưu tài liệu'}
        </button>
        <button onClick={handleReset} style={{ padding: '9px 16px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          🔄 Reset về mặc định
        </button>
      </div>
    </div>
  )
}

function PolicyStatsSubTab({ cardStyle }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('7d')

  async function fetchStats() {
    setLoading(true)
    try {
      const now = new Date()
      const days = range === '1d' ? 1 : range === '30d' ? 30 : 7
      const from = new Date(now - days * 86400000).toISOString().slice(0, 10)
      const to   = now.toISOString().slice(0, 10)
      const r = await apiPost('/api/ai-chat', { action: 'pc_stats', from, to })
      setStats(r)
    } catch (e) { alert('Lỗi tải stats: ' + e.message) } finally { setLoading(false) }
  }

  useEffect(() => { fetchStats() }, [range])

  const statCard = (icon, label, value, sub) => (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 20px', minWidth: 150 }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#0c2a72' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
    </div>
  )

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['1d','Hôm nay'],['7d','7 ngày'],['30d','30 ngày']].map(([v, l]) => (
          <button key={v} onClick={() => setRange(v)} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: range === v ? '#0c2a72' : '#fff', color: range === v ? '#fff' : '#475569', fontFamily: 'inherit' }}>{l}</button>
        ))}
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>⏳ Đang tải...</div> : stats ? (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
            {statCard('🔍', 'Tổng lượt check', stats.total)}
            {statCard('❌', 'Vi phạm phát hiện', stats.violations, `${stats.violation_rate}% tổng số`)}
            {statCard('👤', 'Users unique', stats.unique_users)}
            {statCard('💰', 'Chi phí ước tính', `$${stats.estimated_cost_usd}`, `≈ ${(stats.estimated_cost_vnd || 0).toLocaleString('vi-VN')}₫`)}
          </div>
          {stats.top_users?.length > 0 && (
            <>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0c2a72', marginBottom: 10 }}>Top Users</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: '#f8fafc' }}>
                  {['Key','Gói','Lượt check','Lần cuối'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>)}
                </tr></thead>
                <tbody>{stats.top_users.map((u, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 12 }}>{u.key}</td>
                    <td style={{ padding: '8px 12px' }}><Badge status={u.plan} /></td>
                    <td style={{ padding: '8px 12px', fontWeight: 700 }}>{u.count}</td>
                    <td style={{ padding: '8px 12px', color: '#64748b', fontSize: 12 }}>{u.last?.slice(0, 16).replace('T', ' ')}</td>
                  </tr>
                ))}</tbody>
              </table>
            </>
          )}
          {stats.total === 0 && <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>Chưa có lượt kiểm tra nào trong kỳ này</div>}
        </>
      ) : null}
    </div>
  )
}

function PolicyConfigSubTab({ cardStyle }) {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  async function fetchConfig() {
    setLoading(true)
    try {
      const r = await apiPost('/api/ai-chat', { action: 'pc_config_get' })
      setConfig(r.config || {})
    } catch (e) { alert('Lỗi tải config: ' + e.message) } finally { setLoading(false) }
  }

  useEffect(() => { fetchConfig() }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await apiPost('/api/ai-chat', {
        action: 'pc_config_save',
        model: config.model,
        rate_limit_business: parseInt(config.rateLimitBusiness),
        rate_limit_agency: parseInt(config.rateLimitAgency),
        enabled: config.enabled,
      })
      alert('✅ Đã lưu cấu hình')
    } catch (e) { alert('Lỗi lưu: ' + e.message) } finally { setSaving(false) }
  }

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    try {
      const r = await apiPost('/api/ai-chat', {
        action: 'policy_check',
        key: 'TEST',
        content: { headline: 'Test kết nối AI', body: 'Sản phẩm chất lượng tốt' },
        industry: 'general', lang: 'vi'
      })
      if (r.ok) setTestResult({ ok: true, msg: `✅ Kết nối OK — Model: ${config?.model}` })
      else setTestResult({ ok: false, msg: `❌ ${r.error}` })
    } catch (e) {
      setTestResult({ ok: false, msg: `❌ Lỗi: ${e.message}` })
    } finally { setTesting(false) }
  }

  const field = (label, children) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }

  if (loading) return <div style={cardStyle}><div style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>⏳ Đang tải...</div></div>

  return (
    <div style={cardStyle}>
      {field('AI Model', (
        <select value={config?.model || ''} onChange={e => setConfig(c => ({ ...c, model: e.target.value }))} style={inputStyle}>
          <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (rẻ, nhanh — khuyến nghị)</option>
          <option value="claude-sonnet-4-6">Claude Sonnet 4.6 (mạnh hơn, tốn hơn)</option>
        </select>
      ))}
      {field('Rate Limit — Business (lần/ngày)', (
        <input type="number" min={1} max={500} value={config?.rateLimitBusiness || 30} onChange={e => setConfig(c => ({ ...c, rateLimitBusiness: e.target.value }))} style={inputStyle} />
      ))}
      {field('Rate Limit — Agency (lần/ngày)', (
        <input type="number" min={1} max={1000} value={config?.rateLimitAgency || 100} onChange={e => setConfig(c => ({ ...c, rateLimitAgency: e.target.value }))} style={inputStyle} />
      ))}
      {field('Trạng thái tính năng', (
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={config?.enabled !== false} onChange={e => setConfig(c => ({ ...c, enabled: e.target.checked }))} style={{ width: 16, height: 16 }} />
          <span style={{ fontSize: 13 }}>{config?.enabled !== false ? '✅ Đang hoạt động' : '⛔ Đã tắt'}</span>
        </label>
      ))}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
        <button onClick={handleSave} disabled={saving} style={{ padding: '9px 20px', background: '#0c2a72', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          {saving ? '⏳ Đang lưu...' : '💾 Lưu cấu hình'}
        </button>
        <button onClick={handleTest} disabled={testing} style={{ padding: '9px 16px', background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          {testing ? '⏳ Đang test...' : '🧪 Test kết nối'}
        </button>
        {testResult && <span style={{ fontSize: 13, color: testResult.ok ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{testResult.msg}</span>}
      </div>
      <div style={{ marginTop: 16, padding: '12px 14px', background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>
        💡 <strong>ANTHROPIC_API_KEY</strong> được cấu hình trong Vercel Dashboard → Settings → Environment Variables.<br />
        Chi phí ước tính: <strong>$0.00025/lần check</strong> với Claude Haiku (~6.500đ/1000 lần).
      </div>
    </div>
  )
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
// ─── WEB USERS TAB ────────────────────────────────────────────────────────────
const ADMIN_TOKEN = typeof window !== 'undefined' ? atob(localStorage.getItem('gmap_admin_token') || '') : ''

async function adminApi(action, extra = {}) {
  const res = await fetch('/api/admin/web-users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': ADMIN_TOKEN,
    },
    body: JSON.stringify({ action, ...extra }),
  })
  return res.json()
}

const PLAN_LABELS = { trial: 'Dùng thử', personal: 'Personal', business: 'Business', agency: 'Agency' }
const PLAN_COLORS = {
  trial:    { bg: '#f1f5f9', color: '#475569' },
  personal: { bg: '#dbeafe', color: '#1e40af' },
  business: { bg: '#d1fae5', color: '#065f46' },
  agency:   { bg: '#fef3c7', color: '#92400e' },
}

function WebUsersTab() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')
  const [editing, setEditing] = useState(null) // { id, email, plan, expire_at }
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
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
      const d = await callApi('update_plan', {
        user_id: editing.id,
        plan: editForm.plan,
        expire_at: editForm.expire_at || null,
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
    fontFamily: 'inherit', outline: 'none', background: '#fff', color: '#1a2332',
  }

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: '#fff', borderRadius: 10, padding: '12px 20px',
          fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,.25)',
        }}>{toast.msg}</div>
      )}

      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a2332', marginBottom: 24 }}>
        🌐 Quản lý Web Users (SaaS)
      </h2>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Tổng users', value: stats.total, color: '#0c2a72', icon: '👤' },
            { label: 'Dùng thử', value: stats.plan_counts?.trial || 0, color: '#475569', icon: '🔓' },
            { label: 'Personal', value: stats.plan_counts?.personal || 0, color: '#1e40af', icon: '👤' },
            { label: 'Business', value: stats.plan_counts?.business || 0, color: '#065f46', icon: '💼' },
            { label: 'Đăng ký hôm nay', value: stats.today_new || 0, color: '#7c3aed', icon: '✨' },
          ].map(s => (
            <div key={s.label} style={{ ...card, padding: '16px 18px', marginBottom: 0 }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div style={{ ...card, padding: '14px 20px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          style={{ ...inp, flex: 1, minWidth: 200 }}
          placeholder="Tìm theo email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select style={inp} value={filterPlan} onChange={e => setFilterPlan(e.target.value)}>
          <option value="all">Tất cả gói</option>
          <option value="trial">Dùng thử</option>
          <option value="personal">Personal</option>
          <option value="business">Business</option>
          <option value="agency">Agency</option>
        </select>
        <button onClick={load} style={{ ...inp, background: '#00c7de', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '8px 18px' }}>
          🔄 Làm mới
        </button>
        <span style={{ fontSize: 13, color: '#94a3b8' }}>{users.length} users</span>
      </div>

      {/* Table */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        {loading ? <Spinner /> : users.length === 0 ? <EmptyState icon="👤" text="Không có user nào" /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Email', 'Tên', 'Gói', 'Hết hạn', 'Facebook', 'Tài khoản Ads', 'Đăng ký', 'Thao tác'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748b', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const pc = PLAN_COLORS[u.plan] || PLAN_COLORS.trial
                  const rowBg = i % 2 === 0 ? '#fff' : '#fafbfc'
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', background: rowBg }}>
                      <td style={{ padding: '10px 14px', fontSize: 13 }}>
                        <div style={{ fontWeight: 600, color: '#1a2332' }}>{u.email}</div>
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
                          : <span style={{ color: '#94a3b8' }}>Không giới hạn</span>}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12 }}>
                        {u.fb_connected
                          ? <span style={{ color: '#059669', fontWeight: 600 }}>✅ Đã kết nối</span>
                          : <span style={{ color: '#94a3b8' }}>Chưa kết nối</span>}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#475569' }}>
                        {u.ad_account_count > 0 ? `${u.ad_account_count} TK` : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => { setEditing(u); setEditForm({ plan: u.plan, expire_at: u.expire_at ? u.expire_at.slice(0, 10) : '' }) }}
                            style={{ background: 'rgba(0,199,222,0.1)', color: '#00c7de', border: '1px solid rgba(0,199,222,0.3)', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                          >✏️ Sửa</button>
                          {u.fb_connected && (
                            <button
                              onClick={() => handleResetFb(u)}
                              style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                            >🔗 Reset FB</button>
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
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a2332', marginBottom: 6 }}>Cập nhật tài khoản</h3>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>{editing.email}</p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Gói dịch vụ</label>
              <select
                style={{ ...inp, width: '100%' }}
                value={editForm.plan}
                onChange={e => setEditForm(p => ({ ...p, plan: e.target.value }))}
              >
                <option value="trial">Dùng thử</option>
                <option value="personal">Personal</option>
                <option value="business">Business</option>
                <option value="agency">Agency</option>
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Ngày hết hạn <span style={{ fontWeight: 400, textTransform: 'none', color: '#94a3b8' }}>(để trống = không giới hạn)</span>
              </label>
              <input
                type="date"
                style={{ ...inp, width: '100%' }}
                value={editForm.expire_at || ''}
                onChange={e => setEditForm(p => ({ ...p, expire_at: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditing(null)} style={{ ...inp, cursor: 'pointer', background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 20px', fontWeight: 600 }}>
                Huỷ
              </button>
              <button
                onClick={handleSavePlan}
                disabled={saving}
                style={{ ...inp, cursor: 'pointer', background: '#00c7de', color: '#fff', border: 'none', padding: '10px 20px', fontWeight: 700 }}
              >
                {saving ? 'Đang lưu...' : '💾 Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── WEB TICKETS TAB ─────────────────────────────────────────────────────────
function WebTicketsTab() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const adminToken = typeof window !== 'undefined' ? atob(localStorage.getItem('gmap_admin_token') || '') : ''
  const showToast = (msg, type = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  async function call(action, extra = {}) {
    const res = await fetch('/api/admin/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
      body: JSON.stringify({ action, ...extra }),
    })
    return res.json()
  }

  async function load() {
    setLoading(true)
    const d = await call('list', { status: filter })
    if (d.ok) setTickets(d.tickets || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  async function handleReply() {
    if (!replyText.trim()) return
    setSaving(true)
    const d = await call('reply', { id: selected.id, message: replyText })
    if (!d.ok) { showToast(d.error || 'Lỗi', 'error'); setSaving(false); return }
    setReplyText('')
    showToast('Đã gửi phản hồi')
    const refreshed = await call('get', { id: selected.id })
    if (refreshed.ok) setSelected(refreshed.ticket)
    load()
    setSaving(false)
  }

  async function handleStatus(id, status) {
    await call('update_status', { id, status })
    showToast('Đã cập nhật trạng thái')
    if (selected?.id === id) setSelected(p => ({ ...p, status }))
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Xoá ticket này?')) return
    await call('delete', { id })
    setSelected(null)
    load()
  }

  const ST = {
    open:        { label: 'Chờ xử lý',    bg: '#dbeafe', color: '#1e40af' },
    in_progress: { label: 'Đang xử lý',   bg: '#fef3c7', color: '#92400e' },
    resolved:    { label: 'Đã giải quyết', bg: '#d1fae5', color: '#065f46' },
    closed:      { label: 'Đã đóng',       bg: '#f1f5f9', color: '#475569' },
  }
  const FILTERS = [
    { id: 'all', label: 'Tất cả' },
    { id: 'open', label: 'Chờ xử lý' },
    { id: 'in_progress', label: 'Đang xử lý' },
    { id: 'resolved', label: 'Đã giải quyết' },
    { id: 'closed', label: 'Đã đóng' },
  ]
  const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }
  const inp = { padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', color: '#1a2332' }

  return (
    <div>
      {toast && <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.type === 'error' ? '#ef4444' : '#10b981', color: '#fff', borderRadius: 10, padding: '12px 20px', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,.25)' }}>{toast.msg}</div>}

      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a2332', marginBottom: 20 }}>🎫 Support Tickets (Web)</h2>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', borderColor: filter === f.id ? '#00c7de' : '#e2e8f0', background: filter === f.id ? 'rgba(0,199,222,0.1)' : '#fff', color: filter === f.id ? '#00c7de' : '#64748b' }}>
            {f.label}
          </button>
        ))}
        <button onClick={load} style={{ ...inp, cursor: 'pointer', marginLeft: 'auto', background: '#f8fafc', color: '#64748b', padding: '7px 14px' }}>🔄</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '380px 1fr' : '1fr', gap: 20, alignItems: 'start' }}>
        {/* List */}
        <div style={card}>
          {loading ? <Spinner /> : tickets.length === 0 ? <EmptyState icon="🎫" text="Không có ticket nào" /> : (
            <div>
              {tickets.map((t, i) => (
                <div key={t.id} onClick={() => setSelected(t)} style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: selected?.id === t.id ? '#f0fdfc' : i % 2 ? '#fafbfc' : '#fff', transition: 'background .15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2332', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</div>
                    <span style={{ background: ST[t.status]?.bg, color: ST[t.status]?.color, borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{ST[t.status]?.label || t.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    {t.user_email} · {new Date(t.created_at).toLocaleDateString('vi-VN')}
                    {t.replies?.length > 0 && ` · ${t.replies.length} phản hồi`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail */}
        {selected && (
          <div style={card}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2332', marginBottom: 3 }}>{selected.subject}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{selected.user_email} · {new Date(selected.created_at).toLocaleString('vi-VN')}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['open','in_progress','resolved','closed'].map(s => (
                  <button key={s} onClick={() => handleStatus(selected.id, s)}
                    style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${ST[s]?.color}40`, background: selected.status === s ? ST[s]?.bg : 'transparent', color: ST[s]?.color, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {ST[s]?.label}
                  </button>
                ))}
                <button onClick={() => handleDelete(selected.id)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fee2e2', color: '#991b1b', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>🗑</button>
              </div>
            </div>

            <div style={{ padding: '16px 18px', maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Original message */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>User</div>
                <div style={{ fontSize: 13, color: '#1a2332', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selected.message}</div>
              </div>
              {/* Replies */}
              {(selected.replies || []).map((r, i) => (
                <div key={i} style={{ background: r.from === 'admin' ? 'rgba(0,199,222,0.06)' : '#f8fafc', border: `1px solid ${r.from === 'admin' ? 'rgba(0,199,222,0.2)' : '#e2e8f0'}`, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: r.from === 'admin' ? '#00c7de' : '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
                    {r.from === 'admin' ? '🛡 Admin' : 'User'}
                  </div>
                  <div style={{ fontSize: 13, color: '#1a2332', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{r.message}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{new Date(r.created_at).toLocaleString('vi-VN')}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: '14px 18px', borderTop: '1px solid #e2e8f0' }}>
              <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Nhập phản hồi cho user..." rows={3}
                style={{ ...inp, width: '100%', resize: 'vertical', marginBottom: 10 }} />
              <button onClick={handleReply} disabled={saving || !replyText.trim()}
                style={{ padding: '9px 20px', background: '#00c7de', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: saving || !replyText.trim() ? 0.5 : 1 }}>
                {saving ? 'Đang gửi...' : '📨 Gửi phản hồi'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const MENU = [
  { id: 'overview',    icon: '📊', label: 'Tổng quan' },
  null,
  { id: 'web_users',  icon: '🌐', label: 'Web Users (SaaS)' },
  { id: 'web_tickets', icon: '🎫', label: 'Support Tickets' },
  { id: 'policycheck', icon: '🛡️', label: 'Kiểm tra Vi phạm' },
  { id: 'ai_knowledge', icon: '🧠', label: 'AI Knowledge' },
  { id: 'pixels',     icon: '📈', label: 'Tracking Pixels' },
  { id: 'smtp',       icon: '📧', label: 'Email / SMTP' },
  null,
  { id: 'customers',  icon: '👥', label: 'Key Khách Hàng (cũ)' },
  { id: 'check-key',  icon: '🔑', label: 'Kiểm tra Key (cũ)' },
  { id: 'affiliate',  icon: '🤝', label: 'Affiliate (cũ)' },
  { id: 'tickets',    icon: '🗂', label: 'Tickets Extension (cũ)' },
  { id: 'downloads',  icon: '📥', label: 'Yêu cầu tải (cũ)' },
]

function Sidebar({ activeTab, setActiveTab, onLogout }) {
  return (
    <div style={{
      width: 240,
      minWidth: 240,
      height: '100vh',
      background: '#0a1535',
      borderRight: '1px solid rgba(0,199,222,0.1)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 100,
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid rgba(0,199,222,0.08)' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#00c7de', letterSpacing: 0.5, lineHeight: 1.2 }}>
          Go Meta Ads Pro
        </div>
        <div style={{ fontSize: 11, color: 'rgba(0,199,222,0.5)', marginTop: 3, fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase' }}>
          Admin Panel
        </div>
      </div>

      {/* Menu */}
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {MENU.map((item, idx) => {
          if (!item) {
            return <div key={`divider-${idx}`} style={{ height: 1, background: 'rgba(0,199,222,0.08)', margin: '6px 0' }} />
          }
          const isLegacy = item.label?.includes('(cũ)')
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 20px',
                background: isActive ? 'rgba(0,199,222,0.12)' : 'transparent',
                borderLeft: isActive ? '3px solid #00c7de' : '3px solid transparent',
                border: 'none',
                borderRadius: 0,
                color: isActive ? '#00c7de' : isLegacy ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.6)',
                fontSize: isLegacy ? 12 : 13,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = isLegacy ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'transparent' } }}
            >
              <span style={{ fontSize: 14, width: 20, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 0', borderTop: '1px solid rgba(0,199,222,0.08)' }}>
        <button
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '11px 20px',
            background: 'transparent',
            border: 'none',
            borderLeft: '3px solid transparent',
            color: 'rgba(255,255,255,0.4)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'transparent' }}
        >
          <span style={{ fontSize: 16, width: 20, textAlign: 'center', flexShrink: 0 }}>🚪</span>
          Đăng xuất
        </button>
      </div>
    </div>
  )
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('web_users')
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    async function init() {
      const ok = await checkAdminAuth()
      if (!ok) {
        router.replace('/admin/login')
      } else {
        setAuthChecked(true)
      }
    }
    init()
  }, [router])

  async function handleLogout() {
    await adminLogout()
    router.replace('/admin/login')
  }

  if (!authChecked) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a1535' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{
            display: 'inline-block',
            width: 32,
            height: 32,
            border: '3px solid rgba(0,199,222,0.3)',
            borderTop: '3px solid #00c7de',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }} />
          <p style={{ marginTop: 12, fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Đang xác thực...</p>
        </div>
      </div>
    )
  }

  const tabContent = {
    'overview':    <OverviewTab />,
    'web_users':   <WebUsersTab />,
    'web_tickets': <WebTicketsTab />,
    'policycheck': <PolicyCheckTab />,
    'ai_knowledge': <AiKnowledgeTab />,
    'pixels':      <PixelsTab />,
    'smtp':        <SMTPTab />,
    'customers':   <CustomersTab />,
    'check-key':   <CheckKeyTab />,
    'affiliate':   <AffiliateTab />,
    'tickets':     <TicketsTab />,
    'downloads':   <DownloadsTab />,
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard — Go Meta Ads Pro</title>
        <meta name="robots" content="noindex,nofollow" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f1f5f9; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: #f1f5f9; }
          ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
          select:focus, input:focus, textarea:focus { border-color: #00c7de !important; box-shadow: 0 0 0 2px rgba(0,199,222,0.15); }
        `}</style>
      </Head>

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
        <main style={{ marginLeft: 240, flex: 1, padding: 32, minHeight: '100vh', background: '#f1f5f9' }}>
          {tabContent[activeTab] || null}
        </main>
      </div>
    </>
  )
}
