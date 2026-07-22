import { useState, useEffect } from 'react'
import Head from 'next/head'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Reveal from '../components/Reveal'
import { useLang } from '../lib/LangContext'
import { useAuth } from '../lib/AuthContext'
import { useRouter } from 'next/router'

const PLANS_DATA = {
  thang: [
    { id: 'ca-nhan',      plan: 'personal', name: 'Cá nhân',     nameEN: 'Personal', price: 180000,  days: 30,   features: ['1 Admin + 1 Nhân viên', 'Không giới hạn tài khoản ads', '5 lần kiểm tra vi phạm/ngày', 'Hỗ trợ kỹ thuật 24/7'],            featuresEN: ['1 Admin + 1 Staff', 'Unlimited Ad Accounts', '5 policy checks/day', '24/7 tech support'], recommended: false },
    { id: 'doanh-nghiep', plan: 'business', name: 'Doanh nghiệp', nameEN: 'Business', price: 390000,  days: 30,   features: ['2 Admin + 5 Nhân viên', 'Không giới hạn tài khoản ads', '10 lần kiểm tra vi phạm/ngày', 'Tất cả tính năng Personal'],              featuresEN: ['2 Admins + 5 Staff', 'Unlimited Ad Accounts', '10 policy checks/day', 'All Personal features'], recommended: true  },
    { id: 'agency',       plan: 'agency',   name: 'Agency',       nameEN: 'Agency',   price: 890000,  days: 30,   features: ['6 Admin + Không giới hạn NV', 'Không giới hạn tài khoản ads', '30 lần kiểm tra vi phạm/ngày', 'Tất cả tính năng Business'], featuresEN: ['6 Admins + Unlimited Staff', 'Unlimited Ad Accounts', '30 policy checks/day', 'All Business features'], recommended: false },
  ],
  nam1: [
    { id: 'ca-nhan',      plan: 'personal', name: 'Cá nhân',     nameEN: 'Personal', price: 1728000, days: 365,  saving: '-20%', recommended: false,
      features: ['1 Admin + 1 Nhân viên', 'Không giới hạn tài khoản ads', '5 lần kiểm tra vi phạm/ngày', 'Hỗ trợ kỹ thuật 24/7'],
      featuresEN: ['1 Admin + 1 Staff', 'Unlimited Ad Accounts', '5 policy checks/day', '24/7 tech support'] },
    { id: 'doanh-nghiep', plan: 'business', name: 'Doanh nghiệp', nameEN: 'Business', price: 3744000, days: 365,  saving: '-20%', recommended: true,
      features: ['2 Admin + 5 Nhân viên', 'Không giới hạn tài khoản ads', '10 lần kiểm tra vi phạm/ngày', 'Tất cả tính năng Personal'],
      featuresEN: ['2 Admins + 5 Staff', 'Unlimited Ad Accounts', '10 policy checks/day', 'All Personal features'] },
    { id: 'agency',       plan: 'agency',   name: 'Agency',       nameEN: 'Agency',   price: 8544000, days: 365,  saving: '-20%', recommended: false,
      features: ['6 Admin + Không giới hạn NV', 'Không giới hạn tài khoản ads', '30 lần kiểm tra vi phạm/ngày', 'Tất cả tính năng Business'],
      featuresEN: ['6 Admins + Unlimited Staff', 'Unlimited Ad Accounts', '30 policy checks/day', 'All Business features'] },
  ],
  nam3: [
    { id: 'ca-nhan',      plan: 'personal', name: 'Cá nhân',     nameEN: 'Personal', price: 4536000,  days: 1095, saving: '-30%', recommended: false,
      features: ['1 Admin + 1 Nhân viên', 'Không giới hạn tài khoản ads', '5 lần kiểm tra vi phạm/ngày', 'Hỗ trợ kỹ thuật 24/7'],
      featuresEN: ['1 Admin + 1 Staff', 'Unlimited Ad Accounts', '5 policy checks/day', '24/7 tech support'] },
    { id: 'doanh-nghiep', plan: 'business', name: 'Doanh nghiệp', nameEN: 'Business', price: 9828000,  days: 1095, saving: '-30%', recommended: true,
      features: ['2 Admin + 5 Nhân viên', 'Không giới hạn tài khoản ads', '10 lần kiểm tra vi phạm/ngày', 'Tất cả tính năng Personal'],
      featuresEN: ['2 Admins + 5 Staff', 'Unlimited Ad Accounts', '10 policy checks/day', 'All Personal features'] },
    { id: 'agency',       plan: 'agency',   name: 'Agency',       nameEN: 'Agency',   price: 22428000, days: 1095, saving: '-30%', recommended: false,
      features: ['6 Admin + Không giới hạn NV', 'Không giới hạn tài khoản ads', '30 lần kiểm tra vi phạm/ngày', 'Tất cả tính năng Business'],
      featuresEN: ['6 Admins + Unlimited Staff', 'Unlimited Ad Accounts', '30 policy checks/day', 'All Business features'] },
  ],
  nam5: [
    { id: 'ca-nhan',      plan: 'personal', name: 'Cá nhân',     nameEN: 'Personal', price: 6480000,  days: 1825, saving: '-40%', recommended: false,
      features: ['1 Admin + 1 Nhân viên', 'Không giới hạn tài khoản ads', '5 lần kiểm tra vi phạm/ngày', 'Hỗ trợ kỹ thuật 24/7'],
      featuresEN: ['1 Admin + 1 Staff', 'Unlimited Ad Accounts', '5 policy checks/day', '24/7 tech support'] },
    { id: 'doanh-nghiep', plan: 'business', name: 'Doanh nghiệp', nameEN: 'Business', price: 14040000, days: 1825, saving: '-40%', recommended: true,
      features: ['2 Admin + 5 Nhân viên', 'Không giới hạn tài khoản ads', '10 lần kiểm tra vi phạm/ngày', 'Tất cả tính năng Personal'],
      featuresEN: ['2 Admins + 5 Staff', 'Unlimited Ad Accounts', '10 policy checks/day', 'All Personal features'] },
    { id: 'agency',       plan: 'agency',   name: 'Agency',       nameEN: 'Agency',   price: 32040000, days: 1825, saving: '-40%', recommended: false,
      features: ['6 Admin + Không giới hạn NV', 'Không giới hạn tài khoản ads', '30 lần kiểm tra vi phạm/ngày', 'Tất cả tính năng Business'],
      featuresEN: ['6 Admins + Unlimited Staff', 'Unlimited Ad Accounts', '30 policy checks/day', 'All Business features'] },
  ],
}

const FAQS_VI = [
  { q: 'Sau khi thanh toán bao lâu thì tài khoản được kích hoạt?', a: 'Ngay lập tức! Hệ thống PayOS tự động xử lý và kích hoạt gói trong vài giây sau khi thanh toán thành công.' },
  { q: 'Có thể nâng cấp gói lên không?', a: 'Có. Bạn quay lại trang này chọn gói cao hơn và thanh toán. Thời hạn sẽ được cộng thêm theo số ngày tương ứng.' },
  { q: 'Thanh toán bằng phương thức nào?', a: 'PayOS hỗ trợ tất cả ngân hàng Việt Nam, ví điện tử (Momo, ZaloPay), và quét QR Code. An toàn và nhanh chóng.' },
  { q: 'Có hoàn tiền nếu không hài lòng không?', a: 'Chúng tôi có gói dùng thử 3 ngày miễn phí để trải nghiệm. Sau khi mua, chúng tôi không hỗ trợ hoàn tiền.' },
]

const FAQS_EN = [
  { q: 'How soon is my account activated after payment?', a: 'Immediately! PayOS automatically processes and activates your plan within seconds of successful payment.' },
  { q: 'Can I upgrade my plan?', a: 'Yes. Come back to this page, choose a higher plan and pay. The duration will be added on top of your remaining time.' },
  { q: 'What payment methods are accepted?', a: 'PayOS supports all Vietnamese banks, e-wallets (Momo, ZaloPay), and QR Code. Safe and fast.' },
  { q: 'Is there a refund if I am not satisfied?', a: 'We offer a free 3-day trial to experience everything. After purchase, we do not support refunds.' },
]

function fmt(n) {
  return n.toLocaleString('vi-VN') + 'đ'
}

export default function MuaGoi() {
  const { lang } = useLang()
  const isEN = lang === 'en'
  const { user } = useAuth()
  const router = useRouter()

  const FAQS = isEN ? FAQS_EN : FAQS_VI

  const [billingTab, setBillingTab] = useState('thang')
  const [selectedPlan, setSelectedPlan] = useState('doanh-nghiep')
  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [openFaq, setOpenFaq] = useState(null)

  const currentPlans = PLANS_DATA[billingTab] || PLANS_DATA.thang
  const planObj = currentPlans.find(p => p.id === selectedPlan) || currentPlans[1]

  const billingTabs = isEN
    ? [{ key: 'thang', label: 'Monthly' }, { key: 'nam1', label: '1 Year (-20%)' }, { key: 'nam3', label: '3 Years (-30%)' }, { key: 'nam5', label: '5 Years (-40%)' }]
    : [{ key: 'thang', label: 'Theo tháng' }, { key: 'nam1', label: 'Theo năm (-20%)' }, { key: 'nam3', label: '3 năm (-30%)' }, { key: 'nam5', label: '5 năm (-40%)' }]

  async function handleCheckout() {
    if (!user) {
      router.push('/login?next=/mua-goi')
      return
    }
    setError('')
    setLoading(true)
    try {
      const r = await fetch('/api/payment/payos-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: planObj.id,
          billing_tab: billingTab,
          buyer_name: buyerName || user.name || '',
          buyer_phone: buyerPhone || user.phone || '',
        }),
      })
      const d = await r.json()
      if (!d.ok) { setError(d.error || 'Lỗi tạo link thanh toán'); return }
      window.location.href = d.checkoutUrl
    } catch (e) {
      setError('Lỗi kết nối: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Go Meta Ads Pro</title>
      </Head>
      <Navbar />

      <main style={{ background: '#f1f5f9', minHeight: '100vh' }}>
        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #0c2a72 0%, #1a3a8f 100%)',
          textAlign: 'center',
          paddingTop: 'calc(var(--header-h) + 48px)',
          paddingBottom: 48,
          paddingLeft: 20,
          paddingRight: 20,
        }}>
          <h1 style={{ color: '#fff', fontSize: 'clamp(22px,4vw,34px)', fontWeight: 800, margin: '0 0 10px' }}>
            {isEN ? 'Simple, transparent pricing' : 'Bảng giá đơn giản, minh bạch'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 15, margin: 0 }}>
            {isEN ? 'Instant activation via PayOS • Cancel anytime' : 'Kích hoạt tức thì qua PayOS • Không ràng buộc hợp đồng'}
          </p>
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px 80px' }}>

          {/* Billing tabs */}
          <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: 14, padding: 4, gap: 4, marginBottom: 28, flexWrap: 'wrap' }}>
            {billingTabs.map(tab => (
              <button key={tab.key} onClick={() => setBillingTab(tab.key)} style={{
                flex: 1, padding: '10px 12px', borderRadius: 10, border: 'none',
                cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                background: billingTab === tab.key ? '#0c2a72' : 'transparent',
                color: billingTab === tab.key ? '#fff' : '#64748b',
                transition: 'all .2s', whiteSpace: 'nowrap',
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Plan cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16, marginBottom: 32 }}>
            {currentPlans.map(plan => (
              <div key={plan.id} onClick={() => setSelectedPlan(plan.id)} style={{
                border: `2px solid ${selectedPlan === plan.id ? '#fe5f01' : '#e2e8f0'}`,
                borderRadius: 16, padding: '24px 20px', cursor: 'pointer',
                position: 'relative', background: '#fff',
                boxShadow: selectedPlan === plan.id ? '0 8px 32px rgba(254,95,1,.15)' : 'none',
                transition: 'all .2s',
              }}>
                {plan.recommended && (
                  <div style={{
                    position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg,#fe5f01,#ff8c00)',
                    color: '#fff', fontSize: 11, fontWeight: 800,
                    padding: '4px 14px', borderRadius: 20, whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(254,95,1,.4)',
                  }}>RECOMMENDED</div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: `2px solid ${selectedPlan === plan.id ? '#fe5f01' : '#e2e8f0'}`,
                    background: selectedPlan === plan.id ? '#fe5f01' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {selectedPlan === plan.id && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 16, color: '#0c2a72' }}>
                    {isEN ? plan.nameEN : plan.name}
                  </span>
                  {plan.saving && (
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '2px 8px' }}>
                      {plan.saving}
                    </span>
                  )}
                </div>
                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: '#fe5f01' }}>{fmt(plan.price)}</span>
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>
                    {' '}/{billingTab === 'thang' ? (isEN ? 'mo' : 'tháng')
                       : billingTab === 'nam1' ? (isEN ? 'year' : 'năm')
                       : billingTab === 'nam3' ? (isEN ? '3 years' : '3 năm')
                       : (isEN ? '5 years' : '5 năm')}
                  </span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {(isEN ? plan.featuresEN : plan.features).map(f => (
                    <li key={f} style={{ fontSize: 13, color: '#64748b', marginBottom: 6, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                      <span style={{ color: '#22c55e', fontWeight: 800 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Checkout card */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,.1)', padding: '28px 32px', marginBottom: 32 }}>
            <h2 style={{ color: '#0c2a72', fontWeight: 800, fontSize: 18, marginBottom: 20 }}>
              {isEN ? 'Complete your order' : 'Hoàn tất đơn hàng'}
            </h2>

            {/* Order summary */}
            <div style={{ background: 'linear-gradient(135deg,#0c2a72,#1a3a8f)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, color: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, opacity: .7, marginBottom: 4 }}>{isEN ? 'Plan' : 'Gói'}</div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{isEN ? planObj.nameEN : planObj.name}</div>
                  <div style={{ fontSize: 12, opacity: .6, marginTop: 2 }}>
                    {billingTabs.find(t => t.key === billingTab)?.label}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, opacity: .7, marginBottom: 4 }}>{isEN ? 'Total' : 'Tổng cộng'}</div>
                  <div style={{ fontWeight: 800, fontSize: 20, color: '#fbbf24' }}>{fmt(planObj.price)}</div>
                </div>
              </div>
            </div>

            {/* Buyer info (optional) */}
            {!user && (
              <div style={{ background: '#fffbeb', border: '1px solid rgba(245,158,11,.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#78350f' }}>
                <strong>Lưu ý:</strong> Bạn cần <a href="/login?next=/mua-goi" style={{ color: '#fe5f01', fontWeight: 700 }}>đăng nhập</a> hoặc <a href="/register" style={{ color: '#fe5f01', fontWeight: 700 }}>tạo tài khoản</a> trước khi thanh toán.
              </div>
            )}

            {user && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    {isEN ? 'Full name' : 'Họ và tên'}
                  </label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={e => setBuyerName(e.target.value)}
                    placeholder={user.name || ''}
                    style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '10px 13px', fontSize: 14, color: '#1a2332', background: '#f8faff', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    {isEN ? 'Phone' : 'Số điện thoại'}
                  </label>
                  <input
                    type="tel"
                    value={buyerPhone}
                    onChange={e => setBuyerPhone(e.target.value)}
                    placeholder={user.phone || '0912 345 678'}
                    style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '10px 13px', fontSize: 14, color: '#1a2332', background: '#f8faff', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            )}

            {error && (
              <div style={{ background: 'rgba(255,69,96,.08)', border: '1px solid rgba(255,69,96,.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading}
              style={{
                width: '100%', background: loading ? '#94a3b8' : '#fe5f01',
                color: '#fff', border: 'none', borderRadius: 12,
                padding: 16, fontSize: 17, fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'opacity .15s',
              }}
            >
              {loading
                ? (isEN ? '⏳ Redirecting...' : '⏳ Đang chuyển trang...')
                : user
                  ? (isEN ? `Pay ${fmt(planObj.price)} via PayOS →` : `Thanh toán ${fmt(planObj.price)} qua PayOS →`)
                  : (isEN ? '🔐 Login to continue →' : '🔐 Đăng nhập để tiếp tục →')
              }
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 14, color: '#94a3b8', fontSize: 12 }}>
              <span>🔒</span>
              <span>{isEN ? 'Secured by PayOS · All major Vietnamese banks & e-wallets' : 'Bảo mật bởi PayOS · Hỗ trợ tất cả ngân hàng & ví điện tử Việt Nam'}</span>
            </div>
          </div>

          {/* FAQ */}
          <Reveal delay={100}>
            <div style={{ background: '#f1f5f9', borderRadius: 16, padding: '32px 28px' }}>
              <h3 style={{ color: '#0c2a72', fontWeight: 800, fontSize: 20, marginBottom: 20, textAlign: 'center' }}>
                {isEN ? 'Frequently Asked Questions' : 'Câu hỏi thường gặp'}
              </h3>
              {FAQS.map((faq, i) => (
                <div key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{
                      width: '100%', background: 'none', border: 'none', textAlign: 'left',
                      padding: '16px 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                      fontWeight: 700, fontSize: 15, color: '#1a2332', fontFamily: 'inherit',
                    }}
                  >
                    {faq.q}
                    <span style={{ color: '#fe5f01', fontSize: 20, lineHeight: 1, flexShrink: 0, marginLeft: 12 }}>
                      {openFaq === i ? '−' : '+'}
                    </span>
                  </button>
                  {openFaq === i && (
                    <div style={{ paddingBottom: 16, fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </main>

      <Footer />
    </>
  )
}
