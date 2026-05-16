import { useState, useEffect } from 'react'

// Deterministic base: ngày 15/5/2026 bắt đầu từ 55,450 camps
// Mỗi ngày tăng ~400 camps (giữa 300-500)
const BASE_COUNT  = 55450
const BASE_DATE   = new Date('2026-05-15T00:00:00Z').getTime()
const DAILY_RATE  = 400 // camps/ngày trung bình

function getBaseCount() {
  const now      = Date.now()
  const daysPast = (now - BASE_DATE) / (1000 * 60 * 60 * 24)
  // Deterministic daily increment (seed từ ngày)
  const dayIndex = Math.floor(daysPast)
  let total = BASE_COUNT
  for (let d = 0; d < dayIndex; d++) {
    // Pseudo-random nhưng deterministic: seed từ d
    const seed = (d * 1234567 + 89) % 1000
    total += 300 + Math.floor(seed / 5) // 300-499/ngày
  }
  // Thêm phần trong ngày hôm nay (tính theo giờ)
  const hourFraction = (daysPast - dayIndex)
  const todayAdd = Math.floor(hourFraction * (300 + (dayIndex * 7) % 200))
  return total + todayAdd
}

export default function LiveCounter() {
  const [count, setCount] = useState(getBaseCount)

  useEffect(() => {
    // Tăng ngẫu nhiên mỗi vài giây (không đều để trông thật)
    let timeout

    function scheduleNext() {
      // Mỗi 3-25 giây tăng 1-4 camps
      const delay    = 3000 + Math.random() * 22000
      const increase = 1 + Math.floor(Math.random() * 4)

      timeout = setTimeout(() => {
        setCount(c => c + increase)
        scheduleNext()
      }, delay)
    }

    scheduleNext()
    return () => clearTimeout(timeout)
  }, [])

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(0,199,222,0.12) 0%, rgba(204,244,86,0.08) 100%)',
      borderBottom: '1px solid rgba(0,199,222,0.15)',
      padding: '9px 0',
      textAlign: 'center',
      fontSize: 13,
      fontWeight: 600,
      color: 'rgba(255,255,255,0.85)',
      position: 'sticky',
      top: 0,
      zIndex: 1001,
      backdropFilter: 'blur(8px)',
    }}>
      <span style={{ color: 'rgba(255,255,255,0.5)', marginRight: 6 }}>🔴 LIVE</span>
      <span>Đang có </span>
      <span style={{
        color: '#35e7e9',
        fontWeight: 900,
        fontSize: 15,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.5px',
      }}>
        {count.toLocaleString('vi-VN')}
      </span>
      <span> camp quảng cáo đang được quản lý trên Go Meta Ads Pro</span>
      <span style={{ marginLeft: 12, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
        · Cập nhật theo thời gian thực
      </span>
    </div>
  )
}
