import { useLang } from '../lib/LangContext'

export default function Footer() {
  const { t } = useLang()
  return (
    <footer style={{ background: '#060e24', color: 'rgba(255,255,255,0.55)', paddingTop: 72, paddingBottom: 36 }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 56 }} className="footer-grid">

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <img src="/logo.png" alt="" style={{ height: 38, borderRadius: 10 }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Go Meta Ads Pro</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>by Go Media Vietnam</div>
              </div>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.75, maxWidth: 280, color: 'rgba(255,255,255,0.5)' }}>
              Công cụ quản lý Facebook Ads thông minh — theo dõi CPA, đồng bộ team, cảnh báo tự động, báo cáo lãi/lỗ realtime.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
              {[['💬 Zalo', 'https://zalo.me'], ['✈️ Telegram', 'https://t.me/Go_Meta_Ads_Pro_V1_bot']].map(([l, h]) => (
                <a key={l} href={h} target="_blank" rel="noopener" style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', padding: '7px 14px', borderRadius: 8,
                  fontSize: 13, fontWeight: 600, textDecoration: 'none',
                  transition: 'background 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.13)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                >{l}</a>
              ))}
            </div>
          </div>

          {[
            [t.footer.product, [['Tính năng', '/#features'], ['Bảng giá', '/#pricing'], ['Tải xuống', '/tai-xuong'], ['Cập nhật', '/tai-xuong']]],
            [t.footer.support, [['Hướng dẫn sử dụng', '/huong-dan'], ['Tra cứu tài khoản', '/quan-ly'], ['Reset thiết bị', '/quan-ly'], ['Liên hệ', 'mailto:admin@gonetwork.vn']]],
            [t.footer.business, [['Mua gói', '/mua-goi'], ['Affiliate', '/affiliate'], ['Dashboard Affiliate', '/affiliate#dashboard'], ['Nâng cấp gói', '/mua-goi']]],
          ].map(([title, links]) => (
            <div key={title}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{title}</div>
              {links.map(([label, href]) => (
                <a key={label} href={href} style={{ display: 'block', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 14, marginBottom: 10, transition: 'color 0.15s', fontWeight: 500 }}
                  onMouseOver={e => e.target.style.color = '#fff'}
                  onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.5)'}
                >{label}</a>
              ))}
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{t.footer.rights}</span>
          <div style={{ display: 'flex', gap: 24 }}>
            {[[t.footer.terms, '/terms'], [t.footer.privacy, '/privacy'], [t.footer.contact, 'mailto:admin@gonetwork.vn']].map(([l, h]) => (
              <a key={l} href={h} style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: 13, transition: 'color 0.15s' }}
                onMouseOver={e => e.target.style.color = 'rgba(255,255,255,0.8)'}
                onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
              >{l}</a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .footer-grid { grid-template-columns: 2fr 1fr 1fr 1fr; }
        @media (max-width: 900px) { .footer-grid { grid-template-columns: 1fr 1fr !important; } .footer-grid > div:first-child { grid-column: 1/-1; } }
        @media (max-width: 480px) { .footer-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </footer>
  )
}
