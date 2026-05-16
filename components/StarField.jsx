import { useEffect, useRef } from 'react'

export default function StarField({ count = 150, speed = 0.3 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let W, H, stars, animId

    const init = () => {
      W = canvas.width  = canvas.offsetWidth
      H = canvas.height = canvas.offsetHeight
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.5 + 0.2,
        alpha: Math.random() * 0.7 + 0.1,
        blinkSpeed: Math.random() * 0.02 + 0.005,
        blinkDir: Math.random() > 0.5 ? 1 : -1,
        vx: (Math.random() - 0.5) * speed * 0.1,
        vy: (Math.random() - 0.5) * speed * 0.1,
      }))
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      stars.forEach(s => {
        // Twinkle
        s.alpha += s.blinkSpeed * s.blinkDir
        if (s.alpha > 0.9 || s.alpha < 0.05) s.blinkDir *= -1

        // Move slowly
        s.x += s.vx
        s.y += s.vy
        if (s.x < 0) s.x = W
        if (s.x > W) s.x = 0
        if (s.y < 0) s.y = H
        if (s.y > H) s.y = 0

        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${s.alpha})`
        ctx.fill()
      })
      animId = requestAnimationFrame(draw)
    }

    init()
    draw()

    const onResize = () => { init() }
    window.addEventListener('resize', onResize, { passive: true })
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize) }
  }, [count, speed])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  )
}
