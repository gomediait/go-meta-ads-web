import '../styles/globals.css'
import { LangProvider } from '../lib/LangContext'
import LoadingScreen from '../components/LoadingScreen'
import { useEffect } from 'react'

function GlobalEffects() {
  useEffect(() => {
    // ─── Reveal on scroll ───
    const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target) }
      })
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' })
    revealEls.forEach(el => revealObs.observe(el))

    // ─── Stagger on scroll ───
    const staggerEls = document.querySelectorAll('.stagger')
    const staggerObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); staggerObs.unobserve(e.target) }
      })
    }, { threshold: 0.1 })
    staggerEls.forEach(el => staggerObs.observe(el))

    // ─── 3D card tilt ───
    const cards = document.querySelectorAll('.tilt-card')
    cards.forEach(card => {
      const onMove = (e) => {
        const r = card.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width  - 0.5
        const y = (e.clientY - r.top)  / r.height - 0.5
        card.style.transform = `perspective(600px) rotateY(${x*8}deg) rotateX(${-y*8}deg) scale(1.02)`
      }
      const onLeave = () => { card.style.transform = '' }
      card.addEventListener('mousemove', onMove)
      card.addEventListener('mouseleave', onLeave)
    })

    // ─── Button ripple ───
    const rippleClick = (e) => {
      const btn  = e.currentTarget
      const rect = btn.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height) * 2
      const x    = e.clientX - rect.left - size / 2
      const y    = e.clientY - rect.top  - size / 2
      const rpl  = document.createElement('span')
      rpl.className = 'ripple-effect'
      rpl.style.cssText = `position:absolute;width:${size}px;height:${size}px;left:${x}px;top:${y}px;border-radius:50%;background:rgba(0,199,222,0.2);transform:scale(0);animation:rippleAnim 0.6s linear forwards;pointer-events:none;`
      btn.style.position = 'relative'
      btn.style.overflow = 'hidden'
      btn.appendChild(rpl)
      setTimeout(() => rpl.remove(), 700)
    }
    const btns = document.querySelectorAll('.btn-teal, .btn-orange')
    btns.forEach(b => b.addEventListener('click', rippleClick))

    return () => {
      revealObs.disconnect()
      staggerObs.disconnect()
      cards.forEach(c => { c.removeEventListener('mousemove', () => {}); c.removeEventListener('mouseleave', () => {}) })
      btns.forEach(b => b.removeEventListener('click', rippleClick))
    }
  }, [])

  return null
}

export default function App({ Component, pageProps }) {
  return (
    <LangProvider>
      <LoadingScreen />
      <GlobalEffects />
      <Component {...pageProps} />
    </LangProvider>
  )
}
