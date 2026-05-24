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

const PLAN_NAMES = { trial: 'Trial', personal: 'Personal', business: 'Business', agency: 'Agency' }
const PLAN_MAX_PAGES = { trial: 0, personal: 1, business: 2, agency: 10 }

const OBJECTIVES = [
  { value: 'OUTCOME_TRAFFIC',    label: 'Tăng traffic' },
  { value: 'OUTCOME_ENGAGEMENT', label: 'Tương tác bài viết' },
  { value: 'OUTCOME_AWARENESS',  label: 'Nhận diện thương hiệu' },
]

export default function AutoSet() {
  const { user } = useAuth()
  const fbConnected = user?.fb_connected
  const plan = user?.plan || 'trial'
  const planName = PLAN_NAMES[plan] || plan
  const maxPages = PLAN_MAX_PAGES[plan] ?? 0

  const [config, setConfig] = useState({ pages: [], default_account: null, max_pages: maxPages })
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [toast, setToast] = useState(null)
  const [scanResults, setScanResults] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({
    page_id: '', page_name: '', hashtag: '', daily_budget: '100000', objective: 'OUTCOME_TRAFFIC'
  })
  const [myFbPages, setMyFbPages] = useState([])
  const [loadingMyPages, setLoadingMyPages] = useState(false)
  const [creatingAd, setCreatingAd] = useState(null)
  const [savingAccount, setSavingAccount] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState('')
  const [adAccounts, setAdAccounts] = useState([])
  const [history, setHistory] = useState([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [savingPage, setSavingPage] = useState(false)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchConfig = useCallback(async () => {
    try {
      const r = await fetch('/api/fb/autoset-config')
      const d = await r.json()
      if (d.ok) {
        setConfig({ pages: d.pages || [], default_account: d.default_account, max_pages: d.max_pages })
        setSelectedAccount(d.default_account || '')
      }
    } catch {}
  }, [])

  const fetchAdAccounts = useCallback(async () => {
    try {
      const r = await fetch('/api/fb/campaigns?date_preset=today&status=ALL')
      const d = await r.json()
      if (d.ok) setAdAccounts(d.accounts || [])
    } catch {}
  }, [])

  useEffect(() => {
    if (!fbConnected) { setLoading(false); return }
    Promise.all([fetchConfig(), fetchAdAccounts()]).finally(() => setLoading(false))
  }, [fbConnected, fetchConfig, fetchAdAccounts])

  async function handleSaveAccount() {
    if (!selectedAccount) return showToast('Vui lòng chọn tài khoản quảng cáo', 'error')
    setSavingAccount(true)
    try {
      const r = await fetch('/api/fb/autoset-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_account', default_ad_account_id: selectedAccount })
      })
      const d = await r.json()
      if (!d.ok) return showToast(d.error || 'Lỗi lưu tài khoản', 'error')
      showToast('Đã lưu tài khoản mặc định')
      fetchConfig()
    } catch { showToast('Lỗi kết nối', 'error') }
    finally { setSavingAccount(false) }
  }

  async function openAddModal() {
    setShowAddModal(true)
    setAddForm({ page_id: '', page_name: '', hashtag: '', daily_budget: '100000', objective: 'OUTCOME_TRAFFIC' })
    setMyFbPages([])
    setLoadingMyPages(true)
    try {
      const r = await fetch('/api/fb/autoset-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_my_pages' })
      })
      const d = await r.json()
      if (d.ok) setMyFbPages(d.pages || [])
      else showToast(d.error || 'Không tải được pages', 'error')
    } catch { showToast('Lỗi kết nối', 'error') }
    finally { setLoadingMyPages(false) }
  }

  function handlePageSelect(e) {
    const pageId = e.target.value
    const found = myFbPages.find(p => p.id === pageId)
    setAddForm(prev => ({ ...prev, page_id: pageId, page_name: found?.name || '' }))
  }

  async function handleAddPage() {
    if (!addForm.page_id) return showToast('Vui lòng chọn Facebook Page', 'error')
    const accountId = addForm.ad_account_id || config.default_account || selectedAccount
    if (!accountId) return showToast('Vui lòng chọn tài khoản quảng cáo', 'error')

    setSavingPage(true)
    try {
      const r = await fetch('/api/fb/autoset-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_page',
          page_id: addForm.page_id,
          page_name: addForm.page_name,
          hashtag: addForm.hashtag.trim() || null,
          daily_budget: Number(addForm.daily_budget) || 100000,
          objective: addForm.objective,
          ad_account_id: accountId,
        })
      })
      const d = await r.json()
      if (!d.ok) return showToast(d.error || 'Lỗi thêm page', 'error')
      showToast('Đã thêm page thành công')
      setShowAddModal(false)
      fetchConfig()
    } catch { showToast('Lỗi kết nối', 'error') }
    finally { setSavingPage(false) }
  }

  async function handleRemovePage(page_id, page_name) {
    if (!confirm(`Xoá page "${page_name}" khỏi danh sách?`)) return
    try {
      const r = await fetch('/api/fb/autoset-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove_page', page_id })
      })
      const d = await r.json()
      if (!d.ok) return showToast(d.error || 'Lỗi xoá page', 'error')
      showToast('Đã xoá page')
      fetchConfig()
    } catch { showToast('Lỗi kết nối', 'error') }
  }

  async function handleScan() {
    setScanning(true)
    setScanResults([])
    try {
      const r = await fetch('/api/fb/autoset-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scan' })
      })
      const d = await r.json()
      if (!d.ok) return showToast(d.error || 'Lỗi quét bài viết', 'error')
      setScanResults(d.posts || [])
      if ((d.posts || []).length === 0) showToast('Không có bài viết mới')
      else showToast(`Tìm thấy ${d.posts.length} bài viết mới`)
    } catch { showToast('Lỗi kết nối', 'error') }
    finally { setScanning(false) }
  }

  async function handleCreateAd(post) {
    setCreatingAd(post.id)
    try {
      const r = await fetch('/api/fb/autoset-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_ad',
          post_id: post.id,
          page_id: post.page_id,
          page_name: post.page_name,
          ad_account_id: post.ad_account_id || config.default_account,
          daily_budget: post.daily_budget,
          objective: post.objective,
          post_message: post.message || post.story || '',
        })
      })
      const d = await r.json()
      if (!d.ok) return showToast(d.error || 'Lỗi tạo ads', 'error')
      showToast(`Đã tạo ads! Campaign: ${d.campaign_id}`)
      setScanResults(prev => prev.filter(p => p.id !== post.id))
    } catch { showToast('Lỗi kết nối', 'error') }
    finally { setCreatingAd(null) }
  }

  async function loadHistory() {
    setLoadingHistory(true)
    try {
      const r = await fetch('/api/fb/autoset-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'history' })
      })
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

  const isConfigured = config.pages.length > 0 && (config.default_account || config.pages.some(p => p.ad_account_id))

  if (!fbConnected) {
    return (
      <DashboardLayout title="Tự động Set QC">
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 16, padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 40 }}>🔗</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt)' }}>Cần kết nối Facebook Ads</div>
            <div style={{ fontSize: 13, color: 'var(--mut)', maxWidth: 380, lineHeight: 1.6 }}>Tính năng Tự động Set QC yêu cầu kết nối tài khoản Facebook Ads.</div>
            <Link href="/settings/connect-facebook" style={{ background: '#1877f2', color: '#fff', borderRadius: 9, padding: '10px 20px', fontSize: 13, fontWeight: 700, textDecoration: 'none', marginTop: 8 }}>Kết nối ngay →</Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!isPlanAllowed(user?.plan, 'autoset')) {
    return <DashboardLayout title="Tự động Set QC"><PlanGate feature="Tự động Set QC" /></DashboardLayout>
  }

  return (
    <DashboardLayout title="Tự động Set QC">
      <div className="as-page">

        {toast && (
          <div className={`as-toast ${toast.type}`}>{toast.msg}</div>
        )}

        {/* A. Header */}
        <div className="page-header">
          <div className="ph-left">
            <span className="ph-icon">⚙️</span>
            <div>
              <h1>Tự động set quảng cáo</h1>
              <p>Cấu hình page + tài khoản quảng cáo. Sau đó dùng nút &ldquo;Quét bài viết mới&rdquo; để tự động tạo Campaign + Adset + Ad cho mỗi post có hashtag sản phẩm.</p>
            </div>
          </div>
        </div>

        {/* Status banner + scan button */}
        <div className={`status-banner ${isConfigured ? 'configured' : 'not-configured'}`}>
          <span className="status-dot" />
          <span className="status-text">
            {isConfigured
              ? `Đã cấu hình ${config.pages.length} page. Sẵn sàng quét bài viết.`
              : 'Chưa cấu hình — hãy thêm ít nhất 1 page và chọn tài khoản quảng cáo.'}
          </span>
          <button
            className="btn-scan"
            onClick={handleScan}
            disabled={!isConfigured || scanning}
          >
            {scanning ? '⏳ Đang quét...' : '🔍 Quét bài viết mới'}
          </button>
        </div>

        {/* B. Default Ad Account */}
        <div className="section-card">
          <div className="section-title">🏪 Tài khoản quảng cáo mặc định</div>
          <div className="section-desc">Tài khoản quảng cáo dùng để tạo Campaign mới.</div>
          <div className="account-row">
            <select
              className="inp"
              value={selectedAccount}
              onChange={e => setSelectedAccount(e.target.value)}
            >
              <option value="">-- Chọn tài khoản --</option>
              {adAccounts.map(a => (
                <option key={a.account_id} value={a.account_id}>
                  {a.account_name || a.account_id}
                </option>
              ))}
            </select>
            <button className="btn-save-acc" onClick={handleSaveAccount} disabled={savingAccount}>
              {savingAccount ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </div>

        {/* C. Pages section */}
        <div className="section-card">
          <div className="section-header">
            <div>
              <div className="section-title">📋 Pages đã cấu hình ({config.pages.length}/{config.max_pages})</div>
            </div>
            <button
              className="btn-add-page"
              onClick={openAddModal}
              disabled={config.pages.length >= config.max_pages}
            >
              + Thêm page
            </button>
          </div>

          {loading ? (
            <div className="loading-text">Đang tải...</div>
          ) : config.pages.length === 0 ? (
            <div className="empty-pages">
              <div style={{ fontSize: 32 }}>📄</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Chưa có page nào</div>
              <div style={{ fontSize: 12, color: 'var(--mut)' }}>Thêm Facebook Page để tự động quét bài viết có hashtag</div>
            </div>
          ) : (
            <div className="pages-list">
              {config.pages.map(page => (
                <div key={page.page_id} className="page-card">
                  <div className="page-info">
                    <div className="page-name">{page.page_name}</div>
                    <div className="page-meta">
                      {page.hashtag && <span className="hashtag-badge">{page.hashtag}</span>}
                      <span className="budget-text">
                        {Number(page.daily_budget || 0).toLocaleString('vi-VN')}₫/ngày
                      </span>
                      <span className="obj-text">
                        {OBJECTIVES.find(o => o.value === page.objective)?.label || page.objective}
                      </span>
                    </div>
                  </div>
                  <button className="btn-remove" onClick={() => handleRemovePage(page.page_id, page.page_name)}>
                    Xoá
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="plan-hint">
            Gói {planName}: tối đa {config.max_pages} page. Đã dùng: {config.pages.length}.
          </div>
        </div>

        {/* D. Scan results */}
        {scanResults.length > 0 && (
          <div className="section-card">
            <div className="section-header">
              <div className="section-title">📬 Bài viết mới — {scanResults.length} bài chưa có quảng cáo</div>
              <button className="btn-select-all" onClick={() => {}}>✓ Chọn tất cả</button>
            </div>
            <div className="posts-list">
              {scanResults.map(post => (
                <div key={post.id} className="post-card">
                  <div className="post-info">
                    <div className="post-message">
                      {(post.message || post.story || '(Không có nội dung)').slice(0, 120)}
                      {(post.message || post.story || '').length > 120 ? '...' : ''}
                    </div>
                    <div className="post-meta">
                      <span className="post-page">{post.page_name}</span>
                      {post.created_time && (
                        <span className="post-time">
                          {new Date(post.created_time).toLocaleString('vi-VN')}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="btn-create-ad"
                    onClick={() => handleCreateAd(post)}
                    disabled={creatingAd === post.id}
                  >
                    {creatingAd === post.id ? '⏳ Đang tạo...' : 'Tạo ads'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* E. History section */}
        <div className="section-card">
          <div className="section-header" style={{ cursor: 'pointer' }} onClick={toggleHistory}>
            <div className="section-title">📋 Lịch sử tạo ads</div>
            <span className="toggle-arrow">{historyOpen ? '▲' : '▼'}</span>
          </div>
          {historyOpen && (
            loadingHistory ? (
              <div className="loading-text">Đang tải lịch sử...</div>
            ) : history.length === 0 ? (
              <div className="empty-pages" style={{ padding: '20px 0' }}>
                <div style={{ fontSize: 12, color: 'var(--mut)' }}>Chưa có lịch sử tạo ads</div>
              </div>
            ) : (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Nội dung bài</th>
                    <th>Campaign ID</th>
                    <th>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i}>
                      <td className="hist-msg">{(h.post_message || '').slice(0, 60)}</td>
                      <td className="hist-campaign">{h.campaign_id}</td>
                      <td className="hist-time">
                        {h.created_at ? new Date(h.created_at).toLocaleString('vi-VN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>

        {/* Add Page Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false) }}>
            <div className="modal-box">
              <div className="modal-title">Thêm Facebook Page</div>

              <div className="form-row">
                <label>Chọn Facebook Page</label>
                {loadingMyPages ? (
                  <div className="loading-text">Đang tải pages...</div>
                ) : (
                  <select className="inp" value={addForm.page_id} onChange={handlePageSelect}>
                    <option value="">-- Chọn page --</option>
                    {myFbPages.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-row">
                <label>Tài khoản quảng cáo</label>
                <select
                  className="inp"
                  value={addForm.ad_account_id || config.default_account || ''}
                  onChange={e => setAddForm(prev => ({ ...prev, ad_account_id: e.target.value }))}
                >
                  <option value="">-- Dùng mặc định --</option>
                  {adAccounts.map(a => (
                    <option key={a.account_id} value={a.account_id}>
                      {a.account_name || a.account_id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label>Hashtag lọc</label>
                <input
                  type="text"
                  className="inp"
                  placeholder="Để trống = lấy tất cả bài"
                  value={addForm.hashtag}
                  onChange={e => setAddForm(prev => ({ ...prev, hashtag: e.target.value }))}
                />
              </div>

              <div className="form-row">
                <label>Ngân sách/ngày (VND)</label>
                <input
                  type="number"
                  className="inp"
                  min="10000"
                  step="10000"
                  value={addForm.daily_budget}
                  onChange={e => setAddForm(prev => ({ ...prev, daily_budget: e.target.value }))}
                />
              </div>

              <div className="form-row">
                <label>Mục tiêu chiến dịch</label>
                <select
                  className="inp"
                  value={addForm.objective}
                  onChange={e => setAddForm(prev => ({ ...prev, objective: e.target.value }))}
                >
                  {OBJECTIVES.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="modal-btns">
                <button className="btn-cancel" onClick={() => setShowAddModal(false)}>Huỷ</button>
                <button className="btn-save-modal" onClick={handleAddPage} disabled={savingPage}>
                  {savingPage ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      <style jsx>{`
        .as-page { padding: 24px; max-width: 860px; position: relative; }

        .as-toast {
          position: fixed; top: 16px; right: 16px; z-index: 9999;
          max-width: 260px; padding: 9px 14px; border-radius: 8px;
          background: #10b981; color: #fff; font-size: 12px; font-weight: 600;
          line-height: 1.4; box-shadow: 0 3px 12px rgba(0,0,0,.18);
          animation: fadeIn .2s ease; pointer-events: none;
        }
        .as-toast.error { background: #ef4444; }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }

        /* Header */
        .page-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 16px; }
        .ph-left { display: flex; align-items: flex-start; gap: 14px; }
        .ph-icon { font-size: 32px; flex-shrink: 0; }
        h1 { font-size: 18px; font-weight: 700; color: var(--txt); margin-bottom: 4px; }
        p { font-size: 13px; color: var(--mut); line-height: 1.6; max-width: 560px; }

        /* Status banner */
        .status-banner {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px; border-radius: 12px; margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .status-banner.not-configured { background: rgba(254,95,1,.08); border: 1px solid rgba(254,95,1,.3); }
        .status-banner.configured { background: rgba(16,185,129,.08); border: 1px solid rgba(16,185,129,.3); }
        .status-dot {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
        }
        .not-configured .status-dot { background: #fe5f01; }
        .configured .status-dot { background: var(--grn); }
        .status-text { flex: 1; font-size: 13px; color: var(--txt); }
        .btn-scan {
          background: var(--primary); color: #fff; border: none;
          border-radius: 9px; padding: 8px 16px; font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: inherit; transition: opacity .15s; flex-shrink: 0;
        }
        .btn-scan:hover:not(:disabled) { opacity: .88; }
        .btn-scan:disabled { opacity: .45; cursor: not-allowed; }

        /* Section card */
        .section-card {
          background: var(--s1); border: 1px solid var(--bd); border-radius: 14px;
          padding: 18px 20px; margin-bottom: 16px;
        }
        .section-title { font-size: 14px; font-weight: 700; color: var(--txt); margin-bottom: 4px; }
        .section-desc { font-size: 12px; color: var(--mut); margin-bottom: 12px; }
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }

        /* Account row */
        .account-row { display: flex; gap: 10px; align-items: center; }
        .account-row .inp { flex: 1; }
        .btn-save-acc {
          background: var(--primary); color: #fff; border: none;
          border-radius: 9px; padding: 9px 18px; font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: inherit; white-space: nowrap; flex-shrink: 0;
        }
        .btn-save-acc:disabled { opacity: .5; cursor: not-allowed; }

        .inp {
          width: 100%; background: var(--s2); border: 1.5px solid var(--bd); border-radius: 9px;
          padding: 9px 12px; font-size: 14px; color: var(--txt); outline: none; font-family: inherit;
          transition: border-color .15s;
        }
        .inp:focus { border-color: var(--primary); }

        /* Add page button */
        .btn-add-page {
          background: var(--primary); color: #fff; border: none;
          border-radius: 9px; padding: 8px 16px; font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: inherit;
        }
        .btn-add-page:disabled { opacity: .4; cursor: not-allowed; }

        /* Pages list */
        .pages-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
        .page-card {
          display: flex; align-items: center; justify-content: space-between;
          background: var(--s2); border: 1px solid var(--bd); border-radius: 10px;
          padding: 10px 14px; gap: 12px;
        }
        .page-info { flex: 1; min-width: 0; }
        .page-name { font-size: 13px; font-weight: 700; color: var(--txt); margin-bottom: 4px; }
        .page-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .hashtag-badge {
          background: rgba(254,95,1,.12); color: var(--primary);
          border-radius: 20px; padding: 2px 8px; font-size: 11px; font-weight: 600;
        }
        .budget-text { font-size: 12px; color: var(--mut); }
        .obj-text { font-size: 12px; color: var(--mut); }
        .btn-remove {
          background: transparent; border: 1px solid var(--red); color: var(--red);
          border-radius: 7px; padding: 5px 12px; font-size: 12px; cursor: pointer;
          font-family: inherit; white-space: nowrap; flex-shrink: 0;
        }
        .btn-remove:hover { background: rgba(239,68,68,.08); }

        .empty-pages {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          padding: 28px 16px; text-align: center; color: var(--txt); margin-bottom: 12px;
        }

        .plan-hint { font-size: 12px; color: var(--mut); margin-top: 8px; }

        /* Scan results / posts */
        .posts-list { display: flex; flex-direction: column; gap: 8px; }
        .post-card {
          display: flex; align-items: center; justify-content: space-between;
          background: var(--s2); border: 1px solid var(--bd); border-radius: 10px;
          padding: 12px 14px; gap: 12px;
        }
        .post-info { flex: 1; min-width: 0; }
        .post-message { font-size: 13px; color: var(--txt); line-height: 1.5; margin-bottom: 4px; word-break: break-word; }
        .post-meta { display: flex; gap: 10px; align-items: center; }
        .post-page { font-size: 11px; font-weight: 700; color: var(--primary); }
        .post-time { font-size: 11px; color: var(--mut); }
        .btn-create-ad {
          background: var(--primary); color: #fff; border: none;
          border-radius: 9px; padding: 7px 14px; font-size: 12px; font-weight: 700;
          cursor: pointer; font-family: inherit; white-space: nowrap; flex-shrink: 0;
        }
        .btn-create-ad:disabled { opacity: .5; cursor: not-allowed; }

        .btn-select-all {
          background: transparent; border: 1px solid var(--bd); color: var(--txt);
          border-radius: 8px; padding: 6px 12px; font-size: 12px; cursor: pointer;
          font-family: inherit;
        }

        /* History */
        .toggle-arrow { font-size: 12px; color: var(--mut); }
        .history-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .history-table th { background: var(--s2); padding: 6px 10px; text-align: left; color: var(--mut); font-size: 11px; text-transform: uppercase; letter-spacing: .4px; }
        .history-table td { padding: 8px 10px; border-bottom: 1px solid var(--bd); color: var(--txt); }
        .hist-msg { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .hist-campaign { font-family: monospace; font-size: 11px; color: var(--mut); }
        .hist-time { white-space: nowrap; color: var(--mut); }

        .loading-text { font-size: 13px; color: var(--mut); padding: 12px 0; }

        /* Modal */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 1000;
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .modal-box {
          background: var(--s1); border-radius: 16px; padding: 24px;
          width: 100%; max-width: 460px; box-shadow: 0 20px 60px rgba(0,0,0,.3);
        }
        .modal-title { font-size: 16px; font-weight: 700; color: var(--txt); margin-bottom: 18px; }
        .form-row { margin-bottom: 14px; }
        .form-row label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: var(--mut); margin-bottom: 6px; }
        .modal-btns { display: flex; gap: 10px; justify-content: flex-end; margin-top: 6px; }
        .btn-cancel {
          background: transparent; border: 1px solid var(--bd); color: var(--mut);
          border-radius: 9px; padding: 9px 18px; font-size: 13px; cursor: pointer; font-family: inherit;
        }
        .btn-save-modal {
          background: var(--primary); color: #fff; border: none;
          border-radius: 9px; padding: 9px 20px; font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: inherit;
        }
        .btn-save-modal:disabled { opacity: .5; cursor: not-allowed; }
      `}</style>
    </DashboardLayout>
  )
}
