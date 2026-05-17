import { useState, useEffect } from 'react'
import { useLang } from '../lib/LangContext'

export default function Navbar() {
  const { lang, setLang, t } = useLang()
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const links = [
    [t.nav.features,  '/#features'],
    [t.nav.pricing,   '/#pricing'],
    [t.nav.guide,     '/huong-dan'],
    [t.nav.affiliate, '/affiliate'],
    [t.nav.download,  '/tai-xuong'],
    [lang === 'en' ? '🎫 Support' : '🎫 Hỗ trợ', '/ho-tro'],
  ]

  return (
    <>
      <nav style={{
        position: 'fixed', top: 'var(--counter-h, 40px)', left: 0, right: 0, zIndex: 1001,
        height: 'var(--nav-h)',
        display: 'flex', alignItems: 'center', padding: '0 24px',
        /* Luôn có dark bg tối thiểu để text trắng luôn đọc được trên mọi nền */
        background: scrolled ? 'rgba(0,13,26,0.97)' : 'rgba(0,13,26,0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: scrolled ? '1px solid rgba(0,199,222,0.08)' : '1px solid rgba(255,255,255,0.04)',
        transition: 'background 0.35s ease',
        boxShadow: scrolled ? '0 2px 24px rgba(0,0,0,0.4)' : 'none',
      }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', gap: 8 }}>

          {/* Logo */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <img src="/logo.png" alt="Go Meta Ads Pro" style={{ height: 36, borderRadius: 9, border: '1px solid rgba(0,199,222,0.2)' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>Go Meta Ads Pro</div>
              <div style={{ fontSize: 10, color: 'rgba(0,199,222,0.6)', fontWeight: 500 }}>by Go Media Vietnam</div>
            </div>
          </a>

          {/* Desktop links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 40, flex: 1 }} className="hide-mobile">
            {links.map(([label, href]) => (
              <a key={label} href={href} className="nav-link">{label}</a>
            ))}
          </div>

          {/* Right: lang + lookup + CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto', flexShrink: 0 }}>

            {/* Language switcher */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-full)', padding: 3, gap: 2 }} className="hide-mobile">
              {[['vi', '🇻🇳 VI'], ['en', '🇬🇧 EN']].map(([l, label]) => (
                <button key={l} onClick={() => setLang(l)} style={{
                  padding: '4px 12px', borderRadius: 'var(--radius-full)',
                  border: 'none', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  background: lang === l ? 'var(--teal)' : 'transparent',
                  color: lang === l ? '#000' : 'var(--text2)',
                  transition: 'all 0.2s',
                }}>
                  {label}
                </button>
              ))}
            </div>

            <a href="/quan-ly" className="hide-mobile" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', padding: '8px 12px', borderRadius: 8, transition: 'color 0.2s' }}
              onMouseOver={e => e.target.style.color = 'var(--teal)'}
              onMouseOut={e  => e.target.style.color = 'var(--text2)'}>
              {t.nav.lookupKey}
            </a>

            <a href="/tai-xuong" className="btn btn-teal btn-sm hide-mobile">
              🚀 {t.nav.tryFree}
            </a>

            {/* Mobile burger */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="hide-desktop" style={{
              background: 'rgba(0,199,222,0.08)', border: '1px solid rgba(0,199,222,0.15)',
              color: 'var(--teal)', padding: '8px 12px', borderRadius: 10,
              fontSize: 18, lineHeight: 1,
            }}>
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 'var(--nav-h)', left: 0, right: 0, zIndex: 999,
          background: 'rgba(0,10,20,0.98)', backdropFilter: 'blur(20px)',
          padding: '20px 24px 32px',
          borderBottom: '1px solid rgba(0,199,222,0.08)',
          animation: 'slideDown 0.2s ease',
        }}>
          {links.map(([label, href]) => (
            <a key={label} href={href} onClick={() => setMenuOpen(false)} style={{
              display: 'block', color: 'var(--text2)',
              padding: '14px 0', fontSize: 16, fontWeight: 600,
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              transition: 'color 0.15s',
            }}
            onMouseOver={e => e.target.style.color = 'var(--teal)'}
            onMouseOut={e  => e.target.style.color = 'var(--text2)'}
            >{label}</a>
          ))}

          {/* Lang switcher mobile */}
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            {[['vi', '🇻🇳 Tiếng Việt'], ['en', '🇬🇧 English']].map(([l, label]) => (
              <button key={l} onClick={() => setLang(l)} style={{
                padding: '9px 18px', borderRadius: 'var(--radius-full)',
                border: lang === l ? '1px solid var(--teal)' : '1px solid var(--border2)',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                background: lang === l ? 'rgba(0,199,222,0.15)' : 'var(--surface)',
                color: lang === l ? 'var(--teal)' : 'var(--text2)',
                transition: 'all 0.2s',
              }}>
                {label}
              </button>
            ))}
          </div>

          <a href="/tai-xuong" onClick={() => setMenuOpen(false)}
            className="btn btn-teal btn-block" style={{ marginTop: 16 }}>
            🚀 {t.nav.tryFree}
          </a>
        </div>
      )}

      <style>{`
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </>
  )
}
