import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '../../components/AdminLayout'
import { Badge, Spinner, ErrorBox, CopyButton, EmptyState, AdminPageHeader, AdminTable, AdminCard, AdminButton } from '../../components/AdminUI'
import { Handshake, Check, X } from 'lucide-react'
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

  return (
    <div>
      <AdminPageHeader title="Affiliates (SaaS)" icon={Handshake} />

      {msg && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', color: '#15803d', fontSize: 13, marginBottom: 16 }}>{msg}</div>}

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['conversions', 'Hoa hồng'], ['affiliates', 'Danh sách Affiliates']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
            background: tab === key ? 'var(--blue)' : 'var(--s2)',
            color: tab === key ? '#fff' : 'var(--mut)',
          }}>{label}</button>
        ))}
      </div>

      {tab === 'conversions' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {[['all', 'Tất cả'], ['pending', 'Chờ xác nhận'], ['confirmed', 'Đã xác nhận'], ['rejected', 'Từ chối']].map(([v, l]) => (
              <button key={v} onClick={() => setStatusFilter(v)} style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid var(--bd)', cursor: 'pointer',
                fontWeight: 600, fontSize: 12, fontFamily: 'inherit',
                background: statusFilter === v ? 'rgba(59,130,246,0.1)' : 'var(--s1)',
                color: statusFilter === v ? 'var(--blue)' : 'var(--mut)',
              }}>{l}</button>
            ))}
          </div>

          {loading ? <Spinner /> : (
            <AdminCard noPadding>
              <AdminTable columns={['Affiliate', 'Gói', 'Loại', 'Doanh thu', 'Hoa hồng', 'Tỷ lệ', 'Trạng thái', 'Ngày', 'Hành động']}>
                  {conversions.length === 0 && (
                    <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--mut)', padding: '32px' }}>Không có dữ liệu</td></tr>
                  )}
                  {conversions.map(c => (
                    <tr key={c.id}>
                      <td>{c.affiliates?.referral_code || '—'}</td>
                      <td>{c.plan}</td>
                      <td>{c.type === 'renewal' ? 'Gia hạn' : 'Mới'}</td>
                      <td>{(c.amount || 0).toLocaleString('vi-VN')}đ</td>
                      <td style={{ fontWeight: 700, color: 'var(--grn)' }}>{(c.commission || 0).toLocaleString('vi-VN')}đ</td>
                      <td>{((c.rate || 0) * 100).toFixed(0)}%</td>
                      <td>
                        <span style={{ background: STATUS_BG[c.status], color: STATUS_COLOR[c.status], borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                          {STATUS_LABEL[c.status] || c.status}
                        </span>
                      </td>
                      <td>{new Date(c.created_at).toLocaleDateString('vi-VN')}</td>
                      <td>
                        {c.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <AdminButton icon={Check} onClick={() => handleConfirm(c.id)} disabled={acting === c.id} style={{ padding: '4px 10px' }}>
                              Xác nhận
                            </AdminButton>
                            <AdminButton icon={X} variant="danger" onClick={() => handleReject(c.id)} disabled={acting === c.id} style={{ padding: '4px 10px' }}>
                              Từ chối
                            </AdminButton>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
              </AdminTable>
            </AdminCard>
          )}
        </>
      )}

      {tab === 'affiliates' && (
        loading ? <Spinner /> : (
          <AdminCard noPadding>
            <AdminTable columns={['Email', 'Gói', 'Ref Code', 'Ngân hàng', 'Số TK', 'Tên TK', 'Chờ xác nhận', 'Đã nhận', 'Trạng thái']}>
                {affiliates.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--mut)', padding: '32px' }}>Chưa có affiliate nào</td></tr>
                )}
                {affiliates.map(a => (
                  <tr key={a.id}>
                    <td>{a.users?.email || '—'}</td>
                    <td>{a.users?.plan || '—'}</td>
                    <td style={{ fontWeight: 700, color: 'var(--blue)', fontFamily: 'monospace' }}>{a.referral_code}</td>
                    <td>{a.bank_name || '—'}</td>
                    <td>{a.bank_account || '—'}</td>
                    <td>{a.bank_owner || '—'}</td>
                    <td style={{ color: 'var(--ylw)', fontWeight: 700 }}>{(a.pending_earned || 0).toLocaleString('vi-VN')}đ</td>
                    <td style={{ color: 'var(--grn)', fontWeight: 700 }}>{(a.total_earned || 0).toLocaleString('vi-VN')}đ</td>
                    <td><Badge status={a.status} /></td>
                  </tr>
                ))}
            </AdminTable>
          </AdminCard>
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
