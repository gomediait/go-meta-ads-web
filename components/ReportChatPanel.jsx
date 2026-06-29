import { useState, useRef, useEffect } from 'react'
import { Bot } from 'lucide-react'

const SUGGESTIONS = [
  'Campaign nào hiệu quả nhất?',
  'Campaign nào đang lãng phí ngân sách?',
  'Phân tích xu hướng chi phí',
  'Đề xuất tối ưu ngân sách',
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
        return <code key={i} style={{ background: 'rgba(59,130,246,.15)', padding: '1px 5px', borderRadius: 4, fontSize: '0.9em' }}>{p.slice(1, -1)}</code>
      return p
    })
  }
  const lines = text.split('\n')
  const nodes = []
  let i = 0
  while (i < lines.length) {
    const trimmed = lines[i].trim()
    if (!trimmed) { i++; continue }
    if (/^-{3,}$/.test(trimmed)) { nodes.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid rgba(148,163,184,.2)', margin: '6px 0' }} />); i++; continue }
    const hm = trimmed.match(/^(#{1,3})\s+(.+)/)
    if (hm) { nodes.push(<div key={i} style={{ fontWeight: 700, fontSize: hm[1].length === 1 ? 14 : 12.5, margin: '6px 0 3px' }}>{inlineFmt(hm[2])}</div>); i++; continue }
    if (/^[-*]\s/.test(trimmed)) {
      const items = []
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^[-*]\s+/, '')); i++ }
      nodes.push(<ul key={`ul${i}`} style={{ margin: '3px 0', paddingLeft: 16 }}>{items.map((it, idx) => <li key={idx} style={{ marginBottom: 1, fontSize: 12.5 }}>{inlineFmt(it)}</li>)}</ul>)
      continue
    }
    if (/^\d+\.\s/.test(trimmed)) {
      const items = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^\d+\.\s+/, '')); i++ }
      nodes.push(<ol key={`ol${i}`} style={{ margin: '3px 0', paddingLeft: 16 }}>{items.map((it, idx) => <li key={idx} style={{ marginBottom: 1, fontSize: 12.5 }}>{inlineFmt(it)}</li>)}</ol>)
      continue
    }
    nodes.push(<p key={i} style={{ margin: '3px 0', lineHeight: 1.55, fontSize: 12.5 }}>{inlineFmt(trimmed)}</p>)
    i++
  }
  return nodes
}

export default function ReportChatPanel({ reportData, onClose }) {
  const [msgs, setMsgs] = useState([{
    role: 'assistant',
    content: `Xin chào! Tôi sẵn sàng phân tích báo cáo của bạn. Đang xem **${reportData?.campaigns?.length || 0} chiến dịch**, **${reportData?.daily?.length || 0} ngày** data. Hỏi bất kỳ điều gì!`
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
      const res = await fetch('/api/ai/report-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, reportData, history: msgs.slice(-8) })
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
    <div className="rcp-panel">
      <div className="rcp-hd">
        <div className="rcp-title">
          <Bot size={18} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>AI Report Analyst</div>
            <div style={{ fontSize: 10, color: 'var(--mut)' }}>{reportData?.campaigns?.length || 0} chiến dịch · ~$0.004/tin nhắn</div>
          </div>
        </div>
        <button className="rcp-close" onClick={onClose}>×</button>
      </div>

      <div className="rcp-msgs">
        {msgs.map((m, i) => (
          <div key={i} className={`rcp-msg rcp-msg-${m.role}`}>
            {m.role === 'assistant' && <span className="rcp-avatar"><Bot size={16} /></span>}
            <div className="rcp-bubble">{renderMd(m.content)}</div>
          </div>
        ))}
        {loading && (
          <div className="rcp-msg rcp-msg-assistant">
            <span className="rcp-avatar"><Bot size={16} /></span>
            <div className="rcp-bubble rcp-typing"><span /><span /><span /></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {msgs.length <= 1 && (
        <div className="rcp-suggests">
          {SUGGESTIONS.map(s => (
            <button key={s} className="rcp-sug" onClick={() => send(s)}>{s}</button>
          ))}
        </div>
      )}

      <div className="rcp-input-row">
        <input
          className="rcp-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send(input))}
          placeholder="Hỏi về báo cáo quảng cáo..."
          disabled={loading}
          autoFocus
        />
        <button className="rcp-send" onClick={() => send(input)} disabled={loading || !input.trim()}>
          {loading ? '…' : '↑'}
        </button>
      </div>

      <style jsx>{`
        .rcp-panel {
          position: fixed; bottom: 90px; right: 28px; z-index: 35;
          width: 380px;
          height: calc(100vh - 130px); max-height: 580px; min-height: 340px;
          display: flex; flex-direction: column; overflow: hidden;
          background: var(--s1); border: 1px solid rgba(59,130,246,.25);
          border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,.3);
          animation: rcpSlideUp .2s ease;
        }
        @media (max-width: 768px) {
          .rcp-panel { width: min(380px, calc(100vw - 40px)); right: 12px; bottom: 76px; }
        }
        @keyframes rcpSlideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }

        .rcp-hd {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 14px; border-bottom: 1px solid var(--bd);
          background: rgba(59,130,246,.08);
          border-radius: 16px 16px 0 0; flex-shrink: 0;
        }
        .rcp-title { display: flex; align-items: center; gap: 10px; }
        .rcp-close {
          background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.15);
          border-radius: 6px; font-size: 16px; color: var(--mut);
          cursor: pointer; line-height: 1; padding: 3px 8px; transition: all .15s;
        }
        .rcp-close:hover { background: rgba(239,68,68,.15); color: var(--red); border-color: var(--red); }

        .rcp-msgs {
          flex: 1; overflow-y: auto; padding: 12px;
          display: flex; flex-direction: column; gap: 10px; min-height: 0;
        }
        .rcp-msg { display: flex; gap: 8px; align-items: flex-start; }
        .rcp-msg-user { flex-direction: row-reverse; }
        .rcp-avatar { font-size: 18px; flex-shrink: 0; margin-top: 2px; }
        .rcp-bubble {
          padding: 9px 12px; border-radius: 12px; font-size: 12.5px; line-height: 1.6;
          max-width: 84%; word-break: break-word;
        }
        .rcp-msg-assistant .rcp-bubble { background: var(--s2); color: var(--txt); border-radius: 4px 12px 12px 12px; }
        .rcp-msg-user .rcp-bubble { background: var(--blue); color: #fff; border-radius: 12px 4px 12px 12px; }

        .rcp-typing { display: flex; align-items: center; gap: 4px; padding: 12px 16px !important; }
        .rcp-typing span { width: 7px; height: 7px; border-radius: 50%; background: var(--mut); animation: rcpPulse 1.4s cubic-bezier(.16,1,.3,1) infinite; }
        .rcp-typing span:nth-child(2) { animation-delay: .15s; }
        .rcp-typing span:nth-child(3) { animation-delay: .3s; }
        @keyframes rcpPulse { 0%,100%{opacity:.25;transform:scale(.85)} 40%{opacity:1;transform:scale(1)} }

        .rcp-suggests {
          padding: 8px 12px; display: flex; flex-wrap: nowrap;
          overflow-x: auto; gap: 6px; border-top: 1px solid var(--bd); flex-shrink: 0;
          scrollbar-width: thin; scrollbar-color: var(--bd) transparent;
        }
        .rcp-suggests::-webkit-scrollbar { height: 4px; }
        .rcp-suggests::-webkit-scrollbar-thumb { background: var(--bd); border-radius: 2px; }
        .rcp-sug {
          padding: 6px 11px; background: rgba(59,130,246,.08); border: 1px solid rgba(59,130,246,.2);
          border-radius: 20px; font-size: 11px; color: var(--txt);
          cursor: pointer; font-family: inherit; white-space: nowrap; flex-shrink: 0; transition: background .15s;
        }
        .rcp-sug:hover { background: rgba(59,130,246,.18); }

        .rcp-input-row { display: flex; gap: 7px; padding: 10px 12px; border-top: 1px solid var(--bd); flex-shrink: 0; }
        .rcp-input {
          flex: 1; padding: 8px 12px; border: 1px solid var(--bd);
          border-radius: 10px; background: var(--s2); color: var(--txt);
          font-size: 12.5px; font-family: inherit; outline: none;
        }
        .rcp-input:focus { border-color: var(--blue); }
        .rcp-input::placeholder { color: var(--mut); }
        .rcp-input:disabled { opacity: .6; }
        .rcp-send {
          padding: 8px 14px; background: var(--blue);
          border: none; border-radius: 10px; color: #fff;
          font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; transition: opacity .15s;
        }
        .rcp-send:hover:not(:disabled) { opacity: .88; }
        .rcp-send:disabled { opacity: .45; cursor: default; }
      `}</style>
    </div>
  )
}
