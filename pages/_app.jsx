import '../styles/globals.css'
import { LangProvider } from '../lib/LangContext'
import { AuthProvider } from '../lib/AuthContext'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { saveReferralCode, trackReferralClick } from '../lib/affiliateTrack'

function PixelInjector() {
  const injected = useRef(false)
  useEffect(() => {
    if (injected.current) return
    injected.current = true
    fetch('/api/admin/site-settings')
      .then(r => r.json())
      .then(({ settings = {} }) => {
        const { fb_pixel_id, gtm_id, ga4_id, tiktok_pixel_id, google_ads_id } = settings

        if (gtm_id) {
          const s = document.createElement('script')
          s.text = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm_id}');`
          document.head.appendChild(s)
          const ns = document.createElement('noscript')
          ns.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtm_id}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`
          document.body.prepend(ns)
        }

        if (ga4_id) {
          const src = document.createElement('script')
          src.async = true
          src.src = `https://www.googletagmanager.com/gtag/js?id=${ga4_id}`
          document.head.appendChild(src)
          const s = document.createElement('script')
          s.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4_id}');${google_ads_id ? `gtag('config','${google_ads_id}');` : ''}`
          document.head.appendChild(s)
        }

        if (fb_pixel_id) {
          const s = document.createElement('script')
          s.text = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${fb_pixel_id}');fbq('track','PageView');`
          document.head.appendChild(s)
        }

        if (tiktok_pixel_id) {
          const s = document.createElement('script')
          s.text = `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${tiktok_pixel_id}');ttq.page();}(window,document,'ttq');`
          document.head.appendChild(s)
        }
      })
      .catch(() => {})
  }, [])
  return null
}

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
        <PixelInjector />
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
