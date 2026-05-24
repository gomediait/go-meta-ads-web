import { useLang } from '../lib/LangContext'

export default function Footer() {
  const { t } = useLang()
  const f = t.footer || {}

  // Normalize links: support cả array-of-objects { label, href } và array-of-arrays [label, href]
  const normalizeLinks = (links) => {
    if (!Array.isArray(links)) return []
    return links.map(item => Array.isArray(item) ? item : [item.label, item.href])
  }

  const sections = [
    [f.productLabel  || f.product  || 'Sản phẩm',  normalizeLinks(f.productLinks)  || [['Tính năng','/#features'],['Bảng giá','/#pricing'],['Tải xuống','/tai-xuong'],['Hướng dẫn','/huong-dan']]],
    [f.supportLabel  || f.support  || 'Hỗ trợ',    normalizeLinks(f.supportLinks)  || [['Tra cứu key','/quan-ly'],['Reset thiết bị','/quan-ly'],['Zalo hỗ trợ','https://zalo.me'],['Liên hệ','mailto:admin@gonetwork.vn']]],
    [f.businessLabel || f.business || 'Kinh doanh', normalizeLinks(f.businessLinks) || [['Mua gói','/mua-goi'],['Affiliate','/affiliate'],['Tra cứu','/quan-ly'],['Nâng cấp','/mua-goi']]],
  ]

  return (
    <footer style={{ background: 'linear-gradient(135deg, #071d52 0%, #0c2a72 100%)', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 72, paddingBottom: 36, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 200, background: 'radial-gradient(ellipse at 50% 0%, rgba(0,199,222,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="container">
        <div className="footer-grid" style={{ display: 'grid', gap: 48, marginBottom: 56 }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <img src="/logo.png" alt="" style={{ height: 38, borderRadius: 10, border: '1px solid rgba(0,199,222,0.2)' }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Go Meta Ads Pro</div>
                <div style={{ fontSize: 11, color: 'rgba(0,199,222,0.6)' }}>by Go Media Vietnam</div>
              </div>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.75, maxWidth: 280, color: 'rgba(255,255,255,0.45)' }}>
              {f.tagline || 'Công cụ AI quản lý Facebook Ads — kiểm soát CPA, tự động hóa, báo cáo realtime.'}
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
              {[['💬 Zalo', 'https://zalo.me/0833336851'], ['✈️ Telegram', 'https://t.me/Go_Meta_Ads_Pro_V1_bot']].map(([label, href]) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{
                  background: 'rgba(0,199,222,0.06)', border: '1px solid rgba(0,199,222,0.15)',
                  color: 'var(--teal)', padding: '7px 14px', borderRadius: 8,
                  fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(0,199,222,0.12)' }}
                onMouseOut={e  => { e.currentTarget.style.background = 'rgba(0,199,222,0.06)' }}
                >{label}</a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {sections.map(([title, links]) => (
            <div key={title}>
              <div style={{ color: 'var(--teal)', fontWeight: 700, fontSize: 12, marginBottom: 18, textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</div>
              {links.map(([label, href]) => (
                <a key={label} href={href} style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 10, fontWeight: 500, transition: 'color 0.15s' }}
                  onMouseOver={e => e.target.style.color = '#fff'}
                  onMouseOut={e  => e.target.style.color = 'rgba(255,255,255,0.4)'}
                >{label}</a>
              ))}
            </div>
          ))}
        </div>

        <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(0,199,222,0.3),transparent)', marginBottom: 24 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>{f.copyright || '© 2026 Go Media Vietnam · Go Meta Ads Pro'}</span>
          <div style={{ display: 'flex', gap: 24 }}>
            {[[f.terms || 'Điều khoản', '/terms'], [f.privacy || 'Bảo mật', '/privacy'], [f.contact || 'Liên hệ', 'mailto:admin@gonetwork.vn']].map(([label, href]) => (
              <a key={label} href={href} style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, transition: 'color 0.15s' }}
                onMouseOver={e => e.target.style.color = 'var(--teal)'}
                onMouseOut={e  => e.target.style.color = 'rgba(255,255,255,0.3)'}
              >{label}</a>
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
