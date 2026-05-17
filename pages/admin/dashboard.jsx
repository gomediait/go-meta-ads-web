import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { checkAdminAuth, adminLogout } from '../../lib/adminAuth'

const API = 'https://go-meta-ads-backend.vercel.app'

// ─── HELPERS ──────────────────────────────────────────────────────────────────
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
    pending:     { bg: '#fef9c3', color: '#92400e', label: 'Chờ xử lý' },
    confirmed:   { bg: '#dcfce7', color: '#14532d', label: 'Đã xác nhận' },
    cancelled:   { bg: '#fee2e2', color: '#7f1d1d', label: 'Đã huỷ' },
    open:        { bg: '#dbeafe', color: '#1e3a8a', label: 'Mở' },
    in_progress: { bg: '#fef9c3', color: '#92400e', label: 'Đang xử lý' },
    resolved:    { bg: '#dcfce7', color: '#14532d', label: 'Đã giải quyết' },
    active:      { bg: '#dcfce7', color: '#14532d', label: 'Hoạt động' },
    inactive:    { bg: '#f1f5f9', color: '#475569', label: 'Không hoạt động' },
  }
  const s = map[status] || { bg: '#f1f5f9', color: '#475569', label: status }
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
      background: s.bg,
      color: s.color,
    }}>
      {s.label}
    </span>
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

function LoadingSpinner() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
      <div style={{
        display: 'inline-block',
        width: 36,
        height: 36,
        border: '3px solid #e2e8f0',
        borderTop: '3px solid #00c7de',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ marginTop: 12, fontSize: 14 }}>Đang tải...</p>
    </div>
  )
}

// ─── OVERVIEW TAB ──────────────────────────────────────────────────────────────
function OverviewTab() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [orderRes, downloadRes] = await Promise.allSettled([
          apiPost('/api/order', { action: 'list', limit: 1000 }),
          apiPost('/api/download', { action: 'list', limit: 1000 }),
        ])

        const orders = orderRes.status === 'fulfilled'
          ? (orderRes.value?.orders || orderRes.value?.data || [])
          : []
        const downloads = downloadRes.status === 'fulfilled'
          ? (downloadRes.value?.downloads || downloadRes.value?.data || [])
          : []

        const today = new Date().toISOString().slice(0, 10)
        const dlToday = downloads.filter(d =>
          d.created_at && d.created_at.slice(0, 10) === today
        ).length

        const activeKeys = orders.filter(o =>
          o.status === 'confirmed' && o.license_key
        ).length

        setStats({
          total: orders.length,
          pending: orders.filter(o => o.status === 'pending').length,
          activeKeys,
          dlToday,
        })
      } catch (e) {
        setError('Không thể tải dữ liệu: ' + e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const cards = [
    { label: 'Tổng đơn hàng', value: stats?.total ?? '—', icon: '📦', color: '#00c7de' },
    { label: 'Đơn chờ xử lý', value: stats?.pending ?? '—', icon: '⏳', color: '#fe5f01' },
    { label: 'Key đang hoạt động', value: stats?.activeKeys ?? '—', icon: '🔑', color: '#10b981' },
    { label: 'Yêu cầu tải hôm nay', value: stats?.dlToday ?? '—', icon: '📥', color: '#8b5cf6' },
  ]

  return (
    <div>
      <h2 style={{ color: '#1a2332', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
        📊 Tổng quan hệ thống
      </h2>
      <ErrorBox msg={error} />
      {loading ? <LoadingSpinner /> : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 20,
          maxWidth: 700,
        }}>
          {cards.map(c => (
            <div key={c.label} style={{
              background: '#ffffff',
              borderRadius: 14,
              padding: '24px 28px',
              boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
              borderLeft: `4px solid ${c.color}`,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}>
              <span style={{ fontSize: 36 }}>{c.icon}</span>
              <div>
                <div style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>{c.label}</div>
                <div style={{
                  color: '#1a2332',
                  fontSize: 32,
                  fontWeight: 800,
                  lineHeight: 1.2,
                  marginTop: 2,
                }}>
                  {c.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ORDERS TAB ────────────────────────────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [keyInputs, setKeyInputs] = useState({})
  const [actionLoading, setActionLoading] = useState({})

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiPost('/api/order', { action: 'list', limit: 100 })
      setOrders(res?.orders || res?.data || [])
    } catch (e) {
      setError('Không tải được đơn hàng: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadOrders() }, [loadOrders])

  const handleConfirm = async (id) => {
    setActionLoading(p => ({ ...p, [id + '_confirm']: true }))
    try {
      await apiPost('/api/order', { action: 'update', id, status: 'confirmed' })
      await loadOrders()
    } catch (e) {
      setError('Lỗi xác nhận: ' + e.message)
    } finally {
      setActionLoading(p => ({ ...p, [id + '_confirm']: false }))
    }
  }

  const handleSetKey = async (id) => {
    const key = keyInputs[id]
    if (!key) return
    setActionLoading(p => ({ ...p, [id + '_key']: true }))
    try {
      await apiPost('/api/order', { action: 'update', id, license_key: key })
      setKeyInputs(p => ({ ...p, [id]: '' }))
      await loadOrders()
    } catch (e) {
      setError('Lỗi nhập key: ' + e.message)
    } finally {
      setActionLoading(p => ({ ...p, [id + '_key']: false }))
    }
  }

  const handleExport = async () => {
    try {
      const res = await fetch(`${API}/api/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export' }),
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `orders_${new Date().toISOString().slice(0,10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError('Lỗi export: ' + e.message)
    }
  }

  const displayed = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ color: '#1a2332', fontSize: 20, fontWeight: 700, margin: 0 }}>
          📦 Quản lý đơn hàng
        </h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {['all', 'pending', 'confirmed', 'cancelled'].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: `1.5px solid ${filter === s ? '#00c7de' : '#e2e8f0'}`,
              background: filter === s ? '#00c7de' : '#ffffff',
              color: filter === s ? '#ffffff' : '#475569',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}>
              {s === 'all' ? 'Tất cả' : s === 'pending' ? 'Chờ xử lý' : s === 'confirmed' ? 'Đã xác nhận' : 'Đã huỷ'}
            </button>
          ))}
          <button onClick={handleExport} style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: '1.5px solid #10b981',
            background: '#10b981',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}>
            📤 Export CSV
          </button>
          <button onClick={loadOrders} style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: '1.5px solid #e2e8f0',
            background: '#fff',
            color: '#475569',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}>
            🔄 Làm mới
          </button>
        </div>
      </div>

      <ErrorBox msg={error} />

      {loading ? <LoadingSpinner /> : (
        <div style={{ overflowX: 'auto', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000, background: '#fff' }}>
            <thead>
              <tr style={{ background: '#0c2a72' }}>
                {['STT', 'Khách hàng', 'SĐT', 'Email', 'Gói', 'Giá', 'Nội dung CK', 'Trạng thái', 'Key cấp', 'Ngày', 'Thao tác'].map(h => (
                  <th key={h} style={{
                    padding: '11px 12px',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 700,
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 }}>
                    Không có đơn hàng nào
                  </td>
                </tr>
              ) : displayed.map((o, i) => (
                <tr key={o.id || i} style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 13 }}>{i + 1}</td>
                  <td style={{ padding: '10px 12px', color: '#1a2332', fontSize: 13, fontWeight: 600 }}>
                    {o.name || o.customer_name || '—'}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#1a2332', fontSize: 13 }}>{o.phone || '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#1a2332', fontSize: 13 }}>{o.email || '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#1a2332', fontSize: 13 }}>
                    <span style={{
                      background: '#eff6ff',
                      color: '#1e40af',
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      {o.plan || o.package || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#1a2332', fontSize: 13, whiteSpace: 'nowrap' }}>
                    {o.price ? Number(o.price).toLocaleString('vi-VN') + 'đ' : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 12, maxWidth: 160 }}>
                    <span title={o.transfer_content || ''} style={{
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 140,
                    }}>
                      {o.transfer_content || o.content || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <Badge status={o.status} />
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12 }}>
                    {o.license_key ? (
                      <span style={{ color: '#059669', fontFamily: 'monospace', fontWeight: 600, fontSize: 11 }}>
                        {o.license_key}
                      </span>
                    ) : (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <input
                          value={keyInputs[o.id] || ''}
                          onChange={e => setKeyInputs(p => ({ ...p, [o.id]: e.target.value }))}
                          placeholder="Nhập key..."
                          style={{
                            padding: '4px 8px',
                            border: '1px solid #e2e8f0',
                            borderRadius: 6,
                            fontSize: 12,
                            width: 110,
                            fontFamily: 'inherit',
                          }}
                        />
                        <button
                          onClick={() => handleSetKey(o.id)}
                          disabled={actionLoading[o.id + '_key']}
                          style={{
                            padding: '4px 8px',
                            background: '#00c7de',
                            border: 'none',
                            borderRadius: 6,
                            color: '#fff',
                            fontSize: 12,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          {actionLoading[o.id + '_key'] ? '...' : 'Lưu'}
                        </button>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {o.created_at ? new Date(o.created_at).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {o.status === 'pending' && (
                      <button
                        onClick={() => handleConfirm(o.id)}
                        disabled={actionLoading[o.id + '_confirm']}
                        style={{
                          padding: '5px 12px',
                          background: '#10b981',
                          border: 'none',
                          borderRadius: 6,
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          fontFamily: 'inherit',
                        }}
                      >
                        {actionLoading[o.id + '_confirm'] ? '...' : '✅ Xác nhận'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 10 }}>
        Hiển thị {displayed.length} / {orders.length} đơn hàng
      </p>
    </div>
  )
}

// ─── KEYS TAB ──────────────────────────────────────────────────────────────────
function KeysTab() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', shop_code: '', plan: 'personal', expires_at: '' })
  const [lookupKey, setLookupKey] = useState('')
  const [keyInfo, setKeyInfo] = useState(null)
  const [lookupError, setLookupError] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createMsg, setCreateMsg] = useState('')
  const [createError, setCreateError] = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateMsg('')
    setCreateError('')
    try {
      const res = await apiPost('/api/license', { action: 'create_admin', ...form })
      setCreateMsg('✅ Tạo key thành công! ' + (res?.key || res?.license_key || ''))
      setForm({ name: '', phone: '', email: '', shop_code: '', plan: 'personal', expires_at: '' })
    } catch (e) {
      setCreateError('Lỗi tạo key: ' + e.message + ' (endpoint create_admin sẽ được bổ sung sau)')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleLookup = async (e) => {
    e.preventDefault()
    if (!lookupKey.trim()) return
    setLookupLoading(true)
    setLookupError('')
    setKeyInfo(null)
    try {
      const res = await apiPost('/api/license', { action: 'lookup', key: lookupKey.trim() })
      setKeyInfo(res?.data || res?.license || res)
    } catch (e) {
      setLookupError('Không tìm thấy key hoặc lỗi: ' + e.message)
    } finally {
      setLookupLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    border: '1.5px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 14,
    color: '#1a2332',
    background: '#fff',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    outline: 'none',
  }

  return (
    <div>
      <h2 style={{ color: '#1a2332', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
        🔑 Quản lý Key
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Create Key Form */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ color: '#1a2332', fontSize: 16, fontWeight: 700, marginBottom: 20, marginTop: 0 }}>
            ➕ Tạo key mới
          </h3>

          {createMsg && (
            <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', color: '#14532d', fontSize: 13, marginBottom: 14 }}>
              {createMsg}
            </div>
          )}
          <ErrorBox msg={createError} />

          <form onSubmit={handleCreate}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Họ tên', key: 'name', placeholder: 'Nguyễn Văn A' },
                { label: 'SĐT', key: 'phone', placeholder: '09xxxxxxxx' },
                { label: 'Email', key: 'email', placeholder: 'email@example.com', type: 'email' },
                { label: 'Shop Code (viết tắt)', key: 'shop_code', placeholder: 'VD: SHOPNVA' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', color: '#475569', fontSize: 12, fontWeight: 600, marginBottom: 5, textTransform: 'uppercase' }}>
                    {f.label}
                  </label>
                  <input
                    type={f.type || 'text'}
                    value={form[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    required
                    style={inputStyle}
                  />
                </div>
              ))}

              <div>
                <label style={{ display: 'block', color: '#475569', fontSize: 12, fontWeight: 600, marginBottom: 5, textTransform: 'uppercase' }}>
                  Gói
                </label>
                <select
                  value={form.plan}
                  onChange={e => setForm(p => ({ ...p, plan: e.target.value }))}
                  style={{ ...inputStyle }}
                >
                  <option value="personal">Personal</option>
                  <option value="business">Business</option>
                  <option value="agency">Agency</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#475569', fontSize: 12, fontWeight: 600, marginBottom: 5, textTransform: 'uppercase' }}>
                  Ngày hết hạn
                </label>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))}
                  required
                  style={inputStyle}
                />
              </div>

              <button
                type="submit"
                disabled={createLoading}
                style={{
                  padding: '11px',
                  background: 'linear-gradient(135deg, #00c7de, #0099aa)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: createLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 4px 12px rgba(0,199,222,0.3)',
                }}
              >
                {createLoading ? '⏳ Đang tạo...' : '🔑 Tạo key'}
              </button>
            </div>
          </form>
        </div>

        {/* Key Lookup */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ color: '#1a2332', fontSize: 16, fontWeight: 700, marginBottom: 20, marginTop: 0 }}>
            🔍 Tra cứu key
          </h3>

          <form onSubmit={handleLookup} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <input
              value={lookupKey}
              onChange={e => setLookupKey(e.target.value)}
              placeholder="Nhập license key..."
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              type="submit"
              disabled={lookupLoading}
              style={{
                padding: '9px 16px',
                background: '#00c7de',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: lookupLoading ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                fontFamily: 'inherit',
              }}
            >
              {lookupLoading ? '...' : 'Tra cứu'}
            </button>
          </form>

          <ErrorBox msg={lookupError} />

          {keyInfo && (
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['Key', keyInfo.key || keyInfo.license_key],
                  ['Họ tên', keyInfo.name || keyInfo.customer_name],
                  ['SĐT', keyInfo.phone],
                  ['Email', keyInfo.email],
                  ['Gói', keyInfo.plan || keyInfo.package],
                  ['Hết hạn', keyInfo.expires_at ? new Date(keyInfo.expires_at).toLocaleDateString('vi-VN') : null],
                  ['Trạng thái', keyInfo.status],
                  ['Shop Code', keyInfo.shop_code],
                ].map(([label, value]) => value ? (
                  <div key={label} style={{ display: 'flex', gap: 8 }}>
                    <span style={{ color: '#64748b', fontSize: 12, fontWeight: 600, minWidth: 90, textTransform: 'uppercase' }}>{label}:</span>
                    <span style={{ color: '#1a2332', fontSize: 13, fontFamily: label === 'Key' ? 'monospace' : 'inherit', fontWeight: label === 'Key' ? 700 : 400 }}>{value}</span>
                  </div>
                ) : null)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── AFFILIATE TAB ─────────────────────────────────────────────────────────────
function AffiliateTab() {
  const [affiliates, setAffiliates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState({})

  const loadAffiliates = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiPost('/api/affiliate', { action: 'list' })
      setAffiliates(res?.affiliates || res?.data || [])
    } catch (e) {
      setError('Không tải được danh sách affiliate: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAffiliates() }, [loadAffiliates])

  const handleAction = async (id, action) => {
    setActionLoading(p => ({ ...p, [id + '_' + action]: true }))
    try {
      await apiPost('/api/affiliate', { action: 'update', id, status: action === 'approve' ? 'active' : 'inactive' })
      await loadAffiliates()
    } catch (e) {
      setError('Lỗi: ' + e.message)
    } finally {
      setActionLoading(p => ({ ...p, [id + '_' + action]: false }))
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ color: '#1a2332', fontSize: 20, fontWeight: 700, margin: 0 }}>
          🤝 Quản lý Affiliate
        </h2>
        <button onClick={loadAffiliates} style={{
          padding: '6px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0',
          background: '#fff', color: '#475569', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          🔄 Làm mới
        </button>
      </div>

      <ErrorBox msg={error} />

      {loading ? <LoadingSpinner /> : (
        <div style={{ overflowX: 'auto', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900, background: '#fff' }}>
            <thead>
              <tr style={{ background: '#0c2a72' }}>
                {['Tên', 'SĐT', 'Email', 'Key', 'Mã referral', 'Ngân hàng', 'STK', 'Hoa hồng', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} style={{ padding: '11px 12px', color: '#fff', fontSize: 12, fontWeight: 700, textAlign: 'left', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {affiliates.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 }}>
                    Chưa có dữ liệu affiliate
                  </td>
                </tr>
              ) : affiliates.map((a, i) => (
                <tr key={a.id || i} style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ padding: '10px 12px', color: '#1a2332', fontSize: 13, fontWeight: 600 }}>{a.name || '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#1a2332', fontSize: 13 }}>{a.phone || '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#1a2332', fontSize: 13 }}>{a.email || '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#1a2332', fontSize: 11, fontFamily: 'monospace' }}>{a.license_key || a.key || '—'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ background: '#eff6ff', color: '#1e40af', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                      {a.referral_code || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#1a2332', fontSize: 13 }}>{a.bank_name || '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#1a2332', fontSize: 13 }}>{a.bank_account || '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#1a2332', fontSize: 13, fontWeight: 700 }}>
                    {a.total_commission ? Number(a.total_commission).toLocaleString('vi-VN') + 'đ' : '0đ'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <Badge status={a.status || 'inactive'} />
                  </td>
                  <td style={{ padding: '10px 12px', display: 'flex', gap: 6 }}>
                    {a.status !== 'active' && (
                      <button
                        onClick={() => handleAction(a.id, 'approve')}
                        disabled={actionLoading[a.id + '_approve']}
                        style={{ padding: '4px 10px', background: '#10b981', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        {actionLoading[a.id + '_approve'] ? '...' : '✅ Duyệt'}
                      </button>
                    )}
                    {a.status !== 'inactive' && (
                      <button
                        onClick={() => handleAction(a.id, 'reject')}
                        disabled={actionLoading[a.id + '_reject']}
                        style={{ padding: '4px 10px', background: '#ef4444', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        {actionLoading[a.id + '_reject'] ? '...' : '❌ Từ chối'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── TICKETS TAB ───────────────────────────────────────────────────────────────
function TicketsTab() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [actionLoading, setActionLoading] = useState({})

  const loadTickets = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiPost('/api/ticket', { action: 'list', limit: 50 })
      setTickets(res?.tickets || res?.data || [])
    } catch (e) {
      setError('Không tải được tickets: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTickets() }, [loadTickets])

  const nextStatus = { open: 'in_progress', in_progress: 'resolved' }

  const handleStatusUpdate = async (id, currentStatus) => {
    const ns = nextStatus[currentStatus]
    if (!ns) return
    setActionLoading(p => ({ ...p, [id]: true }))
    try {
      await apiPost('/api/ticket', { action: 'update', id, status: ns })
      await loadTickets()
    } catch (e) {
      setError('Lỗi cập nhật: ' + e.message)
    } finally {
      setActionLoading(p => ({ ...p, [id]: false }))
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ color: '#1a2332', fontSize: 20, fontWeight: 700, margin: 0 }}>
          🎫 Tickets hỗ trợ
        </h2>
        <button onClick={loadTickets} style={{
          padding: '6px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0',
          background: '#fff', color: '#475569', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          🔄 Làm mới
        </button>
      </div>

      <ErrorBox msg={error} />

      {/* Detail modal */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={() => setSelected(null)}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 28, maxWidth: 560, width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '80vh', overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: '#1a2332', margin: 0, fontSize: 17, fontWeight: 700 }}>Chi tiết Ticket #{selected.id}</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>
            {[
              ['Key', selected.license_key || selected.key],
              ['SĐT', selected.phone],
              ['Email', selected.email],
              ['Loại', selected.type || selected.category],
              ['Trạng thái', selected.status],
              ['Ngày tạo', selected.created_at ? new Date(selected.created_at).toLocaleString('vi-VN') : null],
            ].map(([label, value]) => value ? (
              <div key={label} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                <span style={{ color: '#64748b', fontSize: 12, fontWeight: 600, minWidth: 80, textTransform: 'uppercase', marginTop: 1 }}>{label}:</span>
                <span style={{ color: '#1a2332', fontSize: 14 }}>{value}</span>
              </div>
            ) : null)}
            <div style={{ marginTop: 16 }}>
              <div style={{ color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Mô tả:</div>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14, color: '#1a2332', fontSize: 14, lineHeight: 1.6 }}>
                {selected.description || selected.message || 'Không có mô tả'}
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? <LoadingSpinner /> : (
        <div style={{ overflowX: 'auto', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800, background: '#fff' }}>
            <thead>
              <tr style={{ background: '#0c2a72' }}>
                {['ID', 'Key', 'SĐT', 'Email', 'Loại', 'Mô tả', 'Trạng thái', 'Ngày', 'Thao tác'].map(h => (
                  <th key={h} style={{ padding: '11px 12px', color: '#fff', fontSize: 12, fontWeight: 700, textAlign: 'left', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 }}>
                    Không có tickets nào
                  </td>
                </tr>
              ) : tickets.map((t, i) => (
                <tr key={t.id || i}
                  style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc', cursor: 'pointer' }}
                  onClick={() => setSelected(t)}
                >
                  <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 12, fontFamily: 'monospace' }}>{t.id}</td>
                  <td style={{ padding: '10px 12px', color: '#1a2332', fontSize: 11, fontFamily: 'monospace' }}>{t.license_key || t.key || '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#1a2332', fontSize: 13 }}>{t.phone || '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#1a2332', fontSize: 13 }}>{t.email || '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#1a2332', fontSize: 13 }}>
                    <span style={{ background: '#f0f9ff', color: '#0369a1', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                      {t.type || t.category || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 12, maxWidth: 180 }}>
                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                      {t.description || t.message || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }} onClick={e => e.stopPropagation()}>
                    <Badge status={t.status || 'open'} />
                  </td>
                  <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {t.created_at ? new Date(t.created_at).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td style={{ padding: '10px 12px' }} onClick={e => e.stopPropagation()}>
                    {t.status !== 'resolved' && (
                      <button
                        onClick={() => handleStatusUpdate(t.id, t.status)}
                        disabled={actionLoading[t.id]}
                        style={{
                          padding: '4px 10px',
                          background: t.status === 'open' ? '#f59e0b' : '#10b981',
                          border: 'none',
                          borderRadius: 6,
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          fontFamily: 'inherit',
                        }}
                      >
                        {actionLoading[t.id] ? '...' : t.status === 'open' ? '▶ Xử lý' : '✅ Đóng'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 10 }}>Click vào hàng để xem chi tiết mô tả</p>
    </div>
  )
}

// ─── DOWNLOADS TAB ─────────────────────────────────────────────────────────────
function DownloadsTab() {
  const [downloads, setDownloads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDownloads = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiPost('/api/download', { action: 'list', limit: 100 })
      setDownloads(res?.downloads || res?.data || [])
    } catch (e) {
      setError('Không tải được dữ liệu: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadDownloads() }, [loadDownloads])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ color: '#1a2332', fontSize: 20, fontWeight: 700, margin: 0 }}>
          📥 Yêu cầu tải
        </h2>
        <button onClick={loadDownloads} style={{
          padding: '6px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0',
          background: '#fff', color: '#475569', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          🔄 Làm mới
        </button>
      </div>

      <ErrorBox msg={error} />

      {loading ? <LoadingSpinner /> : (
        <div style={{ overflowX: 'auto', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700, background: '#fff' }}>
            <thead>
              <tr style={{ background: '#0c2a72' }}>
                {['STT', 'Họ tên', 'SĐT / Zalo', 'Email', 'Loại người dùng', 'Ngày yêu cầu'].map(h => (
                  <th key={h} style={{ padding: '11px 12px', color: '#fff', fontSize: 12, fontWeight: 700, textAlign: 'left', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {downloads.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 }}>
                    Chưa có yêu cầu tải nào
                  </td>
                </tr>
              ) : downloads.map((d, i) => (
                <tr key={d.id || i} style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 13 }}>{i + 1}</td>
                  <td style={{ padding: '10px 12px', color: '#1a2332', fontSize: 13, fontWeight: 600 }}>{d.name || '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#1a2332', fontSize: 13 }}>{d.phone || d.zalo || '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#1a2332', fontSize: 13 }}>{d.email || '—'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      background: d.user_type === 'existing' ? '#eff6ff' : '#f0fdf4',
                      color: d.user_type === 'existing' ? '#1e40af' : '#166534',
                      padding: '2px 10px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      {d.user_type || d.type || 'Mới'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {d.created_at ? new Date(d.created_at).toLocaleString('vi-VN') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 10 }}>
        Tổng: {downloads.length} yêu cầu
      </p>
    </div>
  )
}

// ─── TRACKING PIXELS TAB ───────────────────────────────────────────────────────
function TrackingTab() {
  const [pixels, setPixels] = useState({
    fb_pixel: '',
    gtm_id: '',
    google_ads_id: '',
    tiktok_pixel: '',
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('gmap_tracking_pixels')
      if (stored) setPixels(JSON.parse(stored))
    } catch (e) {}
  }, [])

  const handleSave = () => {
    localStorage.setItem('gmap_tracking_pixels', JSON.stringify(pixels))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    border: '1.5px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 14,
    color: '#1a2332',
    background: '#fff',
    boxSizing: 'border-box',
    fontFamily: 'monospace',
    outline: 'none',
  }

  const fields = [
    { label: 'Facebook Pixel ID', key: 'fb_pixel', placeholder: '1234567890123456' },
    { label: 'Google Tag Manager ID', key: 'gtm_id', placeholder: 'GTM-XXXXXXX' },
    { label: 'Google Ads Conversion ID', key: 'google_ads_id', placeholder: 'AW-XXXXXXXXXX' },
    { label: 'TikTok Pixel ID', key: 'tiktok_pixel', placeholder: 'CXXXXXXXXXXXXXXXXX' },
  ]

  // NOTE: Pixel này chỉ được lưu vào localStorage như là tham chiếu.
  // Để inject thực sự vào website, cần copy các ID này vào pages/_document.jsx.
  // Dashboard này chỉ là giao diện ghi nhớ và quản lý các ID.

  return (
    <div>
      <h2 style={{ color: '#1a2332', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
        📈 Tracking Pixels
      </h2>

      {/* Important note */}
      <div style={{
        background: '#fef9c3',
        border: '1px solid #fde68a',
        borderRadius: 10,
        padding: '12px 16px',
        marginBottom: 24,
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 18 }}>⚠️</span>
        <div>
          <p style={{ margin: '0 0 4px', color: '#92400e', fontSize: 13, fontWeight: 700 }}>
            Lưu ý quan trọng
          </p>
          <p style={{ margin: 0, color: '#92400e', fontSize: 13, lineHeight: 1.5 }}>
            Các ID này được lưu vào <strong>localStorage</strong> để tham chiếu.
            Để pixel thực sự được inject vào toàn bộ website, bạn cần copy các ID vào file{' '}
            <code style={{ background: '#fef3c7', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace' }}>
              pages/_document.jsx
            </code>.
            Trang này chỉ là UI để ghi nhớ và quản lý các ID tracking.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 820 }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', gridColumn: '1 / -1' }}>
          <h3 style={{ color: '#1a2332', fontSize: 16, fontWeight: 700, marginBottom: 20, marginTop: 0 }}>
            Cấu hình Pixel IDs
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {fields.map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', color: '#475569', fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {f.label}
                </label>
                <input
                  value={pixels[f.key]}
                  onChange={e => setPixels(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              onClick={handleSave}
              style={{
                padding: '11px 24px',
                background: 'linear-gradient(135deg, #00c7de, #0099aa)',
                border: 'none',
                borderRadius: 10,
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 4px 12px rgba(0,199,222,0.3)',
              }}
            >
              💾 Lưu cài đặt
            </button>
            {saved && (
              <span style={{ color: '#10b981', fontSize: 14, fontWeight: 600 }}>
                ✅ Đã lưu!
              </span>
            )}
          </div>
        </div>

        {/* Code snippet reference */}
        <div style={{ background: '#1a2332', borderRadius: 14, padding: 24, gridColumn: '1 / -1' }}>
          <h3 style={{ color: '#00c7de', fontSize: 14, fontWeight: 700, marginBottom: 16, marginTop: 0, fontFamily: 'monospace' }}>
            // Code snippet — thêm vào pages/_document.jsx &gt; &lt;Head&gt;
          </h3>
          <pre style={{
            color: '#e2e8f0',
            fontSize: 12,
            lineHeight: 1.8,
            margin: 0,
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            overflowX: 'auto',
          }}>
{`{/* Facebook Pixel */}
{pixels.fb_pixel && (
  <>
    <script dangerouslySetInnerHTML={{ __html: \`
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){...}
      fbq('init', '${pixels.fb_pixel || 'FB_PIXEL_ID'}');
      fbq('track', 'PageView');
    \`}} />
    <noscript><img height="1" width="1" style="display:none"
      src="https://www.facebook.com/tr?id=${pixels.fb_pixel || 'FB_PIXEL_ID'}&ev=PageView&noscript=1"/>
    </noscript>
  </>
)}

{/* Google Tag Manager */}
{/* GTM ID: ${pixels.gtm_id || 'GTM-XXXXXXX'} */}
{/* Thêm script GTM vào _document.jsx theo hướng dẫn tại tagmanager.google.com */}

{/* Google Ads */}
{/* Conversion ID: ${pixels.google_ads_id || 'AW-XXXXXXXXXX'} */}

{/* TikTok Pixel */}
{/* Pixel ID: ${pixels.tiktok_pixel || 'TIKTOK_PIXEL_ID'} */}`}
          </pre>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN DASHBOARD ────────────────────────────────────────────────────────────
const MENU = [
  { key: 'overview',   label: 'Tổng quan',      icon: '📊' },
  { key: 'orders',     label: 'Đơn hàng',        icon: '📦' },
  { key: 'keys',       label: 'Quản lý Key',     icon: '🔑' },
  { key: 'affiliate',  label: 'Affiliate',        icon: '🤝' },
  { key: 'tickets',    label: 'Tickets hỗ trợ',  icon: '🎫' },
  { key: 'downloads',  label: 'Yêu cầu tải',     icon: '📥' },
  { key: 'tracking',   label: 'Tracking Pixels',  icon: '📈' },
]

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    if (!checkAdminAuth()) {
      router.replace('/admin')
    } else {
      setAuthChecked(true)
    }
  }, [])

  const handleLogout = () => {
    adminLogout()
    router.push('/admin')
  }

  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', background: '#000d1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#00c7de', fontSize: 18 }}>Đang xác thực...</div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard — Go Meta Ads Pro</title>
        <meta name="robots" content="noindex,nofollow" />
        <style>{`
          * { box-sizing: border-box; }
          body { margin: 0; font-family: Inter, 'Segoe UI', sans-serif; }
          @keyframes spin { to { transform: rotate(360deg); } }
          @media (max-width: 768px) {
            .sidebar { position: fixed !important; left: 0; top: 0; bottom: 0; z-index: 200; transform: translateX(-100%); transition: transform 0.25s; }
            .sidebar.open { transform: translateX(0) !important; }
            .content-area { margin-left: 0 !important; }
            .stat-grid { grid-template-columns: 1fr !important; }
            .form-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </Head>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
        {/* Sidebar */}
        <div
          className={`sidebar${sidebarOpen ? ' open' : ''}`}
          style={{
            width: 220,
            minWidth: 220,
            background: 'linear-gradient(180deg, #001428 0%, #001f3a 100%)',
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid rgba(0,199,222,0.15)',
            flexShrink: 0,
          }}
        >
          {/* Logo */}
          <div style={{
            padding: '24px 20px 20px',
            borderBottom: '1px solid rgba(0,199,222,0.12)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #00c7de, #0099aa)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                flexShrink: 0,
              }}>
                🛡️
              </div>
              <div>
                <div style={{ color: '#ffffff', fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>Go Meta Ads</div>
                <div style={{ color: '#00c7de', fontSize: 11, fontWeight: 600 }}>Admin Panel</div>
              </div>
            </div>
          </div>

          {/* Menu */}
          <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
            {MENU.map(item => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 12px',
                  marginBottom: 3,
                  borderRadius: 10,
                  border: 'none',
                  background: activeTab === item.key
                    ? 'linear-gradient(135deg, rgba(0,199,222,0.2), rgba(0,199,222,0.08))'
                    : 'transparent',
                  borderLeft: activeTab === item.key ? '3px solid #00c7de' : '3px solid transparent',
                  color: activeTab === item.key ? '#00c7de' : '#94a3b8',
                  fontSize: 13,
                  fontWeight: activeTab === item.key ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(0,199,222,0.12)' }}>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: 'none',
                background: 'rgba(254,95,1,0.1)',
                color: '#fe5f01',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                transition: 'background 0.15s',
              }}
            >
              <span style={{ fontSize: 16 }}>🚪</span>
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Content area */}
        <div
          className="content-area"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
          }}
        >
          {/* Top bar */}
          <div style={{
            background: '#ffffff',
            padding: '14px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                fontSize: 22,
                cursor: 'pointer',
                color: '#475569',
                padding: 0,
              }}
              className="hamburger"
            >
              ☰
            </button>
            <div>
              <h1 style={{ margin: 0, color: '#1a2332', fontSize: 17, fontWeight: 700 }}>
                {MENU.find(m => m.key === activeTab)?.icon} {MENU.find(m => m.key === activeTab)?.label}
              </h1>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
                Go Meta Ads Pro — Quản trị viên
              </p>
            </div>
          </div>

          {/* Main content */}
          <div style={{ flex: 1, padding: '28px 28px', overflowY: 'auto' }}>
            {activeTab === 'overview'  && <OverviewTab />}
            {activeTab === 'orders'    && <OrdersTab />}
            {activeTab === 'keys'      && <KeysTab />}
            {activeTab === 'affiliate' && <AffiliateTab />}
            {activeTab === 'tickets'   && <TicketsTab />}
            {activeTab === 'downloads' && <DownloadsTab />}
            {activeTab === 'tracking'  && <TrackingTab />}
          </div>
        </div>
      </div>
    </>
  )
}
