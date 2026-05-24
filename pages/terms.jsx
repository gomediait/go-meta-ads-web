import Head from 'next/head'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useLang } from '../lib/LangContext'

const CONTENT = {
  vi: {
    title: 'Điều khoản sử dụng',
    subtitle: 'Terms of Service',
    updated: 'Ngày cập nhật: 15/05/2026',
    toggleLabel: 'EN',
    sections: [
      {
        icon: '📋',
        heading: '1. Giới thiệu dịch vụ',
        body: 'Go Meta Ads Pro là tiện ích Chrome (Chrome Extension) hỗ trợ quản lý và tối ưu quảng cáo Facebook/Meta. Dịch vụ được cung cấp bởi GoNetwork và hoạt động theo mô hình đăng ký theo gói (subscription). Bằng cách sử dụng dịch vụ, bạn đồng ý tuân thủ các điều khoản được nêu trong tài liệu này.',
      },
      {
        icon: '🔑',
        heading: '2. Quy định sử dụng key kích hoạt',
        body: 'Mỗi key kích hoạt chỉ được phép sử dụng trên 01 (một) thiết bị tại một thời điểm. Nghiêm cấm chia sẻ, chuyển nhượng, bán lại hoặc phân phối key cho bất kỳ bên thứ ba nào. Hành vi sử dụng key trên nhiều thiết bị hoặc chia sẻ trái phép sẽ dẫn đến việc khóa key vĩnh viễn mà không hoàn tiền. GoNetwork có quyền thu hồi key bất kỳ lúc nào nếu phát hiện vi phạm.',
      },
      {
        icon: '💳',
        heading: '3. Thanh toán và chính sách hoàn tiền',
        body: 'Thanh toán được thực hiện qua chuyển khoản ngân hàng trước khi nhận key. Sau khi key đã được cấp và kích hoạt thành công, chúng tôi không hỗ trợ hoàn tiền với bất kỳ lý do nào. Chúng tôi cung cấp gói dùng thử 3 ngày miễn phí để bạn trải nghiệm đầy đủ tính năng trước khi quyết định mua. Vui lòng kiểm tra kỹ trước khi thanh toán.',
      },
      {
        icon: '⚠️',
        heading: '4. Giới hạn trách nhiệm',
        body: 'GoNetwork không chịu trách nhiệm về bất kỳ tổn thất nào phát sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ, bao gồm nhưng không giới hạn: mất doanh thu, mất dữ liệu, hoặc các thiệt hại gián tiếp khác. Dịch vụ được cung cấp "nguyên trạng" (as-is). Chúng tôi có quyền cập nhật, thay đổi hoặc ngừng dịch vụ bất kỳ lúc nào với thông báo trước.',
      },
      {
        icon: '✉️',
        heading: '5. Liên hệ',
        body: 'Nếu bạn có câu hỏi về điều khoản sử dụng, vui lòng liên hệ chúng tôi qua email: admin@gonetwork.vn. Chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.',
      },
    ],
  },
  en: {
    title: 'Terms of Service',
    subtitle: 'Điều khoản sử dụng',
    updated: 'Last updated: 15/05/2026',
    toggleLabel: 'VI',
    sections: [
      {
        icon: '📋',
        heading: '1. About the Service',
        body: 'Go Meta Ads Pro is a Chrome Extension that helps manage and optimize Facebook/Meta advertising campaigns. The service is provided by GoNetwork and operates on a subscription basis. By using the service, you agree to comply with the terms outlined in this document.',
      },
      {
        icon: '🔑',
        heading: '2. Activation Key Policy',
        body: 'Each activation key may only be used on one (1) device at a time. Sharing, transferring, reselling, or distributing the key to any third party is strictly prohibited. Using the key on multiple devices or unauthorized sharing will result in permanent key revocation without a refund. GoNetwork reserves the right to revoke any key at any time if a violation is detected.',
      },
      {
        icon: '💳',
        heading: '3. Payment & Refund Policy',
        body: 'Payment is made via bank transfer before receiving the key. Once the key has been issued and successfully activated, we do not support refunds for any reason. We offer a free 1-day trial so you can fully experience all features before making a purchase decision. Please review carefully before completing payment.',
      },
      {
        icon: '⚠️',
        heading: '4. Limitation of Liability',
        body: 'GoNetwork is not liable for any losses arising from the use or inability to use the service, including but not limited to: loss of revenue, data loss, or other indirect damages. The service is provided "as-is." We reserve the right to update, modify, or discontinue the service at any time with prior notice.',
      },
      {
        icon: '✉️',
        heading: '5. Contact',
        body: 'If you have questions about these Terms of Service, please contact us at: admin@gonetwork.vn. We will respond within 24 business hours.',
      },
    ],
  },
}

export default function Terms() {
  const { lang } = useLang()
  const isEN = lang === 'en'
  const c = isEN ? CONTENT.en : CONTENT.vi

  return (
    <>
      <Head>
        <title>{isEN ? 'Terms of Service — Go Meta Ads Pro' : 'Điều khoản sử dụng — Go Meta Ads Pro'}</title>
        <meta name="description" content={isEN
          ? 'Terms of Service for Go Meta Ads Pro Chrome Extension.'
          : 'Điều khoản sử dụng của tiện ích Go Meta Ads Pro.'
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
