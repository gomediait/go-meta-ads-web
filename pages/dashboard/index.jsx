import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../lib/AuthContext'

const PAGE_SIZE = 10

const DATE_PRESETS = [
  { value: 'today',        label: 'Hôm nay' },
  { value: 'yesterday',    label: 'Hôm qua' },
  { value: 'last_7_days',  label: '7 ngày' },
  { value: 'last_30_days', label: '30 ngày' },
]

const STATUS_OPTIONS = [
  { value: 'ALL',    label: 'Tất cả' },
  { value: 'ACTIVE', label: 'Đang chạy' },
  { value: 'PAUSED', label: 'Đã dừng' },
]

function fmtVnd(v) {
  if (v == null || isNaN(v)) return '—'
  return Number(v).toLocaleString('vi-VN')
}

function fmtNum(v) {
  if (v == null || isNaN(v)) return '—'
  return Number(v).toLocaleString('vi-VN')
}

function fmtCtr(v) {
  if (!v) return '0.00%'
  return Number(v).toFixed(2) + '%'
}

function fmtRoas(v) {
  if (!v) return '0.00'
  return Number(v).toFixed(2)
}

// Toast component
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className={`toast-item toast-${type}`}>
      {type === 'success' ? '✅' : '❌'} {msg}
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  )
}

// Skeleton rows
function SkeletonRows() {
  return (
    <>
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <tr key={i} className="skel-tr">
          {Array.from({ length: 16 }).map((_, j) => (
            <td key={j}><div className="skel-cell" /></td>
          ))}
        </tr>
      ))}
    </>
  )
}

// Budget progress bar
function BudgetBar({ budget, spend, pct }) {
  const color = pct >= 90 ? 'var(--red)' : pct >= 70 ? 'var(--ylw)' : 'var(--grn)'
  return (
    <div className="budget-cell">
      <div className="budget-text">
        ₫{fmtVnd(budget)}<span className="budget-day"> /ngày</span>
        <span className="budget-pct" style={{ color }}> · {pct}%</span>
      </div>
      <div className="budget-bar-track">
        <div
          className="budget-bar-fill"
          style={{ width: `${Math.min(pct, 100)}%`, background: color }}
        />
      </div>
    </div>
  )
}

// Toggle switch
function StatusToggle({ adset, onToggle, toggling }) {
  const isActive = adset.effective_status === 'ACTIVE'
  const isCampaignPaused = adset.effective_status === 'CAMPAIGN_PAUSED'

  if (isCampaignPaused) {
    return <span className="badge-camp-paused">Campaign dừng</span>
  }

  return (
    <button
      className={`toggle-sw${isActive ? ' toggle-sw--on' : ''}`}
      onClick={() => onToggle(adset.id, adset.status)}
      disabled={toggling[adset.id]}
      title={isActive ? 'Tạm dừng nhóm QC' : 'Bật nhóm QC'}
    >
      <span className="toggle-knob" />
    </button>
  )
}

// Sort icon
function SortIcon({ col, sortBy, sortDir }) {
  if (sortBy !== col) return <span className="sort-icon sort-none">↕</span>
  return <span className="sort-icon sort-active">{sortDir === 'asc' ? '↑' : '↓'}</span>
}

// Budget modal
function BudgetModal({ adset, onClose, onSave, saving }) {
  const [inputVal, setInputVal] = useState(
    adset.daily_budget ? String(Math.round(adset.daily_budget)) : ''
  )
  const [mode, setMode] = useState('amount') // 'amount' | 'percent'
  const [pct, setPct] = useState('10')

  const currentBudget = adset.daily_budget || 0

  const computedNew = useMemo(() => {
    if (mode === 'amount') return Number(inputVal) || 0
    const p = Number(pct) || 0
    return Math.round(currentBudget * (1 + p / 100))
  }, [mode, inputVal, pct, currentBudget])

  function handleSave() {
    if (computedNew <= 0) return
    onSave(adset.id, computedNew)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Chỉnh ngân sách</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="modal-adset-name">{adset.name}</div>
          <div className="modal-current">
            Ngân sách hiện tại: <strong>₫{fmtVnd(currentBudget)}/ngày</strong>
          </div>

          <div className="modal-mode-tabs">
            <button
              className={`mode-tab${mode === 'amount' ? ' active' : ''}`}
              onClick={() => setMode('amount')}
            >Nhập số tiền</button>
            <button
              className={`mode-tab${mode === 'percent' ? ' active' : ''}`}
              onClick={() => setMode('percent')}
            >Tăng theo %</button>
          </div>

          {mode === 'amount' ? (
            <div className="modal-field">
              <label className="modal-label">Ngân sách mới (₫)</label>
              <input
                type="number"
                className="modal-input"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder="VD: 150000"
                min="1000"
              />
            </div>
          ) : (
            <div className="modal-field">
              <label className="modal-label">Tăng thêm (%)</label>
              <input
                type="number"
                className="modal-input"
                value={pct}
                onChange={e => setPct(e.target.value)}
                placeholder="VD: 20"
                min="1"
                max="500"
              />
            </div>
          )}

          <div className="modal-preview">
            Ngân sách mới: <strong style={{ color: 'var(--grn)' }}>₫{fmtVnd(computedNew)}/ngày</strong>
            {currentBudget > 0 && computedNew > 0 && (
              <span className="modal-delta">
                {' '}({computedNew > currentBudget ? '+' : ''}{Math.round((computedNew / currentBudget - 1) * 100)}%)
              </span>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-cancel" onClick={onClose}>Huỷ</button>
          <button
            className="modal-confirm"
            onClick={handleSave}
            disabled={saving || computedNew <= 0}
          >
            {saving ? 'Đang lưu…' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Bulk budget modal
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
            <input
              type="number"
              className="modal-input"
              value={pct}
              onChange={e => setPct(e.target.value)}
              placeholder="VD: 20"
              min="1"
              max="500"
            />
          </div>
          <div className="modal-preview">
            Tăng thêm <strong style={{ color: 'var(--grn)' }}>{pct}%</strong> so với ngân sách hiện tại
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-cancel" onClick={onClose}>Huỷ</button>
          <button
            className="modal-confirm"
            onClick={() => onSave(Number(pct) || 0)}
            disabled={saving || !Number(pct)}
          >
            {saving ? 'Đang cập nhật…' : 'Tăng NS'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DashboardHome() {
  const { user, planName, isExpired } = useAuth()
  const fbConnected = user?.fb_connected

  const [adsets, setAdsets] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  const [filters, setFilters] = useState({
    search: '',
    account_id: '',
    status: 'ALL',
    date_preset: 'today',
    compare: false,
    cpa_threshold: '',
    roas_threshold: ''
  })

  const [sortBy, setSortBy] = useState('spend')
  const [sortDir, setSortDir] = useState('desc')

  const [selectedIds, setSelectedIds] = useState(new Set())
  const [toggling, setToggling] = useState({})

  const [budgetModal, setBudgetModal] = useState(null) // { adset }
  const [bulkModal, setBulkModal] = useState(false)
  const [budgetSaving, setBudgetSaving] = useState(false)

  const [toasts, setToasts] = useState([])

  const abortRef = useRef(null)

  function addToast(msg, type = 'success') {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
  }

  function removeToast(id) {
    setToasts(t => t.filter(x => x.id !== id))
  }

  const fetchAdsets = useCallback(async () => {
    if (!fbConnected) return
    if (abortRef.current) abortRef.current.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setLoading(true)
    setPage(1)
    setSelectedIds(new Set())

    try {
      const params = new URLSearchParams({
        date_preset: filters.date_preset,
        status: filters.status,
        compare: filters.compare ? 'true' : 'false',
        ...(filters.account_id && { account_id: filters.account_id })
      })

      const res = await fetch(`/api/fb/campaigns?${params}`, { signal: ctrl.signal })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()

      if (data.ok) {
        setAdsets(data.adsets || [])
        if (data.accounts?.length) setAccounts(data.accounts)
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('[fetch adsets]', err)
      }
    } finally {
      setLoading(false)
    }
  }, [fbConnected, filters.date_preset, filters.status, filters.compare, filters.account_id])

  useEffect(() => {
    fetchAdsets()
  }, [fetchAdsets])

  // Client-side filter + sort
  const filtered = useMemo(() => {
    let list = [...adsets]

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase()
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.campaign_name.toLowerCase().includes(q) ||
        a.account_name.toLowerCase().includes(q)
      )
    }

    const cpaThresh = Number(filters.cpa_threshold) || 0
    const roasThresh = Number(filters.roas_threshold) || 0

    // Apply sort
    list.sort((a, b) => {
      let av = a[sortBy] ?? 0
      let bv = b[sortBy] ?? 0
      // Active first when sorting by spend (default)
      if (sortBy === 'spend') {
        const aAct = a.effective_status === 'ACTIVE' ? 0 : 1
        const bAct = b.effective_status === 'ACTIVE' ? 0 : 1
        if (aAct !== bAct) return aAct - bAct
      }
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return list
  }, [adsets, filters.search, sortBy, sortDir])

  // Computed stats from filtered
  const stats = useMemo(() => {
    const cpaThresh = Number(filters.cpa_threshold) || 0
    const roasThresh = Number(filters.roas_threshold) || 0

    const activeCount = filtered.filter(a => a.effective_status === 'ACTIVE').length
    const totalSpend = filtered.reduce((s, a) => s + (a.spend || 0), 0)
    const totalBudget = filtered.reduce((s, a) => s + (a.daily_budget || 0), 0)
    const totalPurchases = filtered.reduce((s, a) => s + (a.purchases || 0), 0)
    const totalRevenue = filtered.reduce((s, a) => s + (a.revenue || 0), 0)
    const avgCpa = totalPurchases > 0 ? totalSpend / totalPurchases : 0
    const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0
    const highCpaCount = cpaThresh > 0 ? filtered.filter(a => a.cpa > cpaThresh).length : 0
    const accountSet = new Set(filtered.map(a => a.account_id))

    return { activeCount, totalSpend, totalBudget, totalPurchases, avgCpa, avgRoas, highCpaCount, accountCount: accountSet.size }
  }, [filtered, filters.cpa_threshold])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageAdsets = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function setFilter(key, val) {
    setFilters(f => ({ ...f, [key]: val }))
    setPage(1)
  }

  function handleSort(col) {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortDir('desc')
    }
    setPage(1)
  }

  // Row select
  const allPageSelected = pageAdsets.length > 0 && pageAdsets.every(a => selectedIds.has(a.id))

  function togglePageSelect() {
    if (allPageSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev)
        pageAdsets.forEach(a => next.delete(a.id))
        return next
      })
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev)
        pageAdsets.forEach(a => next.add(a.id))
        return next
      })
    }
  }

  function toggleRow(id) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Toggle adset status
  async function toggleAdset(adsetId, currentStatus) {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    setToggling(t => ({ ...t, [adsetId]: true }))
    try {
      const res = await fetch('/api/fb/campaign-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: adsetId, status: newStatus })
      })
      if (res.ok) {
        setAdsets(prev => prev.map(a =>
          a.id === adsetId
            ? { ...a, status: newStatus, effective_status: newStatus }
            : a
        ))
        addToast(`Đã ${newStatus === 'ACTIVE' ? 'bật' : 'tắt'} nhóm QC`)
      } else {
        addToast('Lỗi khi đổi trạng thái', 'error')
      }
    } catch {
      addToast('Lỗi kết nối', 'error')
    } finally {
      setToggling(t => ({ ...t, [adsetId]: false }))
    }
  }

  // Budget update (single)
  async function handleBudgetSave(adsetId, newBudget) {
    setBudgetSaving(true)
    try {
      const res = await fetch('/api/fb/budget-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adset_id: adsetId, new_budget: newBudget, budget_type: 'daily' })
      })
      const data = await res.json()
      if (data.ok) {
        setAdsets(prev => prev.map(a =>
          a.id === adsetId ? { ...a, daily_budget: newBudget } : a
        ))
        addToast('Đã cập nhật ngân sách')
        setBudgetModal(null)
      } else {
        addToast(data.error || 'Lỗi cập nhật NS', 'error')
      }
    } catch {
      addToast('Lỗi kết nối', 'error')
    } finally {
      setBudgetSaving(false)
    }
  }

  // Bulk budget increase
  async function handleBulkBudget(pct) {
    if (!pct || selectedIds.size === 0) return
    setBudgetSaving(true)
    let successCount = 0
    let failCount = 0

    const targets = adsets.filter(a => selectedIds.has(a.id) && a.daily_budget > 0)

    for (const adset of targets) {
      const newBudget = Math.round(adset.daily_budget * (1 + pct / 100))
      try {
        const res = await fetch('/api/fb/budget-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adset_id: adset.id, new_budget: newBudget, budget_type: 'daily' })
        })
        const data = await res.json()
        if (data.ok) {
          setAdsets(prev => prev.map(a => a.id === adset.id ? { ...a, daily_budget: newBudget } : a))
          successCount++
        } else {
          failCount++
        }
      } catch {
        failCount++
      }
    }

    setBudgetSaving(false)
    setBulkModal(false)

    if (successCount > 0) addToast(`Đã tăng NS ${successCount} nhóm QC`)
    if (failCount > 0) addToast(`${failCount} nhóm QC thất bại`, 'error')
  }

  const expireDate = user?.expire_at ? new Date(user.expire_at).toLocaleDateString('vi-VN') : null
  const cpaThresh = Number(filters.cpa_threshold) || 0
  const roasThresh = Number(filters.roas_threshold) || 0

  return (
    <DashboardLayout title="Quản lý nhóm quảng cáo">
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

        {/* FB connect CTA */}
        {!fbConnected && (
          <div className="fb-cta">
            <div className="fb-cta-icon">🔗</div>
            <div className="fb-cta-body">
              <div className="fb-cta-title">Kết nối tài khoản Facebook Ads để bắt đầu</div>
              <div className="fb-cta-desc">Sau khi kết nối, bạn có thể quản lý nhóm quảng cáo, xem báo cáo và tối ưu ngân sách.</div>
            </div>
            <Link href="/settings/connect-facebook" className="fb-cta-btn">Kết nối ngay</Link>
          </div>
        )}

        {fbConnected && (
          <>
            {/* Filter bar */}
            <div className="filter-bar">
              <div className="filter-row">
                <input
                  className="filter-search"
                  placeholder="Tìm chiến dịch, nhóm QC..."
                  value={filters.search}
                  onChange={e => setFilter('search', e.target.value)}
                />

                <select
                  className="filter-sel"
                  value={filters.account_id}
                  onChange={e => setFilter('account_id', e.target.value)}
                >
                  <option value="">Tất cả TK</option>
                  {accounts.map(a => (
                    <option key={a.account_id} value={a.account_id}>
                      {a.account_name}
                    </option>
                  ))}
                </select>

                <select
                  className="filter-sel"
                  value={filters.date_preset}
                  onChange={e => setFilter('date_preset', e.target.value)}
                >
                  {DATE_PRESETS.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>

                <select
                  className="filter-sel"
                  value={filters.status}
                  onChange={e => setFilter('status', e.target.value)}
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>

                <div className="filter-threshold">
                  <span className="filter-label">CPA &gt;</span>
                  <input
                    type="number"
                    className="filter-num"
                    placeholder="Ngưỡng CPA"
                    value={filters.cpa_threshold}
                    onChange={e => setFilter('cpa_threshold', e.target.value)}
                    min="0"
                  />
                </div>

                <div className="filter-threshold">
                  <span className="filter-label">ROAS &lt;</span>
                  <input
                    type="number"
                    className="filter-num"
                    placeholder="Ngưỡng ROAS"
                    value={filters.roas_threshold}
                    onChange={e => setFilter('roas_threshold', e.target.value)}
                    min="0"
                    step="0.1"
                  />
                </div>

                <label className="filter-compare">
                  <input
                    type="checkbox"
                    checked={filters.compare}
                    onChange={e => setFilter('compare', e.target.checked)}
                  />
                  <span>So sánh hôm qua</span>
                </label>

                <button
                  className="filter-refresh"
                  onClick={fetchAdsets}
                  disabled={loading}
                  title="Làm mới"
                >
                  {loading ? '…' : '↻ Làm mới'}
                </button>
              </div>
            </div>

            {/* Stats summary */}
            <div className="stats-bar">
              <div className="stat-item">
                <div className="stat-num">{stats.activeCount}</div>
                <div className="stat-lbl">Chiến dịch</div>
              </div>
              <div className="stat-sep" />
              <div className="stat-item">
                <div className="stat-num">₫{fmtVnd(Math.round(stats.totalSpend))}</div>
                <div className="stat-lbl">Tổng chi tiêu</div>
              </div>
              <div className="stat-sep" />
              <div className="stat-item">
                <div className="stat-num">₫{fmtVnd(Math.round(stats.totalBudget))}</div>
                <div className="stat-lbl">Tổng ngân sách</div>
              </div>

              <button
                className="btn-quick-budget"
                onClick={() => {
                  if (selectedIds.size === 0) {
                    addToast('Chọn ít nhất 1 nhóm QC để tăng NS', 'error')
                    return
                  }
                  setBulkModal(true)
                }}
              >
                Tăng NS nhanh
              </button>

              <div className="stat-sep" />
              <div className="stat-item">
                <div className="stat-num">{fmtNum(stats.totalPurchases)}</div>
                <div className="stat-lbl">Tổng lượt mua</div>
              </div>
              <div className="stat-sep" />
              <div className="stat-item">
                <div className="stat-num">₫{fmtVnd(Math.round(stats.avgCpa))}</div>
                <div className="stat-lbl">CPA trung bình</div>
              </div>
              <div className="stat-sep" />
              <div className="stat-item">
                <div className="stat-num">{fmtRoas(stats.avgRoas)}</div>
                <div className="stat-lbl">ROAS trung bình</div>
              </div>

              {cpaThresh > 0 && (
                <>
                  <div className="stat-sep" />
                  <div className="stat-item">
                    <div className="stat-num stat-warn">{stats.highCpaCount} CPA cao ⚠️</div>
                    <div className="stat-lbl">Cần xem lại</div>
                  </div>
                </>
              )}

              <div className="stat-sep" />
              <div className="stat-item">
                <div className="stat-num">{stats.accountCount}</div>
                <div className="stat-lbl">Tài khoản</div>
              </div>
            </div>

            {/* Selection info */}
            {selectedIds.size > 0 && (
              <div className="sel-bar">
                Đã chọn <strong>{selectedIds.size}</strong> nhóm QC
                <button className="sel-clear" onClick={() => setSelectedIds(new Set())}>Bỏ chọn</button>
                <button className="sel-budget" onClick={() => setBulkModal(true)}>Tăng NS nhanh →</button>
              </div>
            )}

            {/* Table */}
            <div className="table-wrap">
              <table className="adset-table">
                <thead>
                  <tr>
                    <th className="th-chk">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={togglePageSelect}
                        title="Chọn tất cả trang này"
                      />
                    </th>
                    <th className="th-name" onClick={() => handleSort('name')}>
                      Nhóm quảng cáo <SortIcon col="name" sortBy={sortBy} sortDir={sortDir} />
                    </th>
                    <th onClick={() => handleSort('account_name')}>
                      Tài khoản <SortIcon col="account_name" sortBy={sortBy} sortDir={sortDir} />
                    </th>
                    <th className="th-status">Trạng thái</th>
                    <th className="th-num" onClick={() => handleSort('spend')}>
                      Chi tiêu ↓ <SortIcon col="spend" sortBy={sortBy} sortDir={sortDir} />
                    </th>
                    <th className="th-budget" onClick={() => handleSort('daily_budget')}>
                      Ngân sách <SortIcon col="daily_budget" sortBy={sortBy} sortDir={sortDir} />
                    </th>
                    <th className="th-num" onClick={() => handleSort('purchases')}>
                      Lượt mua <SortIcon col="purchases" sortBy={sortBy} sortDir={sortDir} />
                    </th>
                    <th className="th-num" onClick={() => handleSort('cpa')}>
                      CPA <SortIcon col="cpa" sortBy={sortBy} sortDir={sortDir} />
                    </th>
                    <th className="th-num" onClick={() => handleSort('roas')}>
                      ROAS <SortIcon col="roas" sortBy={sortBy} sortDir={sortDir} />
                    </th>
                    <th className="th-num" onClick={() => handleSort('revenue')}>
                      Doanh thu <SortIcon col="revenue" sortBy={sortBy} sortDir={sortDir} />
                    </th>
                    <th className="th-num" onClick={() => handleSort('impressions')}>
                      Hiển thị <SortIcon col="impressions" sortBy={sortBy} sortDir={sortDir} />
                    </th>
                    <th className="th-num" onClick={() => handleSort('ctr')}>
                      CTR <SortIcon col="ctr" sortBy={sortBy} sortDir={sortDir} />
                    </th>
                    <th className="th-num">Lãi/Lỗ</th>
                    <th>Cảnh báo</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && adsets.length === 0 ? (
                    <SkeletonRows />
                  ) : pageAdsets.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="empty-td">
                        <div className="camp-empty">
                          <div className="empty-icon">📭</div>
                          <div className="empty-text">Không có nhóm quảng cáo nào</div>
                          <div className="empty-sub">
                            {filters.search ? 'Thử thay đổi từ khoá tìm kiếm' : 'Chưa có nhóm QC ACTIVE hoặc PAUSED trong tài khoản được chọn'}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pageAdsets.map(adset => {
                      const isHighCpa = cpaThresh > 0 && adset.cpa > cpaThresh
                      const isLowRoas = roasThresh > 0 && adset.roas > 0 && adset.roas < roasThresh
                      const isHighBudget = adset.budget_util_pct >= 90
                      const selected = selectedIds.has(adset.id)

                      return (
                        <tr
                          key={adset.id}
                          className={`adset-row${selected ? ' row-selected' : ''}${loading ? ' row-dimmed' : ''}`}
                        >
                          <td className="td-chk">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleRow(adset.id)}
                            />
                          </td>

                          <td className="td-name">
                            <div className="adset-name-main">{adset.name}</div>
                            <div className="adset-name-sub">
                              {adset.account_name}
                              {adset.campaign_name && <> · {adset.campaign_name}</>}
                              {adset.objective && <> · {adset.objective}</>}
                            </div>
                          </td>

                          <td className="td-account">
                            <div>{adset.account_name}</div>
                            <div className="sub-text">{adset.currency}</div>
                          </td>

                          <td className="td-status">
                            <StatusToggle
                              adset={adset}
                              onToggle={toggleAdset}
                              toggling={toggling}
                            />
                          </td>

                          <td className="td-num">
                            ₫{fmtVnd(Math.round(adset.spend))}
                          </td>

                          <td className="td-budget">
                            {adset.daily_budget ? (
                              <div
                                className="budget-wrap"
                                onClick={() => setBudgetModal({ adset })}
                                title="Nhấn để chỉnh ngân sách"
                              >
                                <BudgetBar
                                  budget={adset.daily_budget}
                                  spend={adset.spend}
                                  pct={adset.budget_util_pct}
                                />
                              </div>
                            ) : (
                              <span className="sub-text">—</span>
                            )}
                          </td>

                          <td className="td-num">
                            {adset.purchases > 0 ? (
                              <span className="val-green">{fmtNum(adset.purchases)}</span>
                            ) : (
                              <span className="val-muted">—</span>
                            )}
                          </td>

                          <td className="td-num">
                            {adset.cpa > 0 ? (
                              <span className={isHighCpa ? 'val-red' : ''}>
                                ₫{fmtVnd(Math.round(adset.cpa))}
                              </span>
                            ) : (
                              <span className="val-muted">—</span>
                            )}
                          </td>

                          <td className="td-num">
                            {adset.roas > 0 ? (
                              <span className={isLowRoas ? 'val-red' : ''}>
                                {fmtRoas(adset.roas)}
                              </span>
                            ) : (
                              <span className="val-muted">—</span>
                            )}
                          </td>

                          <td className="td-num">
                            {adset.revenue > 0
                              ? `₫${fmtVnd(Math.round(adset.revenue))}`
                              : <span className="val-muted">—</span>
                            }
                          </td>

                          <td className="td-num">
                            {fmtNum(adset.impressions)}
                          </td>

                          <td className="td-num">
                            {fmtCtr(adset.ctr)}
                          </td>

                          <td className="td-num">
                            <span className="val-muted">—</span>
                          </td>

                          <td className="td-warn">
                            <div className="warn-list">
                              {isHighCpa && <span className="warn-badge warn-cpa">⚠️ CPA cao</span>}
                              {isHighBudget && <span className="warn-badge warn-ns">⚠️ NS gần hết</span>}
                              {isLowRoas && <span className="warn-badge warn-roas">⚠️ ROAS thấp</span>}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filtered.length > 0 && (
              <div className="pagination">
                <div className="pagi-info">
                  Hiển thị {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} trong {filtered.length} nhóm quảng cáo
                </div>
                <div className="pagi-btns">
                  <button
                    className="pagi-btn"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >← Trước</button>
                  <span className="pagi-label">Trang {page} / {totalPages}</span>
                  <button
                    className="pagi-btn"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >Tiếp →</button>
                </div>
              </div>
            )}
          </>
        )}

      </div>

      {/* Modals */}
      {budgetModal && (
        <BudgetModal
          adset={budgetModal.adset}
          onClose={() => setBudgetModal(null)}
          onSave={handleBudgetSave}
          saving={budgetSaving}
        />
      )}

      {bulkModal && (
        <BulkBudgetModal
          count={selectedIds.size}
          onClose={() => setBulkModal(false)}
          onSave={handleBulkBudget}
          saving={budgetSaving}
        />
      )}

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(t => (
          <Toast key={t.id} msg={t.msg} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>

      <style jsx>{`
        .dh-root { padding: 20px; min-width: 0; }

        /* Welcome */
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
          text-decoration: none; white-space: nowrap;
          transition: opacity .15s;
        }
        .upgrade-btn:hover { opacity: .85; }
        .upgrade-btn--soft { background: var(--s3); color: var(--txt); }

        /* FB CTA */
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

        /* Filter bar */
        .filter-bar {
          background: var(--s1); border: 1px solid var(--bd); border-radius: 12px;
          padding: 12px 16px; margin-bottom: 12px;
        }
        .filter-row {
          display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
        }
        .filter-search {
          flex: 1; min-width: 160px; max-width: 240px;
          padding: 7px 12px; border: 1px solid var(--bd); border-radius: 8px;
          background: var(--s2); color: var(--txt); font-size: 13px; font-family: inherit;
          outline: none;
        }
        .filter-search:focus { border-color: var(--blue); }
        .filter-search::placeholder { color: var(--mut); }

        .filter-sel {
          padding: 7px 10px; border: 1px solid var(--bd); border-radius: 8px;
          background: var(--s2); color: var(--txt); font-size: 12px;
          font-family: inherit; outline: none; cursor: pointer; min-width: 100px;
        }
        .filter-sel:focus { border-color: var(--blue); }

        .filter-threshold {
          display: flex; align-items: center; gap: 5px;
        }
        .filter-label { font-size: 12px; color: var(--mut); white-space: nowrap; font-weight: 600; }
        .filter-num {
          width: 100px; padding: 7px 10px;
          border: 1px solid var(--bd); border-radius: 8px;
          background: var(--s2); color: var(--txt); font-size: 12px;
          font-family: inherit; outline: none;
        }
        .filter-num:focus { border-color: var(--blue); }
        .filter-num::placeholder { color: var(--mut); }

        .filter-compare {
          display: flex; align-items: center; gap: 5px;
          font-size: 12px; color: var(--txt); cursor: pointer; white-space: nowrap;
        }
        .filter-compare input { cursor: pointer; }

        .filter-refresh {
          padding: 7px 14px; background: var(--s2); border: 1px solid var(--bd);
          border-radius: 8px; font-size: 12px; color: var(--txt);
          cursor: pointer; white-space: nowrap; font-family: inherit;
          transition: background .15s;
        }
        .filter-refresh:hover:not(:disabled) { background: var(--s3); }
        .filter-refresh:disabled { opacity: .6; cursor: default; }

        /* Stats bar */
        .stats-bar {
          display: flex; flex-wrap: wrap; align-items: center; gap: 0;
          background: var(--s1); border: 1px solid var(--bd); border-radius: 12px;
          padding: 12px 16px; margin-bottom: 10px;
        }
        .stat-item { padding: 4px 14px; text-align: center; }
        .stat-num { font-size: 15px; font-weight: 700; color: var(--txt); line-height: 1.3; }
        .stat-lbl { font-size: 10px; color: var(--mut); font-weight: 600; text-transform: uppercase; letter-spacing: .3px; margin-top: 1px; }
        .stat-warn { color: var(--ylw); }
        .stat-sep { width: 1px; height: 36px; background: var(--bd); flex-shrink: 0; }

        .btn-quick-budget {
          margin: 0 10px; padding: 8px 16px;
          background: linear-gradient(135deg, #fe5f01 0%, #f59e0b 100%);
          color: #fff; border: none; border-radius: 8px;
          font-size: 12px; font-weight: 700; cursor: pointer;
          white-space: nowrap; font-family: inherit;
          box-shadow: 0 2px 8px rgba(254,95,1,.35);
          transition: opacity .15s, transform .1s;
          flex-shrink: 0;
        }
        .btn-quick-budget:hover { opacity: .9; transform: translateY(-1px); }

        /* Selection bar */
        .sel-bar {
          display: flex; align-items: center; gap: 10px;
          background: rgba(59,130,246,.08); border: 1px solid rgba(59,130,246,.2);
          border-radius: 10px; padding: 8px 14px; margin-bottom: 10px;
          font-size: 13px; color: var(--txt);
        }
        .sel-clear {
          background: none; border: 1px solid var(--bd); border-radius: 6px;
          padding: 3px 10px; font-size: 12px; color: var(--mut);
          cursor: pointer; font-family: inherit;
        }
        .sel-budget {
          background: #fe5f01; color: #fff; border: none; border-radius: 6px;
          padding: 4px 12px; font-size: 12px; font-weight: 700;
          cursor: pointer; font-family: inherit;
        }

        /* Table */
        .table-wrap {
          background: var(--s1); border: 1px solid var(--bd); border-radius: 12px;
          overflow-x: auto; margin-bottom: 12px;
        }
        .adset-table {
          width: 100%; border-collapse: collapse; font-size: 12.5px;
          min-width: 1100px;
        }
        .adset-table thead tr {
          background: var(--s2);
          position: sticky; top: 0; z-index: 2;
        }
        .adset-table th {
          text-align: left; padding: 10px 10px;
          font-size: 11px; font-weight: 700; color: var(--mut);
          text-transform: uppercase; letter-spacing: .3px;
          border-bottom: 1px solid var(--bd); white-space: nowrap;
          cursor: default; user-select: none;
        }
        .adset-table th:not(.th-chk):not(.th-name):not(.td-status) { cursor: pointer; }
        .adset-table th:hover:not(.th-chk):not(.th-name) { color: var(--txt); }
        .adset-table td {
          padding: 9px 10px; border-bottom: 1px solid var(--bd);
          color: var(--txt); vertical-align: middle;
        }
        .adset-table tr:last-child td { border-bottom: none; }
        .adset-table tbody tr:hover td { background: var(--s2); }
        .th-chk, .td-chk { width: 36px; text-align: center; }
        .th-name  { min-width: 200px; }
        .th-num, .td-num { text-align: right; min-width: 80px; }
        .th-budget, .td-budget { min-width: 160px; }
        .th-status, .td-status { min-width: 100px; }
        .td-warn { min-width: 120px; }

        .adset-row { transition: background .1s; }
        .row-selected td { background: rgba(59,130,246,.06) !important; }
        .row-dimmed { opacity: .7; }

        /* Adset name cell */
        .td-name { min-width: 200px; max-width: 280px; }
        .adset-name-main {
          font-weight: 600; color: var(--txt); font-size: 13px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          max-width: 260px;
        }
        .adset-name-sub {
          font-size: 11px; color: var(--mut); margin-top: 2px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          max-width: 260px;
        }

        /* Account cell */
        .td-account { white-space: nowrap; }
        .sub-text { font-size: 11px; color: var(--mut); }

        /* Status toggle */
        .toggle-sw {
          width: 38px; height: 22px; border-radius: 11px;
          background: var(--s3); border: 1px solid var(--bd);
          position: relative; cursor: pointer; transition: background .2s, border-color .2s;
          flex-shrink: 0; display: inline-block;
          padding: 0;
        }
        .toggle-sw--on {
          background: #3b82f6; border-color: #3b82f6;
        }
        .toggle-sw--on:hover { background: #2563eb; }
        .toggle-knob {
          position: absolute; top: 2px; left: 2px;
          width: 16px; height: 16px; border-radius: 50%;
          background: #fff; transition: transform .2s;
          box-shadow: 0 1px 3px rgba(0,0,0,.2);
          display: block;
        }
        .toggle-sw--on .toggle-knob { transform: translateX(16px); }
        .toggle-sw:disabled { opacity: .5; cursor: default; }

        .badge-camp-paused {
          display: inline-block; padding: 3px 7px; border-radius: 6px;
          background: var(--s3); color: var(--mut); font-size: 10px; font-weight: 600;
          white-space: nowrap;
        }

        /* Budget bar */
        .budget-wrap { cursor: pointer; }
        .budget-wrap:hover .budget-text { text-decoration: underline; }
        .budget-cell { min-width: 140px; }
        .budget-text { font-size: 12px; color: var(--txt); margin-bottom: 4px; white-space: nowrap; }
        .budget-day { color: var(--mut); }
        .budget-pct { font-weight: 700; }
        .budget-bar-track {
          height: 4px; border-radius: 2px; background: var(--s3);
          overflow: hidden;
        }
        .budget-bar-fill {
          height: 100%; border-radius: 2px; transition: width .3s;
        }

        /* Values */
        .val-green { color: var(--grn); font-weight: 600; }
        .val-red   { color: var(--red); font-weight: 600; }
        .val-muted { color: var(--mut); }

        /* Warnings */
        .warn-list { display: flex; flex-direction: column; gap: 3px; }
        .warn-badge {
          display: inline-block; padding: 2px 7px; border-radius: 5px;
          font-size: 10px; font-weight: 700; white-space: nowrap;
        }
        .warn-cpa  { background: rgba(239,68,68,.12); color: var(--red); }
        .warn-ns   { background: rgba(245,158,11,.12); color: var(--ylw); }
        .warn-roas { background: rgba(239,68,68,.08); color: var(--red); }

        /* Sort icons */
        .sort-icon { font-size: 10px; margin-left: 3px; }
        .sort-none  { opacity: .35; }
        .sort-active { color: var(--blue); }

        /* Skeleton */
        .skel-tr td { padding: 9px 10px; }
        .skel-cell {
          height: 20px; border-radius: 5px;
          background: linear-gradient(90deg, var(--s2) 25%, var(--s3) 50%, var(--s2) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.2s infinite;
        }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* Empty */
        .empty-td { padding: 0 !important; }
        .camp-empty {
          display: flex; flex-direction: column; align-items: center;
          padding: 48px 20px; gap: 8px; text-align: center;
        }
        .empty-icon { font-size: 30px; }
        .empty-text { font-size: 15px; font-weight: 600; color: var(--txt); }
        .empty-sub  { font-size: 12px; color: var(--mut); max-width: 340px; line-height: 1.5; }

        /* Pagination */
        .pagination {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 10px;
          padding: 10px 2px;
        }
        .pagi-info { font-size: 12px; color: var(--mut); }
        .pagi-btns { display: flex; align-items: center; gap: 8px; }
        .pagi-label { font-size: 12px; color: var(--txt); white-space: nowrap; }
        .pagi-btn {
          padding: 6px 14px; background: var(--s1); border: 1px solid var(--bd);
          border-radius: 8px; font-size: 12px; color: var(--txt);
          cursor: pointer; font-family: inherit; transition: background .15s;
        }
        .pagi-btn:hover:not(:disabled) { background: var(--s2); }
        .pagi-btn:disabled { opacity: .4; cursor: default; }

        /* Modal */
        .modal-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,.55); backdrop-filter: blur(3px);
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .modal-box {
          background: var(--s1); border: 1px solid var(--bd); border-radius: 16px;
          width: 100%; max-width: 420px; box-shadow: 0 20px 60px rgba(0,0,0,.25);
          overflow: hidden;
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
          display: flex; gap: 10px; padding: 14px 20px; border-top: 1px solid var(--bd);
          justify-content: flex-end;
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

        /* Toasts */
      `}</style>

      <style jsx global>{`
        .toast-container {
          position: fixed; bottom: 24px; right: 24px; z-index: 9999;
          display: flex; flex-direction: column; gap: 8px; pointer-events: none;
        }
        .toast-item {
          display: flex; align-items: center; gap: 8px;
          background: var(--s1); border: 1px solid var(--bd);
          border-radius: 10px; padding: 11px 16px;
          font-size: 13px; font-weight: 600; color: var(--txt);
          box-shadow: 0 8px 32px rgba(0,0,0,.2);
          animation: slideUp .25s ease;
          pointer-events: all;
          max-width: 320px;
        }
        .toast-success { border-color: rgba(16,185,129,.4); }
        .toast-error   { border-color: rgba(239,68,68,.4); }
        .toast-close {
          background: none; border: none; color: var(--mut);
          font-size: 16px; cursor: pointer; margin-left: auto; line-height: 1;
          padding: 0 2px;
        }
        .toast-close:hover { color: var(--txt); }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </DashboardLayout>
  )
}
