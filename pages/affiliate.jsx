import { useState } from 'react'
import Head from 'next/head'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Reveal from '../components/Reveal'
import { useLang } from '../lib/LangContext'

// ─── Commission rates (updated for web SaaS) ─────────────────────────────────
const COMMISSION_VI = [
  { pct: '10%', label: 'Gói Cá nhân',     sub: 'Mỗi lần mua mới',    color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { pct: '12%', label: 'Gói Doanh nghiệp', sub: 'Mỗi lần mua mới',   color: '#0c2a72', bg: '#f0f4ff', border: '#c7d7ff' },
  { pct: '15%', label: 'Gói Agency',       sub: 'Mỗi lần mua mới',    color: '#fe5f01', bg: '#fff5f0', border: '#fed7aa' },
  { pct: '3%',  label: 'Gia hạn',          sub: 'Mỗi lần gia hạn',    color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
]
const COMMISSION_EN = [
  { pct: '10%', label: 'Personal Plan',   sub: 'Each new purchase',    color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { pct: '12%', label: 'Business Plan',   sub: 'Each new purchase',    color: '#0c2a72', bg: '#f0f4ff', border: '#c7d7ff' },
  { pct: '15%', label: 'Agency Plan',     sub: 'Each new purchase',    color: '#fe5f01', bg: '#fff5f0', border: '#fed7aa' },
  { pct: '3%',  label: 'Renewal',         sub: 'Each renewal payment', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
]

const HOW_VI = [
  { num: '01', icon: '🎯', title: 'Mua gói trả phí',         desc: 'Đăng ký tài khoản Go Meta Ads Pro và mua bất kỳ gói trả phí (Personal, Business hoặc Agency).' },
  { num: '02', icon: '🔗', title: 'Đăng ký trong Dashboard', desc: 'Vào Dashboard → Affiliate → nhập thông tin ngân hàng → nhận mã & link riêng của bạn.' },
  { num: '03', icon: '🛒', title: 'Chia link, kiếm tiền',    desc: 'Cookie tracking 30 ngày — bạn bè click link rồi mua bất kỳ lúc nào đều tính hoa hồng cho bạn.' },
  { num: '04', icon: '💸', title: 'Nhận tiền tự động',       desc: 'Hoa hồng được xác nhận hàng tháng và chuyển khoản ngân hàng — tự động, không cần nhắc.' },
]
const HOW_EN = [
  { num: '01', icon: '🎯', title: 'Purchase a paid plan',      desc: 'Register a Go Meta Ads Pro account and purchase any paid plan (Personal, Business or Agency).' },
  { num: '02', icon: '🔗', title: 'Register in Dashboard',     desc: 'Go to Dashboard → Affiliate → enter bank details → receive your personal code & link.' },
  { num: '03', icon: '🛒', title: 'Share link, earn money',    desc: '30-day cookie tracking — anyone who clicks your link and buys anytime earns you commission.' },
  { num: '04', icon: '💸', title: 'Auto monthly payout',       desc: 'Commissions are confirmed monthly and bank-transferred automatically — no chasing needed.' },
]

function LookupSection({ isEN }) {
  const [code, setCode]     = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult]  = useState(null)
  const [error, setError]    = useState('')

  async function handleLookup(e) {
    e.preventDefault()
    setLoading(true); setResult(null); setError('')
    try {
      const res = await fetch('/api/affiliate-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      })
      const data = await res.json()
      if (data.ok) setResult(data)
      else setError(data.error || (isEN ? 'Affiliate code not found.' : 'Không tìm thấy mã affiliate.'))
    } catch {
      setError(isEN ? 'Cannot connect. Please try again.' : 'Không thể kết nối. Vui lòng thử lại.')
    } finally { setLoading(false) }
  }

  return (
    <section style={{ background: 'var(--gray)', padding: '80px 0' }} id="lookup">
      <div className="container">
        <Reveal>
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div className="badge badge-navy" style={{ marginBottom: 16 }}>
                📊 {isEN ? 'Commission Lookup' : 'Tra cứu hoa hồng'}
              </div>
              <h2 style={{ margin: 0 }}>
                {isEN ? 'Check your commission balance' : 'Kiểm tra hoa hồng của bạn'}
              </h2>
              <p style={{ color: '#64748b', fontSize: 14, marginTop: 10 }}>
                {isEN ? 'Enter your affiliate referral code to see your stats.' : 'Nhập mã affiliate của bạn để xem thống kê hoa hồng.'}
              </p>
            </div>

            <div className="card" style={{ padding: 'clamp(24px,4vw,36px)' }}>
              <form onSubmit={handleLookup} style={{ display: 'flex', gap: 12 }}>
                <input
                  className="form-input"
                  type="text"
                  placeholder={isEN ? 'Enter referral code (e.g. ABC123)' : 'Nhập mã affiliate (VD: ABC123)'}
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  required
                  maxLength={10}
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

              {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}

              {result && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div style={{ background: 'rgba(12,42,114,0.08)', borderRadius: 10, padding: '18px 20px', border: '1px solid rgba(12,42,114,0.12)' }}>
                      <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>{isEN ? 'Affiliate Code' : 'Mã Affiliate'}</div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 20, color: 'var(--navy)' }}>{result.referral_code}</div>
                    </div>
                    <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: 10, padding: '18px 20px', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>{isEN ? 'Total Commission' : 'Đã nhận'}</div>
                      <div style={{ fontWeight: 900, fontSize: 18, color: '#16a34a' }}>
                        {Number(result.total_earned || 0).toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                  </div>
                  {result.pending_earned > 0 && (
                    <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: 10, padding: '14px 18px', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 12 }}>
                      <span style={{ fontSize: 13, color: '#92400e' }}>
                        ⏳ {isEN ? 'Pending payout' : 'Chờ xác nhận'}:{' '}
                        <strong>{Number(result.pending_earned).toLocaleString('vi-VN')}đ</strong>
                      </span>
                    </div>
                  )}
                  <div style={{ background: 'var(--gray)', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--gray2)' }}>
                    <span style={{ color: '#64748b', fontSize: 14 }}>{isEN ? 'Account status' : 'Trạng thái'}</span>
                    <span style={{
                      background: result.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
                      color: result.status === 'active' ? '#059669' : '#dc2626',
                      fontWeight: 700, fontSize: 13, padding: '4px 14px',
                      borderRadius: 'var(--radius-full)',
                      border: result.status === 'active' ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(239,68,68,0.25)',
                    }}>
                      {result.status === 'active' ? (isEN ? '✓ Active' : '✓ Đang hoạt động') : (isEN ? '✕ Inactive' : '✕ Không hoạt động')}
                    </span>
                  </div>
                  <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
                    {isEN ? 'For detailed stats, log in to your' : 'Để xem thống kê chi tiết, hãy đăng nhập vào'}{' '}
                    <a href="/dashboard/affiliate" style={{ color: '#0c2a72', fontWeight: 700 }}>
                      {isEN ? 'Affiliate Dashboard' : 'Dashboard Affiliate'}
                    </a>
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

export default function AffiliatePage() {
  const { lang } = useLang()
  const isEN = lang === 'en'
  const COMMISSION = isEN ? COMMISSION_EN : COMMISSION_VI
  const HOW = isEN ? HOW_EN : HOW_VI

  return (
    <>
      <Head>
        <title>{isEN ? 'Affiliate — Go Meta Ads Pro | Earn Commission' : 'Affiliate — Go Meta Ads Pro | Kiếm hoa hồng giới thiệu'}</title>
        <meta name="description" content={isEN
          ? 'Join the Go Meta Ads Pro affiliate program — earn up to 15% commission each time you refer a customer.'
          : 'Tham gia chương trình affiliate Go Meta Ads Pro — nhận hoa hồng đến 15% mỗi lần giới thiệu khách mua gói.'
        } />
      </Head>
      <Navbar />

      {/* ─── HERO ─── */}
      <section style={{
        background: 'linear-gradient(135deg, #0c2a72 0%, #1a3a8f 55%, #0e2060 100%)',
        paddingTop: 'calc(var(--header-h) + 20px)',
        paddingBottom: 80, color: '#fff', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 340, height: 340, borderRadius: '50%', background: 'rgba(254,95,1,0.12)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

        <div className="container" style={{ maxWidth: 780, position: 'relative' }}>
          <div className="badge badge-white" style={{ marginBottom: 24, background: 'rgba(254,95,1,0.15)', borderColor: 'rgba(254,95,1,0.3)', color: '#ffb380' }}>
            🤝 {isEN ? 'Affiliate Program' : 'Chương trình Affiliate'}
          </div>

          <h1 style={{ margin: '0 0 20px', fontSize: 'clamp(28px,5vw,48px)', lineHeight: 1.2 }}>
            {isEN ? 'Refer friends — Earn automatic commission' : 'Giới thiệu bạn bè — Nhận hoa hồng tự động'}
          </h1>

          <p style={{ fontSize: 'clamp(15px,2.5vw,18px)', opacity: 0.85, lineHeight: 1.8, maxWidth: 620, margin: '0 auto 40px' }}>
            {isEN ? (
              <>Already using Go Meta Ads Pro? Share your link with colleagues &amp; friends.
                Earn up to <strong style={{ color: '#fbbf24' }}>15% per new subscription</strong> +{' '}
                <strong style={{ color: '#fbbf24' }}>3% per renewal</strong>.</>
            ) : (
              <>Đang dùng Go Meta Ads Pro? Chia link cho đồng nghiệp &amp; bạn bè.
                Nhận hoa hồng đến <strong style={{ color: '#fbbf24' }}>15% mỗi gói mới</strong> +{' '}
                <strong style={{ color: '#fbbf24' }}>3% mỗi lần gia hạn</strong>.</>
            )}
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/dashboard/affiliate" className="btn btn-primary btn-lg" style={{ fontFamily: 'inherit' }}>
              {isEN ? 'Register as Affiliate →' : 'Đăng ký Affiliate →'}
            </a>
            <a href="#lookup" className="btn btn-glass btn-lg" style={{ fontFamily: 'inherit' }}>
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
              { val: isEN ? 'up to 15%' : 'đến 15%', label: isEN ? 'New subscription' : 'Gói mua mới' },
              { val: '3%', label: isEN ? 'Renewal commission' : 'Hoa hồng gia hạn' },
              { val: isEN ? '30 days' : '30 ngày', label: 'Cookie tracking' },
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
              <div className="badge" style={{ color: '#0c2a72', background: 'rgba(12,42,114,0.08)', border: '1px solid rgba(12,42,114,0.15)' }}>
                💰 {isEN ? 'Commission Rates' : 'Tỉ lệ hoa hồng'}
              </div>
              <h2 style={{ color: '#0c2a72' }}>{isEN ? 'Competitive commissions, auto payouts' : 'Hoa hồng cạnh tranh, tự động thanh toán'}</h2>
              <p style={{ color: '#64748b' }}>
                {isEN
                  ? 'Commission calculated per plan purchased — confirmed and paid monthly via bank transfer.'
                  : 'Hoa hồng tính theo từng gói khách mua — xác nhận hàng tháng và chuyển khoản ngân hàng tự động.'}
              </p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }} className="commission-grid">
            {COMMISSION.map((c, i) => (
              <Reveal key={c.label} delay={i * 80}>
                <div style={{
                  background: c.bg, borderRadius: 'var(--radius-lg)',
                  padding: '32px 20px', textAlign: 'center',
                  border: `1px solid ${c.border}`, transition: 'var(--transition)',
                }} className="commission-card">
                  <div style={{ fontSize: 48, fontWeight: 900, color: c.color, lineHeight: 1, marginBottom: 14 }}>{c.pct}</div>
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
            <div className="how-connector" style={{
              position: 'absolute', top: 36, left: '12.5%', right: '12.5%',
              height: 2, background: 'rgba(12,42,114,0.15)', zIndex: 0,
            }} />
            {HOW.map((s, i) => (
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

      {/* ─── REGISTER CTA ─── */}
      <section className="section" style={{ background: '#fff' }} id="register">
        <div className="container">
          <Reveal>
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
              <div className="card" style={{ padding: 'clamp(28px,4vw,44px)', textAlign: 'center' }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>🤝</div>
                <h2 style={{ color: '#0c2a72', fontWeight: 900, fontSize: 24, margin: '0 0 12px' }}>
                  {isEN ? 'Ready to earn commission?' : 'Sẵn sàng kiếm hoa hồng?'}
                </h2>
                <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
                  {isEN
                    ? 'Log in to your account and go to Dashboard → Affiliate to register your bank details and get your personal referral link.'
                    : 'Đăng nhập vào tài khoản, vào Dashboard → Affiliate để nhập thông tin ngân hàng và nhận link giới thiệu cá nhân của bạn.'}
                </p>

                <div style={{
                  background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
                  borderRadius: 10, padding: '12px 18px', fontSize: 13, color: '#78350f',
                  marginBottom: 28, textAlign: 'left',
                }}>
                  <strong>⚠️ {isEN ? 'Requirement' : 'Điều kiện'}:</strong>{' '}
                  {isEN
                    ? 'Only paid plan users (Personal, Business, Agency) can register as affiliates.'
                    : 'Chỉ tài khoản đã mua gói trả phí (Personal, Business, Agency) mới được đăng ký affiliate.'}
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <a href="/dashboard/affiliate" className="btn btn-navy btn-lg" style={{ fontFamily: 'inherit' }}>
                    🚀 {isEN ? 'Go to Dashboard → Affiliate' : 'Vào Dashboard → Affiliate'}
                  </a>
                  <a href="/register" className="btn btn-lg" style={{ fontFamily: 'inherit', background: 'var(--gray)', color: 'var(--navy)', border: '1px solid var(--gray2)' }}>
                    {isEN ? 'Create account first' : 'Tạo tài khoản trước'}
                  </a>
                </div>

                <div style={{ marginTop: 24, fontSize: 13, color: '#94a3b8' }}>
                  {isEN ? 'No account yet?' : 'Chưa có tài khoản?'}{' '}
                  <a href="/register" style={{ color: '#0c2a72', fontWeight: 700 }}>
                    {isEN ? 'Try free 3 days →' : 'Dùng thử 3 ngày miễn phí →'}
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── LOOKUP ─── */}
      <LookupSection isEN={isEN} />

      {/* ─── BOTTOM CTA ─── */}
      <section style={{
        background: 'linear-gradient(135deg, #0c2a72 0%, #1a3a8f 100%)',
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
            <a href="/dashboard/affiliate" className="btn btn-primary btn-lg" style={{ fontFamily: 'inherit' }}>
              {isEN ? 'Register Affiliate now →' : 'Đăng ký Affiliate ngay →'}
            </a>
          </Reveal>
        </div>
      </section>

      <Footer />

      <style>{`
        .commission-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-lg); }
        .form-input {
          border: 1.5px solid #d1d5db !important;
          background: #ffffff !important;
          color: #1a2332 !important;
        }
        .form-input:focus {
          border-color: #0c2a72 !important;
          box-shadow: 0 0 0 3px rgba(12,42,114,0.08) !important;
          outline: none;
        }
        .form-input::placeholder { color: #94a3b8 !important; }
        @media (max-width: 900px) {
          .commission-grid { grid-template-columns: 1fr 1fr !important; }
          .how-grid { grid-template-columns: 1fr 1fr !important; }
          .how-connector { display: none !important; }
        }
        @media (max-width: 600px) {
          .commission-grid { grid-template-columns: 1fr 1fr !important; }
          .how-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}
