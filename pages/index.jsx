import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

// ─── HOOK: Scroll animation ───
function useScrollAnim() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

// ─── COMPONENTS ───
function AnimBox({ children, delay = 0 }) {
  const [ref, v] = useScrollAnim()
  return (
    <div ref={ref} style={{
      opacity: v ? 1 : 0, transform: v ? 'translateY(0)' : 'translateY(32px)',
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`
    }}>{children}</div>
  )
}

const FEATURES = [
  {
    icon: '🎯', title: 'Đồng bộ CPA từng sản phẩm',
    desc: 'Thiết lập CPA tối đa theo kế hoạch kinh doanh. Cả team nhìn vào cùng 1 con số — không còn mỗi người hiểu mỗi kiểu.',
    tags: ['CPA mục tiêu', 'Đồng bộ team', 'Tự cập nhật']
  },
  {
    icon: '📊', title: 'Theo dõi chiến dịch theo sản phẩm',
    desc: 'Mỗi camp gắn với sản phẩm cụ thể. Xem ngay CPA thực tế vs mục tiêu, ROAS, lãi/lỗ từng dòng sản phẩm — không cần mở Excel.',
    tags: ['Realtime', 'Theo SP', 'CPA so sánh']
  },
  {
    icon: '🔔', title: 'Cảnh báo thông minh 7 ngày',
    desc: 'Phân tích xu hướng 7 ngày qua. Phát hiện sớm adset CPA tăng >50%, 3 ngày 0 đơn, ROAS giảm — có đề xuất hành động cụ thể.',
    tags: ['7 loại cảnh báo', 'Đề xuất hành động', 'Cảnh báo sớm']
  },
  {
    icon: '💚', title: 'Auto Care & Action nhanh',
    desc: 'Toggle bật/tắt, sửa ngân sách, bulk action hàng loạt ngay trong tool — không cần mở Ads Manager. Off-hours tự pause adset ban đêm.',
    tags: ['Bulk action', 'Off-hours pause', 'Auto resume']
  },
  {
    icon: '⚙️', title: 'Tự động set quảng cáo',
    desc: 'Quét bài viết Facebook → tự tạo Campaign + Adset + Creative theo hashtag sản phẩm. Tiết kiệm 90% thời gian set ads thủ công.',
    tags: ['Web Conv', 'Messenger', 'Bulk creation']
  },
  {
    icon: '📱', title: 'Báo cáo Telegram & Lark tự động',
    desc: 'Gửi báo cáo chi tiêu, đơn hàng, ROAS, lãi/lỗ vào Telegram/Lark theo lịch. Cả team xem cùng lúc — không cần mở Ads Manager.',
    tags: ['Realtime', 'Lịch tùy chỉnh', 'Cả team nhận']
  },
]

const BEFORE_AFTER = [
  ['Mỗi sáng phải mở Excel ghi tay', 'Tự động cập nhật sau 1 phút'],
  ['Không biết camp nào đang lãi, camp nào đang lỗ', 'Thấy ngay lãi/lỗ từng sản phẩm theo thời gian thực'],
  ['NV mỗi người hiểu CPA mục tiêu một kiểu', 'Đồng bộ CPA cho cả team chỉ 1 click'],
  ['CPA vượt ngưỡng không biết đến cuối ngày mới thấy', 'Cảnh báo ngay khi CPA vượt — trước khi mất tiền thêm'],
  ['Set ads mỗi bài viết mất 30 phút làm thủ công', 'Quét bài → tự tạo camp trong 3 phút'],
  ['Không có báo cáo thực tế — chỉ biết spend, không biết lãi lỗ', 'Báo cáo lãi/lỗ tự động gửi Telegram mỗi ngày'],
]

const PLANS = [
  {
    name: 'Cá nhân', icon: '🟦', price: { month: 200, year: 160 },
    desc: 'Phù hợp shop nhỏ, quản lý 1 người',
    features: ['1 Admin + 1 Nhân viên', 'Không giới hạn tài khoản ads', 'Đồng bộ CPA cho team', 'Cập nhật 1 phút/lần', 'Cảnh báo thông minh 7 ngày', 'Báo/tắt & sửa NS trong lịch sử'],
    notIncluded: ['Bulk action hàng loạt', 'Auto Care quảng cáo', 'Báo cáo lãi lỗ chi tiết'],
    cta: 'Mua Personal',
    color: '#3b82f6'
  },
  {
    name: 'Doanh nghiệp', icon: '🟧', price: { month: 500, year: 400 },
    desc: 'Dành cho team 2-5 người, shop đang scale',
    features: ['2 Admin + 5 Nhân viên', 'Không giới hạn tài khoản ads', 'Đồng bộ CPA cho team', 'Cập nhật 1 phút/lần', 'Cảnh báo thông minh 7 ngày', 'Báo/tắt & sửa NS trong lịch sử', 'Bulk action hàng loạt', 'Auto Care quảng cáo', 'Báo cáo lãi lỗ chi tiết theo SP', 'Hỗ trợ qua Zalo'],
    notIncluded: [],
    cta: 'Mua Business — Tiết kiệm nhất',
    color: '#fe5f01',
    popular: true
  },
  {
    name: 'Agency', icon: '🟩', price: { month: 1200, year: 960 },
    desc: 'Agency, multi-shop, không giới hạn',
    features: ['6 Admin + Không giới hạn NV', 'Không giới hạn tài khoản ads', 'Đồng bộ CPA cho team', 'Cập nhật 1 phút/lần', 'Cảnh báo thông minh 7 ngày', 'Bulk action hàng loạt', 'Auto Care quảng cáo', 'Báo cáo lãi lỗ chi tiết theo SP', 'Hỗ trợ 1-1 Zalo/Call'],
    notIncluded: [],
    cta: 'Mua Agency',
    color: '#10b981'
  },
]

const TESTIMONIALS = [
  {
    name: 'Trung Nguyễn', role: 'Chủ shop thời trang HCM · 9 TK ads',
    avatar: '👨‍💼',
    content: 'Từ khi dùng Go Meta Ads Pro, tôi không cần ngồi tổng hợp Excel mỗi sáng nữa. CPA được đồng bộ cho cả team, ai cũng biết camp nào đang tốt, camp nào cần điều chỉnh.',
    result: 'Giảm 24% chi phí ads lãng phí'
  },
  {
    name: 'Minh Phạm', role: 'Giám đốc điều hành · Agency Hà Nội · 5 nhân viên',
    avatar: '👩‍💼',
    content: 'Tính năng lãi lỗ tự động là thứ tôi cần nhất. Tôi nhập giá vốn, giá bán, tỉ lệ hoàn hàng một lần là hệ thống tự tính CPA tối đa. Cả team biết ngưỡng cần giữ.',
    result: 'ROAS tăng từ 2.5x lên 3.8x sau 3 tuần'
  },
  {
    name: 'Lan Anh', role: 'Marketing Manager · Công ty FMCG · 10 SP',
    avatar: '🧑‍💻',
    content: 'Tính năng cảnh báo thông minh giúp tôi tiết kiệm rất nhiều. Trước đây đến cuối ngày mới biết có camp nào vượt CPA, giờ nhận alert ngay — xử lý kịp trước khi tốn thêm tiền.',
    result: 'Tiết kiệm ~180K tiền ads lãng phí/tháng'
  },
]

const FAQS = [
  { q: 'Dữ liệu tài khoản ads của tôi có an toàn không?', a: 'Hoàn toàn an toàn. Go Meta Ads Pro chạy 100% local trên Chrome của bạn — dữ liệu không gửi về server nào. Token Facebook chỉ lưu trên máy bạn và chỉ bạn thấy.' },
  { q: 'Tôi có thể dùng thử trước khi mua không?', a: 'Có. Gói dùng thử 7 ngày miễn phí cho trải nghiệm đầy đủ tính năng gói Agency. Sau 7 ngày bạn chọn gói phù hợp hoặc không cần tiếp tục — không tự động trừ tiền.' },
  { q: 'Cài AdsFlow có làm Facebook khoá tài khoản ads không?', a: 'Không. Tool đọc dữ liệu qua API chính thức của Facebook, không can thiệp vào giao diện hay thao tác tự động trên Ads Manager. Hàng nghìn shop đang dùng mà không có vấn đề gì.' },
  { q: 'Tôi có 5 nhân viên, mỗi người 1 máy — có dùng được không?', a: 'Được. Gói Business hỗ trợ 5 nhân viên, mỗi người nhận key NV riêng. Admin set CPA mục tiêu, NV đồng bộ về máy và xem theo dõi chiến dịch của mình.' },
  { q: 'Tính năng tự động pause/tăng ngân sách hoạt động thế nào?', a: 'Bạn thiết lập điều kiện (CPA > ngưỡng, 0 đơn 3 ngày...) → tool tự kiểm tra mỗi phút khi Chrome mở → tự pause hoặc tăng ngân sách theo rule. Bạn nhận thông báo Telegram khi có action.' },
  { q: 'CPA mục tiêu được tính như thế nào?', a: 'Bạn nhập: giá bán, giá vốn, % ads, % hoàn hàng, phí ship... → tool tính lãi/đơn và ngược suy ra CPA tối đa để vẫn có lãi. Con số này đồng bộ cho cả team chỉ 1 click.' },
  { q: 'Tôi đổi máy hoặc cài lại Chrome thì sao?', a: 'Mỗi key được khóa với 1 thiết bị. Nếu cần đổi máy, vào trang Tra cứu → nhập SĐT đăng ký → reset thiết bị (tối đa 1 lần/tháng, hoàn toàn tự động).' },
  { q: 'Có hợp đồng hay tự động gia hạn không?', a: 'Không có hợp đồng, không tự gia hạn. Bạn thanh toán từng tháng hoặc từng năm — hệ thống cập nhật hạn sử dụng ngay sau khi nhận được thanh toán.' },
]

const STATS = [
  { num: '2,800+', label: 'Tài khoản ads đang đồng bộ', icon: '📊' },
  { num: '1 phút', label: 'Tự động cập nhật dữ liệu', icon: '⚡' },
  { num: '22%', label: 'Giảm chi phí ads trung bình', icon: '📉' },
  { num: '4.9⭐', label: 'Đánh giá từ 127+ người dùng', icon: '🏆' },
]

export default function Home() {
  const [billingYear, setBillingYear] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)
  const [activeFeature, setActiveFeature] = useState(0)

  return (
    <>
      <Head>
        <title>Go Meta Ads Pro — Đồng bộ CPA, Biết ngay Lãi hay Lỗ | Facebook Ads Tool</title>
        <meta name="description" content="Theo dõi CPA từng sản phẩm, đồng bộ target cho cả team, cảnh báo thông minh 7 ngày. Hơn 2,800+ tài khoản ads đang dùng mỗi ngày." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/logo.png" />
      </Head>

      <Navbar />

      {/* ══════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg, #071a4a 0%, #0c2a72 40%, #1a3a8f 70%, #0e1f50 100%)',
        paddingTop: 140, paddingBottom: 100,
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Background decoration */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 600, height: 600, background: 'radial-gradient(circle, rgba(254,95,1,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -150, left: -100, width: 500, height: 500, background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', maxWidth: 860, margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(254,95,1,0.15)', border: '1px solid rgba(254,95,1,0.3)', borderRadius: 50, padding: '6px 16px', marginBottom: 24, fontSize: 13, fontWeight: 600, color: '#fe9a3c' }}>
              <span style={{ animation: 'pulse-glow 2s infinite', display: 'inline-block', width: 8, height: 8, background: '#fe5f01', borderRadius: '50%' }} />
              Hơn 500+ shop & agency dùng mỗi ngày
            </div>

            <h1 style={{ color: '#fff', marginBottom: 20, fontSize: 'clamp(2.2rem, 5.5vw, 3.8rem)' }}>
              Đồng bộ CPA từng sản phẩm<br />
              <span style={{ background: 'linear-gradient(135deg, #fe5f01, #ff9a3c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Biết ngay lãi hay lỗ
              </span>
            </h1>

            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 36, maxWidth: 680, margin: '0 auto 36px' }}>
              Thiết lập CPA tối đa theo kế hoạch kinh doanh, đồng bộ cho cả team. AdsFlow tự động so sánh với chi tiêu thực tế và cảnh báo khi chiến dịch bắt đầu lỗ — để bạn không còn phải đổ tiền ads một cách mù quáng.
            </p>

            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
              <a href="/tai-xuong" className="btn btn-primary" style={{ fontSize: 16, padding: '14px 32px' }}>
                🚀 Dùng thử 7 ngày miễn phí
              </a>
              <a href="/mua-goi" className="btn btn-ghost-white" style={{ fontSize: 16, padding: '14px 32px' }}>
                Mua ngay từ 200K/tháng →
              </a>
            </div>

            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['✅ Cài đặt 3 phút', '🔒 Báo mật dữ liệu local', '📵 Không cần cấp phép phức tạp', '💬 Hỗ trợ Zalo trực tiếp'].map(t => (
                <span key={t} style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Dashboard mockup */}
          <div style={{ marginTop: 60, maxWidth: 900, margin: '60px auto 0', position: 'relative' }}>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 20, overflow: 'hidden',
              boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
              animation: 'float 6s ease-in-out infinite'
            }}>
              {/* Window chrome */}
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
                <span style={{ marginLeft: 12, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Go Meta Ads Pro — Dashboard</span>
              </div>

              {/* Dashboard content */}
              <div style={{ padding: 24 }}>
                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                  {[
                    { label: 'Chiến dịch', val: '18', color: '#60a5fa' },
                    { label: 'Chi tiêu hôm nay', val: '36.4M', color: '#fff' },
                    { label: 'Tổng đơn hàng', val: '924', color: '#10b981' },
                    { label: 'CPA cao ⚠️', val: '3', color: '#ef4444' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 16px' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Table rows */}
                {[
                  { name: 'Chiến dịch lượt mua web 1', sp: 'SP-A', status: '●Đang chạy', chi: '5.2M', cpa: '30,100đ / 45,000đ', roas: '2.6×', lailô: '+2,400,000đ', ok: true },
                  { name: 'Chiến dịch lượt mua web 2', sp: 'SP-B', status: '●Đang chạy', chi: '5.4M', cpa: '42,000đ / 80,000đ', roas: '2.9×', lailô: '+1,500,000đ', ok: true },
                  { name: 'Chiến dịch lượt mua 2', sp: 'SP-A', status: '⚠ Hãy xem', chi: '4.1M', cpa: '63,800đ / 45,000đ', roas: '2.1×', lailô: '-880,000đ', ok: false },
                ].map((r, i) => (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '2fr 0.6fr 0.8fr 0.8fr 1.4fr 0.6fr 1fr',
                    gap: 8, alignItems: 'center', padding: '10px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    fontSize: 12
                  }}>
                    <div>
                      <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 12 }}>{r.name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Sản phẩm {r.sp}</div>
                    </div>
                    <div style={{ color: '#60a5fa', fontWeight: 600 }}>{r.sp}</div>
                    <div style={{ color: r.ok ? '#10b981' : '#f59e0b', fontWeight: 600 }}>{r.status}</div>
                    <div style={{ color: '#e2e8f0' }}>{r.chi}</div>
                    <div style={{ color: r.ok ? '#10b981' : '#ef4444', fontWeight: 700 }}>{r.cpa}</div>
                    <div style={{ color: '#f59e0b' }}>{r.roas}</div>
                    <div style={{ color: r.ok ? '#10b981' : '#ef4444', fontWeight: 800 }}>{r.lailô}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════ */}
      <section style={{ background: '#0c2a72', padding: '32px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 24 }}>
            {STATS.map((s, i) => (
              <AnimBox key={i} delay={i * 100}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#fe5f01', lineHeight: 1 }}>{s.num}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>{s.label}</div>
                </div>
              </AnimBox>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PROBLEM SECTION
      ══════════════════════════════════════════ */}
      <section className="section" style={{ background: '#f8faff' }}>
        <div className="container">
          <AnimBox>
            <div className="section-title">
              <div className="badge">😤 Bạn đang gặp vấn đề này?</div>
              <h2>Quản lý ads thủ công<br /><span className="gradient-text">tốn thời gian và tiền bạc</span></h2>
              <p>Những vấn đề này đang xảy ra hàng ngày với hàng nghìn shop & agency tại Việt Nam</p>
            </div>
          </AnimBox>

          <div className="grid-3" style={{ gap: 20 }}>
            {[
              { icon: '📉', title: 'CPA vượt ngưỡng không biết', desc: 'Đến cuối ngày mới thấy camp đang lỗ. Trong khi đó hàng triệu đồng đã chảy đi.' },
              { icon: '📊', title: 'Không biết SP nào đang lãi', desc: 'Spend nhiều nhưng không biết sản phẩm nào thực sự đang có lãi sau khi trừ hết chi phí.' },
              { icon: '👥', title: 'NV mỗi người hiểu CPA một kiểu', desc: 'Admin nói CPA 50K, NV hiểu 50K gross — không tính hoàn hàng, ship, VAT.' },
              { icon: '🕐', title: 'Báo cáo mất 2 tiếng mỗi sáng', desc: 'Copy số từ Ads Manager, paste vào Excel, tính toán thủ công — lặp đi lặp lại mỗi ngày.' },
              { icon: '😴', title: 'Camp chạy lãng phí ban đêm', desc: 'Không có người theo dõi, camp tiêu tiền qua đêm với CPA cao mà không ai biết.' },
              { icon: '🔁', title: 'Set ads lặp đi lặp lại mệt mỏi', desc: 'Mỗi bài viết mới phải lại tạo camp tay — cấu hình, audience, creative, đặt budget...' },
            ].map((p, i) => (
              <AnimBox key={i} delay={i * 80}>
                <div className="card" style={{ background: '#fff', borderLeft: '4px solid #ef4444' }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{p.icon}</div>
                  <h3 style={{ fontSize: 15, marginBottom: 8, color: '#1e293b' }}>{p.title}</h3>
                  <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{p.desc}</p>
                </div>
              </AnimBox>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BEFORE / AFTER
      ══════════════════════════════════════════ */}
      <section className="section" style={{ background: 'linear-gradient(135deg, #0c2a72 0%, #1a3a8f 100%)' }}>
        <div className="container">
          <AnimBox>
            <div className="section-title">
              <div className="badge" style={{ background: 'rgba(254,95,1,0.2)', color: '#fe9a3c', border: '1px solid rgba(254,95,1,0.3)' }}>✨ Khác biệt rõ ràng chỉ sau vài ngày</div>
              <h2 style={{ color: '#fff' }}>Trước và sau khi<br />dùng Go Meta Ads Pro</h2>
            </div>
          </AnimBox>

          <div className="grid-2" style={{ alignItems: 'start' }}>
            {/* Before */}
            <AnimBox delay={0}>
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.25)', borderRadius: 20, padding: 32 }}>
                <h3 style={{ color: '#fca5a5', fontSize: 18, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>😰</span> Trước khi dùng — Quản lý thủ công
                </h3>
                {BEFORE_AFTER.map(([before], i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                    <span style={{ color: '#ef4444', fontWeight: 700, flexShrink: 0, marginTop: 2 }}>✗</span>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.5 }}>{before}</span>
                  </div>
                ))}
              </div>
            </AnimBox>

            {/* After */}
            <AnimBox delay={200}>
              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1.5px solid rgba(16,185,129,0.25)', borderRadius: 20, padding: 32 }}>
                <h3 style={{ color: '#6ee7b7', fontSize: 18, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>🚀</span> Sau khi dùng — Tự động & đồng bộ
                </h3>
                {BEFORE_AFTER.map(([, after], i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                    <span style={{ color: '#10b981', fontWeight: 700, flexShrink: 0, marginTop: 2 }}>✓</span>
                    <span style={{ color: '#fff', fontSize: 14, lineHeight: 1.5, fontWeight: 500 }}>{after}</span>
                  </div>
                ))}
              </div>
            </AnimBox>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES SECTION
      ══════════════════════════════════════════ */}
      <section className="section" id="features" style={{ background: '#fff' }}>
        <div className="container">
          <AnimBox>
            <div className="section-title">
              <div className="badge">⚡ 6 tính năng cốt lõi</div>
              <h2>Sáu trụ cột giúp bạn<br /><span className="gradient-text">kinh doanh chủ động hơn</span></h2>
              <p>Mỗi tính năng giải quyết đúng 1 vấn đề thực tế mà shop & agency gặp phải mỗi ngày</p>
            </div>
          </AnimBox>

          <div className="grid-3">
            {FEATURES.map((f, i) => (
              <AnimBox key={i} delay={i * 100}>
                <div className="card" style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: 'radial-gradient(circle, rgba(254,95,1,0.08) 0%, transparent 70%)', borderRadius: '0 0 0 80px' }} />
                  <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
                  <h3 style={{ fontSize: 16, marginBottom: 10, color: '#0c2a72' }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65, marginBottom: 16 }}>{f.desc}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {f.tags.map(t => (
                      <span key={t} style={{ background: 'rgba(12,42,114,0.08)', color: '#0c2a72', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{t}</span>
                    ))}
                  </div>
                </div>
              </AnimBox>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section className="section" style={{ background: '#f0f4ff' }}>
        <div className="container">
          <AnimBox>
            <div className="section-title">
              <div className="badge">⏱ Bắt đầu trong 3 phút</div>
              <h2>Cách hoạt động<br />cực kỳ đơn giản</h2>
            </div>
          </AnimBox>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {[
              { num: '01', icon: '📥', title: 'Cài tiện ích', desc: 'Tải file ZIP → giải nén → cài vào Chrome trong 1 phút. Không cần cài đặt phức tạp.' },
              { num: '02', icon: '🎯', title: 'Nhập CPA mục tiêu', desc: 'Thiết lập CPA tối đa cho từng sản phẩm theo kế hoạch kinh doanh của bạn.' },
              { num: '03', icon: '👥', title: 'Đồng bộ cho team', desc: 'Nhập key NV cho nhân viên — cả team nhận CPA mục tiêu, theo dõi cùng chiến dịch.' },
              { num: '04', icon: '📈', title: 'Tối ưu lập tức', desc: 'Nhận cảnh báo ngay khi CPA vượt ngưỡng. Quyết định scale hay dừng — chính xác, kịp thời.' },
            ].map((s, i) => (
              <AnimBox key={i} delay={i * 120}>
                <div style={{ textAlign: 'center', padding: '28px 20px', position: 'relative' }}>
                  {i < 3 && <div style={{ position: 'absolute', top: 40, right: -20, width: 40, height: 2, background: 'linear-gradient(90deg, #fe5f01, transparent)', zIndex: 1 }} />}
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #0c2a72, #1a3a8f)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24, boxShadow: '0 4px 16px rgba(12,42,114,0.25)' }}>
                    {s.icon}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#fe5f01', letterSpacing: '1px', marginBottom: 8 }}>BƯỚC {s.num}</div>
                  <h3 style={{ fontSize: 15, marginBottom: 8, color: '#0c2a72' }}>{s.title}</h3>
                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </AnimBox>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════ */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="container">
          <AnimBox>
            <div className="section-title">
              <div className="badge">⭐ Đánh giá thực tế</div>
              <h2>Chủ shop & Agency<br />nói gì về Go Meta Ads Pro?</h2>
              <p>4.9/5 từ 127 đánh giá từ shop và agency thực tế đang sử dụng</p>
            </div>
          </AnimBox>

          <div className="grid-3">
            {TESTIMONIALS.map((t, i) => (
              <AnimBox key={i} delay={i * 120}>
                <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                    {[...Array(5)].map((_, j) => <span key={j} style={{ color: '#f59e0b', fontSize: 16 }}>★</span>)}
                  </div>
                  <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, flex: 1, fontStyle: 'italic' }}>
                    "{t.content}"
                  </p>
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #0c2a72, #1a3a8f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{t.avatar}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{t.name}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{t.role}</div>
                      </div>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 700, color: '#059669' }}>
                      KẾT QUẢ: {t.result}
                    </div>
                  </div>
                </div>
              </AnimBox>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════ */}
      <section className="section" id="pricing" style={{ background: '#f8faff' }}>
        <div className="container">
          <AnimBox>
            <div className="section-title">
              <div className="badge">💰 Bảng giá</div>
              <h2>Đơn giản · Minh bạch<br /><span className="gradient-text">Không phí ẩn</span></h2>
              <p>Một lần thanh toán cho cả tháng — không tự động gia hạn, không trừ tiền âm thầm</p>

              {/* Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 24 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: billingYear ? '#94a3b8' : '#0c2a72' }}>Theo tháng</span>
                <button onClick={() => setBillingYear(!billingYear)} style={{
                  width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', position: 'relative',
                  background: billingYear ? '#fe5f01' : '#e2e8f0', transition: 'background 0.2s'
                }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 4, left: billingYear ? 28 : 4, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                </button>
                <span style={{ fontSize: 14, fontWeight: 600, color: billingYear ? '#0c2a72' : '#94a3b8' }}>
                  Theo năm <span style={{ background: '#fe5f01', color: '#fff', padding: '2px 8px', borderRadius: 50, fontSize: 12, fontWeight: 700 }}>-20%</span>
                </span>
              </div>
            </div>
          </AnimBox>

          <div className="grid-3" style={{ alignItems: 'start' }}>
            {PLANS.map((plan, i) => (
              <AnimBox key={i} delay={i * 120}>
                <div style={{
                  background: '#fff', borderRadius: 20, padding: 32,
                  border: plan.popular ? `2px solid ${plan.color}` : '1.5px solid #e2e8f0',
                  position: 'relative', overflow: 'hidden',
                  boxShadow: plan.popular ? `0 16px 48px rgba(254,95,1,0.2)` : 'none',
                  transform: plan.popular ? 'scale(1.03)' : 'none'
                }}>
                  {plan.popular && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'linear-gradient(135deg, #fe5f01, #ff9a3c)', color: '#fff', textAlign: 'center', padding: '6px', fontSize: 12, fontWeight: 800 }}>
                      ⭐ PHỔ BIẾN NHẤT
                    </div>
                  )}
                  <div style={{ marginTop: plan.popular ? 20 : 0 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{plan.icon}</div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: plan.color, marginBottom: 4 }}>{plan.name}</h3>
                    <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>{plan.desc}</p>

                    <div style={{ marginBottom: 24 }}>
                      <span style={{ fontSize: 40, fontWeight: 900, color: '#0c2a72' }}>
                        {(billingYear ? plan.price.year : plan.price.month).toLocaleString('vi-VN')}K
                      </span>
                      <span style={{ fontSize: 14, color: '#94a3b8' }}>/tháng</span>
                      {billingYear && <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginTop: 4 }}>Tiết kiệm {((plan.price.month - plan.price.year) * 12).toLocaleString()}K/năm</div>}
                    </div>

                    <a href={`/mua-goi?plan=${plan.name.toLowerCase()}`} className="btn btn-primary" style={{
                      width: '100%', justifyContent: 'center', marginBottom: 24,
                      background: plan.popular ? plan.color : '#0c2a72'
                    }}>
                      {plan.cta}
                    </a>

                    {plan.features.map(f => (
                      <div key={f} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                        <span style={{ color: '#10b981', fontWeight: 700, flexShrink: 0 }}>✓</span>
                        <span style={{ fontSize: 14, color: '#475569' }}>{f}</span>
                      </div>
                    ))}
                    {plan.notIncluded.map(f => (
                      <div key={f} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start', opacity: 0.4 }}>
                        <span style={{ fontWeight: 700, flexShrink: 0 }}>✗</span>
                        <span style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'line-through' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimBox>
            ))}
          </div>

          <AnimBox delay={400}>
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <div style={{ display: 'inline-flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
                {['✅ Thanh toán an toàn', '🔒 Bảo mật dữ liệu local', '💬 Hỗ trợ Zalo trong 5 phút', '⚡ Không tự động gia hạn'].map(t => (
                  <span key={t} style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>{t}</span>
                ))}
              </div>
              <div style={{ marginTop: 20, fontSize: 14, color: '#94a3b8' }}>
                Đang dùng rồi? <a href="/mua-goi" style={{ color: '#fe5f01', fontWeight: 600, textDecoration: 'none' }}>Nâng cấp gói tại đây →</a>
              </div>
            </div>
          </AnimBox>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECURITY / TRUST
      ══════════════════════════════════════════ */}
      <section style={{ background: '#0c2a72', padding: '56px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
              <h3 style={{ color: '#fff', fontSize: 22, marginBottom: 12 }}>Dữ liệu của bạn — chỉ bạn thấy</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.7 }}>
                Go Meta Ads Pro là tiện ích Chrome chạy <strong style={{ color: '#fff' }}>hoàn toàn local</strong> trên trình duyệt của bạn. Toàn bộ dữ liệu chiến dịch, chi tiêu, doanh thu chỉ hiển thị trên máy bạn — không gửi về server Go Meta Ads, không chia sẻ cho bên thứ ba. Đã có hơn 500+ shop & agency dùng từ 2024 mà chưa có sự cố bảo mật nào.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { icon: '🏠', title: 'Dữ liệu local', desc: 'Lưu trên Chrome của bạn' },
                { icon: '🚫', title: 'Không gửi server', desc: 'Không log gì về phía chúng tôi' },
                { icon: '⚡', title: 'Chạy ổn định', desc: 'Từ 2024, không có downtime' },
                { icon: '🔑', title: 'Key riêng biệt', desc: 'Mỗi thiết bị 1 key độc lập' },
              ].map((s, i) => (
                <div key={i} className="glass" style={{ padding: 16, borderRadius: 12 }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{s.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════ */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <AnimBox>
            <div className="section-title">
              <div className="badge">❓ Câu hỏi thường gặp</div>
              <h2>Mọi thắc mắc<br />được giải đáp tại đây</h2>
            </div>
          </AnimBox>

          {FAQS.map((faq, i) => (
            <AnimBox key={i} delay={i * 50}>
              <div className="accordion-item">
                <button className="accordion-head" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  <span style={{ fontSize: 20, color: '#fe5f01', transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>+</span>
                </button>
                {openFaq === i && <div className="accordion-body">{faq.a}</div>}
              </div>
            </AnimBox>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════ */}
      <section style={{ background: 'linear-gradient(135deg, #0a1535 0%, #0c2a72 50%, #1a3a8f 100%)', padding: '80px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(254,95,1,0.12) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <AnimBox>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
            <h2 style={{ color: '#fff', marginBottom: 16, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>
              Bắt đầu tối ưu ads ngay hôm nay
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 17, marginBottom: 36, maxWidth: 560, margin: '0 auto 36px' }}>
              Dùng thử 7 ngày miễn phí · Không cần cài đặt phức tạp · Hỗ trợ Zalo trực tiếp
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/tai-xuong" className="btn btn-primary" style={{ fontSize: 16, padding: '14px 32px' }}>
                🎁 Dùng miễn phí 7 ngày
              </a>
              <a href="/mua-goi" className="btn btn-ghost-white" style={{ fontSize: 16, padding: '14px 32px' }}>
                Xem bảng giá →
              </a>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 20 }}>
              Hỗ trợ: <a href="https://zalo.me" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Zalo</a> · <a href="mailto:admin@gonetwork.vn" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>admin@gonetwork.vn</a>
            </p>
          </AnimBox>
        </div>
      </section>

      <Footer />

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
        @keyframes pulse-glow { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </>
  )
}
