import { useState, useEffect } from 'react'
import Head from 'next/head'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const NAVY = '#0c2a72'
const ORANGE = '#fe5f01'

const SECTIONS = [
  { id: 'cai-dat', label: 'Cài đặt & Đăng nhập' },
  { id: 'chien-dich', label: 'Tab Chiến dịch' },
  { id: 'lai-lo', label: 'Tab Tính Lãi Lỗ' },
  { id: 'bao-cao', label: 'Tab Báo cáo' },
  { id: 'auto-care', label: 'Tab Auto Care' },
  { id: 'tu-dong-qc', label: 'Tab Tự động Set QC' },
  { id: 'thong-bao', label: 'Tab Thông báo' },
  { id: 'nhan-vien', label: 'Tab Nhân viên' },
  { id: 'khac-phuc', label: 'Khắc phục sự cố' },
]

function SectionCard({ title, children, badge }) {
  return (
    <div style={{
      borderLeft: `4px solid ${NAVY}`,
      background: '#fff',
      borderRadius: '0 12px 12px 0',
      padding: 28,
      marginBottom: 28,
      boxShadow: '0 2px 16px rgba(12,42,114,0.07)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, margin: 0 }}>{title}</h2>
        {badge && (
          <span style={{
            background: ORANGE, color: '#fff', fontSize: 11,
            fontWeight: 700, padding: '2px 10px', borderRadius: 20
          }}>{badge}</span>
        )}
      </div>
      {children}
    </div>
  )
}

function Step({ num, text }) {
  return (
    <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
      <div style={{
        flexShrink: 0, width: 28, height: 28,
        background: NAVY, color: '#fff', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: 13
      }}>{num}</div>
      <p style={{ margin: 0, lineHeight: 1.7, color: '#374151', paddingTop: 4 }}>{text}</p>
    </div>
  )
}

function Tip({ children }) {
  return (
    <div style={{
      background: '#fffbf5', border: `1px solid ${ORANGE}40`,
      borderRadius: 8, padding: '10px 16px',
      display: 'flex', gap: 10, alignItems: 'flex-start',
      marginTop: 16
    }}>
      <span style={{ fontSize: 16 }}>💡</span>
      <span style={{ fontSize: 14, color: '#92400e', lineHeight: 1.6 }}>{children}</span>
    </div>
  )
}

function Note({ children }) {
  return (
    <div style={{
      background: '#f0f4ff', border: `1px solid ${NAVY}30`,
      borderRadius: 8, padding: '10px 16px',
      display: 'flex', gap: 10, alignItems: 'flex-start',
      marginTop: 12
    }}>
      <span style={{ fontSize: 16 }}>ℹ️</span>
      <span style={{ fontSize: 14, color: NAVY, lineHeight: 1.6 }}>{children}</span>
    </div>
  )
}

function BulletList({ items }) {
  return (
    <ul style={{ margin: '10px 0', paddingLeft: 20 }}>
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: 8, color: '#374151', lineHeight: 1.7, fontSize: 15 }}>{item}</li>
      ))}
    </ul>
  )
}

function Tag({ children, color = NAVY }) {
  return (
    <span style={{
      display: 'inline-block', background: color + '15',
      color: color, border: `1px solid ${color}30`,
      fontSize: 12, fontWeight: 600, padding: '2px 10px',
      borderRadius: 20, marginRight: 6, marginBottom: 6
    }}>{children}</span>
  )
}

export default function HuongDan() {
  const [active, setActive] = useState('cai-dat')

  useEffect(() => {
    const onScroll = () => {
      for (const s of [...SECTIONS].reverse()) {
        const el = document.getElementById(s.id)
        if (el && window.scrollY >= el.offsetTop - 120) {
          setActive(s.id)
          break
        }
      }
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) window.scrollTo({ top: el.offsetTop - 90, behavior: 'smooth' })
  }

  return (
    <>
      <Head>
        <title>Hướng dẫn sử dụng — Go Meta Ads Pro</title>
        <meta name="description" content="Hướng dẫn chi tiết cách cài đặt và sử dụng Go Meta Ads Pro Chrome Extension để quản lý Facebook Ads hiệu quả." />
      </Head>
      <Navbar />

      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${NAVY} 0%, #1a3a8a 100%)`,
        paddingTop: 100, paddingBottom: 60,
        textAlign: 'center', color: '#fff'
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px' }}>
          <div style={{
            display: 'inline-block', background: 'rgba(254,95,1,0.18)',
            color: '#fe9a60', fontSize: 13, fontWeight: 700,
            padding: '5px 16px', borderRadius: 20, marginBottom: 20
          }}>📖 Tài liệu hướng dẫn</div>
          <h1 style={{ fontSize: 36, fontWeight: 900, margin: '0 0 16px' }}>Hướng dẫn sử dụng</h1>
          <p style={{ fontSize: 17, opacity: 0.8, lineHeight: 1.7, margin: 0 }}>
            Hướng dẫn chi tiết từng tính năng của Go Meta Ads Pro — từ cài đặt đến tự động hóa hoàn toàn chiến dịch quảng cáo.
          </p>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ background: '#f5f7ff', minHeight: '100vh' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto', padding: '48px 20px',
          display: 'flex', gap: 36, alignItems: 'flex-start'
        }}>

          {/* Sidebar */}
          <aside className="hd-sidebar" style={{
            width: 240, flexShrink: 0,
            position: 'sticky', top: 80,
            background: '#fff', borderRadius: 12,
            padding: '20px 0',
            boxShadow: '0 2px 16px rgba(12,42,114,0.08)'
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', padding: '0 20px 12px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Mục lục
            </div>
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 20px', border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: active === s.id ? 700 : 500,
                  color: active === s.id ? NAVY : '#4b5563',
                  background: active === s.id ? '#f0f4ff' : 'transparent',
                  borderLeft: active === s.id ? `3px solid ${ORANGE}` : '3px solid transparent',
                  transition: 'all 0.15s', lineHeight: 1.5
                }}
              >
                {s.label}
              </button>
            ))}
          </aside>

          {/* Content */}
          <main style={{ flex: 1, minWidth: 0 }}>

            {/* Section 1 */}
            <div id="cai-dat">
              <SectionCard title="1. Cài đặt & Đăng nhập">
                <Step num={1} text="Tải file ZIP từ trang Tải xuống — nhấn nút tải về và lưu vào máy tính." />
                <Step num={2} text="Giải nén file ZIP. Mở Chrome → vào chrome://extensions → bật Developer mode (công tắc góc phải)." />
                <Step num={3} text='Nhấn "Load unpacked" → chọn thư mục camp_monitor vừa giải nén.' />
                <Step num={4} text="Click icon Go Meta Ads Pro trên thanh công cụ Chrome → nhập key admin nhận được sau khi mua gói." />
                <Tip>Quên key? Vào trang <a href="/quan-ly" style={{ color: ORANGE, fontWeight: 700 }}>Tra cứu</a> để tìm lại key theo SĐT hoặc Email đã đăng ký.</Tip>
              </SectionCard>
            </div>

            {/* Section 2 */}
            <div id="chien-dich">
              <SectionCard title="2. Tab Chiến dịch">
                <p style={{ color: '#374151', lineHeight: 1.7, marginTop: 0 }}>Tab mặc định hiển thị ngay khi đăng nhập. Tổng quan toàn bộ chiến dịch và adset theo thời gian thực.</p>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Các cột dữ liệu:</div>
                  <BulletList items={[
                    'Spent — Tổng chi tiêu theo ngày / tuần / tùy chỉnh',
                    'CPM — Chi phí mỗi 1000 lần hiển thị',
                    'CPC — Chi phí mỗi lượt click',
                    'Reach / Impressions — Lượt tiếp cận và hiển thị',
                    'Result — Số đơn hàng hoặc lead',
                  ]} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Cột CPA thông minh:</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                    <Tag color="#16a34a">Xanh — CPA đạt mục tiêu</Tag>
                    <Tag color="#ca8a04">Vàng — CPA gần ngưỡng</Tag>
                    <Tag color="#dc2626">Đỏ — CPA vượt ngưỡng</Tag>
                  </div>
                  <p style={{ color: '#374151', fontSize: 14, lineHeight: 1.6 }}>CPA mục tiêu được thiết lập trong tab Tính Lãi Lỗ và đồng bộ toàn team.</p>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Cài đặt cảnh báo:</div>
                  <p style={{ color: '#374151', fontSize: 14, lineHeight: 1.6, margin: 0 }}>Click icon 🔔 trên từng campaign → thiết lập ngưỡng cảnh báo CPM, CPC, hoặc Spend vượt mức.</p>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Lọc & thao tác hàng loạt:</div>
                  <BulletList items={[
                    'Tìm kiếm nhanh theo tên campaign / adset',
                    'Filter theo trạng thái: Active / Paused / Tất cả',
                    'Sort theo cột: click vào tiêu đề cột để sắp xếp',
                    'Bulk action: tick nhiều adset → bật/tắt/đổi ngân sách hàng loạt',
                  ]} />
                </div>
              </SectionCard>
            </div>

            {/* Section 3 */}
            <div id="lai-lo">
              <SectionCard title="3. Tab Tính Lãi Lỗ">
                <p style={{ color: '#374151', lineHeight: 1.7, marginTop: 0 }}>Tính toán chính xác điểm hòa vốn và CPA tối đa dựa trên cấu trúc chi phí thực tế của sản phẩm.</p>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Thông tin nhập vào:</div>
                  <BulletList items={[
                    'Tên sản phẩm',
                    'Giá vốn (giá nhập hàng)',
                    'Giá bán (giá khách trả)',
                    '% chi phí quảng cáo (trên doanh thu)',
                    'Phí ship (đồng/đơn)',
                    '% hoàn hàng (tỉ lệ trả hàng)',
                    'VAT (nếu có)',
                  ]} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Kết quả tính toán:</div>
                  <BulletList items={[
                    'Lãi / lỗ mỗi đơn hàng',
                    'ROI (Return on Investment)',
                    'Điểm hòa vốn — CPA tối đa có thể chấp nhận',
                  ]} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Nhiều sản phẩm:</div>
                  <p style={{ color: '#374151', fontSize: 14, lineHeight: 1.6, margin: 0 }}>Nhấn tab <strong>"+Thêm SP"</strong> để thêm sản phẩm mới. Giới hạn: 3 SP (gói Personal), 10 SP (gói Business trở lên).</p>
                </div>
                <Tip>Nhấn <strong>"📢 Gửi đến toàn bộ nhân viên"</strong> để đồng bộ CPA mục tiêu xuống toàn bộ tài khoản nhân viên trong team.</Tip>
              </SectionCard>
            </div>

            {/* Section 4 */}
            <div id="bao-cao">
              <SectionCard title="4. Tab Báo cáo" badge="Business+">
                <p style={{ color: '#374151', lineHeight: 1.7, marginTop: 0 }}>Xem báo cáo tổng hợp, phân tích xu hướng và gửi báo cáo tự động cho team.</p>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>3 sub-tab báo cáo:</div>
                  <BulletList items={[
                    'Hôm nay — Tổng quan chi tiêu, đơn hàng, ROAS theo ngày',
                    'Báo cáo định kỳ — Tuần / tháng / tùy chỉnh khoảng thời gian',
                    'Phân tích — So sánh nhiều kỳ, phát hiện xu hướng',
                  ]} />
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                  <div style={{
                    background: '#f0f4ff', borderRadius: 8, padding: '12px 18px',
                    border: `1px solid ${NAVY}20`, flex: '1 1 180px'
                  }}>
                    <div style={{ fontWeight: 700, color: NAVY, fontSize: 14, marginBottom: 4 }}>📊 Xuất Excel/PDF</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>Gói Business trở lên</div>
                  </div>
                  <div style={{
                    background: '#fff8f5', borderRadius: 8, padding: '12px 18px',
                    border: `1px solid ${ORANGE}20`, flex: '1 1 180px'
                  }}>
                    <div style={{ fontWeight: 700, color: ORANGE, fontSize: 14, marginBottom: 4 }}>✈️ Gửi tự động</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>Telegram / Lark — Gói Agency</div>
                  </div>
                </div>
                <Note>Để cấu hình gửi báo cáo tự động, vào Tab Thông báo để kết nối Telegram hoặc Lark.</Note>
              </SectionCard>
            </div>

            {/* Section 5 */}
            <div id="auto-care">
              <SectionCard title="5. Tab Auto Care">
                <p style={{ color: '#374151', lineHeight: 1.7, marginTop: 0 }}>Tự động hóa việc bật/tắt adset theo giờ và theo điều kiện hiệu quả — không cần trực máy.</p>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Tính năng Off-hours:</div>
                  <BulletList items={[
                    'Bật tính năng Off-hours → đặt giờ pause (VD: 23:00) và giờ resume (VD: 06:00)',
                    'Toàn bộ adset đang chạy sẽ tự pause đúng giờ đặt',
                    'Sáng hôm sau tự động resume — tiết kiệm ngân sách ban đêm',
                  ]} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Bộ lọc sản phẩm:</div>
                  <p style={{ color: '#374151', fontSize: 14, lineHeight: 1.6, margin: 0 }}>Chỉ pause các adset có tên chứa mã sản phẩm cụ thể — hữu ích khi chỉ muốn pause 1 nhóm SP nhất định.</p>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Auto-pause theo điều kiện:</div>
                  <BulletList items={[
                    'Pause adset khi CPA vượt ngưỡng đặt trước',
                    'Pause adset khi ROAS xuống dưới mức tối thiểu',
                    'Tự động gửi thông báo khi thực hiện hành động',
                  ]} />
                </div>
              </SectionCard>
            </div>

            {/* Section 6 */}
            <div id="tu-dong-qc">
              <SectionCard title="6. Tab Tự động Set QC">
                <p style={{ color: '#374151', lineHeight: 1.7, marginTop: 0 }}>Tự động tạo quảng cáo từ bài viết Facebook — tiết kiệm đến 90% thời gian set ads thủ công.</p>
                <Step num={1} text="Thêm page Facebook → chọn tài khoản quảng cáo, pixel tracking, và audience phù hợp." />
                <Step num={2} text='Nhấn "🔍 Quét bài viết" → hệ thống tự động tìm tất cả bài viết có hashtag mã sản phẩm.' />
                <Step num={3} text="Review danh sách bài viết được tìm thấy — tick chọn các bài muốn chạy quảng cáo." />
                <Step num={4} text='Nhấn "🚀 Set quảng cáo" → hệ thống tự động tạo Campaign + Adset + Ad trên Facebook.' />
                <Note>Hệ thống hỗ trợ cả 2 mục tiêu: Web Conversion và Messenger. Có thể set hàng loạt nhiều bài cùng lúc.</Note>
              </SectionCard>
            </div>

            {/* Section 7 */}
            <div id="thong-bao">
              <SectionCard title="7. Tab Thông báo">
                <p style={{ color: '#374151', lineHeight: 1.7, marginTop: 0 }}>Nhận thông báo tức thì qua Telegram hoặc Lark khi có sự kiện quan trọng.</p>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, color: NAVY, marginBottom: 10 }}>Kết nối Telegram:</div>
                  <Step num={1} text="Tìm @Go_Meta_Ads_Pro_V1_bot trên Telegram và nhấn /start" />
                  <Step num={2} text="Bot trả về Chat ID của bạn — copy lại và dán vào ô Chat ID trong extension" />
                  <Step num={3} text="Nhấn Test để kiểm tra kết nối thành công" />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Kết nối Lark:</div>
                  <p style={{ color: '#374151', fontSize: 14, lineHeight: 1.6, margin: 0 }}>Tạo Lark Bot trong workspace → lấy webhook URL → dán vào ô Lark Webhook trong extension.</p>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Các loại thông báo:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <Tag>Audit hệ thống</Tag>
                    <Tag>Cảnh báo nghiêm trọng</Tag>
                    <Tag>Báo cáo định kỳ</Tag>
                    <Tag>Auto Care action</Tag>
                    <Tag>Adset pause/resume</Tag>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Section 8 */}
            <div id="nhan-vien">
              <SectionCard title="8. Tab Nhân viên" badge="Chỉ Admin">
                <p style={{ color: '#374151', lineHeight: 1.7, marginTop: 0 }}>Quản lý key nhân viên, phân quyền truy cập và theo dõi hoạt động — chỉ tài khoản Admin mới thấy tab này.</p>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Thêm key nhân viên:</div>
                  <BulletList items={[
                    'Nhập tên, email, ngày hết hạn → hệ thống tự tạo key NV duy nhất',
                    'Gửi key cho nhân viên để đăng nhập vào extension',
                  ]} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Phân quyền xem tab:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <Tag>Chiến dịch</Tag>
                    <Tag>Lãi lỗ</Tag>
                    <Tag>Báo cáo</Tag>
                    <Tag>Auto QC</Tag>
                  </div>
                  <p style={{ color: '#374151', fontSize: 14, lineHeight: 1.6, marginTop: 10, marginBottom: 0 }}>Tick / bỏ tick từng tab để kiểm soát nhân viên nào được xem tính năng nào.</p>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Quản lý key NV:</div>
                  <BulletList items={[
                    'Gia hạn — kéo dài ngày hết hạn cho nhân viên',
                    'Vô hiệu hóa — tạm khóa key khi nhân viên nghỉ',
                    'Xóa hoàn toàn — thu hồi quyền truy cập vĩnh viễn',
                  ]} />
                </div>
              </SectionCard>
            </div>

            {/* Section 9 */}
            <div id="khac-phuc">
              <SectionCard title="9. Khắc phục sự cố">
                {[
                  {
                    q: 'Không thấy data chiến dịch?',
                    a: 'Mở Facebook Ads Manager trong tab Chrome cùng trình duyệt, reload lại trang Ads Manager, sau đó reload extension.',
                  },
                  {
                    q: 'Quên key đăng nhập?',
                    a: 'Vào trang Tra cứu — tìm key bằng SĐT và Email đã đăng ký khi mua gói.',
                  },
                  {
                    q: 'Đổi máy tính hoặc cài lại Chrome?',
                    a: 'Key bị khóa thiết bị cũ. Vào trang Quản lý → Reset thiết bị (tối đa 1 lần/tháng) để mở khóa.',
                  },
                  {
                    q: 'Có phiên bản mới, cập nhật thế nào?',
                    a: 'Tải file ZIP mới từ trang Tải xuống → giải nén đè lên thư mục cũ → vào chrome://extensions → nhấn nút Reload extension.',
                  },
                ].map((item, i) => (
                  <div key={i} style={{
                    background: '#f9faff', borderRadius: 8, padding: '16px 20px',
                    marginBottom: 12, border: '1px solid #e5e9f5'
                  }}>
                    <div style={{ fontWeight: 700, color: NAVY, marginBottom: 6, fontSize: 15 }}>❓ {item.q}</div>
                    <div style={{ color: '#374151', lineHeight: 1.7, fontSize: 14 }}>→ {item.a}</div>
                  </div>
                ))}
                <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <a href="/quan-ly" style={{
                    background: NAVY, color: '#fff', textDecoration: 'none',
                    padding: '11px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14
                  }}>Tra cứu & Reset thiết bị →</a>
                  <a href="mailto:admin@gonetwork.vn" style={{
                    background: '#fff', color: NAVY, textDecoration: 'none',
                    padding: '11px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14,
                    border: `2px solid ${NAVY}`
                  }}>Liên hệ hỗ trợ</a>
                </div>
              </SectionCard>
            </div>

          </main>
        </div>
      </div>

      <Footer />

      <style>{`
        @media (max-width: 768px) {
          .hd-sidebar { display: none !important; }
        }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      `}</style>
    </>
  )
}
