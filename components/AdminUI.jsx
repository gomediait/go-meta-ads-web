import { useState } from 'react'

export function Badge({ status }) {
  const map = {
    pending:     { bg: 'var(--ylw)', color: '#fff', label: 'Chờ xử lý' },
    confirmed:   { bg: 'var(--grn)', color: '#fff', label: 'Đã xác nhận' },
    cancelled:   { bg: 'var(--red)', color: '#fff', label: 'Đã hủy' },
    open:        { bg: 'var(--navy)', color: '#fff', label: 'Mở' },
    in_progress: { bg: 'var(--ylw)', color: '#fff', label: 'Đang xử lý' },
    resolved:    { bg: 'var(--grn)', color: '#fff', label: 'Đã giải quyết' },
    active:      { bg: 'var(--grn)', color: '#fff', label: 'Hoạt động' },
    inactive:    { bg: 'var(--mut)', color: '#fff', label: 'Không hoạt động' },
    expired:     { bg: 'var(--red)', color: '#fff', label: 'Hết hạn' },
    disabled:    { bg: 'var(--mut)', color: '#fff', label: 'Vô hiệu' },
  }
  const s = map[status] || { bg: 'var(--s3)', color: 'var(--mut)', label: status || 'N/A' }
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: 11,
      fontWeight: 700,
      background: s.bg,
      color: s.color,
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  )
}

export function Spinner() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--mut)' }}>
      <div style={{
        display: 'inline-block',
        width: 24,
        height: 24,
        border: '3px solid var(--s3)',
        borderTop: '3px solid var(--blue)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <p style={{ marginTop: 10, fontSize: 13 }}>Đang tải dữ liệu...</p>
      <style jsx>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export function ErrorBox({ msg }) {
  if (!msg) return null
  return (
    <div style={{
      background: 'rgba(239,68,68,0.1)',
      border: '1px solid rgba(239,68,68,0.2)',
      borderRadius: 8,
      padding: '10px 14px',
      color: '#b91c1c',
      fontSize: 13,
      marginBottom: 16,
    }}>
      ⚠️ {msg}
    </div>
  )
}

export function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--mut)' }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>{icon || '📭'}</div>
      <p style={{ fontSize: 14 }}>{text || 'Không có dữ liệu'}</p>
    </div>
  )
}

export function CopyButton({ value }) {
  const [copied, setCopied] = useState(false)
  function doCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button
      onClick={doCopy}
      title="Sao chép"
      style={{
        marginLeft: 4,
        background: copied ? 'var(--grn)' : 'transparent',
        border: '1px solid ' + (copied ? 'var(--grn)' : 'var(--blue)'),
        borderRadius: 4,
        padding: '2px 6px',
        fontSize: 11,
        color: copied ? '#fff' : 'var(--blue)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.2s'
      }}
    >
      {copied ? '✓' : 'Copy'}
    </button>
  )
}
