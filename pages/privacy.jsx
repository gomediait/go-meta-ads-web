import Head from 'next/head'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useLang } from '../lib/LangContext'

const CONTENT = {
  vi: {
    title: 'Chính sách bảo mật',
    subtitle: 'Privacy Policy',
    updated: 'Ngày cập nhật: 15/05/2026',
    sections: [
      {
        icon: '📂',
        heading: '1. Dữ liệu chúng tôi thu thập',
        body: 'Chúng tôi thu thập các thông tin cần thiết để cung cấp dịch vụ, bao gồm: họ và tên, địa chỉ email, số điện thoại (khi bạn đăng ký gói hoặc yêu cầu link tải xuống), và tên shop/công ty (tùy chọn). Chúng tôi cũng lưu thông tin đơn hàng và lịch sử kích hoạt key để hỗ trợ và kiểm tra.',
      },
      {
        icon: '🎯',
        heading: '2. Cách chúng tôi sử dụng dữ liệu',
        body: 'Thông tin bạn cung cấp được sử dụng để: (1) gửi key kích hoạt sau khi thanh toán xác nhận, (2) liên hệ hỗ trợ kỹ thuật qua Zalo hoặc Email, (3) thông báo về cập nhật phiên bản mới, và (4) quản lý nội bộ đơn hàng. Chúng tôi không bán, cho thuê hoặc chia sẻ thông tin cá nhân của bạn với bất kỳ bên thứ ba nào vì mục đích thương mại.',
      },
      {
        icon: '🛡️',
        heading: '3. Bảo mật dữ liệu chiến dịch',
        body: 'Tất cả dữ liệu chiến dịch quảng cáo của bạn (CPA, ngân sách, báo cáo) được xử lý và lưu trữ 100% trên thiết bị cục bộ (local) của bạn thông qua tiện ích Chrome. Không có dữ liệu chiến dịch nào được gửi lên server của chúng tôi. Điều này đảm bảo dữ liệu kinh doanh của bạn hoàn toàn riêng tư và an toàn.',
      },
      {
        icon: '👤',
        heading: '4. Quyền của người dùng',
        body: 'Bạn có quyền yêu cầu xem, chỉnh sửa hoặc xóa thông tin cá nhân của mình bất kỳ lúc nào. Để thực hiện, hãy gửi email đến admin@gonetwork.vn với tiêu đề "Yêu cầu dữ liệu cá nhân". Chúng tôi sẽ xử lý yêu cầu trong vòng 5 ngày làm việc.',
      },
      {
        icon: '🍪',
        heading: '5. Cookie và phân tích',
        body: 'Website của chúng tôi có thể sử dụng cookie kỹ thuật tối thiểu để duy trì trạng thái ngôn ngữ và phiên làm việc. Chúng tôi không sử dụng cookie theo dõi quảng cáo của bên thứ ba. Không có công cụ phân tích hành vi người dùng nào được tích hợp mà không có sự đồng ý của bạn.',
      },
      {
        icon: '✉️',
        heading: '6. Liên hệ',
        body: 'Nếu bạn có câu hỏi về chính sách bảo mật hoặc muốn thực hiện quyền của mình, vui lòng liên hệ: admin@gonetwork.vn. Chúng tôi cam kết phản hồi trong vòng 24 giờ làm việc.',
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    subtitle: 'Chính sách bảo mật',
    updated: 'Last updated: 15/05/2026',
    sections: [
      {
        icon: '📂',
        heading: '1. Data We Collect',
        body: 'We collect necessary information to provide our service, including: full name, email address, phone number (when you register for a plan or request a download link), and shop/company name (optional). We also store order information and key activation history for support and verification purposes.',
      },
      {
        icon: '🎯',
        heading: '2. How We Use Your Data',
        body: 'The information you provide is used to: (1) send the activation key after payment is confirmed, (2) provide technical support via Zalo or Email, (3) notify you about new version updates, and (4) manage orders internally. We do not sell, rent, or share your personal information with any third party for commercial purposes.',
      },
      {
        icon: '🛡️',
        heading: '3. Campaign Data Security',
        body: 'All your advertising campaign data (CPA, budgets, reports) is processed and stored 100% locally on your device through the Chrome Extension. No campaign data is sent to our servers. This ensures your business data remains completely private and secure.',
      },
      {
        icon: '👤',
        heading: '4. Your Rights',
        body: 'You have the right to request access, correction, or deletion of your personal information at any time. To do so, send an email to admin@gonetwork.vn with the subject "Personal Data Request." We will process your request within 5 business days.',
      },
      {
        icon: '🍪',
        heading: '5. Cookies & Analytics',
        body: 'Our website may use minimal technical cookies to maintain language preferences and session state. We do not use third-party advertising tracking cookies. No behavioral analytics tools are integrated without your consent.',
      },
      {
        icon: '✉️',
        heading: '6. Contact',
        body: 'If you have questions about this Privacy Policy or wish to exercise your rights, please contact: admin@gonetwork.vn. We are committed to responding within 24 business hours.',
      },
    ],
  },
}

export default function Privacy() {
  const { lang } = useLang()
  const isEN = lang === 'en'
  const c = isEN ? CONTENT.en : CONTENT.vi

  return (
    <>
      <Head>
        <title>Go Meta Ads Pro</title>
        <meta name="description" content={isEN
          ? 'Privacy Policy for Go Meta Ads Pro Chrome Extension.'
          : 'Chính sách bảo mật của tiện ích Go Meta Ads Pro.'
        } />
      </Head>
      <Navbar />

      <main style={{ background: '#000d1a', minHeight: '100vh', paddingTop: 'calc(var(--header-h) + 40px)', paddingBottom: 80 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 16px' }}>

          {/* Page header */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h1 style={{ color: '#fff', fontSize: 'clamp(24px,4vw,38px)', fontWeight: 800, margin: '0 0 8px' }}>
              {c.title}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, margin: '0 0 16px' }}>
              {c.subtitle}
            </p>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>{c.updated}</span>
          </div>

          {/* Sections */}
          {c.sections.map((sec, i) => (
            <div
              key={i}
              style={{
                background: '#fff', borderRadius: 16,
                padding: 'clamp(22px,4vw,36px)',
                marginBottom: 20,
                boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <span style={{ fontSize: 26, flexShrink: 0, marginTop: 2 }}>{sec.icon}</span>
                <div>
                  <h2 style={{ color: '#0c2a72', fontWeight: 800, fontSize: 17, margin: '0 0 10px' }}>
                    {sec.heading}
                  </h2>
                  <p style={{ color: '#334155', fontSize: 15, lineHeight: 1.8, margin: 0 }}>
                    {sec.body}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Back link */}
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <a
              href="/"
              style={{
                color: 'rgba(255,255,255,0.5)', fontSize: 14, textDecoration: 'none',
                fontFamily: 'inherit',
              }}
            >
              ← {isEN ? 'Back to homepage' : 'Về trang chủ'}
            </a>
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        @media (max-width: 480px) {
          main { padding-top: calc(var(--header-h) + 24px) !important; }
        }
      `}</style>
    </>
  )
}
