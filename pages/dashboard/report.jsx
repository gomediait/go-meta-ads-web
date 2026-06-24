import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../lib/AuthContext'

const DailyCharts = dynamic(() => import('../../components/DailyCharts'), { ssr: false })
import ReportChatPanel from '../../components/ReportChatPanel'

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

  const [preset, setPreset] = useState('last_7d')
  const [rawData, setRawData] = useState([])
  const [rawDailyRaw, setRawDailyRaw] = useState([])
  const [rawDaily, setRawDaily] = useState([])
  const [accounts, setAccounts] = useState([])
  const [accountFilter, setAccountFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [chartTab, setChartTab] = useState('spend')
  const [campaignDailyRaw, setCampaignDailyRaw] = useState([])
  const [expandedCampId, setExpandedCampId] = useState(null)
  const [campChartTab, setCampChartTab] = useState('spend')
  const [showAI, setShowAI] = useState(false)

  const loadReport = useCallback((p) => {
    if (!fbConnected) return
    setLoading(true)
    setExpandedCampId(null)
    fetch(`/api/fb/report?date_preset=${p}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.ok) {
          setRawData(d.data || [])
          setRawDaily(d.daily || [])
          setRawDailyRaw(d.dailyRaw || [])
          setCampaignDailyRaw(d.campaignDailyRaw || [])
          setAccounts(d.accounts || [])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [fbConnected])

  function getCampaignDaily(campaignId) {
    const map = {}
    for (const r of campaignDailyRaw.filter(r => r.campaign_id === campaignId)) {
      if (!map[r.date]) map[r.date] = { date: r.date, spend: 0, impressions: 0, clicks: 0, reach: 0 }
      map[r.date].spend += r.spend
      map[r.date].impressions += r.impressions
      map[r.date].clicks += r.clicks
      map[r.date].reach += r.reach
    }
    const arr = Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
    for (const d of arr) {
      d.ctr = d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0
      d.cpc = d.clicks > 0 ? d.spend / d.clicks : 0
    }
    return arr.map(row => ({
      ...row,
      label: row.date ? row.date.slice(5) : '',
      ctr: Math.round((row.ctr || 0) * 100) / 100,
      cpc: Math.round(row.cpc || 0),
    }))
  }

  // Filtered data based on account selection
  const data = accountFilter === 'all' ? rawData : rawData.filter(r => r.account_id === accountFilter)

  const totals = data.reduce((acc, row) => {
    acc.spend += row.spend
    acc.impressions += row.impressions
    acc.clicks += row.clicks
    acc.reach += row.reach
    return acc
  }, { spend: 0, impressions: 0, clicks: 0, reach: 0 })
  totals.ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0
  totals.cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0

  // Filtered daily for charts
  const daily = (() => {
    let source
    if (accountFilter === 'all') {
      source = rawDaily
    } else {
      const map = {}
      for (const r of rawDailyRaw.filter(r => r.account_id === accountFilter)) {
        if (!map[r.date]) map[r.date] = { date: r.date, spend: 0, impressions: 0, clicks: 0, reach: 0 }
        map[r.date].spend += r.spend
        map[r.date].impressions += r.impressions
        map[r.date].clicks += r.clicks
        map[r.date].reach += r.reach
      }
      source = Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
      for (const d of source) {
        d.ctr = d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0
        d.cpc = d.clicks > 0 ? d.spend / d.clicks : 0
      }
    }
    return source.map(row => ({
      ...row,
      label: row.date ? row.date.slice(5) : '',
      ctr: Math.round((row.ctr || 0) * 100) / 100,
      cpc: Math.round(row.cpc || 0),
    }))
  })()

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
            {/* Filters */}
            <div className="filter-bar">
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
              {accounts.length > 1 && (
                <select
                  className="account-select"
                  value={accountFilter}
                  onChange={e => setAccountFilter(e.target.value)}
                >
                  <option value="all">Tất cả tài khoản</option>
                  {accounts.map(a => (
                    <option key={a.account_id} value={a.account_id}>{a.account_name || a.account_id}</option>
                  ))}
                </select>
              )}
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

            {/* Charts */}
            {daily.length > 1 && (
              <div className="chart-card">
                <div className="chart-header">
                  <div className="chart-title">Biểu đồ theo ngày</div>
                  <div className="chart-tabs">
                    {[
                      { key: 'spend', label: 'Chi phí' },
                      { key: 'traffic', label: 'Traffic' },
                      { key: 'efficiency', label: 'Hiệu quả' },
                    ].map(t => (
                      <button
                        key={t.key}
                        className={`chart-tab${chartTab === t.key ? ' active' : ''}`}
                        onClick={() => setChartTab(t.key)}
                      >{t.label}</button>
                    ))}
                  </div>
                </div>
                <div className="chart-body" style={{ height: 320 }}>
                  <DailyCharts daily={daily} chartTab={chartTab} />
                </div>
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
                      {data.map((row, i) => {
                        const isExpanded = expandedCampId === row.campaign_id
                        const campDaily = isExpanded ? getCampaignDaily(row.campaign_id) : []
                        return (
                          <React.Fragment key={row.campaign_id || i}>
                            <tr
                              className={`camp-row${isExpanded ? ' camp-expanded' : ''}`}
                              onClick={() => { setExpandedCampId(isExpanded ? null : row.campaign_id); setCampChartTab('spend') }}
                              style={{ cursor: 'pointer' }}
                            >
                              <td className="camp-name" title={row.campaign_name}>
                                <span className="expand-arrow">{isExpanded ? '▼' : '▶'}</span>
                                {row.campaign_name}
                              </td>
                              <td className="acc-name">{row.account_name}</td>
                              <td className="num">₫{fmt(row.spend)}</td>
                              <td className="num">{fmt(row.impressions)}</td>
                              <td className="num">{fmt(row.clicks)}</td>
                              <td className="num">{fmtPct(row.ctr)}</td>
                              <td className="num">₫{fmt(row.cpc, 0)}</td>
                              <td className="num">{fmt(row.reach)}</td>
                            </tr>
                            {isExpanded && (
                              <tr className="camp-detail-row">
                                <td colSpan={8} style={{ padding: 0 }}>
                                  <div className="camp-detail">
                                    {campDaily.length > 0 ? (
                                      <>
                                        <div className="camp-chart-tabs">
                                          {[
                                            { key: 'spend', label: 'Chi phí' },
                                            { key: 'traffic', label: 'Traffic' },
                                            { key: 'efficiency', label: 'Hiệu quả' },
                                          ].map(t => (
                                            <button
                                              key={t.key}
                                              className={`chart-tab${campChartTab === t.key ? ' active' : ''}`}
                                              onClick={e => { e.stopPropagation(); setCampChartTab(t.key) }}
                                            >{t.label}</button>
                                          ))}
                                        </div>
                                        <DailyCharts daily={campDaily} chartTab={campChartTab} />
                                      </>
                                    ) : (
                                      <div style={{ padding: 16, fontSize: 12, color: 'var(--mut)' }}>Không có dữ liệu theo ngày cho chiến dịch này</div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        )
                      })}
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

      {/* AI Floating Button */}
      {fbConnected && (
        <button className="ai-fab" onClick={() => setShowAI(v => !v)} title="Trợ lý AI Report">
          <span className="ai-fab-icon">🤖</span>
          <span className="ai-fab-label">AI</span>
        </button>
      )}

      {/* AI Chat Panel */}
      {showAI && (
        <ReportChatPanel
          reportData={{ totals, campaigns: data, daily, preset, accountFilter }}
          onClose={() => setShowAI(false)}
        />
      )}

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

        /* Filters */
        .filter-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .preset-bar { display: flex; gap: 8px; flex-wrap: wrap; }
        .account-select {
          padding: 7px 14px; border-radius: 9px; border: 1px solid var(--bd);
          background: var(--s1); color: var(--txt); font-size: 13px; font-weight: 500;
          cursor: pointer; font-family: inherit; min-width: 180px;
        }
        .account-select:focus { outline: none; border-color: var(--primary); }

        .ai-fab {
          position: fixed; bottom: 28px; right: 28px; z-index: 1100;
          display: flex; align-items: center; gap: 6px;
          padding: 12px 18px; border-radius: 50px; border: none;
          background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff;
          font-size: 13px; font-weight: 700; font-family: inherit;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(99,102,241,.5);
          transition: transform .15s, box-shadow .15s;
        }
        .ai-fab:hover { transform: translateY(-2px); box-shadow: 0 6px 28px rgba(99,102,241,.6); }
        .ai-fab-icon { font-size: 16px; }
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

        /* Chart card */
        .chart-card {
          background: var(--s1); border: 1px solid var(--bd); border-radius: 14px;
          padding: 18px 22px; margin-bottom: 16px;
        }
        .chart-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
        .chart-title { font-size: 14px; font-weight: 700; color: var(--txt); }
        .chart-tabs { display: flex; gap: 6px; }
        .chart-tab {
          padding: 5px 14px; border-radius: 8px; border: 1px solid var(--bd);
          background: var(--s2); color: var(--txt); font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all .15s; font-family: inherit;
        }
        .chart-tab:hover { background: var(--s3); }
        .chart-tab.active { background: var(--primary); border-color: var(--primary); color: #fff; }
        .chart-body { min-height: 280px; }

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

        .camp-row { transition: background .15s; }
        .camp-row:hover td { background: var(--s2); }
        .camp-row.camp-expanded td { background: rgba(99,102,241,.06); font-weight: 600; }
        .expand-arrow { font-size: 9px; color: var(--mut); margin-right: 8px; display: inline-block; width: 12px; }
        .camp-name { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
        .acc-name  { color: var(--mut); font-size: 12px; white-space: nowrap; }

        .camp-detail-row td { background: var(--s2) !important; border-bottom: 2px solid var(--bd) !important; }
        .camp-detail { padding: 16px 12px; }
        .camp-chart-tabs { display: flex; gap: 6px; margin-bottom: 12px; }


        .totals-row td {
          background: var(--s2) !important; border-top: 2px solid var(--bd);
          border-bottom: none;
        }
      `}</style>
    </DashboardLayout>
  )
}
