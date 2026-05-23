import { useEffect, useState, useCallback } from 'react'
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
  const [campaigns, setCampaigns] = useState([])
  const [campLoading, setCampLoading] = useState(false)
  const [toggling, setToggling] = useState({})
  const fbConnected = user?.fb_connected

  useEffect(() => {
    if (!fbConnected) return
    fetch('/api/dashboard/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d) })
      .catch(() => {})
  }, [fbConnected])

  const loadCampaigns = useCallback(() => {
    if (!fbConnected) return
    setCampLoading(true)
    fetch('/api/fb/campaigns')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.ok) setCampaigns(d.campaigns || [])
      })
      .catch(() => {})
      .finally(() => setCampLoading(false))
  }, [fbConnected])

  useEffect(() => {
    loadCampaigns()
  }, [loadCampaigns])

  async function toggleCampaign(campId, currentStatus) {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    setToggling(t => ({ ...t, [campId]: true }))
    try {
      const res = await fetch('/api/fb/campaign-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: campId, status: newStatus })
      })
      if (res.ok) {
        setCampaigns(prev => prev.map(c =>
          c.id === campId ? { ...c, status: newStatus } : c
        ))
      }
    } catch (err) {
      console.error('Toggle error:', err)
    } finally {
      setToggling(t => ({ ...t, [campId]: false }))
    }
  }

  function fmt(v) {
    if (v == null) return '—'
    return Number(v).toLocaleString('vi-VN')
  }

  function fmtCTR(v) {
    if (!v) return '0.00%'
    return Number(v).toFixed(2) + '%'
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

        {/* Campaigns section */}
        {fbConnected && (
          <div className="camp-section">
            <div className="camp-header">
              <div className="section-title" style={{ marginBottom: 0 }}>Chiến dịch hôm nay</div>
              <button className="refresh-btn" onClick={loadCampaigns} disabled={campLoading}>
                {campLoading ? '…' : '↻ Làm mới'}
              </button>
            </div>

            {campLoading && campaigns.length === 0 ? (
              <div className="camp-skeleton">
                {[1,2,3].map(i => <div key={i} className="skel-row" />)}
              </div>
            ) : campaigns.length === 0 ? (
              <div className="camp-empty">
                <div className="empty-icon">📭</div>
                <div className="empty-text">Không có chiến dịch nào</div>
                <div className="empty-sub">Chưa có chiến dịch ACTIVE hoặc PAUSED trong tài khoản được chọn</div>
              </div>
            ) : (
              <div className="camp-table-wrap">
                <table className="camp-table">
                  <thead>
                    <tr>
                      <th>Tên chiến dịch</th>
                      <th>Tài khoản</th>
                      <th>Trạng thái</th>
                      <th className="num">Chi phí hôm nay</th>
                      <th className="num">Impressions</th>
                      <th className="num">Clicks</th>
                      <th className="num">CTR</th>
                      <th className="center">Bật/Tắt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map(camp => (
                      <tr key={camp.id}>
                        <td className="camp-name" title={camp.name}>{camp.name}</td>
                        <td className="camp-account">{camp.account_name}</td>
                        <td>
                          <span className={`status-badge ${camp.status === 'ACTIVE' ? 'status-active' : 'status-paused'}`}>
                            {camp.status === 'ACTIVE' ? 'Đang chạy' : 'Tạm dừng'}
                          </span>
                        </td>
                        <td className="num">₫{fmt(camp.spend)}</td>
                        <td className="num">{fmt(camp.impressions)}</td>
                        <td className="num">{fmt(camp.clicks)}</td>
                        <td className="num">{fmtCTR(camp.ctr)}</td>
                        <td className="center">
                          <button
                            className={`toggle-btn ${camp.status === 'ACTIVE' ? 'toggle-on' : 'toggle-off'}`}
                            onClick={() => toggleCampaign(camp.id, camp.status)}
                            disabled={toggling[camp.id]}
                            title={camp.status === 'ACTIVE' ? 'Tạm dừng chiến dịch' : 'Bật chiến dịch'}
                          >
                            {toggling[camp.id] ? '…' : camp.status === 'ACTIVE' ? '⏸' : '▶'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

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
        .dash-home { padding: 24px; max-width: 1200px; }

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

        /* Campaigns section */
        .camp-section {
          background: var(--s1); border: 1px solid var(--bd); border-radius: 14px;
          padding: 18px 22px; margin-bottom: 28px;
        }
        .camp-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px;
        }
        .refresh-btn {
          background: var(--s2); border: 1px solid var(--bd); border-radius: 8px;
          padding: 6px 12px; font-size: 12px; color: var(--txt); cursor: pointer;
          transition: background .15s;
        }
        .refresh-btn:hover:not(:disabled) { background: var(--s3); }
        .refresh-btn:disabled { opacity: .6; cursor: default; }

        .camp-skeleton { display: flex; flex-direction: column; gap: 10px; }
        .skel-row {
          height: 44px; border-radius: 8px;
          background: linear-gradient(90deg, var(--s2) 25%, var(--s3) 50%, var(--s2) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.2s infinite;
        }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .camp-empty {
          display: flex; flex-direction: column; align-items: center;
          padding: 40px 20px; gap: 8px; text-align: center;
        }
        .empty-icon { font-size: 32px; }
        .empty-text { font-size: 15px; font-weight: 600; color: var(--txt); }
        .empty-sub  { font-size: 13px; color: var(--mut); max-width: 340px; line-height: 1.5; }

        .camp-table-wrap { overflow-x: auto; }
        .camp-table {
          width: 100%; border-collapse: collapse; font-size: 13px;
        }
        .camp-table th {
          text-align: left; font-size: 11px; font-weight: 700; color: var(--mut);
          text-transform: uppercase; letter-spacing: .4px;
          padding: 8px 10px; border-bottom: 1px solid var(--bd); white-space: nowrap;
        }
        .camp-table td {
          padding: 10px 10px; border-bottom: 1px solid var(--bd);
          color: var(--txt); vertical-align: middle;
        }
        .camp-table tr:last-child td { border-bottom: none; }
        .camp-table tr:hover td { background: var(--s2); }
        .camp-table th.num, .camp-table td.num { text-align: right; }
        .camp-table th.center, .camp-table td.center { text-align: center; }

        .camp-name {
          max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          font-weight: 500;
        }
        .camp-account { color: var(--mut); font-size: 12px; white-space: nowrap; }

        .status-badge {
          display: inline-block; padding: 3px 9px; border-radius: 20px;
          font-size: 11px; font-weight: 700; white-space: nowrap;
        }
        .status-active { background: rgba(16,185,129,.15); color: var(--grn); }
        .status-paused { background: var(--s3); color: var(--mut); }

        .toggle-btn {
          width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--bd);
          background: var(--s2); cursor: pointer; font-size: 14px;
          transition: all .15s; display: inline-flex; align-items: center; justify-content: center;
        }
        .toggle-btn:hover:not(:disabled) { background: var(--s3); }
        .toggle-btn:disabled { opacity: .6; cursor: default; }
        .toggle-on { border-color: rgba(239,68,68,.4); color: var(--red); }
        .toggle-on:hover:not(:disabled) { background: rgba(239,68,68,.1); }
        .toggle-off { border-color: rgba(16,185,129,.4); color: var(--grn); }
        .toggle-off:hover:not(:disabled) { background: rgba(16,185,129,.1); }

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
