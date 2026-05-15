import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ background: '#0a1535', color: 'rgba(255,255,255,0.6)', paddingTop: 64, paddingBottom: 32 }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 48 }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <img src="/logo.png" alt="" style={{ height: 36, borderRadius: 8 }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Go Meta Ads Pro</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>by Go Media Vietnam</div>
              </div>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 280 }}>
              Công cụ quản lý Facebook Ads thông minh — theo dõi CPA, đồng bộ team, cảnh báo tự động.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <a href="https://zalo.me" target="_blank" style={socialStyle}>💬 Zalo</a>
              <a href="https://t.me/Go_Meta_Ads_Pro_V1_bot" target="_blank" style={socialStyle}>✈️ Telegram</a>
            </div>
          </div>

          {/* Links */}
          <div>
            <div style={footerTitleStyle}>Sản phẩm</div>
            {[['Tính năng', '/#features'], ['Bảng giá', '/#pricing'], ['Tải xuống', '/tai-xuong'], ['Cập nhật', '/tai-xuong']].map(([l,h]) =>
              <a key={l} href={h} style={footerLinkStyle}>{l}</a>
            )}
          </div>
          <div>
            <div style={footerTitleStyle}>Hỗ trợ</div>
            {[['Hướng dẫn sử dụng', '/huong-dan'], ['Tra cứu tài khoản', '/quan-ly'], ['Reset thiết bị', '/quan-ly'], ['Liên hệ', 'mailto:admin@gonetwork.vn']].map(([l,h]) =>
              <a key={l} href={h} style={footerLinkStyle}>{l}</a>
            )}
          </div>
          <div>
            <div style={footerTitleStyle}>Kinh doanh</div>
            {[['Mua gói', '/mua-goi'], ['Affiliate', '/affiliate'], ['Dashboard Affiliate', '/affiliate#dashboard'], ['Nâng cấp gói', '/mua-goi']].map(([l,h]) =>
              <a key={l} href={h} style={footerLinkStyle}>{l}</a>
            )}
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 13 }}>© 2026 Go Media Vietnam · Go Meta Ads Pro</span>
          <div style={{ display: 'flex', gap: 20 }}>
            {[['Điều khoản', '/terms'], ['Bảo mật', '/privacy'], ['Liên hệ', 'mailto:admin@gonetwork.vn']].map(([l,h]) =>
              <a key={l} href={h} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 13 }}>{l}</a>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          footer > div > div:first-child { grid-template-columns: 1fr 1fr !important; }
          footer > div > div:first-child > div:first-child { grid-column: 1/-1; }
        }
        @media (max-width: 480px) {
          footer > div > div:first-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  )
}

const footerTitleStyle = { color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }
const footerLinkStyle = { display: 'block', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: 14, marginBottom: 10, transition: 'color 0.15s' }
const socialStyle = { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }
