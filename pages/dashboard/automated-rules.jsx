import { useState, useCallback } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../lib/AuthContext'
import Link from 'next/link'
import useSWR from 'swr'
import { fetcher } from '../../lib/fetcher'
import { isPlanAllowed } from '../../lib/planLimits'
import { Settings2, Link2, Lock, Pencil, Trash2, Save, Eye, Play, Plus, History, Lightbulb, Pause, TrendingUp, TrendingDown, Bell as BellIcon } from 'lucide-react'

function PlanGate({ feature }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: 40 }}>
      <div style={{ marginBottom: 16, color: 'var(--mut)' }}><Lock size={48} /></div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Tính năng này yêu cầu nâng cấp gói</h2>
      <p style={{ color: 'var(--mut)', marginBottom: 24, maxWidth: 400 }}>
        {feature} chỉ dành cho gói <strong>Personal</strong> trở lên. Nâng cấp ngay để sử dụng đầy đủ tính năng.
      </p>
      <Link href="/mua-goi" style={{ background: '#fe5f01', color: '#fff', padding: '12px 28px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
        Nâng cấp ngay →
      </Link>
    </div>
  )
}

const METRICS = [
  { value: 'spend',       label: 'Chi phí (₫)',         unit: '₫' },
  { value: 'cpa',         label: 'CPA (₫/đơn)',         unit: '₫' },
  { value: 'roas',        label: 'ROAS',                unit: '' },
  { value: 'purchases',   label: 'Số đơn hàng',         unit: 'đơn' },
  { value: 'ctr',         label: 'CTR (%)',              unit: '%' },
  { value: 'impressions', label: 'Lượt hiển thị',       unit: '' },
]

const OPERATORS = [
  { value: 'gt',  label: '>' },
  { value: 'lt',  label: '<' },
  { value: 'gte', label: '≥' },
  { value: 'lte', label: '≤' },
]

const ACTIONS = [
  { value: 'pause',         label: 'Dừng adset (PAUSE)',     hasScale: false },
  { value: 'resume',        label: 'Bật lại adset (ACTIVE)',  hasScale: false },
  { value: 'scale_budget',  label: 'Tăng ngân sách',         hasScale: true },
  { value: 'reduce_budget', label: 'Giảm ngân sách',         hasScale: true },
  { value: 'notify_only',   label: 'Chỉ thông báo',          hasScale: false },
]

const TIME_RANGES = [
  { value: 'today',      label: 'Hôm nay' },
  { value: 'yesterday',  label: 'Hôm qua' },
  { value: 'last_3d',    label: '3 ngày qua' },
  { value: 'last_7d',    label: '7 ngày qua' },
  { value: 'last_14d',   label: '14 ngày qua' },
  { value: 'last_30d',   label: '30 ngày qua' },
  { value: 'this_month', label: 'Tháng này' },
  { value: 'maximum',    label: 'Toàn thời gian' },
]

const EMPTY_RULE = {
  name: '',
  conditions: [{ metric: 'cpa', operator: 'gt', value: '' }],
  action: 'pause',
  scale_factor: 1.2,
  budget_cap_min: '',
  budget_cap_max: '',
  account_id: 'all',
  time_range: 'today',
  level: 'adset',
}

function formatNum(n) {
  if (n == null) return 'N/A'
  return Number(n).toLocaleString('vi-VN')
}

const RESULT_LABELS = {
  paused: { label: 'Đã dừng', color: '#ef4444' },
  resumed: { label: 'Đã bật lại', color: '#10b981' },
  notified: { label: 'Đã thông báo', color: '#3b82f6' },
  skipped_not_active: { label: 'Bỏ qua (không active)', color: '#94a3b8' },
  skipped_already_active: { label: 'Bỏ qua (đã active)', color: '#94a3b8' },
  skipped_campaign_paused: { label: 'Bỏ qua (campaign đang dừng)', color: '#f59e0b' },
  budget_unchanged_cap: { label: 'NS không đổi (đạt giới hạn)', color: '#94a3b8' },
  no_budget: { label: 'Không có NS', color: '#94a3b8' },
}

function ResultBadge({ result }) {
  const r = RESULT_LABELS[result]
  if (r) return <span className="res-badge" style={{ color: r.color }}>{r.label}</span>
  if (result?.startsWith('budget_')) {
    const parts = result.replace('budget_', '').split('_→_')
    return <span className="res-badge" style={{ color: '#10b981' }}>NS: {Number(parts[0]).toLocaleString('vi-VN')}₫ → {Number(parts[1]).toLocaleString('vi-VN')}₫</span>
  }
  if (result?.startsWith('dry_run_')) return <span className="res-badge" style={{ color: '#3b82f6' }}>Sẽ: {result.replace('dry_run_', '')}</span>
  return <span className="res-badge">{result}</span>
}

export default function AutomatedRules() {
  const { user } = useAuth()
  const fbConnected = user?.fb_connected

  const [rules, setRules] = useState([])
  const [accounts, setAccounts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_RULE, conditions: [{ metric: 'cpa', operator: 'gt', value: '' }] })
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [runResults, setRunResults] = useState(null)
  const [toast, setToast] = useState(null)

  // Campaign Tree state
  const [campaigns, setCampaigns] = useState([])
  const [selectedCampIds, setSelectedCampIds] = useState([])
  const [selectedAdsetIds, setSelectedAdsetIds] = useState([])
  const [expandedCampIds, setExpandedCampIds] = useState(new Set())
  const [campAdsets, setCampAdsets] = useState({})
  const [loadingAdsets, setLoadingAdsets] = useState({})
  const [treeSearch, setTreeSearch] = useState('')

  // History state
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLogs, setHistoryLogs] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Dry-run state
  const [dryRunning, setDryRunning] = useState(false)
  const [dryRunResults, setDryRunResults] = useState(null)

  // Edit state
  const [editingRuleId, setEditingRuleId] = useState(null)
  const [expandedLogId, setExpandedLogId] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const rulesSwrKey = fbConnected ? '/api/fb/autoset' : null
  const { isValidating: loadingRules, mutate: mutateRules } = useSWR(rulesSwrKey, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
    onSuccess: (data) => { if (data.ok) setRules(data.rules) },
  })

  const accountsSwrKey = fbConnected ? '/api/fb/campaigns?date_preset=today&status=ALL' : null
  const { isValidating: loadingAccounts } = useSWR(accountsSwrKey, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
    onSuccess: (data) => { if (data.ok) setAccounts(data.accounts || []) },
  })

  const campsSwrKey = fbConnected ? '/api/fb/campaigns?date_preset=maximum&status=ALL&level=campaign' : null
  const { isValidating: loadingCamps } = useSWR(campsSwrKey, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
    onSuccess: (data) => { if (data?.ok) setCampaigns(data.adsets || []) },
  })

  const loading = loadingRules || loadingAccounts || loadingCamps

  const loadAdsetsForCampaign = useCallback(async (campId) => {
    if (campAdsets[campId]) return
    setLoadingAdsets(prev => ({ ...prev, [campId]: true }))
    try {
      const res = await fetch(`/api/fb/campaign-adsets?campaign_id=${campId}`)
      const data = await res.json()
      if (data?.ok) setCampAdsets(prev => ({ ...prev, [campId]: data.adsets || [] }))
    } catch {}
    finally { setLoadingAdsets(prev => ({ ...prev, [campId]: false })) }
  }, [campAdsets])

  function toggleTreeExpand(campId) {
    setExpandedCampIds(prev => {
      const next = new Set(prev)
      if (next.has(campId)) { next.delete(campId) } else { next.add(campId); loadAdsetsForCampaign(campId) }
      return next
    })
  }

  function toggleTreeCampaign(campId) {
    const adsets = campAdsets[campId] || []
    const adsetIdSet = new Set(adsets.map(a => a.id))
    if (selectedCampIds.includes(campId)) {
      setSelectedCampIds(prev => prev.filter(x => x !== campId))
    } else {
      setSelectedAdsetIds(prev => prev.filter(id => !adsetIdSet.has(id)))
      setSelectedCampIds(prev => [...prev, campId])
    }
  }

  function toggleTreeAdset(adsetId, campId) {
    setSelectedCampIds(prev => prev.filter(x => x !== campId))
    setSelectedAdsetIds(prev =>
      prev.includes(adsetId) ? prev.filter(x => x !== adsetId) : [...prev, adsetId]
    )
  }

  function getTreeCheckState(campId) {
    if (selectedCampIds.includes(campId)) return 'checked'
    const adsets = campAdsets[campId] || []
    if (!adsets.length) return 'unchecked'
    const count = adsets.filter(a => selectedAdsetIds.includes(a.id)).length
    if (count === 0) return 'unchecked'
    if (count === adsets.length) return 'checked'
    return 'indeterminate'
  }

  const filteredTreeCampaigns = campaigns.filter(c => {
    const accountFilter = form.account_id && form.account_id !== 'all'
    if (accountFilter && c.account_id !== form.account_id) return false
    if (!treeSearch) return true
    const q = treeSearch.toLowerCase()
    if (c.name.toLowerCase().includes(q)) return true
    return (campAdsets[c.id] || []).some(a => a.name.toLowerCase().includes(q))
  })

  function startEdit(rule) {
    setEditingRuleId(rule.id)
    setForm({
      name: rule.name,
      conditions: rule.conditions || [{ metric: 'cpa', operator: 'gt', value: '' }],
      action: rule.action,
      scale_factor: rule.scale_factor || 1.2,
      budget_cap_min: rule.budget_cap_min || '',
      budget_cap_max: rule.budget_cap_max || '',
      account_id: rule.account_id || 'all',
      time_range: rule.time_range || 'today',
      level: rule.level || 'adset',
    })
    setSelectedCampIds(rule.selected_campaigns || [])
    setSelectedAdsetIds(rule.selected_adsets || [])
    setTreeSearch('')
    setShowForm(true)
    setRunResults(null)
  }

  async function fetchHistory() {
    setLoadingHistory(true)
    try {
      const r = await fetch('/api/fb/autoset?action=history&limit=50')
      const d = await r.json()
      if (d.ok) setHistoryLogs(d.logs || [])
    } catch {}
    finally { setLoadingHistory(false) }
  }

  function toggleHistory() {
    const next = !historyOpen
    setHistoryOpen(next)
    if (next) fetchHistory()
  }

  async function handleDryRun() {
    setDryRunning(true)
    setDryRunResults(null)
    try {
      const r = await fetch('/api/fb/autoset-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dry_run: true })
      })
      const d = await r.json()
      if (d.ok) setDryRunResults(d)
      else showToast(d.error || 'Lỗi dry-run', 'error')
    } catch { showToast('Lỗi kết nối', 'error') }
    finally { setDryRunning(false) }
  }

  function updateCondition(idx, field, val) {
    setForm(prev => {
      const conds = [...prev.conditions]
      conds[idx] = { ...conds[idx], [field]: val }
      return { ...prev, conditions: conds }
    })
  }

  function addCondition() {
    setForm(prev => ({
      ...prev,
      conditions: [...prev.conditions, { metric: 'spend', operator: 'gt', value: '' }]
    }))
  }

  function removeCondition(idx) {
    setForm(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== idx)
    }))
  }

  async function handleSave() {
    if (!form.name.trim()) return showToast('Vui lòng đặt tên cho rule', 'error')
    const invalid = form.conditions.some(c => !c.value || isNaN(Number(c.value)))
    if (invalid) return showToast('Vui lòng nhập giá trị hợp lệ cho tất cả điều kiện', 'error')

    setSaving(true)
    try {
      const isEdit = !!editingRuleId
      const body = {
        action: isEdit ? 'update' : 'create',
        ...(isEdit && { id: editingRuleId }),
        name: form.name,
        conditions: form.conditions.map(c => ({ ...c, value: Number(c.value) })),
        ruleAction: form.action,
        scale_factor: Number(form.scale_factor) || 1.2,
        budget_cap_min: Number(form.budget_cap_min) || 0,
        budget_cap_max: Number(form.budget_cap_max) || 0,
        account_id: form.account_id,
        time_range: form.time_range,
        level: form.level || 'adset',
        selected_campaigns: selectedCampIds,
        selected_adsets: selectedAdsetIds,
      }
      const r = await fetch('/api/fb/autoset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const d = await r.json()
      if (!d.ok) return showToast(d.error || 'Lỗi lưu rule', 'error')
      showToast(isEdit ? 'Đã cập nhật rule' : 'Đã tạo rule thành công')
      setShowForm(false)
      setEditingRuleId(null)
      setForm({ ...EMPTY_RULE, conditions: [{ metric: 'cpa', operator: 'gt', value: '' }] })
      setSelectedCampIds([])
      setSelectedAdsetIds([])
      setTreeSearch('')
      mutateRules()
    } catch { showToast('Lỗi kết nối', 'error') }
    finally { setSaving(false) }
  }

  async function toggleRule(id, enabled) {
    await fetch('/api/fb/autoset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', id, enabled: !enabled })
    })
    mutateRules()
  }

  async function deleteRule(id, name) {
    if (!confirm(`Xoá rule "${name}"?`)) return
    await fetch('/api/fb/autoset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id })
    })
    showToast('Đã xoá rule')
    mutateRules()
  }

  async function handleRun() {
    setRunning(true)
    setRunResults(null)
    try {
      const r = await fetch('/api/fb/autoset-run', { method: 'POST' })
      const d = await r.json()
      if (!d.ok) return showToast(d.error || 'Lỗi chạy rules', 'error')
      setRunResults(d)
      showToast(`Đã chạy xong — ${d.total_affected} adset bị tác động`)
      mutateRules()
      if (historyOpen) fetchHistory()
    } catch { showToast('Lỗi kết nối', 'error') }
    finally { setRunning(false) }
  }

  const actionInfo = ACTIONS.find(a => a.value === form.action)

  if (!fbConnected) {
    return (
      <DashboardLayout title="Quy tắc tự động">
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 16, padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ color: 'var(--mut)' }}><Link2 size={36} /></div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt)' }}>Cần kết nối Facebook Ads</div>
            <div style={{ fontSize: 13, color: 'var(--mut)', maxWidth: 380, lineHeight: 1.6 }}>Tính năng Quy tắc tự động yêu cầu kết nối tài khoản Facebook Ads.</div>
            <Link href="/settings/connect-facebook" style={{ background: '#1877f2', color: '#fff', borderRadius: 9, padding: '10px 20px', fontSize: 13, fontWeight: 700, textDecoration: 'none', marginTop: 8 }}>Kết nối ngay →</Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!isPlanAllowed(user?.plan, 'autoset')) {
    return <DashboardLayout title="Quy tắc tự động"><PlanGate feature="Quy tắc tự động" /></DashboardLayout>
  }

  return (
    <DashboardLayout title="Quy tắc tự động">
      <div className="as-page">

        {toast && (
          <div className={`toast ${toast.type}`}>{toast.msg}</div>
        )}

        {/* Header */}
        <div className="page-header">
          <div className="ph-left">
            <span className="ph-icon"><Settings2 size={22} /></span>
            <div>
              <h1>Quy tắc tự động</h1>
              <p>Tạo rules tự động kiểm soát và tối ưu adset theo điều kiện</p>
            </div>
          </div>
          <div className="ph-actions">
            <button className="btn-preview" onClick={handleDryRun} disabled={dryRunning || running || !rules.filter(r => r.enabled).length}>
              {dryRunning ? '...' : <><Eye size={14} style={{ verticalAlign: -2 }} /> Xem trước</>}
            </button>
            <button className="btn-run" onClick={handleRun} disabled={running || dryRunning || !rules.filter(r => r.enabled).length}>
              {running ? 'Đang chạy...' : <><Play size={13} style={{ verticalAlign: -2 }} /> Chạy Rules Ngay</>}
            </button>
            <button className="btn-add" onClick={() => { setShowForm(true); setRunResults(null); setSelectedCampIds([]); setSelectedAdsetIds([]) }}>
              + Tạo Rule mới
            </button>
          </div>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="form-card">
            <div className="form-title">{editingRuleId ? 'Sửa Rule' : 'Tạo Rule mới'}</div>

            <div className="form-row">
              <label>Tên Rule</label>
              <input
                type="text" placeholder="VD: Dừng adset CPA cao"
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="inp"
              />
            </div>

            <div className="form-row">
              <label>Áp dụng cho</label>
              <div className="level-tabs">
                <button className={`level-tab${form.level === 'adset' ? ' active' : ''}`} onClick={() => setForm(p => ({ ...p, level: 'adset' }))}>
                  Nhóm QC (Adset)
                </button>
                <button className={`level-tab${form.level === 'campaign' ? ' active' : ''}`} onClick={() => setForm(p => ({ ...p, level: 'campaign' }))}>
                  Chiến dịch (Campaign)
                </button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 4 }}>
                {form.level === 'campaign'
                  ? 'Rule sẽ kiểm tra metrics và tắt/bật/scale ở cấp chiến dịch. Pause campaign = tắt tất cả adsets bên trong.'
                  : 'Rule sẽ kiểm tra metrics và tắt/bật/scale từng nhóm QC riêng lẻ.'}
              </div>
            </div>

            <div className="form-row">
              <label>Thời gian đánh giá</label>
              <select value={form.time_range} onChange={e => setForm(p => ({ ...p, time_range: e.target.value }))} className="inp">
                {TIME_RANGES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div className="form-row">
              <label>Tài khoản áp dụng</label>
              <select value={form.account_id} onChange={e => setForm(p => ({ ...p, account_id: e.target.value }))} className="inp">
                <option value="all">Tất cả tài khoản</option>
                {accounts.map(a => <option key={a.account_id} value={a.account_id}>{a.account_name || a.account_id}</option>)}
              </select>
            </div>

            <div className="form-row">
              <label>Điều kiện (ALL phải đúng)</label>
              <div className="conditions">
                {form.conditions.map((c, i) => (
                  <div key={i} className="condition-row">
                    <select value={c.metric} onChange={e => updateCondition(i, 'metric', e.target.value)} className="cond-sel">
                      {METRICS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <select value={c.operator} onChange={e => updateCondition(i, 'operator', e.target.value)} className="cond-op">
                      {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <input
                      type="number" placeholder="Giá trị" min="0"
                      value={c.value} onChange={e => updateCondition(i, 'value', e.target.value)}
                      className="cond-val"
                    />
                    <span className="cond-unit">{METRICS.find(m => m.value === c.metric)?.unit}</span>
                    {form.conditions.length > 1 && (
                      <button className="cond-del" onClick={() => removeCondition(i)}>✕</button>
                    )}
                  </div>
                ))}
                <button className="add-cond-btn" onClick={addCondition}>+ Thêm điều kiện</button>
              </div>
            </div>

            <div className="form-row">
              <label>Hành động thực hiện</label>
              <select value={form.action} onChange={e => setForm(p => ({ ...p, action: e.target.value }))} className="inp">
                {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>

            {actionInfo?.hasScale && (
              <>
                <div className="form-row">
                  <label>{form.action === 'scale_budget' ? 'Tăng ngân sách theo hệ số' : 'Giảm ngân sách theo hệ số'}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number" min="1.01" max="3" step="0.05"
                      value={form.scale_factor}
                      onChange={e => setForm(p => ({ ...p, scale_factor: e.target.value }))}
                      className="inp" style={{ maxWidth: 120 }}
                    />
                    <span style={{ fontSize: 13, color: 'var(--mut)' }}>
                      (= {Math.round((Number(form.scale_factor || 1) - 1) * 100)}% {form.action === 'scale_budget' ? 'tăng' : 'giảm'})
                    </span>
                  </div>
                </div>
                <div className="form-row">
                  <label>Giới hạn ngân sách (₫) — tránh tăng/giảm vô hạn</label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--mut)', whiteSpace: 'nowrap' }}>Tối thiểu</span>
                      <input
                        type="number" min="0" placeholder="VD: 50000"
                        value={form.budget_cap_min}
                        onChange={e => setForm(p => ({ ...p, budget_cap_min: e.target.value }))}
                        className="inp" style={{ maxWidth: 140 }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--mut)', whiteSpace: 'nowrap' }}>Tối đa</span>
                      <input
                        type="number" min="0" placeholder="VD: 500000"
                        value={form.budget_cap_max}
                        onChange={e => setForm(p => ({ ...p, budget_cap_max: e.target.value }))}
                        className="inp" style={{ maxWidth: 140 }}
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 4 }}>Để 0 = không giới hạn. Budget sẽ không vượt quá max hoặc thấp hơn min.</div>
                </div>
              </>
            )}

            {form.action === 'notify_only' && (
              <div className="form-row">
                <div style={{ padding: '10px 14px', background: 'rgba(59,130,246,.07)', border: '1px solid rgba(59,130,246,.2)', borderRadius: 9, fontSize: 12, color: 'var(--mut)', lineHeight: 1.6 }}>
                  ℹ️ Rule sẽ chỉ kiểm tra điều kiện và hiển thị kết quả khi nhấn &ldquo;Chạy Rules Ngay&rdquo;. Không tự động tắt/bật hay thay đổi ngân sách.
                </div>
              </div>
            )}

            {/* Campaign Tree Selector */}
            <div className="form-row">
              <label>Áp dụng cho campaign/adset cụ thể (tuỳ chọn)</label>
              <input
                type="text" className="inp" placeholder="Tìm chiến dịch, nhóm QC..."
                value={treeSearch} onChange={e => setTreeSearch(e.target.value)}
                style={{ marginBottom: 8 }}
              />
              <div className="tree-list">
                <div className="tree-header">
                  <span style={{ fontSize: 11, color: 'var(--mut)', fontWeight: 600 }}>
                    {selectedCampIds.length} chiến dịch, {selectedAdsetIds.length} nhóm QC đã chọn
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--mut)' }}>Để trống = tất cả</span>
                </div>
                {campaigns.length === 0 && (
                  <div style={{ padding: 12, fontSize: 12, color: 'var(--mut)', textAlign: 'center' }}>
                    Đang tải chiến dịch...
                  </div>
                )}
                {campaigns.length > 0 && filteredTreeCampaigns.length === 0 && (
                  <div style={{ padding: 12, fontSize: 12, color: 'var(--mut)', textAlign: 'center' }}>
                    Không tìm thấy chiến dịch phù hợp
                  </div>
                )}
                {filteredTreeCampaigns.map(c => {
                  const checkState = getTreeCheckState(c.id)
                  const isExpanded = expandedCampIds.has(c.id)
                  const adsets = campAdsets[c.id] || []
                  return (
                    <div key={c.id} className="tree-node">
                      <div className={`tree-row${checkState !== 'unchecked' ? ' tree-row-sel' : ''}`}>
                        <button className="tree-expand" onClick={() => toggleTreeExpand(c.id)}>{isExpanded ? '▼' : '▶'}</button>
                        <input type="checkbox" checked={checkState === 'checked'} ref={el => { if (el) el.indeterminate = checkState === 'indeterminate' }} onChange={() => toggleTreeCampaign(c.id)} />
                        <div className="tree-info" onClick={() => toggleTreeExpand(c.id)}>
                          <div className="tree-name">{c.name}</div>
                          <div className="tree-meta">{c.account_name} <span className={`tree-st ${c.effective_status === 'ACTIVE' ? 'tree-st-on' : 'tree-st-off'}`}>{c.effective_status}</span></div>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="tree-adsets">
                          {loadingAdsets[c.id] ? <div className="tree-loading">Đang tải...</div>
                          : adsets.length === 0 ? <div className="tree-loading">Không có nhóm QC</div>
                          : adsets.map(a => (
                            <label key={a.id} className={`tree-adset-row${selectedAdsetIds.includes(a.id) ? ' tree-row-sel' : ''}`}>
                              <input type="checkbox" checked={selectedAdsetIds.includes(a.id) || selectedCampIds.includes(c.id)} disabled={selectedCampIds.includes(c.id)} onChange={() => toggleTreeAdset(a.id, c.id)} />
                              <span className="tree-adset-name">{a.name}</span>
                              <span className={`tree-st ${a.effective_status === 'ACTIVE' ? 'tree-st-on' : 'tree-st-off'}`}>{a.effective_status}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="form-btns">
              <button className="btn-cancel" onClick={() => { setShowForm(false); setEditingRuleId(null) }}>Huỷ</button>
              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? 'Đang lưu...' : editingRuleId ? 'Cập nhật Rule' : 'Lưu Rule'}
              </button>
            </div>
          </div>
        )}

        {/* Run results */}
        {runResults && (
          <div className="results-card">
            <div className="res-title">
              Kết quả chạy — {runResults.total_affected} adset bị tác động
            </div>
            {runResults.results.map((r, i) => (
              <div key={i} className="res-rule">
                <div className="res-rule-name">
                  {r.rule_name}
                  <span className="res-summary">{r.summary}</span>
                </div>
                {r._debug && (
                  <div style={{ fontSize: 10, color: 'var(--mut)', marginBottom: 6, fontFamily: 'monospace', lineHeight: 1.6 }}>
                    [Debug] time_range: {r._debug.time_range} | adsets: {r._debug.adsets_total} | có insights: {r._debug.insights_total} | bỏ qua (filter): {r._debug.skipped_filter} | bỏ qua (không data): {r._debug.skipped_no_insights} | bỏ qua (không match): {r._debug.skipped_condition} | match: {r._debug.matched}
                    {r._log_error && <><br /><span style={{ color: '#ef4444' }}>[Log Error] {r._log_error}</span></>}
                  </div>
                )}
                {r.affected.length > 0 && (
                  <table className="res-table">
                    <thead>
                      <tr><th>Adset</th><th>Chi phí</th><th>Đơn</th><th>CPA</th><th>ROAS</th><th>Kết quả</th></tr>
                    </thead>
                    <tbody>
                      {r.affected.map((a, j) => (
                        <tr key={j}>
                          <td className="adset-name">{a.adset_name}</td>
                          <td>{formatNum(a.metrics.spend)}₫</td>
                          <td>{a.metrics.purchases}</td>
                          <td>{a.metrics.cpa != null ? `${formatNum(a.metrics.cpa)}₫` : 'N/A'}</td>
                          <td>{a.metrics.roas}</td>
                          <td><ResultBadge result={a.result} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Rules list */}
        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : rules.length === 0 ? (
          <div className="empty">
            <div style={{ color: 'var(--mut)' }}><Settings2 size={36} /></div>
            <div style={{ fontWeight: 700 }}>Chưa có rule nào</div>
            <div style={{ fontSize: 13, color: 'var(--mut)' }}>Tạo rule đầu tiên để tự động kiểm soát adset theo điều kiện bạn đặt ra</div>
            <button className="btn-add" onClick={() => setShowForm(true)}>+ Tạo Rule đầu tiên</button>
          </div>
        ) : (
          <div className="rules-list">
            {rules.map(rule => (
              <div key={rule.id} className={`rule-card ${rule.enabled ? 'active' : 'disabled'}`}>
                <div className="rule-header">
                  <div className="rule-left">
                    <button
                      className={`toggle-btn ${rule.enabled ? 'on' : 'off'}`}
                      role="switch" aria-checked={rule.enabled}
                      aria-label={`${rule.name}: ${rule.enabled ? 'đang bật' : 'đang tắt'}`}
                      onClick={() => toggleRule(rule.id, rule.enabled)}
                    >
                      <span className="toggle-thumb" />
                    </button>
                    <div>
                      <div className="rule-name">{rule.name}</div>
                      <div className="rule-meta">
                        {rule.level === 'campaign' ? 'Campaign' : 'Adset'}
                        {' · '}
                        {TIME_RANGES.find(t => t.value === rule.time_range)?.label || rule.time_range}
                        {' · '}
                        {rule.account_id === 'all' ? 'Tất cả tài khoản' : rule.account_id}
                        {rule.last_run_at && <> · Chạy lần cuối: {new Date(rule.last_run_at).toLocaleString('vi-VN')}</>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="edit-btn" onClick={() => startEdit(rule)} title="Sửa rule"><Pencil size={14} /></button>
                    <button className="del-btn" onClick={() => deleteRule(rule.id, rule.name)}><Trash2 size={14} /></button>
                  </div>
                </div>

                <div className="rule-body">
                  <div className="rule-conditions">
                    {(rule.conditions || []).map((c, i) => {
                      const m = METRICS.find(x => x.value === c.metric)
                      const op = OPERATORS.find(x => x.value === c.operator)
                      return (
                        <span key={i} className="cond-tag">
                          {m?.label} {op?.label} {Number(c.value).toLocaleString('vi-VN')}{m?.unit}
                        </span>
                      )
                    })}
                  </div>
                  <div className="rule-action-badge">
                    {ACTIONS.find(a => a.value === rule.action)?.label || rule.action}
                    {(rule.action === 'scale_budget' || rule.action === 'reduce_budget') &&
                      ` ×${rule.scale_factor}`}
                    {(rule.action === 'scale_budget' || rule.action === 'reduce_budget') &&
                      (rule.budget_cap_min > 0 || rule.budget_cap_max > 0) && (
                        <span style={{ fontSize: 10, opacity: .7, marginLeft: 4 }}>
                          [{rule.budget_cap_min > 0 ? `min ${Number(rule.budget_cap_min).toLocaleString('vi-VN')}₫` : ''}
                          {rule.budget_cap_min > 0 && rule.budget_cap_max > 0 ? ' — ' : ''}
                          {rule.budget_cap_max > 0 ? `max ${Number(rule.budget_cap_max).toLocaleString('vi-VN')}₫` : ''}]
                        </span>
                      )}
                  </div>
                </div>

                {rule.last_run_summary && (
                  <div className="rule-last-result">{rule.last_run_summary}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* History section */}
        <div className="history-section">
          <div className="history-header" onClick={toggleHistory} style={{ cursor: 'pointer' }}>
            <span style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}><History size={15} /> Lịch sử chạy</span>
            <span style={{ fontSize: 12, color: 'var(--mut)' }}>{historyOpen ? '▲' : '▼'}</span>
          </div>
          {historyOpen && (
            loadingHistory ? <div style={{ padding: 12, fontSize: 12, color: 'var(--mut)' }}>Đang tải...</div>
            : historyLogs.length === 0 ? <div style={{ padding: 12, fontSize: 12, color: 'var(--mut)' }}>Chưa có lịch sử chạy</div>
            : <div style={{ marginTop: 8 }}>
                <table className="res-table">
                  <thead>
                    <tr><th>Thời gian</th><th>Rule</th><th>Hành động</th><th>Kết quả</th><th></th></tr>
                  </thead>
                  <tbody>
                    {historyLogs.map(log => (
                      <tr key={log.id} style={{ cursor: 'pointer' }} onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}>
                        <td style={{ whiteSpace: 'nowrap', fontSize: 11 }}>{new Date(log.created_at).toLocaleString('vi-VN')}</td>
                        <td style={{ fontWeight: 600 }}>{log.rule_name}</td>
                        <td><ResultBadge result={log.action} /></td>
                        <td>{log.affected_count > 0 ? `${log.affected_count} tác động` : 'Không match'}</td>
                        <td style={{ fontSize: 10, color: 'var(--mut)' }}>{expandedLogId === log.id ? '▲' : '▼'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {expandedLogId && (() => {
                  const log = historyLogs.find(l => l.id === expandedLogId)
                  if (!log?.details?.length) return <div style={{ padding: 10, fontSize: 12, color: 'var(--mut)' }}>Không có chi tiết</div>
                  return (
                    <div style={{ margin: '8px 0 12px', padding: '10px 12px', background: 'var(--s2)', borderRadius: 9, border: '1px solid var(--bd)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mut)', marginBottom: 6 }}>Chi tiết — {log.rule_name} ({new Date(log.created_at).toLocaleString('vi-VN')})</div>
                      <table className="res-table">
                        <thead><tr><th>Tên</th><th>Chi phí</th><th>CPA</th><th>ROAS</th><th>Kết quả</th></tr></thead>
                        <tbody>
                          {log.details.map((d, i) => (
                            <tr key={i}>
                              <td className="adset-name">{d.adset_name}</td>
                              <td>{d.metrics?.spend ? `${formatNum(d.metrics.spend)}₫` : '—'}</td>
                              <td>{d.metrics?.cpa ? `${formatNum(d.metrics.cpa)}₫` : '—'}</td>
                              <td>{d.metrics?.roas || '—'}</td>
                              <td><ResultBadge result={d.result} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })()}
              </div>
          )}
        </div>

        <div className="hint">
          <strong>Lưu ý:</strong> Rules chạy tự động mỗi giờ (qua cron) hoặc khi bạn nhấn &ldquo;Chạy Rules Ngay&rdquo;.
          Các điều kiện trong 1 rule đều phải đúng cùng lúc (AND logic).
        </div>
      </div>

      {/* Dry-run modal */}
      {dryRunResults && (
        <div className="modal-overlay" onClick={() => setDryRunResults(null)} role="dialog" aria-modal="true" aria-label="Xem trước kết quả">
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}><Eye size={16} /> Xem trước kết quả — DRY RUN</div>
              <button className="modal-close" onClick={() => setDryRunResults(null)}>×</button>
            </div>
            <div style={{ padding: '8px 0', fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
              ⚠️ Không thay đổi gì trên Facebook. Chỉ xem trước.
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
              Tổng: {dryRunResults.total_affected} adset sẽ bị tác động
            </div>
            {dryRunResults.results?.map((r, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{r.rule_name} <span style={{ fontWeight: 400, color: 'var(--mut)', fontSize: 11 }}>{r.summary}</span></div>
                {r.affected.length > 0 && (
                  <table className="res-table" style={{ marginTop: 4 }}>
                    <thead><tr><th>Adset</th><th>Chi phí</th><th>CPA</th><th>ROAS</th><th>Sẽ làm</th></tr></thead>
                    <tbody>
                      {r.affected.map((a, j) => (
                        <tr key={j}>
                          <td className="adset-name">{a.adset_name}</td>
                          <td>{formatNum(a.metrics.spend)}₫</td>
                          <td>{a.metrics.cpa != null ? `${formatNum(a.metrics.cpa)}₫` : '—'}</td>
                          <td>{a.metrics.roas || '—'}</td>
                          <td><ResultBadge result={a.result} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--bd)' }}>
              <button className="btn-cancel" onClick={() => setDryRunResults(null)}>Đóng</button>
              <button className="btn-add" onClick={() => { setDryRunResults(null); handleRun() }}>▶ Chạy thật</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .as-page { padding: 24px; max-width: 900px; margin: 0 auto; position: relative; }

        .toast {
          position: fixed; top: 16px; right: 16px; z-index: 50;
          max-width: 260px; padding: 9px 14px; border-radius: 8px;
          background: #10b981; color: #fff; font-size: 12px; font-weight: 600;
          line-height: 1.4; box-shadow: 0 3px 12px rgba(0,0,0,.18);
          animation: fadeIn .2s ease; pointer-events: none;
        }
        .toast.error { background: #ef4444; }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }

        /* Preview button */
        .btn-preview {
          background: var(--s2); color: var(--txt); border: 1px solid var(--bd);
          border-radius: 9px; padding: 9px 14px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all .15s; font-family: inherit;
        }
        .btn-preview:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
        .btn-preview:disabled { opacity: .45; cursor: not-allowed; }

        /* Level tabs */
        .level-tabs { display: flex; gap: 6px; }
        .level-tab {
          padding: 7px 16px; border-radius: 9px; border: 1.5px solid var(--bd);
          background: var(--s2); color: var(--txt); font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all .15s; font-family: inherit;
        }
        .level-tab:hover { background: var(--s3); }
        .level-tab.active { background: var(--primary); border-color: var(--primary); color: #fff; }

        /* Campaign Tree */
        .tree-list { max-height: 300px; overflow-y: auto; border: 1px solid var(--bd); border-radius: 9px; background: var(--s2); }
        .tree-header { display: flex; justify-content: space-between; padding: 6px 10px; border-bottom: 1px solid var(--bd); position: sticky; top: 0; background: var(--s2); z-index: 1; }
        .tree-node { border-bottom: 1px solid var(--bd); }
        .tree-node:last-child { border-bottom: none; }
        .tree-row { display: flex; align-items: center; gap: 6px; padding: 6px 10px; transition: background .1s; }
        .tree-row:hover { background: rgba(59,130,246,.04); }
        .tree-row-sel { background: rgba(59,130,246,.07); }
        .tree-expand { background: none; border: none; cursor: pointer; font-size: 9px; color: var(--mut); width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .tree-info { min-width: 0; flex: 1; cursor: pointer; }
        .tree-name { font-size: 12px; font-weight: 600; color: var(--txt); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tree-meta { font-size: 10px; color: var(--mut); display: flex; gap: 4px; align-items: center; }
        .tree-st { font-size: 9px; font-weight: 700; padding: 0 4px; border-radius: 3px; }
        .tree-st-on { color: #10b981; background: rgba(16,185,129,.1); }
        .tree-st-off { color: #94a3b8; background: rgba(148,163,184,.1); }
        .tree-adsets { margin-left: 24px; border-left: 2px solid var(--bd); background: rgba(0,0,0,.01); }
        .tree-adset-row { display: flex; align-items: center; gap: 6px; padding: 4px 10px; font-size: 11px; cursor: pointer; transition: background .1s; border-bottom: 1px solid rgba(148,163,184,.12); }
        .tree-adset-row:last-child { border-bottom: none; }
        .tree-adset-row:hover { background: rgba(59,130,246,.04); }
        .tree-adset-name { flex: 1; color: var(--txt); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .tree-loading { padding: 6px 10px; font-size: 10px; color: var(--mut); }

        /* History */
        .history-section { background: var(--s1); border: 1px solid var(--bd); border-radius: 14px; padding: 14px 18px; margin-top: 16px; }
        .history-header { display: flex; justify-content: space-between; align-items: center; }

        /* Modal */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 40; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal-box { background: var(--s1); border-radius: 16px; padding: 20px; width: 100%; max-width: 700px; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,.3); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .modal-close { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--mut); }

        .page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
        .ph-left { display: flex; align-items: center; gap: 14px; }
        .ph-icon {
          width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(254,95,1,.08); color: var(--primary);
        }
        h1 { font-size: 18px; font-weight: 700; color: var(--txt); margin-bottom: 4px; }
        p  { font-size: 13px; color: var(--mut); }
        .ph-actions { display: flex; gap: 10px; }

        .btn-add {
          background: var(--primary); color: #fff; border: none;
          border-radius: 9px; padding: 9px 18px; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: opacity .15s; font-family: inherit;
        }
        .btn-add:hover { opacity: .88; }
        .btn-run {
          background: var(--s2); color: var(--txt); border: 1px solid var(--bd);
          border-radius: 9px; padding: 9px 18px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all .15s; font-family: inherit;
        }
        .btn-run:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
        .btn-run:disabled { opacity: .45; cursor: not-allowed; }

        /* Form */
        .form-card {
          background: var(--s1); border: 1px solid var(--primary); border-radius: 14px;
          padding: 20px; margin-bottom: 20px;
        }
        .form-title { font-size: 14px; font-weight: 700; color: var(--txt); margin-bottom: 16px; }
        .form-row { margin-bottom: 14px; }
        .form-row label { display: block; font-size: 12px; font-weight: 600; color: var(--mut); margin-bottom: 6px; }
        .inp {
          width: 100%; background: var(--s2); border: 1.5px solid var(--bd); border-radius: 9px;
          padding: 9px 12px; font-size: 14px; color: var(--txt); outline: none; font-family: inherit;
          transition: border-color .15s;
        }
        .inp:focus { border-color: var(--primary); }

        .conditions { display: flex; flex-direction: column; gap: 8px; }
        .condition-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .cond-sel { flex: 1.6; min-width: 160px; background: var(--s2); border: 1.5px solid var(--bd); border-radius: 8px; padding: 8px 10px; font-size: 13px; color: var(--txt); outline: none; font-family: inherit; }
        .cond-op  { width: 60px; flex-shrink: 0; background: var(--s2); border: 1.5px solid var(--bd); border-radius: 8px; padding: 8px 6px; font-size: 14px; color: var(--txt); outline: none; font-family: inherit; text-align: center; }
        .cond-val { flex: 1; min-width: 90px; background: var(--s2); border: 1.5px solid var(--bd); border-radius: 8px; padding: 8px 10px; font-size: 13px; color: var(--txt); outline: none; font-family: inherit; }
        .cond-unit { font-size: 12px; color: var(--mut); flex-shrink: 0; min-width: 20px; }
        .cond-del { background: none; border: none; color: var(--red); cursor: pointer; font-size: 14px; padding: 4px; flex-shrink: 0; }
        .cond-del:hover { opacity: .7; }
        .add-cond-btn { background: none; border: 1px dashed var(--bd); color: var(--mut); border-radius: 8px; padding: 7px 14px; font-size: 12px; cursor: pointer; font-family: inherit; transition: all .15s; width: fit-content; margin-top: 4px; }
        .add-cond-btn:hover { border-color: var(--primary); color: var(--primary); }

        .form-btns { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }
        .btn-cancel { background: transparent; border: 1px solid var(--bd); color: var(--mut); border-radius: 9px; padding: 9px 18px; font-size: 13px; cursor: pointer; font-family: inherit; }
        .btn-save { background: var(--primary); color: #fff; border: none; border-radius: 9px; padding: 9px 20px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .btn-save:disabled { opacity: .5; cursor: not-allowed; }

        /* Results */
        .results-card { background: var(--s1); border: 1px solid var(--bd); border-radius: 14px; padding: 16px; margin-bottom: 20px; }
        .res-title { font-size: 13px; font-weight: 700; color: var(--txt); margin-bottom: 12px; }
        .res-rule { margin-bottom: 16px; }
        .res-rule-name { font-size: 13px; font-weight: 600; color: var(--txt); margin-bottom: 8px; }
        .res-summary { font-size: 12px; color: var(--mut); font-weight: 400; margin-left: 8px; }
        .res-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .res-table th { background: var(--s2); padding: 6px 10px; text-align: left; color: var(--mut); font-size: 11px; text-transform: uppercase; letter-spacing: .4px; }
        .res-table td { padding: 7px 10px; border-bottom: 1px solid var(--bd); color: var(--txt); }
        .adset-name { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .res-badge { background: rgba(16,185,129,.12); color: var(--grn); font-size: 11px; padding: 2px 8px; border-radius: 20px; white-space: nowrap; }

        /* Rule cards */
        .rules-list { display: flex; flex-direction: column; gap: 12px; }
        .rule-card { background: var(--s1); border: 1px solid var(--bd); border-radius: 14px; padding: 16px; transition: opacity .2s; }
        .rule-card.disabled { opacity: .55; }
        .rule-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .rule-left { display: flex; align-items: center; gap: 12px; }
        .rule-name { font-size: 14px; font-weight: 700; color: var(--txt); }
        .rule-meta { font-size: 12px; color: var(--mut); margin-top: 2px; }
        .edit-btn { background: none; border: none; color: var(--mut); cursor: pointer; font-size: 14px; padding: 4px; }
        .edit-btn:hover { color: var(--primary); }
        .del-btn { background: none; border: none; color: var(--mut); cursor: pointer; font-size: 16px; padding: 4px; }
        .del-btn:hover { color: var(--red); }

        /* Toggle switch */
        .toggle-btn { width: 40px; height: 22px; border-radius: 11px; border: none; cursor: pointer; position: relative; transition: background .2s; padding: 0; flex-shrink: 0; }
        .toggle-btn.on  { background: var(--grn); }
        .toggle-btn.off { background: var(--bd); }
        .toggle-thumb { position: absolute; top: 3px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: left .2s; }
        .toggle-btn.on  .toggle-thumb { left: 21px; }
        .toggle-btn.off .toggle-thumb { left: 3px; }

        .rule-body { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .rule-conditions { display: flex; flex-wrap: wrap; gap: 6px; flex: 1; }
        .cond-tag { background: var(--s2); border: 1px solid var(--bd); border-radius: 20px; padding: 3px 10px; font-size: 12px; color: var(--txt); }
        .rule-action-badge { background: rgba(59,130,246,.12); color: var(--blue); border-radius: 8px; padding: 5px 12px; font-size: 12px; font-weight: 600; white-space: nowrap; }
        .rule-last-result { font-size: 12px; color: var(--mut); margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--bd); }

        .empty {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          background: var(--s1); border: 1px dashed var(--bd); border-radius: 16px;
          padding: 48px 32px; text-align: center; margin-bottom: 16px;
        }

        .loading { color: var(--mut); font-size: 13px; padding: 24px; text-align: center; }

        .hint {
          margin-top: 20px; padding: 12px 16px; background: rgba(59,130,246,.06);
          border: 1px solid rgba(59,130,246,.2); border-radius: 10px;
          font-size: 12px; color: var(--mut); line-height: 1.6;
        }

        /* Focus indicators */
        .btn-add:focus-visible, .btn-run:focus-visible, .btn-preview:focus-visible,
        .btn-save:focus-visible, .btn-cancel:focus-visible, .toggle-btn:focus-visible,
        .edit-btn:focus-visible, .del-btn:focus-visible, .level-tab:focus-visible,
        .inp:focus-visible, .cond-sel:focus-visible, .cond-op:focus-visible,
        .cond-val:focus-visible, .modal-close:focus-visible {
          outline: 2px solid var(--blue); outline-offset: 2px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .as-page { padding: 16px; }
          .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
          .ph-actions { width: 100%; flex-wrap: wrap; }
          .ph-actions .btn-add, .ph-actions .btn-run, .ph-actions .btn-preview { flex: 1; min-width: 0; text-align: center; justify-content: center; display: flex; align-items: center; gap: 4px; }
          .condition-row { flex-direction: column; gap: 6px; }
          .cond-sel, .cond-op, .cond-val { width: 100%; min-width: 0; }
          .modal-box { max-width: calc(100vw - 32px); padding: 16px; }
          .res-table { font-size: 11px; }
          .res-table th, .res-table td { padding: 5px 6px; }
          .rule-header { flex-direction: column; align-items: flex-start; gap: 8px; }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .toast { animation: none; }
          .toggle-thumb { transition: none; }
        }
      `}</style>
    </DashboardLayout>
  )
}
