import { useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../lib/AuthContext'
import Link from 'next/link'
import { Settings2, User, Link2, CheckCircle2 } from 'lucide-react'

export default function Settings() {
  const { user, refreshUser } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleSaveName(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true); setMsg('')
    try {
      const r = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_name', name: name.trim() })
      })
      const d = await r.json()
      if (r.ok && d.ok) { await refreshUser(); setMsg('Đã cập nhật tên') }
      else setMsg('Lỗi: ' + (d.error || 'Không xác định'))
    } catch { setMsg('Lỗi kết nối') }
    finally { setSaving(false) }
  }

  const fbConnected = user?.fb_connected
  const expireDate = user?.expire_at ? new Date(user.expire_at).toLocaleDateString('vi-VN') : null

  return (
    <DashboardLayout title="Cài đặt">
      <div className="settings-page">
        <div className="page-header">
          <span className="ph-icon"><Settings2 size={22} /></span>
          <div>
            <h1>Cài đặt tài khoản</h1>
            <p>Quản lý thông tin cá nhân và kết nối</p>
          </div>
        </div>

        {/* Account info */}
        <div className="card">
          <div className="card-title"><User size={15} /> Thông tin tài khoản</div>

          <div className="info-row">
            <span className="ir-label">Email</span>
            <span className="ir-val">{user?.email}</span>
          </div>
          <div className="info-row">
            <span className="ir-label">Gói sử dụng</span>
            <span className="ir-val" style={{ fontWeight: 700, color: 'var(--primary)' }}>{user?.plan || 'trial'}</span>
          </div>
          {expireDate && (
            <div className="info-row">
              <span className="ir-label">Hết hạn</span>
              <span className="ir-val">{expireDate}</span>
            </div>
          )}

          <form className="name-form" onSubmit={handleSaveName}>
            <div className="field">
              <label>Họ và tên</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Tên của bạn" />
            </div>
            {msg && <div className={`msg ${msg.startsWith('Đã') ? 'ok' : 'err'}`}>{msg}</div>}
            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu tên'}
            </button>
          </form>
        </div>

        {/* Facebook connection */}
        <div className="card">
          <div className="card-title"><Link2 size={15} /> Kết nối Facebook Ads</div>

          {fbConnected ? (
            <div className="fb-connected">
              <div className="fbc-status"><CheckCircle2 size={14} style={{ verticalAlign: -2 }} /> Đã kết nối</div>
              {user?.fb_name && <div className="fbc-name">{user.fb_name}</div>}
              <Link href="/settings/connect-facebook" className="fbc-manage">Quản lý kết nối →</Link>
            </div>
          ) : (
            <div className="fb-disconnected">
              <div className="fbd-text">Chưa kết nối Facebook Ads. Kết nối để dùng đầy đủ tính năng.</div>
              <Link href="/settings/connect-facebook" className="fbc-btn"><Link2 size={13} style={{ verticalAlign: -2 }} /> Kết nối ngay</Link>
            </div>
          )}
        </div>

        {/* Upgrade */}
        {user?.plan === 'trial' && (
          <div className="card upgrade-card">
            <div className="uc-left">
              <div className="uc-title">Nâng cấp gói để mở khoá tính năng nâng cao</div>
              <div className="uc-desc">AI kiểm tra vi phạm, quản lý nhân viên, báo cáo chi tiết và nhiều hơn nữa.</div>
            </div>
            <Link href="/mua-goi" className="uc-btn">Xem gói →</Link>
          </div>
        )}
      </div>

      <style jsx>{`
        .settings-page { padding: 24px; max-width: 600px; margin: 0 auto; }
        .page-header { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }
        .ph-icon {
          width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(59,130,246,.1); color: var(--blue);
        }
        h1 { font-size: 18px; font-weight: 700; color: var(--txt); margin-bottom: 4px; }
        p  { font-size: 13px; color: var(--mut); }

        .card { background: var(--s1); border: 1px solid var(--bd); border-radius: 14px; padding: 18px; margin-bottom: 16px; }
        .card-title { font-size: 13px; font-weight: 700; color: var(--txt); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .card-title svg { color: var(--blue); }

        .info-row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid var(--bd); font-size: 13px; }
        .info-row:last-of-type { margin-bottom: 16px; }
        .ir-label { color: var(--mut); }
        .ir-val   { color: var(--txt); font-weight: 500; }

        .name-form .field { margin-bottom: 10px; }
        .name-form label { display: block; font-size: 12px; font-weight: 600; color: var(--mut); margin-bottom: 5px; text-transform: uppercase; letter-spacing: .4px; }
        .name-form input { width: 100%; background: var(--s2); border: 1.5px solid var(--bd); border-radius: 9px; padding: 10px 13px; font-size: 14px; color: var(--txt); outline: none; transition: border-color .15s; font-family: inherit; }
        .name-form input:focus { border-color: var(--primary); }
        .msg { font-size: 13px; margin-bottom: 10px; }
        .msg.ok  { color: var(--grn); }
        .msg.err { color: var(--red); }
        .save-btn { background: var(--s2); border: 1px solid var(--bd); border-radius: 9px; padding: 9px 18px; font-size: 13px; font-weight: 600; color: var(--txt); cursor: pointer; font-family: inherit; transition: all .15s; }
        .save-btn:hover { background: var(--s3); }
        .save-btn:disabled { opacity: .5; cursor: not-allowed; }

        .fb-connected { display: flex; align-items: center; gap: 12px; }
        .fbc-status { font-size: 13px; color: var(--grn); font-weight: 600; }
        .fbc-name   { font-size: 13px; color: var(--txt); flex: 1; }
        .fbc-manage { font-size: 13px; color: var(--blue); text-decoration: none; }
        .fbc-manage:hover { text-decoration: underline; }

        .fb-disconnected { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .fbd-text { font-size: 13px; color: var(--mut); }
        .fbc-btn { background: var(--blue); color: #fff; border-radius: 9px; padding: 8px 16px; font-size: 13px; font-weight: 700; text-decoration: none; white-space: nowrap; transition: opacity .15s; }
        .fbc-btn:hover { opacity: .88; }

        .upgrade-card { display: flex; align-items: center; gap: 16px; background: rgba(254,95,1,.06); border-color: rgba(254,95,1,.3); }
        .uc-left { flex: 1; }
        .uc-title { font-size: 14px; font-weight: 700; color: var(--txt); margin-bottom: 4px; }
        .uc-desc  { font-size: 12px; color: var(--mut); }
        .uc-btn { background: var(--primary); color: #fff; border-radius: 9px; padding: 9px 18px; font-size: 13px; font-weight: 700; text-decoration: none; white-space: nowrap; transition: opacity .15s; flex-shrink: 0; }
        .uc-btn:hover { opacity: .88; }
      `}</style>
    </DashboardLayout>
  )
}
