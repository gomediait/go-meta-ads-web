import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '../../components/AdminLayout'
import { Badge, Spinner, ErrorBox, CopyButton, EmptyState, AdminPageHeader, AdminCard, AdminButton, AdminInput } from '../../components/AdminUI'
import { MousePointerClick, Save } from 'lucide-react'
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

  if (loading) return <Spinner />

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', width: '100%' }}>
      <AdminPageHeader 
        title="Cấu hình Tracking Pixels" 
        icon={MousePointerClick} 
        description="Nhập ID và nhấn Lưu — pixels sẽ hoạt động ngay, không cần redeploy Vercel."
      />

      <AdminCard>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {FIELDS.map(f => (
            <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 190, fontSize: 13, fontWeight: 600, color: 'var(--txt)', flexShrink: 0 }}>{f.label}</span>
              <AdminInput
                placeholder={f.placeholder}
                value={values[f.key] || ''}
                onChange={e => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </AdminCard>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <AdminButton onClick={save} disabled={saving} icon={Save}>
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </AdminButton>
        {msg && (
          <span style={{ fontSize: 13, color: msg.startsWith('✓') ? '#059669' : '#dc2626', fontWeight: 600 }}>
            {msg}
          </span>
        )}
      </div>

      <div style={{ marginTop: 24, background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 10, padding: 16 }}>
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
