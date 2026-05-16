import { useEffect, useState } from 'react'

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Animate progress bar
    const start = Date.now()
    const duration = 1800

    const tick = () => {
      const elapsed = Date.now() - start
      const pct = Math.min((elapsed / duration) * 100, 95)
      setProgress(pct)
      if (elapsed < duration) {
        requestAnimationFrame(tick)
      }
    }
    requestAnimationFrame(tick)

    // Hide after page loads
    const hide = () => {
      setProgress(100)
      setTimeout(() => setVisible(false), 400)
    }

    if (document.readyState === 'complete') {
      setTimeout(hide, 600)
    } else {
      window.addEventListener('load', () => setTimeout(hide, 400))
    }
  }, [])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'linear-gradient(135deg, #060e24 0%, #0c2a72 50%, #071a4a 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      transition: 'opacity 0.4s ease',
      opacity: progress >= 100 ? 0 : 1,
    }}>
      {/* Animated orbs */}
      <div style={{ position: 'absolute', top: '20%', left: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(254,95,1,0.12) 0%, transparent 70%)', animation: 'orbFloat 4s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: '20%', right: '15%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', animation: 'orbFloat 5s ease-in-out infinite reverse' }} />

      {/* Logo */}
      <div style={{ position: 'relative', textAlign: 'center', marginBottom: 48 }}>
        <img
          src="/logo.png"
          alt="Go Meta Ads Pro"
          style={{ width: 72, height: 72, borderRadius: 18, objectFit: 'cover', marginBottom: 16, boxShadow: '0 8px 32px rgba(254,95,1,0.4)', animation: 'logoPulse 2s ease-in-out infinite' }}
        />
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'Be Vietnam Pro, sans-serif' }}>
          Go Meta Ads Pro
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontFamily: 'Be Vietnam Pro, sans-serif' }}>
          by Go Media Vietnam
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ width: 240, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #fe5f01 0%, #ff9a3c 50%, #fe5f01 100%)',
          backgroundSize: '200% 100%',
          borderRadius: 4,
          transition: 'width 0.1s linear',
          animation: 'shimmerBar 1.5s linear infinite',
        }} />
      </div>

      <div style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'Be Vietnam Pro, sans-serif' }}>
        Đang tải...
      </div>

      <style>{`
        @keyframes orbFloat { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-20px) scale(1.05)} }
        @keyframes logoPulse { 0%,100%{box-shadow:0 8px 32px rgba(254,95,1,0.4)} 50%{box-shadow:0 8px 48px rgba(254,95,1,0.7)} }
        @keyframes shimmerBar { 0%{background-position:0% 0} 100%{background-position:200% 0} }
      `}</style>
    </div>
  )
}
