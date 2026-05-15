import { useState } from 'react'
import Head from 'next/head'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const NAVY = '#0c2a72'
const ORANGE = '#fe5f01'
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

function StatusBadge({ status }) {
  const active = status === 'active' || status === 'Active'
  return (
    <span style={{
      display: 'inline-block',
      background: active ? '#dcfce7' : '#fee2e2',
      color: active ? '#16a34a' : '#dc2626',
      fontWeight: 700, fontSize: 13,
      padding: '3px 12px', borderRadius: 20
    }}>{active ? 'Còn hiệu lực' : 'Hết hạn / Bị khóa'}</span>
  )
}

function SectionTitle({ number, title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: NAVY, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 17, flexShrink: 0
        }}>{number}</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: NAVY, margin: 0 }}>{title}</h2>
      </div>
      {subtitle && <p style={{ color: '#6b7280', fontSize: 15, margin: '0 0 0 54px', lineHeight: 1.6 }}>{subtitle}</p>}
    </div>
  )
}

function InputField({ label, placeholder, value, onChange, type = 'text', required }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontWeight: 700, color: NAVY, fontSize: 14, marginBottom: 6 }}>
        {label}{required && <span style={{ color: ORANGE }}> *</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          width: '100%', padding: '11px 16px',
          border: `1.5px solid #d1d5db`,
          borderRadius: 8, fontSize: 15, outline: 'none',
          fontFamily: 'inherit', transition: 'border-color 0.15s',
          boxSizing: 'border-box'
        }}
        onFocus={e => e.target.style.borderColor = NAVY}
        onBlur={e => e.target.style.borderColor = '#d1d5db'}
      />
    </div>
  )
}

function Alert({ type, children }) {
  const styles = {
    success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', icon: '✅' },
    error: { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', icon: '❌' },
    warning: { bg: '#fffbeb', border: '#fde68a', color: '#92400e', icon: '⚠️' },
  }
  const s = styles[type] || styles.warning
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 10, padding: '14px 18px',
      display: 'flex', gap: 10, alignItems: 'flex-start',
      marginTop: 16
    }}>
      <span style={{ fontSize: 18 }}>{s.icon}</span>
      <div style={{ color: s.color, fontSize: 14, lineHeight: 1.7 }}>{children}</div>
    </div>
  )
}

// ─── LOOKUP FORM ─────────────────────────────────────────────────────────────
function LookupSection() {
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
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (data.success && data.data) {
        setResult(data.data)
      } else {
        setError(data.message || 'Không tìm thấy — thử nhập đúng SĐT đăng ký.')
      }
    } catch {
      setError('Không thể kết nối máy chủ. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '36px',
      boxShadow: '0 4px 24px rgba(12,42,114,0.09)',
      border: '1px solid #e5e9f5'
    }}>
      <SectionTitle
        number="1"
        title="Tìm tài khoản"
        subtitle="Tra cứu thông tin gói, hạn sử dụng và trạng thái key của bạn."
      />

      {/* Tab switcher */}
      <div style={{
        display: 'flex', background: '#f3f4f6', borderRadius: 10,
        padding: 4, marginBottom: 24, width: 'fit-content'
      }}>
        {[['key', '🔑 Nhập Key'], ['contact', '📞 SĐT + Email']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => { setTab(id); setResult(null); setError('') }}
            style={{
              padding: '9px 22px', border: 'none', cursor: 'pointer',
              borderRadius: 8, fontWeight: 700, fontSize: 14,
              background: tab === id ? NAVY : 'transparent',
              color: tab === id ? '#fff' : '#6b7280',
              transition: 'all 0.15s'
            }}
          >{label}</button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {tab === 'key' ? (
          <InputField
            label="Key của bạn"
            placeholder="VD: GMAP-XXXX-XXXX-XXXX"
            value={keyVal}
            onChange={e => setKeyVal(e.target.value.toUpperCase())}
            required
          />
        ) : (
          <>
            <InputField
              label="Số điện thoại đăng ký"
              placeholder="VD: 0901234567"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
            />
            <InputField
              label="Email đăng ký"
              placeholder="VD: ten@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              required
            />
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? '#9ca3af' : NAVY,
            color: '#fff', border: 'none', borderRadius: 8,
            padding: '12px 28px', fontWeight: 800, fontSize: 15,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s'
          }}
        >
          {loading ? 'Đang tra cứu...' : 'Kiểm tra →'}
        </button>
      </form>

      {error && <Alert type="error">{error}</Alert>}

      {result && (
        <div style={{
          marginTop: 24, background: '#f8faff',
          border: `1.5px solid ${NAVY}25`, borderRadius: 12, padding: 24
        }}>
          <div style={{ fontWeight: 800, color: NAVY, fontSize: 16, marginBottom: 18 }}>
            Kết quả tra cứu
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
            {[
              ['Họ và tên', result.name],
              ['Gói sử dụng', result.plan || result.package],
              ['Hạn sử dụng', result.expires_at || result.expiry],
              ['Trạng thái', null],
              ['Số điện thoại', maskPhone(result.phone)],
              ['Email', maskEmail(result.email)],
            ].map(([label, val], i) => (
              <div key={i}>
                <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, marginBottom: 3 }}>{label}</div>
                {label === 'Trạng thái'
                  ? <StatusBadge status={result.status} />
                  : <div style={{ fontSize: 15, fontWeight: 600, color: '#1f2937' }}>{val || '—'}</div>
                }
              </div>
            ))}
          </div>
          {result.key && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e5e9f5' }}>
              <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, marginBottom: 4 }}>Key của bạn</div>
              <div style={{
                fontFamily: 'monospace', fontWeight: 800, fontSize: 16,
                color: NAVY, background: '#e8eeff', padding: '8px 14px',
                borderRadius: 6, display: 'inline-block', letterSpacing: '1px'
              }}>{result.key}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── RESET SECTION ────────────────────────────────────────────────────────────
function ResetSection() {
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
        body: JSON.stringify({ action: 'reset_device', key: key.trim().toUpperCase(), phone: phone.trim() })
      })
      const data = await res.json()
      if (data.success) {
        setSuccess('Reset thiết bị thành công! Bạn có thể đăng nhập lại trên máy mới.')
        setKey('')
        setPhone('')
      } else {
        setError(data.message || 'Không thể reset. Kiểm tra lại key và SĐT.')
      }
    } catch {
      setError('Không thể kết nối máy chủ. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '36px',
      boxShadow: '0 4px 24px rgba(12,42,114,0.09)',
      border: '1px solid #e5e9f5'
    }}>
      <SectionTitle
        number="2"
        title="Reset thiết bị"
        subtitle="Key bị khóa thiết bị — cần reset khi đổi máy tính hoặc cài lại Chrome."
      />

      <div style={{
        background: '#fffbf5', border: `1px solid ${ORANGE}40`,
        borderRadius: 10, padding: '14px 18px', marginBottom: 24,
        display: 'flex', gap: 10
      }}>
        <span style={{ fontSize: 20 }}>⚠️</span>
        <div>
          <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 4 }}>Lưu ý quan trọng</div>
          <div style={{ color: '#92400e', fontSize: 14, lineHeight: 1.7 }}>
            Mỗi key chỉ được reset tối đa <strong>1 lần/tháng</strong>.
            Sau khi reset, thiết bị cũ sẽ bị đăng xuất ngay lập tức.
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <InputField
          label="Key của bạn"
          placeholder="VD: GMAP-XXXX-XXXX-XXXX"
          value={key}
          onChange={e => setKey(e.target.value.toUpperCase())}
          required
        />
        <InputField
          label="Số điện thoại đăng ký"
          placeholder="VD: 0901234567"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? '#9ca3af' : ORANGE,
            color: '#fff', border: 'none', borderRadius: 8,
            padding: '12px 28px', fontWeight: 800, fontSize: 15,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s'
          }}
        >
          {loading ? 'Đang xử lý...' : '🔓 Reset thiết bị →'}
        </button>
      </form>

      {success && <Alert type="success">{success}</Alert>}
      {error && <Alert type="error">{error}</Alert>}
    </div>
  )
}

// ─── UPGRADE SECTION ──────────────────────────────────────────────────────────
function UpgradeSection() {
  const plans = [
    { name: 'Personal', price: '299.000', highlight: false, features: ['1 tài khoản', '3 sản phẩm', 'CPA tracking', 'Cảnh báo cơ bản'] },
    { name: 'Business', price: '599.000', highlight: true, features: ['3 tài khoản NV', '10 sản phẩm', 'Xuất Excel/PDF', 'Auto Care'] },
    { name: 'Agency', price: '999.000', highlight: false, features: ['10 tài khoản NV', 'Không giới hạn SP', 'Báo cáo Telegram', 'Ưu tiên hỗ trợ'] },
  ]

  return (
    <div style={{
      background: `linear-gradient(135deg, ${NAVY} 0%, #1a3a8a 100%)`,
      borderRadius: 16, padding: '40px',
      color: '#fff'
    }}>
      <SectionTitle number="3" title="Nâng cấp / Gia hạn" />
      <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, marginTop: -10, marginBottom: 28, marginLeft: 54 }}>
        Nâng cấp để mở khóa thêm tính năng và tăng số lượng nhân viên.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {plans.map((p) => (
          <div key={p.name} style={{
            background: p.highlight ? ORANGE : 'rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '24px 20px',
            border: p.highlight ? 'none' : '1px solid rgba(255,255,255,0.15)',
            position: 'relative'
          }}>
            {p.highlight && (
              <div style={{
                position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                background: '#fbbf24', color: '#92400e',
                fontSize: 11, fontWeight: 800, padding: '3px 12px', borderRadius: 20
              }}>PHỔ BIẾN NHẤT</div>
            )}
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>{p.name}</div>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 16 }}>
              {p.price}<span style={{ fontSize: 13, opacity: 0.8 }}>đ/tháng</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {p.features.map((f, i) => (
                <li key={i} style={{ fontSize: 14, marginBottom: 8, display: 'flex', gap: 8 }}>
                  <span>✓</span><span style={{ opacity: 0.9 }}>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center' }}>
        <a href="/mua-goi" style={{
          display: 'inline-block', background: '#fff', color: NAVY,
          textDecoration: 'none', padding: '14px 36px',
          borderRadius: 10, fontWeight: 900, fontSize: 16,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
        }}>Xem chi tiết & Mua gói →</a>
      </div>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function QuanLy() {
  return (
    <>
      <Head>
        <title>Quản lý tài khoản — Go Meta Ads Pro</title>
        <meta name="description" content="Tra cứu key, reset thiết bị và quản lý tài khoản Go Meta Ads Pro." />
      </Head>
      <Navbar />

      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${NAVY} 0%, #1a3a8a 100%)`,
        paddingTop: 100, paddingBottom: 60,
        textAlign: 'center', color: '#fff'
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 20px' }}>
          <div style={{
            display: 'inline-block', background: 'rgba(254,95,1,0.18)',
            color: '#fe9a60', fontSize: 13, fontWeight: 700,
            padding: '5px 16px', borderRadius: 20, marginBottom: 20
          }}>🔑 Tra cứu & Quản lý</div>
          <h1 style={{ fontSize: 36, fontWeight: 900, margin: '0 0 16px' }}>Quản lý tài khoản</h1>
          <p style={{ fontSize: 17, opacity: 0.8, lineHeight: 1.7, margin: 0 }}>
            Tra cứu thông tin key, reset thiết bị khi đổi máy, và nâng cấp gói sử dụng.
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ background: '#f5f7ff', minHeight: '100vh', padding: '56px 20px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
          <LookupSection />
          <ResetSection />
          <UpgradeSection />
        </div>
      </div>

      <Footer />

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        @media (max-width: 600px) {
          div[style*="grid-template-columns: repeat(3, 1fr)"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
        input:focus { border-color: ${NAVY} !important; box-shadow: 0 0 0 3px ${NAVY}18; }
      `}</style>
    </>
  )
}
