import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../lib/AuthContext'

const DATE_PRESETS = [
  { key: 'today',      label: 'Hôm nay' },
  { key: 'yesterday',  label: 'Hôm qua' },
  { key: 'last_7d',    label: '7 ngày' },
  { key: 'last_30d',   label: '30 ngày' },
  { key: 'this_month', label: 'Tháng này' },
]

export default function Report() {
  const { user } = useAuth()
  const fbConnected = user?.fb_connected

  const [preset, setPreset] = useState('today')
  const [data, setData] = useState([])
  const [totals, setTotals] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadReport = useCallback((p) => {
    if (!fbConnected) return
    setLoading(true)
    fetch(`/api/fb/report?date_preset=${p}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.ok) {
          setData(d.data || [])
          setTotals(d.totals || null)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [fbConnected])

  useEffect(() => {
    loadReport(preset)
  }, [preset, loadReport])

  function fmt(v, digits = 0) {
    if (v == null) return '—'
    return Number(v).toLocaleString('vi-VN', { minimumFractionDigits: digits, maximumFractionDigits: digits })
  }

  function fmtMoney(v) {
    if (v == null) return '—'
    return '₫' + fmt(v, 0)
  }

  function fmtPct(v) {
    if (v == null) return '—'
    return Number(v).toFixed(2) + '%'
  }

  const summaryCards = [
    { label: 'Tổng chi phí',     value: fmtMoney(totals?.spend),       color: '#f59e0b', icon: '💸' },
    { label: 'Impressions',      value: fmt(totals?.impressions),       color: '#3b82f6', icon: '👁' },
    { label: 'Clicks',           value: fmt(totals?.clicks),            color: '#8b5cf6', icon: '🖱' },
    { label: 'CTR trung bình',   value: fmtPct(totals?.ctr),           color: '#10b981', icon: '📈' },
    { label: 'CPC trung bình',   value: fmtMoney(totals?.cpc),         color: '#ef4444', icon: '🎯' },
  ]

  return (
    <DashboardLayout title="Report">
      <div className="page-wrap">
        <div className="page-header">
          <span className="page-icon">📈</span>
          <div>
            <h1>Report</h1>
            <p>Báo cáo hiệu suất chiến dịch quảng cáo</p>
          </div>
        </div>

        {!fbConnected ? (
          <div className="fb-required">
            <div className="fbr-icon">🔗</div>
            <div className="fbr-title">Cần kết nối Facebook Ads</div>
            <div className="fbr-desc">Tính năng này yêu cầu bạn kết nối tài khoản Facebook Ads để lấy dữ liệu báo cáo.</div>
            <Link href="/settings/connect-facebook" className="fbr-btn">Kết nối ngay →</Link>
          </div>
        ) : (
          <>
            {/* Date preset selector */}
            <div className="preset-bar">
              {DATE_PRESETS.map(p => (
                <button
                  key={p.key}
                  className={`preset-btn${preset === p.key ? ' active' : ''}`}
                  onClick={() => setPreset(p.key)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Summary cards */}
            {loading && !totals ? (
              <div className="summary-row">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="sum-card skel-card" />
                ))}
              </div>
            ) : (
              <div className="summary-row">
                {summaryCards.map(c => (
                  <div key={c.label} className="sum-card">
                    <div className="sum-icon" style={{ background: c.color + '22', color: c.color }}>{c.icon}</div>
                    <div className="sum-body">
                      <div className="sum-label">{c.label}</div>
                      <div className="sum-value">{c.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Campaign breakdown table */}
            <div className="table-card">
              <div className="table-header">
                <div className="table-title">Chi tiết theo chiến dịch</div>
                <button className="refresh-btn" onClick={() => loadReport(preset)} disabled={loading}>
                  {loading ? '…' : '↻ Làm mới'}
                </button>
              </div>

              {loading && data.length === 0 ? (
                <div className="skel-rows">
                  {[1,2,3,4].map(i => <div key={i} className="skel-row" />)}
                </div>
              ) : data.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <div className="empty-text">Không có dữ liệu cho khoảng thời gian này</div>
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Chiến dịch</th>
                        <th>Tài khoản</th>
                        <th className="num">Chi phí</th>
                        <th className="num">Impressions</th>
                        <th className="num">Clicks</th>
                        <th className="num">CTR</th>
                        <th className="num">CPC</th>
                        <th className="num">Reach</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, i) => (
                        <tr key={row.campaign_id || i}>
                          <td className="camp-name" title={row.campaign_name}>{row.campaign_name}</td>
                          <td className="acc-name">{row.account_name}</td>
                          <td className="num">₫{fmt(row.spend)}</td>
                          <td className="num">{fmt(row.impressions)}</td>
                          <td className="num">{fmt(row.clicks)}</td>
                          <td className="num">{fmtPct(row.ctr)}</td>
                          <td className="num">₫{fmt(row.cpc, 0)}</td>
                          <td className="num">{fmt(row.reach)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="totals-row">
                        <td colSpan={2}><strong>Tổng cộng</strong></td>
                        <td className="num"><strong>₫{fmt(totals?.spend)}</strong></td>
                        <td className="num"><strong>{fmt(totals?.impressions)}</strong></td>
                        <td className="num"><strong>{fmt(totals?.clicks)}</strong></td>
                        <td className="num"><strong>{fmtPct(totals?.ctr)}</strong></td>
                        <td className="num"><strong>₫{fmt(totals?.cpc, 0)}</strong></td>
                        <td className="num"><strong>{fmt(totals?.reach)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .page-wrap { padding: 24px; max-width: 1100px; }
        .page-header { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
        .page-icon { font-size: 32px; }
        h1 { font-size: 20px; font-weight: 700; color: var(--txt); margin-bottom: 4px; }
        p  { font-size: 13px; color: var(--mut); }

        /* FB Required */
        .fb-required {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
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

        /* Date presets */
        .preset-bar { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .preset-btn {
          padding: 7px 16px; border-radius: 9px; border: 1px solid var(--bd);
          background: var(--s1); color: var(--txt); font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all .15s;
        }
        .preset-btn:hover { background: var(--s2); }
        .preset-btn.active { background: var(--primary); border-color: var(--primary); color: #fff; font-weight: 700; }

        /* Summary cards */
        .summary-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }
        @media (max-width: 900px) { .summary-row { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 560px) { .summary-row { grid-template-columns: repeat(2, 1fr); } }

        .sum-card {
          background: var(--s1); border: 1px solid var(--bd); border-radius: 12px;
          padding: 14px 16px; display: flex; align-items: center; gap: 12px;
        }
        .skel-card { height: 68px; }
        .sum-icon {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-size: 18px;
        }
        .sum-body { min-width: 0; }
        .sum-label { font-size: 11px; color: var(--mut); font-weight: 600; text-transform: uppercase; letter-spacing: .3px; margin-bottom: 4px; }
        .sum-value { font-size: 16px; font-weight: 700; color: var(--txt); }

        /* Table card */
        .table-card {
          background: var(--s1); border: 1px solid var(--bd); border-radius: 14px;
          padding: 18px 22px;
        }
        .table-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .table-title  { font-size: 14px; font-weight: 700; color: var(--txt); }
        .refresh-btn {
          background: var(--s2); border: 1px solid var(--bd); border-radius: 8px;
          padding: 6px 12px; font-size: 12px; color: var(--txt); cursor: pointer;
          transition: background .15s;
        }
        .refresh-btn:hover:not(:disabled) { background: var(--s3); }
        .refresh-btn:disabled { opacity: .6; cursor: default; }

        .skel-rows { display: flex; flex-direction: column; gap: 10px; }
        .skel-row {
          height: 44px; border-radius: 8px;
          background: linear-gradient(90deg, var(--s2) 25%, var(--s3) 50%, var(--s2) 75%);
          background-size: 200% 100%; animation: shimmer 1.2s infinite;
        }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .empty-state { display: flex; flex-direction: column; align-items: center; padding: 40px 20px; gap: 10px; }
        .empty-icon  { font-size: 32px; }
        .empty-text  { font-size: 14px; color: var(--mut); }

        .table-wrap { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .data-table th {
          text-align: left; font-size: 11px; font-weight: 700; color: var(--mut);
          text-transform: uppercase; letter-spacing: .3px;
          padding: 8px 10px; border-bottom: 1px solid var(--bd); white-space: nowrap;
        }
        .data-table td {
          padding: 10px 10px; border-bottom: 1px solid var(--bd);
          color: var(--txt); vertical-align: middle;
        }
        .data-table tr:last-child td { border-bottom: none; }
        .data-table tbody tr:hover td { background: var(--s2); }
        .data-table th.num, .data-table td.num { text-align: right; }

        .camp-name { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
        .acc-name  { color: var(--mut); font-size: 12px; white-space: nowrap; }

        .totals-row td {
          background: var(--s2) !important; border-top: 2px solid var(--bd);
          border-bottom: none;
        }
      `}</style>
    </DashboardLayout>
  )
}
