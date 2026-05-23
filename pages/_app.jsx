import '../styles/globals.css'
import { LangProvider } from '../lib/LangContext'
import { AuthProvider } from '../lib/AuthContext'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { saveReferralCode, trackReferralClick } from '../lib/affiliateTrack'

const LoadingScreen   = dynamic(() => import('../components/LoadingScreen'),   { ssr: false })
const FomoPopup       = dynamic(() => import('../components/FomoPopup'),       { ssr: false })
const FloatingSupport = dynamic(() => import('../components/FloatingSupport'), { ssr: false })
const LiveCounter     = dynamic(() => import('../components/LiveCounter'),     { ssr: false })

function GlobalEffects() {
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) } })
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' })
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => obs.observe(el))
    const staggerObs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); staggerObs.unobserve(e.target) } })
    }, { threshold: 0.1 })
    document.querySelectorAll('.stagger').forEach(el => staggerObs.observe(el))
    const cards = document.querySelectorAll('.tilt-card')
    const handlers = new Map()
    cards.forEach(card => {
      const onMove  = (e) => { const r = card.getBoundingClientRect(); const x = (e.clientX-r.left)/r.width-0.5; const y = (e.clientY-r.top)/r.height-0.5; card.style.transform = `perspective(700px) rotateY(${x*7}deg) rotateX(${-y*7}deg) scale(1.02)` }
      const onLeave = () => { card.style.transform = '' }
      card.addEventListener('mousemove', onMove); card.addEventListener('mouseleave', onLeave)
      handlers.set(card, { onMove, onLeave })
    })
    const rippleClick = (e) => {
      const btn = e.currentTarget; const rect = btn.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)*2; const x = e.clientX-rect.left-size/2; const y = e.clientY-rect.top-size/2
      const rpl = document.createElement('span')
      rpl.style.cssText = `position:absolute;width:${size}px;height:${size}px;left:${x}px;top:${y}px;border-radius:50%;background:rgba(255,255,255,0.2);transform:scale(0);animation:rippleAnim 0.6s linear forwards;pointer-events:none;z-index:0;`
      btn.appendChild(rpl); setTimeout(() => rpl.remove(), 700)
    }
    const btns = document.querySelectorAll('.btn-teal, .btn-orange, .btn-lime')
    btns.forEach(b => b.addEventListener('click', rippleClick))
    return () => {
      obs.disconnect(); staggerObs.disconnect()
      handlers.forEach(({ onMove, onLeave }, card) => { card.removeEventListener('mousemove', onMove); card.removeEventListener('mouseleave', onLeave) })
      btns.forEach(b => b.removeEventListener('click', rippleClick))
    }
  }, [])
  return null
}

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const isAdmin     = router.pathname.startsWith('/admin')
  const isDashboard = router.pathname.startsWith('/dashboard') || router.pathname.startsWith('/settings')

  // Đọc ?ref= từ URL và lưu cookie affiliate 30 ngày
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) {
      saveReferralCode(ref)
      trackReferralClick(ref)
    }
  }, [])

  return (
    <LangProvider>
      <AuthProvider>
        {/* Ẩn widgets marketing trong admin và dashboard */}
        {!isAdmin && !isDashboard && <LiveCounter />}
        {!isAdmin && !isDashboard && <LoadingScreen />}
        {!isDashboard && <GlobalEffects />}
        <Component {...pageProps} />
        {!isAdmin && !isDashboard && <FomoPopup />}
        {!isAdmin && !isDashboard && <FloatingSupport />}
      </AuthProvider>
    </LangProvider>
  )
}
