import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '../../components/AdminLayout'
import { Badge, Spinner, ErrorBox, CopyButton, EmptyState } from '../../components/AdminUI'
import { adminLocalFetch, apiPost } from '../../lib/adminUtils'

async function webAdminPost(action, body = {}) {
  return await adminLocalFetch('/api/admin/affiliates', { action, ...body })
}

function WebAffiliatesTab() {
  const [tab, setTab] = useState('conversions')
  const [affiliates, setAffiliates] = useState([])
  const [conversions, setConversions] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [acting, setActing] = useState(null)
  const [msg, setMsg] = useState('')

  const STATUS_LABEL = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', rejected: 'Từ chối' }
  const STATUS_BG = { pending: '#fef3c7', confirmed: '#d1fae5', rejected: '#fee2e2' }
  const STATUS_COLOR = { pending: '#92400e', confirmed: '#065f46', rejected: '#7f1d1d' }

  async function loadAffiliates() {
    setLoading(true)
    const d = await webAdminPost('list')
    setAffiliates(d.affiliates || [])
    setLoading(false)
  }

  async function loadConversions() {
    setLoading(true)
    const d = await webAdminPost('list_conversions', { status: statusFilter })
    setConversions(d.conversions || [])
    setLoading(false)
  }

  useEffect(() => {
    if (tab === 'affiliates') loadAffiliates()
    else loadConversions()
  }, [tab, statusFilter])

  async function handleConfirm(id) {
    setActing(id)
    const d = await webAdminPost('confirm_commission', { conversion_id: id })
    setMsg(d.ok ? '✅ Đã xác nhận hoa hồng' : '❌ ' + d.error)
    loadConversions()
    setActing(null)
    setTimeout(() => setMsg(''), 3000)
  }

  async function handleReject(id) {
    if (!confirm('Từ chối hoa hồng này?')) return
    setActing(id)
    const d = await webAdminPost('reject_commission', { conversion_id: id })
    setMsg(d.ok ? '✅ Đã từ chối' : '❌ ' + d.error)
    loadConversions()
    setActing(null)
    setTimeout(() => setMsg(''), 3000)
  }

  const th = { padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#fff', textAlign: 'left', whiteSpace: 'nowrap' }
  const td = { padding: '10px 12px', fontSize: 12, color: 'var(--txt)', borderBottom: '1px solid var(--bd)' }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--txt)' }}>🤝 Affiliates (SaaS)</h2>
      </div>

      {msg && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', color: '#15803d', fontSize: 13, marginBottom: 16 }}>{msg}</div>}

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['conversions', '💰 Hoa hồng'], ['affiliates', '👤 Danh sách Affiliates']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
            background: tab === key ? '#0c2a72' : '#e2e8f0',
            color: tab === key ? '#fff' : '#64748b',
          }}>{label}</button>
        ))}
      </div>

      {tab === 'conversions' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {[['all', 'Tất cả'], ['pending', 'Chờ xác nhận'], ['confirmed', 'Đã xác nhận'], ['rejected', 'Từ chối']].map(([v, l]) => (
              <button key={v} onClick={() => setStatusFilter(v)} style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer',
                fontWeight: 600, fontSize: 12, fontFamily: 'inherit',
                background: statusFilter === v ? '#0c2a72' : '#fff',
                color: statusFilter === v ? '#fff' : '#64748b',
              }}>{l}</button>
            ))}
          </div>

          {loading ? <Spinner /> : (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg,#0c2a72,#1a3a8f)' }}>
                    {['Affiliate', 'Gói', 'Loại', 'Doanh thu', 'Hoa hồng', 'Tỷ lệ', 'Trạng thái', 'Ngày', 'Hành động'].map(h => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {conversions.length === 0 && (
                    <tr><td colSpan={9} style={{ ...td, textAlign: 'center', color: 'var(--mut)', padding: '32px' }}>Không có dữ liệu</td></tr>
                  )}
                  {conversions.map(c => (
                    <tr key={c.id} style={{ background: '#fff' }}>
                      <td style={td}>{c.affiliates?.referral_code || '—'}</td>
                      <td style={td}>{c.plan}</td>
                      <td style={td}>{c.type === 'renewal' ? 'Gia hạn' : 'Mới'}</td>
                      <td style={td}>{(c.amount || 0).toLocaleString('vi-VN')}đ</td>
                      <td style={{ ...td, fontWeight: 700, color: '#10b981' }}>{(c.commission || 0).toLocaleString('vi-VN')}đ</td>
                      <td style={td}>{((c.rate || 0) * 100).toFixed(0)}%</td>
                      <td style={td}>
                        <span style={{ background: STATUS_BG[c.status], color: STATUS_COLOR[c.status], borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                          {STATUS_LABEL[c.status] || c.status}
                        </span>
                      </td>
                      <td style={td}>{new Date(c.created_at).toLocaleDateString('vi-VN')}</td>
                      <td style={td}>
                        {c.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => handleConfirm(c.id)} disabled={acting === c.id}
                              style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                              ✓ Xác nhận
                            </button>
                            <button onClick={() => handleReject(c.id)} disabled={acting === c.id}
                              style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                              ✗ Từ chối
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'affiliates' && (
        loading ? <Spinner /> : (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg,#0c2a72,#1a3a8f)' }}>
                  {['Email', 'Gói', 'Ref Code', 'Ngân hàng', 'Số TK', 'Tên TK', 'Chờ xác nhận', 'Đã nhận', 'Trạng thái'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {affiliates.length === 0 && (
                  <tr><td colSpan={9} style={{ ...td, textAlign: 'center', color: 'var(--mut)', padding: '32px' }}>Chưa có affiliate nào</td></tr>
                )}
                {affiliates.map(a => (
                  <tr key={a.id}>
                    <td style={td}>{a.users?.email || '—'}</td>
                    <td style={td}>{a.users?.plan || '—'}</td>
                    <td style={{ ...td, fontWeight: 700, color: '#0c2a72', fontFamily: 'monospace' }}>{a.referral_code}</td>
                    <td style={td}>{a.bank_name || '—'}</td>
                    <td style={td}>{a.bank_account || '—'}</td>
                    <td style={td}>{a.bank_owner || '—'}</td>
                    <td style={{ ...td, color: '#f59e0b', fontWeight: 700 }}>{(a.pending_earned || 0).toLocaleString('vi-VN')}đ</td>
                    <td style={{ ...td, color: '#10b981', fontWeight: 700 }}>{(a.total_earned || 0).toLocaleString('vi-VN')}đ</td>
                    <td style={td}><Badge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}

// ─── AFFILIATE TAB (cũ) ───────────────────────────────────────────────────────

export default function Page() {
  return (
    <AdminLayout title="Affiliates">
      <WebAffiliatesTab />
    </AdminLayout>
  )
}
