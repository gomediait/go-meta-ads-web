import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: '0 20px', height: 64,
        display: 'flex', alignItems: 'center',
        background: scrolled ? 'rgba(12,42,114,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.1)' : 'none',
        transition: 'all 0.3s ease'
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 1200, margin: '0 auto' }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/logo.png" alt="Go Meta Ads Pro" style={{ height: 34, borderRadius: 8 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>Go Meta Ads Pro</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>by Go Media Vietnam</div>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 40, flex: 1 }} className="desktop-menu">
            {[
              ['Tính năng', '/#features'],
              ['Bảng giá', '/#pricing'],
              ['Hướng dẫn', '/huong-dan'],
              ['Affiliate', '/affiliate'],
              ['Tải xuống', '/tai-xuong'],
            ].map(([label, href]) => (
              <a key={label} href={href} style={{
                color: 'rgba(255,255,255,0.8)', textDecoration: 'none',
                fontSize: 14, fontWeight: 500, padding: '8px 14px',
                borderRadius: 8, transition: 'all 0.15s'
              }}
              onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
              onMouseOut={e => e.target.style.background = 'transparent'}>
                {label}
              </a>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
            <a href="/quan-ly" style={{
              color: 'rgba(255,255,255,0.8)', textDecoration: 'none',
              fontSize: 13, fontWeight: 600, padding: '8px 16px'
            }}>Tra cứu key</a>
            <a href="/tai-xuong" className="btn btn-primary" style={{ padding: '9px 22px', fontSize: 13 }}>
              Dùng thử 7 ngày miễn phí
            </a>
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="mobile-menu-btn" style={{
            background: 'rgba(255,255,255,0.1)', border: 'none',
            color: '#fff', padding: '8px 12px', borderRadius: 8,
            cursor: 'pointer', fontSize: 18, marginLeft: 12,
            display: 'none'
          }}>☰</button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, zIndex: 999,
          background: 'rgba(12,42,114,0.98)', backdropFilter: 'blur(16px)',
          padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          {[
            ['Tính năng', '/#features'],
            ['Bảng giá', '/#pricing'],
            ['Hướng dẫn', '/huong-dan'],
            ['Affiliate', '/affiliate'],
            ['Tải xuống', '/tai-xuong'],
            ['Tra cứu key', '/quan-ly'],
          ].map(([label, href]) => (
            <a key={label} href={href} onClick={() => setMenuOpen(false)} style={{
              display: 'block', color: '#fff', textDecoration: 'none',
              padding: '12px 16px', fontSize: 15, fontWeight: 600,
              borderRadius: 8, marginBottom: 4
            }}>{label}</a>
          ))}
          <a href="/tai-xuong" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
            Dùng thử miễn phí 7 ngày
          </a>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-menu { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
        @media (max-width: 900px) {
          .desktop-menu a:nth-child(n+4) { display: none; }
        }
      `}</style>
    </>
  )
}
