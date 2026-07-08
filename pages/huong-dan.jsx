import { useState, useEffect } from 'react'
import Head from 'next/head'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Reveal from '../components/Reveal'
import { useLang } from '../lib/LangContext'

const SECTIONS_VI = [
  { id: 'cai-dat',    label: 'Đăng ký & Đăng nhập',     num: 1 },
  { id: 'chien-dich', label: 'Tab Chiến dịch',          num: 2 },
  { id: 'lai-lo',     label: 'Tab Tính Lãi Lỗ',         num: 3 },
  { id: 'policy',     label: 'Tab Kiểm tra Chính sách', num: 4 },
  { id: 'tu-dong-qc', label: 'Tab Tự động Set QC',      num: 5 },
  { id: 'auto-care',  label: 'Tab Auto Care',           num: 6 },
  { id: 'bao-cao',    label: 'Tab Báo cáo',             num: 7 },
  { id: 'thong-bao',  label: 'Tab Thông báo',           num: 8 },
  { id: 'nhan-vien',  label: 'Tab Nhân viên',           num: 9 },
  { id: 'affiliate',  label: 'Tab Affiliate & Mua Gói', num: 10 },
]

const SECTIONS_EN = [
  { id: 'cai-dat',    label: 'Register & Sign In',      num: 1 },
  { id: 'chien-dich', label: 'Campaigns Tab',           num: 2 },
  { id: 'lai-lo',     label: 'P&L Calculator Tab',      num: 3 },
  { id: 'policy',     label: 'Policy Check Tab',        num: 4 },
  { id: 'tu-dong-qc', label: 'Auto Set Ads Tab',        num: 5 },
  { id: 'auto-care',  label: 'Auto Care Tab',           num: 6 },
  { id: 'bao-cao',    label: 'Reports Tab',             num: 7 },
  { id: 'thong-bao',  label: 'Notifications Tab',       num: 8 },
  { id: 'nhan-vien',  label: 'Staff Tab',               num: 9 },
  { id: 'affiliate',  label: 'Affiliate & Plans Tab',   num: 10 },
]

/* ─── SUB-COMPONENTS ─────────────────────────────────────────────────────── */

function SectionCard({ id, title, badge, children }) {
  return (
    <div id={id} style={{ marginBottom: 32 }}>
      <div style={{
        borderLeft: '4px solid #0c2a72',
        background: '#ffffff',
        borderRadius: '0 14px 14px 0',
        padding: '28px 32px',
        boxShadow: '0 4px 20px rgba(12,42,114,0.10)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <h2 style={{
            fontSize: '1.15rem', fontWeight: 800,
            color: '#0c2a72', margin: 0, lineHeight: 1.3,
          }}>{title}</h2>
          {badge && (
            <span style={{
              background: '#fe5f01', color: '#fff',
              fontSize: 11, fontWeight: 700,
              padding: '3px 12px', borderRadius: '999px',
              letterSpacing: '0.3px', flexShrink: 0,
            }}>{badge}</span>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}

function Step({ num, text }) {
  return (
    <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
      <div style={{
        flexShrink: 0, width: 30, height: 30,
        background: '#0c2a72', color: '#fff', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: 13,
      }}>{num}</div>
      <p style={{ margin: 0, lineHeight: 1.75, color: '#64748b', paddingTop: 4, fontSize: 15 }}>{text}</p>
    </div>
  )
}

function Tip({ children }) {
  return (
    <div style={{
      background: '#fffbf5',
      border: '1px solid rgba(254,95,1,0.3)',
      borderRadius: '8px',
      padding: '12px 16px',
      display: 'flex', gap: 10, alignItems: 'flex-start',
      marginTop: 18,
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
      <span style={{ fontSize: 14, color: '#92400e', lineHeight: 1.7 }}>{children}</span>
    </div>
  )
}

function Note({ children }) {
  return (
    <div style={{
      marginTop: 14, display: 'flex', gap: 10, alignItems: 'flex-start',
      background: 'rgba(12,42,114,0.06)', border: '1px solid rgba(12,42,114,0.15)',
      borderRadius: 8, padding: '13px 18px',
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
      <span style={{ fontSize: 14, lineHeight: 1.7, color: '#1a2332' }}>{children}</span>
    </div>
  )
}

function BulletList({ items }) {
  return (
    <ul style={{ margin: '10px 0 0', paddingLeft: 20 }}>
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: 9, color: '#64748b', lineHeight: 1.75, fontSize: 15 }}>
          {item}
        </li>
      ))}
    </ul>
  )
}

function SubHeading({ children }) {
  return (
    <div style={{
      fontWeight: 700, color: '#0c2a72',
      fontSize: 14, marginBottom: 10, marginTop: 18,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{
        display: 'inline-block', width: 4, height: 14,
        background: '#fe5f01', borderRadius: 2, flexShrink: 0,
      }} />
      {children}
    </div>
  )
}

function Tag({ children, color }) {
  const c = color || '#0c2a72'
  return (
    <span style={{
      display: 'inline-block',
      background: color ? `${color}18` : 'rgba(12,42,114,0.08)',
      color: c,
      border: `1px solid ${c}30`,
      fontSize: 12, fontWeight: 600,
      padding: '3px 11px', borderRadius: '999px',
      marginRight: 6, marginBottom: 6,
    }}>{children}</span>
  )
}

function InfoBox({ icon, title, sub, accent }) {
  return (
    <div style={{
      background: accent ? 'rgba(254,95,1,0.1)' : 'rgba(12,42,114,0.08)',
      borderRadius: '8px',
      padding: '14px 18px',
      border: `1px solid ${accent ? 'rgba(254,95,1,0.2)' : 'rgba(12,42,114,0.15)'}`,
      flex: '1 1 200px',
    }}>
      <div style={{
        fontWeight: 700, fontSize: 14,
        color: accent ? '#fe5f01' : '#0c2a72',
        marginBottom: 4,
      }}>{icon} {title}</div>
      <div style={{ fontSize: 13, color: '#64748b' }}>{sub}</div>
    </div>
  )
}

function FaqItem({ q, a }) {
  return (
    <div style={{
      background: '#f8faff',
      borderRadius: '8px',
      padding: '18px 22px',
      marginBottom: 12,
      border: '1px solid #e2e8f0',
    }}>
      <div style={{ fontWeight: 700, color: '#0c2a72', marginBottom: 8, fontSize: 15 }}>
        ❓ {q}
      </div>
      <div style={{ color: '#64748b', lineHeight: 1.75, fontSize: 14 }}>
        → {a}
      </div>
    </div>
  )
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────────────── */

export default function HuongDan() {
  const { lang } = useLang()
  const isEN = lang === 'en'

  const SECTIONS = isEN ? SECTIONS_EN : SECTIONS_VI

  const [active, setActive] = useState('cai-dat')
  const [mobileOpen, setMobileOpen] = useState(false)

  /* Scroll-spy */
  useEffect(() => {
    const onScroll = () => {
      for (const s of [...SECTIONS].reverse()) {
        const el = document.getElementById(s.id)
        // Dùng getBoundingClientRect() sẽ chính xác hơn offsetTop vì offsetTop phụ thuộc vào offsetParent
        if (el && el.getBoundingClientRect().top <= 150) {
          setActive(s.id)
          break
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    // Gọi thử 1 lần lúc mount để set đúng tab hiện tại nếu đang load trang ở giữa chừng
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [SECTIONS])

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) {
      const totalOffset = 68 + 44 + 16
      const top = el.getBoundingClientRect().top + window.scrollY - totalOffset
      window.scrollTo({ top, behavior: 'smooth' })
      setActive(id)
      setMobileOpen(false)
    }
  }

  const activeLabel = SECTIONS.find(s => s.id === active)?.label || (isEN ? 'Select section' : 'Chọn mục')

  return (
    <>
      <Head>
        <title>Go Meta Ads Pro</title>
        <meta name="description" content={isEN
          ? 'Detailed guide on how to install and use the Go Meta Ads Pro Chrome Extension for efficient Facebook Ads management.'
          : 'Hướng dẫn chi tiết cách cài đặt và sử dụng Go Meta Ads Pro Chrome Extension để quản lý Facebook Ads hiệu quả.'
        } />
      </Head>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0c2a72 0%, #1a3a8f 100%)',
        paddingTop: 'calc(var(--header-h) + 16px)',
        paddingBottom: 60,
        textAlign: 'center',
        color: '#fff',
      }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <div className="badge badge-white" style={{ marginBottom: 20 }}>
            📖 {isEN ? 'User Documentation' : 'Tài liệu hướng dẫn'}
          </div>
          <h1 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            fontWeight: 900, margin: '0 0 18px', color: '#fff',
          }}>
            {isEN ? 'User Guide' : 'Hướng dẫn sử dụng'}
          </h1>
          <p style={{ fontSize: 17, opacity: 0.8, lineHeight: 1.75, margin: 0, color: '#fff' }}>
            {isEN
              ? 'Detailed guide for every feature of Go Meta Ads Pro — from installation to full automation of ad campaigns.'
              : 'Hướng dẫn chi tiết từng tính năng của Go Meta Ads Pro — từ cài đặt đến tự động hóa hoàn toàn chiến dịch quảng cáo.'}
          </p>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div style={{ background: '#f8faff', minHeight: '100vh', paddingTop: 0 }}>

        {/* Mobile dropdown */}
        <div className="hd-mobile-nav" style={{
          position: 'sticky',
          top: 'var(--nav-h)',
          zIndex: 100,
          background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          padding: '10px 16px',
        }}>
          <button
            onClick={() => setMobileOpen(o => !o)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px', border: '1.5px solid #e2e8f0',
              borderRadius: '8px', background: '#fff',
              fontFamily: 'inherit', fontWeight: 600, fontSize: 14,
              color: '#0c2a72', cursor: 'pointer',
            }}
          >
            <span>{isEN ? 'Section:' : 'Mục:'} {activeLabel}</span>
            <span style={{ transform: mobileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', fontSize: 18 }}>▾</span>
          </button>
          {mobileOpen && (
            <div style={{
              position: 'absolute', left: 0, right: 0,
              top: '100%', background: '#fff',
              border: '1px solid #e2e8f0',
              borderTop: 'none', zIndex: 200,
              boxShadow: '0 4px 20px rgba(12,42,114,0.10)',
            }}>
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '12px 20px',
                    border: 'none', background: active === s.id ? 'rgba(12,42,114,0.08)' : 'transparent',
                    fontFamily: 'inherit', fontSize: 14,
                    fontWeight: active === s.id ? 700 : 500,
                    color: active === s.id ? '#0c2a72' : '#64748b',
                    cursor: 'pointer', textAlign: 'left',
                    borderLeft: active === s.id ? '3px solid #0c2a72' : '3px solid transparent',
                  }}
                >
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: active === s.id ? '#0c2a72' : '#e2e8f0',
                    color: active === s.id ? '#fff' : '#94a3b8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, flexShrink: 0,
                  }}>{s.num}</span>
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop layout */}
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          padding: '48px 24px 80px',
          display: 'flex', gap: 36, alignItems: 'flex-start',
        }}>

          {/* ── Sidebar ─────────────────────────────────────────────── */}
          <aside className="hd-sidebar" style={{
            width: 240, flexShrink: 0,
            position: 'sticky',
            top: 'calc(var(--header-h) + 4px)',
            background: '#fff',
            borderRadius: '14px',
            padding: '20px 0',
            boxShadow: '0 2px 8px rgba(12,42,114,0.08)',
          }}>
            <div style={{
              fontSize: 11, fontWeight: 800,
              color: '#94a3b8',
              padding: '0 20px 14px',
              textTransform: 'uppercase', letterSpacing: '0.7px',
            }}>
              {isEN ? 'Contents' : 'Mục lục'}
            </div>
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11,
                  width: '100%', padding: '10px 20px',
                  border: 'none', cursor: 'pointer',
                  fontSize: 13.5, fontWeight: active === s.id ? 700 : 500,
                  color: active === s.id ? '#0c2a72' : '#64748b',
                  background: active === s.id ? 'rgba(12,42,114,0.07)' : 'transparent',
                  borderLeft: active === s.id ? '3px solid #0c2a72' : '3px solid transparent',
                  transition: 'all 0.15s', lineHeight: 1.45,
                  textAlign: 'left', fontFamily: 'inherit',
                }}
              >
                <span style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: active === s.id ? '#0c2a72' : '#e2e8f0',
                  color: active === s.id ? '#fff' : '#64748b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800,
                  transition: 'all 0.15s',
                }}>{s.num}</span>
                {s.label}
              </button>
            ))}
          </aside>

          {/* ── Content ─────────────────────────────────────────────── */}
          <main style={{ flex: 1, minWidth: 0 }}>

            {/* 1 — Cài đặt & Đăng nhập */}
            <Reveal>
              <SectionCard id="cai-dat" title={isEN ? '1. Register & Sign In' : '1. Đăng ký & Đăng nhập'}>
                <p style={{ color: '#64748b', lineHeight: 1.75, marginTop: 0, marginBottom: 18, fontSize: 15 }}>
                  {isEN
                    ? 'Go Meta Ads Pro is a web-based dashboard. You can access it from anywhere without installing any complex extensions.'
                    : 'Go Meta Ads Pro là nền tảng quản lý trên Web. Bạn có thể truy cập từ bất kỳ đâu mà không cần cài đặt extension phức tạp.'}
                </p>
                <Step num={1} text={isEN
                  ? 'Go to the Registration page — enter your full name, email, and phone number.'
                  : 'Vào trang Đăng ký — nhập họ tên, email và số điện thoại của bạn.'} />
                <Step num={2} text={isEN
                  ? 'Click "Get OTP" — check your email for the 6-digit verification code.'
                  : 'Nhấn "Nhận mã OTP" — kiểm tra email để lấy 6 số xác thực.'} />
                <Step num={3} text={isEN
                  ? 'Enter the OTP code and a secure password to complete your account registration.'
                  : 'Nhập mã OTP và mật khẩu bảo mật để hoàn tất tạo tài khoản.'} />
                <Step num={4} text={isEN
                  ? 'Go to the Login page — sign in with your registered email and password to access the Dashboard.'
                  : 'Vào trang Đăng nhập — điền email và mật khẩu để truy cập vào Dashboard.'} />
                <Tip>
                  {isEN ? (
                    <>Forgot your password? Click on the "Forgot Password" link on the Login page to reset it via email.</>
                  ) : (
                    <>Quên mật khẩu? Click vào nút "Quên mật khẩu" ở trang Đăng nhập để thiết lập lại qua email.</>
                  )}
                </Tip>
              </SectionCard>
            </Reveal>

            {/* 2 — Tab Chiến dịch */}
            <Reveal delay={40}>
              <SectionCard id="chien-dich" title={isEN ? '2. Campaigns Tab' : '2. Tab Chiến dịch'}>
                <p style={{ color: '#64748b', lineHeight: 1.75, marginTop: 0, marginBottom: 0, fontSize: 15 }}>
                  {isEN
                    ? 'The default tab displayed immediately after signing in. Real-time overview of all campaigns and adsets.'
                    : 'Tab mặc định hiển thị ngay khi đăng nhập. Tổng quan toàn bộ chiến dịch và adset theo thời gian thực.'}
                </p>

                <SubHeading>{isEN ? 'Main data columns' : 'Các cột dữ liệu chính'}</SubHeading>
                <BulletList items={isEN ? [
                  'Spent — Total spend by day / week / custom range',
                  'CPM — Cost per 1,000 impressions',
                  'CPC — Cost per click',
                  'Reach / Impressions — Reach and impression counts',
                  'Result — Number of orders or leads',
                ] : [
                  'Spent — Tổng chi tiêu theo ngày / tuần / tùy chỉnh',
                  'CPM — Chi phí mỗi 1.000 lần hiển thị',
                  'CPC — Chi phí mỗi lượt click',
                  'Reach / Impressions — Lượt tiếp cận và hiển thị',
                  'Result — Số đơn hàng hoặc lead',
                ]} />

                <SubHeading>{isEN ? 'Smart CPA column' : 'Cột CPA thông minh'}</SubHeading>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  <Tag color="#16a34a">{isEN ? 'Green — CPA on target' : 'Xanh — CPA đạt mục tiêu'}</Tag>
                  <Tag color="#ca8a04">{isEN ? 'Yellow — CPA near threshold' : 'Vàng — CPA gần ngưỡng'}</Tag>
                  <Tag color="#dc2626">{isEN ? 'Red — CPA exceeded' : 'Đỏ — CPA vượt ngưỡng'}</Tag>
                </div>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, margin: 0 }}>
                  {isEN
                    ? 'Target CPA is set in the P&L Calculator tab and automatically synced for the whole team.'
                    : 'CPA mục tiêu được thiết lập trong tab Tính Lãi Lỗ và tự động đồng bộ cho toàn team.'}
                </p>

                <SubHeading>{isEN ? 'Alert settings' : 'Cài đặt cảnh báo'}</SubHeading>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, margin: 0 }}>
                  {isEN
                    ? 'Click the 🔔 icon on each campaign → set CPM, CPC or Spend alert thresholds. The system sends instant notifications.'
                    : 'Click icon 🔔 trên từng campaign → thiết lập ngưỡng cảnh báo CPM, CPC hoặc Spend vượt mức. Hệ thống gửi thông báo tức thì.'}
                </p>

                <SubHeading>{isEN ? 'Filter & bulk actions' : 'Lọc & thao tác hàng loạt'}</SubHeading>
                <BulletList items={isEN ? [
                  'Quick search by campaign / adset name',
                  'Filter by status: Active / Paused / All',
                  'Sort by column: click column header to sort ascending/descending',
                  'Bulk action: select multiple adsets → enable/disable/change budget in bulk',
                ] : [
                  'Tìm kiếm nhanh theo tên campaign / adset',
                  'Filter theo trạng thái: Active / Paused / Tất cả',
                  'Sort theo cột: click vào tiêu đề cột để sắp xếp tăng/giảm',
                  'Bulk action: tick nhiều adset → bật/tắt/đổi ngân sách hàng loạt',
                ]} />
                
                <SubHeading>{isEN ? 'AI Campaign Assistant' : 'Trợ lý AI Chiến dịch'}</SubHeading>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, margin: 0 }}>
                  {isEN
                    ? 'Click the Sparkles icon (✨) next to any campaign to chat directly with AI. The AI can analyze performance and suggest targeting improvements.'
                    : 'Click icon (✨) cạnh mỗi chiến dịch để chat trực tiếp với AI. AI sẽ phân tích hiệu quả và gợi ý tệp đối tượng (Targeting) tối ưu nhất.'}
                </p>
              </SectionCard>
            </Reveal>

            {/* 3 — Tab Tính Lãi Lỗ */}
            <Reveal delay={40}>
              <SectionCard id="lai-lo" title={isEN ? '3. P&L Calculator Tab' : '3. Tab Tính Lãi Lỗ'}>
                <p style={{ color: '#64748b', lineHeight: 1.75, marginTop: 0, marginBottom: 0, fontSize: 15 }}>
                  {isEN
                    ? 'Accurately calculate break-even point and maximum CPA based on actual product cost structure.'
                    : 'Tính toán chính xác điểm hòa vốn và CPA tối đa dựa trên cấu trúc chi phí thực tế của sản phẩm.'}
                </p>

                <SubHeading>{isEN ? 'Required inputs' : 'Thông tin cần nhập'}</SubHeading>
                <BulletList items={isEN ? [
                  'Product name',
                  'Cost of goods (purchase price)',
                  'Selling price (customer pays)',
                  '% advertising cost (of revenue)',
                  'Shipping fee (per order)',
                  '% return rate (refund rate)',
                  'VAT (if applicable)',
                ] : [
                  'Tên sản phẩm',
                  'Giá vốn (giá nhập hàng)',
                  'Giá bán (giá khách trả)',
                  '% chi phí quảng cáo (trên doanh thu)',
                  'Phí ship (đồng/đơn)',
                  '% hoàn hàng (tỉ lệ trả hàng)',
                  'VAT (nếu có)',
                ]} />

                <SubHeading>{isEN ? 'Calculation results' : 'Kết quả tính toán'}</SubHeading>
                <BulletList items={isEN ? [
                  'Profit / loss per order (based on actuals)',
                  'ROI — Return on investment rate',
                  'Break-even point — Maximum acceptable CPA',
                ] : [
                  'Lãi / lỗ mỗi đơn hàng (theo thực tế)',
                  'ROI — Tỉ suất sinh lời trên đầu tư',
                  'Điểm hòa vốn — CPA tối đa có thể chấp nhận',
                ]} />

                <SubHeading>{isEN ? 'Managing multiple products' : 'Quản lý nhiều sản phẩm'}</SubHeading>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, margin: 0 }}>
                  {isEN
                    ? <>Click the <strong>"+Add Product"</strong> tab to add a new product. Limit: 3 products (Personal), 10 products (Business), Unlimited (Agency).</>
                    : <>Nhấn tab <strong>"+Thêm SP"</strong> để thêm sản phẩm mới. Giới hạn: 3 SP (Personal), 10 SP (Business), Không giới hạn (Agency).</>}
                </p>

              </SectionCard>
            </Reveal>

            {/* 4 — Tab Kiểm tra Chính sách (MỚI) */}
            <Reveal delay={40}>
              <SectionCard id="policy" title={isEN ? '4. Policy Check Tab' : '4. Tab Kiểm tra Chính sách'} badge="Business+">
                <p style={{ color: '#64748b', lineHeight: 1.75, marginTop: 0, marginBottom: 0, fontSize: 15 }}>
                  {isEN
                    ? 'AI analyzes ad content — detects policy violation risks before you run campaigns.'
                    : 'AI phân tích nội dung quảng cáo — phát hiện rủi ro vi phạm chính sách Meta trước khi chạy.'}
                </p>

                <SubHeading>{isEN ? 'How to use' : 'Cách sử dụng'}</SubHeading>
                <Step num={1} text={isEN
                  ? 'Enter Headline and Primary Text of your ad.'
                  : 'Nhập Tiêu đề (Headline) và Nội dung chính (Primary Text) của bài quảng cáo.'} />
                <Step num={2} text={isEN
                  ? 'Select your Industry for more accurate context analysis.'
                  : 'Chọn Ngành nghề để AI phân tích theo ngữ cảnh chính xác hơn.'} />
                <Step num={3} text={isEN
                  ? 'Click "Check violation" and wait 3-8 seconds for results.'
                  : 'Nhấn "Kiểm tra vi phạm" và đợi 3-8 giây để nhận kết quả.'} />

                <SubHeading>{isEN ? 'Warning Levels' : 'Các mức độ cảnh báo'}</SubHeading>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  <Tag color="#10b981">{isEN ? 'Safe (Green)' : 'An toàn (Xanh)'}</Tag>
                  <Tag color="#f59e0b">{isEN ? 'Warning (Yellow)' : 'Cảnh báo (Vàng)'}</Tag>
                  <Tag color="#ef4444">{isEN ? 'Violation (Red)' : 'Vi phạm (Đỏ)'}</Tag>
                </div>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, margin: 0 }}>
                  {isEN
                    ? 'The AI will highlight risky keywords and explain which Facebook policy is violated.'
                    : 'AI sẽ bôi đậm các từ ngữ có nguy cơ và giải thích rõ lỗi vi phạm theo chính sách của Facebook.'}
                </p>
                <Note>
                  {isEN
                    ? 'Usage limits: 20 times/day (Business), Unlimited (Agency). Feature not available for Personal plan.'
                    : 'Giới hạn: 20 lần/ngày (Business), Không giới hạn (Agency). Gói Personal không khả dụng.'}
                </Note>
              </SectionCard>
            </Reveal>

            {/* 7 — Tab Báo cáo */}
            <Reveal delay={40}>
              <SectionCard id="bao-cao" title={isEN ? '7. Reports Tab' : '7. Tab Báo cáo'} badge="Business+">
                <p style={{ color: '#64748b', lineHeight: 1.75, marginTop: 0, marginBottom: 0, fontSize: 15 }}>
                  {isEN
                    ? 'View consolidated reports, analyze trends, and send automated reports to your team.'
                    : 'Xem báo cáo tổng hợp, phân tích xu hướng và gửi báo cáo tự động cho team.'}
                </p>

                <SubHeading>{isEN ? '3 report sub-tabs' : '3 sub-tab báo cáo'}</SubHeading>
                <BulletList items={isEN ? [
                  'Today — Daily overview of spend, orders, ROAS',
                  'Periodic reports — Weekly / monthly / custom time range',
                  'Analysis — Compare multiple periods, detect growth/decline trends',
                ] : [
                  'Hôm nay — Tổng quan chi tiêu, đơn hàng, ROAS theo ngày',
                  'Báo cáo định kỳ — Tuần / tháng / tùy chỉnh khoảng thời gian',
                  'Phân tích — So sánh nhiều kỳ, phát hiện xu hướng tăng giảm',
                ]} />

                <SubHeading>{isEN ? 'AI Analytics Assistant' : 'Trợ lý AI Phân tích'}</SubHeading>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, margin: 0 }}>
                  {isEN
                    ? 'Use the Chatbot integrated into the Reports tab to ask AI to read charts, identify anomalies, and summarize performance data automatically.'
                    : 'Sử dụng Chatbot tích hợp trong tab Báo cáo để nhờ AI đọc biểu đồ, phát hiện điểm bất thường và tóm tắt số liệu kinh doanh tự động.'}
                </p>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
                  <InfoBox icon="✈️" title={isEN ? 'Auto send reports' : 'Gửi báo cáo tự động'} sub={isEN ? 'Telegram / Lark — Personal plan+' : 'Telegram / Lark — Gói Personal trở lên'} accent />
                </div>

                <Note>
                  {isEN
                    ? 'To configure auto-send reports, go to the Notifications Tab to connect Telegram or Lark Webhook.'
                    : 'Để cấu hình gửi báo cáo tự động, vào Tab Thông báo để kết nối Telegram hoặc Lark Webhook.'}
                </Note>
              </SectionCard>
            </Reveal>

            {/* 6 — Tab Auto Care */}
            <Reveal delay={40}>
              <SectionCard id="auto-care" title="6. Tab Auto Care">
                <p style={{ color: '#64748b', lineHeight: 1.75, marginTop: 0, marginBottom: 0, fontSize: 15 }}>
                  {isEN
                    ? 'Automate enabling/disabling adsets by schedule and by performance conditions — no need to monitor all day.'
                    : 'Tự động hóa việc bật/tắt adset theo giờ và theo điều kiện hiệu quả — không cần trực máy suốt ngày.'}
                </p>

                <SubHeading>{isEN ? 'Off-hours feature' : 'Tính năng Off-hours'}</SubHeading>
                <BulletList items={isEN ? [
                  'Enable Off-hours → set pause time (e.g. 23:00) and resume time (e.g. 06:00)',
                  'All active adsets will automatically pause at the set time',
                  'Auto-resume in the morning — save budget on ineffective overnight runs',
                ] : [
                  'Bật Off-hours → đặt giờ pause (VD: 23:00) và giờ resume (VD: 06:00)',
                  'Toàn bộ adset đang active sẽ tự động pause đúng giờ đặt',
                  'Sáng hôm sau tự resume — tiết kiệm ngân sách chạy ban đêm không hiệu quả',
                ]} />

                <SubHeading>{isEN ? 'Product filter' : 'Bộ lọc sản phẩm'}</SubHeading>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, margin: 0 }}>
                  {isEN
                    ? 'Only pause adsets with names containing specific product codes — useful when you want to stop only one product group without affecting other campaigns.'
                    : 'Chỉ pause các adset có tên chứa mã sản phẩm cụ thể — hữu ích khi chỉ muốn dừng 1 nhóm sản phẩm nhất định mà không ảnh hưởng các camp khác.'}
                </p>

                <SubHeading>{isEN ? 'Auto-pause by condition' : 'Auto-pause theo điều kiện'}</SubHeading>
                <BulletList items={isEN ? [
                  'Pause adset when CPA exceeds preset threshold',
                  'Pause adset when ROAS drops below minimum allowed level',
                  'Auto-send Telegram/Lark notification when an action is performed',
                ] : [
                  'Pause adset khi CPA vượt ngưỡng đặt trước',
                  'Pause adset khi ROAS xuống dưới mức tối thiểu cho phép',
                  'Tự động gửi thông báo Telegram/Lark khi thực hiện hành động',
                ]} />
              </SectionCard>
            </Reveal>

            {/* 5 — Tab Tự động Set QC */}
            <Reveal delay={40}>
              <SectionCard id="tu-dong-qc" title={isEN ? '5. Auto Set Ads Tab' : '5. Tab Tự động Set QC'}>
                <p style={{ color: '#64748b', lineHeight: 1.75, marginTop: 0, marginBottom: 18, fontSize: 15 }}>
                  {isEN
                    ? 'Automatically create ads from Facebook posts — save up to 90% of manual ad setup time.'
                    : 'Tự động tạo quảng cáo từ bài viết Facebook — tiết kiệm đến 90% thời gian set ads thủ công.'}
                </p>
                <Step num={1} text={isEN
                  ? 'Add Facebook page → select ad account, tracking pixel and suitable audience.'
                  : 'Thêm page Facebook → chọn tài khoản quảng cáo, pixel tracking và audience phù hợp.'} />
                <Step num={2} text={isEN
                  ? 'Click "🔍 Scan posts" → the system automatically finds all posts with product hashtags.'
                  : 'Nhấn "🔍 Quét bài viết" → hệ thống tự động tìm tất cả bài viết có hashtag mã sản phẩm.'} />
                <Step num={3} text={isEN
                  ? 'Review the list of found posts — check the posts you want to boost as ads.'
                  : 'Review danh sách bài viết được tìm thấy — tick chọn các bài muốn đẩy quảng cáo.'} />
                <Step num={4} text={isEN
                  ? 'Click "🚀 Set ads" → the system automatically creates a complete Campaign + Adset + Ad on Facebook.'
                  : 'Nhấn "🚀 Set quảng cáo" → hệ thống tự tạo Campaign + Adset + Ad hoàn chỉnh trên Facebook.'} />
                <Note>
                  {isEN
                    ? 'Supports 3 objectives: Awareness, Traffic, and Engagement. Easily set up ads for any post on your Fanpage with just 1 click.'
                    : 'Hỗ trợ 3 mục tiêu: Nhận biết, Truy cập, Tương tác. Set tự động chiến dịch cho bất kỳ bài viết nào trên Fanpage chỉ bằng 1 click.'}
                </Note>
              </SectionCard>
            </Reveal>

            {/* 8 — Tab Thông báo */}
            <Reveal delay={40}>
              <SectionCard id="thong-bao" title={isEN ? '8. Notifications Tab' : '8. Tab Thông báo'}>
                <p style={{ color: '#64748b', lineHeight: 1.75, marginTop: 0, marginBottom: 0, fontSize: 15 }}>
                  {isEN
                    ? 'Receive instant notifications via Telegram or Lark when important events occur.'
                    : 'Nhận thông báo tức thì qua Telegram hoặc Lark khi có sự kiện quan trọng xảy ra.'}
                </p>

                <SubHeading>{isEN ? 'Connect Telegram' : 'Kết nối Telegram'}</SubHeading>
                <Step num={1} text={isEN
                  ? 'Find @Go_Meta_Ads_Pro_V1_bot on Telegram and press /start.'
                  : 'Tìm @Go_Meta_Ads_Pro_V1_bot trên Telegram và nhấn /start.'} />
                <Step num={2} text={isEN
                  ? 'The bot returns your Chat ID — copy it and paste into the Chat ID field in the dashboard.'
                  : 'Bot trả về Chat ID của bạn — copy lại và dán vào ô Chat ID trong dashboard.'} />
                <Step num={3} text={isEN
                  ? 'Click "Test connection" to verify the test notification was received successfully.'
                  : 'Nhấn "Test kết nối" để kiểm tra thông báo thử nghiệm thành công.'} />

                <SubHeading>{isEN ? 'Connect Lark' : 'Kết nối Lark'}</SubHeading>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, margin: 0 }}>
                  {isEN
                    ? 'Create a Lark Bot in your workspace → get the webhook URL → paste it in the Lark Webhook field in the dashboard → click Test.'
                    : 'Tạo Lark Bot trong workspace → lấy webhook URL → dán vào ô Lark Webhook trong dashboard → nhấn Test.'}
                </p>

                <SubHeading>{isEN ? 'Notification types' : 'Các loại thông báo'}</SubHeading>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  <Tag>{isEN ? 'Periodic reports' : 'Báo cáo định kỳ'}</Tag>
                  <Tag>{isEN ? 'Status change alerts' : 'Cảnh báo thay đổi trạng thái'}</Tag>
                  <Tag>{isEN ? 'Critical alerts' : 'Cảnh báo khẩn cấp'}</Tag>
                </div>
              </SectionCard>
            </Reveal>

            {/* 9 — Tab Nhân viên */}
            <Reveal delay={40}>
              <SectionCard id="nhan-vien" title={isEN ? '9. Staff Tab' : '9. Tab Nhân viên'}>
                <p style={{ color: '#64748b', lineHeight: 1.75, marginTop: 0, marginBottom: 0, fontSize: 15 }}>
                  {isEN
                    ? 'Manage staff accounts, set access permissions and monitor activity.'
                    : 'Quản lý tài khoản nhân viên, phân quyền truy cập và theo dõi hoạt động.'}
                </p>

                <SubHeading>{isEN ? 'Add staff account' : 'Thêm nhân viên'}</SubHeading>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, margin: '0 0 10px 0' }}>
                  {isEN
                    ? <>Limits: 1 staff (Personal plan), 7 staff (Business plan), Unlimited (Agency plan).</>
                    : <>Giới hạn: 1 NV (gói Personal), 7 NV (gói Business), Không giới hạn (gói Agency).</>}
                </p>
                <BulletList items={isEN ? [
                  'Enter name, email, expiry date → the system automatically creates a login account for staff',
                  'Send the login details to staff so they can sign in on their own device',
                ] : [
                  'Nhập tên, email, ngày hết hạn → hệ thống tự tạo tài khoản đăng nhập cho NV',
                  'Gửi thông tin đăng nhập cho nhân viên để truy cập trên máy của họ',
                ]} />

                <SubHeading>{isEN ? 'Tab permissions' : 'Phân quyền xem tab'}</SubHeading>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '6px 0 10px' }}>
                  <Tag>{isEN ? 'Campaigns' : 'Chiến dịch'}</Tag>
                  <Tag>{isEN ? 'P&L' : 'Lãi lỗ'}</Tag>
                  <Tag>{isEN ? 'Reports' : 'Báo cáo'}</Tag>
                  <Tag>{isEN ? 'Auto Ads' : 'Auto QC'}</Tag>
                </div>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, margin: 0 }}>
                  {isEN
                    ? 'Check / uncheck each tab to control which staff member can view which feature.'
                    : 'Tick / bỏ tick từng tab để kiểm soát nhân viên nào được phép xem tính năng nào.'}
                </p>

                <SubHeading>{isEN ? 'Staff lifecycle management' : 'Quản lý vòng đời NV'}</SubHeading>
                <BulletList items={isEN ? [
                  'Renew — extend expiry date by month or year',
                  'Disable — temporarily lock account when staff takes leave or leaves the company',
                  'Delete — permanently revoke access',
                ] : [
                  'Gia hạn — kéo dài ngày hết hạn theo tháng hoặc năm',
                  'Vô hiệu hóa — tạm khóa tài khoản khi nhân viên nghỉ phép hoặc rời công ty',
                  'Xóa hoàn toàn — thu hồi quyền truy cập vĩnh viễn',
                ]} />
              </SectionCard>
            </Reveal>

            {/* 10 — Tab Affiliate & Mua Gói (MỚI) */}
            <Reveal delay={40}>
              <SectionCard id="affiliate" title={isEN ? '10. Affiliate & Plans Tab' : '10. Tab Affiliate & Mua Gói'}>
                <p style={{ color: '#64748b', lineHeight: 1.75, marginTop: 0, marginBottom: 0, fontSize: 15 }}>
                  {isEN
                    ? 'Upgrade your account and earn commissions by referring friends.'
                    : 'Nâng cấp tài khoản và kiếm hoa hồng bằng cách giới thiệu bạn bè.'}
                </p>

                <SubHeading>{isEN ? 'Purchase / Upgrade Plan' : 'Mua gói / Nâng cấp'}</SubHeading>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, margin: 0 }}>
                  {isEN
                    ? 'Go to the Buy Plan page, select a suitable plan (Personal, Business, or Agency). The system supports automatic QR code payment via PayOS. Your account will be upgraded instantly after successful payment.'
                    : 'Vào trang Mua Gói, chọn gói phù hợp (Personal, Business hoặc Agency). Hệ thống hỗ trợ thanh toán quét mã QR tự động qua PayOS. Tài khoản sẽ tự động kích hoạt ngay sau khi thanh toán thành công.'}
                </p>

                <SubHeading>{isEN ? 'Affiliate Program' : 'Chương trình Affiliate'}</SubHeading>
                <BulletList items={isEN ? [
                  'Requirement: Must have a Personal plan or higher.',
                  'Commissions: 10-15% for new registrations (depending on your plan), and 3% for renewals.',
                  'How to earn: Copy your Referral link and share it. When users sign up and purchase a plan, you receive commission.',
                  'Payout: Provide your bank details in the Affiliate tab to receive monthly payouts.',
                ] : [
                  'Điều kiện: Yêu cầu có gói Personal trở lên.',
                  'Hoa hồng: 10-15% cho lượt đăng ký mới (tùy gói của bạn), và 3% cho lượt gia hạn.',
                  'Cách làm: Copy link giới thiệu (Ref link) và chia sẻ. Khi người dùng đăng ký và mua gói, bạn sẽ nhận được hoa hồng.',
                  'Nhận tiền: Điền thông tin ngân hàng trong tab Affiliate để nhận thanh toán định kỳ.',
                ]} />
              </SectionCard>
            </Reveal>

          </main>
        </div>
      </div>

      <Footer />

      <style>{`
        /* Sidebar: ẩn trên mobile */
        .hd-sidebar { display: flex; flex-direction: column; }
        .hd-mobile-nav { display: none; }

        @media (max-width: 768px) {
          .hd-sidebar { display: none !important; }
          .hd-mobile-nav { display: block; }
        }
      `}</style>
    </>
  )
}
