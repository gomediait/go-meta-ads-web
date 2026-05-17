import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useLang } from '../lib/LangContext'
import { uploadImage } from '../lib/uploadImage'

const API_BASE = 'https://go-meta-ads-backend.vercel.app/api'

const darkInput = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(0,199,222,0.2)',
  color: '#fff',
  borderRadius: 8,
  padding: '10px 13px',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
}

const darkLabel = {
  display: 'block',
  fontWeight: 600,
  fontSize: 13,
  color: 'rgba(255,255,255,0.7)',
  marginBottom: 7,
}

/* ─── SPINNER INLINE ────────────────────────────────────────────────────────── */
function InlineSpinner() {
  return (
    <span style={{
      display: 'inline-block',
      width: 14,
      height: 14,
      border: '2px solid rgba(255,255,255,0.3)',
      borderTop: '2px solid #00c7de',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      verticalAlign: 'middle',
      marginRight: 6,
    }} />
  )
}

/* ─── IMAGE THUMBNAILS ──────────────────────────────────────────────────────── */
function ImageGrid({ urls, onRemove }) {
  const [fullImg, setFullImg] = useState(null)
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        {urls.map((u, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <img
              src={u.thumbnail || u.url}
              alt=""
              onClick={() => setFullImg(u.url)}
              style={{
                width: 80, height: 80,
                objectFit: 'cover',
                borderRadius: 6,
                border: '1px solid rgba(0,199,222,0.3)',
                cursor: 'pointer',
              }}
            />
            {onRemove && (
              <button
                onClick={() => onRemove(i)}
                style={{
                  position: 'absolute', top: -6, right: -6,
                  width: 18, height: 18,
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: '50%',
                  color: '#fff',
                  fontSize: 10,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'inherit',
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      {fullImg && (
        <div
          onClick={() => setFullImg(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
          }}
        >
          <img src={fullImg} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8 }} />
        </div>
      )}
    </>
  )
}

/* ─── STATUS BADGE ──────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    open:        { bg: '#ef4444', label: 'Mở' },
    in_progress: { bg: '#f59e0b', label: 'Đang xử lý' },
    resolved:    { bg: '#10b981', label: 'Đã giải quyết' },
    closed:      { bg: '#64748b', label: 'Đã đóng' },
  }
  const s = map[status] || { bg: '#64748b', label: status || 'N/A' }
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 700,
      background: s.bg,
      color: '#fff',
    }}>
      {s.label}
    </span>
  )
}

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
          style={{ flexShrink: 0, fontSize: 14, padding: '10px 18px', fontFamily: 'inherit' }}
        >
          {isEN ? 'Send' : 'Gửi'}
        </button>
      </div>

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

/* ─── TICKET REPLY THREAD ────────────────────────────────────────────────────── */
function ReplyThread({ replies }) {
  if (!replies || replies.length === 0) return null
  return (
    <div style={{
      maxHeight: 400,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      marginBottom: 16,
    }}>
      {replies.map((r, i) => {
        const isAdmin = r.role === 'admin'
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: isAdmin ? 'flex-start' : 'flex-end',
              gap: 8,
            }}
          >
            {isAdmin && (
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: '#0c2a72',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, flexShrink: 0, alignSelf: 'flex-end',
                color: '#fff', fontWeight: 700,
              }}>A</div>
            )}
            <div style={{
              maxWidth: '75%',
              background: isAdmin ? 'rgba(12,42,114,0.5)' : 'rgba(0,199,222,0.15)',
              border: isAdmin ? '1px solid rgba(12,42,114,0.4)' : '1px solid rgba(0,199,222,0.3)',
              color: '#e2e8f0',
              padding: '10px 14px',
              borderRadius: isAdmin ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
              fontSize: 13,
              lineHeight: 1.6,
            }}>
              <div>{r.message || r.text || ''}</div>
              {r.image_urls && r.image_urls.length > 0 && (
                <ImageGrid urls={r.image_urls.map(u => ({ url: u, thumbnail: u }))} />
              )}
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
                {r.created_at ? new Date(r.created_at).toLocaleString('vi-VN') : ''}
              </div>
            </div>
            {!isAdmin && (
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(0,199,222,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, flexShrink: 0, alignSelf: 'flex-end',
                color: '#fff', fontWeight: 700,
              }}>U</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── TICKET LOOKUP TAB ─────────────────────────────────────────────────────── */
function TicketLookupTab({ isEN }) {
  const [ticketId, setTicketId] = useState('')
  const [loading, setLoading] = useState(false)
  const [ticket, setTicket] = useState(null)
  const [error, setError] = useState('')

  // Reply form
  const [replyText, setReplyText] = useState('')
  const [replyImages, setReplyImages] = useState([]) // [{url, thumbnail}]
  const [replyUploading, setReplyUploading] = useState(false)
  const [replySending, setReplySending] = useState(false)
  const [replySuccess, setReplySuccess] = useState(false)

  const handleLookup = async () => {
    const id = ticketId.trim()
    if (!id) return
    setLoading(true)
    setError('')
    setTicket(null)
    try {
      const res = await fetch(`${API_BASE}/ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', ticket_id: id }),
      })
      const data = await res.json()
      if (data.ok && (data.ticket || data.data)) {
        setTicket(data.ticket || data.data)
        setReplyText('')
        setReplyImages([])
        setReplySuccess(false)
      } else {
        setError(data.error || (isEN ? 'Ticket not found' : 'Không tìm thấy ticket'))
      }
    } catch {
      setError(isEN ? 'Network error' : 'Lỗi kết nối')
    } finally {
      setLoading(false)
    }
  }

  const handleReplyImageUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setReplyUploading(true)
    try {
      const uploaded = await Promise.all(files.slice(0, 3).map(f => uploadImage(f)))
      setReplyImages(prev => [...prev, ...uploaded].slice(0, 3))
    } catch (err) {
      alert('Upload ảnh thất bại: ' + err.message)
    } finally {
      setReplyUploading(false)
      e.target.value = ''
    }
  }

  const handleSendReply = async () => {
    if (!replyText.trim() && replyImages.length === 0) return
    setReplySending(true)
    try {
      const res = await fetch(`${API_BASE}/ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          ticket_id: ticket.id,
          role: 'user',
          message: replyText.trim(),
          image_urls: replyImages.map(u => u.url),
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setReplySuccess(true)
        setReplyText('')
        setReplyImages([])
        // Reload ticket to get new replies
        const res2 = await fetch(`${API_BASE}/ticket`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get', ticket_id: ticket.id }),
        })
        const data2 = await res2.json()
        if (data2.ok && (data2.ticket || data2.data)) {
          setTicket(data2.ticket || data2.data)
        }
        setTimeout(() => setReplySuccess(false), 3000)
      } else {
        alert(data.error || 'Gửi phản hồi thất bại')
      }
    } catch {
      alert(isEN ? 'Network error' : 'Lỗi kết nối')
    } finally {
      setReplySending(false)
    }
  }

  const replies = ticket?.replies || ticket?.messages || []
  const isClosed = ticket?.status === 'closed'

  return (
    <div>
      {/* Search bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <input
          value={ticketId}
          onChange={e => setTicketId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLookup()}
          placeholder={isEN ? 'Enter Ticket ID (8 chars or full UUID)' : 'Nhập Ticket ID (8 ký tự hoặc UUID đầy đủ)'}
          style={{ ...darkInput, flex: 1 }}
        />
        <button
          onClick={handleLookup}
          disabled={loading || !ticketId.trim()}
          style={{
            flexShrink: 0,
            padding: '10px 18px',
            background: 'linear-gradient(135deg, #00c7de, #0098aa)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontFamily: 'inherit',
            fontWeight: 700,
            fontSize: 14,
            cursor: loading || !ticketId.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !ticketId.trim() ? 0.6 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? <><InlineSpinner /> Đang tra...</> : '🔍 Tra cứu'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 8,
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.3)',
          color: '#fca5a5', fontSize: 14, marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {/* Ticket detail */}
      {ticket && (
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(0,199,222,0.2)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'rgba(0,0,0,0.3)',
            borderBottom: '1px solid rgba(0,199,222,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
          }}>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Ticket #</span>
              <span style={{ color: '#00c7de', fontWeight: 700, fontFamily: 'monospace', fontSize: 13 }}>
                {(ticket.id || '').slice(0, 8).toUpperCase()}
              </span>
              <span style={{ margin: '0 10px', color: 'rgba(255,255,255,0.3)' }}>—</span>
              <span style={{ color: '#e2e8f0', fontSize: 13 }}>{ticket.issue_type || ticket.type || '—'}</span>
            </div>
            <StatusBadge status={ticket.status || 'open'} />
          </div>

          <div style={{ padding: '20px' }}>
            {/* Description */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Mô tả ban đầu</div>
              <div style={{
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, padding: '12px 16px',
                color: '#e2e8f0', fontSize: 14, lineHeight: 1.7,
              }}>
                {ticket.description || ticket.message || '—'}
              </div>
              {/* Ảnh đính kèm gốc */}
              {ticket.image_urls && ticket.image_urls.length > 0 && (
                <ImageGrid urls={ticket.image_urls.map(u => ({ url: u, thumbnail: u }))} />
              )}
            </div>

            {/* Thread replies */}
            {replies.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
                  Lịch sử phản hồi ({replies.length})
                </div>
                <ReplyThread replies={replies} />
              </div>
            )}

            {/* Closed banner */}
            {isClosed && (
              <div style={{
                padding: '12px 16px', borderRadius: 8,
                background: 'rgba(100,116,139,0.2)',
                border: '1px solid rgba(100,116,139,0.4)',
                color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 12,
              }}>
                Ticket đã đóng — không thể gửi thêm phản hồi
              </div>
            )}

            {/* Reply form */}
            {!isClosed && (
              <div style={{
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(0,199,222,0.15)',
                borderRadius: 8, padding: '16px',
              }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 12, fontWeight: 600 }}>
                  Phản hồi tiếp theo
                </div>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Phản hồi tiếp theo..."
                  style={{ ...darkInput, resize: 'vertical', minHeight: 80, marginBottom: 10 }}
                />

                {/* Upload ảnh */}
                <div style={{ marginBottom: 10 }}>
                  <label style={{ ...darkLabel, marginBottom: 4 }}>Đính kèm ảnh (tùy chọn)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleReplyImageUpload}
                    disabled={replyUploading}
                    style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}
                  />
                  {replyUploading && (
                    <div style={{ fontSize: 12, color: '#00c7de', marginTop: 6 }}>
                      <InlineSpinner /> Đang upload...
                    </div>
                  )}
                  {replyImages.length > 0 && (
                    <ImageGrid
                      urls={replyImages}
                      onRemove={i => setReplyImages(prev => prev.filter((_, idx) => idx !== i))}
                    />
                  )}
                </div>

                {replySuccess && (
                  <div style={{
                    padding: '8px 14px', borderRadius: 6,
                    background: 'rgba(16,185,129,0.15)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    color: '#6ee7b7', fontSize: 13, marginBottom: 10,
                  }}>
                    Đã gửi phản hồi thành công!
                  </div>
                )}

                <button
                  onClick={handleSendReply}
                  disabled={replySending || replyUploading || (!replyText.trim() && replyImages.length === 0)}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #00c7de, #0098aa)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontFamily: 'inherit',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    opacity: replySending || (!replyText.trim() && replyImages.length === 0) ? 0.6 : 1,
                  }}
                >
                  {replySending ? <><InlineSpinner /> Đang gửi...</> : '📤 Gửi phản hồi'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
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
  const [images, setImages] = useState([]) // [{url, thumbnail}]
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null) // null | { ok, ticketId, message }
  const [errors, setErrors] = useState({})
  const [copied, setCopied] = useState(false)

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

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    if (images.length >= 3) { alert('Tối đa 3 ảnh'); return }
    setUploading(true)
    try {
      const slots = Math.min(files.length, 3 - images.length)
      const uploaded = await Promise.all(files.slice(0, slots).map(f => uploadImage(f)))
      setImages(prev => [...prev, ...uploaded].slice(0, 3))
    } catch (err) {
      alert('Upload ảnh thất bại: ' + err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const validate = () => {
    const e = {}
    if (!key.trim()) e.key = 'Bắt buộc'
    else if (keyStatus !== 'valid') e.key = 'Key không tồn tại. Chỉ khách hàng đang dùng mới gửi được ticket.'
    if (!phone.trim()) e.phone = 'Bắt buộc'
    if (!email.trim()) e.email = 'Bắt buộc'
    if (!description.trim()) e.description = 'Bắt buộc'
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
          image_urls: images.map(u => u.url),
        }),
      })
      const data = await res.json()
      if (data.ok) {
        const ticketId = data.ticket_id || data.id || 'N/A'
        setResult({ ok: true, ticketId })
        setKey(''); setKeyStatus(null); setPhone(''); setEmail('')
        setIssueType('Lỗi phần mềm'); setDescription(''); setImages([])
      } else {
        setResult({ ok: false, message: data.error || 'Gửi thất bại. Vui lòng thử lại.' })
      }
    } catch {
      setResult({ ok: false, message: 'Lỗi kết nối. Vui lòng thử lại.' })
    } finally {
      setSubmitting(false)
    }
  }

  const ISSUE_TYPES = ['Lỗi phần mềm', 'Hỏi về tính năng', 'Thanh toán/Key', 'Yêu cầu tính năng mới', 'Khác']

  return (
    <form onSubmit={handleSubmit} noValidate>

      {/* Key kích hoạt */}
      <div style={{ marginBottom: 20 }}>
        <label style={darkLabel}>
          Key kích hoạt <span style={{ color: '#f87171' }}>*</span>
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            value={key}
            onChange={e => { setKey(e.target.value.toUpperCase()); setKeyStatus(null) }}
            onBlur={verifyKey}
            placeholder="GMAP-XXXXXX-XXXXXX-XXXX"
            style={{ ...darkInput, flex: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}
          />
          <button
            type="button"
            onClick={verifyKey}
            disabled={keyLoading || !key.trim()}
            style={{
              flexShrink: 0,
              padding: '10px 16px',
              background: 'rgba(0,199,222,0.2)',
              color: '#00c7de',
              border: '1px solid rgba(0,199,222,0.4)',
              borderRadius: 8,
              fontFamily: 'inherit',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              opacity: keyLoading || !key.trim() ? 0.5 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {keyLoading ? '...' : 'Xác minh'}
          </button>
        </div>
        {keyStatus === 'valid' && (
          <div style={{ marginTop: 7, fontSize: 13, color: '#6ee7b7', fontWeight: 600 }}>
            ✓ Key hợp lệ
          </div>
        )}
        {keyStatus === 'invalid' && (
          <div style={{ marginTop: 7, fontSize: 13, color: '#f87171' }}>
            Key không tồn tại. Chỉ khách hàng đang dùng mới gửi được ticket.
          </div>
        )}
        {errors.key && keyStatus !== 'invalid' && (
          <div style={{ marginTop: 7, fontSize: 13, color: '#f87171' }}>{errors.key}</div>
        )}
      </div>

      {/* SĐT */}
      <div style={{ marginBottom: 20 }}>
        <label style={darkLabel}>SĐT liên hệ <span style={{ color: '#f87171' }}>*</span></label>
        <input
          type="text"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="VD: 0901234567"
          style={darkInput}
        />
        {errors.phone && <div style={{ marginTop: 7, fontSize: 13, color: '#f87171' }}>{errors.phone}</div>}
      </div>

      {/* Email */}
      <div style={{ marginBottom: 20 }}>
        <label style={darkLabel}>Email liên hệ <span style={{ color: '#f87171' }}>*</span></label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="email@cuaban.com"
          style={darkInput}
        />
        {errors.email && <div style={{ marginTop: 7, fontSize: 13, color: '#f87171' }}>{errors.email}</div>}
      </div>

      {/* Loại vấn đề */}
      <div style={{ marginBottom: 20 }}>
        <label style={darkLabel}>Loại vấn đề</label>
        <select
          value={issueType}
          onChange={e => setIssueType(e.target.value)}
          style={{ ...darkInput, appearance: 'auto', cursor: 'pointer' }}
        >
          {ISSUE_TYPES.map(t => (
            <option key={t} value={t} style={{ background: '#001e3c', color: '#fff' }}>{t}</option>
          ))}
        </select>
      </div>

      {/* Mô tả */}
      <div style={{ marginBottom: 20 }}>
        <label style={darkLabel}>Mô tả chi tiết <span style={{ color: '#f87171' }}>*</span></label>
        <textarea
          rows={4}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Mô tả chi tiết vấn đề: điều gì đã xảy ra, bạn mong đợi gì, các bước tái hiện lỗi..."
          style={{ ...darkInput, resize: 'vertical', minHeight: 100 }}
        />
        {errors.description && <div style={{ marginTop: 7, fontSize: 13, color: '#f87171' }}>{errors.description}</div>}
      </div>

      {/* Upload ảnh */}
      <div style={{ marginBottom: 28 }}>
        <label style={darkLabel}>Upload ảnh đính kèm (tùy chọn, tối đa 3)</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          disabled={uploading || images.length >= 3}
          style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, display: 'block' }}
        />
        {uploading && (
          <div style={{ fontSize: 13, color: '#00c7de', marginTop: 8 }}>
            <InlineSpinner /> Đang upload ảnh...
          </div>
        )}
        {images.length > 0 && (
          <ImageGrid
            urls={images}
            onRemove={i => setImages(prev => prev.filter((_, idx) => idx !== i))}
          />
        )}
        <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          Đính kèm ảnh để chúng tôi chẩn đoán nhanh hơn.
        </div>
      </div>

      {/* Result */}
      {result && !result.ok && (
        <div style={{
          marginBottom: 20, padding: '14px 18px', borderRadius: 10,
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.3)',
          color: '#fca5a5', fontSize: 14, fontWeight: 600,
        }}>
          {result.message}
        </div>
      )}

      {result && result.ok && (
        <div style={{
          marginBottom: 20, padding: '18px 20px', borderRadius: 10,
          background: 'rgba(16,185,129,0.12)',
          border: '1px solid rgba(16,185,129,0.3)',
          color: '#6ee7b7',
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
            Ticket đã gửi thành công!
          </div>
          <div style={{ fontSize: 13, marginBottom: 10, color: 'rgba(255,255,255,0.7)' }}>
            Chúng tôi sẽ phản hồi trong 2-4 giờ.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Mã ticket:</span>
            <span style={{
              fontFamily: 'monospace', fontWeight: 800, fontSize: 15,
              color: '#00c7de', letterSpacing: 1,
            }}>
              {(result.ticketId || '').toString().slice(0, 8).toUpperCase()}
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(result.ticketId || '')
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              style={{
                padding: '4px 12px',
                background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(0,199,222,0.15)',
                border: '1px solid rgba(0,199,222,0.3)',
                borderRadius: 6,
                color: copied ? '#6ee7b7' : '#00c7de',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 600,
              }}
            >
              {copied ? '✓ Đã sao chép' : '⎘ Copy ID'}
            </button>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          width: '100%',
          padding: '14px',
          fontSize: 15,
          fontWeight: 700,
          background: submitting ? 'rgba(0,199,222,0.4)' : 'linear-gradient(135deg, #00c7de, #0098aa)',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          cursor: submitting ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          transition: 'opacity 0.2s',
        }}
      >
        {submitting ? <><InlineSpinner /> Đang gửi...</> : '📤 Gửi yêu cầu'}
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
    { id: 'ticket', label: '📋 Gửi ticket' },
    { id: 'lookup', label: '🔍 Kiểm tra phiếu hỗ trợ' },
    { id: 'chat', label: '💬 Chat với AI' },
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

      {/* Hero */}
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

      {/* Body */}
      <div style={{
        background: 'linear-gradient(180deg, #001428 0%, #001e3c 100%)',
        minHeight: '100vh',
        padding: '48px 16px 80px',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>

          {/* Card */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 16,
            border: '1px solid rgba(0,199,222,0.15)',
            boxShadow: '0 8px 48px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}>
            {/* Tab switcher */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid rgba(0,199,222,0.15)',
              background: 'rgba(0,0,0,0.2)',
            }}>
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    flex: 1,
                    padding: '15px 8px',
                    border: 'none',
                    borderBottom: activeTab === t.id ? '2px solid #00c7de' : '2px solid transparent',
                    background: 'transparent',
                    fontFamily: 'inherit',
                    fontWeight: activeTab === t.id ? 700 : 500,
                    fontSize: 13,
                    color: activeTab === t.id ? '#00c7de' : 'rgba(255,255,255,0.5)',
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
              {activeTab === 'lookup' && <TicketLookupTab isEN={isEN} />}
              {activeTab === 'chat' && <ChatTab isEN={isEN} />}
            </div>
          </div>

        </div>
      </div>

      <Footer />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.3); }
        select option { background: #001e3c; color: #fff; }
      `}</style>
    </>
  )
}
