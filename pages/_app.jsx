import '../styles/globals.css'
import { LangProvider } from '../lib/LangContext'
import LoadingScreen from '../components/LoadingScreen'
import FomoPopup from '../components/FomoPopup'
import FloatingSupport from '../components/FloatingSupport'
import LiveCounter from '../components/LiveCounter'
import { useEffect } from 'react'

function GlobalEffects() {
  useEffect(() => {
    // Reveal on scroll
    const observeAll = (selector, opts) => {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) } })
      }, opts)
      document.querySelectorAll(selector).forEach(el => obs.observe(el))
      return obs
    }
    const r1 = observeAll('.reveal, .reveal-left, .reveal-right', { threshold: 0.08, rootMargin: '0px 0px -40px 0px' })
    const r2 = observeAll('.stagger', { threshold: 0.1 })

    // 3D tilt on cards
    const cards = document.querySelectorAll('.tilt-card')
    const handlers = new Map()
    cards.forEach(card => {
      const onMove  = (e) => {
        const r = card.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width  - 0.5
        const y = (e.clientY - r.top)  / r.height - 0.5
        card.style.transform = `perspective(700px) rotateY(${x*7}deg) rotateX(${-y*7}deg) scale(1.02)`
      }
      const onLeave = () => { card.style.transform = '' }
      card.addEventListener('mousemove', onMove)
      card.addEventListener('mouseleave', onLeave)
      handlers.set(card, { onMove, onLeave })
    })

    // Ripple on teal/orange buttons
    const rippleClick = (e) => {
      const btn  = e.currentTarget
      const rect = btn.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height) * 2
      const x    = e.clientX - rect.left - size / 2
      const y    = e.clientY - rect.top  - size / 2
      const rpl  = document.createElement('span')
      rpl.style.cssText = `position:absolute;width:${size}px;height:${size}px;left:${x}px;top:${y}px;border-radius:50%;background:rgba(255,255,255,0.2);transform:scale(0);animation:rippleAnim 0.6s linear forwards;pointer-events:none;z-index:0;`
      btn.style.position = 'relative'
      btn.style.overflow = 'hidden'
      btn.appendChild(rpl)
      setTimeout(() => rpl.remove(), 700)
    }
    const btns = document.querySelectorAll('.btn-teal, .btn-orange, .btn-lime')
    btns.forEach(b => b.addEventListener('click', rippleClick))

    return () => {
      r1.disconnect(); r2.disconnect()
      handlers.forEach(({ onMove, onLeave }, card) => {
        card.removeEventListener('mousemove', onMove)
        card.removeEventListener('mouseleave', onLeave)
      })
      btns.forEach(b => b.removeEventListener('click', rippleClick))
    }
  }, [])

  return null
}

export default function App({ Component, pageProps }) {
  return (
    <LangProvider>
      <LiveCounter />
      <LoadingScreen />
      <GlobalEffects />
      <Component {...pageProps} />
      <FomoPopup />
      <FloatingSupport />
    </LangProvider>
  )
}
