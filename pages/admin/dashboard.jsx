import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { AdminPageHeader, AdminButton, AdminCard } from '../../components/AdminUI'
import { LayoutDashboard, RefreshCw } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

import { apiPost } from '../../lib/adminUtils'

function Badge({ status }) {
  const map = {
    pending:     { bg: 'var(--ylw)', color: '#fff', label: 'Chờ xử lý' },
    confirmed:   { bg: 'var(--grn)', color: '#fff', label: 'Đã xác nhận' },
    cancelled:   { bg: 'var(--red)', color: '#fff', label: 'Đã hủy' },
    active:      { bg: 'var(--grn)', color: '#fff', label: 'Hoạt động' },
    inactive:    { bg: 'var(--mut)', color: '#fff', label: 'Không hoạt động' },
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

function Spinner() {
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

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [webRecent, setWebRecent] = useState([])
  const [ticketRecent, setTicketRecent] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await apiPost('/api/admin/dashboard-stats', {})
      if (res.ok) {
        setStats(res.stats)
        setWebRecent(res.recent.users)
        setTicketRecent(res.recent.tickets)
      }
    } catch(e) {
      console.error(e)
    }
    setLoading(false)
  }

  return (
    <AdminLayout title="Tổng quan">
      <AdminPageHeader title="Tổng quan hệ thống" icon={LayoutDashboard}>
        <AdminButton onClick={loadData} icon={RefreshCw}>Làm mới</AdminButton>
      </AdminPageHeader>

      {loading ? <Spinner /> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
            {/* Thống kê Users */}
            <AdminCard noPadding style={{ padding: '16px', minWidth: 200 }}>
              <h3 style={{ fontSize: 12, color: 'var(--mut)', textTransform: 'uppercase', marginBottom: 12 }}>Người dùng</h3>
              <div style={{ display: 'flex', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--txt)' }}>{stats?.users?.total || 0}</div>
                  <div style={{ fontSize: 11, color: 'var(--mut)' }}>Tổng cộng</div>
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--grn)' }}>{stats?.users?.active || 0}</div>
                  <div style={{ fontSize: 11, color: 'var(--mut)' }}>Hoạt động</div>
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--blue)' }}>{stats?.users?.agency || 0}</div>
                  <div style={{ fontSize: 11, color: 'var(--mut)' }}>Agency</div>
                </div>
              </div>
            </AdminCard>

            {/* Thống kê Tickets */}
            <AdminCard noPadding style={{ padding: '16px', minWidth: 180 }}>
              <h3 style={{ fontSize: 12, color: 'var(--mut)', textTransform: 'uppercase', marginBottom: 12 }}>Hỗ trợ</h3>
              <div style={{ display: 'flex', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--txt)' }}>{stats?.tickets?.total || 0}</div>
                  <div style={{ fontSize: 11, color: 'var(--mut)' }}>Tổng</div>
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--red)' }}>{stats?.tickets?.open || 0}</div>
                  <div style={{ fontSize: 11, color: 'var(--mut)' }}>Chờ xử lý</div>
                </div>
              </div>
            </AdminCard>
            
            {/* Thống kê Affiliates */}
            <AdminCard noPadding style={{ padding: '16px', minWidth: 180 }}>
              <h3 style={{ fontSize: 12, color: 'var(--mut)', textTransform: 'uppercase', marginBottom: 12 }}>Affiliates</h3>
              <div style={{ display: 'flex', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--txt)' }}>{stats?.affiliates?.total || 0}</div>
                  <div style={{ fontSize: 11, color: 'var(--mut)' }}>Đối tác</div>
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--orange)', marginTop: 4 }}>{(stats?.affiliates?.pendingCommission || 0).toLocaleString()}đ</div>
                  <div style={{ fontSize: 11, color: 'var(--mut)' }}>Chờ duyệt</div>
                </div>
              </div>
            </AdminCard>

            {/* Thống kê Policy */}
            <AdminCard noPadding style={{ padding: '16px', minWidth: 180 }}>
              <h3 style={{ fontSize: 12, color: 'var(--mut)', textTransform: 'uppercase', marginBottom: 12 }}>Check vi phạm</h3>
              <div style={{ display: 'flex', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--txt)' }}>{stats?.policy?.checks || 0}</div>
                  <div style={{ fontSize: 11, color: 'var(--mut)' }}>Lượt quét</div>
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--red)' }}>${(stats?.policy?.estimatedCostUsd || 0).toFixed(3)}</div>
                  <div style={{ fontSize: 11, color: 'var(--mut)' }}>Phí API</div>
                </div>
              </div>
            </AdminCard>

            {/* Thống kê AI Knowledge */}
            <AdminCard noPadding style={{ padding: '16px', minWidth: 180 }}>
              <h3 style={{ fontSize: 12, color: 'var(--mut)', textTransform: 'uppercase', marginBottom: 12 }}>AI Knowledge</h3>
              <div style={{ display: 'flex', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--txt)' }}>{stats?.ai?.activeDocs || 0}</div>
                  <div style={{ fontSize: 11, color: 'var(--mut)' }}>Tài liệu</div>
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--blue)' }}>{((stats?.ai?.totalChars || 0) / 1000).toFixed(1)}K</div>
                  <div style={{ fontSize: 11, color: 'var(--mut)' }}>Ký tự</div>
                </div>
              </div>
            </AdminCard>
          </div>

          {/* Dữ liệu gần đây */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            <AdminCard noPadding style={{ padding: 20 }}>
              <h3 style={{ fontSize: 16, marginBottom: 16, color: 'var(--txt)' }}>Người dùng mới nhất</h3>
              {webRecent.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {webRecent.map((u, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: i < webRecent.length - 1 ? '1px solid var(--bd)' : 'none' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--mut)' }}>{u.email}</div>
                      </div>
                      <Badge status={u.status} />
                    </div>
                  ))}
                </div>
              ) : <p style={{ fontSize: 13, color: 'var(--mut)' }}>Không có dữ liệu</p>}
            </AdminCard>

            <AdminCard noPadding style={{ padding: 20 }}>
              <h3 style={{ fontSize: 16, marginBottom: 16, color: 'var(--txt)' }}>Ticket gần đây</h3>
              {ticketRecent.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {ticketRecent.map((t, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: i < ticketRecent.length - 1 ? '1px solid var(--bd)' : 'none' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{t.subject || 'Không có tiêu đề'}</div>
                        <div style={{ fontSize: 12, color: 'var(--mut)' }}>{t.user_email}</div>
                      </div>
                      <Badge status={t.status} />
                    </div>
                  ))}
                </div>
              ) : <p style={{ fontSize: 13, color: 'var(--mut)' }}>Không có dữ liệu</p>}
            </AdminCard>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
