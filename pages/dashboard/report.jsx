import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../lib/AuthContext'
import { useLang } from '../../lib/LangContext'

const LineChart = dynamic(() => import('recharts').then(m => m.LineChart), { ssr: false })
const Line = dynamic(() => import('recharts').then(m => m.Line), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false })

const RANGE_OPTIONS = [
  { key: '7d',         label: '7 ngày',    labelEn: '7 days' },
  { key: '30d',        label: '30 ngày',   labelEn: '30 days' },
  { key: 'this_month', label: 'Tháng này', labelEn: 'This month' },
]

function fmtCompact(v, currency = 'VND') {
  if (v == null) return 'N/A'
  const n = Number(v)
  if (currency === 'VND') {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
    return n.toLocaleString('vi-VN')
  }
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K'
  return '$' + n.toLocaleString('en-US')
}

function fmtNum(v) {
  if (v == null) return 'N/A'
  return Number(v).toLocaleString('vi-VN')
}

function fmtMoney(v, currency = 'VND') {
  if (v == null) return 'N/A'
  if (currency === 'VND') return fmtCompact(v, 'VND') + ' ₫'
  return fmtCompact(v, currency)
}

// ─── BLOCK 1: KPI CARDS ──────────────────────────────────────

function KpiCard({ label, value, sub, delta, deltaColor, tooltip, level }) {
  const [showTip, setShowTip] = useState(false)
  const borderStyle = level === 'danger'
    ? { borderColor: 'rgba(239,68,68,.4)' }
    : level === 'warning'
    ? { borderColor: 'rgba(245,158,11,.4)' }
    : {}

  return (
    <div className="db-kpi-card" style={borderStyle}>
      <div className="db-kpi-top">
        <span className="db-kpi-label">{label}</span>
        {tooltip && (
          <span
            className="db-kpi-tip-wrap"
            onMouseEnter={() => setShowTip(true)}
            onMouseLeave={() => setShowTip(false)}
          >
            <span className="db-kpi-tip-icon">i</span>
            {showTip && <div className="db-kpi-tooltip">{tooltip}</div>}
          </span>
        )}
      </div>
      <div className="db-kpi-value">{value}</div>
      {sub && <div className="db-kpi-sub">{sub}</div>}
      {delta != null && (
        <div className="db-kpi-delta" style={{
          color: deltaColor === 'positive' ? '#10b981' : deltaColor === 'negative' ? '#ef4444' : 'var(--mut)'
        }}>
          <span className="db-kpi-arrow">{delta > 0 ? '↑' : delta < 0 ? '↓' : '→'}</span>
          {' '}{Math.abs(delta).toFixed(1)}%
        </div>
      )}
    </div>
  )
}

// ─── BLOCK 2: TREND CHART ────────────────────────────────────

function TrendChart({ daily, currency, lang, secondaryMetric }) {
  if (!daily || daily.length < 2) {
    return (
      <div className="db-trend-empty">
        {lang === 'vi' ? 'Chọn khoảng ≥ 7 ngày để xem xu hướng' : 'Select ≥ 7 days range to see trends'}
      </div>
    )
  }

  const metricLabel = secondaryMetric === 'roas' ? 'Purchase ROAS' : 'Cost per result'

  return (
    <div className="db-trend-chart-wrap">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={daily} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.2)" />
          <XAxis
            dataKey="date"
            tickFormatter={v => v ? v.slice(5) : ''}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(148,163,184,.3)' }}
          />
          <YAxis
            yAxisId="left"
            tickFormatter={v => fmtCompact(v, currency)}
            tick={{ fill: '#378ADD', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={v => secondaryMetric === 'roas' ? (v != null ? v.toFixed(1) + 'x' : '') : fmtCompact(v, currency)}
            tick={{ fill: '#1D9E75', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip content={<CustomTooltip currency={currency} secondaryMetric={secondaryMetric} metricLabel={metricLabel} />} />
          <Line yAxisId="left" type="monotone" dataKey="spend" stroke="#378ADD" strokeWidth={2} dot={false} name="Amount spent" />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey={secondaryMetric === 'roas' ? 'roas' : 'costPerResult'}
            stroke="#1D9E75"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
            name={metricLabel}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function CustomTooltip({ active, payload, label, currency, secondaryMetric, metricLabel }) {
  if (!active || !payload?.length) return null
  const spend = payload.find(p => p.dataKey === 'spend')?.value
  const secondary = payload.find(p => p.dataKey === (secondaryMetric === 'roas' ? 'roas' : 'costPerResult'))?.value
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,.3)' }}>
      <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e2e8f0', marginBottom: 3 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#378ADD', flexShrink: 0 }} />
        Amount spent: {fmtMoney(spend, currency)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e2e8f0' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1D9E75', flexShrink: 0 }} />
        {metricLabel}: {secondaryMetric === 'roas' ? (secondary != null ? secondary.toFixed(2) + 'x' : 'N/A') : fmtMoney(secondary, currency)}
      </div>
    </div>
  )
}

// ─── BLOCK 4: CAMPAIGN TABLE ─────────────────────────────────

const STATUS_MAP = {
  ACTIVE:          { label: 'Active',   labelVi: 'Đang chạy',  color: '#10b981', bg: 'rgba(16,185,129,.12)' },
  PAUSED:          { label: 'Paused',   labelVi: 'Tạm dừng',   color: '#94a3b8', bg: 'rgba(148,163,184,.12)' },
  IN_PROCESS:      { label: 'Learning', labelVi: 'Đang học',    color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
  CAMPAIGN_PAUSED: { label: 'Paused',   labelVi: 'Tạm dừng',   color: '#94a3b8', bg: 'rgba(148,163,184,.12)' },
  WITH_ISSUES:     { label: 'Issues',   labelVi: 'Có vấn đề',  color: '#ef4444', bg: 'rgba(239,68,68,.12)' },
}

const RANKING_MAP = {
  ABOVE_AVERAGE:    { label: 'Above average', labelVi: 'Trên TB',    color: '#10b981', bg: 'rgba(16,185,129,.1)' },
  AVERAGE:          { label: 'Average',       labelVi: 'Trung bình', color: '#64748b', bg: 'rgba(100,116,139,.1)' },
  BELOW_AVERAGE_35: { label: 'Bottom 35%',    labelVi: 'Bottom 35%', color: '#ef4444', bg: 'rgba(239,68,68,.1)' },
  BELOW_AVERAGE_20: { label: 'Bottom 20%',    labelVi: 'Bottom 20%', color: '#ef4444', bg: 'rgba(239,68,68,.12)' },
  BELOW_AVERAGE_10: { label: 'Bottom 10%',    labelVi: 'Bottom 10%', color: '#dc2626', bg: 'rgba(220,38,38,.15)' },
}

function StatusBadge({ status, lang }) {
  const s = STATUS_MAP[status] || STATUS_MAP.PAUSED
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 6,
      fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
      color: s.color, background: s.bg,
    }}>
      {lang === 'vi' ? s.labelVi : s.label}
    </span>
  )
}

function RankingBadge({ ranking, impressions, lang }) {
  if (!ranking || ranking === 'UNKNOWN' || impressions < 500) {
    return (
      <span style={{
        display: 'inline-block', padding: '2px 8px', borderRadius: 5,
        fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap', textAlign: 'center',
        color: '#94a3b8', background: 'rgba(148,163,184,.08)',
        border: '1px dashed rgba(148,163,184,.3)',
      }}>
        {lang === 'vi' ? 'Chưa đủ data' : 'Insufficient data'}
      </span>
    )
  }
  const r = RANKING_MAP[ranking] || { label: ranking, labelVi: ranking, color: '#94a3b8', bg: 'rgba(148,163,184,.1)' }
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 5,
      fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap', textAlign: 'center',
      color: r.color, background: r.bg,
    }}>
      {lang === 'vi' ? r.labelVi : r.label}
    </span>
  )
}

function CampaignFlags({ campaign, lang }) {
  const flags = []
  if (campaign.frequency > 5) flags.push({ icon: '🔴', text: 'Freq > 5' })
  if (campaign.effective_status === 'IN_PROCESS') flags.push({ icon: '🟠', text: 'Learning' })
  if (campaign.impressions < 500) flags.push({ icon: '⚪', text: lang === 'vi' ? 'Ít data' : 'Low data' })
  if (!flags.length) return null
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
      {flags.map((f, i) => <span key={i} style={{ fontSize: 10, color: '#94a3b8' }}>{f.icon} {f.text}</span>)}
    </div>
  )
}

function CampaignHypothesis({ campaign, lang }) {
  const hints = []
  if (campaign.quality_ranking && campaign.quality_ranking.startsWith('BELOW_AVERAGE') && campaign.impressions >= 500) {
    hints.push(lang === 'vi'
      ? '💡 Giả thuyết: thử refresh creative — Quality ranking thấp có thể do nội dung quảng cáo đã cũ'
      : '💡 Hypothesis: try refreshing creative — low Quality ranking may indicate ad fatigue')
  }
  if (campaign.frequency > 5) {
    hints.push(lang === 'vi'
      ? '💡 Giả thuyết: tần suất cao, thử mở rộng audience hoặc thay creative mới'
      : '💡 Hypothesis: high frequency, consider expanding audience or rotating creatives')
  }
  if (campaign.engagement_rate_ranking && campaign.engagement_rate_ranking.startsWith('BELOW_AVERAGE') && campaign.impressions >= 500) {
    hints.push(lang === 'vi'
      ? '💡 Giả thuyết: thử thay đổi CTA hoặc format quảng cáo — Engagement ranking thấp'
      : '💡 Hypothesis: try changing CTA or ad format — low Engagement ranking')
  }
  if (!hints.length) return null
  return (
    <div style={{ marginTop: 6 }}>
      {hints.map((h, i) => (
        <div key={i} style={{
          fontSize: 11, color: '#f59e0b', lineHeight: 1.5,
          padding: '4px 8px', background: 'rgba(245,158,11,.06)',
          borderRadius: 6, marginTop: 3,
        }}>{h}</div>
      ))}
    </div>
  )
}

function SortTh({ col, sort, onSort, className = '', children }) {
  const isActive = sort.key === col
  return (
    <th className={className} onClick={() => onSort(col)} style={{ cursor: 'pointer', userSelect: 'none' }}>
      {children}
      <span style={{ fontSize: 10, marginLeft: 3, opacity: isActive ? 1 : .4 }}>
        {isActive ? (sort.dir === 'desc' ? '▼' : '▲') : '▽'}
      </span>
    </th>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────

export default function Report() {
  const { user } = useAuth()
  const { lang } = useLang()
  const fbConnected = user?.fb_connected

  const [range, setRange] = useState('7d')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [secondaryMetric, setSecondaryMetric] = useState('roas')
  const [campSort, setCampSort] = useState({ key: 'spend', dir: 'desc' })

  const t = lang === 'vi' ? {
    title: 'Dashboard Overview',
    subtitle: 'Tổng quan hiệu suất quảng cáo',
    partialData: 'Dữ liệu chưa đầy đủ (bao gồm hôm nay)',
    trend: 'Xu hướng theo thời gian',
    campaigns: 'Chi tiết chiến dịch',
    refresh: 'Làm mới',
    exportCsv: 'Export CSV',
    noData: 'Không có dữ liệu',
    connectFb: 'Cần kết nối Facebook Ads',
    connectDesc: 'Tính năng này yêu cầu bạn kết nối tài khoản Facebook Ads để lấy dữ liệu.',
    connectBtn: 'Kết nối ngay →',
    reconnect: 'Kết nối lại →',
    networkErr: 'Không thể kết nối server. Kiểm tra lại kết nối mạng.',
    kpi: { spend: 'Amount spent', reach: 'Reach', frequency: 'Frequency', linkClicks: 'Link clicks', cpm: 'CPM', cpcLink: 'CPC (link)', costPerResult: 'Cost per result', purchaseRoas: 'Purchase ROAS' },
    reachTooltip: 'Số Accounts Center accounts đã thấy quảng cáo ít nhất 1 lần',
    cpmSub: '/ 1,000 impr.',
    cpcSub: '/ link click',
    mixedObj: 'N/A (mixed objectives)',
    campCols: { name: 'Chiến dịch', status: 'Status', spend: 'Spend', results: 'Results', cpr: 'Cost per result', roas: 'ROAS', quality: 'Quality', engagement: 'Engagement', conversion: 'Conversion' },
  } : {
    title: 'Dashboard Overview',
    subtitle: 'Advertising performance overview',
    partialData: 'Data is incomplete (includes today)',
    trend: 'Trend over time',
    campaigns: 'Campaign details',
    refresh: 'Refresh',
    exportCsv: 'Export CSV',
    noData: 'No data available',
    connectFb: 'Connect Facebook Ads',
    connectDesc: 'This feature requires connecting your Facebook Ads account.',
    connectBtn: 'Connect now →',
    reconnect: 'Reconnect →',
    networkErr: 'Cannot connect to server. Check your network.',
    kpi: { spend: 'Amount spent', reach: 'Reach', frequency: 'Frequency', linkClicks: 'Link clicks', cpm: 'CPM', cpcLink: 'CPC (link)', costPerResult: 'Cost per result', purchaseRoas: 'Purchase ROAS' },
    reachTooltip: 'The number of Accounts Center accounts that saw your ads at least once',
    cpmSub: '/ 1,000 impr.',
    cpcSub: '/ link click',
    mixedObj: 'N/A (mixed objectives)',
    campCols: { name: 'Campaign', status: 'Status', spend: 'Spend', results: 'Results', cpr: 'Cost per result', roas: 'ROAS', quality: 'Quality', engagement: 'Engagement', conversion: 'Conversion' },
  }

  const loadDashboard = useCallback((r) => {
    if (!fbConnected) return
    setLoading(true)
    setError('')
    fetch(`/api/fb/dashboard?range=${r}`)
      .then(res => res.json().then(body => ({ status: res.status, body })))
      .then(({ status, body }) => {
        if (status === 401 && body.error === 'token_expired') {
          setError(body.message)
          setData(null)
        } else if (!body.ok) {
          setError(body.error || body.message || 'Error loading dashboard')
        } else if (body.empty) {
          setData(null)
        } else {
          setData(body)
        }
      })
      .catch(() => setError(t.networkErr))
      .finally(() => setLoading(false))
  }, [fbConnected])

  useEffect(() => { loadDashboard(range) }, [range, loadDashboard])

  const currency = data?.currency || 'VND'
  const kpi = data?.block1_kpi
  const daily = data?.block2_trend?.daily
  const campaigns = data?.block4_campaigns || []

  const sortedCampaigns = useMemo(() => {
    const list = [...campaigns]
    list.sort((a, b) => {
      let av = a[campSort.key] ?? 0, bv = b[campSort.key] ?? 0
      if (typeof av === 'string') { av = av.toLowerCase(); bv = (bv || '').toLowerCase() }
      return av < bv ? (campSort.dir === 'asc' ? -1 : 1) : av > bv ? (campSort.dir === 'asc' ? 1 : -1) : 0
    })
    return list
  }, [campaigns, campSort])

  function handleCampSort(key) {
    setCampSort(prev => prev.key === key ? { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' })
  }

  function exportCSV() {
    if (!campaigns.length) return
    const headers = ['Campaign', 'Status', 'Spend', 'Results', 'Cost per result', 'ROAS', 'Quality', 'Engagement', 'Conversion']
    const rows = sortedCampaigns.map(c => [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      c.effective_status, c.spend, c.results,
      c.costPerResult || '', c.purchaseRoas || '',
      c.quality_ranking || '', c.engagement_rate_ranking || '', c.conversion_rate_ranking || '',
    ])
    const csv = '﻿' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `dashboard_${range}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function getDeltaColor(key, delta) {
    if (delta === 0) return 'neutral'
    if (key === 'spend') return 'neutral'
    if (['reach', 'linkClicks', 'purchaseRoas'].includes(key)) return delta > 0 ? 'positive' : 'negative'
    if (['cpm', 'cpcLink', 'costPerResult'].includes(key)) return delta < 0 ? 'positive' : 'negative'
    return 'neutral'
  }

  return (
    <DashboardLayout title={t.title}>
      <div className="db-page">

        <div className="db-header">
          <h1 className="db-title">{t.title}</h1>
          <p className="db-sub">{t.subtitle}</p>
        </div>

        {!fbConnected ? (
          <div className="db-fb-required">
            <div style={{ fontSize: 40 }}>🔗</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt)' }}>{t.connectFb}</div>
            <div style={{ fontSize: 13, color: 'var(--mut)', maxWidth: 380, lineHeight: 1.6 }}>{t.connectDesc}</div>
            <Link href="/settings/connect-facebook" className="db-fbr-btn">{t.connectBtn}</Link>
          </div>
        ) : (
          <>
            {/* Range selector */}
            <div className="db-range-bar">
              <div className="db-range-tabs">
                {RANGE_OPTIONS.map(r => (
                  <button
                    key={r.key}
                    className={`db-range-btn${range === r.key ? ' active' : ''}`}
                    onClick={() => setRange(r.key)}
                  >
                    {lang === 'vi' ? r.label : r.labelEn}
                  </button>
                ))}
              </div>
              <button className="db-refresh-btn" onClick={() => loadDashboard(range)} disabled={loading}>
                {loading ? '...' : `↻ ${t.refresh}`}
              </button>
            </div>

            {data?.range?.isPartial && (
              <div className="db-partial-banner">⚠️ {t.partialData}</div>
            )}

            {error && (
              <div className="db-err-banner">
                <span>⚠️ {error}</span>
                {error.includes('hết hạn') && <Link href="/settings/connect-facebook" className="db-reconn-link">{t.reconnect}</Link>}
              </div>
            )}

            {/* ── BLOCK 1: KPI CARDS ── */}
            {loading && !data ? (
              <div className="db-kpi-grid">
                {[1,2,3,4,5,6].map(i => <div key={i} className="db-kpi-card db-kpi-skel" />)}
              </div>
            ) : kpi ? (
              <div className="db-kpi-grid">
                <KpiCard label={t.kpi.spend} value={fmtMoney(kpi.spend.value, currency)} delta={kpi.spend.deltaPct} deltaColor="neutral" />
                <KpiCard label={t.kpi.reach} value={fmtCompact(kpi.reach.value)} delta={kpi.reach.deltaPct} deltaColor={getDeltaColor('reach', kpi.reach.deltaPct)} tooltip={t.reachTooltip} />
                <KpiCard label={t.kpi.frequency} value={kpi.frequency.value?.toFixed(1) || '0'} level={kpi.frequency.level} />
                <KpiCard label={t.kpi.linkClicks} value={fmtNum(kpi.linkClicks.value)} delta={kpi.linkClicks.deltaPct} deltaColor={getDeltaColor('linkClicks', kpi.linkClicks.deltaPct)} />
                <KpiCard label={t.kpi.cpm} value={fmtMoney(kpi.cpm.value, currency)} sub={t.cpmSub} delta={kpi.cpm.deltaPct} deltaColor={getDeltaColor('cpm', kpi.cpm.deltaPct)} />
                <KpiCard label={t.kpi.cpcLink} value={fmtMoney(kpi.cpcLink.value, currency)} sub={t.cpcSub} delta={kpi.cpcLink.deltaPct} deltaColor={getDeltaColor('cpcLink', kpi.cpcLink.deltaPct)} />
                {kpi.costPerResult.isMixedObjectives ? (
                  <KpiCard label={t.kpi.costPerResult} value={t.mixedObj} />
                ) : kpi.costPerResult.value != null ? (
                  <KpiCard
                    label={t.kpi.costPerResult}
                    value={fmtMoney(kpi.costPerResult.value, currency)}
                    delta={kpi.costPerResult.previous ? +((kpi.costPerResult.value - kpi.costPerResult.previous) / Math.abs(kpi.costPerResult.previous) * 100).toFixed(1) : null}
                    deltaColor={getDeltaColor('costPerResult', kpi.costPerResult.previous ? (kpi.costPerResult.value - kpi.costPerResult.previous) / Math.abs(kpi.costPerResult.previous) * 100 : 0)}
                  />
                ) : (
                  <KpiCard label={t.kpi.costPerResult} value="N/A" />
                )}
                {kpi.purchaseRoas.value != null && (
                  <KpiCard
                    label={t.kpi.purchaseRoas}
                    value={kpi.purchaseRoas.value.toFixed(2) + 'x'}
                    delta={kpi.purchaseRoas.previous ? +((kpi.purchaseRoas.value - kpi.purchaseRoas.previous) / Math.abs(kpi.purchaseRoas.previous) * 100).toFixed(1) : null}
                    deltaColor={getDeltaColor('purchaseRoas', kpi.purchaseRoas.previous ? (kpi.purchaseRoas.value - kpi.purchaseRoas.previous) / Math.abs(kpi.purchaseRoas.previous) * 100 : 0)}
                  />
                )}
              </div>
            ) : null}

            {/* ── BLOCK 2: TREND CHART ── */}
            <div className="db-block-card">
              <div className="db-block-header">
                <div className="db-block-title">{t.trend}</div>
                <div className="db-metric-toggle">
                  <button className={`db-mt-btn${secondaryMetric === 'roas' ? ' active' : ''}`} onClick={() => setSecondaryMetric('roas')}>ROAS</button>
                  <button className={`db-mt-btn${secondaryMetric === 'cpr' ? ' active' : ''}`} onClick={() => setSecondaryMetric('cpr')}>Cost per result</button>
                </div>
              </div>
              {loading && !daily ? (
                <div className="db-chart-skel" />
              ) : (
                <TrendChart daily={daily} currency={currency} lang={lang} secondaryMetric={secondaryMetric} />
              )}
            </div>

            {/* ── BLOCK 4: CAMPAIGN TABLE ── */}
            <div className="db-block-card">
              <div className="db-block-header">
                <div className="db-block-title">{t.campaigns}</div>
                {campaigns.length > 0 && (
                  <button className="db-export-btn" onClick={exportCSV}>⬇ {t.exportCsv}</button>
                )}
              </div>

              {loading && !campaigns.length ? (
                <div className="db-skel-rows">{[1,2,3,4].map(i => <div key={i} className="db-skel-row" />)}</div>
              ) : campaigns.length === 0 ? (
                <div className="db-empty-state">
                  <div style={{ fontSize: 32 }}>📭</div>
                  <div style={{ fontSize: 14, color: 'var(--mut)' }}>{t.noData}</div>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="db-camp-table-wrap db-desktop-only">
                    <table className="db-camp-table">
                      <thead>
                        <tr>
                          <SortTh col="name" sort={campSort} onSort={handleCampSort}>{t.campCols.name}</SortTh>
                          <SortTh col="effective_status" sort={campSort} onSort={handleCampSort}>{t.campCols.status}</SortTh>
                          <SortTh col="spend" sort={campSort} onSort={handleCampSort} className="db-num">{t.campCols.spend}</SortTh>
                          <SortTh col="results" sort={campSort} onSort={handleCampSort} className="db-num">{t.campCols.results}</SortTh>
                          <SortTh col="costPerResult" sort={campSort} onSort={handleCampSort} className="db-num">{t.campCols.cpr}</SortTh>
                          <SortTh col="purchaseRoas" sort={campSort} onSort={handleCampSort} className="db-num">{t.campCols.roas}</SortTh>
                          <th className="db-rank-th">{t.campCols.quality}</th>
                          <th className="db-rank-th">{t.campCols.engagement}</th>
                          <th className="db-rank-th">{t.campCols.conversion}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedCampaigns.map(c => (
                          <tr key={c.id}>
                            <td className="db-camp-name-cell">
                              <div className="db-camp-name" title={c.name}>{c.name}</div>
                              <CampaignFlags campaign={c} lang={lang} />
                              <CampaignHypothesis campaign={c} lang={lang} />
                            </td>
                            <td><StatusBadge status={c.effective_status} lang={lang} /></td>
                            <td className="db-num">{fmtMoney(c.spend, currency)}</td>
                            <td className="db-num">{c.results > 0 ? fmtNum(c.results) : '—'}</td>
                            <td className="db-num">{c.costPerResult != null ? fmtMoney(c.costPerResult, currency) : 'N/A'}</td>
                            <td className="db-num">{c.purchaseRoas != null ? c.purchaseRoas.toFixed(2) + 'x' : '—'}</td>
                            <td style={{ textAlign: 'center' }}><RankingBadge ranking={c.quality_ranking} impressions={c.impressions} lang={lang} /></td>
                            <td style={{ textAlign: 'center' }}><RankingBadge ranking={c.engagement_rate_ranking} impressions={c.impressions} lang={lang} /></td>
                            <td style={{ textAlign: 'center' }}><RankingBadge ranking={c.conversion_rate_ranking} impressions={c.impressions} lang={lang} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="db-camp-cards db-mobile-only">
                    {sortedCampaigns.map(c => (
                      <div key={c.id} className="db-camp-card">
                        <div className="db-cc-top">
                          <div className="db-cc-name">{c.name}</div>
                          <StatusBadge status={c.effective_status} lang={lang} />
                        </div>
                        <div className="db-cc-metrics">
                          <div className="db-cc-metric"><span className="db-cc-label">{t.campCols.spend}</span><span className="db-cc-val">{fmtMoney(c.spend, currency)}</span></div>
                          <div className="db-cc-metric"><span className="db-cc-label">{t.campCols.results}</span><span className="db-cc-val">{c.results > 0 ? fmtNum(c.results) : '—'}</span></div>
                          <div className="db-cc-metric"><span className="db-cc-label">{t.campCols.cpr}</span><span className="db-cc-val">{c.costPerResult != null ? fmtMoney(c.costPerResult, currency) : 'N/A'}</span></div>
                          <div className="db-cc-metric"><span className="db-cc-label">{t.campCols.roas}</span><span className="db-cc-val">{c.purchaseRoas != null ? c.purchaseRoas.toFixed(2) + 'x' : '—'}</span></div>
                        </div>
                        {c.impressions >= 500 && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                            <RankingBadge ranking={c.quality_ranking} impressions={c.impressions} lang={lang} />
                            <RankingBadge ranking={c.engagement_rate_ranking} impressions={c.impressions} lang={lang} />
                            <RankingBadge ranking={c.conversion_rate_ranking} impressions={c.impressions} lang={lang} />
                          </div>
                        )}
                        <CampaignFlags campaign={c} lang={lang} />
                        <CampaignHypothesis campaign={c} lang={lang} />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        /* Scope all styles under .db-page to avoid leaking */
        .db-page { padding: 24px; max-width: 1200px; }
        .db-page * { box-sizing: border-box; }

        .db-page .db-header { margin-bottom: 20px; }
        .db-page .db-title { font-size: 22px; font-weight: 700; color: var(--txt); margin: 0 0 4px; }
        .db-page .db-sub { font-size: 13px; color: var(--mut); margin: 0; }

        /* FB Required */
        .db-page .db-fb-required { display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--s1); border: 1px solid var(--bd); border-radius: 16px; padding: 48px 32px; text-align: center; gap: 12px; }
        .db-page .db-fbr-btn { background: #1877f2; color: #fff; border-radius: 9px; padding: 10px 20px; font-size: 13px; font-weight: 700; text-decoration: none; margin-top: 8px; transition: opacity .15s; }
        .db-page .db-fbr-btn:hover { opacity: .88; }

        /* Range bar */
        .db-page .db-range-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
        .db-page .db-range-tabs { display: flex; gap: 6px; }
        .db-page .db-range-btn { padding: 7px 16px; border-radius: 9px; border: 1px solid var(--bd); background: var(--s1); color: var(--txt); font-size: 13px; font-weight: 500; cursor: pointer; transition: all .15s; }
        .db-page .db-range-btn:hover { background: var(--s2); }
        .db-page .db-range-btn.active { background: var(--primary, #fe5f01); border-color: var(--primary, #fe5f01); color: #fff; font-weight: 700; }
        .db-page .db-refresh-btn { background: var(--s2); border: 1px solid var(--bd); border-radius: 8px; padding: 6px 14px; font-size: 12px; color: var(--txt); cursor: pointer; transition: background .15s; }
        .db-page .db-refresh-btn:hover:not(:disabled) { background: var(--s3); }
        .db-page .db-refresh-btn:disabled { opacity: .6; cursor: default; }

        /* Banners */
        .db-page .db-partial-banner { background: rgba(245,158,11,.08); border: 1px solid rgba(245,158,11,.25); border-radius: 10px; padding: 10px 16px; font-size: 12px; color: #f59e0b; margin-bottom: 16px; }
        .db-page .db-err-banner { display: flex; align-items: center; gap: 10px; background: rgba(255,69,96,.08); border: 1px solid rgba(255,69,96,.25); border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #ff8fa3; margin-bottom: 16px; }
        .db-page .db-reconn-link { margin-left: auto; color: #3b82f6; text-decoration: none; font-weight: 600; white-space: nowrap; }
        .db-page .db-reconn-link:hover { text-decoration: underline; }

        /* KPI Grid */
        .db-page .db-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
        @media (max-width: 1024px) { .db-page .db-kpi-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 640px) { .db-page .db-kpi-grid { grid-template-columns: repeat(2, 1fr); } }

        /* KPI Card */
        .db-page .db-kpi-card {
          background: var(--s1); border: 0.5px solid var(--bd); border-radius: 12px;
          padding: 14px 16px; position: relative; min-height: 92px;
        }
        .db-page .db-kpi-skel {
          background: linear-gradient(90deg, var(--s2) 25%, var(--s3) 50%, var(--s2) 75%);
          background-size: 200% 100%; animation: db-shimmer 1.2s infinite;
        }
        @keyframes db-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .db-page .db-kpi-top { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .db-page .db-kpi-label { font-size: 11px; font-weight: 600; color: var(--mut); text-transform: uppercase; letter-spacing: .3px; }
        .db-page .db-kpi-tip-wrap { position: relative; cursor: help; flex-shrink: 0; }
        .db-page .db-kpi-tip-icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 15px; height: 15px; border-radius: 50%;
          background: var(--s2); font-size: 9px; font-weight: 700; color: var(--mut);
          font-style: italic;
        }
        .db-page .db-kpi-tooltip {
          position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
          background: #1e293b; color: #e2e8f0; padding: 8px 12px; border-radius: 8px;
          font-size: 11px; line-height: 1.5; width: 260px; z-index: 10;
          text-transform: none; font-weight: 400; letter-spacing: 0;
          box-shadow: 0 4px 12px rgba(0,0,0,.3);
        }
        .db-page .db-kpi-value { font-size: 26px; font-weight: 500; color: var(--txt); line-height: 1.2; }
        .db-page .db-kpi-sub { font-size: 10px; color: var(--mut); margin-top: 2px; }
        .db-page .db-kpi-delta { font-size: 11px; font-weight: 600; margin-top: 5px; }
        .db-page .db-kpi-arrow { font-size: 12px; }

        /* Block card */
        .db-page .db-block-card { background: var(--s1); border: 0.5px solid var(--bd); border-radius: 14px; padding: 18px 22px; margin-bottom: 20px; }
        .db-page .db-block-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
        .db-page .db-block-title { font-size: 14px; font-weight: 700; color: var(--txt); }

        /* Metric toggle */
        .db-page .db-metric-toggle { display: flex; gap: 4px; background: var(--s2); border-radius: 8px; padding: 3px; }
        .db-page .db-mt-btn { padding: 5px 12px; border: none; border-radius: 6px; background: transparent; color: var(--mut); font-size: 11px; font-weight: 600; cursor: pointer; transition: all .15s; }
        .db-page .db-mt-btn.active { background: var(--s1); color: var(--txt); box-shadow: 0 1px 3px rgba(0,0,0,.1); }

        /* Chart */
        .db-page .db-chart-skel { height: 220px; border-radius: 8px; background: linear-gradient(90deg, var(--s2) 25%, var(--s3) 50%, var(--s2) 75%); background-size: 200% 100%; animation: db-shimmer 1.2s infinite; }
        .db-page .db-trend-empty { height: 120px; display: flex; align-items: center; justify-content: center; color: var(--mut); font-size: 13px; }
        .db-page .db-trend-chart-wrap { width: 100%; }

        /* Export */
        .db-page .db-export-btn { background: rgba(16,185,129,.12); border: 1px solid rgba(16,185,129,.3); border-radius: 8px; padding: 6px 14px; font-size: 12px; font-weight: 600; color: #10b981; cursor: pointer; transition: all .15s; }
        .db-page .db-export-btn:hover { background: rgba(16,185,129,.2); }

        /* Skeleton */
        .db-page .db-skel-rows { display: flex; flex-direction: column; gap: 10px; }
        .db-page .db-skel-row { height: 44px; border-radius: 8px; background: linear-gradient(90deg, var(--s2) 25%, var(--s3) 50%, var(--s2) 75%); background-size: 200% 100%; animation: db-shimmer 1.2s infinite; }
        .db-page .db-empty-state { display: flex; flex-direction: column; align-items: center; padding: 40px 20px; gap: 10px; }

        /* Campaign table (desktop) */
        .db-page .db-desktop-only { display: block; }
        .db-page .db-mobile-only { display: none; }
        @media (max-width: 768px) {
          .db-page .db-desktop-only { display: none !important; }
          .db-page .db-mobile-only { display: block !important; }
        }

        .db-page .db-camp-table-wrap { overflow-x: auto; }
        .db-page .db-camp-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .db-page .db-camp-table th {
          text-align: left; font-size: 11px; font-weight: 700; color: var(--mut);
          text-transform: uppercase; letter-spacing: .3px;
          padding: 8px 8px; border-bottom: 1px solid var(--bd); white-space: nowrap;
        }
        .db-page .db-camp-table th:hover { color: var(--txt); }
        .db-page .db-camp-table .db-num { text-align: right; }
        .db-page .db-camp-table .db-rank-th { font-size: 10px; text-align: center; min-width: 90px; }
        .db-page .db-camp-table td {
          padding: 10px 8px; border-bottom: 1px solid var(--bd);
          color: var(--txt); vertical-align: top;
        }
        .db-page .db-camp-table td.db-num { text-align: right; }
        .db-page .db-camp-table tbody tr:last-child td { border-bottom: none; }
        .db-page .db-camp-table tbody tr:hover td { background: var(--s2); }

        .db-page .db-camp-name-cell { max-width: 260px; }
        .db-page .db-camp-name { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 240px; }

        /* Campaign cards (mobile) */
        .db-page .db-camp-cards { display: flex; flex-direction: column; gap: 12px; }
        .db-page .db-camp-card { background: var(--bg); border: 1px solid var(--bd); border-radius: 12px; padding: 14px 16px; }
        .db-page .db-cc-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
        .db-page .db-cc-name { font-size: 13px; font-weight: 600; color: var(--txt); flex: 1; }
        .db-page .db-cc-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
        .db-page .db-cc-metric { display: flex; flex-direction: column; }
        .db-page .db-cc-label { font-size: 10px; color: var(--mut); font-weight: 600; text-transform: uppercase; }
        .db-page .db-cc-val { font-size: 14px; font-weight: 600; color: var(--txt); }
      `}</style>
    </DashboardLayout>
  )
}
