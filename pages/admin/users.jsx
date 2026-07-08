import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '../../components/AdminLayout'
import { Badge, Spinner, ErrorBox, CopyButton, EmptyState } from '../../components/AdminUI'
import { adminLocalFetch, apiPost, PLAN_OPTIONS, BILLING_OPTIONS } from '../../lib/adminUtils'

const PLAN_LABELS = { trial: 'Dùng thử', personal: 'Personal', business: 'Business', agency: 'Agency', 'ca-nhan': 'Cá nhân', 'doanh-nghiep': 'Doanh nghiệp' }
const PLAN_COLORS = { trial: '#64748b', personal: '#3b82f6', business: '#8b5cf6', agency: '#ec4899', 'ca-nhan': '#3b82f6', 'doanh-nghiep': '#8b5cf6' }


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
    color: 'var(--txt)',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  }
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--mut)', marginBottom: 4 }
  const fieldWrap = { display: 'flex', flexDirection: 'column' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--txt)' }}>
            {isNew ? '➕ Thêm khách hàng mới' : `✏️ Sửa đơn hàng #${order.id?.slice(0, 8) || '—'}`}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--mut)', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {error && <ErrorBox msg={error} />}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
            <div style={fieldWrap}>
              <label className="form-label">Họ tên *</label>
              <input className="form-input" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Nguyễn Văn A" />
            </div>
            <div style={fieldWrap}>
              <label className="form-label">Số điện thoại</label>
              <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0901234567" />
            </div>
            <div style={fieldWrap}>
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
            </div>
            <div style={fieldWrap}>
              <label className="form-label">Shop / Công ty</label>
              <input className="form-input" value={form.shop_name} onChange={e => set('shop_name', e.target.value)} placeholder="Tên shop hoặc công ty" />
            </div>
            <div style={fieldWrap}>
              <label className="form-label">Gói</label>
              <select className="form-input" value={form.plan_id} onChange={e => set('plan_id', e.target.value)}>
                {PLAN_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div style={fieldWrap}>
              <label className="form-label">Thời hạn</label>
              <select className="form-input" value={form.billing_tab} onChange={e => set('billing_tab', e.target.value)}>
                {BILLING_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
            <div style={fieldWrap}>
              <label className="form-label">Giá (VD: 390.000đ)</label>
              <input className="form-input" value={form.price_label} onChange={e => set('price_label', e.target.value)} placeholder="390.000đ" />
            </div>
            {/* Hiển thị extra info từ đơn hàng nếu có */}
            {!isNew && extraInfo.period_label && (
              <div style={{ gridColumn: '1/-1', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#065f46' }}>
                ℹ️ <b>Thông tin gói:</b> {extraInfo.period_label} · Tổng: {extraInfo.price_total?.toLocaleString('vi-VN')}đ · HH dự kiến: {extraInfo.expire_date_estimate}
              </div>
            )}
            <div style={fieldWrap}>
              <label className="form-label">Nội dung CK (tự tính)</label>
              <input style={{ ...inputStyle, background: '#f8faff', color: 'var(--mut)' }} value={ck} readOnly />
            </div>
            <div style={fieldWrap}>
              <label className="form-label">Mã giới thiệu</label>
              <input className="form-input" value={form.referral_code} onChange={e => set('referral_code', e.target.value)} placeholder="REF123" />
            </div>
            <div style={fieldWrap}>
              <label className="form-label">Trạng thái</label>
              <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="pending">Chờ xử lý</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
            <div style={{ ...fieldWrap, gridColumn: '1 / -1' }}>
              <label className="form-label">Key được cấp</label>
              <input className="form-input" value={form.license_key} onChange={e => set('license_key', e.target.value)} placeholder="GMAP-XXXX-XXXX-XXXX" />
            </div>
            {/* Ngày bắt đầu & kết thúc */}
            <div style={fieldWrap}>
              <label className="form-label">📅 Ngày bắt đầu kích hoạt</label>
              <input
                style={{ ...inputStyle, background: '#f8faff', color: 'var(--mut)', cursor: 'default' }}
                value={startDateStr ? new Date(startDateStr).toLocaleDateString('vi-VN') : '—'}
                readOnly
              />
              <span style={{ fontSize: 11, color: 'var(--mut)', marginTop: 3 }}>Tự động theo ngày tạo đơn</span>
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
              <label className="form-label">Ghi chú</label>
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
            style={{ padding: '9px 20px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8faff', color: 'var(--mut)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
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
    color: 'var(--txt)',
    background: '#fff',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  }
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--mut)', marginBottom: 4 }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--txt)' }}>
            🔑 Cấp key cho {order?.full_name || order?.name || '—'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--mut)' }}>✕</button>
        </div>

        <div style={{ padding: '18px 22px' }}>
          {/* Info */}
          {(() => {
            // Parse extra info từ note JSON
            let extra = {}
            try { extra = order?.note ? JSON.parse(order.note) : {} } catch(e) { extra = {} }
            return (
              <div style={{ background: '#f8faff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: 'var(--txt)' }}>
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
                <label className="form-label">Shop Code (max 6 ký tự, viết hoa)</label>
                <input
                  className="form-input"
                  value={shopCode}
                  onChange={e => setShopCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="SHOP01"
                />
              </div>
              <div>
                <label className="form-label">Gói</label>
                <select className="form-input" value={plan} onChange={e => setPlan(e.target.value)}>
                  <option value="personal">Personal</option>
                  <option value="business">Business</option>
                  <option value="agency">Agency</option>
                </select>
              </div>
              <div>
                <label className="form-label">Thời hạn</label>
                <select className="form-input" value={duration} onChange={e => setDuration(e.target.value)}>
                  <option value="thang">1 Tháng</option>
                  <option value="nam1">1 Năm</option>
                  <option value="nam3">3 Năm</option>
                  <option value="nam5">5 Năm</option>
                  <option value="custom">Tùy chọn ngày</option>
                </select>
              </div>
              {duration === 'custom' && (
                <div>
                  <label className="form-label">Ngày hết hạn tùy chọn</label>
                  <input className="form-input" type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} min={new Date().toISOString().slice(0,10)} />
                </div>
              )}

              {/* Hiển thị ngày hết hạn dự kiến */}
              {expirePreview && (
                <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--mut)', marginBottom: 3 }}>📅 Ngày kích hoạt hôm nay → Hết hạn:</div>
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
                <label className="form-label">🎲 Tạo key preview (chưa lưu)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={generatePreview} style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: 8, background: '#f0f9ff', color: '#0c2a72', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: '1.5px dashed #00c7de' }}>
                    🎲 Random key mới
                  </button>
                </div>
              </div>

              {/* Preview key */}
              {previewKey && (
                <div style={{ background: '#f0fdfe', border: '2px solid #00c7de', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, color: 'var(--mut)', marginBottom: 6 }}>Preview key (chưa lưu — có thể random lại):</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--blue)', letterSpacing: 1, wordBreak: 'break-all', marginBottom: 10 }}>
                    {previewKey}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={generatePreview} style={{ flex: 1, padding: '8px 0', border: '1px solid #e2e8f0', borderRadius: 7, background: '#fff', color: 'var(--mut)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
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
                <p style={{ fontSize: 11, color: 'var(--mut)', margin: '8px 0 0' }}>Đơn hàng đã chuyển sang Đã xác nhận</p>
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
          <button onClick={confirmedKey ? onDone : onClose} style={{ padding: '8px 18px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8faff', color: 'var(--mut)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
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
          <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--txt)' }}>Xác nhận xóa</h3>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--mut)' }}>
            Bạn có chắc muốn xóa đơn hàng của <b>{name || 'khách hàng này'}</b>? Hành động này không thể hoàn tác.
          </p>
        </div>
        {error && <ErrorBox msg={error} />}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={onClose}
            style={{ padding: '9px 22px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8faff', color: 'var(--mut)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
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
          background: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: '#fff', borderRadius: 10, padding: '12px 20px',
          fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,.25)',
        }}>{toast.msg}</div>
      )}

      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--txt)', marginBottom: 24 }}>
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
              <div style={{ fontSize: 12, color: 'var(--mut)', marginTop: 2 }}>{s.label}</div>
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
        <button onClick={load} style={{ ...inp, background: 'var(--blue)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '8px 18px' }}>
          🔄 Làm mới
        </button>
        <span style={{ fontSize: 13, color: 'var(--mut)' }}>{users.length} users</span>
      </div>

      {/* Table */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        {loading ? <Spinner /> : users.length === 0 ? <EmptyState icon="👤" text="Không có user nào" /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--bd)' }}>
                  {['Email', 'Tên', 'Gói', 'Hết hạn', 'Facebook', 'Tài khoản Ads', 'Đăng ký', 'Thao tác'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: 'var(--mut)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h}</th>
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
                          <button
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
                            style={{ background: 'rgba(0,199,222,0.1)', color: 'var(--blue)', border: '1px solid rgba(0,199,222,0.3)', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
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
