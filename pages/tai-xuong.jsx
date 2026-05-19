import { useState, useEffect } from 'react'
import Head from 'next/head'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Reveal from '../components/Reveal'
import { useLang } from '../lib/LangContext'

const FALLBACK_NOTES_VI = [
  '[MỚI] AI Kiểm tra Vi phạm Chính sách Meta — phân tích nội dung quảng cáo tức thì (Business+)',
  'Sidebar mới: nhóm tính năng rõ ràng, đổi tên các mục trực quan hơn',
  'Theo dõi CPA realtime theo từng sản phẩm',
  'Đồng bộ mục tiêu CPA cho cả team',
  'Cảnh báo camp vượt CPA qua Telegram',
  'Báo cáo doanh thu / lãi lỗ tổng hợp',
]

const FALLBACK_NOTES_EN = [
  '[NEW] AI Meta Policy Checker — instant ad content analysis (Business+)',
  'New sidebar: clearer feature grouping and renamed menu items',
  'Real-time CPA tracking per product',
  'Sync CPA targets across the entire team',
  'Campaign CPA alert via Telegram',
  'Revenue / profit & loss summary reports',
]

const FALLBACK = {
  version: 'v1.0.1',
  release_date: '2026-05-19',
  notes: FALLBACK_NOTES_VI,
  download_url: 'https://adsmeta.gonetwork.vn/tai-xuong',
}

function formatDate(str, isEN) {
  try {
    const d = new Date(str)
    return d.toLocaleDateString(isEN ? 'en-US' : 'vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return str }
}

const USER_TYPE_OPTIONS = [
  { label: 'Cá nhân chạy ads', value: 'individual' },
  { label: 'Doanh nghiệp nhỏ', value: 'small_biz' },
  { label: 'Doanh nghiệp vừa/lớn', value: 'medium_biz' },
  { label: 'Agency', value: 'agency' },
  { label: 'Nhà phát triển', value: 'other' },
  { label: 'Khác', value: 'other' },
]

export default function TaiXuong() {
  const { lang } = useLang()
  const isEN = lang === 'en'

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // Download popup state
  const [popupOpen, setPopupOpen] = useState(false)
  const [dlForm, setDlForm] = useState({ full_name: '', contact: '', email: '', user_type: '' })
  const [dlLoading, setDlLoading] = useState(false)
  const [dlSuccess, setDlSuccess] = useState(false)
  const [dlError, setDlError] = useState('')

  useEffect(() => {
    fetch('https://go-meta-ads-backend.vercel.app/api/version')
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d || FALLBACK); setLoading(false) })
      .catch(() => { setData(FALLBACK); setLoading(false) })
  }, [])

  const version = data?.version || FALLBACK.version
  const releaseDate = data?.date || data?.release_date || FALLBACK.release_date
  const notesRaw = data?.notes
  const notes = Array.isArray(notesRaw)
    ? notesRaw
    : (typeof notesRaw === 'string'
      ? notesRaw.split(/[.\n]/).map(s => s.trim()).filter(Boolean)
      : (isEN ? FALLBACK_NOTES_EN : FALLBACK_NOTES_VI))
  const downloadUrl = data?.download_url || FALLBACK.download_url

  async function handleDlSubmit(e) {
    e.preventDefault()
    if (!dlForm.full_name.trim() || !dlForm.contact.trim() || !dlForm.email.trim() || !dlForm.user_type) {
      setDlError(isEN ? 'Please fill in all required fields.' : 'Vui lòng điền đầy đủ thông tin.')
      return
    }
    setDlError('')
    setDlLoading(true)
    try {
      const res = await fetch('https://go-meta-ads-backend.vercel.app/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request',
          full_name: dlForm.full_name,
          contact: dlForm.contact,
          email: dlForm.email,
          user_type: dlForm.user_type,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Server error ' + res.status)
      setDlLoading(false)
      setPopupOpen(false)
      setDlSuccess(true)
      setDlForm({ full_name: '', contact: '', email: '', user_type: '' })
    } catch (err) {
      setDlLoading(false)
      setDlError((isEN ? 'Error: ' : 'Lỗi: ') + (err.message || 'Vui lòng thử lại.'))
    }
  }

  const STEPS = [
    {
      n: 1,
      icon: '📦',
      title: isEN ? 'Extract ZIP file' : 'Giải nén file ZIP',
      desc: isEN
        ? 'Right-click the ZIP file → Extract. Choose Desktop or Documents as a permanent location.'
        : 'Nhấp chuột phải vào file ZIP → Giải nén ra. Chọn thư mục Desktop hoặc Documents để lưu lâu dài.',
      warn: isEN
        ? 'Do NOT delete this folder after installing — the extension will stop working.'
        : 'KHÔNG xóa thư mục này sau khi cài — tiện ích sẽ ngừng hoạt động.',
    },
    {
      n: 2,
      icon: '⚙️',
      title: isEN ? 'Enable Developer mode' : 'Bật chế độ nhà phát triển',
      desc: isEN
        ? 'Open Chrome and go to chrome://extensions. Toggle "Developer mode" in the top-right corner.'
        : 'Mở Chrome và truy cập chrome://extensions. Bật công tắc "Chế độ dành cho nhà phát triển" ở góc trên bên phải.',
      code: 'chrome://extensions',
    },
    {
      n: 3,
      icon: '🔑',
      title: isEN ? 'Load extension & sign in' : 'Tải tiện ích & đăng nhập',
      desc: isEN
        ? 'Click "Load unpacked" → select the camp_monitor folder. The icon appears in Chrome toolbar → enter your activation key.'
        : 'Nhấn "Tải tiện ích đã giải nén" → chọn thư mục camp_monitor. Icon xuất hiện trên thanh Chrome → nhập key kích hoạt.',
    },
  ]

  return (
    <>
      <Head>
        <title>{isEN ? 'Download Go Meta Ads Pro' : 'Tải xuống Go Meta Ads Pro'}</title>
        <meta name="description" content={isEN
          ? 'Download Go Meta Ads Pro Chrome Extension — smart Facebook Ads management for your team.'
          : 'Tải xuống tiện ích Chrome Go Meta Ads Pro — quản lý Facebook Ads thông minh cho team.'
        } />
      </Head>
      <Navbar />

      {/* ─── HERO ─── */}
      <section style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy2) 60%, #0e1e50 100%)',
        paddingTop: 'calc(var(--header-h) + 20px)',
        paddingBottom: 80,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* decorative blobs */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 340, height: 340, borderRadius: '50%', background: 'rgba(254,95,1,0.09)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative', maxWidth: 700 }}>
          {/* version badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 'var(--radius-full)', padding: '6px 18px', marginBottom: 24,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'liveDot 2s infinite' }} />
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
              {loading ? (isEN ? 'Loading...' : 'Đang tải...') : version}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>·</span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              {loading ? '...' : formatDate(releaseDate, isEN)}
            </span>
          </div>

          <h1 style={{ color: '#fff', margin: '0 0 18px', fontSize: 'clamp(28px,5vw,48px)' }}>
            {isEN ? 'Download Go Meta Ads Pro' : 'Tải xuống Go Meta Ads Pro'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'clamp(15px,2.5vw,18px)', margin: '0 0 44px', lineHeight: 1.7 }}>
            {isEN
              ? 'Chrome Extension for Facebook Ads management — real-time CPA tracking, team sync, automated alerts.'
              : 'Chrome Extension quản lý Facebook Ads — theo dõi CPA, đồng bộ team, cảnh báo tự động realtime.'}
          </p>

          {/* Big download button with pulse */}
          <button
            onClick={() => setPopupOpen(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 14,
              background: 'linear-gradient(135deg, var(--orange) 0%, #ff8c00 100%)',
              color: '#fff', border: 'none', cursor: 'pointer',
              borderRadius: 'var(--radius-xl)',
              padding: 'clamp(16px,3vw,22px) clamp(32px,6vw,56px)',
              fontSize: 'clamp(17px,3vw,21px)', fontWeight: 900,
              boxShadow: '0 8px 40px rgba(254,95,1,0.5)',
              animation: 'btnPulse 1.4s ease-in-out infinite',
              fontFamily: 'inherit',
            }}
          >
            <span style={{ fontSize: 'clamp(22px,3vw,28px)' }}>⬇</span>
            {loading
              ? (isEN ? 'Download' : 'Tải xuống')
              : (isEN ? `Download ${version}` : `Tải xuống ${version}`)}
          </button>

          <div style={{ marginTop: 16, color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
            {isEN ? 'Chrome Extension · 1-day free trial' : 'Chrome Extension · Miễn phí dùng thử 1 ngày'}
          </div>
        </div>
      </section>

      {/* ─── CONTENT ─── */}
      <main style={{ background: 'var(--gray)', minHeight: '100vh' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '56px 16px 96px' }}>

          {/* Release Notes */}
          <Reveal>
            <div className="card" style={{ marginBottom: 28, padding: 'clamp(24px,4vw,40px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
                <h2 style={{ color: 'var(--navy)', fontWeight: 800, fontSize: 20, margin: 0 }}>
                  Release Notes
                </h2>
                <span style={{
                  background: 'var(--navy-light)', color: 'var(--navy)',
                  fontSize: 12, fontWeight: 700, padding: '3px 12px',
                  borderRadius: 'var(--radius-full)', border: '1px solid rgba(12,42,114,0.15)',
                }}>
                  {loading ? '...' : version}
                </span>
                <span style={{ color: 'var(--text3)', fontSize: 13 }}>
                  {loading ? '' : formatDate(releaseDate, isEN)}
                </span>
              </div>

              {loading ? (
                <div style={{ color: 'var(--text3)', fontSize: 15 }}>
                  {isEN ? 'Loading changelog...' : 'Đang tải changelog...'}
                </div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {notes.map((note, i) => (
                    <li key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '11px 0',
                      borderBottom: i < notes.length - 1 ? '1px solid var(--gray)' : 'none',
                    }}>
                      <span style={{
                        background: 'linear-gradient(135deg,#22c55e,#16a34a)',
                        color: '#fff', borderRadius: 6,
                        width: 22, height: 22, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 12, fontWeight: 800,
                        flexShrink: 0, marginTop: 2,
                      }}>✓</span>
                      <span style={{ color: 'var(--text)', fontSize: 15, lineHeight: 1.6 }}>{note}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Reveal>

          {/* Install Steps */}
          <Reveal delay={80}>
            <div className="card" style={{ marginBottom: 28, padding: 'clamp(24px,4vw,40px)' }}>
              <h2 style={{ color: 'var(--navy)', fontWeight: 800, fontSize: 20, margin: '0 0 32px' }}>
                {isEN ? 'Installation Guide' : 'Hướng dẫn cài đặt'}
              </h2>

              {STEPS.map((s, i) => (
                <div key={s.n} style={{ display: 'flex', gap: 20, position: 'relative' }}>
                  {i < STEPS.length - 1 && (
                    <div style={{
                      position: 'absolute', left: 23, top: 52, bottom: 0,
                      width: 2,
                      background: 'linear-gradient(to bottom, rgba(12,42,114,0.18), transparent)',
                    }} />
                  )}
                  <div style={{
                    flexShrink: 0, width: 48, height: 48, borderRadius: '50%',
                    background: 'linear-gradient(135deg,var(--navy),var(--navy2))',
                    color: '#fff', fontWeight: 900, fontSize: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 6px 18px rgba(12,42,114,0.28)', zIndex: 1,
                  }}>{s.n}</div>

                  <div style={{ paddingBottom: i < STEPS.length - 1 ? 36 : 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 22 }}>{s.icon}</span>
                      <h3 style={{ color: 'var(--navy)', fontWeight: 800, fontSize: 16, margin: 0 }}>{s.title}</h3>
                    </div>
                    <p style={{ color: 'var(--text2)', fontSize: 15, lineHeight: 1.7, margin: '0 0 10px' }}>{s.desc}</p>

                    {s.warn && (
                      <div className="alert alert-warning" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <span>⚠️</span>
                        <span style={{ fontWeight: 600 }}>{s.warn}</span>
                      </div>
                    )}

                    {s.code && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                        <code style={{
                          background: '#1e293b', color: '#38bdf8',
                          padding: '6px 14px', borderRadius: 8,
                          fontSize: 14, fontFamily: 'monospace', fontWeight: 700,
                        }}>{s.code}</code>
                        <button
                          onClick={() => { navigator.clipboard?.writeText(s.code); setCopied(true); setTimeout(() => setCopied(false), 1800) }}
                          style={{
                            background: 'none', border: '1.5px solid var(--gray2)',
                            borderRadius: 8, padding: '5px 12px',
                            fontSize: 12, fontWeight: 700, color: 'var(--text2)',
                            cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >{copied ? '✓ Copied' : 'Copy'}</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Update warning */}
          <Reveal delay={120}>
            <div style={{
              background: 'rgba(254,95,1,0.06)', border: '2px solid rgba(254,95,1,0.25)',
              borderRadius: 'var(--radius-lg)', padding: '24px 28px',
              marginBottom: 40, display: 'flex', gap: 18, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>🔄</span>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--orange)', fontSize: 16, marginBottom: 8 }}>
                  {isEN ? 'Each time a new update is available' : 'Mỗi lần có bản cập nhật mới'}
                </div>
                <ol style={{ margin: 0, paddingLeft: 20, color: 'var(--text)', fontSize: 15, lineHeight: 1.9 }}>
                  {isEN ? (
                    <>
                      <li>Download the new ZIP file</li>
                      <li>Extract and <strong>overwrite the old folder</strong> (choose "Yes to all" when prompted)</li>
                      <li>Open <code style={{ background: 'rgba(254,95,1,0.1)', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 13 }}>chrome://extensions</code></li>
                      <li>Click the <strong>Reload</strong> button (circular arrow icon) on the extension card</li>
                    </>
                  ) : (
                    <>
                      <li>Tải file ZIP bản mới về</li>
                      <li>Giải nén và <strong>đè lên thư mục cũ</strong> (chọn "Yes to all" khi được hỏi)</li>
                      <li>Mở <code style={{ background: 'rgba(254,95,1,0.1)', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 13 }}>chrome://extensions</code></li>
                      <li>Nhấn nút <strong>Reload</strong> (biểu tượng mũi tên xoay) trên thẻ tiện ích</li>
                    </>
                  )}
                </ol>
              </div>
            </div>
          </Reveal>

          {/* Support buttons */}
          <Reveal delay={160}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text2)', fontSize: 15, marginBottom: 20, fontWeight: 600 }}>
                {isEN ? 'Need installation support? Contact us:' : 'Cần hỗ trợ cài đặt? Liên hệ ngay:'}
              </p>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a
                  href="https://zalo.me/g/abcdef"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{
                    background: 'linear-gradient(135deg,#0068ff,#0050cc)',
                    color: '#fff',
                    boxShadow: '0 6px 20px rgba(0,104,255,0.3)',
                    fontFamily: 'inherit',
                  }}
                >
                  <span style={{ fontSize: 20 }}>💬</span> {isEN ? 'Zalo Support' : 'Zalo hỗ trợ'}
                </a>
                <a
                  href="mailto:admin@gonetwork.vn"
                  className="btn btn-outline-navy"
                  style={{ fontFamily: 'inherit' }}
                >
                  <span style={{ fontSize: 20 }}>✉️</span> {isEN ? 'Email Admin' : 'Email admin'}
                </a>
              </div>
            </div>
          </Reveal>

          {/* CTA card */}
          <Reveal delay={200}>
            <div style={{
              marginTop: 56, textAlign: 'center',
              background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy2) 100%)',
              borderRadius: 'var(--radius-xl)', padding: 'clamp(28px,5vw,48px)',
              color: '#fff',
            }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>🚀</div>
              <h3 style={{ fontWeight: 800, fontSize: 22, margin: '0 0 10px' }}>
                {isEN ? "Don't have an activation key?" : 'Chưa có key kích hoạt?'}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 16, margin: '0 0 28px', lineHeight: 1.6 }}>
                {isEN
                  ? 'Start your free 1-day trial or choose the plan that fits your team.'
                  : 'Bắt đầu dùng thử miễn phí 1 ngày hoặc chọn gói phù hợp với team của bạn.'}
              </p>
              <a href="/mua-goi" className="btn btn-primary btn-lg" style={{ fontFamily: 'inherit' }}>
                {isEN ? 'Get a plan now →' : 'Mua gói ngay →'}
              </a>
            </div>
          </Reveal>
        </div>
      </main>

      {/* ─── SUCCESS TOAST ─── */}
      {dlSuccess && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: '#052e16', border: '1.5px solid #22c55e',
          color: '#86efac', borderRadius: 12, padding: '16px 28px',
          fontWeight: 700, fontSize: 15, zIndex: 9999,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', gap: 12, whiteSpace: 'nowrap',
          maxWidth: 'calc(100vw - 40px)',
        }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <span style={{ whiteSpace: 'normal' }}>
            {isEN
              ? 'Sent! We will contact you via Zalo/Email in a few minutes.'
              : 'Đã gửi! Chúng tôi sẽ liên hệ qua Zalo/Email trong vài phút.'}
          </span>
          <button onClick={() => setDlSuccess(false)} style={{
            background: 'none', border: 'none', color: '#86efac',
            fontSize: 18, cursor: 'pointer', padding: '0 0 0 8px', fontFamily: 'inherit',
          }}>✕</button>
        </div>
      )}

      {/* ─── DOWNLOAD POPUP ─── */}
      {popupOpen && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setPopupOpen(false) }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div style={{
            background: '#0a1535', border: '1.5px solid rgba(0,199,222,0.4)',
            borderRadius: 20, width: '100%', maxWidth: 480,
            boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
            overflow: 'hidden',
          }}>
            {/* Popup header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '22px 28px 18px',
              borderBottom: '1px solid rgba(0,199,222,0.15)',
            }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>
                  📥 {isEN ? 'Get Download Link' : 'Nhận link tải xuống'}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
                  {isEN
                    ? "Fill in your info and we'll send the link via Zalo/Email"
                    : 'Điền thông tin để chúng tôi gửi link download qua Zalo/Email'}
                </div>
              </div>
              <button
                onClick={() => setPopupOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.08)', border: 'none',
                  color: '#fff', width: 34, height: 34, borderRadius: 8,
                  fontSize: 18, cursor: 'pointer', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'inherit',
                }}
              >✕</button>
            </div>

            {/* Popup form */}
            <form onSubmit={handleDlSubmit} style={{ padding: '24px 28px 28px' }}>
              {/* Full name */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
                  {isEN ? 'Full Name' : 'Họ và tên'} <span style={{ color: '#fe5f01' }}>*</span>
                </label>
                <input
                  type="text"
                  value={dlForm.full_name}
                  onChange={e => setDlForm(p => ({ ...p, full_name: e.target.value }))}
                  placeholder={isEN ? 'John Doe' : 'Nguyễn Văn A'}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(0,199,222,0.2)',
                    color: '#fff', borderRadius: 10, padding: '11px 14px',
                    fontSize: 15, outline: 'none', fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* SDT Zalo */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
                  {isEN ? 'Phone / Zalo' : 'SĐT / Zalo'} <span style={{ color: '#fe5f01' }}>*</span>
                </label>
                <input
                  type="text"
                  value={dlForm.contact}
                  onChange={e => setDlForm(p => ({ ...p, contact: e.target.value }))}
                  placeholder="0912 345 678"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(0,199,222,0.2)',
                    color: '#fff', borderRadius: 10, padding: '11px 14px',
                    fontSize: 15, outline: 'none', fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
                  {isEN ? 'Email to receive link' : 'Email nhận link'} <span style={{ color: '#fe5f01' }}>*</span>
                </label>
                <input
                  type="email"
                  value={dlForm.email}
                  onChange={e => setDlForm(p => ({ ...p, email: e.target.value }))}
                  placeholder={isEN ? 'you@email.com' : 'ban@email.com'}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(0,199,222,0.2)',
                    color: '#fff', borderRadius: 10, padding: '11px 14px',
                    fontSize: 15, outline: 'none', fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* User type */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
                  {isEN ? 'You are:' : 'Bạn là:'} <span style={{ color: '#fe5f01' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {USER_TYPE_OPTIONS.map((opt, idx) => {
                    const selected = dlForm.user_type === opt.value && dlForm._userTypeLabel === opt.label
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setDlForm(p => ({ ...p, user_type: opt.value, _userTypeLabel: opt.label }))}
                        style={{
                          padding: '9px 10px', borderRadius: 10, cursor: 'pointer',
                          fontSize: 13, fontWeight: 600, textAlign: 'center',
                          fontFamily: 'inherit',
                          background: selected ? 'rgba(0,199,222,0.15)' : 'rgba(255,255,255,0.04)',
                          border: selected ? '1.5px solid rgba(0,199,222,0.7)' : '1.5px solid rgba(255,255,255,0.12)',
                          color: selected ? '#00c7de' : 'rgba(255,255,255,0.7)',
                          transition: 'all 0.15s',
                        }}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {dlError && (
                <div style={{ color: '#fca5a5', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
                  ⚠ {dlError}
                </div>
              )}

              <button
                type="submit"
                disabled={dlLoading}
                style={{
                  width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                  background: dlLoading ? 'rgba(0,199,222,0.4)' : 'linear-gradient(135deg, #00c7de, #0094aa)',
                  color: '#fff', fontSize: 16, fontWeight: 800, cursor: dlLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  transition: 'opacity 0.2s',
                }}
              >
                {dlLoading ? (
                  <>{isEN ? 'Sending...' : 'Đang gửi...'}</>
                ) : (
                  <>🚀 {isEN ? 'Send Request' : 'Gửi yêu cầu'}</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />

      <style>{`
        @keyframes btnPulse {
          0%, 100% { box-shadow: 0 8px 40px rgba(254,95,1,0.5), 0 0 0 0 rgba(254,95,1,0.3); }
          50%       { box-shadow: 0 8px 40px rgba(254,95,1,0.7), 0 0 0 14px rgba(254,95,1,0); }
        }
        @keyframes liveDot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.6); }
          50% { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }
        @media (max-width: 640px) {
          .tai-xuong-steps-grid { grid-template-columns: 1fr !important; }
          .dl-popup-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}
