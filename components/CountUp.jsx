import { useEffect, useRef, useState } from 'react'

export default function CountUp({ end, duration = 2000, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const startTime = Date.now()
        const endNum = typeof end === 'number' ? end : parseFloat(end)

        const tick = () => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / duration, 1)
          // Ease out cubic
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(eased * endNum)
          if (progress < 1) requestAnimationFrame(tick)
          else setCount(endNum)
        }
        requestAnimationFrame(tick)
        obs.disconnect()
      }
    }, { threshold: 0.3 })

    obs.observe(el)
    return () => obs.disconnect()
  }, [end, duration])

  const display = Number.isInteger(end)
    ? Math.round(count).toLocaleString()
    : count.toFixed(1)

  return <span ref={ref}>{prefix}{display}{suffix}</span>
}
