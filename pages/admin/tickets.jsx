import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '../../components/AdminLayout'
import { Badge, Spinner, ErrorBox, CopyButton, EmptyState, AdminPageHeader, AdminCard, AdminButton, AdminInput } from '../../components/AdminUI'
import { Ticket as TicketIcon, RefreshCw, Trash2, Send, Paperclip } from 'lucide-react'
import { adminLocalFetch, apiPost } from '../../lib/adminUtils'



function WebTicketsTab() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replyImages, setReplyImages] = useState([])
  const [replyUploading, setReplyUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const adminToken = typeof window !== 'undefined' ? atob(localStorage.getItem('gmap_admin_token') || '') : ''
  const showToast = (msg, type = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  async function call(action, extra = {}) {
    const res = await fetch('/api/admin/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
      body: JSON.stringify({ action, ...extra }),
    })
    return res.json()
  }

  async function load() {
    setLoading(true)
    const d = await call('list', { status: filter })
    if (d.ok) setTickets(d.tickets || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  async function handleReplyImageUpload(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setReplyUploading(true)
    try {
      const slots = Math.min(files.length, 3 - replyImages.length)
      const uploaded = await Promise.all(files.slice(0, slots).map(uploadImageWeb))
      setReplyImages(prev => [...prev, ...uploaded].slice(0, 3))
    } catch (err) { showToast('Upload ảnh thất bại: ' + err.message, 'error') }
    finally { setReplyUploading(false); e.target.value = '' }
  }

  async function handleReply() {
    if (!replyText.trim() && replyImages.length === 0) return
    setSaving(true)
    const d = await call('reply', { id: selected.id, message: replyText, image_urls: replyImages.map(u => u.url) })
    if (!d.ok) { showToast(d.error || 'Lỗi', 'error'); setSaving(false); return }
    setReplyText('')
    setReplyImages([])
    showToast('Đã gửi phản hồi + email cho khách')
    const refreshed = await call('get', { id: selected.id })
    if (refreshed.ok) setSelected(refreshed.ticket)
    load()
    setSaving(false)
  }

  async function handleStatus(id, status) {
    await call('update_status', { id, status })
    showToast('Đã cập nhật trạng thái')
    if (selected?.id === id) setSelected(p => ({ ...p, status }))
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Xoá ticket này?')) return
    await call('delete', { id })
    setSelected(null)
    load()
  }

  const ST = {
    open:        { label: 'Chờ xử lý',    bg: '#dbeafe', color: '#1e40af' },
    in_progress: { label: 'Đang xử lý',   bg: '#fef3c7', color: '#92400e' },
    resolved:    { label: 'Đã giải quyết', bg: '#d1fae5', color: '#065f46' },
    closed:      { label: 'Đã đóng',       bg: '#f1f5f9', color: '#475569' },
  }
  const FILTERS = [
    { id: 'all', label: 'Tất cả' },
    { id: 'open', label: 'Chờ xử lý' },
    { id: 'in_progress', label: 'Đang xử lý' },
    { id: 'resolved', label: 'Đã giải quyết' },
    { id: 'closed', label: 'Đã đóng' },
  ]
  const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }
  const inp = { padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', color: 'var(--txt)' }

  return (
    <div>
      {toast && <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.type === 'error' ? 'var(--red)' : 'var(--grn)', color: '#fff', borderRadius: 10, padding: '12px 20px', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,.25)' }}>{toast.msg}</div>}

      <AdminPageHeader title="Support Tickets (Web)" icon={TicketIcon} />

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', borderColor: filter === f.id ? 'var(--blue)' : 'var(--bd)', background: filter === f.id ? 'rgba(59,130,246,0.1)' : 'var(--s1)', color: filter === f.id ? 'var(--blue)' : 'var(--mut)' }}>
            {f.label}
          </button>
        ))}
        <AdminButton variant="secondary" onClick={load} icon={RefreshCw} style={{ marginLeft: 'auto' }}>Làm mới</AdminButton>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '380px 1fr' : '1fr', gap: 20, alignItems: 'start' }}>
        {/* List */}
        <AdminCard noPadding>
          {loading ? <Spinner /> : tickets.length === 0 ? <EmptyState icon={<TicketIcon size={48} color="var(--bd)" />} text="Không có ticket nào" /> : (
            <div>
              {tickets.map((t, i) => (
                <div key={t.id} onClick={() => setSelected(t)} style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: selected?.id === t.id ? '#f0fdfc' : i % 2 ? '#fafbfc' : '#fff', transition: 'background .15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</div>
                    <span style={{ background: ST[t.status]?.bg, color: ST[t.status]?.color, borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{ST[t.status]?.label || t.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--mut)' }}>
                    {t.user_email} · {new Date(t.created_at).toLocaleDateString('vi-VN')}
                    {t.replies?.length > 0 && ` · ${t.replies.length} phản hồi`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminCard>

        {/* Detail */}
        {selected && (
          <AdminCard noPadding>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)', marginBottom: 3 }}>{selected.subject}</div>
                <div style={{ fontSize: 12, color: 'var(--mut)' }}>{selected.user_email} · {new Date(selected.created_at).toLocaleString('vi-VN')}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['open','in_progress','resolved','closed'].map(s => (
                  <button key={s} onClick={() => handleStatus(selected.id, s)}
                    style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${ST[s]?.color}40`, background: selected.status === s ? ST[s]?.bg : 'transparent', color: ST[s]?.color, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {ST[s]?.label}
                  </button>
                ))}
                <AdminButton variant="danger" icon={Trash2} onClick={() => handleDelete(selected.id)} style={{ padding: '4px 10px' }} />
              </div>
            </div>

            <div style={{ padding: '16px 18px', maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Original message */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase', marginBottom: 6 }}>User</div>
                <div style={{ fontSize: 13, color: 'var(--txt)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selected.message}</div>
                {selected.image_urls?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {selected.image_urls.map((url, j) => (
                      <a key={j} href={url} target="_blank" rel="noopener">
                        <img src={url} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0' }} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
              {/* Replies */}
              {(selected.replies || []).map((r, i) => (
                <div key={i} style={{ background: r.from === 'admin' ? 'rgba(0,199,222,0.06)' : '#f8fafc', border: `1px solid ${r.from === 'admin' ? 'rgba(0,199,222,0.2)' : '#e2e8f0'}`, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: r.from === 'admin' ? '#00c7de' : '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
                    {r.from === 'admin' ? '🛡 Admin' : 'User'}
                  </div>
                  {r.message && <div style={{ fontSize: 13, color: 'var(--txt)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{r.message}</div>}
                  {r.image_urls?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {r.image_urls.map((url, j) => (
                        <a key={j} href={url} target="_blank" rel="noopener">
                          <img src={url} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0' }} />
                        </a>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 6 }}>{new Date(r.created_at).toLocaleString('vi-VN')}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: '14px 18px', borderTop: '1px solid #e2e8f0' }}>
              <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Nhập phản hồi cho user (sẽ tự động gửi email cho khách)..." rows={3}
                style={{ ...inp, width: '100%', resize: 'vertical', marginBottom: 10 }} />
              {/* Image upload */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--mut)', marginBottom: 6 }}>Đính kèm ảnh (tùy chọn)</div>
                <input type="file" accept="image/*" multiple disabled={replyUploading || replyImages.length >= 3} onChange={handleReplyImageUpload} style={{ fontSize: 12 }} />
                {replyUploading && <div style={{ fontSize: 12, color: 'var(--blue)', marginTop: 4 }}>Đang upload...</div>}
                {replyImages.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {replyImages.map((img, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img src={img.thumbnail || img.url} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0' }} />
                        <button onClick={() => setReplyImages(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, background: '#ef4444', border: 'none', borderRadius: '50%', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <AdminButton icon={Send} onClick={handleReply} disabled={saving || replyUploading || (!replyText.trim() && replyImages.length === 0)}>
                {saving ? 'Đang gửi...' : 'Gửi + Email khách'}
              </AdminButton>
            </div>
          </AdminCard>
        )}
      </div>
    </div>
  )
}

const MENU = [
  { id: 'overview',        icon: '📊', label: 'Tổng quan' },
  null,
  { id: 'web_users',       icon: '🌐', label: 'Web Users (SaaS)' },
  { id: 'web_tickets',     icon: '🎫', label: 'Support Tickets' },
  { id: 'web_affiliates',  icon: '🤝', label: 'Affiliates (SaaS)' },
  { id: 'policycheck',     icon: '🛡️', label: 'Kiểm tra Vi phạm' },
  { id: 'ai_knowledge',    icon: '🧠', label: 'AI Knowledge' },
  { id: 'pixels',          icon: '📈', label: 'Tracking Pixels' },
  { id: 'smtp',            icon: '📧', label: 'Email / SMTP' },
]


export default function Page() {
  return (
    <AdminLayout title="Support Tickets">
      <WebTicketsTab />
    </AdminLayout>
  )
}
