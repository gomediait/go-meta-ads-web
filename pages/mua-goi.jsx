import { useState, useRef } from 'react'
import Head from 'next/head'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Reveal from '../components/Reveal'
import { useLang } from '../lib/LangContext'

const PLANS_VI = {
  thang: [
    {
      id: 'ca-nhan',
      name: 'Cá nhân',
      price: 180000,
      priceLabel: '180.000đ',
      period: '/tháng',
      desc: 'Dành cho cá nhân chạy ads',
      features: ['1 Admin + 1 Nhân viên', 'Không giới hạn tài khoản ads', 'Đồng bộ CPA cơ bản', 'Hỗ trợ Zalo'],
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
  nam1: [
    {
      id: 'ca-nhan',
      name: 'Cá nhân',
      price: 1728000,
      priceLabel: '1.728.000đ',
      priceMonthly: '144.000đ/tháng',
      period: '/năm',
      originalPrice: '2.160.000đ',
      savingLabel: 'Tiết kiệm 432.000đ so với tháng',
      desc: 'Dành cho cá nhân chạy ads',
      features: ['1 Admin + 1 Nhân viên', 'Không giới hạn tài khoản ads', 'Đồng bộ CPA cơ bản', 'Hỗ trợ Zalo'],
      recommended: false,
    },
    {
      id: 'doanh-nghiep',
      name: 'Doanh nghiệp',
      price: 4800000,
      priceLabel: '4.800.000đ',
      priceMonthly: '400.000đ/tháng',
      period: '/năm',
      originalPrice: '6.000.000đ',
      savingLabel: 'Tiết kiệm 1.200.000đ so với tháng',
      desc: 'Phù hợp team 5–10 người',
      features: ['2 Admin + 5 Nhân viên', 'Không giới hạn sản phẩm', 'Báo cáo nâng cao', 'Cảnh báo tự động', 'Hỗ trợ ưu tiên'],
      recommended: true,
    },
    {
      id: 'agency',
      name: 'Agency',
      price: 11520000,
      priceLabel: '11.520.000đ',
      priceMonthly: '960.000đ/tháng',
      period: '/năm',
      originalPrice: '14.400.000đ',
      savingLabel: 'Tiết kiệm 2.880.000đ so với tháng',
      desc: 'Cho agency & team lớn',
      features: ['6 Admin', 'Không giới hạn nhân viên', 'Không giới hạn sản phẩm', 'Báo cáo agency', 'Onboarding riêng', 'SLA 24/7'],
      recommended: false,
    },
  ],
  nam3: [
    {
      id: 'ca-nhan',
      name: 'Cá nhân',
      price: 4536000,
      priceLabel: '4.536.000đ',
      priceMonthly: '126.000đ/tháng',
      period: '/3 năm',
      originalPrice: '6.480.000đ',
      savingLabel: 'Tiết kiệm 1.944.000đ so với tháng',
      fomoLabel: 'Còn 8 slot giá này',
      desc: 'Dành cho cá nhân chạy ads',
      features: ['1 Admin + 1 Nhân viên', 'Không giới hạn tài khoản ads', 'Đồng bộ CPA cơ bản', 'Hỗ trợ Zalo'],
      recommended: false,
    },
    {
      id: 'doanh-nghiep',
      name: 'Doanh nghiệp',
      price: 12600000,
      priceLabel: '12.600.000đ',
      priceMonthly: '350.000đ/tháng',
      period: '/3 năm',
      originalPrice: '18.000.000đ',
      savingLabel: 'Tiết kiệm 5.400.000đ so với tháng',
      fomoLabel: 'Còn 5 slot giá này',
      desc: 'Phù hợp team 5–10 người',
      features: ['2 Admin + 5 Nhân viên', 'Không giới hạn sản phẩm', 'Báo cáo nâng cao', 'Cảnh báo tự động', 'Hỗ trợ ưu tiên'],
      recommended: true,
    },
    {
      id: 'agency',
      name: 'Agency',
      price: 30240000,
      priceLabel: '30.240.000đ',
      priceMonthly: '840.000đ/tháng',
      period: '/3 năm',
      originalPrice: '43.200.000đ',
      savingLabel: 'Tiết kiệm 12.960.000đ so với tháng',
      fomoLabel: 'Còn 3 slot giá này',
      desc: 'Cho agency & team lớn',
      features: ['6 Admin', 'Không giới hạn nhân viên', 'Không giới hạn sản phẩm', 'Báo cáo agency', 'Onboarding riêng', 'SLA 24/7'],
      recommended: false,
    },
  ],
  nam5: [
    {
      id: 'ca-nhan',
      name: 'Cá nhân',
      price: 6480000,
      priceLabel: '6.480.000đ',
      priceMonthly: '108.000đ/tháng',
      period: '/5 năm',
      originalPrice: '10.800.000đ',
      savingLabel: 'Tiết kiệm 4.320.000đ so với tháng',
      fomoLabel: 'Còn 5 slot giá này',
      desc: 'Dành cho cá nhân chạy ads',
      features: ['1 Admin + 1 Nhân viên', 'Không giới hạn tài khoản ads', 'Đồng bộ CPA cơ bản', 'Hỗ trợ Zalo'],
      recommended: false,
    },
    {
      id: 'doanh-nghiep',
      name: 'Doanh nghiệp',
      price: 18000000,
      priceLabel: '18.000.000đ',
      priceMonthly: '300.000đ/tháng',
      period: '/5 năm',
      originalPrice: '30.000.000đ',
      savingLabel: 'Tiết kiệm 12.000.000đ so với tháng',
      fomoLabel: 'Còn 3 slot giá này',
      desc: 'Phù hợp team 5–10 người',
      features: ['2 Admin + 5 Nhân viên', 'Không giới hạn sản phẩm', 'Báo cáo nâng cao', 'Cảnh báo tự động', 'Hỗ trợ ưu tiên'],
      recommended: true,
    },
    {
      id: 'agency',
      name: 'Agency',
      price: 43200000,
      priceLabel: '43.200.000đ',
      priceMonthly: '720.000đ/tháng',
      period: '/5 năm',
      originalPrice: '72.000.000đ',
      savingLabel: 'Tiết kiệm 28.800.000đ so với tháng',
      fomoLabel: 'Còn 2 slot giá này',
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
      period: '1 ngày',
      desc: 'Trải nghiệm toàn bộ tính năng',
      features: ['Đầy đủ tính năng Doanh nghiệp', 'Không cần thẻ tín dụng', 'Hỗ trợ onboarding', 'Hết hạn sau 1 ngày'],
      recommended: false,
    },
  ],
}

const PLANS_EN = {
  thang: [
    {
      id: 'ca-nhan',
      name: 'Personal',
      price: 180000,
      priceLabel: '180.000đ',
      period: '/month',
      desc: 'For solo ads runners',
      features: ['1 Admin + 1 Staff', 'Unlimited ad accounts', 'Basic CPA sync', 'Zalo support'],
      recommended: false,
    },
    {
      id: 'doanh-nghiep',
      name: 'Business',
      price: 500000,
      priceLabel: '500.000đ',
      period: '/month',
      desc: 'Ideal for teams of 5–10',
      features: ['2 Admin + 5 Staff', 'Unlimited products', 'Advanced reports', 'Auto alerts', 'Priority support'],
      recommended: true,
    },
    {
      id: 'agency',
      name: 'Agency',
      price: 1200000,
      priceLabel: '1.200.000đ',
      period: '/month',
      desc: 'For agencies & large teams',
      features: ['6 Admin', 'Unlimited staff', 'Unlimited products', 'Agency reports', 'Private onboarding', 'SLA 24/7'],
      recommended: false,
    },
  ],
  nam1: [
    {
      id: 'ca-nhan',
      name: 'Personal',
      price: 1728000,
      priceLabel: '1.728.000đ',
      priceMonthly: '144.000đ/mo',
      period: '/year',
      originalPrice: '2.160.000đ',
      savingLabel: 'Save 432.000đ vs monthly',
      desc: 'For solo ads runners',
      features: ['1 Admin + 1 Staff', 'Unlimited ad accounts', 'Basic CPA sync', 'Zalo support'],
      recommended: false,
    },
    {
      id: 'doanh-nghiep',
      name: 'Business',
      price: 4800000,
      priceLabel: '4.800.000đ',
      priceMonthly: '400.000đ/mo',
      period: '/year',
      originalPrice: '6.000.000đ',
      savingLabel: 'Save 1.200.000đ vs monthly',
      desc: 'Ideal for teams of 5–10',
      features: ['2 Admin + 5 Staff', 'Unlimited products', 'Advanced reports', 'Auto alerts', 'Priority support'],
      recommended: true,
    },
    {
      id: 'agency',
      name: 'Agency',
      price: 11520000,
      priceLabel: '11.520.000đ',
      priceMonthly: '960.000đ/mo',
      period: '/year',
      originalPrice: '14.400.000đ',
      savingLabel: 'Save 2.880.000đ vs monthly',
      desc: 'For agencies & large teams',
      features: ['6 Admin', 'Unlimited staff', 'Unlimited products', 'Agency reports', 'Private onboarding', 'SLA 24/7'],
      recommended: false,
    },
  ],
  nam3: [
    {
      id: 'ca-nhan',
      name: 'Personal',
      price: 4536000,
      priceLabel: '4.536.000đ',
      priceMonthly: '126.000đ/mo',
      period: '/3 years',
      originalPrice: '6.480.000đ',
      savingLabel: 'Save 1.944.000đ vs monthly',
      fomoLabel: '8 slots left at this price',
      desc: 'For solo ads runners',
      features: ['1 Admin + 1 Staff', 'Unlimited ad accounts', 'Basic CPA sync', 'Zalo support'],
      recommended: false,
    },
    {
      id: 'doanh-nghiep',
      name: 'Business',
      price: 12600000,
      priceLabel: '12.600.000đ',
      priceMonthly: '350.000đ/mo',
      period: '/3 years',
      originalPrice: '18.000.000đ',
      savingLabel: 'Save 5.400.000đ vs monthly',
      fomoLabel: '5 slots left at this price',
      desc: 'Ideal for teams of 5–10',
      features: ['2 Admin + 5 Staff', 'Unlimited products', 'Advanced reports', 'Auto alerts', 'Priority support'],
      recommended: true,
    },
    {
      id: 'agency',
      name: 'Agency',
      price: 30240000,
      priceLabel: '30.240.000đ',
      priceMonthly: '840.000đ/mo',
      period: '/3 years',
      originalPrice: '43.200.000đ',
      savingLabel: 'Save 12.960.000đ vs monthly',
      fomoLabel: '3 slots left at this price',
      desc: 'For agencies & large teams',
      features: ['6 Admin', 'Unlimited staff', 'Unlimited products', 'Agency reports', 'Private onboarding', 'SLA 24/7'],
      recommended: false,
    },
  ],
  nam5: [
    {
      id: 'ca-nhan',
      name: 'Personal',
      price: 6480000,
      priceLabel: '6.480.000đ',
      priceMonthly: '108.000đ/mo',
      period: '/5 years',
      originalPrice: '10.800.000đ',
      savingLabel: 'Save 4.320.000đ vs monthly',
      fomoLabel: '5 slots left at this price',
      desc: 'For solo ads runners',
      features: ['1 Admin + 1 Staff', 'Unlimited ad accounts', 'Basic CPA sync', 'Zalo support'],
      recommended: false,
    },
    {
      id: 'doanh-nghiep',
      name: 'Business',
      price: 18000000,
      priceLabel: '18.000.000đ',
      priceMonthly: '300.000đ/mo',
      period: '/5 years',
      originalPrice: '30.000.000đ',
      savingLabel: 'Save 12.000.000đ vs monthly',
      fomoLabel: '3 slots left at this price',
      desc: 'Ideal for teams of 5–10',
      features: ['2 Admin + 5 Staff', 'Unlimited products', 'Advanced reports', 'Auto alerts', 'Priority support'],
      recommended: true,
    },
    {
      id: 'agency',
      name: 'Agency',
      price: 43200000,
      priceLabel: '43.200.000đ',
      priceMonthly: '720.000đ/mo',
      period: '/5 years',
      originalPrice: '72.000.000đ',
      savingLabel: 'Save 28.800.000đ vs monthly',
      fomoLabel: '2 slots left at this price',
      desc: 'For agencies & large teams',
      features: ['6 Admin', 'Unlimited staff', 'Unlimited products', 'Agency reports', 'Private onboarding', 'SLA 24/7'],
      recommended: false,
    },
  ],
  trial: [
    {
      id: 'thu-nghiem',
      name: 'Free Trial',
      price: 0,
      priceLabel: 'Free',
      period: '1 day',
      desc: 'Experience all features',
      features: ['Full Business features', 'No credit card needed', 'Onboarding support', 'Expires after 1 day'],
      recommended: false,
    },
  ],
}

const FAQS_VI = [
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
    a: 'Chúng tôi có gói dùng thử 1 ngày miễn phí để bạn trải nghiệm trước. Sau khi mua, chúng tôi không hỗ trợ hoàn tiền. Vui lòng dùng thử kỹ trước khi quyết định.',
  },
]

const FAQS_EN = [
  {
    q: 'How long does it take to receive the key?',
    a: 'Once we confirm your payment (usually within business hours), the key will be sent within 15–30 minutes via the Zalo or Email you registered.',
  },
  {
    q: 'Can I change my plan?',
    a: 'Yes. Contact the admin via Zalo to upgrade or downgrade. The price difference will be calculated based on the remaining days of your current plan.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We currently accept bank transfers (MB Bank). After transferring, upload a confirmation screenshot so we can approve quickly.',
  },
  {
    q: 'Is there a refund if I am not satisfied?',
    a: 'We offer a free 1-day trial so you can test everything before purchasing. After purchase, we do not support refunds. Please use the trial thoroughly before deciding.',
  },
]

// Stepper
function Stepper({ step, isEN }) {
  const steps = isEN
    ? [{ n: 1, label: 'Info' }, { n: 2, label: 'Payment' }, { n: 3, label: 'Done' }]
    : [{ n: 1, label: 'Thông tin' }, { n: 2, label: 'Thanh toán' }, { n: 3, label: 'Hoàn tất' }]

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
      {steps.map((s, i) => (
        <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div className={`step-circle ${step > s.n ? 'done' : step === s.n ? 'active' : ''}`}
              style={{ border: step === s.n ? '3px solid rgba(255,255,255,0.5)' : undefined }}>
              {step > s.n ? '✓' : s.n}
            </div>
            <span style={{
              color: step >= s.n ? '#fff' : 'rgba(255,255,255,0.45)',
              fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
            }}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`step-line ${step > s.n ? 'done' : ''}`}
              style={{ width: 'clamp(40px,8vw,80px)', margin: '0 6px', marginBottom: 22 }} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function MuaGoi() {
  const { lang } = useLang()
  const isEN = lang === 'en'

  const PLANS = isEN ? PLANS_EN : PLANS_VI
  const FAQS = isEN ? FAQS_EN : FAQS_VI

  const [step, setStep] = useState(1)
  const [billingTab, setBillingTab] = useState('thang') // 'thang' | 'nam1' | 'nam3' | 'nam5' | 'trial'
  const [selectedPlan, setSelectedPlan] = useState('doanh-nghiep')
  const [form, setForm] = useState({ hoTen: '', sdt: '', email: '', tenShop: '', maGioiThieu: '' })
  const [errors, setErrors] = useState({})
  const [previewImg, setPreviewImg] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)
  const [copiedField, setCopiedField] = useState(null)
  const fileInputRef = useRef(null)

  const currentPlans = PLANS[billingTab]
  const planObj = currentPlans.find(p => p.id === selectedPlan) || currentPlans[0]

  function validate() {
    const e = {}
    if (!form.hoTen.trim()) e.hoTen = isEN ? 'Please enter your full name' : 'Vui lòng nhập họ tên'
    if (!form.sdt.trim()) e.sdt = isEN ? 'Please enter your phone number' : 'Vui lòng nhập số điện thoại'
    else if (!/^[0-9]{9,11}$/.test(form.sdt.replace(/\s/g, ''))) e.sdt = isEN ? 'Invalid phone number' : 'Số điện thoại không hợp lệ'
    if (!form.email.trim()) e.email = isEN ? 'Please enter your email' : 'Vui lòng nhập email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = isEN ? 'Invalid email' : 'Email không hợp lệ'
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
    if (!uploadedFile) {
      alert(isEN ? 'Please upload a payment screenshot' : 'Vui lòng upload ảnh chuyển khoản')
      return
    }
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

  function copyField(text, fieldName) {
    navigator.clipboard?.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 1800)
  }

  const ckContent = `GMAP ${form.sdt} ${planObj?.name?.toUpperCase().replace(/\s/g, '') || 'BUSINESS'}`
  const bankAccount = '[SỐ TÀI KHOẢN - ANH TỰ ĐIỀN]' // placeholder

  const billingTabs = isEN
    ? [
        { key: 'thang', label: 'Monthly' },
        { key: 'nam1', label: '1 Year (-20%)' },
        { key: 'nam3', label: '3 Years (-30%)' },
        { key: 'nam5', label: '5 Years (-40%)' },
        { key: 'trial', label: '1-day Trial' },
      ]
    : [
        { key: 'thang', label: 'Theo tháng' },
        { key: 'nam1', label: 'Theo năm (-20%)' },
        { key: 'nam3', label: '3 năm (-30%)' },
        { key: 'nam5', label: '5 năm (-40%)' },
        { key: 'trial', label: 'Dùng thử 1 ngày' },
      ]

  const summaryBillingLabel = billingTab === 'thang'
    ? (isEN ? 'Monthly' : 'Theo tháng')
    : billingTab === 'nam1'
      ? (isEN ? '1 Year' : '1 năm')
      : billingTab === 'nam3'
        ? (isEN ? '3 Years' : '3 năm')
        : billingTab === 'nam5'
          ? (isEN ? '5 Years' : '5 năm')
          : (isEN ? 'Trial' : 'Dùng thử')

  const bankRows = [
    { label: isEN ? 'Bank' : 'Ngân hàng', value: 'MB Bank (Ngân hàng Quân đội)', highlight: false },
    { label: isEN ? 'Account Number' : 'Số tài khoản', value: bankAccount, highlight: true, copy: 'stk' },
    { label: isEN ? 'Account Name' : 'Tên tài khoản', value: 'GO MEDIA VIETNAM', highlight: false },
    { label: isEN ? 'Transfer Content' : 'Nội dung CK', value: ckContent, highlight: true, copy: 'ck' },
  ]

  const summaryKeys = isEN
    ? ['Selected Plan', 'Price', 'Full Name', 'Phone', 'Email', 'Shop/Company', 'Referral Code']
    : ['Gói đã chọn', 'Giá', 'Họ tên', 'Số điện thoại', 'Email', 'Shop/Công ty', 'Mã giới thiệu']

  return (
    <>
      <Head>
        <title>{isEN ? 'Buy Plan — Go Meta Ads Pro' : 'Mua gói Go Meta Ads Pro'}</title>
        <meta name="description" content={isEN
          ? 'Subscribe to Go Meta Ads Pro — professional Facebook Ads management extension for your team.'
          : 'Đăng ký sử dụng Go Meta Ads Pro — tiện ích quản lý Facebook Ads chuyên nghiệp cho team.'
        } />
      </Head>
      <Navbar />

      <main style={{
        background: 'linear-gradient(180deg, var(--navy) 0%, var(--navy2) 200px, var(--gray) 200px)',
        minHeight: '100vh',
        paddingTop: 'calc(var(--header-h) + 4px)',
      }}>

        {/* Hero strip */}
        <div style={{ textAlign: 'center', padding: '36px 20px 0' }}>
          <h1 style={{ color: '#fff', fontSize: 'clamp(22px,4vw,34px)', fontWeight: 800, margin: '0 0 8px' }}>
            {isEN ? 'Subscribe to Go Meta Ads Pro' : 'Đăng ký Go Meta Ads Pro'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, margin: '0 0 32px' }}>
            {isEN
              ? 'Complete in 3 simple steps — receive key within 30 minutes'
              : 'Hoàn tất trong 3 bước đơn giản — nhận key trong 30 phút'}
          </p>
          <Stepper step={step} isEN={isEN} />
        </div>

        {/* Card */}
        <div style={{ maxWidth: 800, margin: '32px auto 0', padding: '0 16px 80px' }}>
          <div style={{
            background: '#fff', borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-xl)', overflow: 'hidden',
          }}>

            {/* ══════ STEP 1 ══════ */}
            {step === 1 && (
              <div style={{ padding: 'clamp(24px,5vw,48px)' }}>
                <h2 style={{ color: 'var(--navy)', fontWeight: 800, fontSize: 22, margin: '0 0 6px' }}>
                  {isEN ? 'Registration Info' : 'Thông tin đăng ký'}
                </h2>
                <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 32px' }}>
                  {isEN
                    ? 'Fill in all details so we can set up your account.'
                    : 'Điền đầy đủ thông tin để chúng tôi tạo tài khoản cho bạn.'}
                </p>

                {/* Info grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '0 20px' }}>
                  {[
                    {
                      key: 'hoTen',
                      label: isEN ? 'Full Name' : 'Họ và tên',
                      placeholder: isEN ? 'John Doe' : 'Nguyễn Văn A',
                      required: true,
                    },
                    {
                      key: 'sdt',
                      label: isEN ? 'Phone Number' : 'Số điện thoại',
                      placeholder: isEN ? '0912 345 678' : '0912 345 678',
                      required: true,
                    },
                    {
                      key: 'email',
                      label: 'Email',
                      placeholder: isEN ? 'you@email.com' : 'ban@email.com',
                      required: true,
                    },
                    {
                      key: 'tenShop',
                      label: isEN ? 'Shop / Company abbreviation' : 'Tên shop / Công ty viết tắt',
                      placeholder: isEN ? 'e.g. CTYA → key CTYA-ADMIN-01' : 'VD: CTYA → key CTYA-ADMIN-01',
                      required: false,
                    },
                  ].map(f => (
                    <div className="form-group" key={f.key}>
                      <label className="form-label">
                        {f.label} {f.required && <span style={{ color: 'var(--orange)' }}>*</span>}
                      </label>
                      <input
                        className="form-input"
                        type={f.key === 'email' ? 'email' : 'text'}
                        value={form[f.key]}
                        placeholder={f.placeholder}
                        onChange={e => {
                          setForm(p => ({ ...p, [f.key]: e.target.value }))
                          if (errors[f.key]) setErrors(p => ({ ...p, [f.key]: '' }))
                        }}
                        style={{ borderColor: errors[f.key] ? 'var(--red)' : undefined }}
                      />
                      {errors[f.key] && (
                        <div className="form-error">{errors[f.key]}</div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Referral */}
                <div className="form-group" style={{ marginBottom: 32 }}>
                  <label className="form-label">
                    {isEN ? 'Referral Code' : 'Mã giới thiệu'}{' '}
                    <span style={{ color: 'var(--text3)', fontWeight: 400 }}>
                      {isEN ? '(optional)' : '(tùy chọn)'}
                    </span>
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    value={form.maGioiThieu}
                    onChange={e => setForm(p => ({ ...p, maGioiThieu: e.target.value }))}
                    placeholder={isEN ? 'Enter code if you have one' : 'Nhập mã nếu có'}
                  />
                </div>

                {/* Billing tabs */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', background: 'var(--gray)', borderRadius: 12, padding: 4, gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
                    {billingTabs.map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => {
                          setBillingTab(tab.key)
                          if (!PLANS[tab.key].find(p => p.id === selectedPlan)) {
                            setSelectedPlan(PLANS[tab.key][0].id)
                          }
                        }}
                        style={{
                          flex: 1, padding: '10px 10px', borderRadius: 9, border: 'none',
                          cursor: 'pointer', fontWeight: 700, fontSize: 12,
                          fontFamily: 'inherit',
                          background: billingTab === tab.key ? 'var(--navy)' : 'transparent',
                          color: billingTab === tab.key ? '#fff' : '#64748b',
                          transition: 'all 0.2s', whiteSpace: 'nowrap',
                          position: 'relative',
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Plan cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${currentPlans.length},1fr)`, gap: 12 }} className="plan-grid">
                    {currentPlans.map(plan => (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        style={{
                          border: `2px solid ${selectedPlan === plan.id ? 'var(--orange)' : 'var(--gray2)'}`,
                          borderRadius: 'var(--radius)',
                          padding: '20px 16px',
                          cursor: 'pointer',
                          position: 'relative',
                          background: selectedPlan === plan.id ? 'linear-gradient(135deg,#fff7f3,#fff)' : '#fff',
                          boxShadow: selectedPlan === plan.id ? '0 8px 24px rgba(254,95,1,0.15)' : 'none',
                          transition: 'all 0.2s',
                        }}
                      >
                        {plan.recommended && (
                          <div style={{
                            position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                            background: 'linear-gradient(135deg,var(--orange),#ff8c00)',
                            color: '#fff', fontSize: 11, fontWeight: 800,
                            padding: '4px 12px', borderRadius: 'var(--radius-full)',
                            whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(254,95,1,0.4)',
                          }}>RECOMMENDED</div>
                        )}
                        {/* Radio */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: '50%',
                            border: `2px solid ${selectedPlan === plan.id ? 'var(--orange)' : 'var(--gray2)'}`,
                            background: selectedPlan === plan.id ? 'var(--orange)' : '#fff',
                            flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {selectedPlan === plan.id && (
                              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />
                            )}
                          </div>
                          <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--navy)' }}>{plan.name}</span>
                        </div>
                        {/* Price */}
                        <div style={{ marginBottom: 6 }}>
                          {plan.originalPrice && (
                            <div style={{ textDecoration: 'line-through', color: 'var(--text3)', fontSize: 13 }}>
                              {plan.originalPrice}
                            </div>
                          )}
                          <span style={{
                            fontSize: 'clamp(15px,2.5vw,20px)', fontWeight: 800,
                            color: plan.price === 0 ? '#22c55e' : 'var(--orange)',
                          }}>{plan.priceLabel}</span>
                          <span style={{ color: '#64748b', fontSize: 12 }}> {plan.period}</span>
                          {plan.priceMonthly && (
                            <div style={{ fontSize: 12, color: '#0c2a72', fontWeight: 600, marginTop: 2 }}>
                              ≈ {plan.priceMonthly}
                            </div>
                          )}
                        </div>
                        {plan.savingLabel && (
                          <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '3px 8px', marginBottom: 6, display: 'inline-block' }}>
                            🎉 {plan.savingLabel}
                          </div>
                        )}
                        {plan.fomoLabel && (
                          <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 700, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '3px 8px', marginBottom: 6, display: 'inline-block', marginLeft: 4 }}>
                            🔥 {plan.fomoLabel}
                          </div>
                        )}
                        <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 12px' }}>{plan.desc}</p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {plan.features.map(f => (
                            <li key={f} style={{ fontSize: 12, color: '#64748b', marginBottom: 5, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                              <span style={{ color: '#22c55e', fontWeight: 800, marginTop: 1 }}>✓</span>{f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  className="btn btn-primary btn-lg"
                  style={{ fontFamily: 'inherit', width: '100%' }}
                >
                  {isEN ? 'Continue →' : 'Tiếp tục →'}
                </button>
              </div>
            )}

            {/* ══════ STEP 2 ══════ */}
            {step === 2 && (
              <div style={{ padding: 'clamp(24px,5vw,48px)' }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    background: 'none', border: 'none', color: '#64748b',
                    cursor: 'pointer', fontSize: 14, padding: '0 0 20px',
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontFamily: 'inherit',
                  }}
                >← {isEN ? 'Back' : 'Quay lại'}</button>

                <h2 style={{ color: 'var(--navy)', fontWeight: 800, fontSize: 22, margin: '0 0 6px' }}>
                  {isEN ? 'Payment' : 'Thanh toán'}
                </h2>
                <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 28px' }}>
                  {isEN
                    ? 'Transfer payment and upload a confirmation screenshot for quick approval.'
                    : 'Chuyển khoản và upload ảnh xác nhận để chúng tôi duyệt nhanh.'}
                </p>

                {/* Order summary */}
                <div style={{
                  background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy2) 100%)',
                  borderRadius: 'var(--radius)', padding: '22px 26px', marginBottom: 28, color: '#fff',
                }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {isEN ? 'Order Summary' : 'Tóm tắt đơn hàng'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }} className="summary-grid">
                    {[
                      [summaryKeys[0], `${planObj.name} (${summaryBillingLabel})`],
                      [summaryKeys[1], planObj.priceLabel],
                      [summaryKeys[2], form.hoTen],
                      [summaryKeys[3], form.sdt],
                      [summaryKeys[4], form.email],
                      ...(form.tenShop ? [[summaryKeys[5], form.tenShop]] : []),
                      ...(form.maGioiThieu ? [[summaryKeys[6], form.maGioiThieu]] : []),
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 2 }}>{k}</div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bank info */}
                <div style={{
                  background: '#fff', border: '2px solid var(--orange)',
                  borderRadius: 'var(--radius)', padding: '24px', marginBottom: 28,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{
                      width: 38, height: 38, background: 'linear-gradient(135deg,var(--orange),#ff8c00)',
                      borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    }}>🏦</div>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--navy)', fontSize: 16 }}>
                        {isEN ? 'Bank Transfer Details' : 'Thông tin chuyển khoản'}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {isEN
                          ? 'Use the exact transfer content for automatic confirmation'
                          : 'Chuyển đúng nội dung để hệ thống tự động xác nhận'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: 10 }}>
                    {bankRows.map(row => (
                      <div key={row.label} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: row.highlight ? '#fff7f3' : 'var(--gray)',
                        borderRadius: 10, gap: 12, flexWrap: 'wrap',
                      }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 2 }}>
                            {row.label}
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: row.highlight ? 'var(--orange)' : 'var(--navy)' }}>
                            {row.value}
                          </div>
                        </div>
                        {row.copy && (
                          <button
                            onClick={() => copyField(row.value, row.copy)}
                            className="btn btn-navy btn-sm"
                            style={{ fontFamily: 'inherit' }}
                          >
                            {copiedField === row.copy ? (isEN ? '✓ Copied' : '✓ Đã copy') : 'Copy'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="alert alert-warning" style={{ marginTop: 14 }}>
                    <strong>{isEN ? 'Example content:' : 'VD nội dung:'}</strong> GMAP 0912345678 BUSINESS
                  </div>
                </div>

                {/* Upload screenshot */}
                <div style={{ marginBottom: 28 }}>
                  <label className="form-label" style={{ fontSize: 15, marginBottom: 10 }}>
                    {isEN
                      ? 'Upload payment confirmation screenshot'
                      : 'Upload ảnh xác nhận chuyển khoản'}{' '}
                    <span style={{ color: 'var(--orange)' }}>*</span>
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${previewImg ? 'var(--orange)' : 'var(--gray2)'}`,
                      borderRadius: 'var(--radius)', padding: '32px 20px',
                      textAlign: 'center', cursor: 'pointer',
                      background: previewImg ? '#fff7f3' : 'var(--gray)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {previewImg ? (
                      <div>
                        <img src={previewImg} alt="preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 10, marginBottom: 10 }} />
                        <div style={{ fontSize: 13, color: '#22c55e', fontWeight: 700 }}>
                          {isEN ? '✓ Image selected — click to change' : '✓ Ảnh đã chọn — nhấn để đổi ảnh'}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 36, marginBottom: 10 }}>📤</div>
                        <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>
                          {isEN ? 'Click to select image' : 'Nhấn để chọn ảnh'}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text3)' }}>
                          {isEN ? 'PNG, JPG, HEIC — max 10MB' : 'PNG, JPG, HEIC — tối đa 10MB'}
                        </div>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn btn-primary btn-lg"
                  style={{ fontFamily: 'inherit', width: '100%', opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting
                    ? <><span className="spinner" /> {isEN ? 'Sending...' : 'Đang gửi...'}</>
                    : (isEN ? '📤 Payment done, send confirmation' : '📤 Đã thanh toán, gửi xác nhận')}
                </button>
              </div>
            )}

            {/* ══════ STEP 3 ══════ */}
            {step === 3 && (
              <div style={{ padding: 'clamp(24px,5vw,56px)', textAlign: 'center' }}>
                <div style={{ fontSize: 80, marginBottom: 16, animation: 'successBounce 0.6s ease' }}>✅</div>
                <h2 style={{ color: 'var(--navy)', fontWeight: 800, fontSize: 28, margin: '0 0 14px' }}>
                  {isEN ? 'Order received successfully!' : 'Đã nhận đơn thành công!'}
                </h2>
                <p style={{ color: '#64748b', fontSize: 16, maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.7 }}>
                  {isEN ? (
                    <>Thank you for subscribing! Your activation key will be sent via <strong>Zalo</strong> or <strong>Email</strong> within <strong>15–30 minutes</strong> after payment is confirmed.</>
                  ) : (
                    <>Cảm ơn bạn đã đăng ký! Key kích hoạt sẽ được gửi qua <strong>Zalo</strong> hoặc <strong>Email</strong> trong vòng <strong>15–30 phút</strong> sau khi xác nhận thanh toán.</>
                  )}
                </p>
                <div className="alert alert-success" style={{ maxWidth: 440, margin: '0 auto 36px', textAlign: 'left' }}>
                  <strong>{isEN ? 'Submitted info:' : 'Thông tin đã gửi:'}</strong><br />
                  {isEN ? 'Email:' : 'Email:'} {form.email}<br />
                  {isEN ? 'Phone:' : 'SĐT:'} {form.sdt}<br />
                  {isEN ? 'Plan:' : 'Gói:'} {planObj.name}
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <a href="/tai-xuong" className="btn btn-primary" style={{ fontFamily: 'inherit' }}>
                    {isEN ? 'Download now →' : 'Tải xuống ngay →'}
                  </a>
                  <a href="/" className="btn btn-outline-navy" style={{ fontFamily: 'inherit' }}>
                    {isEN ? 'Back to homepage' : 'Về trang chủ'}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* FAQ */}
          {step < 3 && (
            <Reveal delay={100}>
              <div style={{ marginTop: 52 }}>
                <h3 style={{ color: 'var(--navy)', fontWeight: 800, fontSize: 20, marginBottom: 20, textAlign: 'center' }}>
                  {isEN ? 'Frequently Asked Questions' : 'Câu hỏi thường gặp'}
                </h3>
                {FAQS.map((faq, i) => (
                  <div className="accordion" key={i}>
                    <button
                      className="accordion-trigger"
                      aria-expanded={openFaq === i}
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      style={{ fontFamily: 'inherit' }}
                    >
                      {faq.q}
                      <span className="icon">+</span>
                    </button>
                    {openFaq === i && (
                      <div className="accordion-body">{faq.a}</div>
                    )}
                  </div>
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </main>

      <Footer />

      <style>{`
        @keyframes successBounce {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        @media (max-width: 540px) {
          .plan-grid { grid-template-columns: 1fr !important; }
          .summary-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}
