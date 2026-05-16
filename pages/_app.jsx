import '../styles/globals.css'
import { LangProvider } from '../lib/LangContext'
import LoadingScreen from '../components/LoadingScreen'
import { useEffect } from 'react'

function GlobalEffects() {
  useEffect(() => {
    // ─── Stagger animation observer ───
    const staggerObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible')
          staggerObs.unobserve(e.target)
        }
      })
    }, { threshold: 0.1 })

    document.querySelectorAll('.stagger').forEach(el => staggerObs.observe(el))

    // ─── Ripple effect on .ripple buttons ───
    const addRipple = (e) => {
      const btn = e.currentTarget
      const rect = btn.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      const x = e.clientX - rect.left - size / 2
      const y = e.clientY - rect.top - size / 2
      const ripple = document.createElement('span')
      ripple.className = 'ripple-effect'
      ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`
      btn.appendChild(ripple)
      setTimeout(() => ripple.remove(), 700)
    }

    const rippleBtns = document.querySelectorAll('.ripple')
    rippleBtns.forEach(btn => btn.addEventListener('click', addRipple))

    // ─── Spotlight effect on hero ───
    const hero = document.getElementById('hero-section')
    if (hero) {
      const spotlight = document.getElementById('hero-spotlight')
      const onMove = (e) => {
        if (!spotlight) return
        const rect = hero.getBoundingClientRect()
        spotlight.style.left = (e.clientX - rect.left) + 'px'
        spotlight.style.top = (e.clientY - rect.top) + 'px'
        spotlight.style.opacity = '1'
      }
      const onLeave = () => { if (spotlight) spotlight.style.opacity = '0' }
      hero.addEventListener('mousemove', onMove)
      hero.addEventListener('mouseleave', onLeave)
    }

    // ─── 3D tilt on cards ───
    const tiltCards = document.querySelectorAll('.tilt-card')
    tiltCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width - 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5
        card.style.transform = `perspective(600px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.02)`
      })
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(600px) rotateY(0) rotateX(0) scale(1)'
      })
    })

    return () => {
      staggerObs.disconnect()
      rippleBtns.forEach(btn => btn.removeEventListener('click', addRipple))
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
