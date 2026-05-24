import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../lib/AuthContext'
import { isPlanAllowed } from '../../lib/planLimits'

function PlanGate({ feature }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Tính năng này yêu cầu nâng cấp gói</h2>
      <p style={{ color: 'var(--mut)', marginBottom: 24, maxWidth: 400 }}>
        {feature} chỉ dành cho gói <strong>Personal</strong> trở lên. Nâng cấp ngay để sử dụng đầy đủ tính năng.
      </p>
      <Link href="/mua-goi" style={{ background: '#fe5f01', color: '#fff', padding: '12px 28px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
        Nâng cấp ngay →
      </Link>
    </div>
  )
}

const DEFAULTS = {
  enabled: false,
  pause_at: '22:00',
  resume_at: '06:00',
  sp_filter: '',
  last_pause_run: null,
  last_resume_run: null
}

export default function AutoCare() {
  const { user } = useAuth()
  const fbConnected = user?.fb_connected

  const [settings, setSettings] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!fbConnected) { setLoading(false); return }
    fetch('/api/fb/autocare')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.ok) setSettings({ ...DEFAULTS, ...d.settings }) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [fbConnected])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/fb/autocare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', ...settings })
      })
      const d = await res.json()
      if (d.ok) showToast('Đã lưu cài đặt thành công')
      else showToast(d.error || 'Lỗi lưu cài đặt', 'error')
    } catch (err) {
      showToast('Lỗi kết nối', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleRunNow() {
    setRunning(true)
    setRunResult(null)
    try {
      const res = await fetch('/api/fb/autocare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run' })
      })
      const d = await res.json()
      if (d.ok) {
        setRunResult(d)
        showToast(`Đã thực hiện: ${d.action || 'không có hành động'} — ${d.changed || 0} chiến dịch`)
        // Refresh settings to update last run time
        const r2 = await fetch('/api/fb/autocare')
        const d2 = await r2.json()
        if (d2?.ok) setSettings(prev => ({ ...prev, ...d2.settings }))
      } else {
        showToast(d.error || 'Lỗi chạy Auto Care', 'error')
      }
    } catch (err) {
      showToast('Lỗi kết nối', 'error')
    } finally {
      setRunning(false)
    }
  }

  function set(key, val) {
    setSettings(s => ({ ...s, [key]: val }))
  }

  function fmtDate(str) {
    if (!str) return 'Chưa chạy'
    return new Date(str).toLocaleDateString('vi-VN')
  }

  if (!isPlanAllowed(user?.plan, 'autocare')) {
    return <DashboardLayout title="Auto Care"><PlanGate feature="Auto Care" /></DashboardLayout>
  }

  return (
    <DashboardLayout title="Auto Care">
      <div className="page-wrap">

        {/* Toast */}
        {toast && (
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        )}

        <div className="page-header">
          <span className="page-icon">💚</span>
          <div>
            <h1>Auto Care — Giờ tắt quảng cáo</h1>
            <p>Tự động tạm dừng và khôi phục chiến dịch theo khung giờ</p>
          </div>
        </div>

        {!fbConnected ? (
          <div className="fb-required">
            <div className="fbr-icon">🔗</div>
            <div className="fbr-title">Cần kết nối Facebook Ads</div>
            <div className="fbr-desc">Tính năng Auto Care yêu cầu kết nối tài khoản Facebook Ads để tự động điều chỉnh chiến dịch.</div>
            <Link href="/settings/connect-facebook" className="fbr-btn">Kết nối ngay →</Link>
          </div>
        ) : loading ? (
          <div className="skel-block" />
        ) : (
          <div className="content">

            {/* Main settings card */}
            <div className="card">
              <div className="card-title">Cài đặt giờ nghỉ tự động</div>

              {/* Enable toggle */}
              <div className="field-row">
                <div className="field-info">
                  <div className="field-label">Bật Auto Care</div>
                  <div className="field-desc">Tự động tạm dừng chiến dịch vào giờ nghỉ và khởi động lại vào buổi sáng</div>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={e => set('enabled', e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>

              <div className={`settings-body${!settings.enabled ? ' disabled-area' : ''}`}>
                {/* Time pickers */}
                <div className="two-col">
                  <div className="field-group">
                    <label className="label">Giờ tạm dừng (Pause at)</label>
                    <input
                      type="time"
                      className="time-input"
                      value={settings.pause_at}
                      onChange={e => set('pause_at', e.target.value)}
                      disabled={!settings.enabled}
                    />
                    <div className="field-hint">Chiến dịch sẽ bị tạm dừng từ giờ này</div>
                  </div>

                  <div className="field-group">
                    <label className="label">Giờ khởi động lại (Resume at)</label>
                    <input
                      type="time"
                      className="time-input"
                      value={settings.resume_at}
                      onChange={e => set('resume_at', e.target.value)}
                      disabled={!settings.enabled}
                    />
                    <div className="field-hint">Chiến dịch sẽ được bật lại từ giờ này</div>
                  </div>
                </div>

                {/* Campaign filter */}
                <div className="field-group">
                  <label className="label">Lọc theo tên chiến dịch (tuỳ chọn)</label>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="Ví dụ: SP001 — chỉ tắt chiến dịch chứa tên này"
                    value={settings.sp_filter}
                    onChange={e => set('sp_filter', e.target.value)}
                    disabled={!settings.enabled}
                  />
                  <div className="field-hint">Để trống = áp dụng cho tất cả chiến dịch trong tài khoản đã chọn</div>
                </div>
              </div>

              {/* Save button */}
              <div className="card-footer">
                <button className="btn-save" onClick={handleSave} disabled={saving}>
                  {saving ? 'Đang lưu…' : 'Lưu cài đặt'}
                </button>
              </div>
            </div>

            {/* Status card */}
            <div className="card">
              <div className="card-title">Trạng thái & Chạy thủ công</div>

              <div className="status-grid">
                <div className="status-item">
                  <div className="status-label">Lần tạm dừng cuối</div>
                  <div className="status-value">{fmtDate(settings.last_pause_run)}</div>
                </div>
                <div className="status-item">
                  <div className="status-label">Lần khởi động lại cuối</div>
                  <div className="status-value">{fmtDate(settings.last_resume_run)}</div>
                </div>
                <div className="status-item">
                  <div className="status-label">Lịch chạy tiếp theo</div>
                  <div className="status-value">Mỗi 30 phút tự động kiểm tra</div>
                </div>
                <div className="status-item">
                  <div className="status-label">Múi giờ</div>
                  <div className="status-value">Việt Nam (UTC+7)</div>
                </div>
              </div>

              {runResult && (
                <div className="run-result">
                  Kết quả: <strong>{runResult.action || 'none'}</strong> —{' '}
                  đã {runResult.action === 'pause' ? 'tạm dừng' : 'bật lại'}{' '}
                  <strong>{runResult.changed || 0}</strong> chiến dịch
                </div>
              )}

              <div className="card-footer">
                <button className="btn-run" onClick={handleRunNow} disabled={running}>
                  {running ? 'Đang chạy…' : 'Chạy ngay'}
                </button>
                <div className="run-hint">Kiểm tra thời gian hiện tại và thực hiện pause/resume tương ứng</div>
              </div>
            </div>

            {/* Info card */}
            <div className="info-card">
              <div className="info-icon">ℹ️</div>
              <div className="info-body">
                <div className="info-title">Cách hoạt động</div>
                <div className="info-text">
                  Hệ thống tự động kiểm tra mỗi 30 phút. Nếu giờ hiện tại ≥ giờ tạm dừng và chưa tạm dừng hôm nay → tạm dừng tất cả chiến dịch.
                  Nếu giờ hiện tại ≥ giờ khởi động và chưa khởi động hôm nay → bật lại chiến dịch.
                  Mỗi hành động chỉ chạy 1 lần/ngày.
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      <style jsx>{`
        .page-wrap { padding: 24px; max-width: 800px; position: relative; }
        .page-header { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
        .page-icon { font-size: 32px; }
        h1 { font-size: 20px; font-weight: 700; color: var(--txt); margin-bottom: 4px; }
        p  { font-size: 13px; color: var(--mut); }

        /* Toast */
        .toast {
          position: fixed; top: 16px; right: 16px; z-index: 9999;
          max-width: 260px; padding: 9px 14px; border-radius: 8px;
          font-size: 12px; font-weight: 600; line-height: 1.4;
          box-shadow: 0 3px 12px rgba(0,0,0,.18); animation: slideIn .2s ease;
          pointer-events: none;
        }
        .toast-success { background: #10b981; color: #fff; }
        .toast-error   { background: #ef4444; color: #fff; }
        @keyframes slideIn { from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:translateX(0)} }

        /* FB Required */
        .fb-required {
          display: flex; flex-direction: column; align-items: center;
          background: var(--s1); border: 1px solid var(--bd); border-radius: 16px;
          padding: 48px 32px; text-align: center; gap: 12px;
        }
        .fbr-icon  { font-size: 40px; }
        .fbr-title { font-size: 16px; font-weight: 700; color: var(--txt); }
        .fbr-desc  { font-size: 13px; color: var(--mut); max-width: 380px; line-height: 1.6; }
        .fbr-btn {
          background: #1877f2; color: #fff; border-radius: 9px;
          padding: 10px 20px; font-size: 13px; font-weight: 700;
          text-decoration: none; margin-top: 8px; transition: opacity .15s;
        }
        .fbr-btn:hover { opacity: .88; }

        .skel-block {
          height: 300px; border-radius: 14px;
          background: linear-gradient(90deg, var(--s2) 25%, var(--s3) 50%, var(--s2) 75%);
          background-size: 200% 100%; animation: shimmer 1.2s infinite;
        }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .content { display: flex; flex-direction: column; gap: 16px; }

        .card {
          background: var(--s1); border: 1px solid var(--bd); border-radius: 14px; padding: 22px;
        }
        .card-title {
          font-size: 15px; font-weight: 700; color: var(--txt); margin-bottom: 20px;
          padding-bottom: 12px; border-bottom: 1px solid var(--bd);
        }

        .field-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; padding: 14px 0; border-bottom: 1px solid var(--bd);
        }
        .field-info { flex: 1; }
        .field-label { font-size: 14px; font-weight: 600; color: var(--txt); margin-bottom: 3px; }
        .field-desc  { font-size: 12px; color: var(--mut); line-height: 1.5; }

        /* Toggle switch */
        .toggle { position: relative; display: inline-block; width: 48px; height: 26px; flex-shrink: 0; }
        .toggle input { opacity: 0; width: 0; height: 0; }
        .slider {
          position: absolute; cursor: pointer; inset: 0;
          background: var(--s3); border-radius: 26px; transition: .25s;
        }
        .slider::before {
          content: ''; position: absolute;
          width: 20px; height: 20px; border-radius: 50%;
          left: 3px; bottom: 3px; background: #fff; transition: .25s;
        }
        input:checked + .slider { background: var(--grn); }
        input:checked + .slider::before { transform: translateX(22px); }

        .settings-body { margin-top: 20px; display: flex; flex-direction: column; gap: 20px; transition: opacity .2s; }
        .settings-body.disabled-area { opacity: .45; pointer-events: none; }

        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 600px) { .two-col { grid-template-columns: 1fr; } }

        .field-group { display: flex; flex-direction: column; gap: 6px; }
        .label { font-size: 13px; font-weight: 600; color: var(--txt); }
        .field-hint { font-size: 11px; color: var(--mut); }

        .time-input, .text-input {
          padding: 10px 14px; border-radius: 9px; border: 1px solid var(--bd);
          background: var(--s2); color: var(--txt); font-size: 14px;
          transition: border-color .15s;
          width: 100%;
        }
        .time-input:focus, .text-input:focus {
          outline: none; border-color: var(--primary);
        }
        .time-input:disabled, .text-input:disabled {
          opacity: .5; cursor: not-allowed;
        }

        .card-footer { margin-top: 22px; padding-top: 16px; border-top: 1px solid var(--bd); display: flex; align-items: center; gap: 14px; }

        .btn-save {
          background: var(--primary); color: #fff; border: none; border-radius: 9px;
          padding: 10px 24px; font-size: 14px; font-weight: 700; cursor: pointer;
          transition: opacity .15s;
        }
        .btn-save:hover:not(:disabled) { opacity: .88; }
        .btn-save:disabled { opacity: .6; cursor: default; }

        .btn-run {
          background: var(--blue); color: #fff; border: none; border-radius: 9px;
          padding: 10px 24px; font-size: 14px; font-weight: 700; cursor: pointer;
          transition: opacity .15s;
        }
        .btn-run:hover:not(:disabled) { opacity: .88; }
        .btn-run:disabled { opacity: .6; cursor: default; }
        .run-hint { font-size: 12px; color: var(--mut); }

        .status-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
        @media (max-width: 500px) { .status-grid { grid-template-columns: 1fr; } }

        .status-item {
          background: var(--s2); border-radius: 10px; padding: 12px 16px;
        }
        .status-label { font-size: 11px; color: var(--mut); font-weight: 600; text-transform: uppercase; letter-spacing: .3px; margin-bottom: 4px; }
        .status-value { font-size: 14px; font-weight: 600; color: var(--txt); }

        .run-result {
          margin-top: 14px; padding: 12px 16px;
          background: rgba(16,185,129,.1); border: 1px solid rgba(16,185,129,.25);
          border-radius: 9px; font-size: 13px; color: var(--txt);
        }

        /* Info card */
        .info-card {
          display: flex; gap: 14px; align-items: flex-start;
          background: rgba(59,130,246,.07); border: 1px solid rgba(59,130,246,.2);
          border-radius: 12px; padding: 16px;
        }
        .info-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
        .info-title { font-size: 13px; font-weight: 700; color: var(--txt); margin-bottom: 5px; }
        .info-text  { font-size: 12px; color: var(--mut); line-height: 1.7; }
      `}</style>
    </DashboardLayout>
  )
}
