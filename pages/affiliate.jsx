import { useState } from 'react'
import Head from 'next/head'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Reveal from '../components/Reveal'
import { useLang } from '../lib/LangContext'

const API_AFFILIATE = 'https://go-meta-ads-backend.vercel.app/api/affiliate'

// ─── COMMISSION CARDS ─────────────────────────────────────────────────────────
const COMMISSION_CARDS_VI = [
  { pct: '5%', label: 'Gói Cá nhân', sub: 'Tháng đầu tiên', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { pct: '7%', label: 'Gói Doanh nghiệp', sub: 'Tháng đầu tiên', color: '#0c2a72', bg: '#f0f4ff', border: '#c7d7ff' },
  { pct: '9%', label: 'Gói Agency', sub: 'Tháng đầu tiên', color: '#fe5f01', bg: '#fff5f0', border: '#fed7aa' },
  { pct: '3%', label: 'Gia hạn', sub: 'Mỗi lần gia hạn', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
]

const COMMISSION_CARDS_EN = [
  { pct: '5%', label: 'Personal Plan', sub: 'First month', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { pct: '7%', label: 'Business Plan', sub: 'First month', color: '#0c2a72', bg: '#f0f4ff', border: '#c7d7ff' },
  { pct: '9%', label: 'Agency Plan', sub: 'First month', color: '#fe5f01', bg: '#fff5f0', border: '#fed7aa' },
  { pct: '3%', label: 'Renewal', sub: 'Each renewal', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
]

// ─── HOW IT WORKS STEPS ───────────────────────────────────────────────────────
const HOW_STEPS_VI = [
  { num: '01', icon: '📋', title: 'Đăng ký affiliate', desc: 'Điền form bên dưới với key đã mua và thông tin ngân hàng để nhận hoa hồng.' },
  { num: '02', icon: '🔗', title: 'Nhận link riêng', desc: 'Hệ thống cấp mã & link cá nhân — VD: adsmeta.gonetwork.vn?ref=ABC123' },
  { num: '03', icon: '🛒', title: 'Khách mua qua link', desc: 'Cookie tracking 30 ngày — khách click link rồi mua bất kỳ lúc nào đều tính hoa hồng.' },
  { num: '04', icon: '💸', title: 'Nhận tiền hàng tháng', desc: 'Hoa hồng tổng hợp và chuyển khoản ngân hàng theo tháng — tự động, không cần nhắc.' },
]

const HOW_STEPS_EN = [
  { num: '01', icon: '📋', title: 'Register as affiliate', desc: 'Fill in the form below with your purchased key and bank details to receive commissions.' },
  { num: '02', icon: '🔗', title: 'Get your personal link', desc: 'The system generates your code & personal link — e.g. adsmeta.gonetwork.vn?ref=ABC123' },
  { num: '03', icon: '🛒', title: 'Customer buys via your link', desc: '30-day cookie tracking — any purchase after clicking your link counts as commission.' },
  { num: '04', icon: '💸', title: 'Receive monthly payments', desc: 'Commission is summarized and bank-transferred monthly — automatic, no chasing needed.' },
]

// ─── REGISTER FORM ────────────────────────────────────────────────────────────
function RegisterForm({ isEN }) {
  const [form, setForm] = useState({
    key: '', name: '', phone: '', email: '',
    bank_name: '', bank_account: '', bank_owner: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')

  const set = field => e =>
    setForm(prev => ({ ...prev, [field]: field === 'key' ? e.target.value.toUpperCase() : e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(null)
    setError('')
    try {
      const res = await fetch(API_AFFILIATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', ...form }),
      })
      const data = await res.json()
      if (data.ok) {
        setSuccess(data)
        setForm({ key: '', name: '', phone: '', email: '', bank_name: '', bank_account: '', bank_owner: '' })
      } else {
        setError(data.error || (isEN
          ? 'Registration failed. Please check your key and information.'
          : 'Đăng ký thất bại. Kiểm tra lại key và thông tin.'))
      }
    } catch {
      setError(isEN
        ? 'Cannot connect to server. Please try again later.'
        : 'Không thể kết nối máy chủ. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section" style={{ background: '#fff' }} id="register">
      <div className="container">
        <Reveal>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <div className="card" style={{ padding: 'clamp(28px,4vw,44px)' }}>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ color: '#0c2a72', fontWeight: 900, fontSize: 24, margin: '0 0 10px' }}>
                  📋 {isEN ? 'Register as Affiliate' : 'Đăng ký Affiliate'}
                </h2>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
                  borderRadius: 8, padding: '7px 14px', fontSize: 13, color: '#78350f',
                }}>
                  <span>⚠️</span>
                  <span>
                    {isEN
                      ? 'Only paid users are eligible to register as affiliates'
                      : 'Chỉ user đã trả phí mới được đăng ký affiliate'}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Personal info section */}
                <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
                  {isEN ? 'Personal Information' : 'Thông tin cá nhân'}
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: '#0c2a72' }}>
                    {isEN ? 'Your Key' : 'Key của bạn'} <span style={{ color: '#fe5f01' }}>*</span>
                  </label>
                  <input className="form-input" type="text" placeholder="GMAP-XXXX-XXXX-XXXX" value={form.key} onChange={set('key')} required style={{ color: '#1a2332' }} />
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                    {isEN
                      ? 'Admin key you purchased — used to verify affiliate eligibility'
                      : 'Key admin đã mua — dùng để xác minh tư cách affiliate'}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: '#0c2a72' }}>
                    {isEN ? 'Full Name' : 'Họ và tên'} <span style={{ color: '#fe5f01' }}>*</span>
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder={isEN ? 'John Doe' : 'Nguyễn Văn A'}
                    value={form.name}
                    onChange={set('name')}
                    required
                    style={{ color: '#1a2332' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="two-col">
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#0c2a72' }}>
                      {isEN ? 'Phone Number' : 'Số điện thoại'} <span style={{ color: '#fe5f01' }}>*</span>
                    </label>
                    <input
                      className="form-input"
                      type="tel"
                      placeholder="0901234567"
                      value={form.phone}
                      onChange={set('phone')}
                      required
                      style={{ color: '#1a2332' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#0c2a72' }}>Email</label>
                    <input
                      className="form-input"
                      type="email"
                      placeholder={isEN ? 'name@email.com' : 'ten@email.com'}
                      value={form.email}
                      onChange={set('email')}
                      style={{ color: '#1a2332' }}
                    />
                  </div>
                </div>

                {/* Bank info section */}
                <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: 8, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
                  {isEN ? 'Bank Details for Receiving Commission' : 'Thông tin ngân hàng nhận tiền'}
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: '#0c2a72' }}>{isEN ? 'Bank Name' : 'Tên ngân hàng'}</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder={isEN ? 'e.g. Vietcombank, MB Bank, Techcombank...' : 'VD: Vietcombank, MB Bank, Techcombank...'}
                    value={form.bank_name}
                    onChange={set('bank_name')}
                    style={{ color: '#1a2332' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="two-col">
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#0c2a72' }}>
                      {isEN ? 'Account Number' : 'Số tài khoản'} <span style={{ color: '#fe5f01' }}>*</span>
                    </label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="0123456789"
                      value={form.bank_account}
                      onChange={set('bank_account')}
                      required
                      style={{ color: '#1a2332' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#0c2a72' }}>
                      {isEN ? 'Account Holder Name' : 'Tên chủ tài khoản'} <span style={{ color: '#fe5f01' }}>*</span>
                    </label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder={isEN ? 'JOHN DOE' : 'NGUYEN VAN A'}
                      value={form.bank_owner}
                      onChange={set('bank_owner')}
                      required
                      style={{ color: '#1a2332' }}
                    />
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                      {isEN ? 'UPPERCASE without accents' : 'Viết IN HOA không dấu'}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-navy btn-block"
                  style={{ fontFamily: 'inherit', fontSize: 16, padding: '14px', marginTop: 8, opacity: loading ? 0.7 : 1 }}
                >
                  {loading
                    ? <><span className="spinner" />{isEN ? 'Registering...' : 'Đang đăng ký...'}</>
                    : (isEN ? '🚀 Register as Affiliate →' : '🚀 Đăng ký Affiliate →')}
                </button>
              </form>

              {error && (
                <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>
              )}

              {success && (
                <div style={{
                  marginTop: 24, background: 'rgba(16,185,129,0.06)',
                  border: '1.5px solid rgba(16,185,129,0.25)',
                  borderRadius: 'var(--radius)', padding: 28, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>🎉</div>
                  <div style={{ fontWeight: 900, color: '#059669', fontSize: 18, marginBottom: 8 }}>
                    {isEN ? 'Registration successful!' : 'Đăng ký thành công!'}
                  </div>
                  <div style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>
                    {isEN ? 'Your affiliate code:' : 'Mã affiliate của bạn:'}
                  </div>
                  <div style={{
                    fontFamily: 'monospace', fontWeight: 900, fontSize: 26,
                    color: '#0c2a72', background: 'rgba(12,42,114,0.08)',
                    padding: '12px 28px', borderRadius: 10,
                    display: 'inline-block', letterSpacing: '3px',
                    border: '1px solid rgba(12,42,114,0.15)',
                  }}>
                    {success.referral_code || 'N/A'}
                  </div>
                  <div style={{ color: '#64748b', fontSize: 13, marginTop: 14 }}>
                    {isEN ? 'Your link:' : 'Link của bạn:'}{' '}
                    <strong style={{ color: '#0c2a72' }}>
                      adsmeta.gonetwork.vn?ref={success.referral_code}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ─── LOOKUP COMMISSION ────────────────────────────────────────────────────────
function LookupCommission({ isEN }) {
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const res = await fetch(API_AFFILIATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'lookup', key: key.trim().toUpperCase() }),
      })
      const data = await res.json()
      if (data.ok) {
        setResult(data)
      } else {
        setError(data.error || (isEN
          ? 'No affiliate account found for this key.'
          : 'Không tìm thấy tài khoản affiliate với key này.'))
      }
    } catch {
      setError(isEN
        ? 'Cannot connect to server. Please try again later.'
        : 'Không thể kết nối máy chủ. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section style={{ background: 'var(--gray)', padding: '80px 0' }} id="dashboard">
      <div className="container">
        <Reveal>
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div className="badge badge-navy" style={{ marginBottom: 16 }}>
                📊 {isEN ? 'Commission Lookup' : 'Tra cứu hoa hồng'}
              </div>
              <h2 style={{ margin: 0 }}>
                {isEN ? 'Check your commission' : 'Kiểm tra hoa hồng của bạn'}
              </h2>
            </div>

            <div className="card" style={{ padding: 'clamp(24px,4vw,36px)' }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12 }}>
                <input
                  className="form-input"
                  type="text"
                  placeholder={isEN ? 'Enter your key...' : 'Nhập key của bạn...'}
                  value={key}
                  onChange={e => setKey(e.target.value.toUpperCase())}
                  required
                  style={{ flex: 1 }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-navy"
                  style={{ fontFamily: 'inherit', whiteSpace: 'nowrap', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? '...' : (isEN ? 'Look up →' : 'Tra cứu →')}
                </button>
              </form>

              {error && (
                <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>
              )}

              {result && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }} className="lookup-grid">
                    <div style={{
                      background: 'rgba(12,42,114,0.08)', borderRadius: 10, padding: '18px 20px',
                      border: '1px solid rgba(12,42,114,0.12)',
                    }}>
                      <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        {isEN ? 'Affiliate Code' : 'Mã Affiliate'}
                      </div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 18, color: 'var(--navy)' }}>
                        {result.referral_code || '—'}
                      </div>
                    </div>
                    <div style={{
                      background: 'rgba(16,185,129,0.08)', borderRadius: 10, padding: '18px 20px',
                      border: '1px solid rgba(16,185,129,0.2)',
                    }}>
                      <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        {isEN ? 'Total Commission' : 'Tổng hoa hồng'}
                      </div>
                      <div style={{ fontWeight: 900, fontSize: 18, color: '#16a34a' }}>
                        {result.total_earned != null
                          ? Number(result.total_earned).toLocaleString('vi-VN') + 'đ'
                          : '—'}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: 'var(--gray)', borderRadius: 10, padding: '14px 18px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    border: '1px solid var(--gray2)',
                  }}>
                    <span style={{ color: '#64748b', fontSize: 14 }}>
                      {isEN ? 'Account status' : 'Trạng thái tài khoản'}
                    </span>
                    <span style={{
                      background: result.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
                      color: result.status === 'active' ? '#059669' : '#dc2626',
                      fontWeight: 700, fontSize: 13, padding: '4px 14px',
                      borderRadius: 'var(--radius-full)',
                      border: result.status === 'active' ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(239,68,68,0.25)',
                    }}>
                      {result.status === 'active'
                        ? (isEN ? '✓ Active' : '✓ Đang hoạt động')
                        : (isEN ? '✕ Inactive' : '✕ Không hoạt động')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function Affiliate() {
  const { lang } = useLang()
  const isEN = lang === 'en'

  const COMMISSION_CARDS = isEN ? COMMISSION_CARDS_EN : COMMISSION_CARDS_VI
  const HOW_STEPS = isEN ? HOW_STEPS_EN : HOW_STEPS_VI

  return (
    <>
      <Head>
        <title>{isEN
          ? 'Affiliate — Go Meta Ads Pro | Earn Referral Commission'
          : 'Affiliate — Go Meta Ads Pro | Kiếm hoa hồng giới thiệu'}</title>
        <meta name="description" content={isEN
          ? 'Join the Go Meta Ads Pro affiliate program — earn up to 9% commission each time you refer a customer.'
          : 'Tham gia chương trình affiliate Go Meta Ads Pro — nhận hoa hồng đến 9% mỗi lần giới thiệu khách mua gói.'
        } />
      </Head>
      <Navbar />

      {/* ─── HERO ─── */}
      <section style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, #0e1e50 55%, #1a0a00 100%)',
        paddingTop: 'calc(var(--header-h) + 20px)',
        paddingBottom: 80,
        color: '#fff', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 340, height: 340, borderRadius: '50%', background: 'rgba(254,95,1,0.1)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        <div className="container" style={{ maxWidth: 780, position: 'relative' }}>
          <div className="badge badge-white" style={{ marginBottom: 24, background: 'rgba(254,95,1,0.15)', borderColor: 'rgba(254,95,1,0.3)', color: '#ffb380' }}>
            🤝 {isEN ? 'Affiliate Program' : 'Chương trình Affiliate'}
          </div>

          <h1 style={{ margin: '0 0 20px', fontSize: 'clamp(28px,5vw,48px)', lineHeight: 1.2 }}>
            {isEN ? 'Refer — Earn automatic commission' : 'Giới thiệu — Nhận hoa hồng tự động'}
          </h1>

          <p style={{ fontSize: 'clamp(15px,2.5vw,18px)', opacity: 0.85, lineHeight: 1.8, maxWidth: 620, margin: '0 auto 40px' }}>
            {isEN ? (
              <>Already using Go Meta Ads Pro? Share your link with colleagues &amp; friends.
                Every time they purchase a key, you earn commission up to{' '}
                <strong style={{ color: '#fbbf24' }}>9% first month</strong> +{' '}
                <strong style={{ color: '#fbbf24' }}>3% each renewal</strong>.</>
            ) : (
              <>Đã dùng Go Meta Ads Pro? Chia link cho đồng nghiệp &amp; bạn bè.
                Mỗi khi họ mua key, bạn nhận hoa hồng đến{' '}
                <strong style={{ color: '#fbbf24' }}>9% tháng đầu</strong> +{' '}
                <strong style={{ color: '#fbbf24' }}>3% mỗi lần gia hạn</strong>.</>
            )}
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#register" className="btn btn-primary btn-lg" style={{ fontFamily: 'inherit' }}>
              {isEN ? 'Register now →' : 'Đăng ký ngay →'}
            </a>
            <a href="#dashboard" className="btn btn-glass btn-lg" style={{ fontFamily: 'inherit' }}>
              {isEN ? 'Check commission' : 'Tra cứu hoa hồng'}
            </a>
          </div>

          {/* Quick stats */}
          <div style={{
            display: 'flex', marginTop: 56,
            background: 'rgba(255,255,255,0.07)',
            borderRadius: 'var(--radius)', border: '1px solid rgba(255,255,255,0.12)',
            overflow: 'hidden', maxWidth: 540, marginLeft: 'auto', marginRight: 'auto',
          }}>
            {[
              { val: isEN ? 'up to 9%' : 'đến 9%', label: isEN ? 'First month commission' : 'Hoa hồng tháng đầu' },
              { val: '3%', label: isEN ? 'Renewal commission' : 'Hoa hồng gia hạn' },
              { val: isEN ? '30 days' : '30 ngày', label: isEN ? 'Cookie tracking' : 'Cookie tracking' },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, padding: '20px 14px', textAlign: 'center',
                borderRight: i < 2 ? '1px solid rgba(255,255,255,0.12)' : 'none',
              }}>
                <div style={{ fontWeight: 900, fontSize: 22, color: '#fbbf24' }}>{s.val}</div>
                <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMMISSION CARDS ─── */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="container">
          <Reveal>
            <div className="section-header">
              <div className="badge" style={{ color: '#0c2a72', background: 'rgba(12,42,114,0.08)', border: '1px solid rgba(12,42,114,0.15)' }}>💰 {isEN ? 'Commission Rates' : 'Tỉ lệ hoa hồng'}</div>
              <h2 style={{ color: '#0c2a72' }}>{isEN ? 'Attractive commissions, automatic payouts' : 'Hoa hồng hấp dẫn, tự động thanh toán'}</h2>
              <p style={{ color: '#64748b' }}>{isEN
                ? 'Commission calculated per plan purchased — paid monthly via bank transfer.'
                : 'Hoa hồng tính theo từng gói khách mua — thanh toán hàng tháng qua chuyển khoản ngân hàng.'}</p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }} className="commission-grid">
            {COMMISSION_CARDS.map((c, i) => (
              <Reveal key={c.label} delay={i * 80}>
                <div style={{
                  background: c.bg, borderRadius: 'var(--radius-lg)',
                  padding: '32px 20px', textAlign: 'center',
                  border: `1px solid ${c.border}`,
                  transition: 'var(--transition)',
                }}
                  className="commission-card"
                >
                  <div style={{
                    fontSize: 48, fontWeight: 900, color: c.color,
                    lineHeight: 1, marginBottom: 14,
                  }}>{c.pct}</div>
                  <div style={{ fontWeight: 800, color: '#1a2332', fontSize: 15, marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{c.sub}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section style={{ background: 'var(--gray)', padding: '96px 0' }}>
        <div className="container">
          <Reveal>
            <div className="section-header">
              <div className="badge">⚙️ {isEN ? 'How it works' : 'Cách hoạt động'}</div>
              <h2>{isEN ? '4 simple steps' : '4 bước đơn giản'}</h2>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, position: 'relative' }} className="how-grid">
            {/* connector line desktop */}
            <div className="how-connector" style={{
              position: 'absolute', top: 36, left: '12.5%', right: '12.5%',
              height: 2, background: 'rgba(12,42,114,0.15)', zIndex: 0,
            }} />

            {HOW_STEPS.map((s, i) => (
              <Reveal key={i} delay={i * 80}>
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: '#fff', border: '2px solid rgba(12,42,114,0.15)',
                    margin: '0 auto 18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, boxShadow: 'var(--shadow)',
                  }}>{s.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--orange)', letterSpacing: '1px', marginBottom: 8 }}>
                    {isEN ? `STEP ${s.num}` : `BƯỚC ${s.num}`}
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--navy)', fontSize: 15, marginBottom: 10 }}>{s.title}</div>
                  <div style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7 }}>{s.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── REGISTER FORM ─── */}
      <RegisterForm isEN={isEN} />

      {/* ─── LOOKUP ─── */}
      <LookupCommission isEN={isEN} />

      {/* ─── BOTTOM CTA ─── */}
      <section style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy2) 100%)',
        padding: '80px 0', textAlign: 'center', color: '#fff',
      }}>
        <div className="container" style={{ maxWidth: 640 }}>
          <Reveal>
            <h2 style={{ margin: '0 0 14px' }}>
              {isEN ? 'Start earning commission today' : 'Bắt đầu kiếm hoa hồng ngay hôm nay'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 16, margin: '0 0 32px', lineHeight: 1.7 }}>
              {isEN
                ? 'Just share your link — the system handles everything else automatically'
                : 'Chỉ cần chia link — phần còn lại hệ thống tự động xử lý cho bạn'}
            </p>
            <a href="#register" className="btn btn-primary btn-lg" style={{ fontFamily: 'inherit' }}>
              {isEN ? 'Register Affiliate for free →' : 'Đăng ký Affiliate miễn phí →'}
            </a>
          </Reveal>
        </div>
      </section>

      <Footer />

      <style>{`
        .commission-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-lg); }
        @media (max-width: 900px) {
          .commission-grid { grid-template-columns: 1fr 1fr !important; }
          .how-grid { grid-template-columns: 1fr 1fr !important; }
          .how-connector { display: none !important; }
        }
        @media (max-width: 600px) {
          .commission-grid { grid-template-columns: 1fr 1fr !important; }
          .how-grid { grid-template-columns: 1fr !important; }
          .two-col { grid-template-columns: 1fr !important; }
          .lookup-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 400px) {
          .commission-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </>
  )
}
