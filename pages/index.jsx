import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Reveal from '../components/Reveal'
import dynamic from 'next/dynamic'
const StarField = dynamic(() => import('../components/StarField'), { ssr: false })
const CountUp   = dynamic(() => import('../components/CountUp'),   { ssr: false })
import { useLang } from '../lib/LangContext'

// ─── WIZARD RECOMMEND ────────────────────────────────────────────────────────
function recommend(answers) {
  const team   = answers[1]
  const budget = answers[2]
  const acc    = answers[3]
  if (['10+ người', '10+ people'].includes(team) ||
      ['Trên 200 triệu', '$8,000+'].includes(budget) ||
      ['50+ TK', '50+ accounts'].includes(acc)) return 'agency'
  if (['4-10 người', '4–10 people'].includes(team) ||
      ['50–200 triệu', '$2,000–$8,000'].includes(budget) ||
      ['11–50 TK', '11–50 accounts'].includes(acc)) return 'business'
  return 'personal'
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function Home() {
  const { t, lang } = useLang()

  // Mouse spotlight
  const heroRef    = useRef(null)
  const spotRef    = useRef(null)
  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const handler = (e) => {
      const rect = el.getBoundingClientRect()
      const x    = e.clientX - rect.left
      const y    = e.clientY - rect.top
      if (spotRef.current) {
        spotRef.current.style.left    = x + 'px'
        spotRef.current.style.top     = y + 'px'
        spotRef.current.style.opacity = '1'
      }
    }
    el.addEventListener('mousemove', handler)
    return () => el.removeEventListener('mousemove', handler)
  }, [])

  // Wizard
  const [wizardStep, setWizardStep]   = useState(0)
  const [answers, setAnswers]         = useState({})
  const [showPlans, setShowPlans]     = useState(false)
  const [billingPeriod, setBillingPeriod] = useState('month') // 'month' | 'year1' | 'year3' | 'year5'
  const recommendedPlan = showPlans ? recommend(answers) : null

  function handleChoice(stepIdx, value) {
    const step = t.pricing.questions[stepIdx]
    if (step.multi) {
      const prev   = answers[stepIdx] || []
      const exists = prev.includes(value)
      setAnswers(a => ({ ...a, [stepIdx]: exists ? prev.filter(x => x !== value) : [...prev, value] }))
    } else {
      setAnswers(a => ({ ...a, [stepIdx]: value }))
    }
  }
  function isSelected(stepIdx, value) {
    const step = t.pricing.questions[stepIdx]
    if (step.multi) return (answers[stepIdx] || []).includes(value)
    return answers[stepIdx] === value
  }
  function canProceed(stepIdx) {
    const step = t.pricing.questions[stepIdx]
    if (step.multi) return (answers[stepIdx] || []).length > 0
    return !!answers[stepIdx]
  }
  function nextStep() {
    if (wizardStep < t.pricing.questions.length - 1) setWizardStep(s => s + 1)
    else setShowPlans(true)
  }
  function resetWizard() {
    setWizardStep(0)
    setAnswers({})
    setShowPlans(false)
  }

  // FAQ
  const [openFaq, setOpenFaq] = useState(null)

  const plans = t.pricing.plans

  return (
    <>
      <Head>
        <title>Go Meta Ads Pro — Đồng bộ CPA, Biết ngay Lãi hay Lỗ | Facebook Ads Tool</title>
        <meta name="description" content="Theo dõi CPA từng sản phẩm, đồng bộ target cho cả team, cảnh báo thông minh 7 ngày. Hơn 2,800+ tài khoản ads đang dùng mỗi ngày." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Go Meta Ads Pro — Đồng bộ CPA, Biết ngay Lãi hay Lỗ" />
        <meta property="og:description" content="Nền tảng web SaaS quản lý Facebook Ads thông minh — CPA realtime, cảnh báo tự động, báo cáo lãi/lỗ, Auto Care & Tự động Set QC." />
        <link rel="icon" href="/logo.png" />
      </Head>

      <Navbar />

      {/* ══ 1. HERO ══════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        style={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: '100vh',
          background: 'var(--bg)',
          paddingTop: 'calc(var(--header-h) + 60px)',
          paddingBottom: 80,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {/* Stars */}
        <StarField count={180} speed={0.25} />

        {/* Grid bg */}
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none' }} />

        {/* Mouse spotlight */}
        <div
          ref={spotRef}
          style={{
            position: 'absolute',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,199,222,0.06) 0%, transparent 70%)',
            transform: 'translate(-50%,-50%)',
            pointerEvents: 'none',
            transition: 'opacity 0.3s',
            opacity: 0,
            zIndex: 0,
          }}
        />

        {/* ARC element */}
        <div className="arc-wrap">
          <div className="arc-circle" />
          <div className="arc-circle" />
          <div className="arc-circle" />
          <div className="arc-glow" />
        </div>

        {/* Vertical glow stems */}
        <div style={{ position: 'absolute', left: '8%', top: '20%', width: 1, height: 160, background: 'linear-gradient(180deg, transparent, var(--teal), transparent)', opacity: 0.4, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: '8%', top: 'calc(20% + 160px)', width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)', boxShadow: '0 0 12px 4px rgba(0,199,222,0.5)', transform: 'translateX(-2px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '8%', top: '30%', width: 1, height: 120, background: 'linear-gradient(180deg, transparent, var(--cyan), transparent)', opacity: 0.35, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '8%', top: 'calc(30% + 120px)', width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 12px 4px rgba(53,231,233,0.5)', transform: 'translateX(-2px)', pointerEvents: 'none' }} />

        {/* Floating data cards */}
        <div className="float-card hide-mobile" style={{
          position: 'absolute',
          left: '3%',
          top: '42%',
          zIndex: 2,
          minWidth: 180,
          animation: 'cardFloat 6s ease-in-out infinite',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>CPA hôm nay</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--teal)', lineHeight: 1 }}>32,400đ</div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--lime)', fontWeight: 700 }}>▼ -15%</span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>vs ngưỡng</span>
          </div>
        </div>

        <div className="float-card hide-mobile" style={{
          position: 'absolute',
          right: '3%',
          top: '38%',
          zIndex: 2,
          minWidth: 160,
          animation: 'cardFloat 7s ease-in-out infinite reverse',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>ROAS</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--lime)', lineHeight: 1 }}>3.2x</div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 700 }}>↑ Scale được</span>
          </div>
        </div>

        {/* Center content */}
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', maxWidth: 820, margin: '0 auto' }}>

            <Reveal>
              <span className="badge">
                <span style={{ display: 'inline-block', width: 7, height: 7, background: 'var(--lime)', borderRadius: '50%', animation: 'pulseDot 2s ease-in-out infinite' }} />
                {t.hero.badge}
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1 style={{ marginBottom: 16, marginTop: 8 }}>
                {t.hero.title1}<br />
                <span className="grad-text">{t.hero.title2}</span>
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p style={{ fontSize: 18, color: 'var(--text2)', lineHeight: 1.8, marginBottom: 36, maxWidth: 640, margin: '0 auto 36px' }}>
                {t.hero.desc}
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
                <a href="/register" className="btn btn-teal btn-lg btn-ripple">
                  {t.hero.cta1}
                </a>
                <a href="#pricing" className="btn btn-glass btn-lg">
                  {t.hero.cta2}
                </a>
              </div>
            </Reveal>

            <Reveal delay={320}>
              <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
                {t.hero.trust.map((item, i) => (
                  <span key={i} style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ color: 'var(--teal)' }}>✓</span> {item}
                  </span>
                ))}
              </div>
            </Reveal>

            {/* Dashboard mockup */}
            <Reveal delay={420}>
              <div style={{ marginTop: 60, position: 'relative' }}>
                <div style={{
                  background: 'rgba(0,15,32,0.9)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid var(--border2)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,199,222,0.08)',
                  animation: 'float 7s ease-in-out infinite',
                }}>
                  {/* Window chrome */}
                  <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ef4444' }} />
                    <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#f59e0b' }} />
                    <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#10b981' }} />
                    <span style={{ marginLeft: 10, fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>Go Meta Ads Pro — Dashboard</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--teal)', fontWeight: 600 }}>● Live</span>
                  </div>
                  {/* Stat row */}
                  <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, borderBottom: '1px solid var(--border)' }}>
                    {[
                      { label: 'Chiến dịch', val: '18', color: '#60a5fa' },
                      { label: 'Chi tiêu hôm nay', val: '36.4M', color: 'var(--text)' },
                      { label: 'Tổng đơn hàng', val: '924', color: 'var(--teal)' },
                      { label: 'CPA cao ⚠', val: '3', color: '#ef4444' },
                    ].map(s => (
                      <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 10, padding: '10px 14px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</div>
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {/* Table */}
                  <div style={{ padding: '0 20px 16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.7fr 1fr 0.8fr 1.6fr 0.6fr 1fr', gap: 8, padding: '10px 0 6px', borderBottom: '1px solid var(--border)' }}>
                      {['Chiến dịch', 'SP', 'Trạng thái', 'Chi tiêu', 'CPA thực / mục tiêu', 'ROAS', 'Lãi/Lỗ'].map(h => (
                        <div key={h} style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</div>
                      ))}
                    </div>
                    {[
                      { name: 'Camp lượt mua web 1', sp: 'SP-A', status: '● Chạy tốt', statusOk: true, chi: '5.2M', cpa: '30,100 / 45,000đ', roas: '2.6×', laiLo: '+2,400,000đ', ok: true },
                      { name: 'Camp lượt mua web 2', sp: 'SP-B', status: '● Chạy tốt', statusOk: true, chi: '5.4M', cpa: '42,000 / 80,000đ', roas: '2.9×', laiLo: '+1,500,000đ', ok: true },
                      { name: 'Camp lượt mua 3',     sp: 'SP-A', status: '⚠ Hãy xem',  statusOk: false, chi: '4.1M', cpa: '63,800 / 45,000đ', roas: '2.1×', laiLo: '-880,000đ',  ok: false },
                    ].map((r, i) => (
                      <div key={i} style={{
                        display: 'grid', gridTemplateColumns: '2fr 0.7fr 1fr 0.8fr 1.6fr 0.6fr 1fr',
                        gap: 8, alignItems: 'center', padding: '9px 0',
                        borderBottom: i < 2 ? '1px solid var(--border)' : 'none', fontSize: 11,
                      }}>
                        <div>
                          <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: 11 }}>{r.name}</div>
                          <div style={{ color: 'var(--text3)', fontSize: 10, marginTop: 2 }}>Sản phẩm {r.sp}</div>
                        </div>
                        <div style={{ color: '#60a5fa', fontWeight: 700 }}>{r.sp}</div>
                        <div style={{ color: r.statusOk ? 'var(--teal)' : '#f59e0b', fontWeight: 600, fontSize: 10 }}>{r.status}</div>
                        <div style={{ color: 'var(--text2)' }}>{r.chi}</div>
                        <div style={{ color: r.ok ? 'var(--teal)' : '#ef4444', fontWeight: 700 }}>{r.cpa}</div>
                        <div style={{ color: '#f59e0b', fontWeight: 600 }}>{r.roas}</div>
                        <div style={{ color: r.ok ? 'var(--teal)' : '#ef4444', fontWeight: 800 }}>{r.laiLo}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Glow under mockup */}
                <div style={{ position: 'absolute', bottom: -30, left: '20%', right: '20%', height: 60, background: 'radial-gradient(ellipse, rgba(0,199,222,0.2) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(20px)' }} />
              </div>
            </Reveal>
          </div>

          {/* Scroll indicator */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 60, position: 'relative', zIndex: 1 }}>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' }}>{lang === 'en' ? 'Scroll down to explore' : 'Cuộn xuống để khám phá'}</span>
            <div className="scroll-indicator">
              <div className="scroll-arrow" />
            </div>
          </div>
        </div>
      </section>

      {/* Glow divider */}
      <div className="glow-line-h" />

      {/* ══ 2. PROBLEM SECTION ═══════════════════════════════════════════════ */}
      <section style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #000000 0%, #000d1a 60%, #00101f 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '100px 0',
      }}>
        {/* Teal glow left */}
        <div style={{ position: 'absolute', left: -100, top: '50%', transform: 'translateY(-50%)', width: 500, height: 500, background: 'radial-gradient(circle, rgba(0,199,222,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 64, alignItems: 'center' }} className="problem-grid">
            {/* Left: big statement */}
            <Reveal direction="left">
              <div>
                <span className="badge" style={{ marginBottom: 24 }}>😤 {t.problems.badge}</span>
                <h2 style={{ fontSize: 'clamp(2rem,4.5vw,3.5rem)', lineHeight: 1.15, marginBottom: 32 }}>
                  {lang === 'en' ? (
                    <>You can keep managing<br />
                    ads manually.<br />
                    <span className="text-teal">But why make it</span><br />
                    <span className="grad-text">so hard?</span></>
                  ) : (
                    <>Bạn có thể tiếp tục<br />
                    quản lý thủ công.<br />
                    <span className="text-teal">Nhưng tại sao phải</span><br />
                    <span className="grad-text">vất vả như vậy?</span></>
                  )}
                </h2>
                <a href="/register" className="btn btn-teal btn-lg">
                  {lang === 'en' ? 'Start free trial →' : 'Đăng ký dùng thử →'}
                </a>
              </div>
            </Reveal>

            {/* Right: description */}
            <Reveal direction="right" delay={120}>
              <div>
                <p style={{ fontSize: 16, color: 'var(--text2)', lineHeight: 1.85, marginBottom: 28 }}>
                  {t.problems.subtitle}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {t.problems.items.slice(0, 4).map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{p.icon}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{p.title}</div>
                        <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.55 }}>{p.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══ 3. FEATURES GRID ═════════════════════════════════════════════════ */}
      <section className="section grid-bg" id="features" style={{ background: 'var(--bg)' }}>
        <div className="container">
          <Reveal>
            <div className="section-header">
              <span className="badge">⚡ {t.features.badge}</span>
              <h2>{t.features.title}</h2>
              <p>{t.features.subtitle}</p>
            </div>
          </Reveal>

          <div className="features-auto-grid stagger">
            {t.features.items.map((f, i) => (
              <div key={i} className="card" style={{ height: '100%', cursor: 'default' }}>
                <div className="feature-icon" style={{ marginBottom: 18 }}>{f.icon}</div>
                <h3 style={{ marginBottom: 10, fontSize: 17 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.75, marginBottom: 18 }}>{f.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {f.tags.map(tag => (
                    <span key={tag} className="tag tag-teal">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 4. BEFORE / AFTER ════════════════════════════════════════════════ */}
      <section className="section" style={{ background: 'linear-gradient(135deg, #000f20 0%, #001428 100%)', position: 'relative', overflow: 'hidden' }}>
        {/* subtle center glow */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse, rgba(0,199,222,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative' }}>
          <Reveal>
            <div className="section-header">
              <span className="badge">✨ {t.beforeAfter.badge}</span>
              <h2>{t.beforeAfter.title}</h2>
            </div>
          </Reveal>

          <div className="grid-2" style={{ alignItems: 'start', gap: 28 }}>
            {/* Before */}
            <Reveal direction="left">
              <div style={{
                background: 'rgba(239,68,68,0.06)',
                border: '1.5px solid rgba(239,68,68,0.18)',
                borderRadius: 'var(--radius-lg)',
                padding: 32,
                backdropFilter: 'blur(12px)',
              }}>
                <h3 style={{ color: '#fca5a5', fontSize: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                  <span>😰</span> Trước — Quản lý thủ công
                </h3>
                <ul className="check-list">
                  {t.beforeAfter.before.map((item, i) => (
                    <li key={i} style={{ color: 'var(--text2)', borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                      <span className="cross" style={{ color: '#ef4444' }}>✗</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* After */}
            <Reveal direction="right" delay={150}>
              <div style={{
                background: 'rgba(0,199,222,0.06)',
                border: '1.5px solid rgba(0,199,222,0.2)',
                borderRadius: 'var(--radius-lg)',
                padding: 32,
                backdropFilter: 'blur(12px)',
              }}>
                <h3 style={{ color: 'var(--teal)', fontSize: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                  <span>🚀</span> Sau — Tự động &amp; đồng bộ
                </h3>
                <ul className="check-list">
                  {t.beforeAfter.after.map((item, i) => (
                    <li key={i} style={{ color: 'var(--text)', borderBottomColor: 'rgba(255,255,255,0.06)', fontWeight: 500 }}>
                      <span className="check">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══ 5. HOW IT WORKS ══════════════════════════════════════════════════ */}
      <section className="section grid-bg" style={{ background: 'var(--bg2)' }}>
        <div className="container">
          <Reveal>
            <div className="section-header">
              <span className="badge">⏱ {t.howItWorks.badge}</span>
              <h2>{t.howItWorks.title}</h2>
              <p>{t.howItWorks.subtitle}</p>
            </div>
          </Reveal>

          {/* Step bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, position: 'relative', marginBottom: 48 }} className="steps-grid">
            {/* Connector line behind */}
            <div className="hide-mobile" style={{ position: 'absolute', top: 27, left: '12.5%', right: '12.5%', height: 2, background: 'linear-gradient(90deg, var(--teal), var(--cyan))', opacity: 0.3, zIndex: 0 }} />
            {t.howItWorks.steps.map((s, i) => (
              <Reveal key={i} delay={i * 120}>
                <div style={{ textAlign: 'center', padding: '0 8px', position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: 54, height: 54, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--teal), var(--cyan))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px', fontSize: 22,
                    boxShadow: '0 0 24px rgba(0,199,222,0.35)',
                  }}>
                    {s.icon}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--teal)', letterSpacing: '1.2px', marginBottom: 8, textTransform: 'uppercase' }}>
                    Bước {s.num}
                  </div>
                  <h3 style={{ fontSize: 15, marginBottom: 8, color: 'var(--text)' }}>{s.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 }}>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={500}>
            <div style={{ textAlign: 'center' }}>
              <a href="/register" className="btn btn-teal btn-lg btn-ripple">
                🚀 Đăng ký dùng thử miễn phí
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ 6. STATS BAR ═════════════════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0fdf4 100%)',
        padding: '72px 0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 800, height: 200, background: 'radial-gradient(ellipse, rgba(0,112,243,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16 }} className="stats-grid">
            {t.stats.map((s, i) => (
              <Reveal key={i} delay={i * 100}>
                <div style={{ textAlign: 'center', padding: '20px 8px', position: 'relative' }}>
                  {i < t.stats.length - 1 && (
                    <div style={{ position: 'absolute', right: 0, top: '20%', bottom: '20%', width: 1, background: 'rgba(0,199,222,0.15)' }} className="hide-mobile" />
                  )}
                  <div style={{ fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', fontWeight: 900, color: '#0070f3', lineHeight: 1, marginBottom: 8 }}>
                    {s.display
                      ? s.display
                      : <CountUp end={s.num} suffix={s.suffix} />
                    }
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2332', marginBottom: 4, lineHeight: 1.4 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.note}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 6b. ANALYTICS / CHARTS ══════════════════════════════════════════ */}
      <section id="analytics" style={{ background: '#000d1a', padding: '100px 0', position: 'relative', overflow: 'hidden' }}>
        {/* subtle glow */}
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 900, height: 400, background: 'radial-gradient(ellipse, rgba(0,199,222,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative' }}>
          <Reveal>
            <div className="section-header">
              <span className="badge">📈 {lang === 'en' ? 'Real Results' : 'Kết quả thực tế'}</span>
              <h2 style={{ color: '#fff' }}>{lang === 'en' ? <>Real results after using<br /><span className="grad-text">Go Meta Ads Pro</span></> : <>Kết quả thực tế sau khi dùng<br /><span className="grad-text">Go Meta Ads Pro</span></>}</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)' }}>{lang === 'en' ? 'Aggregated data from 3,200+ active users — measured after 30 days of use' : 'Số liệu tổng hợp từ 3,200+ người dùng hoạt động — đo lường sau 30 ngày sử dụng'}</p>
            </div>
          </Reveal>

          {/* Charts row */}
          <div className="analytics-charts-grid">

            {/* Chart 1 — CPA Reduction Bar Chart */}
            <Reveal direction="left" delay={80}>
              <div className="analytics-card">
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{lang === 'en' ? 'Average CPA' : 'CPA trung bình'}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>{lang === 'en' ? 'Average CPA dropped 27%' : 'CPA trung bình giảm 27%'}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{lang === 'en' ? 'Before vs after using the tool' : 'So sánh trước và sau khi dùng tool'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 140, padding: '0 4px' }}>
                  {[
                    { label: 'T1', before: 100, after: 88 },
                    { label: 'T2', before: 100, after: 82 },
                    { label: 'T3', before: 100, after: 79 },
                    { label: 'T4', before: 100, after: 76 },
                    { label: 'T5', before: 100, after: 74 },
                    { label: 'T6', before: 100, after: 73 },
                  ].map((bar, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', height: 120 }}>
                        <div className="chart-bar-before" style={{ flex: 1, height: bar.before + '%', animationDelay: i * 0.08 + 's' }} />
                        <div className="chart-bar-after" style={{ flex: 1, height: bar.after + '%', animationDelay: i * 0.08 + 0.1 + 's' }} />
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{bar.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(239,68,68,0.7)', flexShrink: 0 }} />
                    {lang === 'en' ? 'Before' : 'Trước khi dùng'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--teal)', flexShrink: 0 }} />
                    {lang === 'en' ? 'After' : 'Sau khi dùng'}
                  </span>
                </div>
              </div>
            </Reveal>

            {/* Chart 2 — ROAS Line Chart */}
            <Reveal delay={160}>
              <div className="analytics-card">
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>ROAS</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>{lang === 'en' ? 'ROAS up 15% after 30 days' : 'ROAS tăng 15% sau 30 ngày'}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{lang === 'en' ? 'Teal line = after using Go Meta Ads Pro' : 'Đường xanh = sau khi dùng Go Meta Ads Pro'}</div>
                </div>
                <svg viewBox="0 0 260 120" style={{ width: '100%', height: 140 }}>
                  <defs>
                    <linearGradient id="roasGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(0,199,222,0.4)" />
                      <stop offset="100%" stopColor="rgba(0,199,222,0)" />
                    </linearGradient>
                  </defs>
                  {/* Before line (red) */}
                  <polyline points="0,80 43,82 86,78 130,84 173,80 216,82 260,80" fill="none" stroke="rgba(239,68,68,0.6)" strokeWidth="2" strokeDasharray="4 3" />
                  {/* After area (teal) */}
                  <polygon points="0,80 43,70 86,60 130,52 173,44 216,38 260,34 260,120 0,120" fill="url(#roasGrad)" />
                  <polyline points="0,80 43,70 86,60 130,52 173,44 216,38 260,34" fill="none" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="chart-line-draw" />
                  {/* Data points */}
                  {[[0,80],[43,70],[86,60],[130,52],[173,44],[216,38],[260,34]].map(([x,y],i) => (
                    <circle key={i} cx={x} cy={y} r="3" fill="var(--teal)" opacity="0.9" />
                  ))}
                  {/* Labels */}
                  {['T1','T2','T3','T4','T5','T6','T7'].map((label, i) => (
                    <text key={i} x={i * 43} y="115" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.35)">{label}</text>
                  ))}
                </svg>
                <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                    <span style={{ width: 14, height: 2, background: 'rgba(239,68,68,0.6)', flexShrink: 0, borderRadius: 1 }} />
                    {lang === 'en' ? 'Before' : 'Trước'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                    <span style={{ width: 14, height: 2, background: 'var(--teal)', flexShrink: 0, borderRadius: 1 }} />
                    {lang === 'en' ? 'After' : 'Sau'}
                  </span>
                </div>
              </div>
            </Reveal>

            {/* Chart 3 — Time Saved Donut */}
            <Reveal direction="right" delay={240}>
              <div className="analytics-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ marginBottom: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{lang === 'en' ? 'Reporting Time' : 'Thời gian báo cáo'}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>{lang === 'en' ? 'Save 96% of reporting time' : 'Tiết kiệm 96% thời gian báo cáo'}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{lang === 'en' ? 'From 2 hours/day down to 5 minutes' : 'Từ 2 giờ/ngày xuống còn 5 phút'}</div>
                </div>
                <div style={{ position: 'relative', width: 130, height: 130, margin: '0 auto' }}>
                  <svg viewBox="0 0 42 42" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="rgba(239,68,68,0.2)" strokeWidth="4" />
                    <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--teal)" strokeWidth="4"
                      strokeDasharray="96 4" strokeLinecap="round" className="donut-fill" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--teal)', lineHeight: 1 }}>96%</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>tiết kiệm</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'rgba(239,68,68,0.8)' }}>2h</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{lang === 'en' ? 'Before' : 'Trước'}</div>
                  </div>
                  <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.2)', alignSelf: 'center' }}>→</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--teal)' }}>{lang === 'en' ? '5 min' : '5 phút'}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{lang === 'en' ? 'After' : 'Sau'}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* 4 metric cards */}
          <div className="analytics-metrics-grid">
            {(lang === 'en' ? [
              { icon: '📉', label: 'Average CPA reduction', value: '27%', sub: 'thanks to timely AI alert responses', color: 'var(--teal)' },
              { icon: '📈', label: 'ROAS improvement', value: '+15%', sub: 'after 30 days of continuous use', color: 'var(--lime)' },
              { icon: '⏱', label: 'Reporting time', value: '-96%', sub: 'from 2 hours down to 5 minutes per day', color: '#60a5fa' },
              { icon: '⚡', label: 'React to losing campaigns', value: '<5 min', sub: 'receive alert and act before more is lost', color: '#f59e0b' },
            ] : [
              { icon: '📉', label: 'CPA giảm trung bình', value: '27%', sub: 'nhờ phản ứng kịp thời với cảnh báo AI', color: 'var(--teal)' },
              { icon: '📈', label: 'ROAS cải thiện', value: '+15%', sub: 'sau 30 ngày sử dụng liên tục', color: 'var(--lime)' },
              { icon: '⏱', label: 'Thời gian báo cáo', value: '-96%', sub: 'từ 2 tiếng xuống còn 5 phút mỗi ngày', color: '#60a5fa' },
              { icon: '⚡', label: 'Phản ứng camp lỗ', value: '<5 phút', sub: 'nhận cảnh báo và xử lý trước khi mất thêm', color: '#f59e0b' },
            ]).map((m, i) => (
              <Reveal key={i} delay={i * 80}>
                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 16,
                  padding: '24px 20px',
                  textAlign: 'center',
                  backdropFilter: 'blur(12px)',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{m.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: m.color, lineHeight: 1, marginBottom: 8 }}>{m.value}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{m.sub}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 7. TESTIMONIALS ══════════════════════════════════════════════════ */}
      <section className="section" style={{ background: 'var(--bg)' }}>
        <div className="container">
          <Reveal>
            <div className="section-header">
              <span className="badge">⭐ {t.testimonials.badge}</span>
              <h2>{t.testimonials.title}</h2>
              <p>{t.testimonials.subtitle}</p>
            </div>
          </Reveal>

          <div className="grid-3">
            {t.testimonials.items.map((tm, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="card testimonial-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Stars */}
                  <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                    {[...Array(5)].map((_, j) => (
                      <span key={j} style={{ color: 'var(--teal)', fontSize: 16 }}>★</span>
                    ))}
                  </div>
                  {/* Quote */}
                  <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.8, flex: 1, fontStyle: 'italic' }}>
                    &ldquo;{tm.content}&rdquo;
                  </p>
                  {/* Footer */}
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--teal), var(--cyan))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, flexShrink: 0,
                      }}>
                        {tm.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{tm.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>{tm.role}</div>
                      </div>
                    </div>
                    <div style={{
                      background: 'rgba(204,244,86,0.08)',
                      border: '1px solid rgba(204,244,86,0.2)',
                      borderRadius: 10, padding: '8px 12px',
                      fontSize: 13, fontWeight: 700, color: 'var(--lime)',
                    }}>
                      {tm.result}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 8. PRICING WIZARD ════════════════════════════════════════════════ */}
      <section className="section" id="pricing" style={{ background: 'var(--bg2)' }}>
        <div className="container">
          <Reveal>
            <div className="section-header">
              <span className="badge">💰 {t.pricing.badge}</span>
              <h2>{t.pricing.title}</h2>
              <p>{t.pricing.subtitle}</p>
            </div>
          </Reveal>

          {!showPlans ? (
            <Reveal delay={80}>
              <div style={{ maxWidth: 740, margin: '0 auto' }}>
                {/* Step bar */}
                <div className="step-bar">
                  {t.pricing.questions.map((_, i) => (
                    <div key={i} className="step-item">
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <div className={`step-circle${i < wizardStep ? ' done' : i === wizardStep ? ' active' : ''}`}>
                          {i < wizardStep ? '✓' : i + 1}
                        </div>
                        <div style={{ fontSize: 11, color: i <= wizardStep ? 'var(--teal)' : 'var(--text3)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {t.pricing.stepLabels[i]}
                        </div>
                      </div>
                      {i < t.pricing.questions.length - 1 && (
                        <div className={`step-line${i < wizardStep ? ' done' : ''}`} style={{ marginBottom: 18 }} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Question card */}
                <div className="card" style={{ padding: 36 }}>
                  <h3 style={{ fontSize: 20, marginBottom: 6 }}>
                    {t.pricing.questions[wizardStep].question}
                  </h3>
                  <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 24 }}>
                    {t.pricing.questions[wizardStep].subtitle}
                  </p>

                  <div className="choice-grid">
                    {t.pricing.questions[wizardStep].choices.map((c, ci) => {
                      const selected = isSelected(wizardStep, c.title)
                      return (
                        <button
                          key={ci}
                          className={`choice-card${selected ? ' selected' : ''}`}
                          onClick={() => handleChoice(wizardStep, c.title)}
                        >
                          <div className="choice-icon">{c.icon}</div>
                          <div className="choice-title">{c.title}</div>
                          <div className="choice-desc">{c.desc}</div>
                        </button>
                      )
                    })}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
                    <button
                      onClick={() => wizardStep > 0 && setWizardStep(s => s - 1)}
                      disabled={wizardStep === 0}
                      className="btn btn-glass btn-sm"
                      style={{ opacity: wizardStep === 0 ? 0 : 1, pointerEvents: wizardStep === 0 ? 'none' : 'auto' }}
                    >
                      {t.pricing.prev}
                    </button>
                    <span style={{ fontSize: 13, color: 'var(--text3)' }}>{wizardStep + 1} / {t.pricing.questions.length}</span>
                    <button
                      onClick={nextStep}
                      disabled={!canProceed(wizardStep)}
                      className="btn btn-teal btn-sm"
                    >
                      {wizardStep < t.pricing.questions.length - 1 ? t.pricing.next : t.pricing.seeResult}
                    </button>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <a href="#pricing-all" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'underline' }}
                    onClick={(e) => { e.preventDefault(); setShowPlans(true) }}>
                    {t.pricing.skipWizard}
                  </a>
                </div>
              </div>
            </Reveal>
          ) : (
            <Reveal delay={80}>
              <div>
                {/* Recommendation tag */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(0,199,222,0.08)', border: '1px solid rgba(0,199,222,0.2)', borderRadius: 'var(--radius-full)', padding: '10px 22px', marginBottom: 24 }}>
                    <span style={{ fontSize: 14, color: 'var(--text2)' }}>Dựa trên câu trả lời của bạn, chúng tôi gợi ý:</span>
                    <span style={{ color: 'var(--teal)', fontWeight: 800, fontSize: 15 }}>
                      Gói {plans.find(p => p.key === recommendedPlan)?.name}
                    </span>
                  </div>

                  {/* Billing tabs — 4 options */}
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {[
                      { key: 'month', label: t.pricing.billingMonth, badge: null },
                      { key: 'year1', label: t.pricing.billingYear1, badge: '-20%' },
                      { key: 'year3', label: t.pricing.billingYear3, badge: '-30%' },
                      { key: 'year5', label: t.pricing.billingYear5, badge: '-40%' },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => setBillingPeriod(opt.key)}
                        style={{
                          padding: '8px 16px', borderRadius: 'var(--radius-full)', border: 'none',
                          cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                          background: billingPeriod === opt.key ? 'var(--teal)' : 'var(--surface2)',
                          color: billingPeriod === opt.key ? '#000' : 'var(--text3)',
                          transition: 'all 0.2s', whiteSpace: 'nowrap',
                          display: 'flex', alignItems: 'center', gap: 6,
                          boxShadow: billingPeriod === opt.key ? '0 0 16px rgba(0,199,222,0.35)' : 'none',
                        }}
                      >
                        {opt.label}
                        {opt.badge && billingPeriod === opt.key && (
                          <span style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 800 }}>
                            {opt.badge}
                          </span>
                        )}
                        {opt.badge && billingPeriod !== opt.key && (
                          <span style={{ background: 'rgba(204,244,86,0.15)', color: 'var(--lime)', border: '1px solid rgba(204,244,86,0.3)', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 800 }}>
                            {opt.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {billingPeriod === 'year3' && (
                    <div style={{ marginTop: 10, fontSize: 13, color: 'var(--lime)', fontWeight: 600, textAlign: 'center' }}>
                      {lang === 'en' ? '🔥 Most popular long-term plan — save the most per year' : '🔥 Gói dài hạn phổ biến nhất — tiết kiệm nhiều nhất mỗi năm'}
                    </div>
                  )}
                </div>

                {/* Plan cards */}
                <div className="grid-3" style={{ alignItems: 'start', gap: 20 }}>
                  {plans.map((plan, i) => {
                    const isRec  = plan.key === recommendedPlan
                    const priceMap = { month: plan.priceMonth, year1: plan.priceYear1, year3: plan.priceYear3, year5: plan.priceYear5 }
                    const totalMap = { year1: plan.totalYear1, year3: plan.totalYear3, year5: plan.totalYear5 }
                    const price  = priceMap[billingPeriod]
                    const monthlySaving = plan.priceMonth - price
                    const yearlyTotal = totalMap[billingPeriod]
                    const billingLabel = { month: '', year1: 'year1', year3: 'year3', year5: 'year5' }[billingPeriod]
                    return (
                      <div key={i} className="card-solid plan-card" style={{
                        borderColor: isRec ? 'var(--teal)' : plan.popular ? 'rgba(254,95,1,0.3)' : 'var(--border2)',
                        boxShadow: isRec ? '0 0 40px rgba(0,199,222,0.15)' : 'none',
                        transform: isRec ? 'translateY(-6px)' : 'none',
                        position: 'relative',
                        overflow: 'hidden',
                      }}>
                        {/* Ribbon */}
                        {isRec && (
                          <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0,
                            background: 'linear-gradient(90deg, var(--teal), var(--cyan))',
                            color: '#000', textAlign: 'center', padding: '7px 12px',
                            fontSize: 11, fontWeight: 800, letterSpacing: '0.8px',
                          }}>
                            ⭐ {t.pricing.recommend.toUpperCase()}
                          </div>
                        )}
                        {plan.popular && !isRec && (
                          <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0,
                            background: 'linear-gradient(90deg, var(--orange), #ff9a3c)',
                            color: '#fff', textAlign: 'center', padding: '7px 12px',
                            fontSize: 11, fontWeight: 800,
                          }}>
                            {t.pricing.popularLabel.toUpperCase()}
                          </div>
                        )}

                        <div style={{ paddingTop: (isRec || plan.popular) ? 28 : 0 }}>
                          <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, color: isRec ? 'var(--teal)' : plan.popular ? 'var(--orange)' : 'var(--text)' }}>
                            {plan.name}
                          </h3>
                          <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 22 }}>{plan.desc}</p>

                          {/* Price */}
                          <div style={{ marginBottom: 20 }}>
                            {billingPeriod !== 'month' && (
                              <div style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'line-through', marginBottom: 2 }}>
                                {plan.priceMonth.toLocaleString('vi-VN')}K{t.pricing.perMonth}
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 42, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>
                                {price.toLocaleString('vi-VN')}K
                              </span>
                              <span style={{ fontSize: 14, color: 'var(--text3)' }}>{t.pricing.perMonth}</span>
                              {billingPeriod !== 'month' && (
                                <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(204,244,86,0.15)', color: 'var(--lime)', border: '1px solid rgba(204,244,86,0.3)', borderRadius: 4, padding: '2px 7px' }}>
                                  {billingPeriod === 'year1' ? '-20%' : billingPeriod === 'year3' ? '-30%' : '-40%'}
                                </span>
                              )}
                            </div>
                            {billingPeriod !== 'month' && yearlyTotal && (
                              <div style={{ fontSize: 12, color: 'var(--lime)', fontWeight: 600, marginTop: 4 }}>
                                {lang === 'en'
                                  ? `Total: ${(yearlyTotal).toLocaleString('vi-VN')}K · Save ${(monthlySaving * 12 * (billingPeriod === 'year1' ? 1 : billingPeriod === 'year3' ? 3 : 5)).toLocaleString('vi-VN')}K vs monthly`
                                  : `Tổng: ${(yearlyTotal).toLocaleString('vi-VN')}K · Tiết kiệm ${(monthlySaving * 12 * (billingPeriod === 'year1' ? 1 : billingPeriod === 'year3' ? 3 : 5)).toLocaleString('vi-VN')}K so với tháng`}
                              </div>
                            )}
                          </div>

                          {/* CTA */}
                          <a
                            href={`/mua-goi?plan=${plan.key}&billing=${billingPeriod}`}
                            className={`btn btn-block ${isRec ? 'btn-teal' : 'btn-glass'}`}
                            style={{ marginBottom: 22, justifyContent: 'center', fontFamily: 'inherit' }}
                          >
                            {plan.cta}
                          </a>

                          {/* Features */}
                          <ul className="check-list">
                            {plan.features.map(f => (
                              <li key={f}>
                                <span className="check">✓</span>
                                {f}
                              </li>
                            ))}
                            {plan.notIncluded.map(f => (
                              <li key={f} style={{ opacity: 0.35 }}>
                                <span className="cross">✗</span>
                                <span style={{ textDecoration: 'line-through' }}>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Guarantees + retake */}
                <div style={{ textAlign: 'center', marginTop: 40 }}>
                  <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
                    {t.pricing.guarantees.map((item, i) => (
                      <span key={i} style={{ fontSize: 13, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ color: 'var(--teal)' }}>✓</span> {item}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={resetWizard}
                    style={{ background: 'none', border: 'none', color: 'var(--teal)', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', textDecoration: 'underline' }}
                  >
                    {t.pricing.retake}
                  </button>
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ══ 9. FAQ ═══════════════════════════════════════════════════════════ */}
      <section className="section" style={{ background: 'var(--bg)' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <Reveal>
            <div className="section-header">
              <span className="badge">❓ {t.faq.badge}</span>
              <h2>{t.faq.title}</h2>
            </div>
          </Reveal>

          <div>
            {t.faq.items.map((faq, i) => (
              <Reveal key={i} delay={i * 40}>
                <div className="accordion">
                  <button
                    className="accordion-trigger"
                    aria-expanded={openFaq === i}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span>{faq.q}</span>
                    <span className="icon">+</span>
                  </button>
                  {openFaq === i && (
                    <div className="accordion-body">{faq.a}</div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 10. FINAL CTA ════════════════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg, #000d1a 0%, #001428 50%, #000f20 100%)',
        padding: '100px 0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Stars */}
        <StarField count={80} speed={0.15} />
        {/* Center glow */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 350, background: 'radial-gradient(ellipse, rgba(0,199,222,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="glow-line-h" style={{ position: 'absolute', top: 0, left: 0, right: 0 }} />

        <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Reveal>
            <span className="badge" style={{ marginBottom: 24 }}>{t.cta.badge}</span>
            <h2 style={{ marginBottom: 16, fontSize: 'clamp(1.8rem,4vw,2.8rem)' }}>
              {t.cta.title}
            </h2>
            <p style={{ color: 'var(--text2)', fontSize: 17, lineHeight: 1.8, marginBottom: 40, maxWidth: 540, marginLeft: 'auto', marginRight: 'auto' }}>
              {t.cta.subtitle}
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
              <a href="/register" className="btn btn-teal btn-xl btn-ripple">
                🚀 {t.cta.cta1}
              </a>
              <a href="#pricing" className="btn btn-glass btn-xl">
                {t.cta.cta2}
              </a>
            </div>
            <div style={{ color: 'var(--text3)', fontSize: 14 }}>
              {t.cta.contact}{' '}
              <a href="https://zalo.me" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text2)', fontWeight: 600 }}>Zalo</a>
              {' · '}
              <a href="https://t.me/Go_Meta_Ads_Pro_V1_bot" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text2)', fontWeight: 600 }}>Telegram Bot</a>
              {' · '}
              <a href="mailto:admin@gonetwork.vn" style={{ color: 'var(--text2)', fontWeight: 600 }}>admin@gonetwork.vn</a>
            </div>
          </Reveal>
        </div>
        <div className="glow-line-h" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />
      </section>

      {/* ══ 11. SECURITY ═════════════════════════════════════════════════════ */}
      <section style={{ background: '#000f20', padding: '80px 0' }}>
        <div className="container">
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 56, flexWrap: 'wrap' }}>
              {/* Left */}
              <div style={{ flex: '1 1 300px' }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>🔐</div>
                <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 14 }}>
                  {t.security.title}
                </h3>
                <p style={{ color: 'var(--text2)', fontSize: 15, lineHeight: 1.85 }}>
                  {t.security.desc}
                </p>
              </div>
              {/* Right: 4 glass cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, flex: '1 1 260px' }}>
                {t.security.items.map((s, i) => (
                  <div key={i} className="card" style={{ padding: 20 }}>
                    <div style={{ fontSize: 26, marginBottom: 10 }}>{s.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{s.title}</div>
                    <div style={{ color: 'var(--text3)', fontSize: 12, lineHeight: 1.55 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />

      <style>{`
        /* ── Problem grid responsive ── */
        .problem-grid {
          grid-template-columns: 3fr 2fr;
        }

        /* ── Features auto-fit grid ── */
        .features-auto-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        /* ── Stats grid: 5 cols → 3+2 → 2+3 → 1 ── */
        .stats-grid { grid-template-columns: repeat(5, 1fr) !important; }

        /* ── Analytics charts grid ── */
        .analytics-charts-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 32px;
        }
        .analytics-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 28px 24px;
          backdrop-filter: blur(12px);
        }

        /* ── Analytics metrics grid ── */
        .analytics-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-top: 16px;
        }

        /* ── Bar chart animations ── */
        .chart-bar-before {
          background: rgba(239,68,68,0.55);
          border-radius: 4px 4px 0 0;
          width: 100%;
          transform-origin: bottom;
          animation: growBar 0.8s ease-out both;
        }
        .chart-bar-after {
          background: var(--teal);
          border-radius: 4px 4px 0 0;
          width: 100%;
          transform-origin: bottom;
          animation: growBar 0.8s ease-out both;
        }
        @keyframes growBar {
          from { transform: scaleY(0); opacity: 0; }
          to   { transform: scaleY(1); opacity: 1; }
        }

        /* ── Line chart draw animation ── */
        .chart-line-draw {
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: drawLine 1.5s ease-out both 0.3s;
        }
        @keyframes drawLine {
          to { stroke-dashoffset: 0; }
        }

        /* ── Donut fill animation ── */
        .donut-fill {
          stroke-dasharray: 0 100;
          animation: fillDonut 1.2s ease-out both 0.5s;
        }
        @keyframes fillDonut {
          to { stroke-dasharray: 96 4; }
        }

        @media (max-width: 1024px) {
          .stats-grid   { grid-template-columns: repeat(3, 1fr) !important; }
          .analytics-charts-grid { grid-template-columns: 1fr 1fr !important; }
          .analytics-metrics-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 768px) {
          .problem-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .steps-grid   { grid-template-columns: 1fr 1fr !important; }
          .stats-grid   { grid-template-columns: repeat(2, 1fr) !important; }
          .features-auto-grid { grid-template-columns: 1fr !important; }
          .analytics-charts-grid { grid-template-columns: 1fr !important; }
          .analytics-metrics-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .steps-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: 1fr !important; }
          .analytics-metrics-grid { grid-template-columns: 1fr !important; }
        }

        /* ── Plan card hover ── */
        .plan-card:hover {
          transform: translateY(-4px) !important;
          border-color: rgba(0,199,222,0.3) !important;
        }

        /* ── Testimonial hover ── */
        .testimonial-card:hover {
          transform: translateY(-6px);
          border-color: rgba(0,199,222,0.3);
          box-shadow: 0 24px 60px rgba(0,0,0,0.3);
        }

        /* ── Card shine on hover ── */
        .card::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent);
          transition: left 0.5s ease;
          z-index: 0;
          pointer-events: none;
        }
        .card:hover::before { left: 150%; }

        /* ── Feature icon on card hover ── */
        .card:hover .feature-icon {
          background: rgba(0,199,222,0.15);
          transform: scale(1.08) rotate(-3deg);
          box-shadow: 0 0 20px rgba(0,199,222,0.25);
        }

        /* ── Float card ── */
        @keyframes cardFloat {
          0%,100% { transform: translateY(0) rotate(-1deg); }
          50%      { transform: translateY(-12px) rotate(1deg); }
        }

        /* ── Accordion body ── */
        .accordion-body { animation: fadeIn 0.25s ease; }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

        /* ── Reduced motion ── */
        @media (prefers-reduced-motion: reduce) {
          .reveal, .reveal-left, .reveal-right { opacity: 1 !important; transform: none !important; }
          .stagger > * { opacity: 1 !important; transform: none !important; }
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </>
  )
}
