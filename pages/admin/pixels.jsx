import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '../../components/AdminLayout'
import { Badge, Spinner, ErrorBox, CopyButton, EmptyState } from '../../components/AdminUI'
import { adminLocalFetch, apiPost } from '../../lib/adminUtils'



function PixelsTab() {
  const adminToken = typeof window !== 'undefined' ? atob(localStorage.getItem('gmap_admin_token') || '') : ''

  const FIELDS = [
    { key: 'fb_pixel_id',      label: 'Facebook Pixel ID',      placeholder: '123456789012345' },
    { key: 'gtm_id',           label: 'Google Tag Manager',     placeholder: 'GTM-XXXXXXX' },
    { key: 'ga4_id',           label: 'Google Analytics 4',     placeholder: 'G-XXXXXXXXXX' },
    { key: 'tiktok_pixel_id',  label: 'TikTok Pixel',           placeholder: 'CXXXXXXXXXXXXXXX' },
    { key: 'google_ads_id',    label: 'Google Ads Conversion',  placeholder: 'AW-XXXXXXXXXX' },
  ]

  const [values, setValues]   = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')

  useEffect(() => {
    fetch('/api/admin/site-settings')
      .then(r => r.json())
      .then(({ settings = {} }) => { setValues(settings); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify({ settings: values }),
      })
      const data = await res.json()
      setMsg(data.ok ? '✓ Đã lưu thành công! Pixels sẽ hoạt động ngay khi trang được tải lại.' : ('Lỗi: ' + data.error))
    } catch (e) {
      setMsg('Lỗi kết nối: ' + e.message)
    }
    setSaving(false)
    setTimeout(() => setMsg(''), 5000)
  }

  const inputStyle = {
    flex: 1, padding: '9px 12px', border: '1px solid #e2e8f0',
    borderRadius: 8, fontSize: 13, color: 'var(--txt)', fontFamily: 'monospace', outline: 'none',
  }

  if (loading) return <div style={{ color: 'var(--mut)', padding: 32 }}>Đang tải...</div>

  return (
    <div style={{ maxWidth: 700 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--txt)', marginBottom: 6 }}>📈 Cấu hình Tracking Pixels</h2>
      <p style={{ fontSize: 13, color: 'var(--mut)', marginBottom: 24 }}>
        Nhập ID và nhấn <b>Lưu</b> — pixels sẽ hoạt động ngay, không cần redeploy Vercel.
      </p>

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {FIELDS.map(f => (
            <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 190, fontSize: 13, fontWeight: 600, color: 'var(--txt)', flexShrink: 0 }}>{f.label}</span>
              <input
                className="form-input"
                placeholder={f.placeholder}
                value={values[f.key] || ''}
                onChange={e => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            padding: '10px 28px', border: 'none', borderRadius: 8,
            background: saving ? '#94a3b8' : '#0c2a72', color: '#fff',
            fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', transition: 'background 0.2s',
          }}
        >
          {saving ? 'Đang lưu...' : '💾 Lưu thay đổi'}
        </button>
        {msg && (
          <span style={{ fontSize: 13, color: msg.startsWith('✓') ? '#059669' : '#dc2626', fontWeight: 600 }}>
            {msg}
          </span>
        )}
      </div>

      <div style={{ marginTop: 24, background: '#f8faff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
        <p style={{ fontSize: 12, color: 'var(--mut)', margin: 0, lineHeight: 1.7 }}>
          <b>Lưu ý:</b> Pixels được inject tự động khi trang load — lưu từ đây là đủ, không cần thêm env vars vào Vercel.
          Để xoá 1 pixel, xoá trắng ô ID và nhấn Lưu.
        </p>
      </div>
    </div>
  )
}

// ─── AI KNOWLEDGE TAB ────────────────────────────────────────────────────────


export default function Page() {
  return (
    <AdminLayout title="Tracking Pixels">
      <PixelsTab />
    </AdminLayout>
  )
}
