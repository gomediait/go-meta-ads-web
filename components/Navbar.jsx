import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLang } from '../lib/LangContext'

export default function Navbar() {
  const { lang, setLang, t } = useLang()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const links = [
    [t.nav.features, '/#features'],
    [t.nav.pricing, '/#pricing'],
    [t.nav.guide, '/huong-dan'],
    [t.nav.affiliate, '/affiliate'],
    [t.nav.download, '/tai-xuong'],
  ]

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        height: 'var(--nav-h)',
        display: 'flex', alignItems: 'center', padding: '0 24px',
        background: scrolled ? 'rgba(10,20,60,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : 'none',
        transition: 'background 0.35s ease, border-color 0.35s ease',
        boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.3)' : 'none',
      }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', gap: 8 }}>

          {/* Logo */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
            <img src="/logo.png" alt="Go Meta Ads Pro" style={{ height: 36, borderRadius: 9, objectFit: 'cover' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.2, fontFamily: 'Be Vietnam Pro, sans-serif' }}>Go Meta Ads Pro</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>by Go Media Vietnam</div>
            </div>
          </a>

          {/* Desktop links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 36, flex: 1 }} className="hide-mobile">
            {links.map(([label, href]) => (
              <a key={label} href={href} className="nav-link">{label}</a>
            ))}
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto', flexShrink: 0 }}>
            {/* Language switcher */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-full)', padding: 3, gap: 2 }} className="hide-mobile">
              {['vi', 'en'].map(l => (
                <button key={l} onClick={() => setLang(l)} style={{
                  padding: '4px 12px', borderRadius: 'var(--radius-full)', border: 'none',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  background: lang === l ? '#fff' : 'transparent',
                  color: lang === l ? 'var(--navy)' : 'rgba(255,255,255,0.7)',
                  transition: 'all 0.2s',
                }}>
                  {l === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}
                </button>
              ))}
            </div>

            <a href="/quan-ly" className="hide-mobile" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)', textDecoration: 'none', padding: '8px 14px', transition: 'color 0.2s' }}
              onMouseOver={e => e.target.style.color = '#fff'}
              onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.75)'}>
              {t.nav.lookupKey}
            </a>

            <a href="/tai-xuong" className="btn btn-primary btn-sm hide-mobile">
              🚀 {t.nav.tryFree}
            </a>

            {/* Mobile burger */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="hide-desktop" style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', padding: '8px 12px', borderRadius: 10,
              cursor: 'pointer', fontSize: 18, lineHeight: 1,
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
          background: 'rgba(8,18,48,0.98)', backdropFilter: 'blur(20px)',
          padding: '20px 24px 28px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          animation: 'slideDown 0.2s ease',
        }}>
          {links.map(([label, href]) => (
            <a key={label} href={href} onClick={() => setMenuOpen(false)} style={{
              display: 'block', color: 'rgba(255,255,255,0.85)', textDecoration: 'none',
              padding: '13px 0', fontSize: 16, fontWeight: 600,
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              transition: 'color 0.15s',
            }}>{label}</a>
          ))}

          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            {['vi', 'en'].map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                padding: '8px 18px', borderRadius: 'var(--radius-full)', border: 'none',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                background: lang === l ? '#fff' : 'rgba(255,255,255,0.1)',
                color: lang === l ? 'var(--navy)' : 'rgba(255,255,255,0.7)',
              }}>
                {l === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
              </button>
            ))}
          </div>

          <a href="/tai-xuong" onClick={() => setMenuOpen(false)}
            className="btn btn-primary btn-block" style={{ marginTop: 16 }}>
            🚀 {t.nav.tryFree}
          </a>
        </div>
      )}
    </>
  )
}
