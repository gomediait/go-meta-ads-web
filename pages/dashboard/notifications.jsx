import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import DashboardLayout from '../../components/DashboardLayout'
import RestrictedView from '../../components/RestrictedView'
import { useAuth } from '../../lib/AuthContext'
import { fetcher } from '../../lib/fetcher'
import { isPlanAllowed } from '../../lib/planLimits'
import { Bell, Lock, Link2, Send, MessageSquare, Clock, ShieldAlert, BarChart3, AlertTriangle, Save } from 'lucide-react'

function PlanGate({ feature }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: 40 }}>
      <div style={{ marginBottom: 16, color: 'var(--mut)' }}><Lock size={48} /></div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Tính năng này yêu cầu nâng cấp gói</h2>
      <p style={{ color: 'var(--mut)', marginBottom: 24, maxWidth: 400 }}>
        {feature} chỉ dành cho gói <strong>Personal</strong> trở lên. Nâng cấp ngay để sử dụng đầy đủ tính năng.
      </p>
      <Link href="/mua-goi" style={{ background: 'var(--primary)', color: '#fff', padding: '12px 28px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
        Nâng cấp ngay →
      </Link>
    </div>
  )
}

const HOUR_OPTIONS = Array.from({ length: 24 }).map((_, i) => ({
  value: i,
  label: `${String(i).padStart(2, '0')}:00`
}))

const DEFAULTS = {
  master_enabled: false,
  tg_enabled: false,
  tg_bot_token: '',
  tg_chat_id: '',
  lark_enabled: false,
  lark_url: '',
  noti_report: true,
  noti_audit: false,
  noti_critical: false,
  schedule_type: 'hours',
  schedule_value: '8,12,18'
}

export default function Notifications() {
  const { user } = useAuth()
  const fbConnected = user?.fb_connected

  const [settings, setSettings] = useState(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [testingTg, setTestingTg] = useState(false)
  const [testingLark, setTestingLark] = useState(false)
  const [toast, setToast] = useState(null)

  const settingsKey = fbConnected ? '/api/fb/notifications' : null
  const { isValidating: settingsValidating } = useSWR(settingsKey, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
    onSuccess: (d) => {
      if (d?.ok) setSettings({ ...DEFAULTS, ...d.settings })
    },
  })
  const loading = settingsValidating && settings === DEFAULTS

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  function set(key, val) {
    setSettings(s => ({ ...s, [key]: val }))
  }

  function toggleHour(hour) {
    const current = (settings.schedule_value || '').split(',').map(h => h.trim()).filter(Boolean).map(Number)
    const next = current.includes(hour)
      ? current.filter(h => h !== hour)
      : [...current, hour].sort((a, b) => a - b)
    set('schedule_value', next.join(','))
  }

  function isHourActive(hour) {
    return (settings.schedule_value || '').split(',').map(h => parseInt(h.trim())).includes(hour)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/fb/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', ...settings })
      })
      const d = await res.json()
      if (d.ok) showToast('Đã lưu cài đặt thông báo')
      else showToast(d.error || 'Lỗi lưu cài đặt', 'error')
    } catch {
      showToast('Lỗi kết nối', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleTestTelegram() {
    if (!settings.tg_chat_id) {
      showToast('Vui lòng nhập Chat ID', 'error')
      return
    }
    setTestingTg(true)
    try {
      const res = await fetch('/api/fb/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          tg_enabled: true,
          tg_chat_id: settings.tg_chat_id,
          lark_enabled: false
        })
      })
      const d = await res.json()
      if (d?.results?.telegram === 'success') showToast('Đã gửi tin nhắn test tới Telegram!')
      else showToast('Lỗi Telegram: ' + (d?.results?.telegram || 'unknown'), 'error')
    } catch {
      showToast('Lỗi kết nối', 'error')
    } finally {
      setTestingTg(false)
    }
  }

  async function handleTestLark() {
    if (!settings.lark_url) {
      showToast('Vui lòng nhập Webhook URL', 'error')
      return
    }
    setTestingLark(true)
    try {
      const res = await fetch('/api/fb/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          tg_enabled: false,
          lark_enabled: true,
          lark_url: settings.lark_url
        })
      })
      const d = await res.json()
      if (d?.results?.lark === 'success') showToast('Đã gửi tin nhắn test tới Lark/Feishu!')
      else showToast('Lỗi Lark: ' + (d?.results?.lark || 'unknown'), 'error')
    } catch {
      showToast('Lỗi kết nối', 'error')
    } finally {
      setTestingLark(false)
    }
  }

  const [testingReport, setTestingReport] = useState(false)
  async function handleTestReport() {
    setTestingReport(true)
    try {
      const res = await fetch('/api/cron/notify?test=true')
      const d = await res.json()
      if (d.ok && d.processed > 0) {
        showToast('Đã gửi báo cáo test thành công!')
      } else {
        showToast('Không thể gửi (có thể chưa có data ngày hôm nay hoặc chưa lưu settings)', 'error')
      }
    } catch {
      showToast('Lỗi kết nối', 'error')
    } finally {
      setTestingReport(false)
    }
  }

  const [testingMonitor, setTestingMonitor] = useState(false)
  async function handleTestMonitor() {
    setTestingMonitor(true)
    try {
      const res = await fetch('/api/cron/monitor?test=true')
      const d = await res.json()
      if (d.ok && d.processed > 0) {
        showToast('Đã gửi cảnh báo giả lập thành công!')
      } else {
        showToast('Không thể gửi (có thể chưa lưu settings bật thông báo)', 'error')
      }
    } catch {
      showToast('Lỗi kết nối', 'error')
    } finally {
      setTestingMonitor(false)
    }
  }

  if (!isPlanAllowed(user?.plan, 'notifications')) {
    return <DashboardLayout title="Thông báo tự động"><PlanGate feature="Thông báo tự động" /></DashboardLayout>
  }
  
  if (user?.role === 'viewer' || user?.role === 'manager') {
    return (
      <DashboardLayout title="Thông báo tự động">
        <RestrictedView requiredRole="Admin" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Thông báo tự động">
      <div className="page-wrap">

        {/* Toast */}
        {toast && (
          <div className={`local-toast toast-${toast.type}`} role="alert" aria-live="assertive">{toast.msg}</div>
        )}

        <div className="page-header">
          <span className="page-icon"><Bell size={28} /></span>
          <div>
            <h1>Thông báo tự động</h1>
            <p>Nhận báo cáo và cảnh báo qua Telegram hoặc Lark/Feishu</p>
          </div>
        </div>

        {!fbConnected ? (
          <div className="fb-required">
            <div className="fbr-icon"><Link2 size={36} /></div>
            <div className="fbr-title">Cần kết nối Facebook Ads</div>
            <div className="fbr-desc">Tính năng thông báo yêu cầu kết nối Facebook Ads để theo dõi và gửi báo cáo real-time.</div>
            <Link href="/settings/connect-facebook" className="fbr-btn">Kết nối ngay →</Link>
          </div>
        ) : loading ? (
          <div className="skel-block" />
        ) : (
          <div className="content">

            {/* Master toggle */}
            <div className="card">
              <div className="field-row">
                <div className="field-info">
                  <div className="field-label">Bật hệ thống thông báo</div>
                  <div className="field-desc">Khi tắt, tất cả thông báo sẽ không được gửi dù đã cài đặt</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" role="switch" aria-checked={settings.master_enabled} aria-label="Bật hệ thống thông báo" checked={settings.master_enabled} onChange={e => set('master_enabled', e.target.checked)} />
                  <span className="slider" />
                </label>
              </div>
            </div>

            {/* Telegram section */}
            <div className="card">
              <div className="section-header">
                <div className="section-icon tg-icon"><Send size={20} /></div>
                <div className="section-title">Telegram</div>
                <label className="toggle ml-auto">
                  <input type="checkbox" role="switch" aria-checked={settings.tg_enabled} aria-label="Bật Telegram" checked={settings.tg_enabled} onChange={e => set('tg_enabled', e.target.checked)} />
                  <span className="slider" />
                </label>
              </div>

              <div className={`section-body${!settings.tg_enabled ? ' disabled-area' : ''}`}>
                <div className="field-group">
                  <label className="label">Chat ID</label>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="-1001234567890"
                    value={settings.tg_chat_id}
                    onChange={e => set('tg_chat_id', e.target.value)}
                  />
                  <div className="field-hint">ID của group/channel hoặc ID cá nhân (lấy từ @userinfobot)</div>
                </div>

                <div className="test-row">
                  <button className="btn-test" onClick={handleTestTelegram} disabled={testingTg} aria-label="Gửi tin test Telegram">
                    {testingTg ? 'Đang gửi…' : 'Gửi tin test'}
                  </button>
                </div>
              </div>
            </div>

            {/* Lark section */}
            <div className="card">
              <div className="section-header">
                <div className="section-icon lk-icon"><MessageSquare size={20} /></div>
                <div className="section-title">Lark / Feishu</div>
                <label className="toggle ml-auto">
                  <input type="checkbox" role="switch" aria-checked={settings.lark_enabled} aria-label="Bật Lark / Feishu" checked={settings.lark_enabled} onChange={e => set('lark_enabled', e.target.checked)} />
                  <span className="slider" />
                </label>
              </div>

              <div className={`section-body${!settings.lark_enabled ? ' disabled-area' : ''}`}>
                <div className="field-group">
                  <label className="label">Webhook URL</label>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="https://open.larksuite.com/open-apis/bot/v2/hook/..."
                    value={settings.lark_url}
                    onChange={e => set('lark_url', e.target.value)}
                  />
                  <div className="field-hint">Lấy từ Lark Workspace → Custom Bot → Webhook URL</div>
                </div>

                <div className="test-row">
                  <button className="btn-test" onClick={handleTestLark} disabled={testingLark} aria-label="Gửi tin test Lark">
                    {testingLark ? 'Đang gửi…' : 'Gửi tin test'}
                  </button>
                </div>
              </div>
            </div>

            {/* Schedule section */}
            <div className="card">
              <div className="card-title">Lịch gửi báo cáo</div>
              <div className="field-desc" style={{ marginBottom: 14 }}>Chọn các khung giờ muốn nhận báo cáo mỗi ngày (giờ Việt Nam)</div>

              <div className="hours-row">
                {(() => {
                  const selectedList = (settings.schedule_value || '').split(',').map(h => h.trim()).filter(Boolean).map(Number).sort((a,b) => a - b)
                  const availableList = HOUR_OPTIONS.filter(h => !selectedList.includes(h.value))
                  return (
                    <>
                      {selectedList.map(h => (
                        <div key={h} className="hour-tag">
                          {String(h).padStart(2, '0')}:00
                          <button className="remove-hour" onClick={() => toggleHour(h)} aria-label="Xoá">×</button>
                        </div>
                      ))}
                      {availableList.length > 0 && (
                        <select 
                          className="add-hour-select"
                          value=""
                          onChange={(e) => {
                            if(e.target.value) toggleHour(Number(e.target.value))
                          }}
                        >
                          <option value="" disabled>+ Thêm giờ</option>
                          {availableList.map(h => (
                            <option key={h.value} value={h.value}>{h.label}</option>
                          ))}
                        </select>
                      )}
                    </>
                  )
                })()}
              </div>

              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--bd)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--mut)' }}>Bạn muốn xem form mẫu của báo cáo thực tế?</div>
                <button 
                  onClick={handleTestReport} 
                  disabled={testingReport} 
                  style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: 'var(--txt)', cursor: testingReport ? 'default' : 'pointer', opacity: testingReport ? 0.6 : 1 }}
                >
                  {testingReport ? 'Đang lấy data...' : 'Gửi Báo cáo ngay (Test)'}
                </button>
              </div>
            </div>

            {/* Alerts section */}
            <div className="card">
              <div className="card-title">Loại thông báo</div>

              <div className="alert-list">
                <div className="field-row">
                  <div className="field-info">
                    <div className="field-label">Báo cáo định kỳ</div>
                    <div className="field-desc">Gửi tổng kết chi phí, clicks, impressions theo lịch đã cài</div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" role="switch" aria-checked={settings.noti_report} aria-label="Báo cáo định kỳ" checked={settings.noti_report} onChange={e => set('noti_report', e.target.checked)} />
                    <span className="slider" />
                  </label>
                </div>

                <div className="field-row">
                  <div className="field-info">
                    <div className="field-label">Cảnh báo thay đổi trạng thái</div>
                    <div className="field-desc">Thông báo khi chiến dịch bị tắt/bật hoặc bị từ chối</div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" role="switch" aria-checked={settings.noti_audit} aria-label="Cảnh báo thay đổi trạng thái" checked={settings.noti_audit} onChange={e => set('noti_audit', e.target.checked)} />
                    <span className="slider" />
                  </label>
                </div>

                <div className="field-row" style={{ borderBottom: 'none' }}>
                  <div className="field-info">
                    <div className="field-label">Cảnh báo khẩn cấp</div>
                    <div className="field-desc">Thông báo khi ngân sách gần cạn hoặc CPM tăng đột biến</div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" role="switch" aria-checked={settings.noti_critical} aria-label="Cảnh báo khẩn cấp" checked={settings.noti_critical} onChange={e => set('noti_critical', e.target.checked)} />
                    <span className="slider" />
                  </label>
                </div>

                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--bd)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 13, color: 'var(--mut)' }}>Test thử cảnh báo rủi ro (Audit/Critical)?</div>
                  <button 
                    onClick={handleTestMonitor} 
                    disabled={testingMonitor} 
                    style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: 'var(--txt)', cursor: testingMonitor ? 'default' : 'pointer', opacity: testingMonitor ? 0.6 : 1 }}
                  >
                    {testingMonitor ? 'Đang gửi...' : 'Gửi Cảnh báo ngay (Test giả lập)'}
                  </button>
                </div>
              </div>
            </div>

            {/* Save button */}
            <div className="save-row">
              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? 'Đang lưu…' : 'Lưu tất cả cài đặt'}
              </button>
            </div>

          </div>
        )}
      </div>

      <style jsx>{`
        .page-wrap { padding: 24px; max-width: 720px; margin: 0 auto; position: relative; }
        .page-header { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
        .page-icon { color: var(--primary); display: flex; align-items: center; }
        h1 { font-size: 20px; font-weight: 700; color: var(--txt); margin-bottom: 4px; }
        p  { font-size: 13px; color: var(--mut); }

        /* Toast */
        .local-toast {
          position: fixed; top: 20px; right: 20px; z-index: 50;
          padding: 12px 20px; border-radius: 10px; font-size: 14px; font-weight: 600;
          box-shadow: 0 4px 20px rgba(0,0,0,.2); animation: slideIn .25s ease;
          max-width: 320px;
        }
        .toast-success { background: var(--green); color: #fff; }
        .toast-error   { background: var(--red); color: #fff; }
        @keyframes slideIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }

        /* FB Required */
        .fb-required {
          display: flex; flex-direction: column; align-items: center;
          background: var(--s1); border: 1px solid var(--bd); border-radius: 16px;
          padding: 48px 32px; text-align: center; gap: 12px;
        }
        .fbr-icon  { color: var(--mut); display: flex; align-items: center; justify-content: center; }
        .fbr-title { font-size: 16px; font-weight: 700; color: var(--txt); }
        .fbr-desc  { font-size: 13px; color: var(--mut); max-width: 380px; line-height: 1.6; }
        .fbr-btn {
          background: var(--blue); color: #fff; border-radius: 9px;
          padding: 10px 20px; font-size: 13px; font-weight: 700;
          text-decoration: none; margin-top: 8px; transition: opacity .15s;
        }
        .fbr-btn:hover { opacity: .88; }

        .skel-block {
          height: 400px; border-radius: 14px;
          background: linear-gradient(90deg, var(--s2) 25%, var(--s3) 50%, var(--s2) 75%);
          background-size: 200% 100%; animation: shimmer 1.2s infinite;
        }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .content { display: flex; flex-direction: column; gap: 14px; }

        .card {
          background: var(--s1); border: 1px solid var(--bd); border-radius: 14px; padding: 22px;
        }
        .card-title {
          font-size: 15px; font-weight: 700; color: var(--txt); margin-bottom: 14px;
        }

        /* Toggle */
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
        .ml-auto { margin-left: auto; }

        .field-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--bd);
        }
        .field-row:first-of-type { padding-top: 0; }
        .field-info { flex: 1; }
        .field-label { font-size: 14px; font-weight: 600; color: var(--txt); margin-bottom: 3px; }
        .field-desc  { font-size: 12px; color: var(--mut); line-height: 1.5; }

        /* Section header */
        .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
        .section-icon { display: flex; align-items: center; color: var(--primary); }
        .section-title { font-size: 15px; font-weight: 700; color: var(--txt); }

        .section-body { display: flex; flex-direction: column; gap: 16px; transition: opacity .2s; }
        .section-body.disabled-area { opacity: .45; pointer-events: none; }

        .field-group { display: flex; flex-direction: column; gap: 6px; }
        .label { font-size: 13px; font-weight: 600; color: var(--txt); }
        .field-hint { font-size: 11px; color: var(--mut); }

        .text-input {
          padding: 10px 14px; border-radius: 9px; border: 1px solid var(--bd);
          background: var(--s2); color: var(--txt); font-size: 14px; width: 100%;
          transition: border-color .15s;
        }
        .text-input:focus { outline: none; border-color: var(--primary); }
        .text-input:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }

        .test-row { display: flex; margin-top: 4px; }
        .btn-test {
          background: var(--s2); border: 1px solid var(--bd); border-radius: 9px;
          padding: 9px 18px; font-size: 13px; font-weight: 600; color: var(--txt);
          cursor: pointer; transition: background .15s;
        }
        .btn-test:hover:not(:disabled) { background: var(--s3); }
        .btn-test:disabled { opacity: .6; cursor: default; }

        /* Hours */
        .hours-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
        .hour-tag {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 10px 6px 14px; border-radius: 20px;
          background: rgba(254,95,1,.1); color: var(--primary);
          font-size: 13px; font-weight: 600; border: 1px solid rgba(254,95,1,.2);
        }
        .remove-hour {
          background: none; border: none; color: var(--primary); font-size: 16px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; opacity: .7; transition: opacity .15s; padding: 0 4px; line-height: 1;
        }
        .remove-hour:hover { opacity: 1; }
        .add-hour-select {
          padding: 6px 12px; border-radius: 20px; border: 1px dashed var(--bd);
          background: transparent; color: var(--txt); font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all .15s; outline: none;
        }
        .add-hour-select:hover { border-color: var(--primary); color: var(--primary); }

        /* Alert list */
        .alert-list { display: flex; flex-direction: column; }
        .alert-list .field-row { border-bottom: 1px solid var(--bd); }
        .alert-list .field-row:last-child { border-bottom: none !important; }

        /* Save */
        .save-row { display: flex; justify-content: flex-end; padding-top: 4px; }
        .btn-save {
          background: var(--primary); color: #fff; border: none; border-radius: 9px;
          padding: 11px 28px; font-size: 14px; font-weight: 700; cursor: pointer;
          transition: opacity .15s;
        }
        .btn-save:hover:not(:disabled) { opacity: .88; }
        .btn-save:disabled { opacity: .6; cursor: default; }

        /* Focus indicators */
        .btn-test:focus-visible, .btn-save:focus-visible,
        .hour-btn:focus-visible, .fbr-btn:focus-visible,
        .toggle input:focus-visible + .slider {
          outline: 2px solid var(--blue); outline-offset: 2px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .page-wrap { padding: 16px; }
          .page-header { flex-direction: column; align-items: flex-start; gap: 8px; }
          .hours-row { gap: 6px; }
          .save-row { justify-content: stretch; }
          .btn-save { width: 100%; }
          .fb-required { padding: 32px 16px; }
          .field-row { flex-direction: column; align-items: flex-start; gap: 8px; }
          .field-row .toggle { align-self: flex-end; }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .local-toast { animation: none; }
          .skel-block { animation: none; }
          .slider, .slider::before { transition: none; }
        }
      `}</style>
    </DashboardLayout>
  )
}
