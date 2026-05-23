import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../lib/AuthContext'

const STAT_CARDS = [
  { key: 'campaigns',  label: 'Chiến dịch đang chạy', icon: '📣', color: '#3b82f6' },
  { key: 'spend',      label: 'Chi phí hôm nay',       icon: '💸', color: '#f59e0b', prefix: '₫' },
  { key: 'revenue',    label: 'Doanh thu hôm nay',     icon: '💰', color: '#10b981', prefix: '₫' },
  { key: 'profit',     label: 'Lợi nhuận hôm nay',     icon: '📈', color: '#00c48c', prefix: '₫' },
]

const QUICK_ACTIONS = [
  { href: '/dashboard/profit',      icon: '💰', label: 'Kiểm soát lãi lỗ',    desc: 'Nhập chi phí & doanh thu để tính lãi' },
  { href: '/dashboard/policycheck', icon: '🛡️', label: 'Kiểm tra vi phạm',    desc: 'Phân tích nội dung quảng cáo bằng AI' },
  { href: '/dashboard/autocare',    icon: '💚', label: 'Auto Care',            desc: 'Tự động tối ưu chiến dịch' },
  { href: '/dashboard/team',        icon: '👥', label: 'Quản lý nhân viên',   desc: 'Phân quyền tài khoản nhóm' },
]

export default function DashboardHome() {
  const { user, planName, isExpired } = useAuth()
  const [stats, setStats] = useState(null)
  const fbConnected = user?.fb_connected

  useEffect(() => {
    if (!fbConnected) return
    fetch('/api/dashboard/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d) })
      .catch(() => {})
  }, [fbConnected])

  function fmt(v) {
    if (v == null) return '—'
    return Number(v).toLocaleString('vi-VN')
  }

  const expireDate = user?.expire_at ? new Date(user.expire_at).toLocaleDateString('vi-VN') : null

  return (
    <DashboardLayout title="Dashboard">
      <div className="dash-home">

        {/* Welcome banner */}
        <div className="welcome-banner">
          <div className="wb-left">
            <div className="wb-greeting">Xin chào, {user?.name || 'bạn'} 👋</div>
            <div className="wb-sub">
              Gói: <strong>{planName}</strong>
              {expireDate && !isExpired && <span className="expire-ok"> · Hết hạn {expireDate}</span>}
              {isExpired && <span className="expire-warn"> · ⚠️ Đã hết hạn</span>}
            </div>
          </div>
          {isExpired && (
            <Link href="/mua-goi" className="upgrade-btn">Gia hạn ngay →</Link>
          )}
          {!isExpired && user?.plan === 'trial' && (
            <Link href="/mua-goi" className="upgrade-btn upgrade-btn--soft">Nâng cấp gói →</Link>
          )}
        </div>

        {/* FB connect CTA */}
        {!fbConnected && (
          <div className="fb-cta">
            <div className="fb-cta-icon">🔗</div>
            <div className="fb-cta-body">
              <div className="fb-cta-title">Kết nối tài khoản Facebook Ads để bắt đầu</div>
              <div className="fb-cta-desc">Sau khi kết nối, bạn có thể quản lý chiến dịch, xem báo cáo và bật tự động hoá trực tiếp trên web.</div>
            </div>
            <Link href="/settings/connect-facebook" className="fb-cta-btn">Kết nối ngay</Link>
          </div>
        )}

        {/* Stats row */}
        <div className="stats-row">
          {STAT_CARDS.map(c => {
            const val = stats?.[c.key]
            return (
              <div key={c.key} className={`stat-card${!fbConnected ? ' stat-card--locked' : ''}`}>
                <div className="stat-icon" style={{ background: c.color + '22', color: c.color }}>{c.icon}</div>
                <div className="stat-body">
                  <div className="stat-label">{c.label}</div>
                  <div className="stat-value">
                    {!fbConnected
                      ? <span className="stat-lock">🔒 Cần kết nối FB</span>
                      : val == null
                        ? <span className="stat-loading">…</span>
                        : <>{c.prefix}{fmt(val)}</>
                    }
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick actions */}
        <div className="section-title">Truy cập nhanh</div>
        <div className="quick-grid">
          {QUICK_ACTIONS.map(a => (
            <Link key={a.href} href={a.href} className="quick-card">
              <span className="qc-icon">{a.icon}</span>
              <div className="qc-body">
                <div className="qc-label">{a.label}</div>
                <div className="qc-desc">{a.desc}</div>
              </div>
              <span className="qc-arrow">→</span>
            </Link>
          ))}
        </div>

      </div>

      <style jsx>{`
        .dash-home { padding: 24px; max-width: 1100px; }

        /* Welcome */
        .welcome-banner {
          display: flex; align-items: center; justify-content: space-between;
          background: var(--s1); border: 1px solid var(--bd); border-radius: 14px;
          padding: 18px 22px; margin-bottom: 20px; gap: 12px;
        }
        .wb-greeting { font-size: 17px; font-weight: 700; color: var(--txt); margin-bottom: 4px; }
        .wb-sub { font-size: 13px; color: var(--mut); }
        .wb-sub strong { color: var(--txt); }
        .expire-ok   { color: var(--grn); }
        .expire-warn { color: var(--red); font-weight: 600; }
        .upgrade-btn {
          background: #fe5f01; color: #fff; border-radius: 9px;
          padding: 9px 18px; font-size: 13px; font-weight: 700;
          text-decoration: none; white-space: nowrap; flex-shrink: 0;
          transition: opacity .15s;
        }
        .upgrade-btn:hover { opacity: .88; }
        .upgrade-btn--soft { background: var(--s3); color: var(--txt); }
        .upgrade-btn--soft:hover { background: var(--bd); }

        /* FB CTA */
        .fb-cta {
          display: flex; align-items: center; gap: 16px;
          background: rgba(59,130,246,.08); border: 1px solid rgba(59,130,246,.25);
          border-radius: 14px; padding: 18px 22px; margin-bottom: 20px;
        }
        .fb-cta-icon { font-size: 28px; flex-shrink: 0; }
        .fb-cta-body { flex: 1; }
        .fb-cta-title { font-size: 14px; font-weight: 700; color: var(--txt); margin-bottom: 4px; }
        .fb-cta-desc  { font-size: 13px; color: var(--mut); line-height: 1.5; }
        .fb-cta-btn {
          background: #1877f2; color: #fff; border-radius: 9px;
          padding: 9px 18px; font-size: 13px; font-weight: 700;
          text-decoration: none; white-space: nowrap; flex-shrink: 0;
          transition: opacity .15s;
        }
        .fb-cta-btn:hover { opacity: .88; }

        /* Stats */
        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px; }
        @media (max-width: 900px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 520px) { .stats-row { grid-template-columns: 1fr; } }

        .stat-card {
          background: var(--s1); border: 1px solid var(--bd); border-radius: 14px;
          padding: 16px 18px; display: flex; align-items: center; gap: 14px;
        }
        .stat-card--locked { opacity: .7; }
        .stat-icon {
          width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-size: 20px;
        }
        .stat-body { min-width: 0; }
        .stat-label { font-size: 11px; color: var(--mut); font-weight: 600; text-transform: uppercase; letter-spacing: .4px; margin-bottom: 5px; }
        .stat-value { font-size: 18px; font-weight: 700; color: var(--txt); }
        .stat-lock   { font-size: 12px; color: var(--mut); font-weight: 400; }
        .stat-loading { font-size: 14px; color: var(--mut); }

        /* Quick actions */
        .section-title { font-size: 13px; font-weight: 700; color: var(--mut); text-transform: uppercase; letter-spacing: .6px; margin-bottom: 12px; }
        .quick-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        @media (max-width: 640px) { .quick-grid { grid-template-columns: 1fr; } }

        .quick-card {
          display: flex; align-items: center; gap: 14px;
          background: var(--s1); border: 1px solid var(--bd); border-radius: 14px;
          padding: 16px 18px; text-decoration: none;
          transition: border-color .15s, background .15s;
        }
        .quick-card:hover { border-color: #fe5f01; background: var(--s2); }
        .qc-icon  { font-size: 24px; flex-shrink: 0; }
        .qc-body  { flex: 1; min-width: 0; }
        .qc-label { font-size: 14px; font-weight: 700; color: var(--txt); margin-bottom: 3px; }
        .qc-desc  { font-size: 12px; color: var(--mut); line-height: 1.4; }
        .qc-arrow { font-size: 18px; color: var(--mut); flex-shrink: 0; transition: color .15s; }
        .quick-card:hover .qc-arrow { color: #fe5f01; }
      `}</style>
    </DashboardLayout>
  )
}
