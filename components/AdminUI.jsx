import { useState } from 'react'
import { ArchiveX, AlertTriangle, Check, Copy } from 'lucide-react'

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
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      <AlertTriangle size={18} />
      {msg}
    </div>
  )
}

export function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--mut)' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
        {typeof icon === 'string' ? <div style={{ fontSize: 40 }}>{icon}</div> : (icon || <ArchiveX size={48} style={{ color: 'var(--bd)' }} />)}
      </div>
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
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  )
}

export function AdminPageHeader({ title, icon: Icon, description, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--txt)', display: 'flex', alignItems: 'center', gap: 10 }}>
          {Icon && <Icon size={24} style={{ color: 'var(--blue)' }} />}
          {title}
        </h2>
        {description && <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--mut)' }}>{description}</p>}
      </div>
      {children && <div style={{ display: 'flex', gap: 8 }}>{children}</div>}
    </div>
  )
}

export function AdminCard({ children, style, noPadding = false, ...props }) {
  return (
    <div className="admin-card" style={{ padding: noPadding ? 0 : 24, ...style }} {...props}>
      {children}
    </div>
  )
}

export function AdminTable({ columns, children, style }) {
  return (
    <div className="admin-table-wrapper" style={style}>
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  )
}

export function AdminButton({ children, variant = 'primary', icon: Icon, ...props }) {
  const baseClass = 'btn'
  const variantClass = variant === 'primary' ? 'btn-primary' : variant === 'danger' ? 'btn-danger' : variant === 'outline' ? 'btn-outline' : 'btn-secondary'
  
  return (
    <button className={`${baseClass} ${variantClass}`} {...props}>
      {Icon && <Icon size={16} />}
      {children}
    </button>
  )
}

export function AdminInput(props) {
  return <input className="form-input" {...props} />
}

export function AdminSelect({ children, ...props }) {
  return <select className="form-input" style={{ cursor: 'pointer', ...props.style }} {...props}>{children}</select>
}

