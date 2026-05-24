'use client'
import { useState, useEffect, useRef } from 'react'

const BASE_COUNT  = 55450
const BASE_DATE   = new Date('2026-05-15T00:00:00Z').getTime()
const STORAGE_KEY = 'gmap_live_count'

function calcAtTime(ts) {
  const ms   = Math.max(0, ts - BASE_DATE)
  const days  = Math.floor(ms / 86400000)
  const hours = Math.floor((ms % 86400000) / 3600000)
  const mins  = Math.floor((ms % 3600000) / 60000)
  return BASE_COUNT + days * 400 + hours * 17 + Math.floor(mins * 0.28)
}

function getInitialCount() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const { count, ts } = JSON.parse(raw)
      if (count && ts && count > BASE_COUNT) {
        const elapsed = Date.now() - ts
        return count + Math.floor(elapsed / 60000 * 0.28) + Math.floor(elapsed / 600000)
      }
    }
  } catch (e) {}
  return calcAtTime(Date.now())
}

// Đọc lang từ localStorage (không cần context)
function getLang() {
  try { return localStorage.getItem('gmap_lang') || 'vi' } catch { return 'vi' }
}

export default function LiveCounter() {
  const [count, setCount] = useState(null)
  const [lang, setLangState] = useState('vi')
  const countRef = useRef(0)

  useEffect(() => {
    const initial = getInitialCount()
    setCount(initial)
    countRef.current = initial
    setLangState(getLang())

    // Watch for lang changes
    const onStorage = () => setLangState(getLang())
    window.addEventListener('storage', onStorage)

    const save = () => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: countRef.current, ts: Date.now() })) } catch (e) {}
    }
    save()
    const saveTimer = setInterval(save, 15000)

    let timeout
    const scheduleNext = () => {
      const delay = 4000 + Math.random() * 18000
      const increase = 1 + Math.floor(Math.random() * 3)
      timeout = setTimeout(() => {
        setCount(c => { const next = c + increase; countRef.current = next; return next })
        scheduleNext()
      }, delay)
    }
    scheduleNext()

    return () => { clearInterval(saveTimer); clearTimeout(timeout); window.removeEventListener('storage', onStorage) }
  }, [])

  const isEN = lang === 'en'
  const display = count === null ? '...' : count.toLocaleString('vi-VN')

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 40, zIndex: 1002,
      background: 'linear-gradient(135deg, #0c2a72 0%, #1a3a8f 100%)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(0,199,222,0.4),transparent)' }} />

      <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,80,80,0.9)', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff4040', display: 'inline-block', animation: 'livePulse 1.2s ease-in-out infinite' }} />
          LIVE
        </span>
        <span className="hide-mobile">
          {isEN ? 'Currently ' : 'Đang có '}
        </span>
        <span style={{ color: '#35e7e9', fontWeight: 900, fontSize: 15, fontVariantNumeric: 'tabular-nums', minWidth: 56, display: 'inline-block', textAlign: 'right' }}>
          {display}
        </span>
        <span>
          {isEN
            ? ' ad campaigns managed on '
            : ' camp quảng cáo đang được quản lý trên '}
        </span>
        <span style={{ color: 'var(--teal)', fontWeight: 700, flexShrink: 0 }}>Go Meta Ads Pro</span>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginLeft: 4, flexShrink: 0 }} className="hide-mobile">
          · {isEN ? 'Realtime' : 'Realtime'}
        </span>
      </span>

      <style>{`
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
      `}</style>
    </div>
  )
}
