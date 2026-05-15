import { useState, useEffect } from 'react'
import Head from 'next/head'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const NAVY = '#0c2a72'
const ORANGE = '#fe5f01'

const FALLBACK = {
  version: 'v1.0.0',
  release_date: '2026-05-15',
  notes: [
    'Theo dõi CPA realtime theo từng sản phẩm',
    'Đồng bộ mục tiêu CPA cho cả team',
    'Cảnh báo camp vượt CPA qua Telegram',
    'Báo cáo doanh thu / lãi lỗ tổng hợp',
    'Hỗ trợ nhiều tài khoản quảng cáo',
  ],
  download_url: '#',
}

const STEPS = [
  {
    n: 1,
    title: 'Giải nén file ZIP',
    desc: 'Sau khi tải về, nhấp chuột phải vào file ZIP → Giải nén. Chọn thư mục Desktop hoặc Documents để lưu.',
    warn: 'KHÔNG xóa thư mục này sau khi cài — tiện ích sẽ mất hoạt động.',
    icon: '📦',
  },
  {
    n: 2,
    title: 'Bật chế độ nhà phát triển',
    desc: 'Mở Chrome và truy cập địa chỉ chrome://extensions trên thanh địa chỉ. Bật công tắc "Chế độ dành cho nhà phát triển" ở góc trên bên phải.',
    icon: '⚙️',
  },
  {
    n: 3,
    title: 'Tải tiện ích & đăng nhập',
    desc: 'Nhấn nút "Tải tiện ích đã giải nén" → chọn thư mục camp_monitor vừa giải nén. Icon sẽ xuất hiện trên thanh Chrome. Nhấp vào → nhập key kích hoạt.',
    icon: '🔑',
  },
]

export default function TaiXuong() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pulse, setPulse] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('https://go-meta-ads-backend.vercel.app/api/version')
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d || FALLBACK); setLoading(false) })
      .catch(() => { setData(FALLBACK); setLoading(false) })
  }, [])

  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 1400)
    return () => clearInterval(t)
  }, [])

  const version = data?.version || FALLBACK.version
  const releaseDate = data?.date || data?.release_date || FALLBACK.release_date
  const notesRaw = data?.notes
  const notes = Array.isArray(notesRaw)
    ? notesRaw
    : notesRaw
      ? notesRaw.split(/[.\n]/).map(s => s.trim()).filter(Boolean)
      : FALLBACK.notes
  const downloadUrl = data?.download_url || FALLBACK.download_url

  function formatDate(str) {
    try {
      const d = new Date(str)
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch { return str }
  }

  return (
    <>
      <Head>
        <title>Tải xuống Go Meta Ads Pro</title>
        <meta name="description" content="Tải xuống tiện ích Chrome Go Meta Ads Pro — quản lý Facebook Ads thông minh cho team." />
      </Head>
      <Navbar />

      <main style={{ background: '#f0f4ff', minHeight: '100vh', paddingTop: 64 }}>

        {/* ─── Hero (navy) ─── */}
        <div style={{ background: `linear-gradient(135deg,${NAVY} 0%,#1a3a8f 100%)`, padding: 'clamp(40px,6vw,80px) 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          {/* bg decoration */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 260, height: 260, borderRadius: '50%', background: 'rgba(254,95,1,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', maxWidth: 680, margin: '0 auto' }}>
            {/* Version badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 24, padding: '6px 16px', marginBottom: 20 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }} />
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
                {loading ? 'Đang tải...' : version}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>·</span>
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>Release {formatDate(releaseDate)}</span>
            </div>

            <h1 style={{ color: '#fff', fontSize: 'clamp(26px,5vw,44px)', fontWeight: 900, margin: '0 0 14px', lineHeight: 1.2 }}>
              Tải xuống tiện ích
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'clamp(14px,2.5vw,18px)', margin: '0 0 36px', lineHeight: 1.6 }}>
              Chrome Extension quản lý Facebook Ads — theo dõi CPA, đồng bộ team, cảnh báo tự động
            </p>

            {/* Big Download Button */}
            <a
              href={downloadUrl}
              download
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 14,
                background: `linear-gradient(135deg,${ORANGE},#ff8c00)`,
                color: '#fff', textDecoration: 'none', borderRadius: 16,
                padding: 'clamp(14px,3vw,20px) clamp(28px,5vw,48px)',
                fontSize: 'clamp(16px,3vw,20px)', fontWeight: 900,
                boxShadow: pulse
                  ? '0 8px 40px rgba(254,95,1,0.65), 0 0 0 0 rgba(254,95,1,0)'
                  : '0 8px 40px rgba(254,95,1,0.45), 0 0 0 12px rgba(254,95,1,0.1)',
                transition: 'box-shadow 0.7s ease, transform 0.15s',
                transform: pulse ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <span style={{ fontSize: 'clamp(20px,3vw,26px)' }}>⬇</span>
              Tải xuống {loading ? '' : version}
            </a>

            <div style={{ marginTop: 16, color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              Chrome Extension · Miễn phí dùng thử 7 ngày
            </div>
          </div>
        </div>

        {/* ─── Content ─── */}
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 16px 80px' }}>

          {/* Release Notes */}
          <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 24px rgba(12,42,114,0.08)', padding: 'clamp(24px,4vw,40px)', marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <h2 style={{ color: NAVY, fontWeight: 800, fontSize: 20, margin: 0 }}>Release Notes</h2>
              <span style={{ background: 'linear-gradient(135deg,#e8f0ff,#d0e0ff)', color: NAVY, fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, border: '1px solid #c7d7ff' }}>
                {loading ? '...' : version}
              </span>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>{formatDate(releaseDate)}</span>
            </div>
            {loading ? (
              <div style={{ color: '#94a3b8', fontSize: 15 }}>Đang tải changelog...</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {notes.map((note, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: i < notes.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <span style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', borderRadius: 6, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ color: '#334155', fontSize: 15, lineHeight: 1.5 }}>{note}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Install Steps */}
          <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 24px rgba(12,42,114,0.08)', padding: 'clamp(24px,4vw,40px)', marginBottom: 32 }}>
            <h2 style={{ color: NAVY, fontWeight: 800, fontSize: 20, margin: '0 0 28px' }}>Hướng dẫn cài đặt</h2>
            <div style={{ display: 'grid', gap: 0 }}>
              {STEPS.map((s, i) => (
                <div key={s.n} style={{ display: 'flex', gap: 20, position: 'relative' }}>
                  {/* connector line */}
                  {i < STEPS.length - 1 && (
                    <div style={{ position: 'absolute', left: 24, top: 56, bottom: 0, width: 2, background: 'linear-gradient(to bottom,rgba(12,42,114,0.15),transparent)' }} />
                  )}
                  {/* step number circle */}
                  <div style={{ flexShrink: 0, width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg,${NAVY},#1a3a8f)`, color: '#fff', fontWeight: 900, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(12,42,114,0.3)', zIndex: 1 }}>
                    {s.n}
                  </div>
                  <div style={{ paddingBottom: i < STEPS.length - 1 ? 32 : 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 22 }}>{s.icon}</span>
                      <h3 style={{ color: NAVY, fontWeight: 800, fontSize: 17, margin: 0 }}>{s.title}</h3>
                    </div>
                    <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.7, margin: '0 0 8px' }}>{s.desc}</p>
                    {s.warn && (
                      <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#92400e', fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <span>⚠️</span> {s.warn}
                      </div>
                    )}
                    {s.n === 2 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                        <code style={{ background: '#1e293b', color: '#38bdf8', padding: '6px 14px', borderRadius: 8, fontSize: 14, fontFamily: 'monospace', fontWeight: 700 }}>
                          chrome://extensions
                        </code>
                        <button
                          onClick={() => { navigator.clipboard?.writeText('chrome://extensions'); setCopied(true); setTimeout(() => setCopied(false), 1800) }}
                          style={{ background: 'none', border: `1.5px solid #cbd5e1`, borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: '#64748b', cursor: 'pointer' }}
                        >
                          {copied ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warning box */}
          <div style={{ background: '#fffbeb', border: '2px solid #f59e0b', borderRadius: 16, padding: '24px 28px', marginBottom: 36, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 28, flexShrink: 0, marginTop: 2 }}>⚠️</div>
            <div>
              <div style={{ fontWeight: 800, color: '#92400e', fontSize: 16, marginBottom: 8 }}>Mỗi lần có bản cập nhật mới</div>
              <ol style={{ margin: 0, paddingLeft: 20, color: '#78350f', fontSize: 15, lineHeight: 1.8 }}>
                <li>Tải file ZIP bản mới về</li>
                <li>Giải nén và <strong>đè lên thư mục cũ</strong> (chọn "Yes to all" khi được hỏi)</li>
                <li>Mở <code style={{ background: '#fef3c7', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace' }}>chrome://extensions</code></li>
                <li>Nhấn nút <strong>Reload</strong> (biểu tượng mũi tên xoay) trên thẻ tiện ích</li>
              </ol>
            </div>
          </div>

          {/* Support buttons */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#64748b', fontSize: 15, marginBottom: 20, fontWeight: 600 }}>
              Cần hỗ trợ cài đặt? Liên hệ ngay:
            </div>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href="https://zalo.me/g/abcdef"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  background: 'linear-gradient(135deg,#0068ff,#0050cc)',
                  color: '#fff', textDecoration: 'none', borderRadius: 12,
                  padding: '14px 28px', fontWeight: 800, fontSize: 15,
                  boxShadow: '0 6px 20px rgba(0,104,255,0.3)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,104,255,0.4)' }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,104,255,0.3)' }}
              >
                <span style={{ fontSize: 22 }}>💬</span>
                Zalo hỗ trợ
              </a>
              <a
                href="mailto:admin@gonetwork.vn"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  background: '#fff', color: NAVY, textDecoration: 'none', borderRadius: 12,
                  padding: '14px 28px', fontWeight: 800, fontSize: 15,
                  border: `2px solid ${NAVY}`,
                  boxShadow: '0 4px 14px rgba(12,42,114,0.1)',
                  transition: 'transform 0.15s, background 0.15s',
                }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#f0f4ff' }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#fff' }}
              >
                <span style={{ fontSize: 22 }}>✉️</span>
                Email admin
              </a>
            </div>

            {/* Mua goi CTA */}
            <div style={{ marginTop: 48, padding: '32px', background: `linear-gradient(135deg,${NAVY},#1a3a8f)`, borderRadius: 20, color: '#fff' }}>
              <div style={{ fontSize: 22, marginBottom: 10 }}>🚀</div>
              <h3 style={{ fontWeight: 800, fontSize: 20, margin: '0 0 8px' }}>Chưa có key kích hoạt?</h3>
              <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 15, margin: '0 0 20px' }}>
                Bắt đầu dùng thử miễn phí 7 ngày hoặc chọn gói phù hợp với team.
              </p>
              <a
                href="/mua-goi"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: `linear-gradient(135deg,${ORANGE},#ff8c00)`,
                  color: '#fff', textDecoration: 'none', borderRadius: 12,
                  padding: '13px 30px', fontWeight: 800, fontSize: 16,
                  boxShadow: '0 6px 20px rgba(254,95,1,0.4)',
                }}
              >
                Mua gói ngay →
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        * { box-sizing: border-box; }
        @media (max-width: 600px) {
          main > div:first-child { padding-left: 16px !important; padding-right: 16px !important; }
        }
      `}</style>
    </>
  )
}
