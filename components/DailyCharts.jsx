import { useState, useEffect, useRef } from 'react'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'

const fmtNum = v => Number(v).toLocaleString('vi-VN')
const fmtTick = v => v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(15,23,42,.95)', border: '1px solid rgba(99,102,241,.3)',
      borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,.3)',
    }}>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ color: '#cbd5e1' }}>{p.name}</span>
          <span style={{ color: '#fff', fontWeight: 700, marginLeft: 'auto' }}>{fmtNum(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function useContainerWidth(ref) {
  const [width, setWidth] = useState(700)
  useEffect(() => {
    if (!ref.current) return
    const update = () => { if (ref.current) setWidth(ref.current.offsetWidth) }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [ref])
  return width
}

const AXIS_TICK = { fontSize: 11, fill: '#64748b' }
const GRID_STROKE = 'rgba(148,163,184,.15)'

export default function DailyCharts({ daily, chartTab }) {
  const containerRef = useRef(null)
  const chartWidth = useContainerWidth(containerRef)

  if (!daily || daily.length === 0) return <div style={{ color: '#94a3b8', fontSize: 13, padding: 20 }}>Không có dữ liệu biểu đồ</div>

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      {chartTab === 'spend' && (
        <BarChart width={chartWidth} height={320} data={daily} margin={{ top: 10, right: 16, bottom: 5, left: 8 }}>
          <defs>
            <linearGradient id="gSpend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} axisLine={{ stroke: GRID_STROKE }} tickLine={false} />
          <YAxis tick={AXIS_TICK} width={60} tickFormatter={fmtTick} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148,163,184,.08)' }} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar dataKey="spend" name="Chi phí (₫)" fill="url(#gSpend)" radius={[6, 6, 0, 0]} animationDuration={800} />
        </BarChart>
      )}

      {chartTab === 'traffic' && (
        <AreaChart width={chartWidth} height={320} data={daily} margin={{ top: 10, right: 16, bottom: 5, left: 8 }}>
          <defs>
            <linearGradient id="gImpr" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gClicks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gReach" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} axisLine={{ stroke: GRID_STROKE }} tickLine={false} />
          <YAxis tick={AXIS_TICK} width={60} tickFormatter={fmtTick} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Area type="monotone" dataKey="impressions" name="Impressions" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gImpr)" dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }} animationDuration={800} />
          <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#gClicks)" dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }} activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2, fill: '#fff' }} animationDuration={1000} />
          <Area type="monotone" dataKey="reach" name="Reach" stroke="#06b6d4" strokeWidth={2.5} fill="url(#gReach)" dot={{ r: 4, fill: '#06b6d4', strokeWidth: 0 }} activeDot={{ r: 6, stroke: '#06b6d4', strokeWidth: 2, fill: '#fff' }} animationDuration={1200} />
        </AreaChart>
      )}

      {chartTab === 'efficiency' && (
        <LineChart width={chartWidth} height={320} data={daily} margin={{ top: 10, right: 16, bottom: 5, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} axisLine={{ stroke: GRID_STROKE }} tickLine={false} />
          <YAxis yAxisId="left" tick={AXIS_TICK} width={45} tickFormatter={v => v.toFixed(1) + '%'} axisLine={false} tickLine={false} />
          <YAxis yAxisId="right" orientation="right" tick={AXIS_TICK} width={60} tickFormatter={fmtTick} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Line yAxisId="left" type="monotone" dataKey="ctr" name="CTR (%)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }} animationDuration={800} />
          <Line yAxisId="right" type="monotone" dataKey="cpc" name="CPC (₫)" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2, fill: '#fff' }} animationDuration={1000} />
        </LineChart>
      )}
    </div>
  )
}
