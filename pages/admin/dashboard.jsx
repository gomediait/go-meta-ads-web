import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { checkAdminAuth, adminLogout } from '../../lib/adminAuth'

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
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [orderRes, downloadRes] = await Promise.allSettled([
          apiPost('/api/order', { action: 'list', limit: 1000 }),
          apiPost('/api/download', { action: 'list', limit: 1000 }),
        ])
        const orders = orderRes.status === 'fulfilled'
          ? (orderRes.value?.orders || orderRes.value?.data || []) : []
        const downloads = downloadRes.status === 'fulfilled'
          ? (downloadRes.value?.downloads || downloadRes.value?.data || []) : []
        const today = new Date().toISOString().slice(0, 10)
        const todayDownloads = downloads.filter(d => (d.created_at || '').slice(0, 10) === today)
        setStats({
          total: orders.length,
          pending: orders.filter(o => o.status === 'pending').length,
          confirmed: orders.filter(o => o.status === 'confirmed').length,
          todayDownloads: todayDownloads.length,
          recent: orders.slice(0, 5),
        })
      } catch (e) {
        setError('Không thể tải dữ liệu: ' + e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const cardStyle = {
    background: '#fff',
    borderRadius: 12,
    padding: '24px 28px',
    boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
    flex: 1,
    minWidth: 0,
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a2332', marginBottom: 24 }}>
        📊 Tổng quan hệ thống
      </h2>
      {error && <ErrorBox msg={error} />}
      {loading ? <Spinner /> : stats && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Tổng đơn hàng', value: stats.total, color: '#0c2a72', icon: '📋' },
              { label: 'Chờ xử lý', value: stats.pending, color: '#d97706', icon: '⏳' },
              { label: 'Đã xác nhận', value: stats.confirmed, color: '#059669', icon: '✅' },
              { label: 'Tải hôm nay', value: stats.todayDownloads, color: '#7c3aed', icon: '📥' },
            ].map(card => (
              <div key={card.label} style={cardStyle}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{card.icon}</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: card.color, lineHeight: 1 }}>
                  {card.value}
                </div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>{card.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1a2332' }}>
                Đơn hàng gần nhất
              </h3>
            </div>
            {stats.recent.length === 0 ? <EmptyState text="Chưa có đơn hàng nào" /> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0c2a72' }}>
                    {['Khách hàng', 'Gói', 'Trạng thái', 'Ngày'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#fff' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.map((o, i) => (
                    <tr key={o.id || i} style={{ background: i % 2 === 0 ? '#fff' : '#f8faff' }}>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#1a2332' }}>{o.full_name || o.name || '—'}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#64748b' }}>{o.plan_id || o.plan || '—'}</td>
                      <td style={{ padding: '10px 14px' }}><Badge status={o.status} /></td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#94a3b8' }}>
                        {o.created_at ? new Date(o.created_at).toLocaleDateString('vi-VN') : '—'}
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
  const [form, setForm] = useState({
    full_name: order?.full_name || order?.name || '',
    phone: order?.phone || '',
    email: order?.email || '',
    shop_name: order?.shop_name || order?.company || '',
    plan_id: order?.plan_id || order?.plan || 'ca-nhan',
    billing: order?.billing || 'thang',
    price: order?.price || '',
    referral_code: order?.referral_code || '',
    status: order?.status || 'pending',
    license_key: order?.license_key || order?.key || '',
    note: order?.note || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const ck = computeCK(form.full_name, form.plan_id, form.billing)

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSave() {
    if (!form.full_name.trim()) { setError('Vui lòng nhập họ tên'); return }
    setSaving(true)
    setError('')
    try {
      if (isNew) {
        await apiPost('/api/order', { action: 'create', ...form, transfer_content: ck })
      } else {
        await apiPost('/api/order', { action: 'update', id: order.id, ...form, transfer_content: ck })
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
              <label style={labelStyle}>Billing</label>
              <select style={inputStyle} value={form.billing} onChange={e => set('billing', e.target.value)}>
                {BILLING_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Giá (VNĐ)</label>
              <input style={inputStyle} value={form.price} onChange={e => set('price', e.target.value)} placeholder="299000" />
            </div>
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
  const [shopCode, setShopCode] = useState(
    (order?.shop_name || order?.full_name || '').replace(/\s+/g, '').slice(0, 6).toUpperCase()
  )
  const [plan, setPlan] = useState(order?.plan_id || 'personal')
  const [duration, setDuration] = useState('nam1')
  const [customDate, setCustomDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const planMap = { 'ca-nhan': 'personal', 'doanh-nghiep': 'business', 'agency': 'agency', 'thu-nghiem': 'personal' }
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

  async function handleCreate() {
    if (!shopCode.trim()) { setError('Nhập shop code'); return }
    setLoading(true)
    setError('')
    try {
      const expire_at = getExpireAt()
      const res = await apiPost('/api/license', {
        action: 'create_admin',
        shop_code: shopCode.toUpperCase(),
        plan: resolvedPlan,
        expire_at,
      })
      const key = res.key || res.license_key || res.data?.key || res.data?.license_key
      if (!key) throw new Error('Không nhận được key từ server')
      setNewKey(key)
      // Auto update order
      try {
        await apiPost('/api/order', {
          action: 'update',
          id: order.id,
          license_key: key,
          status: 'confirmed',
        })
      } catch (_) {}
    } catch (e) {
      setError('Lỗi tạo key: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  function copyKey() {
    navigator.clipboard.writeText(newKey).then(() => {
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
          <div style={{ background: '#f8faff', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#1a2332', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
            <span><b>Tên:</b> {order?.full_name || order?.name}</span>
            <span><b>SĐT:</b> {order?.phone || '—'}</span>
            <span><b>Gói:</b> {order?.plan_id || '—'}</span>
            <span><b>Billing:</b> {order?.billing || '—'}</span>
          </div>

          {error && <ErrorBox msg={error} />}

          {!newKey && (
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
                  <label style={labelStyle}>Ngày hết hạn</label>
                  <input style={inputStyle} type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} />
                </div>
              )}
              <button
                onClick={handleCreate}
                disabled={loading}
                style={{
                  padding: '11px 0',
                  border: 'none',
                  borderRadius: 8,
                  background: '#00c7de',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  fontFamily: 'inherit',
                }}
              >
                {loading ? 'Đang tạo key...' : '✨ Tạo key tự động'}
              </button>
            </div>
          )}

          {newKey && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ background: '#f0fdfe', border: '2px solid #00c7de', borderRadius: 12, padding: '20px 16px', marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 8px' }}>Key đã tạo thành công</p>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#00c7de', letterSpacing: 1, wordBreak: 'break-all' }}>
                  {newKey}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button
                  onClick={copyKey}
                  style={{ padding: '9px 20px', border: '1px solid #00c7de', borderRadius: 8, background: copied ? '#d1fae5' : '#fff', color: copied ? '#065f46' : '#00c7de', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {copied ? '✓ Đã sao chép' : '⎘ Sao chép key'}
                </button>
                <button
                  onClick={() => { copyKey(); onDone() }}
                  style={{ padding: '9px 20px', border: 'none', borderRadius: 8, background: '#00c7de', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Sao chép & Đóng
                </button>
              </div>
            </div>
          )}
        </div>

        {!newKey && (
          <div style={{ padding: '14px 22px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '8px 18px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8faff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Đóng
            </button>
          </div>
        )}
        {newKey && (
          <div style={{ padding: '14px 22px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onDone} style={{ padding: '8px 18px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8faff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Đóng
            </button>
          </div>
        )}
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

// ─── TICKETS TAB ──────────────────────────────────────────────────────────────
function TicketsTab() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedRow, setExpandedRow] = useState(null)
  const [updating, setUpdating] = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await apiPost('/api/ticket', { action: 'list', limit: 50 })
      const data = res?.tickets || res?.data || []
      setTickets(data)
    } catch (e) {
      setError('Không thể tải tickets: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id, newStatus) {
    setUpdating(id)
    try {
      await apiPost('/api/ticket', { action: 'update', id, status: newStatus })
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
    } catch (e) {
      alert('Lỗi cập nhật: ' + e.message)
    } finally {
      setUpdating(null)
    }
  }

  const nextStatus = { open: 'in_progress', in_progress: 'resolved' }
  const nextLabel = { open: '▶ Xử lý', in_progress: '✓ Giải quyết' }

  const thStyle = { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }
  const tdStyle = { padding: '10px 12px', fontSize: 12, color: '#1a2332', verticalAlign: 'middle' }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a2332' }}>🎫 Tickets hỗ trợ</h2>
        <button onClick={load} style={{ padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#64748b', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          🔄 Làm mới
        </button>
      </div>

      <ErrorBox msg={error} />

      {loading ? <Spinner /> : (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          {tickets.length === 0 ? <EmptyState icon="🎫" text="Chưa có ticket nào" /> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                <thead>
                  <tr style={{ background: '#0c2a72' }}>
                    {['ID', 'Key', 'SĐT', 'Email', 'Loại', 'Mô tả', 'Trạng thái', 'Ngày', 'Hành động'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t, i) => {
                    const isExpanded = expandedRow === (t.id || i)
                    return [
                      <tr
                        key={t.id || i}
                        onClick={() => setExpandedRow(isExpanded ? null : (t.id || i))}
                        style={{ background: i % 2 === 0 ? '#fff' : '#f8faff', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,199,222,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#f8faff'}
                      >
                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>
                          {(t.id || '').slice(0, 8)}
                        </td>
                        <td style={{ ...tdStyle, color: '#00c7de', fontFamily: 'monospace', fontSize: 11 }}>{t.license_key || t.key || '—'}</td>
                        <td style={tdStyle}>{t.phone || '—'}</td>
                        <td style={{ ...tdStyle, fontSize: 11 }}>{t.email || '—'}</td>
                        <td style={tdStyle}>{t.type || t.category || '—'}</td>
                        <td style={{ ...tdStyle, maxWidth: 200 }}>
                          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                            {(t.description || t.message || '').slice(0, 80)}{(t.description || t.message || '').length > 80 ? '...' : ''}
                          </span>
                        </td>
                        <td style={tdStyle}><Badge status={t.status || 'open'} /></td>
                        <td style={{ ...tdStyle, fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          {t.created_at ? new Date(t.created_at).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td style={tdStyle} onClick={e => e.stopPropagation()}>
                          {nextStatus[t.status] && (
                            <button
                              onClick={() => updateStatus(t.id, nextStatus[t.status])}
                              disabled={updating === t.id}
                              style={{
                                padding: '4px 10px',
                                border: 'none',
                                borderRadius: 6,
                                background: t.status === 'open' ? '#0c2a72' : '#059669',
                                color: '#fff',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {updating === t.id ? '...' : nextLabel[t.status]}
                            </button>
                          )}
                        </td>
                      </tr>,
                      isExpanded && (
                        <tr key={`${t.id || i}-expand`} style={{ background: '#f0fdfe' }}>
                          <td colSpan={9} style={{ padding: '14px 20px', fontSize: 13, color: '#1a2332' }}>
                            <b>Mô tả đầy đủ:</b> {t.description || t.message || '—'}
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
    </div>
  )
}

// ─── DOWNLOADS TAB ────────────────────────────────────────────────────────────
function DownloadsTab() {
  const [downloads, setDownloads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await apiPost('/api/download', { action: 'list', limit: 200 })
        setDownloads(res?.downloads || res?.data || [])
      } catch (e) {
        setError('Không thể tải dữ liệu: ' + e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function exportCSV() {
    const headers = ['STT', 'Họ tên', 'SĐT/Zalo', 'Email', 'Loại người dùng', 'Ngày']
    const rows = downloads.map((d, i) => [
      i + 1, d.full_name || d.name || '', d.phone || d.zalo || '',
      d.email || '', d.user_type || d.type || '',
      d.created_at ? new Date(d.created_at).toLocaleDateString('vi-VN') : '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `downloads_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  const thStyle = { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#fff' }
  const tdStyle = { padding: '10px 12px', fontSize: 12, color: '#1a2332' }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a2332' }}>📥 Yêu cầu tải</h2>
        <button
          onClick={exportCSV}
          style={{ padding: '9px 18px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#1a2332', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >
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
                  {['STT', 'Họ tên', 'SĐT/Zalo', 'Email', 'Loại người dùng', 'Ngày'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {downloads.map((d, i) => (
                  <tr key={d.id || i} style={{ background: i % 2 === 0 ? '#fff' : '#f8faff' }}>
                    <td style={{ ...tdStyle, color: '#94a3b8' }}>{i + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{d.full_name || d.name || '—'}</td>
                    <td style={tdStyle}>{d.phone || d.zalo || '—'}</td>
                    <td style={tdStyle}>{d.email || '—'}</td>
                    <td style={tdStyle}>{d.user_type || d.type || '—'}</td>
                    <td style={{ ...tdStyle, fontSize: 11, color: '#94a3b8' }}>
                      {d.created_at ? new Date(d.created_at).toLocaleDateString('vi-VN') : '—'}
                    </td>
                  </tr>
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

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const MENU = [
  { id: 'overview', icon: '📊', label: 'Tổng quan' },
  { id: 'customers', icon: '👥', label: 'Khách hàng' },
  { id: 'check-key', icon: '🔑', label: 'Kiểm tra Key' },
  { id: 'affiliate', icon: '🤝', label: 'Affiliate' },
  { id: 'tickets', icon: '🎫', label: 'Tickets' },
  { id: 'downloads', icon: '📥', label: 'Yêu cầu tải' },
  { id: 'pixels', icon: '📈', label: 'Tracking Pixels' },
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
        {MENU.map(item => {
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
                padding: '11px 20px',
                background: isActive ? 'rgba(0,199,222,0.12)' : 'transparent',
                borderLeft: isActive ? '3px solid #00c7de' : '3px solid transparent',
                border: 'none',
                borderRadius: 0,
                color: isActive ? '#00c7de' : 'rgba(255,255,255,0.6)',
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'transparent' } }}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
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
  const [activeTab, setActiveTab] = useState('customers')
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
    'overview': <OverviewTab />,
    'customers': <CustomersTab />,
    'check-key': <CheckKeyTab />,
    'affiliate': <AffiliateTab />,
    'tickets': <TicketsTab />,
    'downloads': <DownloadsTab />,
    'pixels': <PixelsTab />,
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
