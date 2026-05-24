import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../lib/AuthContext'
import Link from 'next/link'
import { isPlanAllowed } from '../../lib/planLimits'

function PlanGate({ feature }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
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
  { value: 'pause',         label: '⏸ Dừng adset (PAUSE)',     hasScale: false },
  { value: 'scale_budget',  label: '📈 Tăng ngân sách',         hasScale: true },
  { value: 'reduce_budget', label: '📉 Giảm ngân sách',         hasScale: true },
]

const TIME_RANGES = [
  { value: 'today',    label: 'Hôm nay' },
  { value: 'last_3d',  label: '3 ngày qua' },
  { value: 'last_7d',  label: '7 ngày qua' },
  { value: 'last_14d', label: '14 ngày qua' },
  { value: 'last_30d', label: '30 ngày qua' },
]

const EMPTY_RULE = {
  name: '',
  conditions: [{ metric: 'cpa', operator: 'gt', value: '' }],
  action: 'pause',
  scale_factor: 1.2,
  account_id: 'all',
  time_range: 'today',
}

function formatNum(n) {
  if (n == null) return 'N/A'
  return Number(n).toLocaleString('vi-VN')
}

export default function AutomatedRules() {
  const { user } = useAuth()
  const fbConnected = user?.fb_connected

  const [rules, setRules] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_RULE, conditions: [{ metric: 'cpa', operator: 'gt', value: '' }] })
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [runResults, setRunResults] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchRules = useCallback(async () => {
    try {
      const r = await fetch('/api/fb/autoset')
      const d = await r.json()
      if (d.ok) setRules(d.rules)
    } catch {}
  }, [])

  const fetchAccounts = useCallback(async () => {
    try {
      const r = await fetch('/api/fb/campaigns?date_preset=today&status=ALL')
      const d = await r.json()
      if (d.ok) setAccounts(d.accounts || [])
    } catch {}
  }, [])

  useEffect(() => {
    if (!fbConnected) { setLoading(false); return }
    Promise.all([fetchRules(), fetchAccounts()]).finally(() => setLoading(false))
  }, [fbConnected, fetchRules, fetchAccounts])

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
      const body = {
        action: 'create',
        name: form.name,
        conditions: form.conditions.map(c => ({ ...c, value: Number(c.value) })),
        action: form.action,
        scale_factor: Number(form.scale_factor) || 1.2,
        account_id: form.account_id,
        time_range: form.time_range,
      }
      const r = await fetch('/api/fb/autoset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const d = await r.json()
      if (!d.ok) return showToast(d.error || 'Lỗi lưu rule', 'error')
      showToast('Đã tạo rule thành công')
      setShowForm(false)
      setForm({ ...EMPTY_RULE, conditions: [{ metric: 'cpa', operator: 'gt', value: '' }] })
      fetchRules()
    } catch { showToast('Lỗi kết nối', 'error') }
    finally { setSaving(false) }
  }

  async function toggleRule(id, enabled) {
    await fetch('/api/fb/autoset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', id, enabled: !enabled })
    })
    fetchRules()
  }

  async function deleteRule(id, name) {
    if (!confirm(`Xoá rule "${name}"?`)) return
    await fetch('/api/fb/autoset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id })
    })
    showToast('Đã xoá rule')
    fetchRules()
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
      fetchRules()
    } catch { showToast('Lỗi kết nối', 'error') }
    finally { setRunning(false) }
  }

  const actionInfo = ACTIONS.find(a => a.value === form.action)

  if (!fbConnected) {
    return (
      <DashboardLayout title="Quy tắc tự động">
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 16, padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 40 }}>🔗</div>
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
            <span className="ph-icon">⚙️</span>
            <div>
              <h1>Quy tắc tự động</h1>
              <p>Tạo rules tự động kiểm soát và tối ưu adset theo điều kiện</p>
            </div>
          </div>
          <div className="ph-actions">
            <button className="btn-run" onClick={handleRun} disabled={running || !rules.filter(r => r.enabled).length}>
              {running ? '⏳ Đang chạy...' : '▶ Chạy Rules Ngay'}
            </button>
            <button className="btn-add" onClick={() => { setShowForm(true); setRunResults(null) }}>
              + Tạo Rule mới
            </button>
          </div>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="form-card">
            <div className="form-title">Tạo Rule mới</div>

            <div className="form-row">
              <label>Tên Rule</label>
              <input
                type="text" placeholder="VD: Dừng adset CPA cao"
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="inp"
              />
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
            )}

            <div className="form-btns">
              <button className="btn-cancel" onClick={() => setShowForm(false)}>Huỷ</button>
              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? 'Đang lưu...' : '💾 Lưu Rule'}
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
                          <td><span className="res-badge">{a.result}</span></td>
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
            <div style={{ fontSize: 40 }}>⚙️</div>
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
                      onClick={() => toggleRule(rule.id, rule.enabled)}
                      title={rule.enabled ? 'Đang bật — click để tắt' : 'Đang tắt — click để bật'}
                    >
                      <span className="toggle-thumb" />
                    </button>
                    <div>
                      <div className="rule-name">{rule.name}</div>
                      <div className="rule-meta">
                        {TIME_RANGES.find(t => t.value === rule.time_range)?.label || rule.time_range}
                        {' · '}
                        {rule.account_id === 'all' ? 'Tất cả tài khoản' : rule.account_id}
                        {rule.last_run_at && <> · Chạy lần cuối: {new Date(rule.last_run_at).toLocaleString('vi-VN')}</>}
                      </div>
                    </div>
                  </div>
                  <button className="del-btn" onClick={() => deleteRule(rule.id, rule.name)}>🗑</button>
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
                    {ACTIONS.find(a => a.value === rule.action)?.label}
                    {(rule.action === 'scale_budget' || rule.action === 'reduce_budget') &&
                      ` ×${rule.scale_factor}`}
                  </div>
                </div>

                {rule.last_run_summary && (
                  <div className="rule-last-result">{rule.last_run_summary}</div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="hint">
          <strong>💡 Lưu ý:</strong> Rules chạy tự động 1 lần/ngày (22:00 giờ Việt Nam) hoặc khi bạn nhấn "Chạy Rules Ngay".
          Các điều kiện trong 1 rule đều phải đúng cùng lúc (AND logic).
        </div>
      </div>

      <style jsx>{`
        .as-page { padding: 24px; max-width: 900px; position: relative; }

        .toast {
          position: fixed; top: 16px; right: 16px; z-index: 9999;
          max-width: 260px; padding: 9px 14px; border-radius: 8px;
          background: #10b981; color: #fff; font-size: 12px; font-weight: 600;
          line-height: 1.4; box-shadow: 0 3px 12px rgba(0,0,0,.18);
          animation: fadeIn .2s ease; pointer-events: none;
        }
        .toast.error { background: #ef4444; }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }

        .page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
        .ph-left { display: flex; align-items: center; gap: 14px; }
        .ph-icon { font-size: 32px; }
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
        .form-row label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: var(--mut); margin-bottom: 6px; }
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
        .rule-action-badge { background: rgba(99,102,241,.12); color: #818cf8; border-radius: 8px; padding: 5px 12px; font-size: 12px; font-weight: 600; white-space: nowrap; }
        .rule-last-result { font-size: 12px; color: var(--mut); margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--bd); }

        .empty {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          background: var(--s1); border: 1px dashed var(--bd); border-radius: 16px;
          padding: 48px 32px; text-align: center; margin-bottom: 16px;
        }

        .loading { color: var(--mut); font-size: 13px; padding: 24px; text-align: center; }

        .hint {
          margin-top: 20px; padding: 12px 16px; background: rgba(99,102,241,.06);
          border: 1px solid rgba(99,102,241,.2); border-radius: 10px;
          font-size: 12px; color: var(--mut); line-height: 1.6;
        }
      `}</style>
    </DashboardLayout>
  )
}
