import { useState } from 'react'
import Head from 'next/head'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Reveal from '../components/Reveal'
import { useLang } from '../lib/LangContext'

const API = 'https://go-meta-ads-backend.vercel.app/api/license'

function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-3)
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return email
  const [local, domain] = email.split('@')
  if (local.length <= 3) return '***@' + domain
  return local.slice(0, 2) + '***' + local.slice(-1) + '@' + domain
}

function StatusBadge({ status, isEN }) {
  const active = status === 'active' || status === 'Active'
  return (
    <span style={{
      display: 'inline-block',
      background: active ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
      color: active ? '#059669' : '#dc2626',
      fontWeight: 700, fontSize: 13,
      padding: '4px 14px', borderRadius: 'var(--radius-full)',
      border: active ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(239,68,68,0.25)',
    }}>
      {active
        ? (isEN ? '✓ Active' : '✓ Còn hiệu lực')
        : (isEN ? '✕ Expired / Locked' : '✕ Hết hạn / Bị khóa')}
    </span>
  )
}

// ─── SECTION 1: TÌM TÀI KHOẢN ────────────────────────────────────────────────
function LookupSection({ isEN }) {
  const [tab, setTab] = useState('key')
  const [keyVal, setKeyVal] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const body = tab === 'key'
        ? { action: 'lookup', key: keyVal.trim().toUpperCase() }
        : { action: 'lookup', phone: phone.trim(), email: email.trim() }
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.ok) {
        setResult(data)
      } else {
        setError(data.error || (isEN
          ? 'Not found — please make sure you entered the registered phone number correctly.'
          : 'Không tìm thấy — thử nhập đúng SĐT đăng ký.'))
      }
    } catch {
      setError(isEN
        ? 'Cannot connect to server. Please try again later.'
        : 'Không thể kết nối máy chủ. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  const resultLabels = isEN
    ? ['Full Name', 'Plan', 'Expiry', 'Status', 'Phone', 'Email']
    : ['Họ và tên', 'Gói sử dụng', 'Hạn sử dụng', 'Trạng thái', 'Số điện thoại', 'Email']

  const daysLeftText = (days) => isEN ? `(${days} days left)` : `(còn ${days} ngày)`

  return (
    <Reveal>
      <div className="card" style={{ padding: 'clamp(24px,4vw,40px)' }}>
        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'var(--navy)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 17, flexShrink: 0,
          }}>1</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--navy)', margin: 0 }}>
            {isEN ? 'Account Lookup' : 'Tìm tài khoản'}
          </h2>
        </div>
        <p style={{ color: 'var(--text2)', fontSize: 15, margin: '0 0 28px 56px', lineHeight: 1.6 }}>
          {isEN
            ? 'Look up your plan info, expiry date and key status.'
            : 'Tra cứu thông tin gói, hạn sử dụng và trạng thái key của bạn.'}
        </p>

        {/* Tab switcher */}
        <div style={{
          display: 'flex', background: 'var(--gray)',
          borderRadius: 12, padding: 4, gap: 4,
          marginBottom: 28, width: 'fit-content',
        }}>
          {[
            ['key', isEN ? '🔑 Enter Key' : '🔑 Nhập Key'],
            ['contact', isEN ? '📞 Phone + Email' : '📞 SĐT + Email'],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => { setTab(id); setResult(null); setError('') }}
              style={{
                padding: '10px 24px', border: 'none', cursor: 'pointer',
                borderRadius: 9, fontWeight: 700, fontSize: 14,
                fontFamily: 'inherit',
                background: tab === id ? 'var(--navy)' : 'transparent',
                color: tab === id ? '#fff' : 'var(--text2)',
                transition: 'all 0.2s',
              }}
            >{label}</button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {tab === 'key' ? (
            <div className="form-group">
              <label className="form-label">
                {isEN ? 'Your Key' : 'Key của bạn'} <span style={{ color: 'var(--orange)' }}>*</span>
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="VD: GMAP-XXXX-XXXX-XXXX"
                value={keyVal}
                onChange={e => setKeyVal(e.target.value.toUpperCase())}
                required
              />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">
                  {isEN ? 'Registered Phone Number' : 'Số điện thoại đăng ký'} <span style={{ color: 'var(--orange)' }}>*</span>
                </label>
                <input
                  className="form-input"
                  type="text"
                  placeholder={isEN ? 'e.g. 0901234567' : 'VD: 0901234567'}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  {isEN ? 'Registered Email' : 'Email đăng ký'} <span style={{ color: 'var(--orange)' }}>*</span>
                </label>
                <input
                  className="form-input"
                  type="email"
                  placeholder={isEN ? 'e.g. name@email.com' : 'VD: ten@email.com'}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-navy"
            style={{ fontFamily: 'inherit', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? (
              <><span className="spinner" />{isEN ? 'Searching...' : 'Đang tra cứu...'}</>
            ) : (isEN ? 'Check →' : 'Kiểm tra →')}
          </button>
        </form>

        {error && (
          <div className="alert alert-error" style={{ marginTop: 16 }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{
            marginTop: 24, background: 'var(--gray)',
            border: '1.5px solid rgba(12,42,114,0.12)',
            borderRadius: 'var(--radius)',
            padding: 'clamp(18px,3vw,28px)',
          }}>
            <div style={{ fontWeight: 800, color: 'var(--navy)', fontSize: 15, marginBottom: 20 }}>
              {isEN ? 'Lookup Result' : 'Kết quả tra cứu'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }} className="result-grid">
              {[
                [resultLabels[0], result.name],
                [resultLabels[1], result.plan],
                [resultLabels[2], result.expire ? `${result.expire}${result.daysLeft != null ? ` ${daysLeftText(result.daysLeft)}` : ''}` : '—'],
                [resultLabels[3], '__status__'],
                [resultLabels[4], maskPhone(result.phone)],
                [resultLabels[5], maskEmail(result.email)],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</div>
                  {val === '__status__'
                    ? <StatusBadge status={result.status} isEN={isEN} />
                    : <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{val || '—'}</div>
                  }
                </div>
              ))}
            </div>
            {result.key && (
              <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--gray2)' }}>
                <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  {isEN ? 'Your Key' : 'Key của bạn'}
                </div>
                <div style={{
                  fontFamily: 'monospace', fontWeight: 800, fontSize: 16,
                  color: 'var(--navy)', background: 'var(--navy-light)',
                  padding: '8px 14px', borderRadius: 8,
                  display: 'inline-block', letterSpacing: '1px',
                }}>{result.key}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </Reveal>
  )
}

// ─── SECTION 2: RESET THIẾT BỊ ───────────────────────────────────────────────
function ResetSection({ isEN }) {
  const [key, setKey] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccess('')
    setError('')
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_device', key: key.trim().toUpperCase(), phone: phone.trim() }),
      })
      const data = await res.json()
      if (data.ok) {
        setSuccess(data.message || (isEN
          ? 'Device reset successful! Sign in again on your new device.'
          : 'Reset thiết bị thành công! Đăng nhập lại trên máy mới.'))
        setKey('')
        setPhone('')
      } else {
        setError(data.error || (isEN
          ? 'Cannot reset. Please check your key and phone number.'
          : 'Không thể reset. Kiểm tra lại key và SĐT.'))
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
    <Reveal delay={80}>
      <div className="card" style={{ padding: 'clamp(24px,4vw,40px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'var(--navy)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 17, flexShrink: 0,
          }}>2</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--navy)', margin: 0 }}>
            {isEN ? 'Reset Device' : 'Reset thiết bị'}
          </h2>
        </div>
        <p style={{ color: 'var(--text2)', fontSize: 15, margin: '0 0 24px 56px', lineHeight: 1.6 }}>
          {isEN
            ? 'Key locked to a device — reset when switching computers or reinstalling Chrome.'
            : 'Key bị khóa thiết bị — cần reset khi đổi máy tính hoặc cài lại Chrome.'}
        </p>

        {/* Warning box */}
        <div className="alert alert-warning" style={{ marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              {isEN ? 'Important Note' : 'Lưu ý quan trọng'}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.7 }}>
              {isEN ? (
                <>Each key can only be reset <strong>1 time/month</strong>. The old device will be signed out immediately after reset.</>
              ) : (
                <>Mỗi key chỉ được reset tối đa <strong>1 lần/tháng</strong>. Sau khi reset, thiết bị cũ sẽ bị đăng xuất ngay lập tức.</>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              {isEN ? 'Your Key' : 'Key của bạn'} <span style={{ color: 'var(--orange)' }}>*</span>
            </label>
            <input
              className="form-input"
              type="text"
              placeholder="VD: GMAP-XXXX-XXXX-XXXX"
              value={key}
              onChange={e => setKey(e.target.value.toUpperCase())}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              {isEN ? 'Registered Phone Number' : 'Số điện thoại đăng ký'} <span style={{ color: 'var(--orange)' }}>*</span>
            </label>
            <input
              className="form-input"
              type="text"
              placeholder={isEN ? 'e.g. 0901234567' : 'VD: 0901234567'}
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ fontFamily: 'inherit', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? (
              <><span className="spinner" />{isEN ? 'Processing...' : 'Đang xử lý...'}</>
            ) : (isEN ? '🔓 Reset Device →' : '🔓 Reset thiết bị →')}
          </button>
        </form>

        {success && <div className="alert alert-success" style={{ marginTop: 16 }}>{success}</div>}
        {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}
      </div>
    </Reveal>
  )
}

// ─── SECTION 3: NÂNG CẤP / GIA HẠN ──────────────────────────────────────────
function UpgradeSection({ isEN }) {
  const plans = isEN
    ? [
        {
          name: 'Personal',
          price: '180.000đ',
          period: '/month',
          note: '144K/month — 1 year (-20%)',
          features: ['1 Admin + 1 Staff', 'Unlimited ad accounts', 'Basic CPA sync', 'Zalo support'],
          highlight: false,
        },
        {
          name: 'Business',
          price: '390.000đ',
          period: '/month',
          note: '312K/month — 1 year (-20%)',
          features: ['2 Admin + 5 Staff', 'Unlimited products', 'Advanced reports', 'Auto alerts', 'Zalo support'],
          highlight: true,
          badge: 'MOST POPULAR',
        },
        {
          name: 'Agency',
          price: '890.000đ',
          period: '/month',
          note: '712K/month — 1 year (-20%)',
          features: ['6 Admin + Unlimited staff', 'Unlimited products', 'Agency reports', '1-1 Zalo/Call', 'SLA 24/7'],
          highlight: false,
        },
      ]
    : [
        {
          name: 'Cá nhân',
          price: '180.000đ',
          period: '/tháng',
          note: '144K/tháng khi mua 1 năm (-20%)',
          features: ['1 Admin + 1 Nhân viên', 'Không giới hạn tài khoản ads', 'Đồng bộ CPA cơ bản', 'Hỗ trợ Zalo'],
          highlight: false,
        },
        {
          name: 'Doanh nghiệp',
          price: '390.000đ',
          period: '/tháng',
          note: '312K/tháng khi mua 1 năm (-20%)',
          features: ['2 Admin + 5 Nhân viên', 'Không giới hạn sản phẩm', 'Báo cáo nâng cao', 'Cảnh báo tự động', 'Hỗ trợ Zalo'],
          highlight: true,
          badge: 'PHỔ BIẾN NHẤT',
        },
        {
          name: 'Agency',
          price: '890.000đ',
          period: '/tháng',
          note: '712K/tháng khi mua 1 năm (-20%)',
          features: ['6 Admin + Không giới hạn NV', 'Không giới hạn sản phẩm', 'Báo cáo agency', 'Hỗ trợ 1-1 Zalo/Call', 'SLA 24/7'],
          highlight: false,
        },
      ]

  return (
    <Reveal delay={160}>
      <div style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy2) 100%)',
        borderRadius: 'var(--radius-xl)', padding: 'clamp(28px,4vw,44px)',
        color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 17, flexShrink: 0,
          }}>3</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>
            {isEN ? 'Upgrade / Renew' : 'Nâng cấp / Gia hạn'}
          </h2>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, margin: '0 0 32px 56px', lineHeight: 1.6 }}>
          {isEN
            ? 'Upgrade to unlock more features and increase team capacity.'
            : 'Nâng cấp để mở khóa thêm tính năng và tăng số lượng nhân viên.'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }} className="upgrade-plans">
          {plans.map(p => (
            <div key={p.name} style={{
              background: p.highlight ? 'var(--orange)' : 'rgba(255,255,255,0.1)',
              borderRadius: 'var(--radius)',
              padding: '24px 20px',
              border: p.highlight ? 'none' : '1px solid rgba(255,255,255,0.15)',
              position: 'relative',
            }}>
              {p.badge && (
                <div style={{
                  position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                  background: '#fbbf24', color: '#78350f',
                  fontSize: 11, fontWeight: 800, padding: '3px 12px',
                  borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap',
                }}>{p.badge}</div>
              )}
              <div style={{ fontWeight: 900, fontSize: 17, marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
                {p.price}<span style={{ fontSize: 13, opacity: 0.8 }}>{p.period}</span>
              </div>
              {p.note && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 14, fontStyle: 'italic' }}>
                  💡 {p.note}
                </div>
              )}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {p.features.map((f, i) => (
                  <li key={i} style={{ fontSize: 13, marginBottom: 7, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ marginTop: 1 }}>✓</span>
                    <span style={{ opacity: 0.9 }}>{f}</span>
                  </li>
                ))}
              </ul>
              <a href="/mua-goi" style={{
                display: 'block', textAlign: 'center', marginTop: 18,
                background: p.highlight ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.12)',
                color: '#fff', textDecoration: 'none',
                padding: '10px', borderRadius: 10,
                fontWeight: 800, fontSize: 14,
                border: '1px solid rgba(255,255,255,0.2)',
                transition: 'background 0.2s',
              }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                onMouseOut={e => e.currentTarget.style.background = p.highlight ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.12)'}
              >{isEN ? 'Choose plan →' : 'Chọn gói →'}</a>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <a href="/mua-goi" className="btn btn-white" style={{ fontFamily: 'inherit' }}>
            {isEN ? 'View details & Buy →' : 'Xem chi tiết & Mua gói →'}
          </a>
        </div>
      </div>
    </Reveal>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function QuanLy() {
  const { lang } = useLang()
  const isEN = lang === 'en'

  return (
    <>
      <Head>
        <title>{isEN ? 'Account Management — Go Meta Ads Pro' : 'Quản lý tài khoản — Go Meta Ads Pro'}</title>
        <meta name="description" content={isEN
          ? 'Look up your key, reset device, and manage your Go Meta Ads Pro account.'
          : 'Tra cứu key, reset thiết bị và quản lý tài khoản Go Meta Ads Pro.'
        } />
      </Head>
      <Navbar />

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy2) 100%)',
        paddingTop: 'calc(var(--header-h) + 16px)',
        paddingBottom: 64,
        textAlign: 'center',
        color: '#fff',
      }}>
        <div className="container" style={{ maxWidth: 680 }}>
          <div className="badge badge-white" style={{ marginBottom: 20 }}>
            {isEN ? '🔑 Lookup & Manage' : '🔑 Tra cứu & Quản lý'}
          </div>
          <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(28px,5vw,42px)' }}>
            {isEN ? 'Account Management' : 'Quản lý tài khoản'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: 17, lineHeight: 1.7, margin: 0 }}>
            {isEN
              ? 'Look up key info, reset device when switching computers, and upgrade your plan.'
              : 'Tra cứu thông tin key, reset thiết bị khi đổi máy, và nâng cấp gói sử dụng.'}
          </p>
        </div>
      </section>

      {/* Content */}
      <main style={{ background: 'var(--gray)', minHeight: '80vh', padding: '56px 16px 96px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
          <LookupSection isEN={isEN} />
          <ResetSection isEN={isEN} />
          <UpgradeSection isEN={isEN} />
        </div>
      </main>

      <Footer />

      <style>{`
        @media (max-width: 640px) {
          .result-grid { grid-template-columns: 1fr !important; }
          .upgrade-plans { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .upgrade-plans { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}
