import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '../../components/AdminLayout'
import { Badge, Spinner, ErrorBox, CopyButton, EmptyState } from '../../components/AdminUI'
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
  const cardStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginBottom: 20 }
  const subBtnStyle = (active) => ({
    padding: '8px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', background: active ? '#0c2a72' : '#e2e8f0', color: active ? '#fff' : '#475569',
    fontFamily: 'inherit', transition: 'all .15s',
  })

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0c2a72', marginBottom: 20 }}>🛡️ AI Kiểm tra Vi phạm Chính sách Meta</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[['docs','📄 Tài liệu Chính sách'],['stats','📊 Thống kê'],['config','⚙️ Cấu hình AI']].map(([id, label]) => (
          <button key={id} style={subBtnStyle(subTab === id)} onClick={() => setSubTab(id)}>{label}</button>
        ))}
      </div>
      {subTab === 'docs'   && <PolicyDocsSubTab cardStyle={cardStyle} />}
      {subTab === 'stats'  && <PolicyStatsSubTab cardStyle={cardStyle} />}
      {subTab === 'config' && <PolicyConfigSubTab cardStyle={cardStyle} />}
    </div>
  )
}

function PolicyDocsSubTab({ cardStyle }) {
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
    <div style={cardStyle}>
      <p style={{ fontSize: 13, color: 'var(--mut)', marginBottom: 16, lineHeight: 1.6 }}>
        Tài liệu này được AI đọc khi kiểm tra nội dung quảng cáo. Cập nhật khi Meta thay đổi policy hoặc cần tuỳ chỉnh cho từng ngành.
      </p>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--mut)', marginBottom: 5, textTransform: 'uppercase' }}>Ngành</label>
          <select value={industry} onChange={e => setIndustry(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit' }}>
            {PC_INDUSTRIES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
          </select>
        </div>
        {meta && <span style={{ fontSize: 11, color: 'var(--mut)', whiteSpace: 'nowrap' }}>Cập nhật: {new Date(meta.updated_at).toLocaleDateString('vi-VN')}</span>}
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 32, color: 'var(--mut)' }}>⏳ Đang tải...</div> : (
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Nhập nội dung tài liệu policy cho ngành này. Nếu để trống, AI sẽ dùng tài liệu mặc định."
          style={{ width: '100%', minHeight: 420, padding: '12px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'Consolas, monospace', lineHeight: 1.7, resize: 'vertical', outline: 'none' }}
        />
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button onClick={handleSave} disabled={saving || loading} style={{ padding: '9px 20px', background: '#0c2a72', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          {saving ? '⏳ Đang lưu...' : '💾 Lưu tài liệu'}
        </button>
        <button onClick={handleReset} style={{ padding: '9px 16px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          🔄 Reset về mặc định
        </button>
      </div>
    </div>
  )
}

function PolicyStatsSubTab({ cardStyle }) {
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

  const statCard = (icon, label, value, sub) => (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 20px', minWidth: 150 }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#0c2a72' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--mut)', marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 2 }}>{sub}</div>}
    </div>
  )

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['1d','Hôm nay'],['7d','7 ngày'],['30d','30 ngày']].map(([v, l]) => (
          <button key={v} onClick={() => setRange(v)} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: range === v ? '#0c2a72' : '#fff', color: range === v ? '#fff' : '#475569', fontFamily: 'inherit' }}>{l}</button>
        ))}
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--mut)' }}>⏳ Đang tải...</div> : stats ? (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
            {statCard('🔍', 'Tổng lượt check', stats.total)}
            {statCard('❌', 'Vi phạm phát hiện', stats.violations, `${stats.violation_rate}% tổng số`)}
            {statCard('👤', 'Users unique', stats.unique_users)}
            {statCard('💰', 'Chi phí ước tính', `$${stats.estimated_cost_usd}`, `≈ ${(stats.estimated_cost_vnd || 0).toLocaleString('vi-VN')}₫`)}
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
          {stats.total === 0 && <div style={{ textAlign: 'center', padding: 32, color: 'var(--mut)' }}>Chưa có lượt kiểm tra nào trong kỳ này</div>}
        </>
      ) : null}
    </div>
  )
}

function PolicyConfigSubTab({ cardStyle }) {
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
  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }

  if (loading) return <div style={cardStyle}><div style={{ textAlign: 'center', padding: 32, color: 'var(--mut)' }}>⏳ Đang tải...</div></div>

  return (
    <div style={cardStyle}>
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
          <span style={{ fontSize: 13 }}>{config?.enabled !== false ? '✅ Đang hoạt động' : '⛔ Đã tắt'}</span>
        </label>
      ))}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
        <button onClick={handleSave} disabled={saving} style={{ padding: '9px 20px', background: '#0c2a72', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          {saving ? '⏳ Đang lưu...' : '💾 Lưu cấu hình'}
        </button>
        <button onClick={handleTest} disabled={testing} style={{ padding: '9px 16px', background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          {testing ? '⏳ Đang test...' : '🧪 Test kết nối'}
        </button>
        {testResult && <span style={{ fontSize: 13, color: testResult.ok ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{testResult.msg}</span>}
      </div>
      <div style={{ marginTop: 16, padding: '12px 14px', background: '#f8fafc', borderRadius: 8, fontSize: 12, color: 'var(--mut)', lineHeight: 1.7 }}>
        💡 <strong>ANTHROPIC_API_KEY</strong> được cấu hình trong Vercel Dashboard → Settings → Environment Variables.<br />
        Chi phí ước tính: <strong>$0.00025/lần check</strong> với Claude Haiku (~6.500đ/1000 lần).
      </div>
    </div>
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
