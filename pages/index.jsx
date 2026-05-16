import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Reveal from '../components/Reveal'
import { useLang } from '../lib/LangContext'

// ─── DATA ───────────────────────────────────────────────────────────────────

const STATS = [
  { num: 2800, display: '2,800+', label: 'Tài khoản ads đang đồng bộ', icon: '📊' },
  { num: 1,    display: '1 phút', label: 'Tự động cập nhật dữ liệu',   icon: '⚡' },
  { num: 22,   display: '22%',    label: 'Giảm chi phí ads trung bình', icon: '📉' },
  { num: 4.9,  display: '4.9⭐',  label: 'Đánh giá từ 127+ người dùng', icon: '🏆' },
]

const PROBLEMS = [
  { icon: '📉', title: 'CPA vượt ngưỡng không biết', desc: 'Đến cuối ngày mới thấy camp đang lỗ. Trong khi đó hàng triệu đồng đã chảy đi mà không hay.' },
  { icon: '📊', title: 'Không biết sản phẩm nào lãi', desc: 'Spend nhiều nhưng không biết sản phẩm nào thực sự có lãi sau khi trừ hết hoàn hàng, ship, VAT.' },
  { icon: '👥', title: 'NV hiểu CPA mỗi người một kiểu', desc: 'Admin nói CPA 50K, nhân viên hiểu 50K gross — không ai tính hoàn hàng, ship, phí Marketplace.' },
  { icon: '🕐', title: 'Báo cáo mất 2 tiếng mỗi sáng', desc: 'Copy số từ Ads Manager, paste vào Excel, tính toán thủ công — lặp đi lặp lại mỗi ngày.' },
  { icon: '😴', title: 'Camp chạy lãng phí ban đêm', desc: 'Không có người theo dõi, adset tiêu tiền qua đêm với CPA cao mà không ai biết cho đến sáng.' },
  { icon: '🔁', title: 'Set ads thủ công mệt mỏi', desc: 'Mỗi bài viết mới phải tạo camp tay — cấu hình, audience, creative, budget từng bước một.' },
]

const FEATURES = [
  { icon: '🎯', title: 'Đồng bộ CPA mục tiêu', desc: 'Thiết lập CPA tối đa theo kế hoạch kinh doanh. Cả team nhìn vào cùng 1 con số — không còn mỗi người hiểu mỗi kiểu.', tags: ['CPA mục tiêu', 'Đồng bộ team', 'Tự cập nhật'] },
  { icon: '📊', title: 'Theo dõi theo sản phẩm', desc: 'Mỗi camp gắn với sản phẩm cụ thể. Xem ngay CPA thực tế vs mục tiêu, ROAS, lãi/lỗ từng dòng sản phẩm — không cần mở Excel.', tags: ['Realtime', 'Theo sản phẩm', 'CPA so sánh'] },
  { icon: '🔔', title: 'Cảnh báo thông minh 7 ngày', desc: 'Phân tích xu hướng 7 ngày qua. Phát hiện sớm adset CPA tăng >50%, 3 ngày 0 đơn, ROAS giảm — có đề xuất hành động cụ thể.', tags: ['7 loại cảnh báo', 'Đề xuất hành động', 'Cảnh báo sớm'] },
  { icon: '💚', title: 'Auto Care & Action nhanh', desc: 'Toggle bật/tắt, sửa ngân sách, bulk action hàng loạt ngay trong tool. Off-hours tự pause adset ban đêm, tự resume sáng hôm sau.', tags: ['Bulk action', 'Off-hours pause', 'Auto resume'] },
  { icon: '⚙️', title: 'Tự động set quảng cáo', desc: 'Quét bài viết Facebook → tự tạo Campaign + Adset + Creative theo hashtag sản phẩm. Tiết kiệm 90% thời gian set ads thủ công.', tags: ['Web Conv', 'Messenger', 'Bulk creation'] },
  { icon: '📱', title: 'Báo cáo Telegram & Lark', desc: 'Gửi báo cáo chi tiêu, đơn hàng, ROAS, lãi/lỗ vào Telegram/Lark theo lịch. Cả team xem cùng lúc — không cần mở Ads Manager.', tags: ['Realtime', 'Lịch tùy chỉnh', 'Cả team nhận'] },
]

const BEFORE_AFTER = [
  ['Mỗi sáng phải mở Excel ghi tay số liệu', 'Tự động cập nhật sau 1 phút, không cần tay'],
  ['Không biết camp nào lãi, camp nào lỗ', 'Thấy ngay lãi/lỗ từng sản phẩm theo realtime'],
  ['NV mỗi người hiểu CPA mục tiêu một kiểu', 'Đồng bộ CPA cho cả team chỉ 1 click duy nhất'],
  ['CPA vượt ngưỡng — cuối ngày mới thấy', 'Cảnh báo ngay khi CPA vượt — trước khi mất thêm'],
  ['Set ads mỗi bài viết mất 30 phút thủ công', 'Quét bài → tự tạo camp hoàn chỉnh trong 3 phút'],
  ['Không biết lãi lỗ — chỉ thấy spend và click', 'Báo cáo lãi/lỗ tự động gửi Telegram mỗi ngày'],
]

const STEPS = [
  { num: '01', icon: '📥', title: 'Cài tiện ích Chrome', desc: 'Tải file ZIP → giải nén → cài vào Chrome trong 1 phút. Không cần tài khoản, không cần cấu hình phức tạp.' },
  { num: '02', icon: '🎯', title: 'Nhập CPA mục tiêu', desc: 'Thiết lập CPA tối đa cho từng sản phẩm theo kế hoạch kinh doanh. Tool tự tính từ giá vốn, hoàn hàng, chi phí.' },
  { num: '03', icon: '👥', title: 'Đồng bộ cho team', desc: 'Nhập key NV cho nhân viên — cả team nhận CPA mục tiêu, theo dõi cùng chiến dịch trên máy riêng.' },
  { num: '04', icon: '📈', title: 'Tối ưu lập tức', desc: 'Nhận cảnh báo ngay khi CPA vượt ngưỡng. Quyết định scale hay dừng — chính xác, kịp thời, không bỏ lỡ.' },
]

const TESTIMONIALS = [
  {
    name: 'Trung Nguyễn', role: 'Chủ shop thời trang HCM · 9 TK ads', avatar: '👨‍💼',
    content: 'Từ khi dùng Go Meta Ads Pro, tôi không cần ngồi tổng hợp Excel mỗi sáng nữa. CPA được đồng bộ cho cả team, ai cũng biết camp nào đang tốt, camp nào cần điều chỉnh. Tiết kiệm cả tiếng mỗi ngày.',
    result: 'Giảm 24% chi phí ads lãng phí',
  },
  {
    name: 'Minh Phạm', role: 'Giám đốc điều hành · Agency Hà Nội · 5 nhân viên', avatar: '👩‍💼',
    content: 'Tính năng lãi lỗ tự động là thứ tôi cần nhất. Nhập giá vốn, giá bán, tỉ lệ hoàn hàng một lần — hệ thống tự tính CPA tối đa. Cả team biết ngưỡng cần giữ, không ai tối ưu sai hướng nữa.',
    result: 'ROAS tăng từ 2.5x lên 3.8x sau 3 tuần',
  },
  {
    name: 'Lan Anh', role: 'Marketing Manager · Công ty FMCG · 10 sản phẩm', avatar: '🧑‍💻',
    content: 'Tính năng cảnh báo thông minh giúp tôi tiết kiệm rất nhiều. Trước đây đến cuối ngày mới biết có camp nào vượt CPA, giờ nhận alert ngay — xử lý kịp trước khi tốn thêm tiền vô ích.',
    result: 'Tiết kiệm ~180K tiền ads lãng phí/tháng',
  },
]

const PLANS = [
  {
    key: 'personal', name: 'Cá nhân', icon: '🟦', color: '#3b82f6',
    priceMonth: 200, priceYear: 160,
    desc: 'Phù hợp shop nhỏ, quản lý 1 người',
    features: ['1 Admin + 1 Nhân viên', 'Không giới hạn tài khoản ads', 'Đồng bộ CPA cho team', 'Cập nhật 1 phút/lần', 'Cảnh báo thông minh 7 ngày', 'Bật/tắt & sửa ngân sách nhanh'],
    notIncluded: ['Bulk action hàng loạt', 'Auto Care quảng cáo', 'Báo cáo lãi lỗ chi tiết'],
    cta: 'Mua Personal',
  },
  {
    key: 'business', name: 'Doanh nghiệp', icon: '🟧', color: '#fe5f01',
    priceMonth: 500, priceYear: 400,
    desc: 'Dành cho team 2–5 người, shop đang scale',
    features: ['2 Admin + 5 Nhân viên', 'Không giới hạn tài khoản ads', 'Đồng bộ CPA cho team', 'Cập nhật 1 phút/lần', 'Cảnh báo thông minh 7 ngày', 'Bật/tắt & sửa ngân sách nhanh', 'Bulk action hàng loạt', 'Auto Care quảng cáo', 'Báo cáo lãi lỗ chi tiết theo SP', 'Hỗ trợ qua Zalo'],
    notIncluded: [],
    cta: 'Mua Business — Tiết kiệm nhất',
    popular: true,
  },
  {
    key: 'agency', name: 'Agency', icon: '🟩', color: '#10b981',
    priceMonth: 1200, priceYear: 960,
    desc: 'Agency, multi-shop, không giới hạn quy mô',
    features: ['6 Admin + Không giới hạn NV', 'Không giới hạn tài khoản ads', 'Đồng bộ CPA cho team', 'Cập nhật 1 phút/lần', 'Cảnh báo thông minh 7 ngày', 'Bulk action hàng loạt', 'Auto Care quảng cáo', 'Báo cáo lãi lỗ chi tiết theo SP', 'Hỗ trợ 1-1 Zalo/Call'],
    notIncluded: [],
    cta: 'Mua Agency',
  },
]

const FAQS = [
  { q: 'Dữ liệu tài khoản ads của tôi có an toàn không?', a: 'Hoàn toàn an toàn. Go Meta Ads Pro chạy 100% local trên Chrome của bạn — dữ liệu không gửi về server nào. Token Facebook chỉ lưu trên máy bạn và chỉ bạn thấy.' },
  { q: 'Tôi có thể dùng thử trước khi mua không?', a: 'Có. Gói dùng thử 7 ngày miễn phí cho trải nghiệm đầy đủ tính năng gói Agency. Sau 7 ngày bạn chọn gói phù hợp hoặc không cần tiếp tục — không tự động trừ tiền.' },
  { q: 'Cài Go Meta Ads Pro có làm Facebook khoá tài khoản ads không?', a: 'Không. Tool đọc dữ liệu qua API chính thức của Facebook, không can thiệp vào giao diện hay thao tác tự động trên Ads Manager. Hàng nghìn shop đang dùng mà không có vấn đề gì.' },
  { q: 'Tôi có 5 nhân viên, mỗi người 1 máy — có dùng được không?', a: 'Được. Gói Business hỗ trợ 5 nhân viên, mỗi người nhận key NV riêng. Admin set CPA mục tiêu, NV đồng bộ về máy và xem theo dõi chiến dịch của mình.' },
  { q: 'Tính năng tự động pause/tăng ngân sách hoạt động thế nào?', a: 'Bạn thiết lập điều kiện (CPA > ngưỡng, 0 đơn 3 ngày...) → tool tự kiểm tra mỗi phút khi Chrome mở → tự pause hoặc tăng ngân sách theo rule. Bạn nhận thông báo Telegram khi có action.' },
  { q: 'CPA mục tiêu được tính như thế nào?', a: 'Bạn nhập: giá bán, giá vốn, % ads, % hoàn hàng, phí ship... → tool tính lãi/đơn và ngược suy ra CPA tối đa để vẫn có lãi. Con số này đồng bộ cho cả team chỉ 1 click.' },
  { q: 'Tôi đổi máy hoặc cài lại Chrome thì sao?', a: 'Mỗi key được khóa với 1 thiết bị. Nếu cần đổi máy, vào trang Tra cứu → nhập SĐT đăng ký → reset thiết bị (tối đa 1 lần/tháng, hoàn toàn tự động).' },
  { q: 'Có hợp đồng hay tự động gia hạn không?', a: 'Không có hợp đồng, không tự gia hạn. Bạn thanh toán từng tháng hoặc từng năm — hệ thống cập nhật hạn sử dụng ngay sau khi nhận được thanh toán.' },
]

const WIZARD_STEPS = [
  {
    question: 'Bạn đang gặp vấn đề gì?',
    subtitle: 'Chọn một hoặc nhiều vấn đề bạn đang gặp (multi-select)',
    multi: true,
    choices: [
      { icon: '📉', title: 'CPA không kiểm soát', desc: 'Vượt ngưỡng không biết kịp' },
      { icon: '📋', title: 'Báo cáo thủ công', desc: 'Excel mỗi sáng tốn 1-2 tiếng' },
      { icon: '👥', title: 'NV làm sai CPA', desc: 'Mỗi người hiểu một kiểu' },
      { icon: '💸', title: 'Không biết lãi lỗ', desc: 'Không rõ camp nào đang lãi' },
      { icon: '🤖', title: 'Muốn tự động hóa', desc: 'Giảm thao tác thủ công' },
      { icon: '😴', title: 'Camp chạy ban đêm', desc: 'Tiêu tiền không ai kiểm soát' },
    ],
  },
  {
    question: 'Team của bạn có bao nhiêu người?',
    subtitle: 'Chọn quy mô team hiện tại',
    multi: false,
    choices: [
      { icon: '🧑', title: 'Chỉ mình tôi', desc: 'Tự quản lý toàn bộ' },
      { icon: '👫', title: '2–3 người', desc: 'Team nhỏ mới hình thành' },
      { icon: '👨‍👩‍👧‍👦', title: '4–10 người', desc: 'Team trung bình' },
      { icon: '🏢', title: '10+ người', desc: 'Agency hoặc công ty lớn' },
    ],
  },
  {
    question: 'Ngân sách ads trung bình mỗi tháng?',
    subtitle: 'Giúp chúng tôi gợi ý gói phù hợp nhất',
    multi: false,
    choices: [
      { icon: '💵', title: 'Dưới 10 triệu', desc: 'Shop nhỏ mới chạy ads' },
      { icon: '💴', title: '10–50 triệu', desc: 'Shop đang tăng trưởng' },
      { icon: '💶', title: '50–200 triệu', desc: 'Shop đang scale mạnh' },
      { icon: '💷', title: 'Trên 200 triệu', desc: 'Agency hoặc doanh nghiệp lớn' },
    ],
  },
  {
    question: 'Bạn đang quản lý bao nhiêu tài khoản ads?',
    subtitle: 'Số tài khoản Facebook Ads Manager',
    multi: false,
    choices: [
      { icon: '1️⃣', title: '1–3 tài khoản', desc: 'Tập trung 1 shop' },
      { icon: '4️⃣', title: '4–10 tài khoản', desc: 'Nhiều shop hoặc nhiều TK' },
      { icon: '🔟', title: '11–50 tài khoản', desc: 'Multi-shop hoặc agency nhỏ' },
      { icon: '♾️', title: '50+ tài khoản', desc: 'Agency lớn, nhiều khách hàng' },
    ],
  },
]

function getRecommendedPlan(answers) {
  const teamSize = answers[1]
  const budget = answers[2]
  const accounts = answers[3]
  if (teamSize === '10+ người' || budget === 'Trên 200 triệu' || accounts === '50+ tài khoản') return 'agency'
  if (teamSize === '4–10 người' || budget === '50–200 triệu' || accounts === '11–50 tài khoản') return 'business'
  return 'personal'
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function Home() {
  const { lang, t } = useLang()

  // Wizard state
  const [wizardStep, setWizardStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showPlans, setShowPlans] = useState(false)
  const [billingYear, setBillingYear] = useState(false)
  const recommendedPlan = showPlans ? getRecommendedPlan(answers) : null

  // FAQ
  const [openFaq, setOpenFaq] = useState(null)

  // Handlers
  function handleChoice(stepIdx, value) {
    const step = WIZARD_STEPS[stepIdx]
    if (step.multi) {
      const prev = answers[stepIdx] || []
      const exists = prev.includes(value)
      setAnswers(a => ({ ...a, [stepIdx]: exists ? prev.filter(x => x !== value) : [...prev, value] }))
    } else {
      setAnswers(a => ({ ...a, [stepIdx]: value }))
    }
  }

  function canProceed(stepIdx) {
    const step = WIZARD_STEPS[stepIdx]
    if (step.multi) return (answers[stepIdx] || []).length > 0
    return !!answers[stepIdx]
  }

  function isChoiceSelected(stepIdx, value) {
    const step = WIZARD_STEPS[stepIdx]
    if (step.multi) return (answers[stepIdx] || []).includes(value)
    return answers[stepIdx] === value
  }

  function nextStep() {
    if (wizardStep < WIZARD_STEPS.length - 1) setWizardStep(s => s + 1)
    else setShowPlans(true)
  }

  function resetWizard() {
    setWizardStep(0)
    setAnswers({})
    setShowPlans(false)
  }

  return (
    <>
      <Head>
        <title>Go Meta Ads Pro — Đồng bộ CPA, Biết ngay Lãi hay Lỗ | Facebook Ads Tool</title>
        <meta name="description" content="Theo dõi CPA từng sản phẩm, đồng bộ target cho cả team, cảnh báo thông minh 7 ngày. Hơn 2,800+ tài khoản ads đang dùng mỗi ngày." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Go Meta Ads Pro — Đồng bộ CPA, Biết ngay Lãi hay Lỗ" />
        <meta property="og:description" content="Công cụ Chrome Extension quản lý Facebook Ads thông minh — CPA realtime, cảnh báo tự động, báo cáo lãi/lỗ." />
        <link rel="icon" href="/logo.png" />
      </Head>

      <Navbar />

      {/* ══ 1. HERO ══════════════════════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg, #071a4a 0%, #0c2a72 40%, #1a3a8f 70%, #0e1f50 100%)',
        paddingTop: 'calc(var(--nav-h) + 60px)',
        paddingBottom: 100,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Animated mesh gradient */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'linear-gradient(270deg, #071a4a, #0c2a72, #1a3a8f, #0c2a72)',
          backgroundSize: '400% 400%',
          animation: 'gradient-move 10s ease infinite',
          opacity: 0.6,
        }} />
        {/* Glow blobs */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 560, height: 560, background: 'radial-gradient(circle, rgba(254,95,1,0.18) 0%, transparent 70%)', borderRadius: '50%', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: -120, left: -80, width: 460, height: 460, background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', borderRadius: '50%', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '40%', left: '30%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)', borderRadius: '50%', zIndex: 0 }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', maxWidth: 860, margin: '0 auto' }}>

            {/* Badge */}
            <Reveal>
              <span className="badge badge-white" style={{ marginBottom: 28 }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, background: '#fe5f01', borderRadius: '50%', animation: 'blink 1.5s infinite' }} />
                Hơn 500+ shop &amp; agency tin dùng mỗi ngày
              </span>
            </Reveal>

            {/* H1 */}
            <Reveal delay={80}>
              <h1 style={{ color: '#fff', marginBottom: 22 }}>
                Đồng bộ CPA từng sản phẩm<br />
                <span className="text-gradient">Biết ngay lãi hay lỗ</span>
              </h1>
            </Reveal>

            {/* Description */}
            <Reveal delay={160}>
              <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', lineHeight: 1.75, marginBottom: 36, maxWidth: 680, marginLeft: 'auto', marginRight: 'auto' }}>
                Thiết lập CPA tối đa theo kế hoạch kinh doanh, đồng bộ ngay cho cả team. Tool tự động so sánh với chi tiêu thực tế và cảnh báo khi chiến dịch bắt đầu lỗ — để bạn không còn đốt tiền ads mà không hay biết.
              </p>
            </Reveal>

            {/* CTAs */}
            <Reveal delay={240}>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
                <a href="/tai-xuong" className="btn btn-primary btn-lg">
                  🚀 Dùng thử 7 ngày miễn phí
                </a>
                <a href="#pricing" className="btn btn-glass btn-lg">
                  Xem bảng giá →
                </a>
              </div>
            </Reveal>

            {/* Trust badges */}
            <Reveal delay={320}>
              <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['✅ Cài đặt 3 phút', '🔒 Dữ liệu local, bảo mật tuyệt đối', '📵 Không cấp phép phức tạp', '💬 Hỗ trợ Zalo trực tiếp'].map(item => (
                  <span key={item} style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{item}</span>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Dashboard Mockup */}
          <Reveal delay={400}>
            <div style={{ marginTop: 64, maxWidth: 920, marginLeft: 'auto', marginRight: 'auto' }}>
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
                animation: 'float 6s ease-in-out infinite',
              }}>
                {/* Window chrome */}
                <div style={{ background: 'rgba(255,255,255,0.06)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 7, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
                  <span style={{ marginLeft: 12, fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Go Meta Ads Pro — Dashboard</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Cập nhật: vừa xong</span>
                </div>

                {/* Dashboard body */}
                <div style={{ padding: 24 }}>
                  {/* Stats row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
                    {[
                      { label: 'Chiến dịch', val: '18', color: '#60a5fa' },
                      { label: 'Chi tiêu hôm nay', val: '36.4M', color: '#e2e8f0' },
                      { label: 'Tổng đơn hàng', val: '924', color: '#10b981' },
                      { label: 'CPA cao ⚠️', val: '3', color: '#ef4444' },
                    ].map(s => (
                      <div key={s.label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Table header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.6fr 0.9fr 0.8fr 1.5fr 0.6fr 1fr', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 4 }}>
                    {['Chiến dịch', 'SP', 'Trạng thái', 'Chi tiêu', 'CPA thực / mục tiêu', 'ROAS', 'Lãi/Lỗ'].map(h => (
                      <div key={h} style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>
                    ))}
                  </div>

                  {/* Table rows */}
                  {[
                    { name: 'Chiến dịch lượt mua web 1', sp: 'SP-A', status: '● Đang chạy', chi: '5.2M', cpa: '30,100đ / 45,000đ', roas: '2.6×', laiLo: '+2,400,000đ', ok: true },
                    { name: 'Chiến dịch lượt mua web 2', sp: 'SP-B', status: '● Đang chạy', chi: '5.4M', cpa: '42,000đ / 80,000đ', roas: '2.9×', laiLo: '+1,500,000đ', ok: true },
                    { name: 'Chiến dịch lượt mua 3', sp: 'SP-A', status: '⚠ Hãy xem', chi: '4.1M', cpa: '63,800đ / 45,000đ', roas: '2.1×', laiLo: '-880,000đ', ok: false },
                  ].map((r, i) => (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '2fr 0.6fr 0.9fr 0.8fr 1.5fr 0.6fr 1fr',
                      gap: 8, alignItems: 'center', padding: '10px 0',
                      borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      fontSize: 12,
                    }}>
                      <div>
                        <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 12 }}>{r.name}</div>
                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 2 }}>Sản phẩm {r.sp}</div>
                      </div>
                      <div style={{ color: '#60a5fa', fontWeight: 700 }}>{r.sp}</div>
                      <div style={{ color: r.ok ? '#10b981' : '#f59e0b', fontWeight: 600, fontSize: 11 }}>{r.status}</div>
                      <div style={{ color: '#e2e8f0' }}>{r.chi}</div>
                      <div style={{ color: r.ok ? '#10b981' : '#ef4444', fontWeight: 700 }}>{r.cpa}</div>
                      <div style={{ color: '#f59e0b', fontWeight: 600 }}>{r.roas}</div>
                      <div style={{ color: r.ok ? '#10b981' : '#ef4444', fontWeight: 800 }}>{r.laiLo}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ 2. STATS BAR ═════════════════════════════════════════════════════ */}
      <section style={{ background: '#0c2a72', padding: '44px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 32 }}>
            {STATS.map((s, i) => (
              <Reveal key={i} delay={i * 100}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
                  <div className="stat-number">{s.display}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 3. PROBLEM SECTION ═══════════════════════════════════════════════ */}
      <section className="section" style={{ background: '#f8faff' }}>
        <div className="container">
          <Reveal>
            <div className="section-header">
              <span className="badge">😤 Bạn đang gặp vấn đề này?</span>
              <h2>Bạn đang lãng phí tiền ads<br /><span className="text-gradient">mà không hay biết?</span></h2>
              <p>Những vấn đề này đang xảy ra hàng ngày với hàng nghìn shop & agency tại Việt Nam — và đều có thể giải quyết tự động.</p>
            </div>
          </Reveal>

          <div className="grid-3">
            {PROBLEMS.map((p, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="card" style={{ borderLeft: '4px solid #ef4444', height: '100%' }}>
                  <div style={{ fontSize: 32, marginBottom: 14 }}>{p.icon}</div>
                  <h3 style={{ fontSize: 15, marginBottom: 8, color: 'var(--navy)' }}>{p.title}</h3>
                  <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.65 }}>{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 4. FEATURES SECTION ══════════════════════════════════════════════ */}
      <section className="section" id="features" style={{ background: '#fff' }}>
        <div className="container">
          <Reveal>
            <div className="section-header">
              <span className="badge">⚡ 6 tính năng cốt lõi</span>
              <h2>Sáu trụ cột giúp bạn<br /><span className="text-gradient">kinh doanh chủ động hơn</span></h2>
              <p>Mỗi tính năng giải quyết đúng 1 vấn đề thực tế mà shop & agency gặp phải mỗi ngày.</p>
            </div>
          </Reveal>

          <div className="grid-3">
            {FEATURES.map((f, i) => (
              <Reveal key={i} delay={i * 90}>
                <div className="card" style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: 'radial-gradient(circle, rgba(254,95,1,0.07) 0%, transparent 70%)', borderRadius: '0 0 0 80px' }} />
                  <div className="feature-icon">{f.icon}</div>
                  <h3 style={{ marginBottom: 10, color: 'var(--navy)' }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 18 }}>{f.desc}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {f.tags.map(tag => (
                      <span key={tag} className="tag tag-navy">{tag}</span>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 5. BEFORE / AFTER ════════════════════════════════════════════════ */}
      <section className="section" style={{ background: 'linear-gradient(135deg, #071a4a 0%, #0c2a72 50%, #1a3a8f 100%)' }}>
        <div className="container">
          <Reveal>
            <div className="section-header">
              <span className="badge badge-white">✨ So sánh trước và sau</span>
              <h2 style={{ color: '#fff' }}>Khác biệt rõ ràng<br />chỉ sau vài ngày sử dụng</h2>
            </div>
          </Reveal>

          <div className="grid-2" style={{ alignItems: 'start', gap: 32 }}>
            {/* Before */}
            <Reveal direction="left">
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-lg)', padding: 32, backdropFilter: 'blur(8px)' }}>
                <h3 style={{ color: '#fca5a5', fontSize: 17, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>😰</span> Trước — Quản lý thủ công
                </h3>
                <ul className="check-list">
                  {BEFORE_AFTER.map(([before], i) => (
                    <li key={i} style={{ color: 'rgba(255,255,255,0.65)', borderBottomColor: 'rgba(255,255,255,0.07)' }}>
                      <span className="cross" style={{ color: '#ef4444' }}>✗</span>
                      {before}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* After */}
            <Reveal direction="right" delay={150}>
              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1.5px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-lg)', padding: 32, backdropFilter: 'blur(8px)' }}>
                <h3 style={{ color: '#6ee7b7', fontSize: 17, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>🚀</span> Sau — Tự động &amp; đồng bộ
                </h3>
                <ul className="check-list">
                  {BEFORE_AFTER.map(([, after], i) => (
                    <li key={i} style={{ color: '#fff', borderBottomColor: 'rgba(255,255,255,0.07)', fontWeight: 500 }}>
                      <span className="check">✓</span>
                      {after}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══ 6. HOW IT WORKS ══════════════════════════════════════════════════ */}
      <section className="section" style={{ background: '#f8faff' }}>
        <div className="container">
          <Reveal>
            <div className="section-header">
              <span className="badge">⏱ Bắt đầu trong 3 phút</span>
              <h2>Cách hoạt động<br />cực kỳ đơn giản</h2>
              <p>Bốn bước từ cài đặt đến tối ưu chiến dịch đầu tiên — không cần kỹ thuật, không cần cấu hình phức tạp.</p>
            </div>
          </Reveal>

          <div className="grid-4" style={{ position: 'relative' }}>
            {STEPS.map((s, i) => (
              <Reveal key={i} delay={i * 110}>
                <div style={{ textAlign: 'center', padding: '24px 16px', position: 'relative' }}>
                  {/* Connector arrow (not on last item) */}
                  {i < STEPS.length - 1 && (
                    <div className="hide-mobile" style={{
                      position: 'absolute', top: 44, right: -16, width: 32, zIndex: 2,
                      color: 'var(--orange)', fontSize: 20, fontWeight: 900,
                    }}>→</div>
                  )}
                  {/* Number circle */}
                  <div style={{
                    width: 60, height: 60, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--navy), var(--navy2))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 18px', fontSize: 26,
                    boxShadow: '0 6px 20px rgba(12,42,114,0.28)',
                  }}>
                    {s.icon}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--orange)', letterSpacing: '1.2px', marginBottom: 10, textTransform: 'uppercase' }}>
                    Bước {s.num}
                  </div>
                  <h3 style={{ fontSize: 15, color: 'var(--navy)', marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 }}>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={500}>
            <div style={{ textAlign: 'center', marginTop: 48 }}>
              <a href="/tai-xuong" className="btn btn-primary btn-lg">
                📥 Cài tiện ích ngay — Miễn phí 7 ngày
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ 7. TESTIMONIALS ══════════════════════════════════════════════════ */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="container">
          <Reveal>
            <div className="section-header">
              <span className="badge">⭐ Đánh giá thực tế</span>
              <h2>Chủ shop &amp; Agency<br />nói gì về Go Meta Ads Pro?</h2>
              <p>4.9/5 sao từ 127+ đánh giá thực tế — không có review ảo, không có fake testimonial.</p>
            </div>
          </Reveal>

          <div className="grid-3">
            {TESTIMONIALS.map((tm, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Stars */}
                  <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                    {[...Array(5)].map((_, j) => <span key={j} style={{ color: '#f59e0b', fontSize: 17 }}>★</span>)}
                  </div>
                  {/* Quote */}
                  <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.75, flex: 1, fontStyle: 'italic' }}>
                    "{tm.content}"
                  </p>
                  {/* Footer */}
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--gray)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--navy), var(--navy2))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                      }}>{tm.avatar}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{tm.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>{tm.role}</div>
                      </div>
                    </div>
                    {/* Result badge */}
                    <div style={{
                      background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                      borderRadius: 8, padding: '8px 12px',
                      fontSize: 13, fontWeight: 700, color: '#059669',
                    }}>
                      KẾT QUẢ: {tm.result}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 8. PRICING WIZARD ════════════════════════════════════════════════ */}
      <section className="section" id="pricing" style={{ background: 'linear-gradient(135deg, #f0f4ff, #fff)' }}>
        <div className="container">
          <Reveal>
            <div className="section-header">
              <span className="badge">💰 Bảng giá thông minh</span>
              <h2>Tìm gói phù hợp với<br /><span className="text-gradient">nhu cầu của bạn</span></h2>
              <p>Trả lời 4 câu hỏi nhanh — chúng tôi gợi ý gói tốt nhất cho bạn.</p>
            </div>
          </Reveal>

          {!showPlans ? (
            <Reveal delay={100}>
              <div style={{ maxWidth: 720, margin: '0 auto' }}>
                {/* Step progress bar */}
                <div className="step-bar" style={{ marginBottom: 40 }}>
                  {WIZARD_STEPS.map((_, i) => (
                    <div key={i} className="step-item">
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className={`step-circle ${i < wizardStep ? 'done' : i === wizardStep ? 'active' : ''}`}>
                          {i < wizardStep ? '✓' : i + 1}
                        </div>
                        <div className="step-label" style={{ color: i <= wizardStep ? 'var(--navy)' : 'var(--text3)' }}>
                          {['Vấn đề', 'Team', 'Ngân sách', 'Tài khoản'][i]}
                        </div>
                      </div>
                      {i < WIZARD_STEPS.length - 1 && (
                        <div className={`step-line ${i < wizardStep ? 'done' : ''}`} style={{ marginBottom: 18 }} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Question card */}
                <div className="card" style={{ padding: 36 }}>
                  <h3 style={{ fontSize: 20, color: 'var(--navy)', marginBottom: 6 }}>
                    {WIZARD_STEPS[wizardStep].question}
                  </h3>
                  <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 28 }}>
                    {WIZARD_STEPS[wizardStep].subtitle}
                  </p>

                  <div className="choice-grid">
                    {WIZARD_STEPS[wizardStep].choices.map((c, ci) => {
                      const selected = isChoiceSelected(wizardStep, c.title)
                      return (
                        <button
                          key={ci}
                          className={`choice-card${selected ? ' selected' : ''}`}
                          onClick={() => handleChoice(wizardStep, c.title)}
                        >
                          <div className="choice-icon">{c.icon}</div>
                          <div className="choice-title">{c.title}</div>
                          <div className="choice-desc">{c.desc}</div>
                        </button>
                      )
                    })}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
                    <button
                      onClick={() => wizardStep > 0 ? setWizardStep(s => s - 1) : null}
                      disabled={wizardStep === 0}
                      className="btn btn-outline-navy btn-sm"
                      style={{ opacity: wizardStep === 0 ? 0 : 1, pointerEvents: wizardStep === 0 ? 'none' : 'auto' }}
                    >
                      ← Quay lại
                    </button>
                    <span style={{ fontSize: 13, color: 'var(--text3)' }}>{wizardStep + 1} / {WIZARD_STEPS.length}</span>
                    <button
                      onClick={nextStep}
                      disabled={!canProceed(wizardStep)}
                      className="btn btn-primary btn-sm"
                    >
                      {wizardStep < WIZARD_STEPS.length - 1 ? 'Tiếp theo →' : 'Xem gói phù hợp 🎯'}
                    </button>
                  </div>
                </div>
              </div>
            </Reveal>
          ) : (
            <Reveal delay={100}>
              <div>
                {/* Recommendation header */}
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                  <div className="highlight-box" style={{ display: 'inline-block', padding: '16px 32px', marginBottom: 24 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>
                      🎯 Dựa trên câu trả lời của bạn, chúng tôi gợi ý:
                      <span style={{ color: 'var(--orange)', marginLeft: 8, textTransform: 'capitalize' }}>
                        Gói {PLANS.find(p => p.key === recommendedPlan)?.name}
                      </span>
                    </div>
                  </div>

                  {/* Billing toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: billingYear ? 'var(--text3)' : 'var(--navy)' }}>Theo tháng</span>
                    <button
                      onClick={() => setBillingYear(b => !b)}
                      style={{
                        width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
                        background: billingYear ? 'var(--orange)' : 'var(--gray2)',
                        position: 'relative', transition: 'background 0.2s',
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: 4, left: billingYear ? 28 : 4,
                        transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                      }} />
                    </button>
                    <span style={{ fontSize: 14, fontWeight: 600, color: billingYear ? 'var(--navy)' : 'var(--text3)' }}>
                      Theo năm{' '}
                      <span style={{ background: 'var(--orange)', color: '#fff', padding: '2px 8px', borderRadius: 50, fontSize: 12, fontWeight: 700 }}>-20%</span>
                    </span>
                  </div>
                </div>

                {/* Plan cards */}
                <div className="grid-3" style={{ alignItems: 'start' }}>
                  {PLANS.map((plan, i) => {
                    const isRec = plan.key === recommendedPlan
                    const price = billingYear ? plan.priceYear : plan.priceMonth
                    return (
                      <div key={i} style={{
                        background: '#fff', borderRadius: 'var(--radius-xl)', padding: 32,
                        border: isRec ? `2px solid ${plan.color}` : '1.5px solid var(--gray2)',
                        position: 'relative', overflow: 'hidden',
                        boxShadow: isRec ? `0 20px 60px rgba(254,95,1,0.18)` : 'var(--shadow-sm)',
                        transform: isRec ? 'scale(1.03)' : 'scale(1)',
                        transition: 'var(--transition)',
                      }}>
                        {/* Recommended ribbon */}
                        {isRec && (
                          <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0,
                            background: `linear-gradient(135deg, ${plan.color}, #ff9a3c)`,
                            color: '#fff', textAlign: 'center', padding: '7px 12px',
                            fontSize: 12, fontWeight: 800, letterSpacing: '0.5px',
                          }}>
                            ⭐ PHÙ HỢP VỚI BẠN NHẤT
                          </div>
                        )}
                        {plan.popular && !isRec && (
                          <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0,
                            background: 'linear-gradient(135deg, var(--navy), var(--navy2))',
                            color: '#fff', textAlign: 'center', padding: '7px 12px',
                            fontSize: 12, fontWeight: 800,
                          }}>
                            PHỔ BIẾN NHẤT
                          </div>
                        )}

                        <div style={{ marginTop: (isRec || plan.popular) ? 28 : 0 }}>
                          <div style={{ fontSize: 30, marginBottom: 8 }}>{plan.icon}</div>
                          <h3 style={{ fontSize: 21, fontWeight: 800, color: plan.color, marginBottom: 4 }}>{plan.name}</h3>
                          <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 22 }}>{plan.desc}</p>

                          {/* Price */}
                          <div style={{ marginBottom: 24 }}>
                            <span style={{ fontSize: 42, fontWeight: 900, color: 'var(--navy)', lineHeight: 1 }}>
                              {price.toLocaleString('vi-VN')}K
                            </span>
                            <span style={{ fontSize: 14, color: 'var(--text3)' }}>/tháng</span>
                            {billingYear && (
                              <div style={{ fontSize: 12, color: '#059669', fontWeight: 600, marginTop: 4 }}>
                                Tiết kiệm {((plan.priceMonth - plan.priceYear) * 12).toLocaleString()}K/năm
                              </div>
                            )}
                          </div>

                          {/* CTA */}
                          <a
                            href={`/mua-goi?plan=${plan.key}&billing=${billingYear ? 'year' : 'month'}`}
                            className="btn btn-primary btn-block"
                            style={{ marginBottom: 24, background: plan.color, justifyContent: 'center', boxShadow: `0 4px 16px ${plan.color}40` }}
                          >
                            {plan.cta}
                          </a>

                          {/* Features */}
                          <ul className="check-list">
                            {plan.features.map(f => (
                              <li key={f}>
                                <span className="check">✓</span>
                                {f}
                              </li>
                            ))}
                            {plan.notIncluded.map(f => (
                              <li key={f} style={{ opacity: 0.4 }}>
                                <span style={{ color: 'var(--text3)', flexShrink: 0, marginTop: 2, fontWeight: 700 }}>✗</span>
                                <span style={{ textDecoration: 'line-through', color: 'var(--text3)' }}>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Reset + guarantees */}
                <div style={{ textAlign: 'center', marginTop: 44 }}>
                  <div style={{ display: 'flex', gap: 28, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
                    {['✅ Thanh toán an toàn', '🔒 Bảo mật dữ liệu local', '💬 Hỗ trợ Zalo trong 5 phút', '⚡ Không tự động gia hạn'].map(item => (
                      <span key={item} style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 500 }}>{item}</span>
                    ))}
                  </div>
                  <button onClick={resetWizard} style={{ background: 'none', border: 'none', color: 'var(--orange)', cursor: 'pointer', fontSize: 14, fontWeight: 600, textDecoration: 'underline', fontFamily: 'inherit' }}>
                    ← Làm lại khảo sát
                  </button>
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ══ 9. FAQ ═══════════════════════════════════════════════════════════ */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <Reveal>
            <div className="section-header">
              <span className="badge">❓ FAQ</span>
              <h2>Mọi thắc mắc<br />được giải đáp tại đây</h2>
            </div>
          </Reveal>

          <div>
            {FAQS.map((faq, i) => (
              <Reveal key={i} delay={i * 40}>
                <div className="accordion">
                  <button
                    className="accordion-trigger"
                    aria-expanded={openFaq === i}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span>{faq.q}</span>
                    <span className="icon">+</span>
                  </button>
                  {openFaq === i && (
                    <div className="accordion-body">{faq.a}</div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 10. FINAL CTA ════════════════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg, #0a1535 0%, #0c2a72 50%, #1a3a8f 100%)',
        padding: '96px 0',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Glow */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse, rgba(254,95,1,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />

        <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Reveal>
            <div style={{ fontSize: 52, marginBottom: 20 }}>🚀</div>
            <h2 style={{ color: '#fff', marginBottom: 16, fontSize: 'clamp(1.8rem, 4vw, 2.75rem)' }}>
              Bắt đầu tối ưu ads ngay hôm nay
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 17, lineHeight: 1.75, marginBottom: 40, maxWidth: 540, marginLeft: 'auto', marginRight: 'auto' }}>
              Dùng thử 7 ngày miễn phí — không cần thẻ tín dụng, không cần cài đặt phức tạp, hỗ trợ Zalo trực tiếp trong 5 phút.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
              <a href="/tai-xuong" className="btn btn-primary btn-xl">
                🎁 Dùng miễn phí 7 ngày
              </a>
              <a href="#pricing" className="btn btn-glass btn-xl">
                Xem bảng giá →
              </a>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
              Liên hệ hỗ trợ:{' '}
              <a href="https://zalo.me" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontWeight: 600 }}>Zalo</a>
              {' · '}
              <a href="https://t.me/Go_Meta_Ads_Pro_V1_bot" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontWeight: 600 }}>Telegram Bot</a>
              {' · '}
              <a href="mailto:admin@gonetwork.vn" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontWeight: 600 }}>admin@gonetwork.vn</a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ 11. SECURITY SECTION ═════════════════════════════════════════════ */}
      <section style={{ background: '#071a4a', padding: '72px 0' }}>
        <div className="container">
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 48, flexWrap: 'wrap' }}>
              {/* Left text */}
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>🔐</div>
                <h3 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 14 }}>
                  Dữ liệu của bạn — chỉ bạn thấy
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, lineHeight: 1.8 }}>
                  Go Meta Ads Pro là tiện ích Chrome chạy{' '}
                  <strong style={{ color: '#fff' }}>hoàn toàn local</strong> trên trình duyệt của bạn. Toàn bộ dữ liệu chiến dịch, chi tiêu, doanh thu chỉ hiển thị trên máy bạn — không gửi về server Go Meta Ads, không chia sẻ cho bên thứ ba. Hơn 500+ shop &amp; agency đã dùng từ 2024 mà chưa có sự cố bảo mật nào.
                </p>
              </div>

              {/* Right: 4 mini glass cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, flex: 1, minWidth: 260 }}>
                {[
                  { icon: '🏠', title: 'Dữ liệu local', desc: 'Lưu trên Chrome của bạn, không đâu khác' },
                  { icon: '🚫', title: 'Không gửi server', desc: 'Không log bất kỳ dữ liệu nào về phía chúng tôi' },
                  { icon: '⚡', title: 'Chạy ổn định', desc: 'Hoạt động liên tục từ 2024, không có downtime' },
                  { icon: '🔑', title: 'Key riêng biệt', desc: 'Mỗi thiết bị 1 key độc lập, không chia sẻ' },
                ].map((s, i) => (
                  <div key={i} className="card-glass" style={{ padding: 18 }}>
                    <div style={{ fontSize: 26, marginBottom: 8 }}>{s.icon}</div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{s.title}</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 1.55 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />

      <style>{`
        @media (max-width: 768px) {
          .grid-4 { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .grid-4 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}
