import { useEffect, useState } from 'react'

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    // Don't show on subsequent navigations
    if (sessionStorage.getItem('loaded')) { setHidden(true); return }

    const start = Date.now()
    const dur   = 1600
    const tick  = () => {
      const p = Math.min(((Date.now() - start) / dur) * 100, 95)
      setProgress(p)
      if (Date.now() - start < dur) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)

    const done = () => {
      setProgress(100)
      setTimeout(() => {
        setHidden(true)
        sessionStorage.setItem('loaded', '1')
      }, 350)
    }

    if (document.readyState === 'complete') setTimeout(done, 500)
    else window.addEventListener('load', () => setTimeout(done, 300))
  }, [])

  if (hidden) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'linear-gradient(135deg, #000d1a 0%, #000f20 50%, #001428 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      opacity: progress >= 100 ? 0 : 1,
      transition: 'opacity 0.35s ease',
      pointerEvents: progress >= 100 ? 'none' : 'all',
    }}>
      {/* Stars */}
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: Math.random() * 2 + 0.5,
          height: Math.random() * 2 + 0.5,
          borderRadius: '50%',
          background: '#fff',
          opacity: Math.random() * 0.6 + 0.1,
          animation: `starTwinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 2}s`,
        }} />
      ))}

      {/* Teal glow orb */}
      <div style={{
        position: 'absolute',
        top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,199,222,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <div style={{ position: 'relative', textAlign: 'center', marginBottom: 48, zIndex: 1 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 20, overflow: 'hidden',
          margin: '0 auto 16px',
          boxShadow: '0 0 40px rgba(0,199,222,0.5), 0 0 80px rgba(0,199,222,0.2)',
          animation: 'glowPulse 2s ease-in-out infinite',
          border: '1px solid rgba(0,199,222,0.3)',
        }}>
          <img src="/logo.png" alt="Go Meta Ads Pro" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: 'Be Vietnam Pro, sans-serif', letterSpacing: '-0.3px' }}>
          Go Meta Ads Pro
        </div>
        <div style={{ fontSize: 12, color: 'rgba(0,199,222,0.7)', marginTop: 4, fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 500 }}>
          by Go Media Vietnam
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ width: 220, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', zIndex: 1 }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: 'linear-gradient(90deg, #00c7de 0%, #35e7e9 50%, #ccf456 100%)',
          backgroundSize: '200% 100%',
          borderRadius: 3,
          transition: 'width 0.12s linear',
          animation: 'shimmer 1.5s linear infinite',
        }} />
      </div>

      <div style={{ marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'Be Vietnam Pro, sans-serif', zIndex: 1 }}>
        Đang tải...
      </div>

      <style>{`
        @keyframes starTwinkle { 0%,100%{opacity:0.2} 50%{opacity:0.8} }
        @keyframes glowPulse   { 0%,100%{box-shadow:0 0 40px rgba(0,199,222,0.4),0 0 80px rgba(0,199,222,0.1)} 50%{box-shadow:0 0 60px rgba(0,199,222,0.7),0 0 100px rgba(0,199,222,0.25)} }
        @keyframes shimmer     { 0%{background-position:0% 0} 100%{background-position:200% 0} }
      `}</style>
    </div>
  )
}
