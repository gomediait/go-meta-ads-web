import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '../../components/AdminLayout'
import { Badge, Spinner, ErrorBox, CopyButton, EmptyState } from '../../components/AdminUI'
import { adminLocalFetch, apiPost, AI_CATEGORIES } from '../../lib/adminUtils'



function AiKnowledgeTab() {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [saving, setSaving]   = useState(false)

  // Form thêm/sửa
  const [showForm, setShowForm]     = useState(false)
  const [editId, setEditId]         = useState(null)
  const [formTitle, setFormTitle]   = useState('')
  const [formContent, setFormContent] = useState('')
  const [formCategory, setFormCategory] = useState('general')

  // File upload state
  const [fileLoading, setFileLoading] = useState(false)
  const fileRef = useRef(null)

  async function fetchList() {
    setLoading(true)
    try {
      const res = await apiPost('/api/ticket', { action: 'ai_list' })
      setList(res?.data || [])
    } catch(e) { setError(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { fetchList() }, [])

  function openNew() {
    setEditId(null); setFormTitle(''); setFormContent(''); setFormCategory('general'); setShowForm(true)
  }
  function openEdit(item) {
    setEditId(item.id); setFormTitle(item.title); setFormContent(item.content); setFormCategory(item.category || 'general'); setShowForm(true)
  }

  async function handleSave() {
    if (!formTitle.trim() || !formContent.trim()) { alert('Cần có tiêu đề và nội dung'); return }
    setSaving(true)
    try {
      await apiPost('/api/ticket', { action: 'ai_save', id: editId||undefined, title: formTitle.trim(), content: formContent.trim(), category: formCategory })
      setShowForm(false); fetchList()
    } catch(e) { alert('Lỗi: ' + e.message) } finally { setSaving(false) }
  }

  async function toggleActive(item) {
    await apiPost('/api/ticket', { action: 'ai_toggle', id: item.id, is_active: !item.is_active })
    setList(l => l.map(x => x.id === item.id ? { ...x, is_active: !item.is_active } : x))
  }

  async function deleteItem(id) {
    if (!confirm('Xóa tài liệu này?')) return
    await apiPost('/api/ticket', { action: 'ai_delete', id })
    setList(l => l.filter(x => x.id !== id))
  }

  // Đọc file và điền vào form content
  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileLoading(true)
    try {
      const name = file.name.toLowerCase()
      let text = ''

      if (name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.csv')) {
        // Đọc trực tiếp
        text = await file.text()
      } else if (name.endsWith('.pdf')) {
        // Đọc PDF cơ bản: tìm các chuỗi text trong binary
        const buf = await file.arrayBuffer()
        const bytes = new Uint8Array(buf)
        const raw = new TextDecoder('latin1').decode(bytes)
        // Extract text between BT/ET markers
        const matches = raw.match(/BT[\s\S]*?ET/g) || []
        const pieces = []
        for (const block of matches) {
          const strs = block.match(/\(((?:[^()\\]|\\.)*)\)\s*Tj/g) || []
          strs.forEach(s => {
            const m = s.match(/\(((?:[^()\\]|\\.)*)\)/)
            if (m) pieces.push(m[1].replace(/\\n/g,' ').replace(/\\\(/g,'(').replace(/\\\)/g,')').trim())
          })
        }
        text = pieces.filter(Boolean).join('\n') || '[PDF phức tạp — vui lòng copy và paste nội dung thủ công]'
      } else if (name.endsWith('.docx')) {
        // DOCX cần thư viện bên ngoài — yêu cầu copy paste thủ công
        text = '[File DOCX — vui lòng mở file bằng Word, copy toàn bộ nội dung và paste vào đây]'
      } else {
        text = await file.text().catch(() => '[Không đọc được file này, vui lòng paste nội dung thủ công]')
      }

      setFormContent(text.slice(0, 50000)) // max 50K chars
      if (!formTitle) setFormTitle(file.name.replace(/\.[^.]+$/, ''))
      setShowForm(true)
    } catch(e) {
      alert('Lỗi đọc file: ' + e.message)
    } finally {
      setFileLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const totalChars = list.reduce((s, x) => s + (x.content?.length || 0), 0)
  const activeCount = list.filter(x => x.is_active).length

  const inp = { width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: 'var(--txt)', background: '#fff', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--txt)' }}>🧠 AI Knowledge Base</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--mut)' }}>
            {activeCount}/{list.length} tài liệu đang bật · {(totalChars/1000).toFixed(1)}K ký tự · AI đọc khi trả lời khách hàng
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <label style={{ padding: '9px 16px', border: '1.5px dashed #00c7de', borderRadius: 8, background: '#f0fdfe', color: '#0c2a72', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            {fileLoading ? '⏳ Đang đọc...' : '📂 Upload file'}
            <input ref={fileRef} type="file" accept=".txt,.md,.pdf,.docx,.csv" onChange={handleFile} style={{ display: 'none' }} disabled={fileLoading} />
          </label>
          <button onClick={openNew} style={{ padding: '9px 18px', border: 'none', borderRadius: 8, background: '#0c2a72', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            ＋ Thêm thủ công
          </button>
        </div>
      </div>

      {/* Hướng dẫn */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 16px', marginBottom: 20, fontSize: 13, color: '#78350f' }}>
        💡 <b>Mẹo:</b> Thêm FAQ, hướng dẫn sử dụng, chính sách... AI sẽ đọc tất cả tài liệu <b>đang bật</b> để trả lời khách hàng chính xác hơn. Upload .txt hoặc paste nội dung trực tiếp. PDF/DOCX phức tạp nên copy paste thủ công.
      </div>

      <ErrorBox msg={error} />

      {/* Form thêm/sửa */}
      {showForm && (
        <div style={{ background: '#fff', border: '1.5px solid #00c7de', borderRadius: 12, padding: '20px 24px', marginBottom: 20, boxShadow: '0 4px 16px rgba(0,199,222,0.12)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#0c2a72' }}>
            {editId ? '✏️ Chỉnh sửa tài liệu' : '➕ Thêm tài liệu mới'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '10px 16px', marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--mut)', marginBottom: 5 }}>Tiêu đề *</label>
              <input style={inp} value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="VD: Hướng dẫn đặt CPA mục tiêu" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--mut)', marginBottom: 5 }}>Danh mục</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={formCategory} onChange={e => setFormCategory(e.target.value)}>
                {AI_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--mut)', marginBottom: 5 }}>
              Nội dung * <span style={{ color: 'var(--mut)', fontWeight: 400 }}>({formContent.length.toLocaleString()} ký tự)</span>
            </label>
            <textarea
              style={{ ...inp, minHeight: 200, resize: 'vertical', lineHeight: 1.6 }}
              value={formContent}
              onChange={e => setFormContent(e.target.value)}
              placeholder="Nhập hoặc paste nội dung tài liệu..."
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '8px 18px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8faff', color: 'var(--mut)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Hủy</button>
            <button onClick={handleSave} disabled={saving} style={{ padding: '8px 20px', border: 'none', borderRadius: 8, background: saving ? '#94a3b8' : '#10b981', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {saving ? '⏳ Đang lưu...' : '💾 Lưu tài liệu'}
            </button>
          </div>
        </div>
      )}

      {/* Danh sách */}
      {loading ? <Spinner /> : (
        <div>
          {list.length === 0 ? (
            <EmptyState icon="🧠" text="Chưa có tài liệu nào. Thêm để AI học!" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {list.map(item => (
                <div key={item.id} style={{ background: '#fff', border: `1.5px solid ${item.is_active ? '#e2e8f0' : '#f1f5f9'}`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 14, opacity: item.is_active ? 1 : 0.55 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--txt)' }}>{item.title}</span>
                      <span style={{ fontSize: 11, background: '#f1f5f9', color: 'var(--mut)', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                        {AI_CATEGORIES.find(c => c.value === item.category)?.label || item.category}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--mut)' }}>{(item.content?.length||0).toLocaleString()} ký tự</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--mut)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {item.content}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => toggleActive(item)} title={item.is_active ? 'Tắt' : 'Bật'} style={{ padding: '5px 10px', border: `1px solid ${item.is_active ? '#10b981' : '#e2e8f0'}`, borderRadius: 6, background: item.is_active ? '#f0fdf4' : '#f8faff', color: item.is_active ? '#10b981' : '#94a3b8', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {item.is_active ? '✅ Bật' : '⭕ Tắt'}
                    </button>
                    <button onClick={() => openEdit(item)} style={{ padding: '5px 10px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', color: '#0c2a72', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✏️</button>
                    <button onClick={() => deleteItem(item.id)} style={{ padding: '5px 10px', border: '1px solid #fecaca', borderRadius: 6, background: '#fef2f2', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── SMTP TAB ─────────────────────────────────────────────────────────────────

export default function Page() {
  return (
    <AdminLayout title="AI Knowledge">
      <AiKnowledgeTab />
    </AdminLayout>
  )
}
