import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/DashboardLayout'

const STATUS_MAP = {
  open:        { label: 'Chờ xử lý',    bg: '#dbeafe', color: '#1e40af' },
  in_progress: { label: 'Đang xử lý',   bg: '#fef3c7', color: '#92400e' },
  resolved:    { label: 'Đã giải quyết', bg: '#d1fae5', color: '#065f46' },
  closed:      { label: 'Đã đóng',       bg: '#f1f5f9', color: '#475569' },
}

const PRIORITY_MAP = {
  low:    { label: 'Thấp',     color: '#94a3b8' },
  normal: { label: 'Bình thường', color: '#475569' },
  high:   { label: 'Cao',      color: '#f59e0b' },
  urgent: { label: 'Khẩn cấp', color: '#ef4444' },
}

export default function Support() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ subject: '', message: '', priority: 'normal' })
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(async () => {
    const r = await fetch('/api/user/tickets')
    const d = await r.json()
    if (d.ok) setTickets(d.tickets)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate() {
    if (!form.subject.trim() || !form.message.trim()) return showToast('Vui lòng điền đầy đủ', 'error')
    setSubmitting(true)
    try {
      const r = await fetch('/api/user/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...form })
      })
      const d = await r.json()
      if (!d.ok) return showToast(d.error || 'Lỗi', 'error')
      showToast('Đã gửi ticket thành công')
      setShowForm(false)
      setForm({ subject: '', message: '', priority: 'normal' })
      load()
    } catch { showToast('Lỗi kết nối', 'error') }
    finally { setSubmitting(false) }
  }

  async function handleReply() {
    if (!replyText.trim()) return
    setSubmitting(true)
    try {
      const r = await fetch('/api/user/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reply', ticket_id: selected.id, message: replyText })
      })
      const d = await r.json()
      if (!d.ok) return showToast(d.error || 'Lỗi', 'error')
      setReplyText('')
      load()
      // Refresh selected ticket
      const updated = await fetch('/api/user/tickets').then(r => r.json())
      const t = (updated.tickets || []).find(x => x.id === selected.id)
      if (t) setSelected(t)
    } catch { showToast('Lỗi kết nối', 'error') }
    finally { setSubmitting(false) }
  }

  const inp = {
    width: '100%', background: 'var(--s2)', border: '1.5px solid var(--bd)', borderRadius: 9,
    padding: '10px 13px', fontSize: 14, color: 'var(--txt)', outline: 'none', fontFamily: 'inherit'
  }

  return (
    <DashboardLayout title="Hỗ trợ">
      <div className="sp-page">
        {toast && (
          <div className={`toast ${toast.type === 'error' ? 'err' : ''}`}>{toast.msg}</div>
        )}

        <div className="page-header">
          <div>
            <h1>🎫 Hỗ trợ kỹ thuật</h1>
            <p>Gửi yêu cầu hỗ trợ — chúng tôi phản hồi trong vòng 24 giờ</p>
          </div>
          <button className="btn-new" onClick={() => { setShowForm(true); setSelected(null) }}>
            + Tạo ticket mới
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="form-card">
            <div className="fc-title">Tạo ticket hỗ trợ mới</div>
            <div className="field">
              <label>Tiêu đề</label>
              <input style={inp} placeholder="Mô tả ngắn vấn đề..." value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
            </div>
            <div className="field">
              <label>Nội dung chi tiết</label>
              <textarea style={{ ...inp, minHeight: 120, resize: 'vertical' }} placeholder="Mô tả chi tiết vấn đề anh/chị đang gặp phải..." value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} />
            </div>
            <div className="field">
              <label>Mức độ ưu tiên</label>
              <select style={inp} value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                <option value="low">Thấp — không cần gấp</option>
                <option value="normal">Bình thường</option>
                <option value="high">Cao — cần xử lý sớm</option>
                <option value="urgent">Khẩn cấp — ảnh hưởng nghiêm trọng</option>
              </select>
            </div>
            <div className="fc-btns">
              <button className="btn-cancel" onClick={() => setShowForm(false)}>Huỷ</button>
              <button className="btn-submit" onClick={handleCreate} disabled={submitting}>
                {submitting ? 'Đang gửi...' : '📨 Gửi ticket'}
              </button>
            </div>
          </div>
        )}

        {/* Detail view */}
        {selected && (
          <div className="detail-card">
            <div className="dc-header">
              <button className="btn-back" onClick={() => setSelected(null)}>← Quay lại</button>
              <div className="dc-status">
                <span className="status-badge" style={{ background: STATUS_MAP[selected.status]?.bg, color: STATUS_MAP[selected.status]?.color }}>
                  {STATUS_MAP[selected.status]?.label || selected.status}
                </span>
              </div>
            </div>
            <div className="dc-subject">{selected.subject}</div>
            <div className="dc-meta">
              Gửi lúc {new Date(selected.created_at).toLocaleString('vi-VN')}
              {' · '}
              Ưu tiên: <span style={{ color: PRIORITY_MAP[selected.priority]?.color }}>{PRIORITY_MAP[selected.priority]?.label}</span>
            </div>

            <div className="thread">
              {/* Original message */}
              <div className="msg user">
                <div className="msg-from">Bạn</div>
                <div className="msg-body">{selected.message}</div>
                <div className="msg-time">{new Date(selected.created_at).toLocaleString('vi-VN')}</div>
              </div>

              {/* Replies */}
              {(selected.replies || []).map((reply, i) => (
                <div key={i} className={`msg ${reply.from}`}>
                  <div className="msg-from">{reply.from === 'admin' ? '🛡 Hỗ trợ Go Meta Ads' : 'Bạn'}</div>
                  <div className="msg-body">{reply.message}</div>
                  <div className="msg-time">{new Date(reply.created_at).toLocaleString('vi-VN')}</div>
                </div>
              ))}
            </div>

            {selected.status !== 'closed' && selected.status !== 'resolved' && (
              <div className="reply-box">
                <textarea
                  style={{ ...inp, minHeight: 80 }}
                  placeholder="Nhập phản hồi thêm..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                />
                <button className="btn-submit" onClick={handleReply} disabled={submitting || !replyText.trim()} style={{ marginTop: 10 }}>
                  {submitting ? 'Đang gửi...' : 'Gửi phản hồi'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Ticket list */}
        {!showForm && !selected && (
          <>
            {loading ? (
              <div className="loading">Đang tải...</div>
            ) : tickets.length === 0 ? (
              <div className="empty">
                <div style={{ fontSize: 40 }}>🎫</div>
                <div style={{ fontWeight: 700 }}>Chưa có ticket nào</div>
                <div style={{ fontSize: 13, color: 'var(--mut)' }}>Tạo ticket khi bạn cần hỗ trợ kỹ thuật</div>
                <button className="btn-new" onClick={() => setShowForm(true)}>+ Tạo ticket đầu tiên</button>
              </div>
            ) : (
              <div className="ticket-list">
                {tickets.map(t => (
                  <div key={t.id} className="ticket-row" onClick={() => { setSelected(t); setShowForm(false) }}>
                    <div className="tr-left">
                      <div className="tr-subject">{t.subject}</div>
                      <div className="tr-meta">
                        {new Date(t.created_at).toLocaleDateString('vi-VN')}
                        {t.replies?.length > 0 && ` · ${t.replies.length} phản hồi`}
                        {t.replies?.some(r => r.from === 'admin') && <span className="has-reply"> · ✅ Đã có phản hồi từ admin</span>}
                      </div>
                    </div>
                    <div className="tr-right">
                      <span className="status-badge" style={{ background: STATUS_MAP[t.status]?.bg, color: STATUS_MAP[t.status]?.color }}>
                        {STATUS_MAP[t.status]?.label || t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .sp-page { padding: 24px; max-width: 860px; position: relative; }
        .toast { position: fixed; top: 20px; right: 20px; z-index: 9999; background: var(--grn); color: #fff; border-radius: 10px; padding: 12px 20px; font-size: 13px; font-weight: 600; box-shadow: 0 4px 20px rgba(0,0,0,.25); }
        .toast.err { background: var(--red); }
        .page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
        h1 { font-size: 18px; font-weight: 700; color: var(--txt); margin-bottom: 4px; }
        p  { font-size: 13px; color: var(--mut); }
        .btn-new { background: var(--primary); color: #fff; border: none; border-radius: 9px; padding: 9px 18px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .form-card { background: var(--s1); border: 1px solid var(--primary); border-radius: 14px; padding: 20px; margin-bottom: 20px; }
        .fc-title { font-size: 14px; font-weight: 700; color: var(--txt); margin-bottom: 16px; }
        .field { margin-bottom: 14px; }
        .field label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: var(--mut); margin-bottom: 6px; }
        .fc-btns { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }
        .btn-cancel { background: transparent; border: 1px solid var(--bd); color: var(--mut); border-radius: 9px; padding: 9px 18px; font-size: 13px; cursor: pointer; font-family: inherit; }
        .btn-submit { background: var(--primary); color: #fff; border: none; border-radius: 9px; padding: 9px 20px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .btn-submit:disabled { opacity: .5; cursor: not-allowed; }
        .ticket-list { display: flex; flex-direction: column; gap: 8px; }
        .ticket-row { background: var(--s1); border: 1px solid var(--bd); border-radius: 12px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; cursor: pointer; transition: border-color .15s; }
        .ticket-row:hover { border-color: var(--primary); }
        .tr-subject { font-size: 14px; font-weight: 600; color: var(--txt); margin-bottom: 4px; }
        .tr-meta { font-size: 12px; color: var(--mut); }
        .has-reply { color: var(--grn); }
        .status-badge { border-radius: 999px; padding: 3px 10px; font-size: 11px; font-weight: 700; white-space: nowrap; }
        .detail-card { background: var(--s1); border: 1px solid var(--bd); border-radius: 14px; padding: 20px; margin-bottom: 20px; }
        .dc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .btn-back { background: none; border: 1px solid var(--bd); color: var(--mut); border-radius: 8px; padding: 7px 14px; font-size: 13px; cursor: pointer; font-family: inherit; }
        .dc-subject { font-size: 16px; font-weight: 700; color: var(--txt); margin-bottom: 6px; }
        .dc-meta { font-size: 12px; color: var(--mut); margin-bottom: 20px; }
        .thread { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
        .msg { border-radius: 12px; padding: 12px 16px; }
        .msg.user  { background: var(--s2); border: 1px solid var(--bd); }
        .msg.admin { background: rgba(99,102,241,.07); border: 1px solid rgba(99,102,241,.2); }
        .msg-from { font-size: 11px; font-weight: 700; color: var(--mut); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
        .msg.admin .msg-from { color: #818cf8; }
        .msg-body { font-size: 14px; color: var(--txt); line-height: 1.6; white-space: pre-wrap; }
        .msg-time { font-size: 11px; color: var(--mut); margin-top: 6px; }
        .reply-box { border-top: 1px solid var(--bd); padding-top: 16px; }
        .loading, .empty { text-align: center; padding: 48px; color: var(--mut); font-size: 13px; display: flex; flex-direction: column; align-items: center; gap: 10px; background: var(--s1); border: 1px dashed var(--bd); border-radius: 14px; }
      `}</style>
    </DashboardLayout>
  )
}
