import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../lib/AuthContext'
import { isPlanAllowed } from '../../lib/planLimits'
import Link from 'next/link'
import { Handshake, Coins, ClipboardList, Link2, Landmark, Pencil, Save, Loader2, Check, BarChart3, ClipboardX, ArrowRight } from 'lucide-react'

const SITE_URL = 'https://adsmeta.gonetwork.vn'

const STATUS_LABEL = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', rejected: 'Từ chối' }
const STATUS_COLOR = { pending: 'var(--ylw)', confirmed: 'var(--grn)', rejected: 'var(--red)' }

export default function Affiliate() {
  const { user } = useAuth()
  const [affiliate, setAffiliate] = useState(null)
  const [conversions, setConversions] = useState([])
  const [loading, setLoading] = useState(true)
  const [registerForm, setRegisterForm] = useState({ bank_name: '', bank_account: '', bank_owner: '' })
  const [registering, setRegistering] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copied, setCopied] = useState(false)

  const plan = user?.plan || 'trial'
  const canAffiliate = isPlanAllowed(plan, 'affiliate')

  useEffect(() => {
    if (canAffiliate) loadData()
    else setLoading(false)
  }, [canAffiliate])

  async function loadData() {
    setLoading(true)
    try {
      const r = await fetch('/api/user/affiliate?action=info')
      const d = await r.json()
      if (d.ok) {
        setAffiliate(d.affiliate)
        setConversions(d.conversions || [])
      }
    } catch {}
    finally { setLoading(false) }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setError(''); setRegistering(true)
    try {
      const r = await fetch('/api/user/affiliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', ...registerForm }),
      })
      const d = await r.json()
      if (!d.ok) { setError(d.error); return }
      setAffiliate(d.affiliate)
      setSuccess('Đăng ký affiliate thành công!')
    } catch { setError('Lỗi kết nối') }
    finally { setRegistering(false) }
  }

  async function handleSaveBank(e) {
    e.preventDefault()
    setError(''); setSaving(true)
    try {
      const r = await fetch('/api/user/affiliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_bank', ...registerForm }),
      })
      const d = await r.json()
      if (!d.ok) { setError(d.error); return }
      setSuccess('Đã cập nhật thông tin ngân hàng!')
      setEditing(false)
      loadData()
    } catch { setError('Lỗi kết nối') }
    finally { setSaving(false) }
  }

  function copyLink() {
    const link = `${SITE_URL}/register?ref=${affiliate.referral_code}`
    navigator.clipboard?.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!canAffiliate) {
    return (
      <DashboardLayout title="Affiliate">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: 40 }}>
          <Handshake size={56} style={{ color: 'var(--blue)', marginBottom: 16 }} aria-hidden="true" />
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Tham gia chương trình Affiliate</h2>
          <p style={{ color: 'var(--mut)', marginBottom: 24, maxWidth: 440, lineHeight: 1.7 }}>
            Kiếm hoa hồng khi giới thiệu bạn bè đăng ký Go Meta Ads Pro.<br />
            Yêu cầu gói <strong>Personal</strong> trở lên để tham gia.
          </p>
          <Link href="/mua-goi" style={{ background: 'var(--primary)', color: '#fff', padding: '12px 28px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Nâng cấp ngay <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Affiliate">
      <div className="aff-page" role="main" aria-label="Chương trình Affiliate">

        <div className="page-header">
          <Handshake size={28} className="ph-icon" aria-hidden="true" />
          <div>
            <h1>Chương trình Affiliate</h1>
            <p>Giới thiệu bạn bè — kiếm hoa hồng lên đến 15%</p>
          </div>
        </div>

        {/* Commission rates */}
        <div className="rates-card" role="region" aria-label="Tỷ lệ hoa hồng">
          <div className="rates-title"><Coins size={14} style={{ marginRight: 6, verticalAlign: '-2px' }} aria-hidden="true" /> Tỷ lệ hoa hồng</div>
          <div className="rates-grid">
            {[
              { plan: 'Personal', new: '10%', renewal: '3%' },
              { plan: 'Business', new: '12%', renewal: '3%' },
              { plan: 'Agency',   new: '15%', renewal: '3%' },
            ].map(r => (
              <div key={r.plan} className="rate-item">
                <div className="rate-plan">{r.plan}</div>
                <div className="rate-row"><span>Đăng ký mới</span><strong>{r.new}</strong></div>
                <div className="rate-row"><span>Gia hạn</span><strong>{r.renewal}</strong></div>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-text" role="status" aria-live="polite"><Loader2 size={18} className="spin-icon" aria-hidden="true" /> Đang tải...</div>
        ) : !affiliate ? (
          /* Register form */
          <div className="card" role="region" aria-label="Đăng ký Affiliate">
            <div className="card-title"><ClipboardList size={14} style={{ marginRight: 6, verticalAlign: '-2px' }} aria-hidden="true" /> Đăng ký tham gia Affiliate</div>
            {error   && <div className="msg-err" role="alert">{error}</div>}
            {success && <div className="msg-ok" role="status">{success}</div>}
            <form onSubmit={handleRegister} aria-label="Form đăng ký affiliate">
              <div className="form-row">
                <div className="field">
                  <label htmlFor="aff-bank-name">Tên ngân hàng <span className="req" aria-hidden="true">*</span></label>
                  <input id="aff-bank-name" type="text" placeholder="VD: Vietcombank, MB Bank..." required
                    value={registerForm.bank_name}
                    onChange={e => setRegisterForm(f => ({...f, bank_name: e.target.value}))} />
                </div>
                <div className="field">
                  <label htmlFor="aff-bank-account">Số tài khoản <span className="req" aria-hidden="true">*</span></label>
                  <input id="aff-bank-account" type="text" placeholder="Số tài khoản ngân hàng" required
                    value={registerForm.bank_account}
                    onChange={e => setRegisterForm(f => ({...f, bank_account: e.target.value}))} />
                </div>
                <div className="field">
                  <label htmlFor="aff-bank-owner">Tên chủ tài khoản <span className="req" aria-hidden="true">*</span></label>
                  <input id="aff-bank-owner" type="text" placeholder="NGUYEN VAN A" required
                    value={registerForm.bank_owner}
                    onChange={e => setRegisterForm(f => ({...f, bank_owner: e.target.value.toUpperCase()}))} />
                </div>
              </div>
              <button type="submit" className="submit-btn" disabled={registering} aria-busy={registering}>
                {registering ? <><Loader2 size={14} className="spin-icon" aria-hidden="true" /> Đang đăng ký...</> : <><Handshake size={14} aria-hidden="true" /> Đăng ký Affiliate</>}
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="stats-grid" role="region" aria-label="Thống kê hoa hồng">
              {[
                { label: 'Chờ xác nhận', value: (affiliate.pending_earned || 0).toLocaleString('vi-VN') + 'đ', color: 'var(--ylw)' },
                { label: 'Đã nhận', value: (affiliate.total_earned || 0).toLocaleString('vi-VN') + 'đ', color: 'var(--grn)' },
                { label: 'Tổng conversions', value: conversions.length, color: 'var(--blue)' },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Referral link */}
            <div className="card" role="region" aria-label="Link giới thiệu">
              <div className="card-title"><Link2 size={14} style={{ marginRight: 6, verticalAlign: '-2px' }} aria-hidden="true" /> Link giới thiệu của bạn</div>
              <div className="link-row">
                <div className="link-box" aria-label="Link giới thiệu">{SITE_URL}/register?ref=<strong>{affiliate.referral_code}</strong></div>
                <button onClick={copyLink} className="copy-btn" aria-label={copied ? 'Đã copy link' : 'Copy link giới thiệu'}>
                  {copied ? <><Check size={14} aria-hidden="true" /> Đã copy</> : 'Copy link'}
                </button>
              </div>
              <p className="link-hint">Người đăng ký qua link này sẽ được ghi nhận dưới tên bạn. Cookie tồn tại 30 ngày.</p>
            </div>

            {/* Bank info */}
            <div className="card" role="region" aria-label="Thông tin ngân hàng">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div className="card-title" style={{ margin: 0 }}><Landmark size={14} style={{ marginRight: 6, verticalAlign: '-2px' }} aria-hidden="true" /> Thông tin nhận hoa hồng</div>
                <button onClick={() => { setEditing(!editing); setRegisterForm({ bank_name: affiliate.bank_name || '', bank_account: affiliate.bank_account || '', bank_owner: affiliate.bank_owner || '' }) }} className="edit-btn" aria-label={editing ? 'Huỷ chỉnh sửa' : 'Sửa thông tin ngân hàng'}>
                  {editing ? 'Huỷ' : <><Pencil size={13} aria-hidden="true" /> Sửa</>}
                </button>
              </div>
              {!editing ? (
                <div className="bank-info">
                  <div><span>Ngân hàng</span><strong>{affiliate.bank_name}</strong></div>
                  <div><span>Số TK</span><strong>{affiliate.bank_account}</strong></div>
                  <div><span>Tên TK</span><strong>{affiliate.bank_owner}</strong></div>
                </div>
              ) : (
                <form onSubmit={handleSaveBank} aria-label="Form cập nhật ngân hàng">
                  {error && <div className="msg-err" role="alert">{error}</div>}
                  <div className="form-row">
                    <div className="field">
                      <label htmlFor="edit-bank-name">Tên ngân hàng</label>
                      <input id="edit-bank-name" type="text" required value={registerForm.bank_name} onChange={e => setRegisterForm(f => ({...f, bank_name: e.target.value}))} />
                    </div>
                    <div className="field">
                      <label htmlFor="edit-bank-account">Số tài khoản</label>
                      <input id="edit-bank-account" type="text" required value={registerForm.bank_account} onChange={e => setRegisterForm(f => ({...f, bank_account: e.target.value}))} />
                    </div>
                    <div className="field">
                      <label htmlFor="edit-bank-owner">Tên chủ tài khoản</label>
                      <input id="edit-bank-owner" type="text" required value={registerForm.bank_owner} onChange={e => setRegisterForm(f => ({...f, bank_owner: e.target.value.toUpperCase()}))} />
                    </div>
                  </div>
                  <button type="submit" className="submit-btn" disabled={saving} aria-busy={saving}>{saving ? <Loader2 size={14} className="spin-icon" aria-hidden="true" /> : <><Save size={14} aria-hidden="true" /> Lưu</>}</button>
                </form>
              )}
              {success && <div className="msg-ok" role="status" style={{ marginTop: 8 }}>{success}</div>}
            </div>

            {/* Conversions table */}
            <div className="card" role="region" aria-label="Lịch sử hoa hồng">
              <div className="card-title"><BarChart3 size={14} style={{ marginRight: 6, verticalAlign: '-2px' }} aria-hidden="true" /> Lịch sử hoa hồng</div>
              {conversions.length === 0 ? (
                <div className="empty-state">
                  <ClipboardX size={32} style={{ opacity: .4, color: 'var(--mut)' }} aria-hidden="true" />
                  <div style={{ fontSize: 13, color: 'var(--mut)' }}>Chưa có conversion nào. Chia sẻ link để bắt đầu!</div>
                </div>
              ) : (
                <div className="table-wrap" tabIndex={0} role="group" aria-label="Bảng lịch sử hoa hồng">
                  <table className="conv-table">
                    <thead>
                      <tr>
                        <th scope="col">Gói</th><th scope="col">Loại</th><th scope="col">Doanh thu</th><th scope="col">Hoa hồng</th><th scope="col">Tỷ lệ</th><th scope="col">Trạng thái</th><th scope="col">Ngày</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conversions.map(c => (
                        <tr key={c.id}>
                          <td><span className="plan-badge">{c.plan}</span></td>
                          <td>{c.type === 'renewal' ? 'Gia hạn' : 'Mới'}</td>
                          <td>{(c.amount || 0).toLocaleString('vi-VN')}đ</td>
                          <td style={{ fontWeight: 700, color: STATUS_COLOR[c.status] }}>{(c.commission || 0).toLocaleString('vi-VN')}đ</td>
                          <td>{((c.rate || 0) * 100).toFixed(0)}%</td>
                          <td><span className="status-badge" style={{ color: STATUS_COLOR[c.status] }}>{STATUS_LABEL[c.status] || c.status}</span></td>
                          <td style={{ fontSize: 12, color: 'var(--mut)' }}>{new Date(c.created_at).toLocaleDateString('vi-VN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .aff-page { padding: 24px; max-width: 900px; margin: 0 auto; }
        .page-header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
        .ph-icon { color: var(--blue); }
        h1 { font-size: 18px; font-weight: 700; color: var(--txt); margin-bottom: 4px; }
        p  { font-size: 13px; color: var(--mut); }

        .rates-card { background: var(--s1); border: 1px solid var(--bd); border-radius: 14px; padding: 18px; margin-bottom: 16px; }
        .rates-title { font-size: 13px; font-weight: 700; color: var(--txt); margin-bottom: 14px; display: flex; align-items: center; }
        .rates-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
        .rate-item { background: var(--s2); border-radius: 10px; padding: 14px; }
        .rate-plan { font-size: 13px; font-weight: 800; color: var(--txt); margin-bottom: 8px; }
        .rate-row { display: flex; justify-content: space-between; font-size: 12px; color: var(--mut); margin-bottom: 4px; }
        .rate-row strong { color: var(--grn); }

        .stats-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 16px; }
        .stat-card { background: var(--s1); border: 1px solid var(--bd); border-radius: 12px; padding: 18px; text-align: center; }
        .stat-value { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
        .stat-label { font-size: 12px; color: var(--mut); font-weight: 600; }

        .card { background: var(--s1); border: 1px solid var(--bd); border-radius: 14px; padding: 18px; margin-bottom: 16px; }
        .card-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: var(--mut); margin-bottom: 14px; display: flex; align-items: center; }

        .link-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .link-box { flex: 1; background: var(--s2); border: 1px solid var(--bd); border-radius: 9px; padding: 10px 14px; font-size: 13px; color: var(--txt); word-break: break-all; }
        .copy-btn { background: var(--navy); color: #fff; border: none; border-radius: 9px; padding: 10px 16px; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; font-family: inherit; transition: opacity .15s; display: inline-flex; align-items: center; gap: 5px; }
        .copy-btn:hover { opacity: .88; }
        .link-hint { font-size: 12px; color: var(--mut); margin: 0; }

        .bank-info { display: flex; flex-direction: column; gap: 8px; }
        .bank-info > div { display: flex; gap: 16px; font-size: 14px; }
        .bank-info > div span { color: var(--mut); min-width: 100px; }
        .bank-info > div strong { color: var(--txt); }

        .edit-btn { background: var(--s2); border: 1px solid var(--bd); border-radius: 8px; padding: 6px 14px; font-size: 13px; font-weight: 600; color: var(--txt); cursor: pointer; font-family: inherit; transition: all .15s; display: inline-flex; align-items: center; gap: 5px; }
        .edit-btn:hover { border-color: var(--primary); color: var(--primary); }

        .form-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 14px; }
        .field { display: flex; flex-direction: column; gap: 5px; }
        .field label { font-size: 12px; font-weight: 600; color: var(--mut); text-transform: uppercase; letter-spacing: .4px; }
        .field input { background: var(--s2); border: 1.5px solid var(--bd); border-radius: 9px; padding: 10px 13px; font-size: 14px; color: var(--txt); outline: none; font-family: inherit; transition: border-color .15s; }
        .field input:focus-visible { border-color: var(--primary); outline: 2px solid var(--blue); outline-offset: 2px; }
        .req { color: var(--primary); }
        .submit-btn { background: var(--primary); color: #fff; border: none; border-radius: 9px; padding: 11px 24px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; transition: opacity .15s; display: inline-flex; align-items: center; gap: 6px; }
        .submit-btn:disabled { opacity: .5; cursor: not-allowed; }
        .submit-btn:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }

        .msg-err { background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.3); border-radius: 8px; padding: 9px 12px; font-size: 13px; color: var(--red); margin-bottom: 12px; }
        .msg-ok  { font-size: 13px; color: var(--grn); }

        .table-wrap { overflow-x: auto; }
        .conv-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .conv-table th { background: var(--s2); padding: 9px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: var(--mut); white-space: nowrap; }
        .conv-table td { padding: 10px 12px; border-bottom: 1px solid var(--bd); color: var(--txt); }
        .plan-badge { background: rgba(59,130,246,.12); color: var(--blue); border-radius: 6px; padding: 2px 8px; font-size: 11px; font-weight: 700; }
        .status-badge { font-weight: 700; font-size: 12px; }
        .loading-text { text-align: center; color: var(--mut); padding: 40px; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 32px 0; text-align: center; }

        .copy-btn:focus-visible,
        .edit-btn:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin-icon { animation: spin 1s linear infinite; }

        @media (max-width: 768px) {
          .aff-page { padding: 16px; }
          .rates-grid { grid-template-columns: 1fr; }
          .stats-grid { grid-template-columns: 1fr; }
          .form-row { grid-template-columns: 1fr; }
          .link-row { flex-direction: column; align-items: stretch; }
          .copy-btn { text-align: center; justify-content: center; }
          .bank-info > div { flex-direction: column; gap: 2px; }
          .bank-info > div span { min-width: unset; }
        }

        @media (prefers-reduced-motion: reduce) {
          .spin-icon { animation: none; }
          .copy-btn, .edit-btn, .submit-btn, .field input { transition: none; }
        }
      `}</style>
    </DashboardLayout>
  )
}
