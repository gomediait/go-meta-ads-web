import { useState, useEffect, useRef, useCallback } from 'react'
import DashboardLayout from '../../components/DashboardLayout'

const API_AI = 'https://go-meta-ads-backend.vercel.app/api/ai-chat'

const STATUS_MAP = {
  open:        { label: 'Chờ xử lý',     bg: 'rgba(59,130,246,.15)',  color: '#60a5fa' },
  in_progress: { label: 'Đang xử lý',    bg: 'rgba(251,191,36,.15)',  color: '#f59e0b' },
  resolved:    { label: 'Đã giải quyết', bg: 'rgba(16,185,129,.15)',  color: '#10b981' },
  closed:      { label: 'Đã đóng',       bg: 'rgba(100,116,139,.15)', color: '#94a3b8' },
}

const PRIORITY_MAP = {
  low:    { label: 'Thấp',       color: '#94a3b8' },
  normal: { label: 'Bình thường', color: 'var(--txt)' },
  high:   { label: 'Cao',        color: '#f59e0b' },
  urgent: { label: 'Khẩn cấp',  color: '#ef4444' },
}

const ISSUE_TYPES = ['Lỗi phần mềm', 'Hỏi về tính năng', 'Thanh toán / Gói dịch vụ', 'Yêu cầu tính năng mới', 'Khác']

const inpStyle = (extra = {}) => ({
  width: '100%', background: 'var(--s2)', border: '1.5px solid var(--bd)', borderRadius: 9,
  padding: '10px 13px', fontSize: 14, color: 'var(--txt)', outline: 'none', fontFamily: 'inherit',
  ...extra,
})

const FieldLabel = ({ children }) => (
  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--mut)', marginBottom: 6 }}>
    {children}
  </label>
)

/* ─── TAB 1: GỬI TICKET ───────────────────────────────────────────────────── */
function SubmitTab({ onCreated }) {
  const [form, setForm] = useState({ subject: '', message: '', priority: 'normal', issue_type: 'Lỗi phần mềm' })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleSubmit() {
    if (!form.subject.trim()) return setResult({ ok: false, error: 'Vui lòng nhập tiêu đề' })
    if (!form.message.trim()) return setResult({ ok: false, error: 'Vui lòng nhập nội dung mô tả' })
    setSubmitting(true)
    setResult(null)
    try {
      const r = await fetch('/api/user/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...form }),
      })
      const d = await r.json()
      if (d.ok) {
        setResult({ ok: true, ticket: d.ticket })
        setForm({ subject: '', message: '', priority: 'normal', issue_type: 'Lỗi phần mềm' })
        onCreated?.()
      } else {
        setResult({ ok: false, error: d.error || 'Gửi thất bại' })
      }
    } catch { setResult({ ok: false, error: 'Lỗi kết nối' }) }
    finally { setSubmitting(false) }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <FieldLabel>Tiêu đề *</FieldLabel>
        <input style={inpStyle()} placeholder="Mô tả ngắn vấn đề bạn gặp phải..." value={form.subject} onChange={set('subject')} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <FieldLabel>Loại vấn đề</FieldLabel>
        <select style={inpStyle({ appearance: 'auto', cursor: 'pointer' })} value={form.issue_type} onChange={set('issue_type')}>
          {ISSUE_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 16 }}>
        <FieldLabel>Mức độ ưu tiên</FieldLabel>
        <select style={inpStyle({ appearance: 'auto', cursor: 'pointer' })} value={form.priority} onChange={set('priority')}>
          <option value="low">Thấp — không cần gấp</option>
          <option value="normal">Bình thường</option>
          <option value="high">Cao — cần xử lý sớm</option>
          <option value="urgent">Khẩn cấp — ảnh hưởng nghiêm trọng</option>
        </select>
      </div>
      <div style={{ marginBottom: 20 }}>
        <FieldLabel>Mô tả chi tiết *</FieldLabel>
        <textarea
          style={inpStyle({ minHeight: 130, resize: 'vertical' })}
          placeholder="Mô tả chi tiết vấn đề: điều gì đã xảy ra, các bước tái hiện lỗi, kết quả mong đợi..."
          value={form.message}
          onChange={set('message')}
        />
      </div>

      {result && !result.ok && (
        <div style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 9, padding: '12px 16px', color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>
          {result.error}
        </div>
      )}
      {result?.ok && (
        <div style={{ background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 9, padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: 'var(--grn)', marginBottom: 6 }}>✅ Ticket đã gửi thành công!</div>
          <div style={{ fontSize: 13, color: 'var(--txt)' }}>
            Mã ticket: <span style={{ fontFamily: 'monospace', fontWeight: 800, letterSpacing: 1 }}>{(result.ticket?.id || '').slice(0, 8).toUpperCase()}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--mut)', marginTop: 4 }}>Chúng tôi sẽ phản hồi trong 2-4 giờ. Xem lại ở tab "Phiếu hỗ trợ".</div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{ width: '100%', padding: 14, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? .6 : 1, fontFamily: 'inherit' }}
      >
        {submitting ? 'Đang gửi...' : '📤 Gửi yêu cầu hỗ trợ'}
      </button>
    </div>
  )
}

/* ─── TAB 2: PHIẾU HỖ TRỢ ────────────────────────────────────────────────── */
function LookupTab({ refresh }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/user/tickets')
      const d = await r.json()
      if (d.ok) setTickets(d.tickets)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load, refresh])

  async function handleReply() {
    if (!replyText.trim()) return
    setSending(true)
    try {
      const r = await fetch('/api/user/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reply', ticket_id: selected.id, message: replyText }),
      })
      const d = await r.json()
      if (!d.ok) return showToast(d.error || 'Lỗi', 'error')
      setReplyText('')
      showToast('Đã gửi phản hồi')
      const updated = await fetch('/api/user/tickets').then(r => r.json())
      setTickets(updated.tickets || [])
      const t = (updated.tickets || []).find(x => x.id === selected.id)
      if (t) setSelected(t)
    } catch { showToast('Lỗi kết nối', 'error') }
    finally { setSending(false) }
  }

  // ── Detail view ──
  if (selected) {
    const canReply = selected.status !== 'closed' && selected.status !== 'resolved'
    return (
      <div>
        {toast && (
          <div style={{ marginBottom: 12, padding: '10px 14px', background: toast.type === 'error' ? 'rgba(239,68,68,.15)' : 'rgba(16,185,129,.15)', border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,.3)' : 'rgba(16,185,129,.3)'}`, borderRadius: 8, color: toast.type === 'error' ? 'var(--red)' : 'var(--grn)', fontSize: 13 }}>
            {toast.msg}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={() => setSelected(null)} style={{ background: 'none', border: '1px solid var(--bd)', color: 'var(--mut)', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            ← Quay lại
          </button>
          <span style={{ background: STATUS_MAP[selected.status]?.bg, color: STATUS_MAP[selected.status]?.color, borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
            {STATUS_MAP[selected.status]?.label || selected.status}
          </span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>{selected.subject}</div>
        <div style={{ fontSize: 12, color: 'var(--mut)', marginBottom: 20 }}>
          Gửi lúc {new Date(selected.created_at).toLocaleString('vi-VN')}
          {' · '}Ưu tiên: <span style={{ color: PRIORITY_MAP[selected.priority]?.color, fontWeight: 600 }}>{PRIORITY_MAP[selected.priority]?.label}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <div style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>Bạn</div>
            <div style={{ fontSize: 14, color: 'var(--txt)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{selected.message}</div>
            <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 6 }}>{new Date(selected.created_at).toLocaleString('vi-VN')}</div>
          </div>

          {(selected.replies || []).map((reply, i) => (
            <div key={i} style={{
              background: reply.from === 'admin' ? 'rgba(99,102,241,.07)' : 'var(--s2)',
              border: `1px solid ${reply.from === 'admin' ? 'rgba(99,102,241,.2)' : 'var(--bd)'}`,
              borderRadius: 12, padding: '12px 16px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6, color: reply.from === 'admin' ? '#818cf8' : 'var(--mut)' }}>
                {reply.from === 'admin' ? '🛡 Hỗ trợ Go Meta Ads' : 'Bạn'}
              </div>
              <div style={{ fontSize: 14, color: 'var(--txt)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{reply.message}</div>
              <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 6 }}>{new Date(reply.created_at).toLocaleString('vi-VN')}</div>
            </div>
          ))}
        </div>

        {!canReply && (
          <div style={{ padding: '12px 16px', borderRadius: 9, background: 'var(--s2)', border: '1px solid var(--bd)', color: 'var(--mut)', fontSize: 13, textAlign: 'center' }}>
            Ticket {selected.status === 'closed' ? 'đã đóng' : 'đã giải quyết'} — không thể gửi thêm phản hồi
          </div>
        )}

        {canReply && (
          <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 16 }}>
            <FieldLabel>Phản hồi thêm</FieldLabel>
            <textarea
              style={inpStyle({ minHeight: 80, resize: 'vertical' })}
              placeholder="Nhập phản hồi thêm..."
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
            />
            <button
              onClick={handleReply}
              disabled={sending || !replyText.trim()}
              style={{ marginTop: 10, padding: '9px 20px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: sending || !replyText.trim() ? .5 : 1, fontFamily: 'inherit' }}
            >
              {sending ? 'Đang gửi...' : 'Gửi phản hồi'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── List view ──
  if (loading) return <div style={{ textAlign: 'center', padding: 48, color: 'var(--mut)', fontSize: 14 }}>Đang tải...</div>

  if (tickets.length === 0) return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--mut)', background: 'var(--s2)', borderRadius: 12, border: '1px dashed var(--bd)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🎫</div>
      <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--txt)' }}>Chưa có ticket nào</div>
      <div style={{ fontSize: 13 }}>Gửi ticket ở tab "Gửi ticket" khi bạn cần hỗ trợ kỹ thuật</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {tickets.map(t => (
        <div
          key={t.id}
          onClick={() => setSelected(t)}
          style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer', transition: 'border-color .15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--bd)'}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</div>
            <div style={{ fontSize: 12, color: 'var(--mut)' }}>
              {new Date(t.created_at).toLocaleDateString('vi-VN')}
              {t.replies?.length > 0 && ` · ${t.replies.length} phản hồi`}
              {t.replies?.some(r => r.from === 'admin') && <span style={{ color: 'var(--grn)' }}> · ✅ Có phản hồi</span>}
            </div>
          </div>
          <span style={{ background: STATUS_MAP[t.status]?.bg, color: STATUS_MAP[t.status]?.color, borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {STATUS_MAP[t.status]?.label || t.status}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ─── TAB 3: CHAT AI ──────────────────────────────────────────────────────── */
function ChatTab() {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Xin chào! Tôi là Go Meta AI. Bạn cần hỗ trợ gì về Go Meta Ads Pro?' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatRef = useRef(null)

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages, loading])

  async function send() {
    const msg = input.trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setLoading(true)
    try {
      const res = await fetch(API_AI, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'bot', text: data.reply || data.message || 'Không có phản hồi từ AI.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'AI đang bận. Vui lòng thử lại hoặc gửi ticket để được hỗ trợ trực tiếp.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        ref={chatRef}
        style={{ height: 420, overflowY: 'auto', background: 'var(--s2)', borderRadius: '10px 10px 0 0', padding: '16px', scrollBehavior: 'smooth' }}
      >
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'bot' ? 'flex-start' : 'flex-end', marginBottom: 12 }}>
            {m.role === 'bot' && (
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #0c2a72, #1a3a8f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, marginRight: 8, flexShrink: 0, alignSelf: 'flex-end' }}>🤖</div>
            )}
            <div style={{
              maxWidth: '76%', padding: '10px 14px', fontSize: 14, lineHeight: 1.7,
              borderRadius: m.role === 'bot' ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
              background: m.role === 'bot' ? 'var(--s1)' : 'var(--primary)',
              color: m.role === 'bot' ? 'var(--txt)' : '#fff',
              border: m.role === 'bot' ? '1px solid var(--bd)' : 'none',
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #0c2a72, #1a3a8f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, marginRight: 8 }}>🤖</div>
            <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', padding: '12px 16px', borderRadius: '4px 14px 14px 14px', display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0, 1, 2].map(j => (
                <span key={j} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--mut)', display: 'inline-block', animation: `chatbounce 1.2s ease-in-out ${j * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, background: 'var(--s1)', borderRadius: '0 0 10px 10px', padding: '10px 12px', borderTop: '1px solid var(--bd)' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Nhập câu hỏi của bạn..."
          disabled={loading}
          style={{ flex: 1, background: 'var(--s2)', border: '1.5px solid var(--bd)', borderRadius: 8, color: 'var(--txt)', padding: '9px 13px', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{ flexShrink: 0, padding: '9px 18px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: loading || !input.trim() ? .5 : 1 }}
        >
          Gửi
        </button>
      </div>
      <div style={{ fontSize: 12, color: 'var(--mut)', textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
        AI có thể trả lời chưa chính xác. Với vấn đề khẩn cấp, vui lòng gửi ticket để được hỗ trợ trực tiếp.
      </div>

      <style jsx>{`
        @keyframes chatbounce {
          0%, 80%, 100% { transform: translateY(0); opacity: .4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

/* ─── MAIN PAGE ───────────────────────────────────────────────────────────── */
export default function Support() {
  const [tab, setTab] = useState('submit')
  const [refreshSignal, setRefreshSignal] = useState(0)

  const TABS = [
    { id: 'submit', label: '📋 Gửi ticket' },
    { id: 'lookup', label: '🔍 Phiếu hỗ trợ' },
    { id: 'chat',   label: '💬 Chat AI' },
  ]

  function handleCreated() {
    setRefreshSignal(s => s + 1)
    setTimeout(() => setTab('lookup'), 1600)
  }

  return (
    <DashboardLayout title="Hỗ trợ kỹ thuật">
      <div style={{ padding: 24, maxWidth: 760 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>🎫 Hỗ trợ kỹ thuật</h1>
        <p style={{ fontSize: 13, color: 'var(--mut)', marginBottom: 24 }}>Gửi yêu cầu hỗ trợ — chúng tôi phản hồi trong vòng 2-4 giờ</p>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1.5px solid var(--bd)', marginBottom: 24 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '10px 20px', border: 'none', fontFamily: 'inherit', background: 'transparent',
                borderBottom: tab === t.id ? '2.5px solid var(--primary)' : '2.5px solid transparent',
                fontWeight: tab === t.id ? 700 : 500, fontSize: 13,
                color: tab === t.id ? 'var(--primary)' : 'var(--mut)',
                cursor: 'pointer', transition: 'all .15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'submit' && <SubmitTab onCreated={handleCreated} />}
        {tab === 'lookup' && <LookupTab refresh={refreshSignal} />}
        {tab === 'chat'   && <ChatTab />}
      </div>
    </DashboardLayout>
  )
}
