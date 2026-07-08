import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '../../components/AdminLayout'
import { Badge, Spinner, ErrorBox, CopyButton, EmptyState } from '../../components/AdminUI'
import { adminLocalFetch, apiPost } from '../../lib/adminUtils'



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
    color: 'var(--txt)',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  }
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--txt)', marginBottom: 6 }

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--txt)' }}>📧 Cài đặt Email / SMTP</h2>
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
                  <label className="form-label">SMTP Host</label>
                  <input
                    className="form-input"
                    value={form.host}
                    onChange={e => set('host', e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="form-label">Port</label>
                  <input
                    className="form-input"
                    type="number"
                    value={form.port}
                    onChange={e => set('port', e.target.value)}
                    placeholder="587"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Username / Email gửi</label>
                <input
                  className="form-input"
                  type="email"
                  value={form.username}
                  onChange={e => set('username', e.target.value)}
                  placeholder="youremail@gmail.com"
                />
              </div>

              <div>
                <label className="form-label">Password / App Password</label>
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
                      fontSize: 16, color: 'var(--mut)', fontFamily: 'inherit',
                    }}
                  >
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">Tên hiển thị (From Name)</label>
                <input
                  className="form-input"
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


export default function Page() {
  return (
    <AdminLayout title="Email / SMTP">
      <SMTPTab />
    </AdminLayout>
  )
}
