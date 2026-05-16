import { useState, useEffect } from 'react'
import Head from 'next/head'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Reveal from '../components/Reveal'
import { useLang } from '../lib/LangContext'

const SECTIONS = [
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
  const { t } = useLang()
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
  }, [])

  const scrollTo = (id) => {
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 68
    const el = document.getElementById(id)
    if (el) {
      window.scrollTo({ top: el.offsetTop - navH - 8, behavior: 'smooth' })
      setActive(id)
      setMobileOpen(false)
    }
  }

  const activeLabel = SECTIONS.find(s => s.id === active)?.label || 'Chọn mục'

  return (
    <>
      <Head>
        <title>Hướng dẫn sử dụng — Go Meta Ads Pro</title>
        <meta name="description" content="Hướng dẫn chi tiết cách cài đặt và sử dụng Go Meta Ads Pro Chrome Extension để quản lý Facebook Ads hiệu quả." />
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
            📖 Tài liệu hướng dẫn
          </div>
          <h1 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            fontWeight: 900, margin: '0 0 18px', color: '#fff',
          }}>
            Hướng dẫn sử dụng
          </h1>
          <p style={{ fontSize: 17, opacity: 0.8, lineHeight: 1.75, margin: 0, color: '#fff' }}>
            Hướng dẫn chi tiết từng tính năng của Go Meta Ads Pro — từ cài đặt đến tự động hóa
            hoàn toàn chiến dịch quảng cáo.
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
            <span>Mục: {activeLabel}</span>
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
              Mục lục
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
              <SectionCard id="cai-dat" title="1. Cài đặt & Đăng nhập">
                <p style={{ color: 'var(--text2)', lineHeight: 1.75, marginTop: 0, marginBottom: 18, fontSize: 15 }}>
                  Cài đặt Go Meta Ads Pro chỉ mất khoảng 2 phút — không cần tài khoản Google, không cần cấu hình phức tạp.
                </p>
                <Step num={1} text="Tải file ZIP từ trang Tải xuống — nhấn nút tải về và lưu vào máy tính." />
                <Step num={2} text="Giải nén file ZIP. Mở Chrome → vào chrome://extensions → bật Developer mode (công tắc góc phải trên)." />
                <Step num={3} text='Nhấn "Load unpacked" → chọn thư mục camp_monitor vừa giải nén.' />
                <Step num={4} text='Click icon Go Meta Ads Pro trên thanh công cụ Chrome → nhập key admin nhận được sau khi mua gói.' />
                <Tip>
                  Quên key? Vào trang{' '}
                  <a href="/quan-ly" style={{ color: 'var(--orange)', fontWeight: 700, textDecoration: 'none' }}>Tra cứu</a>
                  {' '}để tìm lại key theo SĐT hoặc Email đã đăng ký.
                </Tip>
              </SectionCard>
            </Reveal>

            {/* 2 — Tab Chiến dịch */}
            <Reveal delay={40}>
              <SectionCard id="chien-dich" title="2. Tab Chiến dịch">
                <p style={{ color: 'var(--text2)', lineHeight: 1.75, marginTop: 0, marginBottom: 0, fontSize: 15 }}>
                  Tab mặc định hiển thị ngay khi đăng nhập. Tổng quan toàn bộ chiến dịch và adset theo thời gian thực.
                </p>

                <SubHeading>Các cột dữ liệu chính</SubHeading>
                <BulletList items={[
                  'Spent — Tổng chi tiêu theo ngày / tuần / tùy chỉnh',
                  'CPM — Chi phí mỗi 1.000 lần hiển thị',
                  'CPC — Chi phí mỗi lượt click',
                  'Reach / Impressions — Lượt tiếp cận và hiển thị',
                  'Result — Số đơn hàng hoặc lead',
                ]} />

                <SubHeading>Cột CPA thông minh</SubHeading>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  <Tag color="#16a34a">Xanh — CPA đạt mục tiêu</Tag>
                  <Tag color="#ca8a04">Vàng — CPA gần ngưỡng</Tag>
                  <Tag color="#dc2626">Đỏ — CPA vượt ngưỡng</Tag>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>
                  CPA mục tiêu được thiết lập trong tab Tính Lãi Lỗ và tự động đồng bộ cho toàn team.
                </p>

                <SubHeading>Cài đặt cảnh báo</SubHeading>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>
                  Click icon 🔔 trên từng campaign → thiết lập ngưỡng cảnh báo CPM, CPC hoặc Spend vượt mức. Hệ thống gửi thông báo tức thì.
                </p>

                <SubHeading>Lọc & thao tác hàng loạt</SubHeading>
                <BulletList items={[
                  'Tìm kiếm nhanh theo tên campaign / adset',
                  'Filter theo trạng thái: Active / Paused / Tất cả',
                  'Sort theo cột: click vào tiêu đề cột để sắp xếp tăng/giảm',
                  'Bulk action: tick nhiều adset → bật/tắt/đổi ngân sách hàng loạt',
                ]} />
              </SectionCard>
            </Reveal>

            {/* 3 — Tab Tính Lãi Lỗ */}
            <Reveal delay={40}>
              <SectionCard id="lai-lo" title="3. Tab Tính Lãi Lỗ">
                <p style={{ color: 'var(--text2)', lineHeight: 1.75, marginTop: 0, marginBottom: 0, fontSize: 15 }}>
                  Tính toán chính xác điểm hòa vốn và CPA tối đa dựa trên cấu trúc chi phí thực tế của sản phẩm.
                </p>

                <SubHeading>Thông tin cần nhập</SubHeading>
                <BulletList items={[
                  'Tên sản phẩm',
                  'Giá vốn (giá nhập hàng)',
                  'Giá bán (giá khách trả)',
                  '% chi phí quảng cáo (trên doanh thu)',
                  'Phí ship (đồng/đơn)',
                  '% hoàn hàng (tỉ lệ trả hàng)',
                  'VAT (nếu có)',
                ]} />

                <SubHeading>Kết quả tính toán</SubHeading>
                <BulletList items={[
                  'Lãi / lỗ mỗi đơn hàng (theo thực tế)',
                  'ROI — Tỉ suất sinh lời trên đầu tư',
                  'Điểm hòa vốn — CPA tối đa có thể chấp nhận',
                ]} />

                <SubHeading>Quản lý nhiều sản phẩm</SubHeading>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>
                  Nhấn tab <strong>"+Thêm SP"</strong> để thêm sản phẩm mới.
                  Giới hạn: 3 SP (gói Personal), 10 SP (gói Business trở lên).
                </p>

                <Tip>
                  Nhấn <strong>"📢 Gửi đến toàn bộ nhân viên"</strong> để đồng bộ CPA mục tiêu
                  xuống toàn bộ tài khoản nhân viên trong team chỉ với 1 click.
                </Tip>
              </SectionCard>
            </Reveal>

            {/* 4 — Tab Báo cáo */}
            <Reveal delay={40}>
              <SectionCard id="bao-cao" title="4. Tab Báo cáo" badge="Business+">
                <p style={{ color: 'var(--text2)', lineHeight: 1.75, marginTop: 0, marginBottom: 0, fontSize: 15 }}>
                  Xem báo cáo tổng hợp, phân tích xu hướng và gửi báo cáo tự động cho team.
                </p>

                <SubHeading>3 sub-tab báo cáo</SubHeading>
                <BulletList items={[
                  'Hôm nay — Tổng quan chi tiêu, đơn hàng, ROAS theo ngày',
                  'Báo cáo định kỳ — Tuần / tháng / tùy chỉnh khoảng thời gian',
                  'Phân tích — So sánh nhiều kỳ, phát hiện xu hướng tăng giảm',
                ]} />

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
                  <InfoBox icon="📊" title="Xuất Excel / PDF" sub="Gói Business trở lên" />
                  <InfoBox icon="✈️" title="Gửi báo cáo tự động" sub="Telegram / Lark — Gói Agency" accent />
                </div>

                <Note>
                  Để cấu hình gửi báo cáo tự động, vào Tab Thông báo để kết nối Telegram hoặc Lark Webhook.
                </Note>
              </SectionCard>
            </Reveal>

            {/* 5 — Tab Auto Care */}
            <Reveal delay={40}>
              <SectionCard id="auto-care" title="5. Tab Auto Care">
                <p style={{ color: 'var(--text2)', lineHeight: 1.75, marginTop: 0, marginBottom: 0, fontSize: 15 }}>
                  Tự động hóa việc bật/tắt adset theo giờ và theo điều kiện hiệu quả — không cần trực máy suốt ngày.
                </p>

                <SubHeading>Tính năng Off-hours</SubHeading>
                <BulletList items={[
                  'Bật Off-hours → đặt giờ pause (VD: 23:00) và giờ resume (VD: 06:00)',
                  'Toàn bộ adset đang active sẽ tự động pause đúng giờ đặt',
                  'Sáng hôm sau tự resume — tiết kiệm ngân sách chạy ban đêm không hiệu quả',
                ]} />

                <SubHeading>Bộ lọc sản phẩm</SubHeading>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>
                  Chỉ pause các adset có tên chứa mã sản phẩm cụ thể —
                  hữu ích khi chỉ muốn dừng 1 nhóm sản phẩm nhất định mà không ảnh hưởng các camp khác.
                </p>

                <SubHeading>Auto-pause theo điều kiện</SubHeading>
                <BulletList items={[
                  'Pause adset khi CPA vượt ngưỡng đặt trước',
                  'Pause adset khi ROAS xuống dưới mức tối thiểu cho phép',
                  'Tự động gửi thông báo Telegram/Lark khi thực hiện hành động',
                ]} />
              </SectionCard>
            </Reveal>

            {/* 6 — Tab Tự động Set QC */}
            <Reveal delay={40}>
              <SectionCard id="tu-dong-qc" title="6. Tab Tự động Set QC">
                <p style={{ color: 'var(--text2)', lineHeight: 1.75, marginTop: 0, marginBottom: 18, fontSize: 15 }}>
                  Tự động tạo quảng cáo từ bài viết Facebook — tiết kiệm đến 90% thời gian set ads thủ công.
                </p>
                <Step num={1} text="Thêm page Facebook → chọn tài khoản quảng cáo, pixel tracking và audience phù hợp." />
                <Step num={2} text='Nhấn "🔍 Quét bài viết" → hệ thống tự động tìm tất cả bài viết có hashtag mã sản phẩm.' />
                <Step num={3} text="Review danh sách bài viết được tìm thấy — tick chọn các bài muốn đẩy quảng cáo." />
                <Step num={4} text='Nhấn "🚀 Set quảng cáo" → hệ thống tự tạo Campaign + Adset + Ad hoàn chỉnh trên Facebook.' />
                <Note>
                  Hỗ trợ cả 2 mục tiêu: Web Conversion và Messenger. Có thể set hàng loạt nhiều bài viết cùng lúc.
                </Note>
              </SectionCard>
            </Reveal>

            {/* 7 — Tab Thông báo */}
            <Reveal delay={40}>
              <SectionCard id="thong-bao" title="7. Tab Thông báo">
                <p style={{ color: 'var(--text2)', lineHeight: 1.75, marginTop: 0, marginBottom: 0, fontSize: 15 }}>
                  Nhận thông báo tức thì qua Telegram hoặc Lark khi có sự kiện quan trọng xảy ra.
                </p>

                <SubHeading>Kết nối Telegram</SubHeading>
                <Step num={1} text="Tìm @Go_Meta_Ads_Pro_V1_bot trên Telegram và nhấn /start." />
                <Step num={2} text="Bot trả về Chat ID của bạn — copy lại và dán vào ô Chat ID trong extension." />
                <Step num={3} text='Nhấn "Test kết nối" để kiểm tra thông báo thử nghiệm thành công.' />

                <SubHeading>Kết nối Lark</SubHeading>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>
                  Tạo Lark Bot trong workspace → lấy webhook URL → dán vào ô Lark Webhook trong extension → nhấn Test.
                </p>

                <SubHeading>Các loại thông báo</SubHeading>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  <Tag>Audit hệ thống</Tag>
                  <Tag>Cảnh báo nghiêm trọng</Tag>
                  <Tag>Báo cáo định kỳ</Tag>
                  <Tag>Auto Care action</Tag>
                  <Tag>Adset pause / resume</Tag>
                </div>
              </SectionCard>
            </Reveal>

            {/* 8 — Tab Nhân viên */}
            <Reveal delay={40}>
              <SectionCard id="nhan-vien" title="8. Tab Nhân viên" badge="Chỉ Admin">
                <p style={{ color: 'var(--text2)', lineHeight: 1.75, marginTop: 0, marginBottom: 0, fontSize: 15 }}>
                  Quản lý key nhân viên, phân quyền truy cập và theo dõi hoạt động.
                  Chỉ tài khoản Admin mới thấy tab này.
                </p>

                <SubHeading>Thêm key nhân viên</SubHeading>
                <BulletList items={[
                  'Nhập tên, email, ngày hết hạn → hệ thống tự tạo key NV duy nhất',
                  'Gửi key cho nhân viên để đăng nhập vào extension trên máy của họ',
                ]} />

                <SubHeading>Phân quyền xem tab</SubHeading>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '6px 0 10px' }}>
                  <Tag>Chiến dịch</Tag>
                  <Tag>Lãi lỗ</Tag>
                  <Tag>Báo cáo</Tag>
                  <Tag>Auto QC</Tag>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>
                  Tick / bỏ tick từng tab để kiểm soát nhân viên nào được phép xem tính năng nào.
                </p>

                <SubHeading>Quản lý vòng đời key NV</SubHeading>
                <BulletList items={[
                  'Gia hạn — kéo dài ngày hết hạn theo tháng hoặc năm',
                  'Vô hiệu hóa — tạm khóa key khi nhân viên nghỉ phép hoặc rời công ty',
                  'Xóa hoàn toàn — thu hồi quyền truy cập vĩnh viễn',
                ]} />
              </SectionCard>
            </Reveal>

            {/* 9 — Khắc phục sự cố */}
            <Reveal delay={40}>
              <SectionCard id="khac-phuc" title="9. Khắc phục sự cố">
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

                <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <a href="/quan-ly" className="btn btn-navy btn-sm">
                    Tra cứu & Reset thiết bị →
                  </a>
                  <a href="mailto:admin@gonetwork.vn" className="btn btn-outline-navy btn-sm">
                    Liên hệ hỗ trợ
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
