import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../lib/AuthContext'
import Link from 'next/link'

export default function Notifications() {
  const { user } = useAuth()
  const fbConnected = user?.fb_connected

  return (
    <DashboardLayout title="Thông báo tự động">
      <div className="page-wrap">
        <div className="page-header">
          <span className="page-icon">🔔</span>
          <div>
            <h1>Thông báo tự động</h1>
            <p>Nhận cảnh báo khi chiến dịch vượt ngưỡng hoặc có bất thường</p>
          </div>
        </div>

        {!fbConnected ? (
          <div className="fb-required">
            <div className="fbr-icon">🔗</div>
            <div className="fbr-title">Cần kết nối Facebook Ads</div>
            <div className="fbr-desc">Tính năng thông báo yêu cầu kết nối Facebook Ads để theo dõi và cảnh báo real-time.</div>
            <Link href="/settings/connect-facebook" className="fbr-btn">Kết nối ngay →</Link>
          </div>
        ) : (
          <div className="coming-soon">
            <div className="cs-icon">🚧</div>
            <div className="cs-title">Đang phát triển</div>
            <div className="cs-desc">Tính năng Thông báo tự động đang được xây dựng và sẽ ra mắt sớm.</div>
          </div>
        )}
      </div>

      <style jsx>{`
        .page-wrap { padding: 24px; max-width: 900px; }
        .page-header { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }
        .page-icon { font-size: 32px; }
        h1 { font-size: 20px; font-weight: 700; color: var(--txt); margin-bottom: 4px; }
        p  { font-size: 13px; color: var(--mut); }
        .fb-required, .coming-soon {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          background: var(--s1); border: 1px solid var(--bd); border-radius: 16px;
          padding: 48px 32px; text-align: center; gap: 12px;
        }
        .fbr-icon, .cs-icon { font-size: 40px; }
        .fbr-title, .cs-title { font-size: 16px; font-weight: 700; color: var(--txt); }
        .fbr-desc, .cs-desc   { font-size: 13px; color: var(--mut); max-width: 380px; line-height: 1.6; }
        .fbr-btn {
          background: #1877f2; color: #fff; border-radius: 9px;
          padding: 10px 20px; font-size: 13px; font-weight: 700;
          text-decoration: none; margin-top: 8px; transition: opacity .15s;
        }
        .fbr-btn:hover { opacity: .88; }
      `}</style>
    </DashboardLayout>
  )
}
