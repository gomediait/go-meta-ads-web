'use client'
import { useState, useEffect, useRef } from 'react'

const BASE_COUNT  = 55450
const BASE_DATE   = new Date('2026-05-15T00:00:00Z').getTime()
const STORAGE_KEY = 'gmap_live_count'
const COUNTER_HEIGHT = 40 // px — phải khớp với CSS --counter-h

// Tính số camp tại thời điểm t (deterministic — mọi browser cho cùng kết quả)
function calcAtTime(ts) {
  const ms   = Math.max(0, ts - BASE_DATE)
  const days  = Math.floor(ms / 86400000)
  const hours = Math.floor((ms % 86400000) / 3600000)
  const mins  = Math.floor((ms % 3600000) / 60000)
  // ~400/ngày → ~16.7/giờ → ~0.278/phút
  return BASE_COUNT + days * 400 + hours * 17 + Math.floor(mins * 0.28)
}

// Lấy count ban đầu: ưu tiên localStorage, fallback về time-based
function getInitialCount() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const { count, ts } = JSON.parse(raw)
      if (count && ts && count > BASE_COUNT) {
        // Tính tăng thêm kể từ lần lưu cuối
        const elapsedMs   = Date.now() - ts
        const elapsedMins = elapsedMs / 60000
        const increase    = Math.floor(elapsedMins * 0.28) + Math.floor(elapsedMins / 10) // thêm ngẫu nhiên nhỏ
        return count + increase
      }
    }
  } catch (e) {}
  return calcAtTime(Date.now())
}

export default function LiveCounter() {
  const [count, setCount]   = useState(null) // null = chưa hydrate
  const countRef = useRef(0)

  // Hydrate client-side (tránh SSR mismatch)
  useEffect(() => {
    const initial = getInitialCount()
    setCount(initial)
    countRef.current = initial
  }, [])

  useEffect(() => {
    if (count === null) return

    // Lưu localStorage ngay và định kỳ
    const save = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: countRef.current, ts: Date.now() }))
      } catch (e) {}
    }
    save()
    const saveTimer = setInterval(save, 15000)

    // Random increments — liên tục, không reset
    let timeout
    const scheduleNext = () => {
      const delay    = 4000 + Math.random() * 18000  // 4-22 giây ngẫu nhiên
      const increase = 1 + Math.floor(Math.random() * 3) // 1-3 camps mỗi lần
      timeout = setTimeout(() => {
        setCount(c => {
          const next = c + increase
          countRef.current = next
          return next
        })
        scheduleNext()
      }, delay)
    }
    scheduleNext()

    return () => { clearInterval(saveTimer); clearTimeout(timeout) }
  }, [count !== null]) // chỉ chạy sau khi đã hydrate

  const display = count === null
    ? '...'
    : count.toLocaleString('vi-VN')

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: COUNTER_HEIGHT,
      zIndex: 1002,
      background: 'linear-gradient(135deg, rgba(0,10,20,0.97) 0%, rgba(0,20,35,0.97) 100%)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(0,199,222,0.12)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 600,
      color: 'rgba(255,255,255,0.8)',
      overflow: 'hidden',
    }}>
      {/* Teal glow line */}
      <div style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(0,199,222,0.4),transparent)' }} />

      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,80,80,0.9)', fontWeight: 700, fontSize: 12 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff4040', display: 'inline-block', animation: 'livePulse 1.2s ease-in-out infinite' }} />
          LIVE
        </span>
        <span>Đang có</span>
        <span style={{ color: '#35e7e9', fontWeight: 900, fontSize: 15, fontVariantNumeric: 'tabular-nums', minWidth: 64, display: 'inline-block', textAlign: 'right' }}>
          {display}
        </span>
        <span>camp quảng cáo đang được quản lý trên</span>
        <span style={{ color: 'var(--teal)', fontWeight: 700 }}>Go Meta Ads Pro</span>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginLeft: 4 }}>· Realtime</span>
      </span>

      <style>{`
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
      `}</style>
    </div>
  )
}
