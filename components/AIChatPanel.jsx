import { useState, useRef, useEffect } from 'react'
import { Bot } from 'lucide-react'

const AI_SUGGESTIONS = [
  'Chiến dịch nào đang hoạt động tốt nhất?',
  'Nhóm nào nên tắt để tiết kiệm ngân sách?',
  'Làm sao tăng ROAS hiệu quả?',
  'Phân tích các cảnh báo đang có',
  'Tài khoản nào có hiệu quả tốt nhất?',
  'Chi tiêu hôm nay tổng bao nhiêu?',
]

function renderMd(text) {
  if (!text) return null

  function inlineFmt(str) {
    const parts = str.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g)
    return parts.map((p, i) => {
      if (p.startsWith('**') && p.endsWith('**') && p.length > 4)
        return <strong key={i}>{p.slice(2, -2)}</strong>
      if (p.startsWith('*') && p.endsWith('*') && p.length > 2 && !p.startsWith('**'))
        return <em key={i}>{p.slice(1, -1)}</em>
      if (p.startsWith('`') && p.endsWith('`') && p.length > 2)
        return <code key={i} className="md-code">{p.slice(1, -1)}</code>
      return p
    })
  }

  const lines = text.split('\n')
  const nodes = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) { i++; continue }

    if (/^-{3,}$/.test(trimmed)) {
      nodes.push(<hr key={i} className="md-hr" />)
      i++; continue
    }

    const hm = trimmed.match(/^(#{1,3})\s+(.+)/)
    if (hm) {
      nodes.push(<div key={i} className={`md-h${hm[1].length}`}>{inlineFmt(hm[2])}</div>)
      i++; continue
    }

    if (trimmed.startsWith('> ')) {
      nodes.push(<div key={i} className="md-quote">{inlineFmt(trimmed.slice(2))}</div>)
      i++; continue
    }

    if (trimmed.startsWith('|')) {
      const tbl = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tbl.push(lines[i].trim())
        i++
      }
      const rows = tbl
        .filter(r => !/^\|[\s\-:|]+\|$/.test(r))
        .map(r => r.split('|').slice(1, -1).map(c => c.trim()))
      if (rows.length) {
        nodes.push(
          <div key={`t${i}`} className="md-table-wrap">
            <table className="md-table">
              <thead><tr>{rows[0].map((c, ci) => <th key={ci}>{inlineFmt(c)}</th>)}</tr></thead>
              <tbody>{rows.slice(1).map((row, ri) => (
                <tr key={ri}>{row.map((c, ci) => <td key={ci}>{inlineFmt(c)}</td>)}</tr>
              ))}</tbody>
            </table>
          </div>
        )
      }
      continue
    }

    if (/^[-*]\s/.test(trimmed)) {
      const items = []
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''))
        i++
      }
      nodes.push(<ul key={`ul${i}`} className="md-list">{items.map((it, idx) => <li key={idx}>{inlineFmt(it)}</li>)}</ul>)
      continue
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const items = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''))
        i++
      }
      nodes.push(<ol key={`ol${i}`} className="md-list md-ol">{items.map((it, idx) => <li key={idx}>{inlineFmt(it)}</li>)}</ol>)
      continue
    }

    nodes.push(<p key={i} className="md-p">{inlineFmt(trimmed)}</p>)
    i++
  }

  return nodes
}

export default function AIChatPanel({ items, onClose }) {
  const [msgs, setMsgs] = useState([{
    role: 'assistant',
    content: `Xin chào! Tôi là trợ lý AI Meta Ads. Đang phân tích **${items.length} chiến dịch/nhóm** trong view hiện tại. Tôi có thể giúp bạn phân tích hiệu quả, tìm vấn đề và đề xuất tối ưu.`
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  async function send(text) {
    if (!text?.trim() || loading) return
    const userMsg = text.trim()
    setMsgs(m => [...m, { role: 'user', content: userMsg }])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/ai/campaign-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, campaigns: items.slice(0, 40), history: msgs.slice(-8) })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Server error')
      setMsgs(m => [...m, { role: 'assistant', content: data.reply || 'Không có phản hồi.' }])
    } catch (e) {
      setMsgs(m => [...m, { role: 'assistant', content: `⚠️ ${e.message || 'Lỗi kết nối. Vui lòng thử lại.'}` }])
    }
    setLoading(false)
  }

  return (
    <div className="ai-panel">
      <div className="ai-panel-hd">
        <div className="ai-panel-title">
          <Bot size={20} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Trợ lý AI Meta Ads</div>
            <div style={{ fontSize: 10, color: 'var(--mut)' }}>{items.length} chiến dịch đang xem · ~$0.004/tin nhắn</div>
          </div>
        </div>
        <button className="ai-panel-close" onClick={onClose} title="Đóng">×</button>
      </div>

      <div className="ai-msgs">
        {msgs.map((m, i) => (
          <div key={i} className={`ai-msg ai-msg-${m.role}`}>
            {m.role === 'assistant' && <span className="ai-avatar"><Bot size={16} /></span>}
            <div className="ai-bubble">{renderMd(m.content)}</div>
          </div>
        ))}
        {loading && (
          <div className="ai-msg ai-msg-assistant">
            <span className="ai-avatar"><Bot size={16} /></span>
            <div className="ai-bubble ai-typing"><span /><span /><span /></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {msgs.length <= 1 && (
        <div className="ai-suggests">
          {AI_SUGGESTIONS.map(s => (
            <button key={s} className="ai-suggest-btn" onClick={() => send(s)}>{s}</button>
          ))}
        </div>
      )}

      <div className="ai-input-row">
        <input
          className="ai-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send(input))}
          placeholder="Hỏi về chiến dịch quảng cáo..."
          disabled={loading}
          autoFocus
        />
        <button className="ai-send-btn" onClick={() => send(input)} disabled={loading || !input.trim()}>
          {loading ? '…' : '↑'}
        </button>
      </div>
    </div>
  )
}
