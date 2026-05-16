import { useLang } from '../lib/LangContext'

export default function Footer() {
  const { t } = useLang()
  const f = t.footer

  return (
    <footer style={{ background: '#000913', borderTop: '1px solid rgba(0,199,222,0.08)', paddingTop: 72, paddingBottom: 36, position: 'relative', overflow: 'hidden' }}>
      {/* Teal glow */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 200, background: 'radial-gradient(ellipse at 50% 0%, rgba(0,199,222,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 56 }} className="footer-grid">

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
              Công cụ quản lý Facebook Ads thông minh — theo dõi CPA, đồng bộ team, cảnh báo tự động, báo cáo lãi/lỗ realtime.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
              {[
                ['💬 Zalo', 'https://zalo.me'],
                ['✈️ Telegram', 'https://t.me/Go_Meta_Ads_Pro_V1_bot'],
              ].map(([label, href]) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{
                  background: 'rgba(0,199,222,0.06)', border: '1px solid rgba(0,199,222,0.15)',
                  color: 'var(--teal)', padding: '7px 14px', borderRadius: 8,
                  fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(0,199,222,0.12)'; e.currentTarget.style.borderColor = 'rgba(0,199,222,0.3)' }}
                onMouseOut={e  => { e.currentTarget.style.background = 'rgba(0,199,222,0.06)'; e.currentTarget.style.borderColor = 'rgba(0,199,222,0.15)' }}
                >{label}</a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {[
            [f.product,  f.productLinks  || [['Tính năng','/#features'],['Bảng giá','/#pricing'],['Tải xuống','/tai-xuong'],['Cập nhật','/tai-xuong']]],
            [f.support,  f.supportLinks  || [['Hướng dẫn','/huong-dan'],['Tra cứu key','/quan-ly'],['Reset thiết bị','/quan-ly'],['Liên hệ','mailto:admin@gonetwork.vn']]],
            [f.business, f.businessLinks || [['Mua gói','/mua-goi'],['Affiliate','/affiliate'],['Tra cứu','/quan-ly'],['Nâng cấp','/mua-goi']]],
          ].map(([title, links]) => (
            <div key={title}>
              <div style={{ color: 'var(--teal)', fontWeight: 700, fontSize: 12, marginBottom: 18, textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</div>
              {(links || []).map(([label, href]) => (
                <a key={label} href={href} style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 10, fontWeight: 500, transition: 'color 0.15s' }}
                  onMouseOver={e => e.target.style.color = '#fff'}
                  onMouseOut={e  => e.target.style.color = 'rgba(255,255,255,0.4)'}
                >{label}</a>
              ))}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="glow-line-h" style={{ marginBottom: 24 }} />

        {/* Bottom bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>{f.copyright || '© 2026 Go Media Vietnam · Go Meta Ads Pro'}</span>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              [f.terms || 'Điều khoản', '/terms'],
              [f.privacy || 'Bảo mật', '/privacy'],
              [f.contact || 'Liên hệ', 'mailto:admin@gonetwork.vn'],
            ].map(([label, href]) => (
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
