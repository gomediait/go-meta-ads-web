import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../lib/AuthContext'

const PAGE_SIZE = 20

const DATE_PRESETS = [
  { value: 'today',               label: 'Hôm nay'       },
  { value: 'yesterday',           label: 'Hôm qua'       },
  { value: 'last_7_days',         label: '7 ngày'        },
  { value: 'last_14_days',        label: '14 ngày'       },
  { value: 'last_28_days',        label: '28 ngày'       },
  { value: 'last_30_days',        label: '30 ngày'       },
  { value: 'last_90_days',        label: '90 ngày'       },
  { value: 'this_week_mon_today', label: 'Tuần này'      },
  { value: 'last_week_mon_sun',   label: 'Tuần trước'    },
  { value: 'this_month',          label: 'Tháng này'     },
  { value: 'last_month',          label: 'Tháng trước'   },
  { value: 'this_quarter',        label: 'Quý này'       },
  { value: 'this_year',           label: 'Năm nay'       },
  { value: 'last_year',           label: 'Năm ngoái'     },
  { value: 'maximum',             label: 'Toàn thời gian'},
  { value: 'custom',              label: '📅 Tùy chỉnh'  },
]

function getCustomTimeRange(preset) {
  const now   = new Date()
  const yyyy  = now.getFullYear()
  const pad   = n => String(n).padStart(2, '0')
  const fmt   = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  const today = fmt(now)
  if (preset === 'this_year') {
    return { since: `${yyyy}-01-01`, until: today }
  }
  if (preset === 'last_year') {
    return { since: `${yyyy-1}-01-01`, until: `${yyyy-1}-12-31` }
  }
  return null
}

const OBJECTIVES = [
  { value: '',                    label: 'Tất cả mục tiêu' },
  { value: 'OUTCOME_SALES',       label: 'Doanh số (Sales)' },
  { value: 'OUTCOME_LEADS',       label: 'Khách hàng tiềm năng (Leads)' },
  { value: 'OUTCOME_TRAFFIC',     label: 'Lưu lượng (Traffic)' },
  { value: 'OUTCOME_ENGAGEMENT',  label: 'Tương tác (Engagement)' },
  { value: 'OUTCOME_AWARENESS',   label: 'Nhận thức thương hiệu' },
  { value: 'OUTCOME_APP_PROMOTION', label: 'Quảng bá ứng dụng' },
  { value: 'CONVERSIONS',         label: 'Chuyển đổi (cũ)' },
  { value: 'LINK_CLICKS',         label: 'Nhấp link (cũ)' },
  { value: 'REACH',               label: 'Tiếp cận (cũ)' },
]

const OBJ_LABEL = Object.fromEntries(OBJECTIVES.slice(1).map(o => [o.value, o.label]))

const CUR_SYM = { VND: '₫', USD: '$', EUR: '€', GBP: '£', SGD: 'S$', AUD: 'A$', THB: '฿', MYR: 'RM', PHP: '₱', TWD: 'NT$' }
const VND_LIKE = new Set(['VND', 'JPY', 'KRW', 'IDR'])  // currencies with no decimal display

function curSym(currency) {
  return CUR_SYM[currency] || (currency ? currency + ' ' : '₫')
}

// Format a monetary value with correct currency symbol
function fmtMoney(v, currency, opts = {}) {
  const { zero = false } = opts
  if (v == null || isNaN(v)) return '—'
  const n = Number(v)
  if (!zero && n === 0) return '—'
  const cur = currency || 'VND'
  const sym = curSym(cur)
  if (VND_LIKE.has(cur)) {
    return sym + Math.round(n).toLocaleString('vi-VN')
  }
  return sym + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// For table cells: hide zero as "—"
function fmtVnd(v) {
  if (v == null || isNaN(v) || v === 0) return '—'
  return Number(v).toLocaleString('vi-VN')
}
function fmtNum(v) {
  if (v == null || isNaN(v) || v === 0) return '—'
  return Number(v).toLocaleString('vi-VN')
}
function fmtStatNum(v) {
  if (v == null || isNaN(v)) return '0'
  return Number(v).toLocaleString('vi-VN')
}
function fmtCtr(v)  { return v ? Number(v).toFixed(2) + '%' : '0.00%' }
function fmtRoas(v) { return v ? Number(v).toFixed(2) : '—' }
function fmtCpm(v, currency) {
  if (!v) return '—'
  return fmtMoney(v, currency || 'VND')
}
function fmtFreq(v) { return v ? Number(v).toFixed(2) : '—' }

function delta(cur, prev) {
  if (!prev || !cur) return null
  const d = cur - prev
  const pct = Math.abs(Math.round((d / prev) * 100))
  return { d, pct, up: d >= 0 }
}

function DeltaBadge({ cur, prev, format = 'vnd', invertColor = false }) {
  const dt = delta(cur, prev)
  if (!dt || dt.pct === 0) return null
  const good = invertColor ? !dt.up : dt.up
  return (
    <span className={`delta ${good ? 'delta-up' : 'delta-dn'}`}>
      {dt.up ? '▲' : '▼'} {dt.pct}%
    </span>
  )
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div className={`toast-item toast-${type}`}>
      {type === 'success' ? '✅' : '❌'} {msg}
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  )
}

function SkeletonRows({ cols }) {
  return <>
    {Array.from({ length: PAGE_SIZE }).map((_, i) => (
      <tr key={i} className="skel-tr">
        {Array.from({ length: cols }).map((_, j) => (
          <td key={j}><div className="skel-cell" /></td>
        ))}
      </tr>
    ))}
  </>
}

function BudgetBar({ budget, spend, pct, currency }) {
  const isOver  = pct > 100
  const color   = pct >= 85 ? 'var(--red)' : pct >= 65 ? 'var(--ylw)' : 'var(--grn)'
  const pctLabel = pct > 999 ? '>999%' : `${pct}%`
  return (
    <div className="budget-cell">
      <div className="budget-text">
        {fmtMoney(budget, currency)}<span className="budget-day"> /ngày</span>
        <span className="budget-pct" style={{ color }}> · {pctLabel}</span>
        {isOver && (
          <span
            className="budget-over-tip"
            title="Chi tiêu đã vượt ngân sách ngày. Thường xảy ra khi ngân sách bị giảm trong ngày hoặc Meta phân phối linh hoạt."
          >ⓘ</span>
        )}
      </div>
      <div className="budget-bar-track">
        <div className="budget-bar-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
      </div>
    </div>
  )
}

function StatusToggle({ item, onToggle, toggling }) {
  const isActive        = item.effective_status === 'ACTIVE'
  const isArchived      = item.effective_status === 'ARCHIVED'
  const isCampaignPaused= item.effective_status === 'CAMPAIGN_PAUSED'

  if (isArchived) return <span className="badge-status badge-archived">🗄 Archive</span>
  if (isCampaignPaused) return (
    <div className="status-toggle-cell">
      <span className="toggle-sw toggle-sw--disabled"><span className="toggle-knob" /></span>
      <span className="status-lbl status-lbl--paused">Camp. dừng</span>
    </div>
  )
  return (
    <div className="status-toggle-cell">
      <button
        className={`toggle-sw${isActive ? ' toggle-sw--on' : ''}`}
        onClick={() => onToggle(item.id, item.status)}
        disabled={toggling[item.id]}
        title={isActive ? 'Nhấn để tạm dừng' : 'Nhấn để bật lên'}
      >
        <span className="toggle-knob" />
      </button>
      <span className={`status-lbl ${isActive ? 'status-lbl--on' : 'status-lbl--off'}`}>
        {isActive ? 'ACTIVE' : 'PAUSED'}
      </span>
    </div>
  )
}

function SortIcon({ col, sortBy, sortDir }) {
  if (sortBy !== col) return <span className="sort-icon sort-none">↕</span>
  return <span className="sort-icon sort-active">{sortDir === 'asc' ? '↑' : '↓'}</span>
}

function BudgetModal({ adset, onClose, onSave, saving }) {
  const [inputVal, setInputVal] = useState(adset.daily_budget ? String(Math.round(adset.daily_budget)) : '')
  const [mode, setMode] = useState('amount')
  const [pct, setPct]   = useState('10')
  const currentBudget   = adset.daily_budget || 0
  const computedNew     = useMemo(() => {
    if (mode === 'amount') return Number(inputVal) || 0
    return Math.round(currentBudget * (1 + (Number(pct) || 0) / 100))
  }, [mode, inputVal, pct, currentBudget])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Chỉnh ngân sách</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="modal-adset-name">{adset.name}</div>
          <div className="modal-current">Hiện tại: <strong>{fmtMoney(currentBudget, adset.currency)}/ngày</strong></div>
          <div className="modal-mode-tabs">
            <button className={`mode-tab${mode==='amount'?' active':''}`} onClick={() => setMode('amount')}>Nhập số tiền</button>
            <button className={`mode-tab${mode==='percent'?' active':''}`} onClick={() => setMode('percent')}>Tăng theo %</button>
          </div>
          {mode === 'amount' ? (
            <div className="modal-field">
              <label className="modal-label">Ngân sách mới ({adset.currency || '₫'})</label>
              <input type="number" className="modal-input" value={inputVal} onChange={e => setInputVal(e.target.value)} placeholder={adset.currency === 'USD' ? 'VD: 150' : 'VD: 150000'} min="0" />
            </div>
          ) : (
            <div className="modal-field">
              <label className="modal-label">Tăng thêm (%)</label>
              <input type="number" className="modal-input" value={pct} onChange={e => setPct(e.target.value)} placeholder="VD: 20" min="1" max="500" />
            </div>
          )}
          <div className="modal-preview">
            Ngân sách mới: <strong style={{ color:'var(--grn)' }}>{fmtMoney(computedNew, adset.currency)}/ngày</strong>
            {currentBudget > 0 && computedNew > 0 && (
              <span className="modal-delta"> ({computedNew > currentBudget ? '+' : ''}{Math.round((computedNew / currentBudget - 1) * 100)}%)</span>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-cancel" onClick={onClose}>Huỷ</button>
          <button className="modal-confirm" onClick={() => computedNew > 0 && onSave(adset.id, computedNew)} disabled={saving || computedNew <= 0}>
            {saving ? 'Đang lưu…' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  )
}

function BulkBudgetModal({ count, onClose, onSave, saving }) {
  const [pct, setPct] = useState('10')
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Tăng NS nhanh</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="modal-current">Áp dụng cho <strong>{count}</strong> nhóm QC đã chọn</div>
          <div className="modal-field">
            <label className="modal-label">Tăng ngân sách thêm (%)</label>
            <input type="number" className="modal-input" value={pct} onChange={e => setPct(e.target.value)} placeholder="VD: 20" min="1" max="500" />
          </div>
          <div className="modal-preview">Tăng thêm <strong style={{ color:'var(--grn)' }}>{pct}%</strong> so với ngân sách hiện tại</div>
        </div>
        <div className="modal-footer">
          <button className="modal-cancel" onClick={onClose}>Huỷ</button>
          <button className="modal-confirm" onClick={() => onSave(Number(pct) || 0)} disabled={saving || !Number(pct)}>
            {saving ? 'Đang cập nhật…' : 'Tăng NS'}
          </button>
        </div>
      </div>
    </div>
  )
}

const DEFAULT_COLS = {
  campaign: true,    objective: false,
  reach: true,       impressions: true, cpm: false,      frequency: false,
  clicks: false,     linkClicks: false, cpc: false,
  messages: false,   costPerMsg: false,
  engagement: false, costPerEngage: false, reactions: false, comments: false, shares: false,
  addToCart: false,  checkout: false,
  videoViews: false, thruplays: false,
  leads: false,      costPerLead: false,
}

const COL_GROUPS = [
  {
    label: 'Hiển thị',
    cols: [
      { key: 'reach',       name: 'Tiếp cận'  },
      { key: 'impressions', name: 'Hiển thị'  },
      { key: 'frequency',   name: 'Tần suất'  },
      { key: 'cpm',         name: 'CPM'        },
    ]
  },
  {
    label: 'Nhấp & Click',
    cols: [
      { key: 'clicks',     name: 'Tổng click' },
      { key: 'linkClicks', name: 'Link click'  },
      { key: 'cpc',        name: 'Chi phí/click (CPC)' },
    ]
  },
  {
    label: 'Tương tác',
    cols: [
      { key: 'engagement',    name: 'Tổng tương tác' },
      { key: 'costPerEngage', name: 'Chi phí/tương tác' },
      { key: 'reactions',     name: 'Cảm xúc (Reaction)' },
      { key: 'comments',      name: 'Bình luận' },
      { key: 'shares',        name: 'Chia sẻ'   },
    ]
  },
  {
    label: 'Tin nhắn',
    cols: [
      { key: 'messages',   name: 'Lượt nhắn tin' },
      { key: 'costPerMsg', name: 'Chi phí/tin nhắn' },
    ]
  },
  {
    label: 'Video',
    cols: [
      { key: 'videoViews', name: 'Lượt xem video' },
      { key: 'thruplays',  name: 'ThruPlay (xem hết)' },
    ]
  },
  {
    label: 'Chuyển đổi',
    cols: [
      { key: 'addToCart',   name: 'Thêm vào giỏ' },
      { key: 'checkout',    name: 'Bắt đầu TT'   },
      { key: 'leads',       name: 'Lead'          },
      { key: 'costPerLead', name: 'Chi phí/lead'  },
    ]
  },
  {
    label: 'Chiến dịch',
    cols: [
      { key: 'campaign',  name: 'Tên chiến dịch' },
      { key: 'objective', name: 'Mục tiêu'        },
    ]
  },
]

const AI_SUGGESTIONS = [
  'Chiến dịch nào đang hoạt động tốt nhất?',
  'Nhóm nào nên tắt để tiết kiệm ngân sách?',
  'Làm sao tăng ROAS hiệu quả?',
  'Phân tích các cảnh báo đang có',
  'Tài khoản nào có hiệu quả tốt nhất?',
  'Chi tiêu hôm nay tổng bao nhiêu?',
]

function renderMd(text) {
  if (!text) return null
  const lines = text.split('\n')
  return lines.map((line, li) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    return (
      <span key={li}>
        {parts.map((p, pi) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={pi}>{p.slice(2, -2)}</strong>
            : p
        )}
        {li < lines.length - 1 && <br />}
      </span>
    )
  })
}

function AIChatPanel({ items, onClose }) {
  const [msgs, setMsgs] = useState([{
    role: 'assistant',
    content: `Xin chào! Tôi là trợ lý AI Meta Ads. Đang phân tích **${items.length} chiến dịch/nhóm** trong view hiện tại. Tôi có thể giúp bạn phân tích hiệu quả, tìm vấn đề và đề xuất tối ưu.`
  }])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  async function send(text) {
    if (!text?.trim() || loading) return
    const userMsg = text.trim()
    setMsgs(m => [...m, { role: 'user', content: userMsg }])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/ai/campaign-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, campaigns: items.slice(0, 40), history: msgs.slice(-8) })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Server error')
      setMsgs(m => [...m, { role: 'assistant', content: data.reply || 'Không có phản hồi.' }])
    } catch (e) {
      setMsgs(m => [...m, { role: 'assistant', content: `⚠️ ${e.message || 'Lỗi kết nối. Vui lòng thử lại.'}` }])
    }
    setLoading(false)
  }

  return (
    <div className="ai-panel">
      <div className="ai-panel-hd">
        <div className="ai-panel-title">
          <span style={{ fontSize: 22 }}>🤖</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Trợ lý AI Meta Ads</div>
            <div style={{ fontSize: 10, color: 'var(--mut)' }}>{items.length} chiến dịch đang xem · ~$0.004/tin nhắn</div>
          </div>
        </div>
        <button className="ai-panel-close" onClick={onClose} title="Đóng">×</button>
      </div>

      <div className="ai-msgs">
        {msgs.map((m, i) => (
          <div key={i} className={`ai-msg ai-msg-${m.role}`}>
            {m.role === 'assistant' && <span className="ai-avatar">🤖</span>}
            <div className="ai-bubble">{renderMd(m.content)}</div>
          </div>
        ))}
        {loading && (
          <div className="ai-msg ai-msg-assistant">
            <span className="ai-avatar">🤖</span>
            <div className="ai-bubble ai-typing"><span /><span /><span /></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {msgs.length <= 1 && (
        <div className="ai-suggests">
          {AI_SUGGESTIONS.map(s => (
            <button key={s} className="ai-suggest-btn" onClick={() => send(s)}>{s}</button>
          ))}
        </div>
      )}

      <div className="ai-input-row">
        <input
          className="ai-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send(input))}
          placeholder="Hỏi về chiến dịch quảng cáo..."
          disabled={loading}
          autoFocus
        />
        <button className="ai-send-btn" onClick={() => send(input)} disabled={loading || !input.trim()}>
          {loading ? '…' : '↑'}
        </button>
      </div>
    </div>
  )
}

export default function DashboardHome() {
  const { user, planName, isExpired } = useAuth()
  const fbConnected = user?.fb_connected

  const [level, setLevel]     = useState('adset')
  const [adsets, setAdsets]   = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage]       = useState(1)

  const [filters, setFilters] = useState({
    search: '', account_id: '', status: 'ALL',
    date_preset: 'today', compare: false,
    since: '', until: '',
    campaign_id: '', objective: '',
    cpa_max: '', roas_min: '', spend_min: '',
  })

  const [sortBy,  setSortBy]  = useState('spend')
  const [sortDir, setSortDir] = useState('desc')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [toggling,    setToggling]    = useState({})
  const [budgetModal, setBudgetModal] = useState(null)
  const [bulkModal,   setBulkModal]   = useState(false)
  const [budgetSaving, setBudgetSaving] = useState(false)
  const [toasts, setToasts]   = useState([])
  const [cols, setCols]       = useState(DEFAULT_COLS)
  const [showColPicker, setShowColPicker] = useState(false)
  const [showAI, setShowAI]   = useState(false)

  const abortRef = useRef(null)

  function addToast(msg, type = 'success') {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
  }
  function removeToast(id) { setToasts(t => t.filter(x => x.id !== id)) }

  const fetchAdsets = useCallback(async () => {
    if (!fbConnected) return
    if (abortRef.current) abortRef.current.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)
    setPage(1)
    setSelectedIds(new Set())
    try {
      // Resolve custom/computed presets to time_range
      let since = filters.since, until = filters.until
      let datePreset = filters.date_preset
      if (['this_year', 'last_year'].includes(datePreset)) {
        const range = getCustomTimeRange(datePreset)
        if (range) { since = range.since; until = range.until; datePreset = '' }
      }
      const isCustom = datePreset === 'custom'

      const params = new URLSearchParams({
        status:  filters.status,
        compare: filters.compare ? 'true' : 'false',
        level,
        ...(filters.account_id  && { account_id:  filters.account_id  }),
        ...(filters.campaign_id && { campaign_id: filters.campaign_id }),
        ...(filters.objective   && { objective:   filters.objective   }),
        // custom or computed range
        ...((isCustom || datePreset === '') && since && until
          ? { since, until }
          : { date_preset: isCustom ? 'today' : datePreset }),
      })
      const res  = await fetch(`/api/fb/campaigns?${params}`, { signal: ctrl.signal })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      if (data.ok) {
        setAdsets(data.adsets || [])
        if (data.accounts?.length) setAccounts(data.accounts)
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.error('[fetch]', err)
    } finally {
      setLoading(false)
    }
  }, [fbConnected, level, filters.date_preset, filters.status, filters.compare,
      filters.account_id, filters.campaign_id, filters.objective,
      filters.since, filters.until])

  useEffect(() => { fetchAdsets() }, [fetchAdsets])

  // Campaign list for dropdown (from loaded adset data)
  const campaignOptions = useMemo(() => {
    const seen = new Map()
    for (const a of adsets) {
      if (a.campaign_id && a.campaign_name && !seen.has(a.campaign_id))
        seen.set(a.campaign_id, a.campaign_name)
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name }))
  }, [adsets])

  const filtered = useMemo(() => {
    let list = [...adsets]
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase()
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        (a.campaign_name || '').toLowerCase().includes(q) ||
        (a.account_name  || '').toLowerCase().includes(q)
      )
    }
    const cpaMax   = Number(filters.cpa_max)   || 0
    const roasMin  = Number(filters.roas_min)  || 0
    const spendMin = Number(filters.spend_min) || 0
    if (spendMin > 0) list = list.filter(a => a.spend >= spendMin)
    if (cpaMax  > 0) list = list.filter(a => a.cpa  === 0 || a.cpa  <= cpaMax)
    if (roasMin > 0) list = list.filter(a => a.roas === 0 || a.roas >= roasMin)

    list.sort((a, b) => {
      if (sortBy === 'spend') {
        const aScore = (a.effective_status === 'ACTIVE' ? 2 : 0) + ((a.spend || 0) > 0 ? 1 : 0)
        const bScore = (b.effective_status === 'ACTIVE' ? 2 : 0) + ((b.spend || 0) > 0 ? 1 : 0)
        if (aScore !== bScore) return sortDir === 'desc' ? bScore - aScore : aScore - bScore
      }
      let av = a[sortBy] ?? 0, bv = b[sortBy] ?? 0
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      return av < bv ? (sortDir === 'asc' ? -1 : 1) : av > bv ? (sortDir === 'asc' ? 1 : -1) : 0
    })
    return list
  }, [adsets, filters.search, filters.cpa_max, filters.roas_min, filters.spend_min, sortBy, sortDir])

  const stats = useMemo(() => {
    const active = filtered.filter(a => a.effective_status === 'ACTIVE').length

    // Aggregate per currency (USD, VND, etc. stay separate)
    const curMap = {}
    for (const a of filtered) {
      const c = a.currency || 'VND'
      if (!curMap[c]) curMap[c] = { spend: 0, budget: 0, purchases: 0, revenue: 0 }
      curMap[c].spend    += (a.spend        || 0)
      curMap[c].budget   += (a.daily_budget || 0)
      curMap[c].purchases+= (a.purchases    || 0)
      curMap[c].revenue  += (a.revenue      || 0)
    }
    const currencies = Object.keys(curMap)

    // Currency-independent totals
    const totalPurchases = filtered.reduce((s, a) => s + (a.purchases  || 0), 0)
    const totalReach     = filtered.reduce((s, a) => s + (a.reach      || 0), 0)
    const totalImpr      = filtered.reduce((s, a) => s + (a.impressions|| 0), 0)
    const totalClicks    = filtered.reduce((s, a) => s + (a.clicks     || 0), 0)
    const avgCtr         = totalImpr > 0 ? (totalClicks / totalImpr * 100) : 0
    const acctSet        = new Set(filtered.map(a => a.account_id))

    // Build display strings for monetary stats (one line per currency)
    const spendStr  = currencies.length
      ? currencies.map(c => fmtMoney(curMap[c].spend,  c, { zero: true })).join(' + ')
      : '₫0'
    const budgetStr = currencies.length
      ? currencies.map(c => fmtMoney(curMap[c].budget, c, { zero: true })).join(' + ')
      : '₫0'
    const cpaArr = currencies.map(c => {
      const { spend, purchases } = curMap[c]
      return purchases > 0 ? fmtMoney(spend / purchases, c) : null
    }).filter(Boolean)
    const cpaStr = cpaArr.length ? cpaArr.join(' / ') : '—'
    const roasVals = currencies.map(c => {
      const { spend, revenue } = curMap[c]
      return spend > 0 && revenue > 0 ? revenue / spend : 0
    }).filter(r => r > 0)
    const avgRoas = roasVals.length ? roasVals.reduce((a, b) => a + b, 0) / roasVals.length : 0
    const revenueStr = currencies.length
      ? currencies.map(c => fmtMoney(curMap[c].revenue, c, { zero: true })).join(' + ')
      : '₫0'

    return { active, currencies, curMap, spendStr, budgetStr, cpaStr, revenueStr, avgRoas,
             totalPurchases, totalReach, totalImpr, totalClicks, avgCtr, accountCount: acctSet.size }
  }, [filtered])

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function setFilter(key, val) { setFilters(f => ({ ...f, [key]: val })); setPage(1) }
  function handleSort(col) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('desc') }
    setPage(1)
  }

  const allPageSelected = pageItems.length > 0 && pageItems.every(a => selectedIds.has(a.id))
  function togglePageSelect() {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (allPageSelected) pageItems.forEach(a => next.delete(a.id))
      else pageItems.forEach(a => next.add(a.id))
      return next
    })
  }
  function toggleRow(id) {
    setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  async function toggleItem(itemId, currentStatus) {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    setToggling(t => ({ ...t, [itemId]: true }))
    try {
      const res = await fetch('/api/fb/campaign-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: itemId, status: newStatus })
      })
      if (res.ok) {
        setAdsets(prev => prev.map(a => a.id === itemId ? { ...a, status: newStatus, effective_status: newStatus } : a))
        addToast(`Đã ${newStatus === 'ACTIVE' ? 'bật' : 'tắt'}`)
      } else {
        addToast('Lỗi khi đổi trạng thái', 'error')
      }
    } catch { addToast('Lỗi kết nối', 'error') }
    finally { setToggling(t => ({ ...t, [itemId]: false })) }
  }

  async function handleBudgetSave(adsetId, newBudget) {
    setBudgetSaving(true)
    try {
      const res  = await fetch('/api/fb/budget-update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adset_id: adsetId, new_budget: newBudget, budget_type: 'daily' })
      })
      const data = await res.json()
      if (data.ok) {
        setAdsets(prev => prev.map(a => a.id === adsetId ? { ...a, daily_budget: newBudget } : a))
        addToast('Đã cập nhật ngân sách')
        setBudgetModal(null)
      } else addToast(data.error || 'Lỗi cập nhật NS', 'error')
    } catch { addToast('Lỗi kết nối', 'error') }
    finally { setBudgetSaving(false) }
  }

  async function handleBulkBudget(pct) {
    if (!pct || selectedIds.size === 0) return
    setBudgetSaving(true)
    let ok = 0, fail = 0
    for (const adset of adsets.filter(a => selectedIds.has(a.id) && a.daily_budget > 0)) {
      const newBudget = Math.round(adset.daily_budget * (1 + pct / 100))
      try {
        const res  = await fetch('/api/fb/budget-update', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adset_id: adset.id, new_budget: newBudget, budget_type: 'daily' })
        })
        const data = await res.json()
        if (data.ok) { setAdsets(prev => prev.map(a => a.id === adset.id ? { ...a, daily_budget: newBudget } : a)); ok++ }
        else fail++
      } catch { fail++ }
    }
    setBudgetSaving(false); setBulkModal(false)
    if (ok)   addToast(`Đã tăng NS ${ok} nhóm QC`)
    if (fail) addToast(`${fail} nhóm thất bại`, 'error')
  }

  function toggleCol(key) { setCols(c => ({ ...c, [key]: !c[key] })) }

  async function handleBulkToggle(newStatus) {
    const targets = adsets.filter(a =>
      selectedIds.has(a.id) &&
      a.effective_status !== 'ARCHIVED' &&
      a.effective_status !== newStatus
    )
    if (!targets.length) { addToast('Không có mục nào phù hợp', 'error'); return }
    let ok = 0
    for (const item of targets) {
      setToggling(t => ({ ...t, [item.id]: true }))
      try {
        const r = await fetch('/api/fb/campaign-toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaign_id: item.id, status: newStatus })
        })
        if ((await r.json()).ok !== false) {
          setAdsets(prev => prev.map(a => a.id === item.id ? { ...a, status: newStatus, effective_status: newStatus } : a))
          ok++
        }
      } catch {}
      setToggling(t => ({ ...t, [item.id]: false }))
    }
    if (ok) addToast(`Đã ${newStatus === 'ACTIVE' ? 'bật' : 'tắt'} ${ok} mục`)
  }

  const expireDate = user?.expire_at ? new Date(user.expire_at).toLocaleDateString('vi-VN') : null
  const cpaMaxVal  = Number(filters.cpa_max)  || 0
  const roasMinVal = Number(filters.roas_min) || 0

  const Th = ({ col, children, className = '' }) => (
    <th className={`th-sort ${className}`} onClick={() => handleSort(col)}>
      {children} <SortIcon col={col} sortBy={sortBy} sortDir={sortDir} />
    </th>
  )

  // How many visible columns total (for skeleton)
  const colCount = 6
    + Object.values(cols).filter(Boolean).length
    + 4 // purchases, cpa, roas, revenue always visible

  return (
    <DashboardLayout title="Quản lý chiến dịch">
      <div className="dh-root">

        {/* Welcome banner */}
        <div className="welcome-banner">
          <div className="wb-left">
            <div className="wb-greeting">Xin chào, {user?.name || 'bạn'}</div>
            <div className="wb-sub">
              Gói: <strong>{planName}</strong>
              {expireDate && !isExpired && <span className="expire-ok"> · Hết hạn {expireDate}</span>}
              {isExpired && <span className="expire-warn"> · Đã hết hạn</span>}
            </div>
          </div>
          <div className="wb-right">
            {isExpired && <Link href="/mua-goi" className="upgrade-btn">Gia hạn ngay →</Link>}
            {!isExpired && user?.plan === 'trial' && (
              <Link href="/mua-goi" className="upgrade-btn upgrade-btn--soft">Nâng cấp →</Link>
            )}
          </div>
        </div>

        {!fbConnected ? (
          <div className="fb-cta">
            <div className="fb-cta-icon">🔗</div>
            <div className="fb-cta-body">
              <div className="fb-cta-title">Kết nối tài khoản Facebook Ads để bắt đầu</div>
              <div className="fb-cta-desc">Sau khi kết nối, bạn có thể quản lý chiến dịch, xem báo cáo và tối ưu ngân sách.</div>
            </div>
            <Link href="/settings/connect-facebook" className="fb-cta-btn">Kết nối ngay</Link>
          </div>
        ) : (
          <>
            {/* Filter bar */}
            <div className="filter-bar">
              {/* Row 1: Level + main filters */}
              <div className="filter-row">
                <div className="level-tabs">
                  <button className={`level-tab${level==='adset'?' active':''}`}    onClick={() => { setLevel('adset');    setFilter('campaign_id', '') }}>Nhóm QC</button>
                  <button className={`level-tab${level==='campaign'?' active':''}`} onClick={() => { setLevel('campaign'); setFilter('campaign_id', '') }}>Chiến dịch</button>
                </div>

                <input
                  className="filter-search"
                  placeholder={level === 'adset' ? 'Tìm nhóm QC, chiến dịch...' : 'Tìm chiến dịch...'}
                  value={filters.search}
                  onChange={e => setFilter('search', e.target.value)}
                />

                <select className="filter-sel" value={filters.account_id} onChange={e => setFilter('account_id', e.target.value)}>
                  <option value="">Tất cả tài khoản</option>
                  {accounts.map(a => <option key={a.account_id} value={a.account_id}>{a.account_name}</option>)}
                </select>

                <select className="filter-sel filter-sel--date" value={filters.date_preset} onChange={e => setFilter('date_preset', e.target.value)}>
                  {DATE_PRESETS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>

                {filters.date_preset === 'custom' && (
                  <div className="custom-range">
                    <input
                      type="date" className="filter-date-input"
                      value={filters.since}
                      onChange={e => setFilter('since', e.target.value)}
                    />
                    <span className="custom-range-sep">→</span>
                    <input
                      type="date" className="filter-date-input"
                      value={filters.until}
                      onChange={e => setFilter('until', e.target.value)}
                    />
                    {filters.since && filters.until && (
                      <button className="custom-range-go" onClick={fetchAdsets}>Áp dụng</button>
                    )}
                  </div>
                )}

                <select className="filter-sel" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ACTIVE">Đang chạy</option>
                  <option value="PAUSED">Đã dừng</option>
                </select>

                <button className="filter-refresh" onClick={fetchAdsets} disabled={loading}>
                  {loading ? '…' : '↻ Làm mới'}
                </button>
              </div>

              {/* Row 2: Advanced filters */}
              <div className="filter-row filter-row--adv">
                {level === 'adset' && (
                  <select className="filter-sel" value={filters.campaign_id} onChange={e => setFilter('campaign_id', e.target.value)}>
                    <option value="">Tất cả chiến dịch</option>
                    {campaignOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}

                <select className="filter-sel" value={filters.objective} onChange={e => setFilter('objective', e.target.value)}>
                  {OBJECTIVES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>

                <div className="filter-threshold">
                  <span className="filter-label">Chi tối thiểu ₫</span>
                  <input type="number" className="filter-num" placeholder="0" value={filters.spend_min}
                    onChange={e => setFilter('spend_min', e.target.value)} min="0" />
                </div>

                <div className="filter-threshold">
                  <span className="filter-label">CPA tối đa ₫</span>
                  <input type="number" className="filter-num" placeholder="0" value={filters.cpa_max}
                    onChange={e => setFilter('cpa_max', e.target.value)} min="0" />
                </div>

                <div className="filter-threshold">
                  <span className="filter-label">ROAS tối thiểu</span>
                  <input type="number" className="filter-num" placeholder="0" value={filters.roas_min}
                    onChange={e => setFilter('roas_min', e.target.value)} min="0" step="0.1" />
                </div>

                <label className="filter-compare">
                  <input type="checkbox" checked={filters.compare} onChange={e => setFilter('compare', e.target.checked)} />
                  <span>So sánh hôm qua</span>
                </label>

                <div className="col-picker-wrap">
                  <button className="col-picker-btn" onClick={() => setShowColPicker(v => !v)}>
                    Cột hiển thị {showColPicker ? '▲' : '▼'}
                  </button>
                  {showColPicker && (
                    <div className="col-picker-panel">
                      {COL_GROUPS.map(group => (
                        <div key={group.label} className="col-group">
                          <div className="col-group-label">{group.label}</div>
                          {group.cols
                            .filter(c => c.key !== 'campaign' || level === 'adset')
                            .map(c => (
                              <label key={c.key} className="col-chk">
                                <input type="checkbox" checked={!!cols[c.key]} onChange={() => toggleCol(c.key)} />
                                {c.name}
                              </label>
                            ))
                          }
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats bar */}
            <div className="stats-bar">
              <div className="stat-item">
                <div className="stat-num stat-primary">{stats.active}</div>
                <div className="stat-lbl">Đang chạy</div>
              </div>
              <div className="stat-sep" />
              <div className="stat-item">
                <div className="stat-num stat-money">{stats.spendStr}</div>
                <div className="stat-lbl">Tổng chi tiêu</div>
              </div>
              <div className="stat-sep" />
              <div className="stat-item">
                <div className="stat-num stat-money">{stats.budgetStr}</div>
                <div className="stat-lbl">Tổng NS/ngày</div>
              </div>
              <div className="stat-sep" />
              <div className="stat-item">
                <div className="stat-num stat-green">{fmtStatNum(stats.totalPurchases)}</div>
                <div className="stat-lbl">Lượt mua</div>
              </div>
              <div className="stat-sep" />
              <div className="stat-item">
                <div className="stat-num stat-money">{stats.revenueStr}</div>
                <div className="stat-lbl">Doanh thu</div>
              </div>
              <div className="stat-sep" />
              <div className="stat-item">
                <div className="stat-num">{stats.avgRoas > 0 ? fmtRoas(stats.avgRoas) : '—'}</div>
                <div className="stat-lbl">ROAS TB</div>
              </div>
              <div className="stat-sep" />
              <div className="stat-item">
                <div className="stat-num stat-money">{stats.cpaStr}</div>
                <div className="stat-lbl">CPA TB</div>
              </div>
              <div className="stat-sep" />
              <div className="stat-item">
                <div className="stat-num">{fmtStatNum(stats.totalReach)}</div>
                <div className="stat-lbl">Tiếp cận</div>
              </div>
              <div className="stat-sep" />
              <div className="stat-item">
                <div className="stat-num">{fmtStatNum(stats.totalImpr)}</div>
                <div className="stat-lbl">Hiển thị</div>
              </div>
              <div className="stat-sep" />
              <div className="stat-item">
                <div className="stat-num">{stats.avgCtr > 0 ? fmtCtr(stats.avgCtr) : '—'}</div>
                <div className="stat-lbl">CTR TB</div>
              </div>
              <div className="stat-sep" />
              <div className="stat-item stat-item--btn">
                <button
                  className="btn-quick-budget"
                  onClick={() => {
                    if (selectedIds.size === 0) { addToast('Chọn ít nhất 1 nhóm QC', 'error'); return }
                    setBulkModal(true)
                  }}
                >+ Tăng NS</button>
              </div>
            </div>

            {/* Result count */}
            <div className="result-info">
              {loading ? (
                <span className="result-loading">Đang tải dữ liệu…</span>
              ) : (
                <span>{filtered.length} {level === 'adset' ? 'nhóm QC' : 'chiến dịch'}{filters.search || filters.campaign_id || filters.objective || filters.cpa_max || filters.roas_min ? ' (đang lọc)' : ''}</span>
              )}
              {selectedIds.size > 0 && (
                <div className="sel-bar">
                  Đã chọn <strong>{selectedIds.size}</strong>
                  <button className="sel-clear" onClick={() => setSelectedIds(new Set())}>Bỏ chọn</button>
                  <button className="sel-act sel-act--on"  onClick={() => handleBulkToggle('ACTIVE')}>▶ Bật tất cả</button>
                  <button className="sel-act sel-act--off" onClick={() => handleBulkToggle('PAUSED')}>⏸ Tắt tất cả</button>
                  <button className="sel-budget" onClick={() => setBulkModal(true)}>↑ Tăng NS</button>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="table-wrap">
              <table className="adset-table">
                <thead>
                  <tr>
                    <th className="th-chk">
                      <input type="checkbox" checked={allPageSelected} onChange={togglePageSelect} title="Chọn tất cả trang này" />
                    </th>
                    <Th col="name" className="th-name">{level === 'adset' ? 'Nhóm quảng cáo' : 'Chiến dịch'}</Th>
                    <Th col="account_name">Tài khoản</Th>
                    {level === 'adset' && cols.campaign  && <Th col="campaign_name">Chiến dịch</Th>}
                    {cols.objective && <th>Mục tiêu</th>}
                    <th className="th-status">Trạng thái</th>
                    <Th col="spend" className="th-num">Chi tiêu</Th>
                    <Th col="daily_budget" className="th-budget">Ngân sách</Th>
                    <Th col="purchases"   className="th-num">Lượt mua</Th>
                    <Th col="cpa"         className="th-num">CPA</Th>
                    <Th col="roas"        className="th-num">ROAS</Th>
                    <Th col="revenue"     className="th-num">Doanh thu</Th>
                    {cols.reach        && <Th col="reach"        className="th-num">Tiếp cận</Th>}
                    {cols.impressions  && <Th col="impressions"  className="th-num">Hiển thị</Th>}
                    {cols.frequency    && <Th col="frequency"    className="th-num">Tần suất</Th>}
                    {cols.cpm          && <Th col="cpm"          className="th-num">CPM</Th>}
                    {cols.clicks       && <Th col="clicks"       className="th-num">Click</Th>}
                    {cols.linkClicks   && <Th col="linkClicks"   className="th-num">Link click</Th>}
                    {cols.cpc          && <Th col="cpc"          className="th-num">CPC</Th>}
                    {cols.messages     && <Th col="messages"     className="th-num">Tin nhắn</Th>}
                    {cols.costPerMsg   && <Th col="costPerMsg"   className="th-num">CP/Tin nhắn</Th>}
                    {cols.engagement   && <Th col="engagement"   className="th-num">Tương tác</Th>}
                    {cols.costPerEngage&& <Th col="costPerEngage"className="th-num">CP/Tương tác</Th>}
                    {cols.reactions    && <Th col="reactions"    className="th-num">Cảm xúc</Th>}
                    {cols.comments     && <Th col="comments"     className="th-num">Bình luận</Th>}
                    {cols.shares       && <Th col="shares"       className="th-num">Chia sẻ</Th>}
                    {cols.videoViews   && <Th col="videoViews"   className="th-num">Xem video</Th>}
                    {cols.thruplays    && <Th col="thruplays"    className="th-num">ThruPlay</Th>}
                    {cols.addToCart    && <Th col="addToCart"    className="th-num">Thêm giỏ</Th>}
                    {cols.checkout     && <Th col="checkout"     className="th-num">Bắt đầu TT</Th>}
                    {cols.leads        && <Th col="leads"        className="th-num">Lead</Th>}
                    {cols.costPerLead  && <Th col="costPerLead"  className="th-num">CP/Lead</Th>}
                    <th className="th-ctr" onClick={() => handleSort('ctr')}>CTR <SortIcon col="ctr" sortBy={sortBy} sortDir={sortDir} /></th>
                    <th className="td-warn">Cảnh báo</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && adsets.length === 0 ? (
                    <SkeletonRows cols={colCount} />
                  ) : pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={colCount + 5} className="empty-td">
                        <div className="camp-empty">
                          <div className="empty-icon">📭</div>
                          <div className="empty-text">Không có dữ liệu</div>
                          <div className="empty-sub">
                            {filters.search || filters.cpa_max || filters.roas_min
                              ? 'Thử thay đổi điều kiện lọc'
                              : 'Chưa có chiến dịch ACTIVE hoặc PAUSED trong tài khoản được chọn'}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : pageItems.map(item => {
                    const isHighCpa    = cpaMaxVal  > 0 && item.cpa  > cpaMaxVal
                    const isLowRoas    = roasMinVal > 0 && item.roas > 0 && item.roas < roasMinVal
                    const isHighBudget = (item.budget_util_pct || 0) >= 85
                    const isLosingMoney= (item.roas || 0) > 0 && item.roas < 1
                    const noConversion = (item.spend || 0) > 200000 && (item.purchases || 0) === 0
                    const selected   = selectedIds.has(item.id)
                    const doComp     = filters.compare
                    return (
                      <tr key={item.id} className={`adset-row${selected ? ' row-selected' : ''}${loading ? ' row-dimmed' : ''}`}>
                        <td className="td-chk">
                          <input type="checkbox" checked={selected} onChange={() => toggleRow(item.id)} />
                        </td>

                        <td className="td-name">
                          <div className="adset-name-main">{item.name}</div>
                          {level === 'adset' && (
                            <div className="adset-name-sub">
                              {item.account_name}
                              {item.campaign_name && !cols.campaign && <> · {item.campaign_name}</>}
                            </div>
                          )}
                        </td>

                        <td className="td-account">
                          <div className="text-sm">{item.account_name}</div>
                          <div className="sub-text">{item.currency}</div>
                        </td>

                        {level === 'adset' && cols.campaign && (
                          <td className="td-campaign">
                            <div className="text-sm text-ellipsis">{item.campaign_name || '—'}</div>
                            <div className="sub-text status-badge"
                              style={{ color: item.campaign_effective_status === 'ACTIVE' ? 'var(--grn)' : 'var(--mut)' }}>
                              {item.campaign_effective_status || ''}
                            </div>
                          </td>
                        )}

                        {cols.objective && (
                          <td><span className="obj-badge">{OBJ_LABEL[item.objective] || item.objective || '—'}</span></td>
                        )}

                        <td className="td-status">
                          <StatusToggle item={item} onToggle={toggleItem} toggling={toggling} />
                        </td>

                        <td className="td-num">
                          <div>{fmtMoney(item.spend, item.currency)}</div>
                          {doComp && <DeltaBadge cur={item.spend} prev={item.yesterday_spend} />}
                        </td>

                        <td className="td-budget">
                          {item.daily_budget ? (
                            <div className="budget-wrap" onClick={() => level === 'adset' && setBudgetModal({ adset: item })} title={level==='adset'?'Nhấn để chỉnh':'Campaign budget'}>
                              <BudgetBar budget={item.daily_budget} spend={item.spend} pct={item.budget_util_pct} currency={item.currency} />
                            </div>
                          ) : item.lifetime_budget ? (
                            <div className="budget-text-small">{fmtMoney(item.lifetime_budget, item.currency)}<span className="budget-day"> trọn đời</span></div>
                          ) : (
                            <span className="sub-text cbo-tag" title="CBO — Campaign Budget Optimization: Ngân sách được phân bổ tự động từ chiến dịch, không đặt riêng ở nhóm QC">CBO ⓘ</span>
                          )}
                        </td>

                        <td className="td-num">
                          {item.purchases > 0 ? (
                            <div>
                              <span className="val-green">{fmtNum(item.purchases)}</span>
                              {doComp && <DeltaBadge cur={item.purchases} prev={item.yesterday_purchases} />}
                            </div>
                          ) : <span className="val-muted">—</span>}
                        </td>

                        <td className="td-num">
                          {item.cpa > 0 ? (
                            <div>
                              <span className={isHighCpa ? 'val-red' : ''}>{fmtMoney(item.cpa, item.currency)}</span>
                              {doComp && <DeltaBadge cur={item.cpa} prev={item.yesterday_cpa} invertColor />}
                            </div>
                          ) : <span className="val-muted">—</span>}
                        </td>

                        <td className="td-num">
                          {item.roas > 0 ? (
                            <div>
                              <span className={isLowRoas ? 'val-red' : ''}>{fmtRoas(item.roas)}</span>
                              {doComp && <DeltaBadge cur={item.roas} prev={item.yesterday_roas} />}
                            </div>
                          ) : <span className="val-muted">—</span>}
                        </td>

                        <td className="td-num">
                          {item.revenue > 0 ? (
                            <div>
                              <span>{fmtMoney(item.revenue, item.currency)}</span>
                              {doComp && <DeltaBadge cur={item.revenue} prev={item.yesterday_revenue} />}
                            </div>
                          ) : <span className="val-muted">—</span>}
                        </td>

                        {cols.reach         && <td className="td-num">{fmtNum(item.reach)}</td>}
                        {cols.impressions   && <td className="td-num">{fmtNum(item.impressions)}</td>}
                        {cols.frequency     && <td className="td-num">{fmtFreq(item.frequency)}</td>}
                        {cols.cpm           && <td className="td-num">{fmtCpm(item.cpm, item.currency)}</td>}
                        {cols.clicks        && <td className="td-num">{fmtNum(item.clicks)}</td>}
                        {cols.linkClicks    && <td className="td-num">{fmtNum(item.linkClicks)}</td>}
                        {cols.cpc           && <td className="td-num">{fmtMoney(item.cpc, item.currency)}</td>}
                        {cols.messages      && <td className="td-num">{item.messages   > 0 ? <span className="val-blue">{fmtNum(item.messages)}</span>   : <span className="val-muted">—</span>}</td>}
                        {cols.costPerMsg    && <td className="td-num">{fmtMoney(item.costPerMsg, item.currency)}</td>}
                        {cols.engagement    && <td className="td-num">{item.engagement > 0 ? <span className="val-blue">{fmtNum(item.engagement)}</span> : <span className="val-muted">—</span>}</td>}
                        {cols.costPerEngage && <td className="td-num">{fmtMoney(item.costPerEngage, item.currency)}</td>}
                        {cols.reactions     && <td className="td-num">{fmtNum(item.reactions)}</td>}
                        {cols.comments      && <td className="td-num">{fmtNum(item.comments)}</td>}
                        {cols.shares        && <td className="td-num">{fmtNum(item.shares)}</td>}
                        {cols.videoViews    && <td className="td-num">{item.videoViews > 0 ? <span className="val-blue">{fmtNum(item.videoViews)}</span> : <span className="val-muted">—</span>}</td>}
                        {cols.thruplays     && <td className="td-num">{fmtNum(item.thruplays)}</td>}
                        {cols.addToCart     && <td className="td-num">{item.addToCart  > 0 ? <span className="val-green">{fmtNum(item.addToCart)}</span>  : <span className="val-muted">—</span>}</td>}
                        {cols.checkout      && <td className="td-num">{item.checkout   > 0 ? <span className="val-green">{fmtNum(item.checkout)}</span>   : <span className="val-muted">—</span>}</td>}
                        {cols.leads         && <td className="td-num">{item.leads      > 0 ? <span className="val-green">{fmtNum(item.leads)}</span>      : <span className="val-muted">—</span>}</td>}
                        {cols.costPerLead   && <td className="td-num">{fmtMoney(item.costPerLead, item.currency)}</td>}

                        <td className="td-num">{fmtCtr(item.ctr)}</td>

                        <td className="td-warn">
                          <div className="warn-list">
                            {isHighCpa    && <span className="warn-badge warn-cpa">⚠️ CPA cao</span>}
                            {(isLowRoas || isLosingMoney) && <span className="warn-badge warn-roas">⚠️ ROAS &lt; 1</span>}
                            {isHighBudget && <span className="warn-badge warn-ns">⚠️ NS gần hết</span>}
                            {noConversion && <span className="warn-badge warn-noconv">⚠️ Không chuyển đổi</span>}
                            {item.effective_status === 'CAMPAIGN_PAUSED' && <span className="warn-badge warn-camp">Campaign dừng</span>}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filtered.length > PAGE_SIZE && (
              <div className="pagination">
                <div className="pagi-info">
                  {Math.min((page-1)*PAGE_SIZE+1, filtered.length)}–{Math.min(page*PAGE_SIZE, filtered.length)} / {filtered.length}
                </div>
                <div className="pagi-btns">
                  <button className="pagi-btn" onClick={() => setPage(p => Math.max(1, p-1))}        disabled={page === 1}>← Trước</button>
                  <span className="pagi-label">Trang {page}/{totalPages}</span>
                  <button className="pagi-btn" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>Tiếp →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {budgetModal && (
        <BudgetModal adset={budgetModal.adset} onClose={() => setBudgetModal(null)} onSave={handleBudgetSave} saving={budgetSaving} />
      )}
      {bulkModal && (
        <BulkBudgetModal count={selectedIds.size} onClose={() => setBulkModal(false)} onSave={handleBulkBudget} saving={budgetSaving} />
      )}

      <div className="toast-container">
        {toasts.map(t => <Toast key={t.id} msg={t.msg} type={t.type} onClose={() => removeToast(t.id)} />)}
      </div>

      {/* AI Floating Button */}
      {fbConnected && (
        <button className="ai-fab" onClick={() => setShowAI(v => !v)} title="Trợ lý AI Meta Ads">
          <span className="ai-fab-icon">🤖</span>
          <span className="ai-fab-label">AI</span>
        </button>
      )}

      {/* AI Chat Panel */}
      {showAI && <AIChatPanel items={filtered} onClose={() => setShowAI(false)} />}

      <style jsx>{`
        .dh-root { padding: 20px; min-width: 0; }

        .welcome-banner {
          display: flex; align-items: center; justify-content: space-between;
          background: var(--s1); border: 1px solid var(--bd); border-radius: 12px;
          padding: 14px 18px; margin-bottom: 14px; gap: 12px;
        }
        .wb-greeting { font-size: 16px; font-weight: 700; color: var(--txt); margin-bottom: 3px; }
        .wb-sub { font-size: 12px; color: var(--mut); }
        .wb-sub strong { color: var(--txt); }
        .expire-ok   { color: var(--grn); }
        .expire-warn { color: var(--red); font-weight: 600; }
        .wb-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .upgrade-btn {
          background: #fe5f01; color: #fff; border-radius: 8px;
          padding: 7px 14px; font-size: 12px; font-weight: 700;
          text-decoration: none; white-space: nowrap; transition: opacity .15s;
        }
        .upgrade-btn:hover { opacity: .85; }
        .upgrade-btn--soft { background: var(--s3); color: var(--txt); }

        .fb-cta {
          display: flex; align-items: center; gap: 14px;
          background: rgba(59,130,246,.07); border: 1px solid rgba(59,130,246,.2);
          border-radius: 12px; padding: 16px 20px; margin-bottom: 14px;
        }
        .fb-cta-icon { font-size: 26px; flex-shrink: 0; }
        .fb-cta-body { flex: 1; }
        .fb-cta-title { font-size: 14px; font-weight: 700; color: var(--txt); margin-bottom: 3px; }
        .fb-cta-desc  { font-size: 12px; color: var(--mut); line-height: 1.5; }
        .fb-cta-btn {
          background: #1877f2; color: #fff; border-radius: 8px;
          padding: 8px 16px; font-size: 12px; font-weight: 700;
          text-decoration: none; white-space: nowrap; flex-shrink: 0;
        }

        .filter-bar {
          background: var(--s1); border: 1px solid var(--bd); border-radius: 12px;
          padding: 12px 16px; margin-bottom: 10px; display: flex; flex-direction: column; gap: 8px;
        }
        .filter-row {
          display: flex; flex-wrap: wrap; align-items: center; gap: 7px;
        }
        .filter-row--adv { padding-top: 6px; border-top: 1px solid var(--bd); }

        .level-tabs {
          display: flex; border: 1px solid var(--bd); border-radius: 8px;
          overflow: hidden; flex-shrink: 0;
        }
        .level-tab {
          padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer;
          background: var(--s2); color: var(--mut); border: none; font-family: inherit;
          transition: all .15s;
        }
        .level-tab.active { background: var(--navy); color: #fff; }
        .level-tab:hover:not(.active) { background: var(--s3); }

        .filter-search {
          flex: 1; min-width: 160px; max-width: 240px;
          padding: 7px 12px; border: 1px solid var(--bd); border-radius: 8px;
          background: var(--s2); color: var(--txt); font-size: 13px; font-family: inherit; outline: none;
        }
        .filter-search:focus { border-color: var(--blue); }
        .filter-search::placeholder { color: var(--mut); }
        .filter-sel {
          padding: 7px 10px; border: 1px solid var(--bd); border-radius: 8px;
          background: var(--s2); color: var(--txt); font-size: 12px;
          font-family: inherit; outline: none; cursor: pointer;
        }
        .filter-sel--date { min-width: 110px; }
        .filter-sel:focus { border-color: var(--blue); }
        .filter-threshold { display: flex; align-items: center; gap: 5px; }
        .filter-label { font-size: 11px; color: var(--mut); white-space: nowrap; font-weight: 600; }
        .filter-num {
          width: 90px; padding: 7px 10px; border: 1px solid var(--bd); border-radius: 8px;
          background: var(--s2); color: var(--txt); font-size: 12px; font-family: inherit; outline: none;
        }
        .filter-num:focus { border-color: var(--blue); }
        .filter-compare {
          display: flex; align-items: center; gap: 5px;
          font-size: 12px; color: var(--txt); cursor: pointer; white-space: nowrap;
        }
        .filter-refresh {
          padding: 7px 14px; background: var(--s2); border: 1px solid var(--bd);
          border-radius: 8px; font-size: 12px; color: var(--txt);
          cursor: pointer; white-space: nowrap; font-family: inherit; transition: background .15s;
        }
        .filter-refresh:hover:not(:disabled) { background: var(--s3); }
        .filter-refresh:disabled { opacity: .6; cursor: default; }

        .custom-range {
          display: flex; align-items: center; gap: 5px; flex-wrap: nowrap;
        }
        .filter-date-input {
          padding: 6px 8px; border: 1px solid var(--bd); border-radius: 8px;
          background: var(--s2); color: var(--txt); font-size: 12px;
          font-family: inherit; outline: none; cursor: pointer;
        }
        .filter-date-input:focus { border-color: var(--blue); }
        .custom-range-sep { font-size: 12px; color: var(--mut); flex-shrink: 0; }
        .custom-range-go {
          padding: 6px 12px; background: var(--blue); border: none;
          border-radius: 8px; font-size: 12px; font-weight: 700;
          color: #fff; cursor: pointer; font-family: inherit; white-space: nowrap;
          transition: opacity .15s;
        }
        .custom-range-go:hover { opacity: .85; }

        .col-picker-wrap { position: relative; margin-left: auto; }
        .col-picker-btn {
          padding: 6px 12px; background: var(--s2); border: 1px solid var(--bd);
          border-radius: 8px; font-size: 11px; font-weight: 600; color: var(--mut);
          cursor: pointer; font-family: inherit; white-space: nowrap;
        }
        .col-picker-btn:hover { background: var(--s3); }
        .col-picker-panel {
          position: absolute; right: 0; top: calc(100% + 6px); z-index: 100;
          background: var(--s1); border: 1px solid var(--bd); border-radius: 10px;
          padding: 10px 14px; min-width: 210px; max-height: 420px; overflow-y: auto;
          box-shadow: 0 8px 30px rgba(0,0,0,.15);
          display: flex; flex-direction: column; gap: 4px;
        }
        .col-chk {
          display: flex; align-items: center; gap: 7px;
          font-size: 12px; color: var(--txt); cursor: pointer;
          padding: 3px 0;
        }
        .col-chk input { cursor: pointer; }

        .stats-bar {
          display: flex; flex-wrap: wrap; align-items: center; gap: 0;
          background: var(--s1); border: 1px solid var(--bd); border-radius: 12px;
          padding: 10px 14px; margin-bottom: 10px; overflow-x: auto;
        }
        .stat-item { padding: 3px 12px; text-align: center; flex-shrink: 0; }
        .stat-item--btn { padding: 0 10px; }
        .stat-num { font-size: 14px; font-weight: 700; color: var(--txt); line-height: 1.3; white-space: nowrap; }
        .stat-money { font-size: 12px; white-space: normal; text-align: center; line-height: 1.5; }
        .stat-num.stat-primary { color: var(--blue); }
        .stat-num.stat-green   { color: var(--grn); }
        .stat-lbl { font-size: 10px; color: var(--mut); font-weight: 600; text-transform: uppercase; letter-spacing: .3px; margin-top: 1px; }
        .stat-sep { width: 1px; height: 32px; background: var(--bd); flex-shrink: 0; }
        .btn-quick-budget {
          padding: 7px 14px;
          background: linear-gradient(135deg, #fe5f01 0%, #f59e0b 100%);
          color: #fff; border: none; border-radius: 8px;
          font-size: 12px; font-weight: 700; cursor: pointer;
          white-space: nowrap; font-family: inherit;
          box-shadow: 0 2px 8px rgba(254,95,1,.35); transition: opacity .15s;
        }
        .btn-quick-budget:hover { opacity: .88; }

        .result-info {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 8px;
          font-size: 12px; color: var(--mut); margin-bottom: 8px;
        }
        .result-loading { color: var(--blue); animation: pulse 1s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }

        .sel-bar {
          display: flex; align-items: center; gap: 8px;
          background: rgba(59,130,246,.08); border: 1px solid rgba(59,130,246,.2);
          border-radius: 8px; padding: 5px 12px;
          font-size: 12px; color: var(--txt);
        }
        .sel-clear {
          background: none; border: 1px solid var(--bd); border-radius: 5px;
          padding: 2px 8px; font-size: 11px; color: var(--mut); cursor: pointer; font-family: inherit;
        }
        .sel-budget {
          background: #fe5f01; color: #fff; border: none; border-radius: 5px;
          padding: 3px 10px; font-size: 11px; font-weight: 700; cursor: pointer; font-family: inherit;
        }

        .table-wrap {
          background: var(--s1); border: 1px solid var(--bd); border-radius: 12px;
          overflow-x: auto; margin-bottom: 12px;
        }
        .adset-table {
          width: 100%; border-collapse: collapse; font-size: 12.5px; min-width: 900px;
        }
        .adset-table thead tr { background: var(--s2); position: sticky; top: 0; z-index: 2; }
        .adset-table th {
          text-align: left; padding: 9px 10px;
          font-size: 10.5px; font-weight: 700; color: var(--mut);
          text-transform: uppercase; letter-spacing: .3px;
          border-bottom: 1px solid var(--bd); white-space: nowrap;
          user-select: none;
        }
        .th-sort { cursor: pointer; }
        .th-sort:hover { color: var(--txt); }
        .adset-table td {
          padding: 8px 10px; border-bottom: 1px solid var(--bd);
          color: var(--txt); vertical-align: middle;
        }
        .adset-table tr:last-child td { border-bottom: none; }
        .adset-table tbody tr:hover td { background: var(--s2); }
        .th-chk, .td-chk { width: 36px; text-align: center; }
        .th-name  { min-width: 200px; }
        .th-num, .td-num { text-align: right; min-width: 80px; }
        .th-ctr, .td-ctr  { text-align: right; min-width: 60px; cursor: pointer; }
        .th-budget, .td-budget { min-width: 160px; }
        .th-status, .td-status { min-width: 100px; }
        .td-warn { min-width: 110px; }
        .td-campaign { max-width: 160px; }
        .td-name { min-width: 200px; max-width: 280px; }
        .text-ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .adset-row { transition: background .1s; }
        .row-selected td { background: rgba(59,130,246,.06) !important; }
        .row-dimmed { opacity: .65; }

        .adset-name-main {
          font-weight: 600; font-size: 13px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 260px;
        }
        .adset-name-sub {
          font-size: 11px; color: var(--mut); margin-top: 2px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 260px;
        }
        .td-account { white-space: nowrap; }
        .text-sm { font-size: 12px; }
        .sub-text { font-size: 11px; color: var(--mut); }
        .status-badge { font-weight: 600; }

        .obj-badge {
          display: inline-block; padding: 2px 6px; border-radius: 4px;
          background: var(--s2); color: var(--mut); font-size: 10px; font-weight: 600;
          white-space: nowrap; max-width: 140px; overflow: hidden; text-overflow: ellipsis;
        }

        .toggle-sw {
          width: 38px; height: 22px; border-radius: 11px;
          background: var(--s3); border: 1px solid var(--bd);
          position: relative; cursor: pointer; transition: background .2s, border-color .2s;
          flex-shrink: 0; display: inline-block; padding: 0;
        }
        .toggle-sw--on { background: #3b82f6; border-color: #3b82f6; }
        .toggle-sw--on:hover { background: #2563eb; }
        .toggle-knob {
          position: absolute; top: 2px; left: 2px;
          width: 16px; height: 16px; border-radius: 50%;
          background: #fff; transition: transform .2s;
          box-shadow: 0 1px 3px rgba(0,0,0,.2); display: block;
        }
        .toggle-sw--on .toggle-knob { transform: translateX(16px); }
        .toggle-sw:disabled { opacity: .5; cursor: default; }
        .badge-camp-paused {
          display: inline-block; padding: 3px 7px; border-radius: 6px;
          background: var(--s3); color: var(--mut); font-size: 10px; font-weight: 600; white-space: nowrap;
        }

        .budget-wrap { cursor: pointer; }
        .budget-wrap:hover .budget-text { text-decoration: underline; }
        .budget-cell { min-width: 140px; }
        .budget-text { font-size: 12px; color: var(--txt); margin-bottom: 4px; white-space: nowrap; }
        .budget-text-small { font-size: 11px; color: var(--txt); white-space: nowrap; }
        .budget-day { color: var(--mut); }
        .budget-pct { font-weight: 700; }
        .budget-bar-track { height: 4px; border-radius: 2px; background: var(--s3); overflow: hidden; }
        .budget-bar-fill  { height: 100%; border-radius: 2px; transition: width .3s; }

        .val-green { color: var(--grn); font-weight: 600; }
        .val-red   { color: var(--red); font-weight: 600; }
        .val-muted { color: var(--mut); }

        .delta { font-size: 10px; font-weight: 700; margin-left: 4px; display: inline-block; }
        .delta-up { color: var(--grn); }
        .delta-dn { color: var(--red); }

        .warn-list { display: flex; flex-direction: column; gap: 3px; }
        .warn-badge {
          display: inline-block; padding: 2px 6px; border-radius: 5px;
          font-size: 10px; font-weight: 700; white-space: nowrap;
        }
        .warn-cpa    { background: rgba(239,68,68,.12);  color: var(--red); }
        .warn-ns     { background: rgba(245,158,11,.12); color: var(--ylw); }
        .warn-roas   { background: rgba(239,68,68,.08);  color: var(--red); }
        .warn-noconv { background: rgba(245,158,11,.12); color: #f97316; }
        .warn-camp   { background: rgba(100,116,139,.12); color: var(--mut); }

        /* Status toggle cell */
        .status-toggle-cell { display: flex; align-items: center; gap: 7px; }
        .status-lbl { font-size: 10px; font-weight: 700; }
        .status-lbl--on  { color: var(--grn); }
        .status-lbl--off { color: var(--mut); }
        .status-lbl--paused { color: var(--mut); font-size: 10px; }
        .toggle-sw--disabled { opacity: .35; cursor: default; pointer-events: none; }
        .badge-status { display: inline-block; padding: 2px 7px; border-radius: 5px; font-size: 10px; font-weight: 700; }
        .badge-archived { background: var(--s3); color: var(--mut); }

        /* Sel bar actions */
        .sel-act {
          padding: 3px 10px; border: none; border-radius: 5px;
          font-size: 11px; font-weight: 700; cursor: pointer; font-family: inherit;
        }
        .sel-act--on  { background: rgba(16,185,129,.15); color: var(--grn); }
        .sel-act--off { background: rgba(100,116,139,.15); color: var(--mut); }

        /* Col picker groups */
        .col-group { margin-bottom: 8px; }
        .col-group-label { font-size: 10px; font-weight: 800; color: var(--mut); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px; padding-top: 4px; border-top: 1px solid var(--bd); }
        .col-group:first-child .col-group-label { border-top: none; }

        /* New value colors */
        .val-blue  { color: #60a5fa; font-weight: 600; }

        /* Budget over-tip */
        .budget-over-tip {
          font-size: 10px; color: var(--mut); cursor: help; margin-left: 3px;
          vertical-align: middle;
        }
        .cbo-tag { cursor: help; }

        /* AI Floating button */
        .ai-fab {
          position: fixed; bottom: 28px; right: 28px; z-index: 1200;
          display: flex; align-items: center; gap: 6px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: #fff; border: none; border-radius: 50px;
          padding: 10px 18px; font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: inherit;
          box-shadow: 0 4px 20px rgba(99,102,241,.5);
          transition: transform .15s, box-shadow .15s;
        }
        .ai-fab:hover { transform: translateY(-2px); box-shadow: 0 6px 28px rgba(99,102,241,.6); }
        .ai-fab-icon { font-size: 16px; }

        /* AI Chat Panel */
        .ai-panel {
          position: fixed; bottom: 90px; right: 28px; z-index: 1200;
          width: 380px;
          height: calc(100vh - 130px); max-height: 580px; min-height: 340px;
          display: flex; flex-direction: column; overflow: hidden;
          background: var(--s1); border: 1px solid rgba(99,102,241,.25);
          border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,.3);
          animation: slideUp .2s ease;
        }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:none } }
        .ai-panel-hd {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 14px; border-bottom: 1px solid var(--bd);
          background: linear-gradient(135deg, rgba(99,102,241,.12) 0%, rgba(139,92,246,.08) 100%);
          border-radius: 16px 16px 0 0; flex-shrink: 0;
        }
        .ai-panel-title { display: flex; align-items: center; gap: 10px; }
        .ai-panel-close {
          background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.15);
          border-radius: 6px; font-size: 16px; color: var(--mut);
          cursor: pointer; line-height: 1; padding: 3px 7px; transition: all .15s;
        }
        .ai-panel-close:hover { background: rgba(239,68,68,.15); color: var(--red); border-color: var(--red); }
        .ai-msgs {
          flex: 1; overflow-y: auto; padding: 12px 12px;
          display: flex; flex-direction: column; gap: 10px;
          min-height: 0;
        }
        .ai-msg { display: flex; gap: 8px; align-items: flex-start; }
        .ai-msg-user { flex-direction: row-reverse; }
        .ai-avatar { font-size: 18px; flex-shrink: 0; margin-top: 2px; }
        .ai-bubble {
          padding: 9px 12px; border-radius: 12px; font-size: 12.5px; line-height: 1.6;
          max-width: 84%; word-break: break-word;
        }
        .ai-msg-assistant .ai-bubble { background: var(--s2); color: var(--txt); border-radius: 4px 12px 12px 12px; }
        .ai-msg-user .ai-bubble { background: linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; border-radius: 12px 4px 12px 12px; }
        .ai-typing { display: flex; align-items: center; gap: 4px; padding: 12px 16px; }
        .ai-typing span {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--mut); animation: bounce 1.2s infinite;
        }
        .ai-typing span:nth-child(2) { animation-delay: .2s; }
        .ai-typing span:nth-child(3) { animation-delay: .4s; }
        @keyframes bounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }

        /* Suggestions: horizontal scroll */
        .ai-suggests {
          padding: 8px 12px; display: flex; flex-direction: row; flex-wrap: nowrap;
          overflow-x: auto; gap: 6px; border-top: 1px solid var(--bd); flex-shrink: 0;
          scrollbar-width: thin; scrollbar-color: var(--bd) transparent;
        }
        .ai-suggests::-webkit-scrollbar { height: 4px; }
        .ai-suggests::-webkit-scrollbar-thumb { background: var(--bd); border-radius: 2px; }
        .ai-suggest-btn {
          padding: 6px 10px; background: rgba(99,102,241,.08); border: 1px solid rgba(99,102,241,.2);
          border-radius: 20px; font-size: 11px; color: var(--txt);
          cursor: pointer; font-family: inherit; white-space: nowrap; flex-shrink: 0;
          transition: background .15s;
        }
        .ai-suggest-btn:hover { background: rgba(99,102,241,.18); }

        .ai-input-row {
          display: flex; gap: 7px; padding: 10px 12px;
          border-top: 1px solid var(--bd); flex-shrink: 0;
        }
        .ai-input {
          flex: 1; padding: 8px 12px; border: 1px solid var(--bd);
          border-radius: 10px; background: var(--s2); color: var(--txt);
          font-size: 12.5px; font-family: inherit; outline: none;
        }
        .ai-input:focus { border-color: #6366f1; }
        .ai-input::placeholder { color: var(--mut); }
        .ai-send-btn {
          padding: 8px 14px; background: linear-gradient(135deg,#6366f1,#8b5cf6);
          border: none; border-radius: 10px; color: #fff;
          font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit;
          transition: opacity .15s;
        }
        .ai-send-btn:hover:not(:disabled) { opacity: .88; }
        .ai-send-btn:disabled { opacity: .45; cursor: default; }

        .sort-icon  { font-size: 10px; margin-left: 3px; }
        .sort-none  { opacity: .35; }
        .sort-active { color: var(--blue); }

        .skel-tr td { padding: 9px 10px; }
        .skel-cell {
          height: 20px; border-radius: 5px;
          background: linear-gradient(90deg, var(--s2) 25%, var(--s3) 50%, var(--s2) 75%);
          background-size: 200% 100%; animation: shimmer 1.2s infinite;
        }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .empty-td { padding: 0 !important; }
        .camp-empty {
          display: flex; flex-direction: column; align-items: center;
          padding: 48px 20px; gap: 8px; text-align: center;
        }
        .empty-icon { font-size: 30px; }
        .empty-text { font-size: 15px; font-weight: 600; color: var(--txt); }
        .empty-sub  { font-size: 12px; color: var(--mut); max-width: 340px; line-height: 1.5; }

        .pagination {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 10px; padding: 10px 2px;
        }
        .pagi-info  { font-size: 12px; color: var(--mut); }
        .pagi-btns  { display: flex; align-items: center; gap: 8px; }
        .pagi-label { font-size: 12px; color: var(--txt); white-space: nowrap; }
        .pagi-btn {
          padding: 6px 14px; background: var(--s1); border: 1px solid var(--bd);
          border-radius: 8px; font-size: 12px; color: var(--txt);
          cursor: pointer; font-family: inherit; transition: background .15s;
        }
        .pagi-btn:hover:not(:disabled) { background: var(--s2); }
        .pagi-btn:disabled { opacity: .4; cursor: default; }

        .modal-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,.55); backdrop-filter: blur(3px);
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .modal-box {
          background: var(--s1); border: 1px solid var(--bd); border-radius: 16px;
          width: 100%; max-width: 420px; box-shadow: 0 20px 60px rgba(0,0,0,.25); overflow: hidden;
        }
        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; border-bottom: 1px solid var(--bd);
        }
        .modal-title { font-size: 15px; font-weight: 700; color: var(--txt); }
        .modal-close {
          background: none; border: none; font-size: 20px; color: var(--mut);
          cursor: pointer; line-height: 1; padding: 0 4px;
        }
        .modal-close:hover { color: var(--txt); }
        .modal-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }
        .modal-adset-name { font-size: 13px; font-weight: 600; color: var(--txt); line-height: 1.4; }
        .modal-current { font-size: 13px; color: var(--mut); }
        .modal-current strong { color: var(--txt); }
        .modal-mode-tabs { display: flex; gap: 6px; }
        .mode-tab {
          flex: 1; padding: 7px 12px; border: 1px solid var(--bd); border-radius: 8px;
          background: var(--s2); color: var(--mut); font-size: 12px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: all .15s;
        }
        .mode-tab.active { background: var(--blue); border-color: var(--blue); color: #fff; }
        .modal-field { display: flex; flex-direction: column; gap: 5px; }
        .modal-label { font-size: 11px; font-weight: 700; color: var(--mut); text-transform: uppercase; letter-spacing: .3px; }
        .modal-input {
          padding: 9px 12px; border: 1px solid var(--bd); border-radius: 8px;
          background: var(--s2); color: var(--txt); font-size: 14px; font-family: inherit;
          outline: none; width: 100%;
        }
        .modal-input:focus { border-color: var(--blue); }
        .modal-preview { font-size: 13px; color: var(--mut); }
        .modal-preview strong { font-size: 15px; }
        .modal-delta { color: var(--mut); }
        .modal-footer {
          display: flex; gap: 10px; padding: 14px 20px; border-top: 1px solid var(--bd); justify-content: flex-end;
        }
        .modal-cancel {
          padding: 8px 18px; background: var(--s2); border: 1px solid var(--bd);
          border-radius: 8px; font-size: 13px; color: var(--txt); cursor: pointer; font-family: inherit;
        }
        .modal-cancel:hover { background: var(--s3); }
        .modal-confirm {
          padding: 8px 18px; background: #fe5f01; border: none;
          border-radius: 8px; font-size: 13px; font-weight: 700; color: #fff;
          cursor: pointer; font-family: inherit; transition: opacity .15s;
        }
        .modal-confirm:hover:not(:disabled) { opacity: .88; }
        .modal-confirm:disabled { opacity: .5; cursor: default; }
      `}</style>

      <style jsx global>{`
        .toast-container {
          position: fixed; bottom: 24px; right: 24px; z-index: 9999;
          display: flex; flex-direction: column; gap: 8px; pointer-events: none;
        }
        .toast-item {
          display: flex; align-items: center; gap: 8px;
          background: var(--s1); border: 1px solid var(--bd);
          border-radius: 10px; padding: 9px 14px;
          font-size: 12px; font-weight: 600; color: var(--txt);
          box-shadow: 0 8px 32px rgba(0,0,0,.2);
          animation: slideUp .25s ease; pointer-events: all; max-width: 260px;
        }
        .toast-success { border-color: rgba(16,185,129,.4); }
        .toast-error   { border-color: rgba(239,68,68,.4); }
        .toast-close {
          background: none; border: none; color: var(--mut);
          font-size: 16px; cursor: pointer; margin-left: auto; line-height: 1; padding: 0 2px;
        }
        @keyframes slideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </DashboardLayout>
  )
}
