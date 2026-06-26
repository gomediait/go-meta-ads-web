import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../lib/AuthContext'
import { isPlanAllowed } from '../../lib/planLimits'

function PlanGate({ feature }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Tính năng này yêu cầu nâng cấp gói</h2>
      <p style={{ color: 'var(--mut)', marginBottom: 24, maxWidth: 400 }}>
        {feature} chỉ dành cho gói <strong>Personal</strong> trở lên.
      </p>
      <Link href="/mua-goi" style={{ background: '#fe5f01', color: '#fff', padding: '12px 28px', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>
        Nâng cấp ngay →
      </Link>
    </div>
  )
}

const OBJECTIVES = [
  { value: 'OUTCOME_AWARENESS', label: 'Mức độ nhận biết', icon: '📢', desc: 'Nhiều người thấy quảng cáo' },
  { value: 'OUTCOME_TRAFFIC', label: 'Lượng truy cập', icon: '🔗', desc: 'Nhiều người click vào link' },
  { value: 'OUTCOME_ENGAGEMENT', label: 'Lượt tương tác', icon: '💬', desc: 'Nhiều like, comment, share' },
]

const INDUSTRIES = [
  { value: '', label: 'Chung (không chọn ngành)' },
  { value: 'fnb', label: 'F&B / Nhà hàng' },
  { value: 'travel', label: 'Du lịch / Khách sạn' },
  { value: 'ecommerce', label: 'Thương mại điện tử' },
  { value: 'beauty', label: 'Làm đẹp / Spa' },
  { value: 'education', label: 'Giáo dục' },
  { value: 'realestate', label: 'Bất động sản' },
  { value: 'health', label: 'Sức khoẻ' },
]

export default function AutoSet() {
  const { user } = useAuth()
  const fbConnected = user?.fb_connected

  const [config, setConfig] = useState({ pages: [], default_account: null, max_pages: 0 })
  const [adAccounts, setAdAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const [step, setStep] = useState(1)
  const [insightText, setInsightText] = useState('')
  const [industry, setIndustry] = useState('')
  const [selectedObjective, setSelectedObjective] = useState('OUTCOME_ENGAGEMENT')
  const [analyzing, setAnalyzing] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState('')

  const [targeting, setTargeting] = useState(null)
  const [interestResults, setInterestResults] = useState([])
  const [behaviorResults, setBehaviorResults] = useState([])
  const [searchingTargets, setSearchingTargets] = useState(false)

  const [selectedPageId, setSelectedPageId] = useState('')
  const [posts, setPosts] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const [budget, setBudget] = useState('100000')
  const [campaignName, setCampaignName] = useState('')

  const [creating, setCreating] = useState(false)
  const [result, setResult] = useState(null)
  const [intSearch, setIntSearch] = useState('')
  const [intSuggestions, setIntSuggestions] = useState([])
  const [intSearching, setIntSearching] = useState(false)
  const [behSearch, setBehSearch] = useState('')
  const [behSuggestions, setBehSuggestions] = useState([])
  const [behSearching, setBehSearching] = useState(false)

  const [history, setHistory] = useState([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchConfig = useCallback(async () => {
    try {
      const r = await fetch('/api/fb/autoset-config')
      const d = await r.json()
      if (d.ok) {
        setConfig(d)
        if (d.default_account) setSelectedAccount(d.default_account)
      }
    } catch {}
  }, [])

  const fetchAccounts = useCallback(async () => {
    try {
      const r = await fetch('/api/fb/campaigns?date_preset=today&status=ALL')
      const d = await r.json()
      if (d.ok) setAdAccounts(d.accounts || [])
    } catch {}
  }, [])

  useEffect(() => {
    if (!fbConnected) { setLoading(false); return }
    Promise.all([fetchConfig(), fetchAccounts()]).finally(() => setLoading(false))
  }, [fbConnected, fetchConfig, fetchAccounts])

  async function handleAnalyze() {
    if (!insightText.trim()) return showToast('Vui lòng nhập insight khách hàng', 'error')
    setAnalyzing(true)
    setResult(null)
    try {
      const r = await fetch('/api/ai/targeting-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insight_text: insightText, industry: industry || undefined })
      })
      const d = await r.json()
      if (!d.ok) return showToast(d.error || 'Lỗi AI', 'error')
      applyAiResult(d.targeting)
      setStep(2)
      await searchTargets(d.targeting.interests || [], d.targeting.behaviors || [])
    } catch (e) { showToast('Lỗi kết nối: ' + e.message, 'error') }
    finally { setAnalyzing(false) }
  }

  async function handlePdfUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) return showToast('Chỉ hỗ trợ file PDF', 'error')
    if (file.size > 5 * 1024 * 1024) return showToast('File quá lớn (tối đa 5MB)', 'error')
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1]
      setAnalyzing(true)
      try {
        const r = await fetch('/api/ai/targeting-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_base64: base64, industry: industry || undefined })
        })
        const d = await r.json()
        if (!d.ok) return showToast(d.error || 'Lỗi AI', 'error')
        if (d.extracted_text) setInsightText(d.extracted_text)
        applyAiResult(d.targeting)
        setStep(2)
        await searchTargets(d.targeting.interests || [], d.targeting.behaviors || [])
      } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
      finally { setAnalyzing(false) }
    }
    reader.readAsDataURL(file)
  }

  function applyAiResult(t) {
    setTargeting({
      objective: selectedObjective,
      locations: t.locations || [],
      age_min: t.age_min || 18,
      age_max: t.age_max || 65,
      genders: t.genders || [],
      interests_keywords: t.interests || [],
      behaviors_keywords: t.behaviors || [],
      location_types: t.location_types || ['home', 'recent'],
    })
    setAiSuggestion(t.suggestion || '')
  }

  async function searchTargets(interests, behaviors) {
    setSearchingTargets(true)
    try {
      const [intRes, behRes] = await Promise.all([
        interests.length > 0 ? fetch('/api/fb/targeting-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keywords: interests, type: 'interest' }) }).then(r => r.json()) : { ok: true, results: [] },
        behaviors.length > 0 ? fetch('/api/fb/targeting-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keywords: behaviors, type: 'behavior' }) }).then(r => r.json()) : { ok: true, results: [] },
      ])
      setInterestResults(intRes?.results || [])
      setBehaviorResults(behRes?.results || [])
    } catch {}
    finally { setSearchingTargets(false) }
  }

  async function searchInterest(q) {
    if (!q.trim()) { setIntSuggestions([]); return }
    setIntSearching(true)
    try {
      const r = await fetch('/api/fb/targeting-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keywords: [q], type: 'interest', mode: 'suggest' }) })
      const d = await r.json()
      setIntSuggestions((d.results || []).filter(s => !interestResults.some(r => r.id === s.id)))
    } catch {}
    finally { setIntSearching(false) }
  }

  async function searchBehavior(q) {
    if (!q.trim()) { setBehSuggestions([]); return }
    setBehSearching(true)
    try {
      const r = await fetch('/api/fb/targeting-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keywords: [q], type: 'behavior', mode: 'suggest' }) })
      const d = await r.json()
      setBehSuggestions((d.results || []).filter(s => !behaviorResults.some(r => r.id === s.id)))
    } catch {}
    finally { setBehSearching(false) }
  }

  function addInterest(item) {
    if (interestResults.some(r => r.id === item.id)) return
    setInterestResults(p => [...p, item])
    setIntSearch('')
    setIntSuggestions([])
  }

  function addBehavior(item) {
    if (behaviorResults.some(r => r.id === item.id)) return
    setBehaviorResults(p => [...p, item])
    setBehSearch('')
    setBehSuggestions([])
  }

  async function loadPagePosts(pageId) {
    if (!pageId) return
    setLoadingPosts(true)
    setSelectedPost(null)
    try {
      const r = await fetch('/api/fb/autoset-scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'scan' }) })
      const d = await r.json()
      if (d.ok) setPosts((d.posts || []).filter(p => p.page_id === pageId || !pageId))
    } catch {}
    finally { setLoadingPosts(false) }
  }

  function handlePageChange(pageId) {
    setSelectedPageId(pageId)
    const page = config.pages?.find(p => p.page_id === pageId)
    if (page) setCampaignName(`Auto - ${page.page_name} - ${insightText.slice(0, 20)}`)
    loadPagePosts(pageId)
  }

  async function handleCreate() {
    if (!selectedPost) return showToast('Chọn bài viết', 'error')
    if (!selectedPageId) return showToast('Chọn Page', 'error')
    if (!selectedAccount) return showToast('Chọn tài khoản quảng cáo', 'error')

    const geoLocations = { countries: ['VN'] }

    const flexibleSpec = []
    if (interestResults.length > 0) {
      flexibleSpec.push({ interests: interestResults.map(i => ({ id: i.id, name: i.name })) })
    }
    if (behaviorResults.length > 0) {
      if (flexibleSpec.length > 0) {
        flexibleSpec[0].behaviors = behaviorResults.map(b => ({ id: b.id, name: b.name }))
      } else {
        flexibleSpec.push({ behaviors: behaviorResults.map(b => ({ id: b.id, name: b.name })) })
      }
    }

    const targetingPayload = {
      geo_locations: geoLocations,
      location_types: targeting.location_types || ['home', 'recent'],
      age_min: targeting.age_min || 18,
      age_max: targeting.age_max || 65,
    }
    if (targeting.genders?.length > 0) targetingPayload.genders = targeting.genders
    if (flexibleSpec.length > 0) targetingPayload.flexible_spec = flexibleSpec

    setCreating(true)
    try {
      const r = await fetch('/api/fb/autoset-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_ad_v2',
          campaign_name: campaignName || 'Auto Campaign',
          adset_name: `Auto Adset - ${targeting.locations?.[0] || 'VN'}`,
          ad_name: `Auto Ad - ${(selectedPost.message || '').slice(0, 30)}`,
          objective: targeting.objective,
          page_id: selectedPageId,
          post_id: selectedPost.id,
          ad_account_id: selectedAccount,
          daily_budget: Number(budget) || 100000,
          targeting: targetingPayload,
          cta_type: targeting.cta_type,
          post_message: selectedPost.message,
        })
      })
      const d = await r.json()
      if (d.ok) { setResult(d); showToast('Đã tạo quảng cáo thành công (PAUSED)') }
      else showToast(d.error || 'Lỗi tạo ads', 'error')
    } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
    finally { setCreating(false) }
  }

  async function handleActivate() {
    if (!result) return
    try {
      const r = await fetch('/api/fb/autoset-scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'activate', campaign_id: result.campaign_id, adset_id: result.adset_id, ad_id: result.ad_id }) })
      const d = await r.json()
      if (d.ok) showToast('Đã kích hoạt quảng cáo!')
      else showToast(d.error || 'Lỗi kích hoạt', 'error')
    } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
  }

  async function loadHistory() {
    setLoadingHistory(true)
    try {
      const r = await fetch('/api/fb/autoset-scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'history' }) })
      const d = await r.json()
      if (d.ok) setHistory(d.history || [])
    } catch {}
    finally { setLoadingHistory(false) }
  }

  function toggleHistory() {
    const next = !historyOpen
    setHistoryOpen(next)
    if (next && history.length === 0) loadHistory()
  }

  function resetWizard() {
    setStep(1); setInsightText(''); setTargeting(null); setInterestResults([]); setBehaviorResults([])
    setSelectedPost(null); setResult(null); setAiSuggestion(''); setPosts([])
    setSelectedObjective('OUTCOME_ENGAGEMENT')
  }

  const fmtAud = n => n >= 1000000 ? (n / 1000000).toFixed(1) + 'M' : n >= 1000 ? (n / 1000).toFixed(0) + 'K' : n

  if (!isPlanAllowed(user?.plan, 'autoset')) {
    return <DashboardLayout title="Tự động tạo QC"><PlanGate feature="Tự động tạo quảng cáo" /></DashboardLayout>
  }

  return (
    <DashboardLayout title="Tự động tạo QC">
      {toast && <div className="toast" style={{ background: toast.type === 'error' ? '#ef4444' : '#10b981' }}>{toast.msg}</div>}

      <div className="page-wrap">
        <div className="page-header">
          <span className="page-icon">🚀</span>
          <div>
            <h1>Tự động tạo quảng cáo</h1>
            <p>AI phân tích insight khách hàng → tự điền targeting → tạo ads trên Meta</p>
          </div>
        </div>

        {!fbConnected ? (
          <div className="empty-box">
            <div style={{ fontSize: 40 }}>🔗</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Cần kết nối Facebook Ads</div>
            <Link href="/settings/connect-facebook" className="link-btn">Kết nối ngay →</Link>
          </div>
        ) : loading ? (
          <div className="skel" />
        ) : (
          <>
            {/* Steps */}
            <div className="steps">
              {[{ n: 1, l: 'Nhập insight' }, { n: 2, l: 'Review targeting' }, { n: 3, l: 'Tạo quảng cáo' }].map(s => (
                <div key={s.n} className={`step${step === s.n ? ' on' : ''}${step > s.n ? ' ok' : ''}`}>
                  <div className="step-n">{step > s.n ? '✓' : s.n}</div>
                  <div className="step-l">{s.l}</div>
                </div>
              ))}
            </div>

            {/* Step 1: Objective + Insight */}
            {step === 1 && (
              <div className="card">
                <div className="card-t">Bước 1: Chọn mục tiêu & nhập insight</div>

                <div className="fr">
                  <label className="lb">Mục tiêu chiến dịch</label>
                  <div className="obj-grid">
                    {OBJECTIVES.map(o => (
                      <div
                        key={o.value}
                        className={`obj-card${selectedObjective === o.value ? ' obj-active' : ''}`}
                        onClick={() => setSelectedObjective(o.value)}
                      >
                        <div className="obj-icon">{o.icon}</div>
                        <div><div className="obj-label">{o.label}</div>{o.desc && <div className="obj-desc">{o.desc}</div>}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="fr">
                  <label className="lb">Ngành nghề (optional)</label>
                  <select className="inp" value={industry} onChange={e => setIndustry(e.target.value)}>
                    {INDUSTRIES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                  </select>
                </div>

                <div className="fr">
                  <label className="lb">Insight / Chân dung khách hàng</label>
                  <textarea className="inp ta" rows={8} placeholder={"Paste insight vào đây...\n\nVí dụ:\n- Khách du lịch Đà Nẵng, 25-40 tuổi\n- Thích resort, khách sạn cao cấp\n- Hay đi du lịch cuối tuần\n- Quan tâm ẩm thực hải sản"} value={insightText} onChange={e => setInsightText(e.target.value)} />
                  <div className="hint">{insightText.length}/3000 ký tự</div>
                </div>

                <div className="fr">
                  <label className="lb">Hoặc upload file PDF</label>
                  <input type="file" accept=".pdf" onChange={handlePdfUpload} style={{ fontSize: 13 }} />
                </div>

                <button className="btn-p" onClick={handleAnalyze} disabled={analyzing || !insightText.trim()}>
                  {analyzing ? '🤖 AI đang phân tích...' : '🤖 AI Phân tích targeting'}
                </button>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && targeting && (
              <div className="card">
                <div className="card-t">Bước 2: Review targeting (AI đã điền)</div>

                {aiSuggestion && <div className="ai-sug">💡 {aiSuggestion}</div>}

                <div className="g2">
                  <div className="fr">
                    <label className="lb">Location type</label>
                    <select className="inp" value={(targeting.location_types || [])[0] || 'home'} onChange={e => setTargeting(p => ({ ...p, location_types: e.target.value === 'travel_in' ? ['travel_in'] : ['home', 'recent'] }))}>
                      <option value="home">Người ở/gần đây</option>
                      <option value="travel_in">Khách du lịch đến</option>
                    </select>
                  </div>
                </div>

                <div className="fr">
                  <label className="lb">Vị trí</label>
                  <div className="tags">{targeting.locations?.map((l, i) => <span key={i} className="tag">{l} <button className="tx" onClick={() => setTargeting(p => ({ ...p, locations: p.locations.filter((_, j) => j !== i) }))}>✕</button></span>)}
                    {(!targeting.locations?.length) && <span className="th">Việt Nam (mặc định)</span>}
                  </div>
                </div>

                <div className="g2">
                  <div className="fr">
                    <label className="lb">Độ tuổi</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="number" className="inp" min={18} max={65} value={targeting.age_min} onChange={e => setTargeting(p => ({ ...p, age_min: Number(e.target.value) }))} style={{ width: 80 }} />
                      <span>→</span>
                      <input type="number" className="inp" min={18} max={65} value={targeting.age_max} onChange={e => setTargeting(p => ({ ...p, age_max: Number(e.target.value) }))} style={{ width: 80 }} />
                    </div>
                  </div>
                  <div className="fr">
                    <label className="lb">Giới tính</label>
                    <select className="inp" value={targeting.genders?.length === 1 ? targeting.genders[0] : 0} onChange={e => setTargeting(p => ({ ...p, genders: Number(e.target.value) === 0 ? [] : [Number(e.target.value)] }))}>
                      <option value={0}>Tất cả</option>
                      <option value={1}>Nam</option>
                      <option value={2}>Nữ</option>
                    </select>
                  </div>
                </div>

                <div className="fr">
                  <label className="lb">Sở thích (Interests) {searchingTargets && '⏳'}</label>
                  <div className="tags">
                    {interestResults.map((r, i) => <span key={i} className="tag ti">{r.name} <span className="ta">({fmtAud(r.audience_size)})</span> <button className="tx" onClick={() => setInterestResults(p => p.filter((_, j) => j !== i))}>✕</button></span>)}
                    {!interestResults.length && !searchingTargets && <span className="th">Chưa có — tìm bên dưới hoặc dùng Advantage+ Audience</span>}
                  </div>
                  <div className="search-box">
                    <input className="inp" placeholder="Tìm sở thích... VD: Travel, Food, iPhone" value={intSearch}
                      onChange={e => { setIntSearch(e.target.value); if (e.target.value.length >= 2) searchInterest(e.target.value) }}
                      onBlur={() => setTimeout(() => setIntSuggestions([]), 200)}
                    />
                    {intSearching && <span className="search-loading">⏳</span>}
                    {intSuggestions.length > 0 && (
                      <div className="suggestions">
                        {intSuggestions.map((s, i) => (
                          <div key={i} className="sug-item" onMouseDown={() => addInterest(s)}>
                            <span className="sug-name">{s.name}</span>
                            <span className="sug-aud">{fmtAud(s.audience_size)} người</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="fr">
                  <label className="lb">Hành vi (Behaviors)</label>
                  <div className="tags">
                    {behaviorResults.map((r, i) => <span key={i} className="tag tb">{r.name} <span className="ta">({fmtAud(r.audience_size)})</span> <button className="tx" onClick={() => setBehaviorResults(p => p.filter((_, j) => j !== i))}>✕</button></span>)}
                    {!behaviorResults.length && <span className="th">Chưa có — tìm bên dưới</span>}
                  </div>
                  <div className="search-box">
                    <input className="inp" placeholder="Tìm hành vi... VD: Frequent travelers" value={behSearch}
                      onChange={e => { setBehSearch(e.target.value); if (e.target.value.length >= 2) searchBehavior(e.target.value) }}
                      onBlur={() => setTimeout(() => setBehSuggestions([]), 200)}
                    />
                    {behSearching && <span className="search-loading">⏳</span>}
                    {behSuggestions.length > 0 && (
                      <div className="suggestions">
                        {behSuggestions.map((s, i) => (
                          <div key={i} className="sug-item" onMouseDown={() => addBehavior(s)}>
                            <span className="sug-name">{s.name}</span>
                            <span className="sug-aud">{fmtAud(s.audience_size)} người</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="btns"><button className="btn-s" onClick={() => setStep(1)}>← Quay lại</button><button className="btn-p" onClick={() => setStep(3)}>Tiếp tục →</button></div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && targeting && (
              <div className="card">
                <div className="card-t">Bước 3: Chọn bài viết & tạo quảng cáo</div>

                <div className="g2">
                  <div className="fr">
                    <label className="lb">Tài khoản quảng cáo</label>
                    <select className="inp" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
                      <option value="">Chọn tài khoản...</option>
                      {adAccounts.map(a => <option key={a.account_id} value={a.account_id}>{a.account_name || a.account_id}</option>)}
                    </select>
                  </div>
                  <div className="fr">
                    <label className="lb">Facebook Page</label>
                    <select className="inp" value={selectedPageId} onChange={e => handlePageChange(e.target.value)}>
                      <option value="">Chọn Page...</option>
                      {config.pages?.map(p => <option key={p.page_id} value={p.page_id}>{p.page_name}</option>)}
                    </select>
                    {!config.pages?.length && <div className="hint">Chưa cấu hình Page. Thêm ở mục cũ hoặc Settings.</div>}
                  </div>
                </div>

                {selectedPageId && (
                  <div className="fr">
                    <label className="lb">Chọn bài viết</label>
                    {loadingPosts ? <div className="hint">Đang tải...</div>
                    : !posts.length ? <div className="hint">Không có bài viết mới.</div>
                    : <div className="pl">{posts.slice(0, 10).map(p => (
                        <div key={p.id} className={`pi${selectedPost?.id === p.id ? ' sel' : ''}`} onClick={() => setSelectedPost(p)}>
                          {p.full_picture && <img src={p.full_picture} className="pt" alt="" />}
                          <div className="pb">
                            <div className="pm">{(p.message || p.story || '').slice(0, 80)}</div>
                            <div className="px">{p.page_name} · {p.created_time ? new Date(p.created_time).toLocaleDateString('vi-VN') : ''}</div>
                          </div>
                        </div>
                      ))}</div>}
                  </div>
                )}

                <div className="g2">
                  <div className="fr">
                    <label className="lb">Ngân sách hàng ngày (₫)</label>
                    <input type="number" className="inp" min={30000} value={budget} onChange={e => setBudget(e.target.value)} />
                    <div className="hint">Tối thiểu ₫30.000/ngày</div>
                  </div>
                  <div className="fr">
                    <label className="lb">Tên chiến dịch</label>
                    <input type="text" className="inp" value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="Auto - Campaign name" />
                  </div>
                </div>

                {result && (
                  <div className="res">
                    <div className="res-t">✅ Đã tạo quảng cáo (PAUSED)</div>
                    <div className="res-r">Campaign: <code>{result.campaign_id}</code></div>
                    <div className="res-r">Adset: <code>{result.adset_id}</code></div>
                    <div className="res-r">Ad: <code>{result.ad_id}</code></div>
                    {result._log_error && <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 6 }}>⚠️ {result._log_error}</div>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button className="btn-act" onClick={handleActivate}>▶ Kích hoạt (ACTIVE)</button>
                      <button className="btn-s" onClick={resetWizard}>+ Tạo mới</button>
                    </div>
                  </div>
                )}

                <div className="btns">
                  <button className="btn-s" onClick={() => setStep(2)}>← Quay lại</button>
                  {!result && <button className="btn-p" onClick={handleCreate} disabled={creating || !selectedPost || !selectedAccount}>{creating ? '⏳ Đang tạo...' : '🚀 Tạo quảng cáo (PAUSED)'}</button>}
                </div>
              </div>
            )}

            {/* History */}
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-t" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', marginBottom: historyOpen ? 16 : 0, paddingBottom: historyOpen ? 12 : 0 }} onClick={toggleHistory}>
                <span>📋 Lịch sử tạo ads {history.length > 0 ? `(${history.length})` : ''}</span>
                <span>{historyOpen ? '▲' : '▼'}</span>
              </div>
              {historyOpen && (loadingHistory ? <div className="hint">Đang tải...</div> : !history.length ? <div className="hint">Chưa có lịch sử</div> : (
                <table className="ht"><thead><tr><th>Nội dung</th><th>Campaign</th><th>Thời gian</th></tr></thead>
                <tbody>{history.map(h => <tr key={h.id}><td>{(h.post_message || '').slice(0, 50)}</td><td><code>{h.campaign_id}</code></td><td>{h.created_at ? new Date(h.created_at).toLocaleString('vi-VN') : '—'}</td></tr>)}</tbody></table>
              ))}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .page-wrap { padding: 24px; max-width: 860px; }
        .page-header { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
        .page-icon { font-size: 32px; }
        h1 { font-size: 20px; font-weight: 700; color: var(--txt); margin-bottom: 4px; }
        p { font-size: 13px; color: var(--mut); }

        .toast { position: fixed; top: 16px; right: 16px; z-index: 99999; padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; color: #fff; box-shadow: 0 4px 16px rgba(0,0,0,.25); pointer-events: none; animation: ti .3s ease; }
        @keyframes ti { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }

        .empty-box { display: flex; flex-direction: column; align-items: center; background: var(--s1); border: 1px solid var(--bd); border-radius: 16px; padding: 48px 32px; text-align: center; gap: 12px; }
        .link-btn { background: #1877f2; color: #fff; border-radius: 9px; padding: 10px 20px; font-size: 13px; font-weight: 700; text-decoration: none; margin-top: 8px; }
        .skel { height: 300px; border-radius: 14px; background: linear-gradient(90deg, var(--s2) 25%, var(--s3) 50%, var(--s2) 75%); background-size: 200% 100%; animation: sh 1.2s infinite; }
        @keyframes sh { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .steps { display: flex; gap: 4px; margin-bottom: 20px; }
        .step { display: flex; align-items: center; gap: 8px; flex: 1; padding: 10px 14px; border-radius: 10px; background: var(--s1); border: 1px solid var(--bd); opacity: .5; transition: all .2s; }
        .step.on { opacity: 1; border-color: var(--primary); background: rgba(99,102,241,.06); }
        .step.ok { opacity: .8; }
        .step-n { width: 24px; height: 24px; border-radius: 50%; background: var(--s3); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: var(--txt); flex-shrink: 0; }
        .step.on .step-n { background: var(--primary); color: #fff; }
        .step.ok .step-n { background: #10b981; color: #fff; }
        .step-l { font-size: 12px; font-weight: 600; color: var(--txt); }

        .obj-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        @media (max-width: 600px) { .obj-grid { grid-template-columns: repeat(2, 1fr); } }
        .obj-card { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 10px; border: 1px solid var(--bd); background: var(--s2); cursor: pointer; transition: all .15s; }
        .obj-card:hover { border-color: rgba(99,102,241,.4); background: rgba(99,102,241,.04); }
        .obj-card.obj-active { border-color: var(--primary); background: rgba(99,102,241,.1); box-shadow: 0 0 0 1px var(--primary); }
        .obj-icon { font-size: 20px; flex-shrink: 0; }
        .obj-label { font-size: 12px; font-weight: 600; color: var(--txt); line-height: 1.3; }
        .obj-desc { font-size: 10px; color: var(--mut); margin-top: 2px; }

        .card { background: var(--s1); border: 1px solid var(--bd); border-radius: 14px; padding: 22px; }
        .card-t { font-size: 15px; font-weight: 700; color: var(--txt); margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid var(--bd); }

        .fr { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .lb { font-size: 13px; font-weight: 600; color: var(--txt); }
        .hint { font-size: 11px; color: var(--mut); }
        .inp { padding: 9px 14px; border-radius: 9px; border: 1px solid var(--bd); background: var(--s2); color: var(--txt); font-size: 13px; font-family: inherit; width: 100%; }
        .inp:focus { outline: none; border-color: var(--primary); }
        .ta { resize: vertical; line-height: 1.6; }
        .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 600px) { .g2 { grid-template-columns: 1fr; } }

        .btns { display: flex; gap: 10px; margin-top: 8px; }
        .btn-p { background: var(--primary); color: #fff; border: none; border-radius: 9px; padding: 10px 24px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; transition: opacity .15s; }
        .btn-p:hover:not(:disabled) { opacity: .88; }
        .btn-p:disabled { opacity: .5; cursor: default; }
        .btn-s { background: var(--s2); color: var(--txt); border: 1px solid var(--bd); border-radius: 9px; padding: 10px 20px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .btn-s:hover { border-color: var(--primary); color: var(--primary); }
        .btn-act { background: #10b981; color: #fff; border: none; border-radius: 9px; padding: 10px 20px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; }

        .ai-obj-card { background: rgba(99,102,241,.06); border: 1px solid rgba(99,102,241,.2); border-radius: 12px; padding: 14px 16px; margin-bottom: 16px; }
        .ai-obj-header { display: flex; gap: 10px; align-items: flex-start; }
        .ai-obj-title { font-size: 14px; font-weight: 700; color: var(--txt); }
        .ai-conf { font-size: 11px; font-weight: 600; color: #10b981; background: rgba(16,185,129,.1); padding: 2px 8px; border-radius: 10px; margin-left: 8px; }
        .ai-obj-reason { font-size: 12px; color: var(--mut); margin-top: 3px; line-height: 1.5; }
        .ai-alts { display: flex; align-items: center; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
        .ai-alts-label { font-size: 11px; color: var(--mut); font-weight: 600; }
        .ai-alt-btn { padding: 5px 12px; border-radius: 8px; border: 1px solid var(--bd); background: var(--s1); color: var(--txt); font-size: 11px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all .15s; }
        .ai-alt-btn:hover { border-color: var(--primary); color: var(--primary); background: rgba(99,102,241,.08); }
        .ai-obj-change { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
        .obj-auto { border-style: dashed; }
        .ai-sug { background: rgba(99,102,241,.08); border: 1px solid rgba(99,102,241,.2); border-radius: 10px; padding: 10px 14px; font-size: 13px; color: var(--txt); margin-bottom: 16px; line-height: 1.5; }

        .tags { display: flex; flex-wrap: wrap; gap: 6px; min-height: 32px; align-items: center; }
        .tag { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; background: var(--s2); border: 1px solid var(--bd); color: var(--txt); }
        .ti { background: rgba(59,130,246,.1); border-color: rgba(59,130,246,.25); color: #3b82f6; }
        .tb { background: rgba(139,92,246,.1); border-color: rgba(139,92,246,.25); color: #8b5cf6; }
        .ta { font-size: 10px; color: var(--mut); font-weight: 400; }
        .tx { background: none; border: none; cursor: pointer; font-size: 11px; color: var(--mut); padding: 0 2px; }
        .tx:hover { color: #ef4444; }
        .th { font-size: 12px; color: var(--mut); font-style: italic; }

        .search-box { position: relative; margin-top: 6px; }
        .search-loading { position: absolute; right: 12px; top: 10px; font-size: 12px; }
        .suggestions { position: absolute; top: 100%; left: 0; right: 0; background: var(--s1); border: 1px solid var(--bd); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,.15); z-index: 10; max-height: 200px; overflow-y: auto; margin-top: 4px; }
        .sug-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 14px; cursor: pointer; transition: background .1s; font-size: 13px; }
        .sug-item:hover { background: rgba(99,102,241,.08); }
        .sug-item:first-child { border-radius: 10px 10px 0 0; }
        .sug-item:last-child { border-radius: 0 0 10px 10px; }
        .sug-name { color: var(--txt); font-weight: 500; }
        .sug-aud { color: var(--mut); font-size: 11px; }

        .pl { display: flex; flex-direction: column; gap: 8px; max-height: 400px; overflow-y: auto; }
        .pi { display: flex; gap: 10px; padding: 10px; border-radius: 10px; border: 1px solid var(--bd); cursor: pointer; transition: all .15s; }
        .pi:hover { background: var(--s2); }
        .pi.sel { border-color: var(--primary); background: rgba(99,102,241,.06); }
        .pt { width: 60px; height: 60px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
        .pb { min-width: 0; flex: 1; }
        .pm { font-size: 13px; color: var(--txt); line-height: 1.4; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .px { font-size: 11px; color: var(--mut); margin-top: 4px; }

        .res { background: rgba(16,185,129,.08); border: 1px solid rgba(16,185,129,.25); border-radius: 10px; padding: 16px; margin-bottom: 16px; }
        .res-t { font-size: 14px; font-weight: 700; color: #10b981; margin-bottom: 8px; }
        .res-r { font-size: 12px; color: var(--txt); margin-bottom: 3px; }
        .res-r code { background: var(--s2); padding: 2px 6px; border-radius: 4px; font-size: 11px; }

        .ht { width: 100%; border-collapse: collapse; font-size: 12px; }
        .ht th { background: var(--s2); padding: 6px 10px; text-align: left; color: var(--mut); font-size: 11px; text-transform: uppercase; }
        .ht td { padding: 8px 10px; border-bottom: 1px solid var(--bd); color: var(--txt); }
        .ht code { background: var(--s2); padding: 2px 6px; border-radius: 4px; font-size: 10px; }
      `}</style>
    </DashboardLayout>
  )
}
