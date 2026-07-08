import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '../../components/AdminLayout'
import { Badge, Spinner, ErrorBox, CopyButton, EmptyState, AdminPageHeader, AdminCard, AdminButton, AdminInput } from '../../components/AdminUI'
import { ShieldCheck, FileText, BarChart, Settings, Search, XCircle, Users, DollarSign, Save, RefreshCw, FlaskConical } from 'lucide-react'
import { adminLocalFetch, apiPost } from '../../lib/adminUtils'

const PC_INDUSTRIES = [
  { value: 'general', label: 'Tổng quát (mặc định)' },
  { value: 'health', label: 'Y tế / Sức khoẻ / TPCN' },
  { value: 'beauty', label: 'Làm đẹp / Mỹ phẩm' },
  { value: 'finance', label: 'Tài chính / Đầu tư' },
  { value: 'weight_loss', label: 'Giảm cân / Giảm béo' },
  { value: 'ecommerce', label: 'Thương mại điện tử' },
  { value: 'education', label: 'Giáo dục / Khoá học' },
  { value: 'realestate', label: 'Bất động sản' },
  { value: 'crypto', label: 'Tiền điện tử / NFT' },
]

function PolicyCheckTab() {
  const [subTab, setSubTab] = useState('docs')

  const subBtnStyle = (active) => ({
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', background: active ? 'var(--blue)' : 'var(--s2)', color: active ? '#fff' : 'var(--mut)',
    fontFamily: 'inherit', transition: 'all .15s',
  })

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
      <AdminPageHeader title="AI Kiểm tra Vi phạm Chính sách Meta" icon={ShieldCheck} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button style={subBtnStyle(subTab === 'docs')} onClick={() => setSubTab('docs')}><FileText size={16} /> Tài liệu Chính sách</button>
        <button style={subBtnStyle(subTab === 'stats')} onClick={() => setSubTab('stats')}><BarChart size={16} /> Thống kê</button>
        <button style={subBtnStyle(subTab === 'config')} onClick={() => setSubTab('config')}><Settings size={16} /> Cấu hình AI</button>
      </div>
      {subTab === 'docs'   && <PolicyDocsSubTab />}
      {subTab === 'stats'  && <PolicyStatsSubTab />}
      {subTab === 'config' && <PolicyConfigSubTab />}
    </div>
  )
}

function PolicyDocsSubTab() {
  const [industry, setIndustry] = useState('general')
  const [content, setContent]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [meta, setMeta]         = useState(null)
  const [allDocs, setAllDocs]   = useState([])

  async function fetchDocs() {
    setLoading(true)
    try {
      const r = await apiPost('/api/ai-chat', { action: 'pc_get_doc' })
      setAllDocs(r.docs || [])
      const doc = (r.docs || []).find(d => d.industry === industry)
      if (doc) { setContent(doc.content); setMeta(doc) }
      else { setContent(''); setMeta(null) }
    } catch (e) { alert('Lỗi tải: ' + e.message) } finally { setLoading(false) }
  }

  useEffect(() => { fetchDocs() }, [])

  useEffect(() => {
    const doc = allDocs.find(d => d.industry === industry)
    if (doc) { setContent(doc.content); setMeta(doc) }
    else { setContent(''); setMeta(null) }
  }, [industry, allDocs])

  async function handleSave() {
    if (!content.trim()) { alert('Nội dung không được để trống'); return }
    setSaving(true)
    try {
      await apiPost('/api/ai-chat', { action: 'pc_save_doc', industry, content })
      await fetchDocs()
      alert('✅ Đã lưu tài liệu chính sách')
    } catch (e) { alert('Lỗi lưu: ' + e.message) } finally { setSaving(false) }
  }

  async function handleReset() {
    if (!confirm(`Reset tài liệu ngành "${industry}" về mặc định?`)) return
    try {
      await apiPost('/api/ai-chat', { action: 'pc_reset_doc', industry })
      await fetchDocs()
      alert('✅ Đã reset về mặc định')
    } catch (e) { alert('Lỗi: ' + e.message) }
  }

  return (
    <AdminCard>
      <p style={{ fontSize: 13, color: 'var(--mut)', marginBottom: 16, lineHeight: 1.6 }}>
        Tài liệu này được AI đọc khi kiểm tra nội dung quảng cáo. Cập nhật khi Meta thay đổi policy hoặc cần tuỳ chỉnh cho từng ngành.
      </p>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--mut)', marginBottom: 5, textTransform: 'uppercase' }}>Ngành</label>
          <select value={industry} onChange={e => setIndustry(e.target.value)} className="form-input">
            {PC_INDUSTRIES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
          </select>
        </div>
        {meta && <span style={{ fontSize: 11, color: 'var(--mut)', whiteSpace: 'nowrap' }}>Cập nhật: {new Date(meta.updated_at).toLocaleDateString('vi-VN')}</span>}
      </div>
      {loading ? <Spinner /> : (
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Nhập nội dung tài liệu policy cho ngành này. Nếu để trống, AI sẽ dùng tài liệu mặc định."
          className="form-input"
          style={{ minHeight: 420, fontFamily: 'Consolas, monospace', lineHeight: 1.7, resize: 'vertical' }}
        />
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <AdminButton icon={Save} onClick={handleSave} disabled={saving || loading}>
          {saving ? 'Đang lưu...' : 'Lưu tài liệu'}
        </AdminButton>
        <AdminButton variant="danger" icon={RefreshCw} onClick={handleReset}>
          Reset về mặc định
        </AdminButton>
      </div>
    </AdminCard>
  )
}

function PolicyStatsSubTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('7d')

  async function fetchStats() {
    setLoading(true)
    try {
      const now = new Date()
      const days = range === '1d' ? 1 : range === '30d' ? 30 : 7
      const from = new Date(now - days * 86400000).toISOString().slice(0, 10)
      const to   = now.toISOString().slice(0, 10)
      const r = await apiPost('/api/ai-chat', { action: 'pc_stats', from, to })
      setStats(r)
    } catch (e) { alert('Lỗi tải stats: ' + e.message) } finally { setLoading(false) }
  }

  useEffect(() => { fetchStats() }, [range])

  const statCard = (IconComp, label, value, sub, color) => (
    <AdminCard noPadding style={{ padding: '16px 20px', minWidth: 150 }}>
      <div style={{ marginBottom: 6, color }}><IconComp size={24} /></div>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--txt)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--mut)', marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 2 }}>{sub}</div>}
    </AdminCard>
  )

  return (
    <AdminCard>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['1d','Hôm nay'],['7d','7 ngày'],['30d','30 ngày']].map(([v, l]) => (
          <button key={v} onClick={() => setRange(v)} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid var(--bd)', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: range === v ? 'var(--blue)' : 'var(--s2)', color: range === v ? '#fff' : 'var(--mut)', fontFamily: 'inherit' }}>{l}</button>
        ))}
      </div>
      {loading ? <Spinner /> : stats ? (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
            {statCard(Search, 'Tổng lượt check', stats.total, '', 'var(--blue)')}
            {statCard(XCircle, 'Vi phạm phát hiện', stats.violations, `${stats.violation_rate}% tổng số`, 'var(--red)')}
            {statCard(Users, 'Users unique', stats.unique_users, '', 'var(--primary)')}
            {statCard(DollarSign, 'Chi phí ước tính', `$${stats.estimated_cost_usd}`, `≈ ${(stats.estimated_cost_vnd || 0).toLocaleString('vi-VN')}₫`, 'var(--grn)')}
          </div>
          {stats.top_users?.length > 0 && (
            <>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0c2a72', marginBottom: 10 }}>Top Users</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: '#f8fafc' }}>
                  {['Key','Gói','Lượt check','Lần cuối'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--mut)', textTransform: 'uppercase' }}>{h}</th>)}
                </tr></thead>
                <tbody>{stats.top_users.map((u, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 12 }}>{u.key}</td>
                    <td style={{ padding: '8px 12px' }}><Badge status={u.plan} /></td>
                    <td style={{ padding: '8px 12px', fontWeight: 700 }}>{u.count}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--mut)', fontSize: 12 }}>{u.last?.slice(0, 16).replace('T', ' ')}</td>
                  </tr>
                ))}</tbody>
              </table>
            </>
          )}
          {stats.total === 0 && <EmptyState icon={<BarChart size={48} color="var(--bd)" />} text="Chưa có lượt kiểm tra nào trong kỳ này" />}
        </>
      ) : null}
    </AdminCard>
  )
}

function PolicyConfigSubTab() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  async function fetchConfig() {
    setLoading(true)
    try {
      const r = await apiPost('/api/ai-chat', { action: 'pc_config_get' })
      setConfig(r.config || {})
    } catch (e) { alert('Lỗi tải config: ' + e.message) } finally { setLoading(false) }
  }

  useEffect(() => { fetchConfig() }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await apiPost('/api/ai-chat', {
        action: 'pc_config_save',
        model: config.model,
        rate_limit_business: parseInt(config.rateLimitBusiness),
        rate_limit_agency: parseInt(config.rateLimitAgency),
        enabled: config.enabled,
      })
      alert('✅ Đã lưu cấu hình')
    } catch (e) { alert('Lỗi lưu: ' + e.message) } finally { setSaving(false) }
  }

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    try {
      const r = await apiPost('/api/ai-chat', {
        action: 'policy_check',
        key: 'TEST',
        content: { headline: 'Test kết nối AI', body: 'Sản phẩm chất lượng tốt' },
        industry: 'general', lang: 'vi'
      })
      if (r.ok) setTestResult({ ok: true, msg: `✅ Kết nối OK — Model: ${config?.model}` })
      else setTestResult({ ok: false, msg: `❌ ${r.error}` })
    } catch (e) {
      setTestResult({ ok: false, msg: `❌ Lỗi: ${e.message}` })
    } finally { setTesting(false) }
  }

  const field = (label, children) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--mut)', textTransform: 'uppercase', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )

  if (loading) return <Spinner />

  return (
    <AdminCard>
      {field('AI Model', (
        <select value={config?.model || ''} onChange={e => setConfig(c => ({ ...c, model: e.target.value }))} className="form-input">
          <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (rẻ, nhanh — khuyến nghị)</option>
          <option value="claude-sonnet-4-6">Claude Sonnet 4.6 (mạnh hơn, tốn hơn)</option>
        </select>
      ))}
      {field('Rate Limit — Business (lần/ngày)', (
        <input type="number" min={1} max={500} value={config?.rateLimitBusiness || 30} onChange={e => setConfig(c => ({ ...c, rateLimitBusiness: e.target.value }))} className="form-input" />
      ))}
      {field('Rate Limit — Agency (lần/ngày)', (
        <input type="number" min={1} max={1000} value={config?.rateLimitAgency || 100} onChange={e => setConfig(c => ({ ...c, rateLimitAgency: e.target.value }))} className="form-input" />
      ))}
      {field('Trạng thái tính năng', (
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={config?.enabled !== false} onChange={e => setConfig(c => ({ ...c, enabled: e.target.checked }))} style={{ width: 16, height: 16 }} />
          <span style={{ fontSize: 13, color: 'var(--txt)' }}>{config?.enabled !== false ? 'Đang hoạt động' : 'Đã tắt'}</span>
        </label>
      ))}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
        <AdminButton icon={Save} onClick={handleSave} disabled={saving}>
          {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
        </AdminButton>
        <AdminButton icon={FlaskConical} variant="outline" onClick={handleTest} disabled={testing}>
          {testing ? 'Đang test...' : 'Test kết nối'}
        </AdminButton>
        {testResult && <span style={{ fontSize: 13, color: testResult.ok ? 'var(--grn)' : 'var(--red)', fontWeight: 600 }}>{testResult.msg}</span>}
      </div>
      <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--s2)', borderRadius: 8, fontSize: 12, color: 'var(--mut)', lineHeight: 1.7, border: '1px solid var(--bd)' }}>
        💡 <strong>ANTHROPIC_API_KEY</strong> được cấu hình trong Vercel Dashboard → Settings → Environment Variables.<br />
        Chi phí ước tính: <strong>$0.00025/lần check</strong> với Claude Haiku (~6.500đ/1000 lần).
      </div>
    </AdminCard>
  )
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
// ─── WEB USERS TAB ────────────────────────────────────────────────────────────
const ADMIN_TOKEN = typeof window !== 'undefined' ? atob(localStorage.getItem('gmap_admin_token') || '') : ''

async function adminApi(action, extra = {}) {
  const res = await fetch('/api/admin/web-users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': ADMIN_TOKEN,
    },
    body: JSON.stringify({ action, ...extra }),
  })
  return res.json()
}




export default function Page() {
  return (
    <AdminLayout title="Kiểm tra Vi phạm">
      <PolicyCheckTab />
    </AdminLayout>
  )
}
