import { useState, useRef } from 'react'
import Head from 'next/head'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const NAVY = '#0c2a72'
const ORANGE = '#fe5f01'

const PLANS = {
  thang: [
    {
      id: 'ca-nhan',
      name: 'Cá nhân',
      price: 200000,
      priceLabel: '200.000đ',
      period: '/tháng',
      desc: 'Dành cho cá nhân chạy ads',
      features: ['1 Admin + 1 Nhân viên', '3 Sản phẩm', 'Theo dõi CPA cơ bản', 'Hỗ trợ Zalo'],
      recommended: false,
    },
    {
      id: 'doanh-nghiep',
      name: 'Doanh nghiệp',
      price: 500000,
      priceLabel: '500.000đ',
      period: '/tháng',
      desc: 'Phù hợp team 5–10 người',
      features: ['2 Admin + 5 Nhân viên', 'Không giới hạn sản phẩm', 'Báo cáo nâng cao', 'Cảnh báo tự động', 'Hỗ trợ ưu tiên'],
      recommended: true,
    },
    {
      id: 'agency',
      name: 'Agency',
      price: 1200000,
      priceLabel: '1.200.000đ',
      period: '/tháng',
      desc: 'Cho agency & team lớn',
      features: ['6 Admin', 'Không giới hạn nhân viên', 'Không giới hạn sản phẩm', 'Báo cáo agency', 'Onboarding riêng', 'SLA 24/7'],
      recommended: false,
    },
  ],
  nam: [
    {
      id: 'ca-nhan',
      name: 'Cá nhân',
      price: 1920000,
      priceLabel: '1.920.000đ',
      period: '/năm',
      originalPrice: '2.400.000đ',
      desc: 'Dành cho cá nhân chạy ads',
      features: ['1 Admin + 1 Nhân viên', '3 Sản phẩm', 'Theo dõi CPA cơ bản', 'Hỗ trợ Zalo'],
      recommended: false,
    },
    {
      id: 'doanh-nghiep',
      name: 'Doanh nghiệp',
      price: 4800000,
      priceLabel: '4.800.000đ',
      period: '/năm',
      originalPrice: '6.000.000đ',
      desc: 'Phù hợp team 5–10 người',
      features: ['2 Admin + 5 Nhân viên', 'Không giới hạn sản phẩm', 'Báo cáo nâng cao', 'Cảnh báo tự động', 'Hỗ trợ ưu tiên'],
      recommended: true,
    },
    {
      id: 'agency',
      name: 'Agency',
      price: 11520000,
      priceLabel: '11.520.000đ',
      period: '/năm',
      originalPrice: '14.400.000đ',
      desc: 'Cho agency & team lớn',
      features: ['6 Admin', 'Không giới hạn nhân viên', 'Không giới hạn sản phẩm', 'Báo cáo agency', 'Onboarding riêng', 'SLA 24/7'],
      recommended: false,
    },
  ],
  trial: [
    {
      id: 'thu-nghiem',
      name: 'Dùng thử',
      price: 0,
      priceLabel: 'Miễn phí',
      period: '7 ngày',
      desc: 'Trải nghiệm toàn bộ tính năng',
      features: ['Đầy đủ tính năng Doanh nghiệp', 'Không cần thẻ tín dụng', 'Hỗ trợ onboarding', 'Hết hạn sau 7 ngày'],
      recommended: false,
    },
  ],
}

const FAQS = [
  {
    q: 'Mất bao lâu để nhận được key?',
    a: 'Sau khi chúng tôi xác nhận thanh toán (thường trong giờ hành chính), key sẽ được gửi trong vòng 15–30 phút qua Zalo hoặc Email bạn đăng ký.',
  },
  {
    q: 'Có thể đổi gói không?',
    a: 'Có. Bạn liên hệ admin qua Zalo để nâng/hạ gói. Phần chênh lệch sẽ được tính theo số ngày còn lại của gói hiện tại.',
  },
  {
    q: 'Thanh toán bằng phương thức nào?',
    a: 'Hiện tại chúng tôi nhận chuyển khoản ngân hàng (MB Bank). Sau khi chuyển khoản, upload ảnh xác nhận để chúng tôi duyệt nhanh.',
  },
  {
    q: 'Có hoàn tiền nếu không hài lòng không?',
    a: 'Chúng tôi có gói dùng thử 7 ngày miễn phí để bạn trải nghiệm trước. Sau khi mua, chúng tôi không hỗ trợ hoàn tiền. Vui lòng dùng thử kỹ trước khi quyết định.',
  },
]

export default function MuaGoi() {
  const [step, setStep] = useState(1)
  const [billingTab, setBillingTab] = useState('thang')
  const [selectedPlan, setSelectedPlan] = useState('doanh-nghiep')
  const [form, setForm] = useState({ hoTen: '', sdt: '', email: '', tenShop: '', maGioiThieu: '' })
  const [errors, setErrors] = useState({})
  const [previewImg, setPreviewImg] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)
  const fileInputRef = useRef(null)

  const currentPlans = PLANS[billingTab]
  const planObj = currentPlans.find(p => p.id === selectedPlan) || currentPlans[0]

  function validate() {
    const e = {}
    if (!form.hoTen.trim()) e.hoTen = 'Vui lòng nhập họ tên'
    if (!form.sdt.trim()) e.sdt = 'Vui lòng nhập số điện thoại'
    else if (!/^[0-9]{9,11}$/.test(form.sdt.replace(/\s/g, ''))) e.sdt = 'Số điện thoại không hợp lệ'
    if (!form.email.trim()) e.email = 'Vui lòng nhập email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email không hợp lệ'
    return e
  }

  function handleNext() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setErrors({})
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadedFile(file)
    const reader = new FileReader()
    reader.onload = ev => setPreviewImg(ev.target.result)
    reader.readAsDataURL(file)
  }

  async function handleSubmit() {
    if (!uploadedFile) { alert('Vui lòng upload ảnh chuyển khoản'); return }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('hoTen', form.hoTen)
      fd.append('sdt', form.sdt)
      fd.append('email', form.email)
      fd.append('tenShop', form.tenShop)
      fd.append('maGioiThieu', form.maGioiThieu)
      fd.append('goi', planObj.name)
      fd.append('billing', billingTab)
      fd.append('price', planObj.priceLabel)
      fd.append('screenshot', uploadedFile)
      await fetch('https://go-meta-ads-backend.vercel.app/api/orders', { method: 'POST', body: fd })
    } catch (_) { /* proceed anyway */ }
    setSubmitting(false)
    setStep(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const ckContent = `GMAP ${form.sdt} ${planObj?.name?.toUpperCase().replace(/\s/g, '') || 'BUSINESS'}`

  return (
    <>
      <Head>
        <title>Mua gói Go Meta Ads Pro</title>
        <meta name="description" content="Đăng ký sử dụng Go Meta Ads Pro — tiện ích quản lý Facebook Ads chuyên nghiệp cho team." />
      </Head>
      <Navbar />

      <main style={{ background: 'linear-gradient(180deg,#0c2a72 0%,#0e1f4a 180px,#f0f4ff 180px)', minHeight: '100vh', paddingTop: 64 }}>

        {/* ─── Hero strip ─── */}
        <div style={{ textAlign: 'center', padding: '40px 20px 0' }}>
          <h1 style={{ color: '#fff', fontSize: 'clamp(22px,4vw,34px)', fontWeight: 800, margin: '0 0 8px' }}>
            Đăng ký Go Meta Ads Pro
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, margin: 0 }}>
            Hoàn tất trong 3 bước đơn giản — nhận key trong 30 phút
          </p>

          {/* Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginTop: 28, marginBottom: 36 }}>
            {[
              { n: 1, label: 'Thông tin' },
              { n: 2, label: 'Thanh toán' },
              { n: 3, label: 'Hoàn tất' },
            ].map((s, i) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 15,
                    background: step >= s.n ? ORANGE : 'rgba(255,255,255,0.18)',
                    color: '#fff',
                    border: step === s.n ? '3px solid rgba(255,255,255,0.6)' : '3px solid transparent',
                    transition: 'all 0.3s',
                    boxShadow: step >= s.n ? '0 4px 16px rgba(254,95,1,0.4)' : 'none',
                  }}>{step > s.n ? '✓' : s.n}</div>
                  <span style={{ color: step >= s.n ? '#fff' : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{s.label}</span>
                </div>
                {i < 2 && (
                  <div style={{ width: 'clamp(40px,8vw,80px)', height: 2, background: step > s.n ? ORANGE : 'rgba(255,255,255,0.2)', margin: '0 6px', marginBottom: 22, transition: 'background 0.3s' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ─── Card ─── */}
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 16px 60px' }}>
          <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(12,42,114,0.12)', overflow: 'hidden' }}>

            {/* ══════ STEP 1 ══════ */}
            {step === 1 && (
              <div style={{ padding: 'clamp(24px,5vw,48px)' }}>
                <h2 style={{ color: NAVY, fontWeight: 800, fontSize: 22, margin: '0 0 6px' }}>Thông tin đăng ký</h2>
                <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 32px' }}>Điền đầy đủ thông tin để chúng tôi tạo tài khoản cho bạn.</p>

                {/* Personal info grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '16px 20px', marginBottom: 24 }}>
                  {[
                    { key: 'hoTen', label: 'Họ và tên', placeholder: 'Nguyễn Văn A', required: true },
                    { key: 'sdt', label: 'Số điện thoại', placeholder: '0912 345 678', required: true },
                    { key: 'email', label: 'Email', placeholder: 'ban@email.com', required: true },
                    { key: 'tenShop', label: 'Tên shop / Công ty viết tắt', placeholder: 'VD: CTYA → key CTYA-ADMIN-01', required: false },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={labelStyle}>
                        {f.label} {f.required && <span style={{ color: ORANGE }}>*</span>}
                      </label>
                      <input
                        type={f.key === 'email' ? 'email' : 'text'}
                        value={form[f.key]}
                        onChange={e => { setForm(p => ({ ...p, [f.key]: e.target.value })); if (errors[f.key]) setErrors(p => ({ ...p, [f.key]: '' })) }}
                        placeholder={f.placeholder}
                        style={{ ...inputStyle, borderColor: errors[f.key] ? '#ef4444' : '#e2e8f0' }}
                      />
                      {errors[f.key] && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors[f.key]}</div>}
                    </div>
                  ))}
                </div>

                {/* Referral */}
                <div style={{ marginBottom: 32 }}>
                  <label style={labelStyle}>Mã giới thiệu <span style={{ color: '#94a3b8', fontWeight: 400 }}>(tùy chọn)</span></label>
                  <input
                    type="text"
                    value={form.maGioiThieu}
                    onChange={e => setForm(p => ({ ...p, maGioiThieu: e.target.value }))}
                    placeholder="Nhập mã nếu có"
                    style={inputStyle}
                  />
                </div>

                {/* Billing tabs */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 12, padding: 4, gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
                    {[
                      { key: 'thang', label: 'Theo tháng' },
                      { key: 'nam', label: 'Theo năm  −20%' },
                      { key: 'trial', label: 'Dùng thử 7 ngày (free)' },
                    ].map(t => (
                      <button key={t.key} onClick={() => { setBillingTab(t.key); if (!PLANS[t.key].find(p => p.id === selectedPlan)) setSelectedPlan(PLANS[t.key][0].id) }}
                        style={{
                          flex: 1, padding: '10px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                          background: billingTab === t.key ? NAVY : 'transparent',
                          color: billingTab === t.key ? '#fff' : '#64748b',
                          transition: 'all 0.2s', whiteSpace: 'nowrap',
                        }}>
                        {t.key === 'nam' ? <>Theo năm <span style={{ background: '#22c55e', color: '#fff', borderRadius: 6, padding: '2px 6px', fontSize: 11, marginLeft: 4 }}>−20%</span></> : t.label}
                      </button>
                    ))}
                  </div>

                  {/* Plan cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${currentPlans.length},1fr)`, gap: 12 }}>
                    {currentPlans.map(plan => (
                      <div key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                        style={{
                          border: `2px solid ${selectedPlan === plan.id ? ORANGE : '#e2e8f0'}`,
                          borderRadius: 16, padding: '20px 16px', cursor: 'pointer', position: 'relative',
                          background: selectedPlan === plan.id ? 'linear-gradient(135deg,#fff7f3,#fff)' : '#fff',
                          boxShadow: selectedPlan === plan.id ? `0 8px 24px rgba(254,95,1,0.15)` : 'none',
                          transition: 'all 0.2s',
                        }}>
                        {plan.recommended && (
                          <div style={{
                            position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                            background: `linear-gradient(135deg,${ORANGE},#ff8c00)`, color: '#fff',
                            fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20, whiteSpace: 'nowrap',
                            boxShadow: '0 4px 12px rgba(254,95,1,0.4)',
                          }}>
                            RECOMMENDED
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: '50%',
                            border: `2px solid ${selectedPlan === plan.id ? ORANGE : '#cbd5e1'}`,
                            background: selectedPlan === plan.id ? ORANGE : '#fff',
                            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {selectedPlan === plan.id && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                          </div>
                          <span style={{ fontWeight: 800, fontSize: 15, color: NAVY }}>{plan.name}</span>
                        </div>
                        <div style={{ marginBottom: 4 }}>
                          {plan.originalPrice && (
                            <div style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: 13 }}>{plan.originalPrice}</div>
                          )}
                          <span style={{ fontSize: 'clamp(16px,3vw,20px)', fontWeight: 800, color: plan.price === 0 ? '#22c55e' : ORANGE }}>{plan.priceLabel}</span>
                          <span style={{ color: '#64748b', fontSize: 12 }}> {plan.period}</span>
                        </div>
                        <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 12px' }}>{plan.desc}</p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {plan.features.map(f => (
                            <li key={f} style={{ fontSize: 12, color: '#475569', marginBottom: 4, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                              <span style={{ color: '#22c55e', fontWeight: 800, marginTop: 1 }}>✓</span>{f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={handleNext} style={btnPrimaryStyle}>
                  Tiếp tục <span style={{ marginLeft: 6 }}>→</span>
                </button>
              </div>
            )}

            {/* ══════ STEP 2 ══════ */}
            {step === 2 && (
              <div style={{ padding: 'clamp(24px,5vw,48px)' }}>
                <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 14, padding: '0 0 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  ← Quay lại
                </button>
                <h2 style={{ color: NAVY, fontWeight: 800, fontSize: 22, margin: '0 0 6px' }}>Thanh toán</h2>
                <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 28px' }}>Chuyển khoản và upload ảnh xác nhận để chúng tôi duyệt nhanh.</p>

                {/* Order summary */}
                <div style={{ background: 'linear-gradient(135deg,#f0f4ff,#e8f0ff)', border: '1px solid #c7d7ff', borderRadius: 14, padding: '20px 24px', marginBottom: 28 }}>
                  <div style={{ fontWeight: 700, color: NAVY, fontSize: 14, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tóm tắt đơn hàng</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                    {[
                      ['Gói đã chọn', `${planObj.name} (${billingTab === 'thang' ? 'Theo tháng' : billingTab === 'nam' ? 'Theo năm' : 'Dùng thử'})`],
                      ['Giá', planObj.priceLabel],
                      ['Họ tên', form.hoTen],
                      ['Số điện thoại', form.sdt],
                      ['Email', form.email],
                      ...(form.tenShop ? [['Shop/Công ty', form.tenShop]] : []),
                      ...(form.maGioiThieu ? [['Mã giới thiệu', form.maGioiThieu]] : []),
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 2 }}>{k}</div>
                        <div style={{ fontSize: 14, color: NAVY, fontWeight: 600 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bank info */}
                <div style={{ background: '#fff', border: `2px solid ${ORANGE}`, borderRadius: 16, padding: '24px', marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                    <div style={{ width: 36, height: 36, background: `linear-gradient(135deg,${ORANGE},#ff8c00)`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏦</div>
                    <div>
                      <div style={{ fontWeight: 800, color: NAVY, fontSize: 16 }}>Thông tin chuyển khoản</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>Chuyển khoản đúng nội dung để duyệt tự động</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {[
                      { label: 'Ngân hàng', value: 'MB Bank (Ngân hàng Quân đội)', highlight: false },
                      { label: 'Số tài khoản', value: '0123456789', highlight: true, copy: true },
                      { label: 'Tên tài khoản', value: 'GO MEDIA VIETNAM', highlight: false },
                      { label: 'Nội dung CK', value: ckContent, highlight: true, copy: true },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: row.highlight ? '#fff7f3' : '#f8fafc', borderRadius: 10, gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{row.label}</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: row.highlight ? ORANGE : NAVY, marginTop: 2 }}>{row.value}</div>
                        </div>
                        {row.copy && (
                          <button onClick={() => navigator.clipboard?.writeText(row.value)} style={{ background: NAVY, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            Copy
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 10, padding: '12px 16px', marginTop: 16, fontSize: 13, color: '#856404' }}>
                    <strong>VD nội dung:</strong> GMAP 0912345678 BUSINESS
                  </div>
                </div>

                {/* Upload */}
                <div style={{ marginBottom: 28 }}>
                  <label style={{ ...labelStyle, fontSize: 15, marginBottom: 10 }}>
                    Upload ảnh xác nhận chuyển khoản <span style={{ color: ORANGE }}>*</span>
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${previewImg ? ORANGE : '#cbd5e1'}`, borderRadius: 16, padding: '32px 20px',
                      textAlign: 'center', cursor: 'pointer', background: previewImg ? '#fff7f3' : '#f8fafc',
                      transition: 'all 0.2s',
                    }}
                  >
                    {previewImg ? (
                      <div>
                        <img src={previewImg} alt="preview" style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 10, marginBottom: 10 }} />
                        <div style={{ fontSize: 13, color: '#22c55e', fontWeight: 700 }}>✓ Ảnh đã chọn — nhấn để đổi ảnh</div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 36, marginBottom: 10 }}>📤</div>
                        <div style={{ fontWeight: 700, color: NAVY, marginBottom: 4 }}>Nhấn để chọn ảnh</div>
                        <div style={{ fontSize: 13, color: '#94a3b8' }}>PNG, JPG, HEIC — tối đa 10MB</div>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                </div>

                <button onClick={handleSubmit} disabled={submitting} style={{ ...btnPrimaryStyle, opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Đang gửi...' : 'Đã thanh toán, gửi xác nhận ✓'}
                </button>
              </div>
            )}

            {/* ══════ STEP 3 ══════ */}
            {step === 3 && (
              <div style={{ padding: 'clamp(24px,5vw,56px)', textAlign: 'center' }}>
                <div style={{ fontSize: 72, marginBottom: 16, animation: 'bounce 0.6s ease' }}>🎉</div>
                <h2 style={{ color: NAVY, fontWeight: 800, fontSize: 28, margin: '0 0 12px' }}>Đã nhận đơn thành công!</h2>
                <p style={{ color: '#475569', fontSize: 16, maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.7 }}>
                  Key kích hoạt sẽ được gửi qua <strong>Zalo</strong> hoặc <strong>Email</strong> trong vòng <strong>15–30 phút</strong> sau khi xác nhận thanh toán.
                </p>
                <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1px solid #86efac', borderRadius: 14, padding: '20px 28px', maxWidth: 440, margin: '0 auto 36px' }}>
                  <div style={{ fontSize: 13, color: '#166534' }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Thông tin đã gửi:</div>
                    <div>Email: <strong>{form.email}</strong></div>
                    <div>SĐT: <strong>{form.sdt}</strong></div>
                    <div>Gói: <strong>{planObj.name}</strong></div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <a href="/tai-xuong" style={btnPrimaryStyle}>
                    Tải xuống ngay →
                  </a>
                  <a href="/" style={{ ...btnOutlineStyle }}>
                    Về trang chủ
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* ─── FAQ ─── */}
          {step < 3 && (
            <div style={{ marginTop: 48 }}>
              <h3 style={{ color: NAVY, fontWeight: 800, fontSize: 20, marginBottom: 16, textAlign: 'center' }}>Câu hỏi thường gặp</h3>
              <div style={{ display: 'grid', gap: 10 }}>
                {FAQS.map((faq, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '16px 20px', background: 'none', border: 'none',
                        cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                        fontWeight: 700, color: NAVY, fontSize: 15,
                      }}
                    >
                      {faq.q}
                      <span style={{ fontSize: 20, color: ORANGE, flexShrink: 0, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
                    </button>
                    {openFaq === i && (
                      <div style={{ padding: '0 20px 16px', color: '#475569', fontSize: 14, lineHeight: 1.7 }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <style>{`
        @keyframes bounce { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        * { box-sizing: border-box; }
        input:focus { outline: none; border-color: ${ORANGE} !important; box-shadow: 0 0 0 3px rgba(254,95,1,0.12); }
        @media (max-width: 520px) {
          .plan-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}

const labelStyle = { display: 'block', fontWeight: 700, color: '#1e293b', fontSize: 14, marginBottom: 6 }
const inputStyle = {
  width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0',
  borderRadius: 10, fontSize: 15, color: '#1e293b', background: '#fff',
  transition: 'border-color 0.2s, box-shadow 0.2s',
}
const btnPrimaryStyle = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  background: `linear-gradient(135deg,${ORANGE},#ff8c00)`,
  color: '#fff', border: 'none', borderRadius: 12,
  padding: '14px 32px', fontSize: 16, fontWeight: 800,
  cursor: 'pointer', textDecoration: 'none',
  boxShadow: '0 6px 20px rgba(254,95,1,0.35)',
  transition: 'all 0.2s',
}
const btnOutlineStyle = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', color: NAVY,
  border: `2px solid ${NAVY}`, borderRadius: 12,
  padding: '14px 32px', fontSize: 16, fontWeight: 700,
  cursor: 'pointer', textDecoration: 'none',
  transition: 'all 0.2s',
}
