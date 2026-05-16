import { useState, useEffect } from 'react'
import Head from 'next/head'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Reveal from '../components/Reveal'
import { useLang } from '../lib/LangContext'

const SECTIONS_VI = [
  { id: 'cai-dat',    label: 'Cài đặt & Đăng nhập',   num: 1 },
  { id: 'chien-dich', label: 'Tab Chiến dịch',          num: 2 },
  { id: 'lai-lo',     label: 'Tab Tính Lãi Lỗ',         num: 3 },
  { id: 'bao-cao',    label: 'Tab Báo cáo',             num: 4 },
  { id: 'auto-care',  label: 'Tab Auto Care',            num: 5 },
  { id: 'tu-dong-qc', label: 'Tab Tự động Set QC',      num: 6 },
  { id: 'thong-bao',  label: 'Tab Thông báo',            num: 7 },
  { id: 'nhan-vien',  label: 'Tab Nhân viên',            num: 8 },
  { id: 'khac-phuc',  label: 'Khắc phục sự cố',         num: 9 },
]

const SECTIONS_EN = [
  { id: 'cai-dat',    label: 'Setup & Sign In',         num: 1 },
  { id: 'chien-dich', label: 'Campaigns Tab',           num: 2 },
  { id: 'lai-lo',     label: 'P&L Calculator Tab',      num: 3 },
  { id: 'bao-cao',    label: 'Reports Tab',             num: 4 },
  { id: 'auto-care',  label: 'Auto Care Tab',           num: 5 },
  { id: 'tu-dong-qc', label: 'Auto Set Ads Tab',        num: 6 },
  { id: 'thong-bao',  label: 'Notifications Tab',       num: 7 },
  { id: 'nhan-vien',  label: 'Staff Tab',               num: 8 },
  { id: 'khac-phuc',  label: 'Troubleshooting',         num: 9 },
]

/* ─── SUB-COMPONENTS ─────────────────────────────────────────────────────── */

function SectionCard({ id, title, badge, children }) {
  return (
    <div id={id} style={{ marginBottom: 32 }}>
      <div style={{
        borderLeft: '4px solid var(--navy)',
        background: '#fff',
        borderRadius: '0 14px 14px 0',
        padding: '28px 32px',
        boxShadow: 'var(--shadow)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <h2 style={{
            fontSize: '1.15rem', fontWeight: 800,
            color: 'var(--navy)', margin: 0, lineHeight: 1.3,
          }}>{title}</h2>
          {badge && (
            <span style={{
              background: 'var(--orange)', color: '#fff',
              fontSize: 11, fontWeight: 700,
              padding: '3px 12px', borderRadius: 'var(--radius-full)',
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
        background: 'var(--navy)', color: '#fff', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: 13,
      }}>{num}</div>
      <p style={{ margin: 0, lineHeight: 1.75, color: 'var(--text2)', paddingTop: 4, fontSize: 15 }}>{text}</p>
    </div>
  )
}

function Tip({ children }) {
  return (
    <div style={{
      background: '#fffbf5',
      border: '1px solid rgba(254,95,1,0.3)',
      borderRadius: 'var(--radius-sm)',
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
    <div className="alert alert-info" style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
      <span style={{ fontSize: 14, lineHeight: 1.7 }}>{children}</span>
    </div>
  )
}

function BulletList({ items }) {
  return (
    <ul style={{ margin: '10px 0 0', paddingLeft: 20 }}>
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: 9, color: 'var(--text2)', lineHeight: 1.75, fontSize: 15 }}>
          {item}
        </li>
      ))}
    </ul>
  )
}

function SubHeading({ children }) {
  return (
    <div style={{
      fontWeight: 700, color: 'var(--navy)',
      fontSize: 14, marginBottom: 10, marginTop: 18,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{
        display: 'inline-block', width: 4, height: 14,
        background: 'var(--orange)', borderRadius: 2, flexShrink: 0,
      }} />
      {children}
    </div>
  )
}

function Tag({ children, color }) {
  const c = color || 'var(--navy)'
  return (
    <span style={{
      display: 'inline-block',
      background: color ? `${color}18` : 'var(--navy-light)',
      color: c,
      border: `1px solid ${c}30`,
      fontSize: 12, fontWeight: 600,
      padding: '3px 11px', borderRadius: 'var(--radius-full)',
      marginRight: 6, marginBottom: 6,
    }}>{children}</span>
  )
}

function InfoBox({ icon, title, sub, accent }) {
  return (
    <div style={{
      background: accent ? 'var(--orange-light)' : 'var(--navy-light)',
      borderRadius: 'var(--radius-sm)',
      padding: '14px 18px',
      border: `1px solid ${accent ? 'rgba(254,95,1,0.2)' : 'rgba(12,42,114,0.15)'}`,
      flex: '1 1 200px',
    }}>
      <div style={{
        fontWeight: 700, fontSize: 14,
        color: accent ? 'var(--orange)' : 'var(--navy)',
        marginBottom: 4,
      }}>{icon} {title}</div>
      <div style={{ fontSize: 13, color: 'var(--text2)' }}>{sub}</div>
    </div>
  )
}

function FaqItem({ q, a }) {
  return (
    <div style={{
      background: 'var(--off-white)',
      borderRadius: 'var(--radius-sm)',
      padding: '18px 22px',
      marginBottom: 12,
      border: '1px solid var(--gray2)',
    }}>
      <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 8, fontSize: 15 }}>
        ❓ {q}
      </div>
      <div style={{ color: 'var(--text2)', lineHeight: 1.75, fontSize: 14 }}>
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
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 68
    const onScroll = () => {
      for (const s of [...SECTIONS].reverse()) {
        const el = document.getElementById(s.id)
        if (el && window.scrollY >= el.offsetTop - navH - 20) {
          setActive(s.id)
          break
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
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
        <title>{isEN
          ? 'User Guide — Go Meta Ads Pro'
          : 'Hướng dẫn sử dụng — Go Meta Ads Pro'}</title>
        <meta name="description" content={isEN
          ? 'Detailed guide on how to install and use the Go Meta Ads Pro Chrome Extension for efficient Facebook Ads management.'
          : 'Hướng dẫn chi tiết cách cài đặt và sử dụng Go Meta Ads Pro Chrome Extension để quản lý Facebook Ads hiệu quả.'
        } />
      </Head>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy2) 100%)',
        paddingTop: 'calc(var(--nav-h) + 56px)',
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
      <div style={{ background: 'var(--off-white)', minHeight: '100vh', paddingTop: 0 }}>

        {/* Mobile dropdown */}
        <div className="hd-mobile-nav" style={{
          position: 'sticky',
          top: 'var(--nav-h)',
          zIndex: 100,
          background: '#fff',
          borderBottom: '1px solid var(--gray2)',
          padding: '10px 16px',
        }}>
          <button
            onClick={() => setMobileOpen(o => !o)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px', border: '1.5px solid var(--gray2)',
              borderRadius: 'var(--radius-sm)', background: '#fff',
              fontFamily: 'inherit', fontWeight: 600, fontSize: 14,
              color: 'var(--navy)', cursor: 'pointer',
            }}
          >
            <span>{isEN ? 'Section:' : 'Mục:'} {activeLabel}</span>
            <span style={{ transform: mobileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', fontSize: 18 }}>▾</span>
          </button>
          {mobileOpen && (
            <div style={{
              position: 'absolute', left: 0, right: 0,
              top: '100%', background: '#fff',
              border: '1px solid var(--gray2)',
              borderTop: 'none', zIndex: 200,
              boxShadow: 'var(--shadow)',
            }}>
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '12px 20px',
                    border: 'none', background: active === s.id ? 'var(--navy-light)' : 'transparent',
                    fontFamily: 'inherit', fontSize: 14,
                    fontWeight: active === s.id ? 700 : 500,
                    color: active === s.id ? 'var(--navy)' : 'var(--text2)',
                    cursor: 'pointer', textAlign: 'left',
                    borderLeft: active === s.id ? '3px solid var(--orange)' : '3px solid transparent',
                  }}
                >
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: active === s.id ? 'var(--orange)' : 'var(--gray2)',
                    color: active === s.id ? '#fff' : 'var(--text3)',
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
            top: 'calc(var(--nav-h) + 16px)',
            background: '#fff',
            borderRadius: 'var(--radius)',
            padding: '20px 0',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{
              fontSize: 11, fontWeight: 800,
              color: 'var(--text3)',
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
                  color: active === s.id ? 'var(--navy)' : 'var(--text2)',
                  background: active === s.id ? 'var(--navy-light)' : 'transparent',
                  borderLeft: active === s.id ? '3px solid var(--orange)' : '3px solid transparent',
                  transition: 'all 0.15s', lineHeight: 1.45,
                  textAlign: 'left', fontFamily: 'inherit',
                }}
              >
                <span style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: active === s.id ? 'var(--orange)' : 'var(--gray)',
                  color: active === s.id ? '#fff' : 'var(--text3)',
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
              <SectionCard id="cai-dat" title={isEN ? '1. Setup & Sign In' : '1. Cài đặt & Đăng nhập'}>
                <p style={{ color: 'var(--text2)', lineHeight: 1.75, marginTop: 0, marginBottom: 18, fontSize: 15 }}>
                  {isEN
                    ? 'Installing Go Meta Ads Pro takes about 2 minutes — no Google account needed, no complex configuration.'
                    : 'Cài đặt Go Meta Ads Pro chỉ mất khoảng 2 phút — không cần tài khoản Google, không cần cấu hình phức tạp.'}
                </p>
                <Step num={1} text={isEN
                  ? 'Download the ZIP file from the Download page — click the download button and save it to your computer.'
                  : 'Tải file ZIP từ trang Tải xuống — nhấn nút tải về và lưu vào máy tính.'} />
                <Step num={2} text={isEN
                  ? 'Extract the ZIP file. Open Chrome → go to chrome://extensions → enable Developer mode (toggle in the top-right corner).'
                  : 'Giải nén file ZIP. Mở Chrome → vào chrome://extensions → bật Developer mode (công tắc góc phải trên).'} />
                <Step num={3} text={isEN
                  ? 'Click "Load unpacked" → select the camp_monitor folder you just extracted.'
                  : 'Nhấn "Load unpacked" → chọn thư mục camp_monitor vừa giải nén.'} />
                <Step num={4} text={isEN
                  ? 'Click the Go Meta Ads Pro icon in the Chrome toolbar → enter the admin key received after purchasing a plan.'
                  : 'Click icon Go Meta Ads Pro trên thanh công cụ Chrome → nhập key admin nhận được sau khi mua gói.'} />
                <Tip>
                  {isEN ? (
                    <>Forgot your key? Go to the{' '}
                      <a href="/quan-ly" style={{ color: 'var(--orange)', fontWeight: 700, textDecoration: 'none' }}>Account Lookup</a>
                      {' '}page to find your key using your registered phone number or email.</>
                  ) : (
                    <>Quên key? Vào trang{' '}
                      <a href="/quan-ly" style={{ color: 'var(--orange)', fontWeight: 700, textDecoration: 'none' }}>Tra cứu</a>
                      {' '}để tìm lại key theo SĐT hoặc Email đã đăng ký.</>
                  )}
                </Tip>
              </SectionCard>
            </Reveal>

            {/* 2 — Tab Chiến dịch */}
            <Reveal delay={40}>
              <SectionCard id="chien-dich" title={isEN ? '2. Campaigns Tab' : '2. Tab Chiến dịch'}>
                <p style={{ color: 'var(--text2)', lineHeight: 1.75, marginTop: 0, marginBottom: 0, fontSize: 15 }}>
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
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>
                  {isEN
                    ? 'Target CPA is set in the P&L Calculator tab and automatically synced for the whole team.'
                    : 'CPA mục tiêu được thiết lập trong tab Tính Lãi Lỗ và tự động đồng bộ cho toàn team.'}
                </p>

                <SubHeading>{isEN ? 'Alert settings' : 'Cài đặt cảnh báo'}</SubHeading>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>
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
              </SectionCard>
            </Reveal>

            {/* 3 — Tab Tính Lãi Lỗ */}
            <Reveal delay={40}>
              <SectionCard id="lai-lo" title={isEN ? '3. P&L Calculator Tab' : '3. Tab Tính Lãi Lỗ'}>
                <p style={{ color: 'var(--text2)', lineHeight: 1.75, marginTop: 0, marginBottom: 0, fontSize: 15 }}>
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
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>
                  {isEN
                    ? <>Click the <strong>"+Add Product"</strong> tab to add a new product. Limit: 3 products (Personal plan), 10 products (Business plan and above).</>
                    : <>Nhấn tab <strong>"+Thêm SP"</strong> để thêm sản phẩm mới. Giới hạn: 3 SP (gói Personal), 10 SP (gói Business trở lên).</>}
                </p>

                <Tip>
                  {isEN
                    ? <>Click <strong>"📢 Send to all staff"</strong> to sync the target CPA down to all staff accounts in the team with just 1 click.</>
                    : <>Nhấn <strong>"📢 Gửi đến toàn bộ nhân viên"</strong> để đồng bộ CPA mục tiêu xuống toàn bộ tài khoản nhân viên trong team chỉ với 1 click.</>}
                </Tip>
              </SectionCard>
            </Reveal>

            {/* 4 — Tab Báo cáo */}
            <Reveal delay={40}>
              <SectionCard id="bao-cao" title={isEN ? '4. Reports Tab' : '4. Tab Báo cáo'} badge="Business+">
                <p style={{ color: 'var(--text2)', lineHeight: 1.75, marginTop: 0, marginBottom: 0, fontSize: 15 }}>
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

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
                  <InfoBox icon="📊" title={isEN ? 'Export Excel / PDF' : 'Xuất Excel / PDF'} sub={isEN ? 'Business plan and above' : 'Gói Business trở lên'} />
                  <InfoBox icon="✈️" title={isEN ? 'Auto send reports' : 'Gửi báo cáo tự động'} sub={isEN ? 'Telegram / Lark — Agency plan' : 'Telegram / Lark — Gói Agency'} accent />
                </div>

                <Note>
                  {isEN
                    ? 'To configure auto-send reports, go to the Notifications Tab to connect Telegram or Lark Webhook.'
                    : 'Để cấu hình gửi báo cáo tự động, vào Tab Thông báo để kết nối Telegram hoặc Lark Webhook.'}
                </Note>
              </SectionCard>
            </Reveal>

            {/* 5 — Tab Auto Care */}
            <Reveal delay={40}>
              <SectionCard id="auto-care" title="5. Tab Auto Care">
                <p style={{ color: 'var(--text2)', lineHeight: 1.75, marginTop: 0, marginBottom: 0, fontSize: 15 }}>
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
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>
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

            {/* 6 — Tab Tự động Set QC */}
            <Reveal delay={40}>
              <SectionCard id="tu-dong-qc" title={isEN ? '6. Auto Set Ads Tab' : '6. Tab Tự động Set QC'}>
                <p style={{ color: 'var(--text2)', lineHeight: 1.75, marginTop: 0, marginBottom: 18, fontSize: 15 }}>
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
                    ? 'Supports both objectives: Web Conversion and Messenger. Can set ads for multiple posts at once.'
                    : 'Hỗ trợ cả 2 mục tiêu: Web Conversion và Messenger. Có thể set hàng loạt nhiều bài viết cùng lúc.'}
                </Note>
              </SectionCard>
            </Reveal>

            {/* 7 — Tab Thông báo */}
            <Reveal delay={40}>
              <SectionCard id="thong-bao" title={isEN ? '7. Notifications Tab' : '7. Tab Thông báo'}>
                <p style={{ color: 'var(--text2)', lineHeight: 1.75, marginTop: 0, marginBottom: 0, fontSize: 15 }}>
                  {isEN
                    ? 'Receive instant notifications via Telegram or Lark when important events occur.'
                    : 'Nhận thông báo tức thì qua Telegram hoặc Lark khi có sự kiện quan trọng xảy ra.'}
                </p>

                <SubHeading>{isEN ? 'Connect Telegram' : 'Kết nối Telegram'}</SubHeading>
                <Step num={1} text={isEN
                  ? 'Find @Go_Meta_Ads_Pro_V1_bot on Telegram and press /start.'
                  : 'Tìm @Go_Meta_Ads_Pro_V1_bot trên Telegram và nhấn /start.'} />
                <Step num={2} text={isEN
                  ? 'The bot returns your Chat ID — copy it and paste into the Chat ID field in the extension.'
                  : 'Bot trả về Chat ID của bạn — copy lại và dán vào ô Chat ID trong extension.'} />
                <Step num={3} text={isEN
                  ? 'Click "Test connection" to verify the test notification was received successfully.'
                  : 'Nhấn "Test kết nối" để kiểm tra thông báo thử nghiệm thành công.'} />

                <SubHeading>{isEN ? 'Connect Lark' : 'Kết nối Lark'}</SubHeading>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>
                  {isEN
                    ? 'Create a Lark Bot in your workspace → get the webhook URL → paste it in the Lark Webhook field in the extension → click Test.'
                    : 'Tạo Lark Bot trong workspace → lấy webhook URL → dán vào ô Lark Webhook trong extension → nhấn Test.'}
                </p>

                <SubHeading>{isEN ? 'Notification types' : 'Các loại thông báo'}</SubHeading>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  <Tag>{isEN ? 'System audit' : 'Audit hệ thống'}</Tag>
                  <Tag>{isEN ? 'Critical alerts' : 'Cảnh báo nghiêm trọng'}</Tag>
                  <Tag>{isEN ? 'Periodic reports' : 'Báo cáo định kỳ'}</Tag>
                  <Tag>Auto Care action</Tag>
                  <Tag>{isEN ? 'Adset pause / resume' : 'Adset pause / resume'}</Tag>
                </div>
              </SectionCard>
            </Reveal>

            {/* 8 — Tab Nhân viên */}
            <Reveal delay={40}>
              <SectionCard id="nhan-vien" title={isEN ? '8. Staff Tab' : '8. Tab Nhân viên'} badge={isEN ? 'Admin Only' : 'Chỉ Admin'}>
                <p style={{ color: 'var(--text2)', lineHeight: 1.75, marginTop: 0, marginBottom: 0, fontSize: 15 }}>
                  {isEN
                    ? 'Manage staff keys, set access permissions and monitor activity. Only Admin accounts can see this tab.'
                    : 'Quản lý key nhân viên, phân quyền truy cập và theo dõi hoạt động. Chỉ tài khoản Admin mới thấy tab này.'}
                </p>

                <SubHeading>{isEN ? 'Add staff key' : 'Thêm key nhân viên'}</SubHeading>
                <BulletList items={isEN ? [
                  'Enter name, email, expiry date → the system automatically creates a unique staff key',
                  'Send the key to staff so they can sign in on their own computer',
                ] : [
                  'Nhập tên, email, ngày hết hạn → hệ thống tự tạo key NV duy nhất',
                  'Gửi key cho nhân viên để đăng nhập vào extension trên máy của họ',
                ]} />

                <SubHeading>{isEN ? 'Tab permissions' : 'Phân quyền xem tab'}</SubHeading>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '6px 0 10px' }}>
                  <Tag>{isEN ? 'Campaigns' : 'Chiến dịch'}</Tag>
                  <Tag>{isEN ? 'P&L' : 'Lãi lỗ'}</Tag>
                  <Tag>{isEN ? 'Reports' : 'Báo cáo'}</Tag>
                  <Tag>{isEN ? 'Auto Ads' : 'Auto QC'}</Tag>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>
                  {isEN
                    ? 'Check / uncheck each tab to control which staff member can view which feature.'
                    : 'Tick / bỏ tick từng tab để kiểm soát nhân viên nào được phép xem tính năng nào.'}
                </p>

                <SubHeading>{isEN ? 'Staff key lifecycle management' : 'Quản lý vòng đời key NV'}</SubHeading>
                <BulletList items={isEN ? [
                  'Renew — extend expiry date by month or year',
                  'Disable — temporarily lock key when staff takes leave or leaves the company',
                  'Delete — permanently revoke access',
                ] : [
                  'Gia hạn — kéo dài ngày hết hạn theo tháng hoặc năm',
                  'Vô hiệu hóa — tạm khóa key khi nhân viên nghỉ phép hoặc rời công ty',
                  'Xóa hoàn toàn — thu hồi quyền truy cập vĩnh viễn',
                ]} />
              </SectionCard>
            </Reveal>

            {/* 9 — Khắc phục sự cố */}
            <Reveal delay={40}>
              <SectionCard id="khac-phuc" title={isEN ? '9. Troubleshooting' : '9. Khắc phục sự cố'}>
                {isEN ? (
                  <>
                    <FaqItem
                      q="Campaign data not showing?"
                      a="Open Facebook Ads Manager in a Chrome tab in the same browser, reload the Ads Manager page, then click Reload in the extension."
                    />
                    <FaqItem
                      q="Forgot your login key?"
                      a="Go to the Account Lookup page — find your key by phone number and email registered when purchasing. The key will be displayed immediately after verification."
                    />
                    <FaqItem
                      q="Switching computers or reinstalling Chrome?"
                      a="The key is locked to the old device. Go to Account Management → Reset Device (max 1 time/month) to unlock and use on the new computer."
                    />
                    <FaqItem
                      q="There is a new version — how do I update?"
                      a="Download the new ZIP from the Download page → extract and overwrite the old folder → go to chrome://extensions → click the extension Reload button."
                    />
                  </>
                ) : (
                  <>
                    <FaqItem
                      q="Không thấy data chiến dịch?"
                      a="Mở Facebook Ads Manager trong tab Chrome cùng trình duyệt, reload lại trang Ads Manager, sau đó nhấn Reload ở extension."
                    />
                    <FaqItem
                      q="Quên key đăng nhập?"
                      a="Vào trang Tra cứu — tìm key bằng SĐT và Email đã đăng ký khi mua gói. Key sẽ được hiển thị ngay sau khi xác minh."
                    />
                    <FaqItem
                      q="Đổi máy tính hoặc cài lại Chrome?"
                      a="Key bị khóa thiết bị cũ. Vào trang Quản lý → Reset thiết bị (tối đa 1 lần/tháng) để mở khóa và dùng trên máy mới."
                    />
                    <FaqItem
                      q="Có phiên bản mới, cập nhật thế nào?"
                      a="Tải file ZIP mới từ trang Tải xuống → giải nén đè lên thư mục cũ → vào chrome://extensions → nhấn nút Reload extension."
                    />
                  </>
                )}

                <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <a href="/quan-ly" className="btn btn-navy btn-sm">
                    {isEN ? 'Lookup & Reset Device →' : 'Tra cứu & Reset thiết bị →'}
                  </a>
                  <a href="mailto:admin@gonetwork.vn" className="btn btn-outline-navy btn-sm">
                    {isEN ? 'Contact support' : 'Liên hệ hỗ trợ'}
                  </a>
                </div>
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
