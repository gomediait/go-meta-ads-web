import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../../lib/AuthContext'
import DashboardLayout from '../../components/DashboardLayout'

const STEPS = [
  { n: 1, title: 'Đăng nhập Facebook', desc: 'Nhấn nút bên dưới để xác thực với Facebook' },
  { n: 2, title: 'Cấp quyền truy cập', desc: 'Cho phép Go Meta Ads Pro đọc dữ liệu Ads của bạn' },
  { n: 3, title: 'Chọn tài khoản Ads', desc: 'Chọn tài khoản quảng cáo bạn muốn quản lý' },
]

export default function ConnectFacebook() {
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (router.query.success === '1') {
      setSuccessMsg('Kết nối Facebook thành công! Trang sẽ cập nhật trong giây lát...')
      refreshUser()
      router.replace('/settings/connect-facebook', undefined, { shallow: true })
    }
    if (router.query.error) {
      setErrorMsg(decodeURIComponent(router.query.error))
      setStatus('error')
      router.replace('/settings/connect-facebook', undefined, { shallow: true })
    }
  }, [router.query])

  const fbConnected = user?.fb_connected

  async function handleConnect() {
    setStatus('loading')
    setErrorMsg('')
    try {
      const r = await fetch('/api/auth?action=facebook', { method: 'POST' })
      const d = await r.json()
      if (!r.ok) {
        if (r.status === 503) {
          setErrorMsg('Facebook OAuth chưa được cấu hình. Vui lòng liên hệ quản trị viên để hoàn tất thiết lập.')
        } else {
          setErrorMsg(d.error || 'Có lỗi xảy ra khi kết nối Facebook.')
        }
        setStatus('error')
        return
      }
      if (d.auth_url) {
        window.location.href = d.auth_url
      }
    } catch {
      setErrorMsg('Không thể kết nối. Kiểm tra lại kết nối mạng.')
      setStatus('error')
    }
  }

  async function handleDisconnect() {
    if (!confirm('Ngắt kết nối Facebook sẽ tắt tất cả tính năng liên quan đến quảng cáo. Tiếp tục?')) return
    setStatus('loading')
    try {
      const r = await fetch('/api/fb/disconnect', { method: 'POST' })
      if (r.ok) {
        await refreshUser()
        setStatus('idle')
      } else {
        setStatus('error')
        setErrorMsg('Không thể ngắt kết nối. Thử lại sau.')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Lỗi kết nối mạng.')
    }
  }

  return (
    <DashboardLayout title="Kết nối Facebook Ads">
      <div className="cf-page">

        <div className="cf-header">
          <div className="cf-header-icon">🔗</div>
          <div>
            <h1 className="cf-title">Kết nối Facebook Ads</h1>
            <p className="cf-sub">Cấp quyền để Go Meta Ads Pro quản lý chiến dịch quảng cáo của bạn</p>
          </div>
        </div>

        {/* Success banner */}
        {successMsg && (
          <div className="success-box">
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Already connected */}
        {fbConnected && (
          <div className="connected-card">
            <div className="conn-icon">✅</div>
            <div className="conn-body">
              <div className="conn-title">Facebook đã được kết nối</div>
              <div className="conn-meta">
                {user?.fb_name && <span>Tài khoản: <strong>{user.fb_name}</strong></span>}
                {user?.fb_email && <span> · {user.fb_email}</span>}
              </div>
            </div>
            <button
              className="disconnect-btn"
              onClick={handleDisconnect}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? '...' : 'Ngắt kết nối'}
            </button>
          </div>
        )}

        {/* Not connected */}
        {!fbConnected && (
          <>
            {/* Steps */}
            <div className="steps-row">
              {STEPS.map(s => (
                <div key={s.n} className="step-card">
                  <div className="step-num">{s.n}</div>
                  <div className="step-body">
                    <div className="step-title">{s.title}</div>
                    <div className="step-desc">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Error */}
            {status === 'error' && (
              <div className="err-box">
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Connect button */}
            <button
              className="connect-btn"
              onClick={handleConnect}
              disabled={status === 'loading'}
            >
              {status === 'loading'
                ? '⏳ Đang xử lý...'
                : <><span className="fb-f">f</span> Kết nối với Facebook Ads</>
              }
            </button>

            <p className="permission-note">
              Go Meta Ads Pro sẽ yêu cầu quyền: <strong>ads_read</strong>, <strong>ads_management</strong>, <strong>read_insights</strong>.
              Chúng tôi không đăng bài, không nhắn tin, không truy cập thông tin cá nhân ngoài phạm vi quảng cáo.
            </p>
          </>
        )}

        {/* Permissions info */}
        <div className="perm-section">
          <div className="perm-title">Quyền truy cập được yêu cầu</div>
          <div className="perm-grid">
            {[
              { icon: '📊', label: 'ads_read',        desc: 'Đọc dữ liệu chiến dịch & báo cáo' },
              { icon: '⚙️', label: 'ads_management',  desc: 'Bật/tắt, điều chỉnh ngân sách' },
              { icon: '📈', label: 'read_insights',   desc: 'Xem số liệu hiệu suất quảng cáo' },
            ].map(p => (
              <div key={p.label} className="perm-card">
                <span className="perm-icon">{p.icon}</span>
                <div>
                  <code className="perm-name">{p.label}</code>
                  <div className="perm-desc">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="back-link">
          <Link href="/dashboard">← Về trang chủ</Link>
        </div>

      </div>

      <style jsx>{`
        .cf-page { padding: 24px; max-width: 700px; }

        .cf-header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
        .cf-header-icon { font-size: 36px; }
        .cf-title { font-size: 20px; font-weight: 700; color: var(--txt); margin-bottom: 4px; }
        .cf-sub   { font-size: 13px; color: var(--mut); }

        /* Connected state */
        .connected-card {
          display: flex; align-items: center; gap: 14px;
          background: rgba(0,196,140,.08); border: 1px solid rgba(0,196,140,.25);
          border-radius: 14px; padding: 18px 22px; margin-bottom: 24px;
        }
        .conn-icon  { font-size: 28px; flex-shrink: 0; }
        .conn-body  { flex: 1; }
        .conn-title { font-size: 14px; font-weight: 700; color: var(--txt); margin-bottom: 4px; }
        .conn-meta  { font-size: 13px; color: var(--mut); }
        .disconnect-btn {
          background: transparent; border: 1px solid rgba(255,69,96,.4); border-radius: 8px;
          padding: 7px 14px; font-size: 12px; font-weight: 600; color: #ff4560;
          cursor: pointer; white-space: nowrap; transition: all .15s;
        }
        .disconnect-btn:hover { background: rgba(255,69,96,.1); }
        .disconnect-btn:disabled { opacity: .5; cursor: not-allowed; }

        /* Steps */
        .steps-row { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
        .step-card {
          display: flex; align-items: flex-start; gap: 14px;
          background: var(--s1); border: 1px solid var(--bd); border-radius: 12px;
          padding: 14px 18px;
        }
        .step-num {
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(254,95,1,.15); color: #fe5f01;
          font-size: 13px; font-weight: 700; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .step-title { font-size: 13px; font-weight: 700; color: var(--txt); margin-bottom: 3px; }
        .step-desc  { font-size: 12px; color: var(--mut); }

        /* Success */
        .success-box {
          display: flex; align-items: flex-start; gap: 10px;
          background: rgba(0,196,140,.08); border: 1px solid rgba(0,196,140,.25);
          border-radius: 10px; padding: 12px 16px;
          font-size: 13px; color: var(--grn); margin-bottom: 16px;
        }

        /* Error */
        .err-box {
          display: flex; align-items: flex-start; gap: 10px;
          background: rgba(255,69,96,.08); border: 1px solid rgba(255,69,96,.25);
          border-radius: 10px; padding: 12px 16px;
          font-size: 13px; color: #ff8fa3; margin-bottom: 16px;
        }

        /* Connect button */
        .connect-btn {
          width: 100%; background: #1877f2; border: none; border-radius: 12px;
          padding: 14px; font-size: 15px; font-weight: 700; color: #fff;
          cursor: pointer; transition: opacity .15s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          margin-bottom: 14px;
        }
        .connect-btn:hover:not(:disabled) { opacity: .88; }
        .connect-btn:disabled { opacity: .5; cursor: not-allowed; }
        .fb-f { font-size: 20px; font-weight: 900; line-height: 1; }

        .permission-note {
          font-size: 11px; color: var(--mut); line-height: 1.6;
          text-align: center; margin-bottom: 28px;
        }

        /* Permissions */
        .perm-section { background: var(--s1); border: 1px solid var(--bd); border-radius: 14px; padding: 18px 20px; margin-bottom: 24px; }
        .perm-title { font-size: 11px; font-weight: 700; color: var(--mut); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 12px; }
        .perm-grid { display: flex; flex-direction: column; gap: 10px; }
        .perm-card { display: flex; align-items: flex-start; gap: 12px; }
        .perm-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
        .perm-name { font-size: 12px; font-weight: 700; color: var(--blue); background: rgba(59,130,246,.1); padding: 2px 7px; border-radius: 5px; display: inline-block; margin-bottom: 3px; }
        .perm-desc { font-size: 12px; color: var(--mut); }

        .back-link { font-size: 13px; }
        .back-link a { color: var(--mut); text-decoration: none; }
        .back-link a:hover { color: var(--txt); }
      `}</style>
    </DashboardLayout>
  )
}
