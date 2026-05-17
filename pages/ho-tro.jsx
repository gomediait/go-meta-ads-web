import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useLang } from '../lib/LangContext'

const API_BASE = 'https://go-meta-ads-backend.vercel.app/api'

/* ─── CHAT MESSAGE ──────────────────────────────────────────────────────────── */
function ChatMessage({ role, text }) {
  const isBot = role === 'bot'
  return (
    <div style={{
      display: 'flex',
      justifyContent: isBot ? 'flex-start' : 'flex-end',
      marginBottom: 14,
    }}>
      {isBot && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #0c2a72, #1a3a8f)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, marginRight: 10, flexShrink: 0, alignSelf: 'flex-end',
        }}>🤖</div>
      )}
      <div style={{
        maxWidth: '75%',
        background: isBot ? '#0d2040' : '#0c2a72',
        color: '#e2e8f0',
        padding: '10px 15px',
        borderRadius: isBot ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
        fontSize: 14,
        lineHeight: 1.7,
        border: isBot ? '1px solid rgba(255,255,255,0.08)' : 'none',
      }}>
        {text}
      </div>
    </div>
  )
}

/* ─── CHAT TAB ──────────────────────────────────────────────────────────────── */
function ChatTab({ isEN }) {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Xin chào! Tôi là Go Meta AI. Bạn cần hỗ trợ gì về Go Meta Ads Pro?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading])

  const sendMessage = async () => {
    const msg = input.trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })
      const data = await res.json()
      if (data.reply || data.message) {
        setMessages(prev => [...prev, { role: 'bot', text: data.reply || data.message }])
      } else {
        throw new Error('no reply')
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: isEN
          ? 'AI feature is under development. Please send a ticket or contact Zalo for support.'
          : 'Tính năng AI đang được phát triển. Vui lòng gửi ticket hoặc liên hệ Zalo để được hỗ trợ.',
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 480 }}>
      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        background: '#001428',
        borderRadius: '10px 10px 0 0',
        padding: '20px 16px',
      }}>
        {messages.map((m, i) => (
          <ChatMessage key={i} role={m.role} text={m.text} />
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 14 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0c2a72, #1a3a8f)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, marginRight: 10, flexShrink: 0, alignSelf: 'flex-end',
            }}>🤖</div>
            <div style={{
              background: '#0d2040',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '12px 18px',
              borderRadius: '4px 14px 14px 14px',
              display: 'flex', gap: 5, alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#64748b',
                  display: 'inline-block',
                  animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', gap: 10,
        background: '#001e3c',
        borderRadius: '0 0 10px 10px',
        padding: '12px 14px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={isEN ? 'Type your question...' : 'Nhập câu hỏi của bạn...'}
          disabled={loading}
          style={{
            flex: 1,
            background: '#0d2040',
            border: '1.5px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
            color: '#e2e8f0',
            padding: '10px 14px',
            fontSize: 14,
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="btn btn-teal"
          style={{ flexShrink: 0, fontSize: 14, padding: '10px 18px' }}
        >
          {isEN ? 'Send' : 'Gửi'}
        </button>
      </div>

      {/* Disclaimer */}
      <p style={{
        margin: '10px 0 0',
        fontSize: 12,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 1.6,
      }}>
        {isEN
          ? 'AI may not always be accurate. For urgent issues, please contact us directly.'
          : 'AI có thể trả lời chưa chính xác. Với các vấn đề khẩn cấp, vui lòng liên hệ trực tiếp.'}
      </p>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

/* ─── TICKET TAB ────────────────────────────────────────────────────────────── */
function TicketTab({ isEN }) {
  const [key, setKey] = useState('')
  const [keyStatus, setKeyStatus] = useState(null) // null | 'valid' | 'invalid'
  const [keyLoading, setKeyLoading] = useState(false)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [issueType, setIssueType] = useState('Lỗi phần mềm')
  const [description, setDescription] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null) // null | { ok, message }
  const [errors, setErrors] = useState({})

  const inputStyle = {
    width: '100%',
    border: '1.5px solid #e2e8f0',
    borderRadius: 8,
    padding: '10px 13px',
    fontSize: 14,
    color: '#1a2332',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    background: '#fff',
    transition: 'border-color 0.2s',
  }

  const labelStyle = {
    display: 'block',
    fontWeight: 700,
    fontSize: 13.5,
    color: '#0c2a72',
    marginBottom: 7,
  }

  const verifyKey = async () => {
    const k = key.trim().toUpperCase()
    if (!k) return
    setKeyLoading(true)
    setKeyStatus(null)
    try {
      const res = await fetch(`${API_BASE}/license`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', key: k }),
      })
      const data = await res.json()
      setKeyStatus(data.ok ? 'valid' : 'invalid')
    } catch {
      setKeyStatus('invalid')
    } finally {
      setKeyLoading(false)
    }
  }

  const validate = () => {
    const e = {}
    if (!key.trim()) e.key = isEN ? 'Required' : 'Bắt buộc'
    if (keyStatus !== 'valid') e.key = isEN
      ? 'Key does not exist. Only active customers can submit tickets.'
      : 'Key không tồn tại. Chỉ khách hàng đang dùng mới gửi được ticket.'
    if (!phone.trim()) e.phone = isEN ? 'Required' : 'Bắt buộc'
    if (!email.trim()) e.email = isEN ? 'Required' : 'Bắt buộc'
    if (!description.trim()) e.description = isEN ? 'Required' : 'Bắt buộc'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setSubmitting(true)
    setResult(null)
    try {
      const res = await fetch(`${API_BASE}/ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          license_key: key.trim().toUpperCase(),
          phone: phone.trim(),
          email: email.trim(),
          issue_type: issueType,
          description: description.trim(),
        }),
      })
      const data = await res.json()
      if (data.ok) {
        const ticketId = data.ticket_id || data.id || 'N/A'
        setResult({
          ok: true,
          message: isEN
            ? `Ticket submitted! Ticket ID: ${ticketId}. We will respond within 2-4 hours.`
            : `Ticket đã gửi! Mã ticket: ${ticketId}. Chúng tôi sẽ phản hồi trong 2-4 giờ.`,
        })
        // Reset form
        setKey(''); setKeyStatus(null); setPhone(''); setEmail('')
        setIssueType('Lỗi phần mềm'); setDescription(''); setScreenshot(null)
      } else {
        setResult({ ok: false, message: data.error || (isEN ? 'Submission failed. Please try again.' : 'Gửi thất bại. Vui lòng thử lại.') })
      }
    } catch {
      setResult({ ok: false, message: isEN ? 'Network error. Please try again.' : 'Lỗi kết nối. Vui lòng thử lại.' })
    } finally {
      setSubmitting(false)
    }
  }

  const ISSUE_TYPES_VI = ['Lỗi phần mềm', 'Hỏi về tính năng', 'Thanh toán/Key', 'Yêu cầu tính năng mới', 'Khác']
  const ISSUE_TYPES_EN = ['Software Bug', 'Feature Question', 'Payment/Key', 'Feature Request', 'Other']
  const issueTypes = isEN ? ISSUE_TYPES_EN : ISSUE_TYPES_VI

  return (
    <form onSubmit={handleSubmit} noValidate>

      {/* Key kích hoạt */}
      <div className="form-group" style={{ marginBottom: 20 }}>
        <label style={labelStyle}>
          {isEN ? 'Activation Key' : 'Key kích hoạt'} <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            value={key}
            onChange={e => { setKey(e.target.value.toUpperCase()); setKeyStatus(null) }}
            onBlur={verifyKey}
            placeholder="GMAP-XXXXXX-XXXXXX-XXXX"
            style={{ ...inputStyle, flex: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}
          />
          <button
            type="button"
            onClick={verifyKey}
            disabled={keyLoading || !key.trim()}
            style={{
              flexShrink: 0,
              padding: '10px 16px',
              background: '#0c2a72',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontFamily: 'inherit',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              opacity: keyLoading || !key.trim() ? 0.5 : 1,
            }}
          >
            {keyLoading ? '...' : (isEN ? 'Verify' : 'Xác minh')}
          </button>
        </div>
        {keyStatus === 'valid' && (
          <div style={{ marginTop: 7, fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
            ✓ {isEN ? 'Valid key' : 'Key hợp lệ'}
          </div>
        )}
        {keyStatus === 'invalid' && (
          <div style={{ marginTop: 7, fontSize: 13, color: '#ef4444' }}>
            {isEN
              ? 'Key does not exist. Only active customers can submit tickets.'
              : 'Key không tồn tại. Chỉ khách hàng đang dùng mới gửi được ticket.'}
          </div>
        )}
        {errors.key && keyStatus !== 'invalid' && (
          <div style={{ marginTop: 7, fontSize: 13, color: '#ef4444' }}>{errors.key}</div>
        )}
      </div>

      {/* SĐT */}
      <div className="form-group" style={{ marginBottom: 20 }}>
        <label style={labelStyle}>
          {isEN ? 'Contact Phone' : 'SĐT liên hệ'} <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          type="text"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder={isEN ? 'e.g. 0901234567' : 'VD: 0901234567'}
          style={inputStyle}
        />
        {errors.phone && <div style={{ marginTop: 7, fontSize: 13, color: '#ef4444' }}>{errors.phone}</div>}
      </div>

      {/* Email */}
      <div className="form-group" style={{ marginBottom: 20 }}>
        <label style={labelStyle}>
          {isEN ? 'Contact Email' : 'Email liên hệ'} <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={isEN ? 'your@email.com' : 'email@cuaban.com'}
          style={inputStyle}
        />
        {errors.email && <div style={{ marginTop: 7, fontSize: 13, color: '#ef4444' }}>{errors.email}</div>}
      </div>

      {/* Loại vấn đề */}
      <div className="form-group" style={{ marginBottom: 20 }}>
        <label style={labelStyle}>
          {isEN ? 'Issue Type' : 'Loại vấn đề'}
        </label>
        <select
          value={issueType}
          onChange={e => setIssueType(e.target.value)}
          style={{ ...inputStyle, appearance: 'auto', cursor: 'pointer' }}
        >
          {issueTypes.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Mô tả */}
      <div className="form-group" style={{ marginBottom: 20 }}>
        <label style={labelStyle}>
          {isEN ? 'Detailed Description' : 'Mô tả chi tiết'} <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <textarea
          rows={4}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={isEN
            ? 'Describe your issue in detail: what happened, what you expected, steps to reproduce...'
            : 'Mô tả chi tiết vấn đề: điều gì đã xảy ra, bạn mong đợi gì, các bước tái hiện lỗi...'}
          style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
        />
        {errors.description && <div style={{ marginTop: 7, fontSize: 13, color: '#ef4444' }}>{errors.description}</div>}
      </div>

      {/* Upload ảnh */}
      <div className="form-group" style={{ marginBottom: 28 }}>
        <label style={labelStyle}>
          {isEN ? 'Screenshot (optional)' : 'Upload ảnh chụp màn hình lỗi (tuỳ chọn)'}
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={e => setScreenshot(e.target.files[0] || null)}
          style={{
            display: 'block',
            fontSize: 13,
            color: '#1a2332',
            padding: '8px 0',
          }}
        />
        {screenshot && (
          <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>
            {isEN ? 'Selected:' : 'Đã chọn:'} {screenshot.name}
          </div>
        )}
        <div style={{ marginTop: 5, fontSize: 12, color: '#94a3b8' }}>
          {isEN ? 'Attach a screenshot to help us diagnose faster.' : 'Đính kèm ảnh để chúng tôi chẩn đoán nhanh hơn.'}
        </div>
      </div>

      {/* Result message */}
      {result && (
        <div style={{
          marginBottom: 20,
          padding: '14px 18px',
          borderRadius: 10,
          background: result.ok ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${result.ok ? '#bbf7d0' : '#fecaca'}`,
          color: result.ok ? '#166534' : '#991b1b',
          fontSize: 14,
          fontWeight: 600,
          lineHeight: 1.6,
        }}>
          {result.ok ? '✅' : '❌'} {result.message}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-teal"
        style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, opacity: submitting ? 0.7 : 1 }}
      >
        {submitting ? (isEN ? 'Submitting...' : 'Đang gửi...') : (isEN ? '📤 Submit Request' : '📤 Gửi yêu cầu')}
      </button>
    </form>
  )
}

/* ─── MAIN PAGE ─────────────────────────────────────────────────────────────── */
export default function HoTro() {
  const { lang } = useLang()
  const isEN = lang === 'en'
  const [activeTab, setActiveTab] = useState('ticket')

  const tabs = [
    { id: 'ticket', label: isEN ? '📋 Submit a Request' : '📋 Gửi yêu cầu hỗ trợ' },
    { id: 'chat',   label: isEN ? '💬 Chat with AI'     : '💬 Chat với AI' },
  ]

  return (
    <>
      <Head>
        <title>{isEN ? 'Support Center — Go Meta Ads Pro' : 'Trung tâm hỗ trợ — Go Meta Ads Pro'}</title>
        <meta name="description" content={isEN
          ? 'Get help with Go Meta Ads Pro. Submit a support ticket or chat with our AI assistant.'
          : 'Nhận hỗ trợ về Go Meta Ads Pro. Gửi ticket hỗ trợ hoặc chat với trợ lý AI của chúng tôi.'
        } />
      </Head>
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #001428 0%, #0c2a72 60%, #1a3a8f 100%)',
        paddingTop: 'calc(var(--header-h) + 16px)',
        paddingBottom: 64,
        textAlign: 'center',
        color: '#fff',
      }}>
        <div className="container" style={{ maxWidth: 680 }}>
          <div className="badge badge-white" style={{ marginBottom: 20 }}>
            🎧 {isEN ? 'Customer Support' : 'Hỗ trợ khách hàng'}
          </div>
          <h1 style={{
            fontSize: 'clamp(1.85rem, 4.5vw, 2.85rem)',
            fontWeight: 900,
            margin: '0 0 18px',
            color: '#fff',
            lineHeight: 1.2,
          }}>
            {isEN ? 'Support Center' : 'Trung tâm hỗ trợ'}
          </h1>
          <p style={{ fontSize: 17, opacity: 0.8, lineHeight: 1.75, margin: 0, color: '#fff' }}>
            {isEN
              ? 'Submit a support ticket or chat with our AI — we respond within 2-4 hours.'
              : 'Gửi ticket hỗ trợ hoặc chat với AI của chúng tôi — phản hồi trong 2-4 giờ.'}
          </p>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div style={{ background: '#f8faff', minHeight: '100vh', padding: '48px 16px 80px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>

          {/* Card */}
          <div style={{
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 4px 32px rgba(12,42,114,0.12)',
            overflow: 'hidden',
          }}>
            {/* Tab switcher */}
            <div style={{
              display: 'flex',
              borderBottom: '2px solid #e2e8f0',
            }}>
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    flex: 1,
                    padding: '16px 12px',
                    border: 'none',
                    borderBottom: activeTab === t.id ? '2px solid #0c2a72' : '2px solid transparent',
                    marginBottom: -2,
                    background: 'transparent',
                    fontFamily: 'inherit',
                    fontWeight: activeTab === t.id ? 700 : 500,
                    fontSize: 14,
                    color: activeTab === t.id ? '#0c2a72' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ padding: '32px 28px' }}>
              {activeTab === 'ticket' && <TicketTab isEN={isEN} />}
              {activeTab === 'chat'   && <ChatTab isEN={isEN} />}
            </div>
          </div>


        </div>
      </div>

      <Footer />
    </>
  )
}
