import { useState, useCallback } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../lib/AuthContext'
import { fetcher } from '../../lib/fetcher'
import { isPlanAllowed } from '../../lib/planLimits'
import { Lock, Link2, HeartHandshake, Pencil, Trash2, Pause, Play, FlaskConical, Info } from 'lucide-react'

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

const EMPTY_FORM = {
  name: '',
  pause_at: '22:00',
  resume_at: '06:00',
}

export default function AutoCare() {
  const { user } = useAuth()
  const fbConnected = user?.fb_connected

  const [rules, setRules] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [runningId, setRunningId] = useState(null)
  const [runResult, setRunResult] = useState(null)
  const [testingId, setTestingId] = useState(null)
  const [testResult, setTestResult] = useState(null)
  const [toast, setToast] = useState(null)

  // Campaign tree state
  const [campaigns, setCampaigns] = useState([])
  const [selectedCampIds, setSelectedCampIds] = useState([])
  const [selectedAdsetIds, setSelectedAdsetIds] = useState([])
  const [expandedCampIds, setExpandedCampIds] = useState(new Set())
  const [campAdsets, setCampAdsets] = useState({})
  const [loadingAdsets, setLoadingAdsets] = useState({})
  const [searchQuery, setSearchQuery] = useState('')

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const rulesSwrKey = fbConnected ? '/api/fb/autocare' : null
  const { isValidating: loadingRules, mutate: mutateRules } = useSWR(rulesSwrKey, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
    onSuccess: (data) => { if (data.ok) setRules(data.rules || []) },
  })

  const campsSwrKey = fbConnected ? '/api/fb/campaigns?date_preset=maximum&status=ALL&level=campaign' : null
  const { isValidating: loadingCamps } = useSWR(campsSwrKey, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
    onSuccess: (data) => { if (data?.ok) setCampaigns(data.adsets || []) },
  })

  const loading = loadingRules || loadingCamps

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

  function toggleExpand(campId) {
    setExpandedCampIds(prev => {
      const next = new Set(prev)
      if (next.has(campId)) { next.delete(campId) } else { next.add(campId); loadAdsetsForCampaign(campId) }
      return next
    })
  }

  function toggleCampaign(campId) {
    const adsets = campAdsets[campId] || []
    const adsetIdSet = new Set(adsets.map(a => a.id))
    if (selectedCampIds.includes(campId)) {
      setSelectedCampIds(prev => prev.filter(x => x !== campId))
    } else {
      setSelectedAdsetIds(prev => prev.filter(id => !adsetIdSet.has(id)))
      setSelectedCampIds(prev => [...prev, campId])
    }
  }

  function toggleAdset(adsetId, campId) {
    setSelectedCampIds(prev => prev.filter(x => x !== campId))
    setSelectedAdsetIds(prev =>
      prev.includes(adsetId) ? prev.filter(x => x !== adsetId) : [...prev, adsetId]
    )
  }

  function getCampCheckState(campId) {
    if (selectedCampIds.includes(campId)) return 'checked'
    const adsets = campAdsets[campId] || []
    if (adsets.length === 0) return 'unchecked'
    const count = adsets.filter(a => selectedAdsetIds.includes(a.id)).length
    if (count === 0) return 'unchecked'
    if (count === adsets.length) return 'checked'
    return 'indeterminate'
  }

  function handleSelectAll() {
    if (selectedCampIds.length === campaigns.length) {
      setSelectedCampIds([])
      setSelectedAdsetIds([])
    } else {
      setSelectedCampIds(campaigns.map(c => c.id))
      setSelectedAdsetIds([])
    }
  }

  const filteredCampaigns = campaigns.filter(c => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    if (c.name.toLowerCase().includes(q)) return true
    return (campAdsets[c.id] || []).some(a => a.name.toLowerCase().includes(q))
  })

  function openCreateForm() {
    setEditingRuleId(null)
    setForm({ ...EMPTY_FORM })
    setSelectedCampIds([])
    setSelectedAdsetIds([])
    setSearchQuery('')
    setShowForm(true)
    setRunResult(null)
    setTestResult(null)
  }

  function startEdit(rule) {
    setEditingRuleId(rule.id)
    setForm({
      name: rule.name || '',
      pause_at: rule.pause_at || '22:00',
      resume_at: rule.resume_at || '06:00',
    })
    setSelectedCampIds(rule.selected_campaigns || [])
    setSelectedAdsetIds(rule.selected_adsets || [])
    setSearchQuery('')
    setShowForm(true)
    setRunResult(null)
    setTestResult(null)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingRuleId(null)
    setForm({ ...EMPTY_FORM })
    setSelectedCampIds([])
    setSelectedAdsetIds([])
    setSearchQuery('')
  }

  async function handleSave() {
    if (!form.name.trim()) return showToast('Vui lòng đặt tên cho rule', 'error')

    setSaving(true)
    try {
      const isEdit = !!editingRuleId
      const payload = {
        action: isEdit ? 'update' : 'create',
        ...(isEdit && { id: editingRuleId }),
        name: form.name,
        pause_at: form.pause_at,
        resume_at: form.resume_at,
        selected_campaigns: selectedCampIds,
        selected_adsets: selectedAdsetIds,
      }
      const r = await fetch('/api/fb/autocare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const d = await r.json()
      if (!d.ok) return showToast(d.error || 'Lỗi lưu rule', 'error')
      showToast(isEdit ? 'Đã cập nhật rule' : 'Đã tạo rule thành công')
      cancelForm()
      mutateRules()
    } catch { showToast('Lỗi kết nối', 'error') }
    finally { setSaving(false) }
  }

  async function toggleRule(id, enabled) {
    await fetch('/api/fb/autocare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', id, enabled: !enabled })
    })
    mutateRules()
  }

  async function deleteRule(id, name) {
    if (!confirm(`Xoá rule "${name}"?`)) return
    await fetch('/api/fb/autocare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id })
    })
    showToast('Đã xoá rule')
    mutateRules()
  }

  async function handleAction(ruleId, actionType) {
    setRunningId(ruleId)
    setRunResult(null)
    try {
      const r = await fetch('/api/fb/autocare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType, id: ruleId })
      })
      const d = await r.json()
      if (d.ok) {
        setRunResult({ ruleId, ...d })
        const parts = []
        if (d.changed_campaigns > 0) parts.push(`${d.changed_campaigns} chiến dịch`)
        if (d.changed_adsets > 0) parts.push(`${d.changed_adsets} nhóm QC`)
        showToast(`${d.action === 'pause' ? 'Đã tạm dừng' : 'Đã bật lại'}: ${parts.join(', ') || 'không có thay đổi'}`)
      } else {
        showToast(d.error || 'Lỗi thực hiện', 'error')
      }
    } catch { showToast('Lỗi kết nối', 'error') }
    finally { setRunningId(null) }
  }

  async function handleTestCron(ruleId) {
    setTestingId(ruleId)
    setTestResult(null)
    try {
      const r = await fetch('/api/fb/autocare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_cron', id: ruleId })
      })
      const d = await r.json()
      setTestResult({ ruleId, ...d })
    } catch { showToast('Lỗi kết nối', 'error') }
    finally { setTestingId(null) }
  }

  function fmtDate(str) {
    if (!str) return 'Chưa chạy'
    return new Date(str).toLocaleDateString('vi-VN')
  }

  function describeSelection(rule) {
    const camps = rule.selected_campaigns?.length || 0
    const adsets = rule.selected_adsets?.length || 0
    if (camps === 0 && adsets === 0) return 'Tất cả chiến dịch'
    const parts = []
    if (camps > 0) parts.push(`${camps} chiến dịch`)
    if (adsets > 0) parts.push(`${adsets} nhóm QC`)
    return parts.join(', ')
  }

  if (!isPlanAllowed(user?.plan, 'autocare')) {
    return <DashboardLayout title="Auto Care"><PlanGate feature="Auto Care" /></DashboardLayout>
  }

  return (
    <DashboardLayout title="Auto Care">
      {toast && (
        <div style={{
          position: 'fixed', top: 16, right: 16, zIndex: 50,
          padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          color: '#fff', background: toast.type === 'error' ? '#ef4444' : '#10b981',
          boxShadow: '0 4px 16px rgba(0,0,0,.25)', pointerEvents: 'none',
          animation: 'toastIn .3s ease',
        }}>{toast.msg}</div>
      )}

      <div className="page-wrap">
        {/* Header */}
        <div className="page-header">
          <div className="ph-left">
            <span className="page-icon"><HeartHandshake size={22} /></span>
            <div>
              <h1>Auto Care — Giờ tắt quảng cáo</h1>
              <p>Tạo nhiều rules tự động tạm dừng và khôi phục chiến dịch theo khung giờ khác nhau</p>
            </div>
          </div>
          <button className="btn-add" onClick={openCreateForm}>+ Tạo Rule mới</button>
        </div>

        {!fbConnected ? (
          <div className="fb-required">
            <div className="fbr-icon"><Link2 size={28} /></div>
            <div className="fbr-title">Cần kết nối Facebook Ads</div>
            <div className="fbr-desc">Tính năng Auto Care yêu cầu kết nối tài khoản Facebook Ads để tự động điều chỉnh chiến dịch.</div>
            <Link href="/settings/connect-facebook" className="fbr-btn">Kết nối ngay →</Link>
          </div>
        ) : loading ? (
          <div className="skel-block" />
        ) : (
          <>
            {/* Create/Edit form */}
            {showForm && (
              <div className="card form-card">
                <div className="card-title">{editingRuleId ? 'Sửa Rule' : 'Tạo Rule mới'}</div>

                <div className="form-row">
                  <label className="label">Tên Rule</label>
                  <input
                    type="text" className="text-input"
                    placeholder="VD: Tắt QC ban đêm, Tắt Camp ABC lúc 23h..."
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  />
                </div>

                <div className="two-col">
                  <div className="form-row">
                    <label className="label">Giờ tạm dừng (Pause at)</label>
                    <input
                      type="time" className="time-input"
                      value={form.pause_at}
                      onChange={e => setForm(p => ({ ...p, pause_at: e.target.value }))}
                    />
                    <div className="field-hint">Chiến dịch sẽ bị tạm dừng từ giờ này</div>
                  </div>
                  <div className="form-row">
                    <label className="label">Giờ khởi động lại (Resume at)</label>
                    <input
                      type="time" className="time-input"
                      value={form.resume_at}
                      onChange={e => setForm(p => ({ ...p, resume_at: e.target.value }))}
                    />
                    <div className="field-hint">Chiến dịch sẽ được bật lại từ giờ này</div>
                  </div>
                </div>

                {/* Campaign tree selector */}
                <div className="form-row">
                  <label className="label">Áp dụng cho chiến dịch nào?</label>
                  <input
                    type="text" className="text-input"
                    placeholder="Tìm chiến dịch, nhóm quảng cáo..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ marginBottom: 8 }}
                  />
                  {loadingCamps ? (
                    <div className="field-hint">Đang tải danh sách chiến dịch...</div>
                  ) : campaigns.length === 0 ? (
                    <div className="field-hint">Không có chiến dịch nào. Kiểm tra kết nối Facebook.</div>
                  ) : (
                    <div className="camp-tree-list">
                      <div className="camp-tree-header">
                        <span className="camp-tree-count">
                          {selectedCampIds.length} chiến dịch, {selectedAdsetIds.length} nhóm QC đã chọn
                        </span>
                        <button className="camp-tree-toggle-all" onClick={handleSelectAll}>
                          {selectedCampIds.length === campaigns.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        </button>
                      </div>
                      {filteredCampaigns.map(c => {
                        const checkState = getCampCheckState(c.id)
                        const isExpanded = expandedCampIds.has(c.id)
                        const adsets = campAdsets[c.id] || []
                        return (
                          <div key={c.id} className="camp-tree-node">
                            <div className={`camp-tree-row${checkState !== 'unchecked' ? ' row-selected' : ''}`}>
                              <button className="expand-btn" onClick={() => toggleExpand(c.id)}>
                                {isExpanded ? '▼' : '▶'}
                              </button>
                              <input
                                type="checkbox"
                                checked={checkState === 'checked'}
                                ref={el => { if (el) el.indeterminate = checkState === 'indeterminate' }}
                                onChange={() => toggleCampaign(c.id)}
                              />
                              <div className="camp-tree-info" onClick={() => toggleExpand(c.id)}>
                                <div className="camp-tree-name">{c.name}</div>
                                <div className="camp-tree-meta">
                                  {c.account_name}
                                  <span className={`st-badge ${c.effective_status === 'ACTIVE' ? 'st-active' : 'st-paused'}`}>
                                    {c.effective_status}
                                  </span>
                                </div>
                                {selectedCampIds.includes(c.id) && (
                                  <div className="camp-tree-hint">Áp dụng: Cả chiến dịch</div>
                                )}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="adset-tree-list">
                                {loadingAdsets[c.id] ? (
                                  <div className="adset-loading">Đang tải nhóm QC...</div>
                                ) : adsets.length === 0 ? (
                                  <div className="adset-loading">Không có nhóm QC nào</div>
                                ) : adsets.map(a => (
                                  <label key={a.id} className={`adset-tree-row${selectedAdsetIds.includes(a.id) ? ' row-selected' : ''}`}>
                                    <input
                                      type="checkbox"
                                      checked={selectedAdsetIds.includes(a.id) || selectedCampIds.includes(c.id)}
                                      disabled={selectedCampIds.includes(c.id)}
                                      onChange={() => toggleAdset(a.id, c.id)}
                                    />
                                    <span className="adset-tree-name">{a.name}</span>
                                    <span className={`st-badge ${a.effective_status === 'ACTIVE' ? 'st-active' : a.effective_status === 'CAMPAIGN_PAUSED' ? 'st-camp-paused' : 'st-paused'}`}>
                                      {a.effective_status === 'CAMPAIGN_PAUSED' ? 'Camp. dừng' : a.effective_status}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <div className="field-hint">Không chọn = áp dụng tất cả. Check campaign = tắt/bật cả chiến dịch. Expand (▶) để chọn từng nhóm QC riêng.</div>
                </div>

                <div className="form-actions">
                  <button className="btn-save" onClick={handleSave} disabled={saving}>
                    {saving ? 'Đang lưu…' : editingRuleId ? 'Cập nhật Rule' : 'Tạo Rule'}
                  </button>
                  <button className="btn-cancel" onClick={cancelForm}>Huỷ</button>
                </div>
              </div>
            )}

            {/* Rules list */}
            {rules.length === 0 && !showForm ? (
              <div className="empty-state">
                <div className="empty-icon"><HeartHandshake size={36} /></div>
                <div className="empty-title">Chưa có rule Auto Care nào</div>
                <div className="empty-desc">Tạo rule đầu tiên để tự động tắt/bật chiến dịch theo giờ nghỉ.</div>
                <button className="btn-add" onClick={openCreateForm}>+ Tạo Rule mới</button>
              </div>
            ) : (
              <div className="rules-list">
                {rules.map(rule => (
                  <div key={rule.id} className={`rule-card${!rule.enabled ? ' rule-disabled' : ''}`}>
                    <div className="rule-header">
                      <div className="rule-info">
                        <div className="rule-name">{rule.name || 'Rule không tên'}</div>
                        <div className="rule-meta">
                          Pause {rule.pause_at} → Resume {rule.resume_at} · {describeSelection(rule)}
                        </div>
                      </div>
                      <div className="rule-actions">
                        <label className="toggle">
                          <input
                            type="checkbox"
                            checked={rule.enabled}
                            onChange={() => toggleRule(rule.id, rule.enabled)}
                          />
                          <span className="slider" />
                        </label>
                      </div>
                    </div>

                    <div className="rule-status">
                      <div className="status-item">
                        <span className="status-label">Lần pause cuối</span>
                        <span className="status-value">{fmtDate(rule.last_pause_run)}</span>
                      </div>
                      <div className="status-item">
                        <span className="status-label">Lần resume cuối</span>
                        <span className="status-value">{fmtDate(rule.last_resume_run)}</span>
                      </div>
                    </div>

                    {/* Run result for this rule */}
                    {runResult?.ruleId === rule.id && (
                      <div className="run-result">
                        Kết quả: <strong>{runResult.action === 'pause' ? 'Tạm dừng' : 'Bật lại'}</strong> —{' '}
                        {(runResult.changed_campaigns || 0) > 0 && <>{runResult.changed_campaigns} chiến dịch</>}
                        {(runResult.changed_campaigns || 0) > 0 && (runResult.changed_adsets || 0) > 0 && ', '}
                        {(runResult.changed_adsets || 0) > 0 && <>{runResult.changed_adsets} nhóm QC</>}
                        {(runResult.changed_campaigns || 0) === 0 && (runResult.changed_adsets || 0) === 0 && 'không có thay đổi'}
                        {(runResult.skipped_campaign_paused || 0) > 0 && (
                          <span style={{ color: '#f59e0b', marginLeft: 8 }}>
                            (bỏ qua {runResult.skipped_campaign_paused} adset do campaign đã dừng)
                          </span>
                        )}
                      </div>
                    )}

                    {/* Test cron result */}
                    {testResult?.ruleId === rule.id && (
                      <div className="test-result">
                        <div className="test-msg">{testResult.message}</div>
                        {testResult.debug && (
                          <div className="test-debug">
                            {Object.entries(testResult.debug).map(([k, v]) => (
                              <div key={k} className="test-debug-row">
                                <span className="test-debug-key">{k}</span>
                                <span className="test-debug-val">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="rule-btns">
                      <button
                        className="btn-pause-now"
                        onClick={() => handleAction(rule.id, 'pause_now')}
                        disabled={runningId === rule.id}
                      >
                        {runningId === rule.id ? '...' : <><Pause size={12} /></>} Pause ngay
                      </button>
                      <button
                        className="btn-resume-now"
                        onClick={() => handleAction(rule.id, 'resume_now')}
                        disabled={runningId === rule.id}
                      >
                        {runningId === rule.id ? '...' : <><Play size={12} /></>} Resume ngay
                      </button>
                      <button
                        className="btn-test-cron"
                        onClick={() => handleTestCron(rule.id)}
                        disabled={testingId === rule.id}
                      >
                        {testingId === rule.id ? '...' : <><FlaskConical size={12} /> Test cron</>}
                      </button>
                      <button className="btn-edit" onClick={() => startEdit(rule)}><Pencil size={12} /> Sửa</button>
                      <button className="btn-delete" onClick={() => deleteRule(rule.id, rule.name)}><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Info card */}
            <div className="info-card">
              <div className="info-icon"><Info size={18} /></div>
              <div className="info-body">
                <div className="info-title">Cách hoạt động</div>
                <div className="info-text">
                  Mỗi rule có giờ nghỉ riêng. Hệ thống kiểm tra mỗi giờ (UTC). Nếu đang trong giờ nghỉ và chưa tạm dừng hôm nay → tạm dừng campaigns/adsets đã chọn.
                  Nếu đang trong giờ hoạt động và chưa bật lại hôm nay → bật lại. Mỗi hành động chỉ chạy 1 lần/ngày/rule.
                  Nút Pause/Resume ngay hoạt động ngay lập tức, không phụ thuộc giờ.
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .page-wrap { padding: 24px; max-width: 860px; margin: 0 auto; position: relative; }

        .page-header { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 22px; flex-wrap: wrap; }
        .ph-left { display: flex; align-items: center; gap: 14px; }
        .page-icon {
          width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(16,185,129,.08); color: var(--grn);
        }
        h1 { font-size: 20px; font-weight: 700; color: var(--txt); margin-bottom: 4px; }
        p  { font-size: 13px; color: var(--mut); }

        @keyframes toastIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }

        .btn-add {
          background: var(--primary); color: #fff; border: none; border-radius: 9px;
          padding: 10px 20px; font-size: 13px; font-weight: 700; cursor: pointer;
          transition: opacity .15s; font-family: inherit; white-space: nowrap;
        }
        .btn-add:hover { opacity: .88; }

        /* FB Required */
        .fb-required {
          display: flex; flex-direction: column; align-items: center;
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

        .skel-block {
          height: 300px; border-radius: 14px;
          background: linear-gradient(90deg, var(--s2) 25%, var(--s3) 50%, var(--s2) 75%);
          background-size: 200% 100%; animation: shimmer 1.2s infinite;
        }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* Empty state */
        .empty-state {
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          background: var(--s1); border: 1px solid var(--bd); border-radius: 16px;
          padding: 48px 32px; text-align: center;
        }
        .empty-icon { font-size: 48px; }
        .empty-title { font-size: 16px; font-weight: 700; color: var(--txt); }
        .empty-desc { font-size: 13px; color: var(--mut); max-width: 380px; line-height: 1.6; margin-bottom: 8px; }

        /* Card / Form */
        .card {
          background: var(--s1); border: 1px solid var(--bd); border-radius: 14px; padding: 22px;
          margin-bottom: 16px;
        }
        .card-title {
          font-size: 15px; font-weight: 700; color: var(--txt); margin-bottom: 20px;
          padding-bottom: 12px; border-bottom: 1px solid var(--bd);
        }
        .form-card { margin-bottom: 20px; }

        .form-row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .label { font-size: 13px; font-weight: 600; color: var(--txt); }
        .field-hint { font-size: 11px; color: var(--mut); }

        .time-input, .text-input {
          padding: 10px 14px; border-radius: 9px; border: 1px solid var(--bd);
          background: var(--s2); color: var(--txt); font-size: 14px;
          transition: border-color .15s; width: 100%;
        }
        .time-input:focus, .text-input:focus { outline: none; border-color: var(--primary); }

        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 600px) { .two-col { grid-template-columns: 1fr; } }

        .form-actions { display: flex; gap: 10px; margin-top: 6px; }
        .btn-save {
          background: var(--primary); color: #fff; border: none; border-radius: 9px;
          padding: 10px 24px; font-size: 14px; font-weight: 700; cursor: pointer;
          transition: opacity .15s; font-family: inherit;
        }
        .btn-save:hover:not(:disabled) { opacity: .88; }
        .btn-save:disabled { opacity: .6; cursor: default; }
        .btn-cancel {
          background: var(--s2); color: var(--txt); border: 1px solid var(--bd); border-radius: 9px;
          padding: 10px 20px; font-size: 13px; font-weight: 600; cursor: pointer;
          transition: all .15s; font-family: inherit;
        }
        .btn-cancel:hover { border-color: var(--primary); color: var(--primary); }

        /* Campaign tree list */
        .camp-tree-list {
          max-height: 400px; overflow-y: auto; border: 1px solid var(--bd);
          border-radius: 10px; background: var(--s2);
        }
        .camp-tree-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 12px; border-bottom: 1px solid var(--bd);
          position: sticky; top: 0; background: var(--s2); z-index: 1;
        }
        .camp-tree-count { font-size: 11px; color: var(--mut); font-weight: 600; }
        .camp-tree-toggle-all {
          font-size: 11px; color: var(--primary); background: none; border: none;
          cursor: pointer; font-weight: 600; font-family: inherit;
        }
        .camp-tree-node { border-bottom: 1px solid var(--bd); }
        .camp-tree-node:last-child { border-bottom: none; }
        .camp-tree-row {
          display: flex; align-items: center; gap: 8px; padding: 8px 12px;
          transition: background .1s;
        }
        .camp-tree-row:hover { background: rgba(99,102,241,.04); }
        .camp-tree-row.row-selected { background: rgba(99,102,241,.07); }
        .camp-tree-row input[type="checkbox"] { flex-shrink: 0; cursor: pointer; }
        .expand-btn {
          background: none; border: none; cursor: pointer; font-size: 10px;
          color: var(--mut); width: 20px; height: 20px; display: flex;
          align-items: center; justify-content: center; flex-shrink: 0;
          border-radius: 4px; transition: all .15s;
        }
        .expand-btn:hover { background: var(--s3); color: var(--txt); }
        .camp-tree-info { min-width: 0; flex: 1; cursor: pointer; }
        .camp-tree-name { font-size: 13px; font-weight: 600; color: var(--txt); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .camp-tree-meta { font-size: 11px; color: var(--mut); display: flex; align-items: center; gap: 6px; margin-top: 2px; }
        .camp-tree-hint { font-size: 10px; color: var(--grn); margin-top: 2px; font-weight: 600; }
        .st-badge { font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 4px; flex-shrink: 0; }
        .st-active { color: #10b981; background: rgba(16,185,129,.1); }
        .st-paused { color: #94a3b8; background: rgba(148,163,184,.1); }
        .st-camp-paused { color: #f59e0b; background: rgba(245,158,11,.1); }

        .adset-tree-list { margin-left: 28px; border-left: 2px solid var(--bd); background: rgba(0,0,0,.015); }
        .adset-tree-row {
          display: flex; align-items: center; gap: 8px; padding: 6px 12px;
          font-size: 12px; cursor: pointer; transition: background .1s;
          border-bottom: 1px solid rgba(148,163,184,.15);
        }
        .adset-tree-row:last-child { border-bottom: none; }
        .adset-tree-row:hover { background: rgba(99,102,241,.04); }
        .adset-tree-row.row-selected { background: rgba(99,102,241,.07); }
        .adset-tree-row input[type="checkbox"] { flex-shrink: 0; cursor: pointer; }
        .adset-tree-name { flex: 1; color: var(--txt); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .adset-loading { padding: 8px 12px; font-size: 11px; color: var(--mut); }

        /* Rules list */
        .rules-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }

        .rule-card {
          background: var(--s1); border: 1px solid var(--bd); border-radius: 14px;
          padding: 18px; transition: opacity .2s;
        }
        .rule-card.rule-disabled { opacity: .55; }

        .rule-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .rule-info { flex: 1; min-width: 0; }
        .rule-name { font-size: 15px; font-weight: 700; color: var(--txt); margin-bottom: 4px; }
        .rule-meta { font-size: 12px; color: var(--mut); }
        .rule-actions { display: flex; align-items: center; gap: 8px; }

        /* Toggle switch */
        .toggle { position: relative; display: inline-block; width: 48px; height: 26px; flex-shrink: 0; }
        .toggle input { opacity: 0; width: 0; height: 0; }
        .slider {
          position: absolute; cursor: pointer; inset: 0;
          background: var(--s3); border-radius: 26px; transition: .25s;
        }
        .slider::before {
          content: ''; position: absolute;
          width: 20px; height: 20px; border-radius: 50%;
          left: 3px; bottom: 3px; background: #fff; transition: .25s;
        }
        input:checked + .slider { background: var(--grn); }
        input:checked + .slider::before { transform: translateX(22px); }

        .rule-status {
          display: flex; gap: 16px; margin-top: 12px; padding-top: 12px;
          border-top: 1px solid var(--bd); flex-wrap: wrap;
        }
        .rule-status .status-item { display: flex; gap: 6px; font-size: 12px; }
        .rule-status .status-label { color: var(--mut); }
        .rule-status .status-value { color: var(--txt); font-weight: 600; }

        .rule-btns {
          display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;
        }

        .btn-pause-now {
          background: #ef4444; color: #fff; border: none; border-radius: 8px;
          padding: 7px 14px; font-size: 12px; font-weight: 700; cursor: pointer;
          transition: opacity .15s; font-family: inherit;
        }
        .btn-pause-now:hover:not(:disabled) { opacity: .88; }
        .btn-pause-now:disabled { opacity: .6; cursor: default; }
        .btn-resume-now {
          background: #10b981; color: #fff; border: none; border-radius: 8px;
          padding: 7px 14px; font-size: 12px; font-weight: 700; cursor: pointer;
          transition: opacity .15s; font-family: inherit;
        }
        .btn-resume-now:hover:not(:disabled) { opacity: .88; }
        .btn-resume-now:disabled { opacity: .6; cursor: default; }

        .btn-test-cron {
          background: var(--s2); color: var(--txt); border: 1px solid var(--bd);
          border-radius: 8px; padding: 7px 14px; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all .15s; font-family: inherit;
        }
        .btn-test-cron:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
        .btn-test-cron:disabled { opacity: .6; cursor: default; }

        .btn-edit {
          background: none; border: 1px solid var(--bd); border-radius: 8px;
          padding: 7px 12px; font-size: 12px; cursor: pointer; color: var(--txt);
          transition: all .15s; font-family: inherit;
        }
        .btn-edit:hover { border-color: var(--primary); color: var(--primary); }

        .btn-delete {
          background: none; border: 1px solid var(--bd); border-radius: 8px;
          padding: 7px 10px; font-size: 12px; cursor: pointer; color: var(--mut);
          transition: all .15s; font-family: inherit;
        }
        .btn-delete:hover { border-color: #ef4444; color: #ef4444; }

        .run-result {
          margin-top: 10px; padding: 10px 14px;
          background: rgba(16,185,129,.1); border: 1px solid rgba(16,185,129,.25);
          border-radius: 9px; font-size: 12px; color: var(--txt);
        }

        .test-result {
          margin-top: 10px; padding: 12px 14px; border-radius: 9px;
          background: var(--s2); border: 1px solid var(--bd);
        }
        .test-msg { font-size: 13px; font-weight: 600; color: var(--txt); margin-bottom: 8px; }
        .test-debug { display: flex; flex-direction: column; gap: 3px; }
        .test-debug-row { display: flex; gap: 8px; font-size: 11px; }
        .test-debug-key { color: var(--mut); min-width: 140px; font-family: monospace; }
        .test-debug-val { color: var(--txt); font-weight: 600; font-family: monospace; }

        /* Info card */
        .info-card {
          display: flex; gap: 14px; align-items: flex-start;
          background: rgba(59,130,246,.07); border: 1px solid rgba(59,130,246,.2);
          border-radius: 12px; padding: 16px; margin-top: 16px;
        }
        .info-icon { flex-shrink: 0; margin-top: 2px; color: var(--blue); }
        .info-title { font-size: 13px; font-weight: 700; color: var(--txt); margin-bottom: 5px; }
        .info-text  { font-size: 12px; color: var(--mut); line-height: 1.7; }

        /* Focus indicators */
        .btn-add:focus-visible, .btn-save:focus-visible, .btn-cancel:focus-visible,
        .btn-pause-now:focus-visible, .btn-resume-now:focus-visible,
        .btn-test-cron:focus-visible, .btn-edit:focus-visible, .btn-delete:focus-visible,
        .text-input:focus-visible, .time-input:focus-visible {
          outline: 2px solid var(--blue); outline-offset: 2px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .page-wrap { padding: 16px; }
          .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
          .btn-add { width: 100%; text-align: center; }
          .two-col { grid-template-columns: 1fr; }
          .rule-btns { flex-wrap: wrap; }
          .rule-btns button { flex: 1; min-width: 0; justify-content: center; }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .slider::before { transition: none; }
        }
      `}</style>
    </DashboardLayout>
  )
}
