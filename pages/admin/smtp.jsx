import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { Spinner, AdminPageHeader, AdminCard, AdminButton, AdminInput } from '../../components/AdminUI'
import { Mail, Eye, EyeOff, Save, Check, RotateCcw } from 'lucide-react'
import { apiPost } from '../../lib/adminUtils'

function SMTPTab() {
  const [form, setForm] = useState({
    host: '',
    port: 587,
    username: '',
    password: '',
    from_email: '',
    from_name: 'Go Meta Ads Pro',
  })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    async function fetchSmtp() {
      setLoading(true)
      try {
        const res = await apiPost('/api/ticket', { action: 'smtp_get' })
        if (res?.smtp) {
          setForm({
            host: res.smtp.host || '',
            port: res.smtp.port || 587,
            username: res.smtp.username || '',
            password: res.smtp.password || '',
            from_email: res.smtp.from_email || '',
            from_name: res.smtp.from_name || 'Go Meta Ads Pro',
          })
        }
      } catch {} finally {
        setLoading(false)
      }
    }
    fetchSmtp()
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSave() {
    if (!form.host || !form.username || !form.password) {
      showToast('Vui lòng điền đầy đủ thông tin', 'error')
      return
    }
    setSaving(true)
    try {
      const res = await apiPost('/api/ticket', { action: 'smtp_save', ...form })
      if (res?.ok) showToast('Đã lưu cấu hình thành công')
      else showToast(res?.error || 'Lưu thất bại', 'error')
    } catch (e) {
      showToast('Lỗi hệ thống', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    setTesting(true)
    try {
      const res = await apiPost('/api/ticket', { action: 'smtp_test' })
      if (res?.ok) showToast('Gửi mail test thành công!')
      else showToast(res?.error || 'Gửi mail thất bại', 'error')
    } catch (e) {
      showToast('Lỗi hệ thống', 'error')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', width: '100%' }}>
      {toast && <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.type === 'error' ? 'var(--red)' : 'var(--grn)', color: '#fff', borderRadius: 10, padding: '12px 20px', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,.25)' }}>{toast.msg}</div>}

      <AdminPageHeader title="Cài đặt Email (SMTP)" icon={Mail} />

      {loading ? <Spinner /> : (
        <AdminCard>
          <div style={{ marginBottom: 24, fontSize: 13, color: 'var(--mut)', background: 'var(--s2)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--bd)' }}>
            <strong>Ghi chú:</strong> Hệ thống sử dụng SMTP để gửi mail xác nhận đăng ký, reset mật khẩu, và thông báo. Bạn có thể sử dụng Gmail, SendGrid, Amazon SES...
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 16, marginBottom: 16 }}>
            <div>
              <label className="form-label">Máy chủ (Host)</label>
              <AdminInput name="host" value={form.host} onChange={handleChange} placeholder="smtp.gmail.com" />
            </div>
            <div>
              <label className="form-label">Cổng (Port)</label>
              <AdminInput type="number" name="port" value={form.port} onChange={handleChange} placeholder="465" />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Tài khoản (Username)</label>
            <AdminInput name="username" value={form.username} onChange={handleChange} placeholder="email@domain.com" />
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Mật khẩu (Password / App Password)</label>
            <div style={{ position: 'relative' }}>
              <AdminInput type={showPwd ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder="••••••••" style={{ paddingRight: 40 }} />
              <button onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mut)', padding: 4 }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <AdminButton onClick={handleSave} disabled={saving} icon={Save}>
              {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
            </AdminButton>
            <AdminButton variant="outline" onClick={handleTest} disabled={testing} icon={testing ? RotateCcw : Check}>
              {testing ? 'Đang test...' : 'Test gửi mail'}
            </AdminButton>
          </div>
        </AdminCard>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <AdminLayout title="Email / SMTP">
      <SMTPTab />
    </AdminLayout>
  )
}
