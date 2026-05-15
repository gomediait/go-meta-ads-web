import { useState } from 'react'
import Head from 'next/head'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const NAVY = '#0c2a72'
const ORANGE = '#fe5f01'
const API_AFFILIATE = 'https://go-meta-ads-backend.vercel.app/api/affiliate'

function InputField({ label, placeholder, value, onChange, type = 'text', required, hint }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontWeight: 700, color: '#1f2937', fontSize: 14, marginBottom: 6 }}>
        {label}{required && <span style={{ color: ORANGE }}> *</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        style={{
          width: '100%', padding: '11px 16px',
          border: '1.5px solid #d1d5db',
          borderRadius: 8, fontSize: 15, outline: 'none',
          fontFamily: 'inherit', transition: 'border-color 0.15s',
          boxSizing: 'border-box', background: '#fff'
        }}
        onFocus={e => { e.target.style.borderColor = NAVY; e.target.style.boxShadow = `0 0 0 3px ${NAVY}18` }}
        onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none' }}
      />
      {hint && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

function Alert({ type, children }) {
  const map = {
    success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', icon: '✅' },
    error: { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', icon: '❌' },
  }
  const s = map[type] || map.error
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 10, padding: '14px 18px',
      display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 16
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</span>
      <div style={{ color: s.color, fontSize: 14, lineHeight: 1.7 }}>{children}</div>
    </div>
  )
}

// ─── COMMISSION CARDS ────────────────────────────────────────────────────────
function CommissionSection() {
  const cards = [
    { pct: '5%', label: 'Gói Cá nhân', sub: 'Tháng đầu tiên', color: '#3b82f6', bg: '#eff6ff' },
    { pct: '7%', label: 'Gói Doanh nghiệp', sub: 'Tháng đầu tiên', color: NAVY, bg: '#f0f4ff' },
    { pct: '9%', label: 'Gói Agency', sub: 'Tháng đầu tiên', color: ORANGE, bg: '#fff5f0' },
    { pct: '3%', label: 'Gia hạn', sub: 'Mỗi lần gia hạn', color: '#16a34a', bg: '#f0fdf4' },
  ]
  return (
    <div style={{ padding: '64px 20px', background: '#fff' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{
            display: 'inline-block', background: `${NAVY}10`, color: NAVY,
            fontSize: 13, fontWeight: 700, padding: '5px 16px',
            borderRadius: 20, marginBottom: 16
          }}>💰 Tỉ lệ hoa hồng</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: NAVY, margin: '0 0 12px' }}>Hoa hồng hấp dẫn, tự động thanh toán</h2>
          <p style={{ color: '#6b7280', fontSize: 16, maxWidth: 520, margin: '0 auto' }}>
            Hoa hồng tính theo từng gói khách mua — thanh toán hàng tháng qua chuyển khoản ngân hàng.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {cards.map((c) => (
            <div key={c.label} style={{
              background: c.bg, borderRadius: 14, padding: '28px 20px',
              textAlign: 'center', border: `1px solid ${c.color}20`
            }}>
              <div style={{
                fontSize: 44, fontWeight: 900, color: c.color,
                lineHeight: 1, marginBottom: 12
              }}>{c.pct}</div>
              <div style={{ fontWeight: 800, color: '#1f2937', fontSize: 15, marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 13, color: '#9ca3af' }}>{c.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { num: '01', icon: '📋', title: 'Đăng ký affiliate', desc: 'Điền form bên dưới với key của bạn và thông tin ngân hàng.' },
    { num: '02', icon: '🔗', title: 'Nhận link riêng', desc: 'Hệ thống cấp link cá nhân VD: adsmeta.gonetwork.vn?ref=ABC123' },
    { num: '03', icon: '🛒', title: 'Khách mua qua link', desc: 'Cookie tracking 30 ngày — khách click link rồi mua bất kỳ lúc nào đều tính.' },
    { num: '04', icon: '💸', title: 'Nhận tiền hàng tháng', desc: 'Hoa hồng được tổng hợp và chuyển khoản ngân hàng theo tháng.' },
  ]

  return (
    <div style={{ padding: '64px 20px', background: '#f5f7ff' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{
            display: 'inline-block', background: `${ORANGE}15`, color: ORANGE,
            fontSize: 13, fontWeight: 700, padding: '5px 16px',
            borderRadius: 20, marginBottom: 16
          }}>⚙️ Cách hoạt động</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: NAVY, margin: 0 }}>4 bước đơn giản</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, position: 'relative' }}>
          {/* connector line */}
          <div style={{
            position: 'absolute', top: 36, left: '12.5%', right: '12.5%',
            height: 2, background: `${NAVY}20`, zIndex: 0
          }} className="connector-line" />
          {steps.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: '#fff', border: `2px solid ${NAVY}20`,
                margin: '0 auto 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, boxShadow: '0 4px 16px rgba(12,42,114,0.1)'
              }}>{s.icon}</div>
              <div style={{
                fontSize: 11, fontWeight: 800, color: ORANGE,
                letterSpacing: '1px', marginBottom: 6
              }}>BƯỚC {s.num}</div>
              <div style={{ fontWeight: 800, color: NAVY, fontSize: 15, marginBottom: 8 }}>{s.title}</div>
              <div style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── REGISTER FORM ────────────────────────────────────────────────────────────
function RegisterForm() {
  const [form, setForm] = useState({
    key: '', name: '', phone: '', email: '',
    bank_name: '', bank_account: '', bank_owner: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: field === 'key' ? e.target.value.toUpperCase() : e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(null)
    setError('')
    try {
      const res = await fetch(API_AFFILIATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', ...form })
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(data)
        setForm({ key: '', name: '', phone: '', email: '', bank_name: '', bank_account: '', bank_owner: '' })
      } else {
        setError(data.message || 'Đăng ký thất bại. Kiểm tra lại key và thông tin.')
      }
    } catch {
      setError('Không thể kết nối máy chủ. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '64px 20px', background: '#fff' }} id="register">
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{
          background: '#fff', borderRadius: 16, padding: '40px',
          boxShadow: '0 4px 32px rgba(12,42,114,0.1)',
          border: '1px solid #e5e9f5'
        }}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: NAVY, margin: '0 0 8px' }}>
              📋 Đăng ký Affiliate
            </h2>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#fffbf5', border: `1px solid ${ORANGE}40`,
              borderRadius: 8, padding: '6px 14px', fontSize: 13, color: '#92400e'
            }}>
              <span>⚠️</span>
              <span>Chỉ user đã trả phí đăng ký được</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Thông tin cá nhân */}
            <div style={{
              fontSize: 12, fontWeight: 800, color: '#9ca3af',
              textTransform: 'uppercase', letterSpacing: '0.6px',
              marginBottom: 16, paddingBottom: 8,
              borderBottom: '1px solid #f3f4f6'
            }}>Thông tin cá nhân</div>

            <InputField label="Key của bạn" placeholder="GMAP-XXXX-XXXX-XXXX" value={form.key} onChange={set('key')} required hint="Key admin bạn đã mua — dùng để xác minh tư cách affiliate" />
            <InputField label="Họ và tên" placeholder="Nguyễn Văn A" value={form.name} onChange={set('name')} required />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <InputField label="Số điện thoại" placeholder="0901234567" value={form.phone} onChange={set('phone')} required />
              <InputField label="Email" placeholder="ten@email.com" value={form.email} onChange={set('email')} type="email" />
            </div>

            {/* Thông tin ngân hàng */}
            <div style={{
              fontSize: 12, fontWeight: 800, color: '#9ca3af',
              textTransform: 'uppercase', letterSpacing: '0.6px',
              marginTop: 8, marginBottom: 16, paddingBottom: 8,
              borderBottom: '1px solid #f3f4f6'
            }}>Thông tin ngân hàng nhận tiền</div>

            <InputField label="Tên ngân hàng" placeholder="VD: Vietcombank, MB Bank, Techcombank..." value={form.bank_name} onChange={set('bank_name')} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <InputField label="Số tài khoản" placeholder="0123456789" value={form.bank_account} onChange={set('bank_account')} required />
              <InputField label="Tên chủ tài khoản" placeholder="NGUYEN VAN A" value={form.bank_owner} onChange={set('bank_owner')} required hint="Viết IN HOA không dấu" />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', marginTop: 8,
                background: loading ? '#9ca3af' : `linear-gradient(135deg, ${NAVY}, #1a3a8a)`,
                color: '#fff', border: 'none', borderRadius: 10,
                padding: '14px', fontWeight: 900, fontSize: 16,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.15s'
              }}
            >
              {loading ? 'Đang đăng ký...' : '🚀 Đăng ký Affiliate →'}
            </button>
          </form>

          {error && <Alert type="error">{error}</Alert>}

          {success && (
            <div style={{
              marginTop: 24, background: '#f0fdf4',
              border: '1.5px solid #bbf7d0', borderRadius: 12, padding: 24,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
              <div style={{ fontWeight: 900, color: '#15803d', fontSize: 18, marginBottom: 8 }}>
                Đăng ký thành công!
              </div>
              <div style={{ color: '#374151', fontSize: 14, marginBottom: 16 }}>
                Mã affiliate của bạn:
              </div>
              <div style={{
                fontFamily: 'monospace', fontWeight: 900, fontSize: 24,
                color: NAVY, background: '#e8eeff', padding: '12px 24px',
                borderRadius: 8, display: 'inline-block', letterSpacing: '2px'
              }}>{success.referral_code || success.data?.referral_code || 'N/A'}</div>
              <div style={{ color: '#6b7280', fontSize: 13, marginTop: 12 }}>
                Link của bạn: <strong style={{ color: NAVY }}>adsmeta.gonetwork.vn?ref={success.referral_code || success.data?.referral_code}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── LOOKUP COMMISSION ────────────────────────────────────────────────────────
function LookupCommission() {
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
        body: JSON.stringify({ action: 'lookup', key: key.trim().toUpperCase() })
      })
      const data = await res.json()
      if (data.success && data.data) {
        setResult(data.data)
      } else {
        setError(data.message || 'Không tìm thấy tài khoản affiliate với key này.')
      }
    } catch {
      setError('Không thể kết nối máy chủ. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '64px 20px', background: '#f5f7ff' }} id="dashboard">
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-block', background: `${NAVY}10`, color: NAVY,
            fontSize: 13, fontWeight: 700, padding: '5px 16px',
            borderRadius: 20, marginBottom: 16
          }}>📊 Tra cứu hoa hồng</div>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: NAVY, margin: 0 }}>Kiểm tra hoa hồng của bạn</h2>
        </div>

        <div style={{
          background: '#fff', borderRadius: 16, padding: '36px',
          boxShadow: '0 4px 20px rgba(12,42,114,0.09)',
          border: '1px solid #e5e9f5'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12 }}>
            <input
              type="text"
              placeholder="Nhập key của bạn..."
              value={key}
              onChange={e => setKey(e.target.value.toUpperCase())}
              required
              style={{
                flex: 1, padding: '12px 16px',
                border: '1.5px solid #d1d5db', borderRadius: 8,
                fontSize: 15, outline: 'none', fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = NAVY}
              onBlur={e => e.target.style.borderColor = '#d1d5db'}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? '#9ca3af' : NAVY,
                color: '#fff', border: 'none', borderRadius: 8,
                padding: '12px 24px', fontWeight: 800, fontSize: 14,
                cursor: loading ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {loading ? '...' : 'Tra cứu →'}
            </button>
          </form>

          {error && <Alert type="error">{error}</Alert>}

          {result && (
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div style={{
                  background: '#f0f4ff', borderRadius: 10, padding: '18px 20px',
                  border: `1px solid ${NAVY}15`
                }}>
                  <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, marginBottom: 6 }}>MÃ AFFILIATE</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 18, color: NAVY }}>
                    {result.referral_code || '—'}
                  </div>
                </div>
                <div style={{
                  background: '#f0fdf4', borderRadius: 10, padding: '18px 20px',
                  border: '1px solid #bbf7d0'
                }}>
                  <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, marginBottom: 6 }}>TỔNG HOA HỒNG</div>
                  <div style={{ fontWeight: 900, fontSize: 18, color: '#16a34a' }}>
                    {result.total_earned != null
                      ? Number(result.total_earned).toLocaleString('vi-VN') + 'đ'
                      : '—'}
                  </div>
                </div>
              </div>
              <div style={{
                background: '#f9faff', borderRadius: 10, padding: '14px 18px',
                border: '1px solid #e5e9f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ color: '#6b7280', fontSize: 14 }}>Trạng thái tài khoản</span>
                <span style={{
                  background: result.status === 'active' ? '#dcfce7' : '#fee2e2',
                  color: result.status === 'active' ? '#16a34a' : '#dc2626',
                  fontWeight: 700, fontSize: 13, padding: '3px 12px', borderRadius: 20
                }}>
                  {result.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function Affiliate() {
  return (
    <>
      <Head>
        <title>Affiliate — Go Meta Ads Pro | Kiếm hoa hồng giới thiệu</title>
        <meta name="description" content="Tham gia chương trình affiliate Go Meta Ads Pro — nhận hoa hồng đến 9% mỗi lần giới thiệu khách mua gói." />
      </Head>
      <Navbar />

      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${NAVY} 0%, #0e1e50 50%, #1a0a00 100%)`,
        paddingTop: 100, paddingBottom: 80,
        color: '#fff', textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        {/* decorative circles */}
        <div style={{
          position: 'absolute', top: -80, right: -80, width: 320, height: 320,
          borderRadius: '50%', background: `${ORANGE}15`, pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -60, width: 240, height: 240,
          borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 20px', position: 'relative' }}>
          <div style={{
            display: 'inline-block',
            background: `linear-gradient(135deg, ${ORANGE}, #ff8c3a)`,
            color: '#fff', fontSize: 13, fontWeight: 800,
            padding: '6px 20px', borderRadius: 20, marginBottom: 24,
            boxShadow: `0 4px 16px ${ORANGE}50`
          }}>🤝 Chương trình Affiliate</div>

          <h1 style={{ fontSize: 42, fontWeight: 900, margin: '0 0 20px', lineHeight: 1.2 }}>
            Giới thiệu Go Meta Ads Pro<br />
            <span style={{ color: ORANGE }}>Nhận hoa hồng tự động</span>
          </h1>

          <p style={{ fontSize: 18, opacity: 0.85, lineHeight: 1.8, maxWidth: 620, margin: '0 auto 36px' }}>
            Đã dùng Go Meta Ads Pro? Chia link cho đồng nghiệp & bạn bè.
            Mỗi khi họ mua key, bạn nhận hoa hồng đến <strong style={{ color: '#fbbf24' }}>9% tháng đầu</strong> + <strong style={{ color: '#fbbf24' }}>3% mỗi lần gia hạn</strong>.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#register" style={{
              background: ORANGE, color: '#fff', textDecoration: 'none',
              padding: '14px 32px', borderRadius: 10, fontWeight: 900, fontSize: 16,
              boxShadow: `0 6px 20px ${ORANGE}50`
            }}>Đăng ký ngay →</a>
            <a href="#dashboard" style={{
              background: 'rgba(255,255,255,0.12)', color: '#fff', textDecoration: 'none',
              padding: '14px 32px', borderRadius: 10, fontWeight: 700, fontSize: 16,
              border: '1.5px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)'
            }}>Tra cứu hoa hồng</a>
          </div>

          {/* Quick stats */}
          <div style={{
            display: 'flex', gap: 0, justifyContent: 'center', marginTop: 52,
            background: 'rgba(255,255,255,0.07)', borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.12)', overflow: 'hidden',
            maxWidth: 540, marginLeft: 'auto', marginRight: 'auto'
          }}>
            {[
              { val: 'đến 9%', label: 'Hoa hồng tháng đầu' },
              { val: '3%', label: 'Hoa hồng gia hạn' },
              { val: '30 ngày', label: 'Cookie tracking' },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, padding: '20px 12px', textAlign: 'center',
                borderRight: i < 2 ? '1px solid rgba(255,255,255,0.12)' : 'none'
              }}>
                <div style={{ fontWeight: 900, fontSize: 22, color: '#fbbf24' }}>{s.val}</div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <CommissionSection />
      <HowItWorks />
      <RegisterForm />
      <LookupCommission />

      {/* CTA bottom */}
      <div style={{
        background: `linear-gradient(135deg, ${NAVY}, #1a3a8a)`,
        padding: '60px 20px', textAlign: 'center', color: '#fff'
      }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 12px' }}>
          Bắt đầu kiếm hoa hồng ngay hôm nay
        </h2>
        <p style={{ opacity: 0.75, fontSize: 16, margin: '0 0 28px' }}>
          Chỉ cần chia link — phần còn lại hệ thống tự động xử lý
        </p>
        <a href="#register" style={{
          display: 'inline-block', background: ORANGE, color: '#fff',
          textDecoration: 'none', padding: '14px 36px',
          borderRadius: 10, fontWeight: 900, fontSize: 16,
          boxShadow: `0 6px 20px ${ORANGE}50`
        }}>Đăng ký Affiliate miễn phí →</a>
      </div>

      <Footer />

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        @media (max-width: 768px) {
          .connector-line { display: none !important; }
          div[style*="repeat(4, 1fr)"] { grid-template-columns: 1fr 1fr !important; }
          div[style*="repeat(3, 1fr)"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          h1 { font-size: 28px !important; }
        }
        @media (max-width: 480px) {
          div[style*="repeat(4, 1fr)"] { grid-template-columns: 1fr 1fr !important; }
          div[style*="repeat(3, 1fr)"] { grid-template-columns: 1fr !important; }
        }
        a:hover { opacity: 0.9; }
        input:focus { border-color: ${NAVY} !important; }
      `}</style>
    </>
  )
}
