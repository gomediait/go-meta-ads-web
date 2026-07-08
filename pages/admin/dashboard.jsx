import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

async function adminLocalFetch(endpoint, body) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return res.json()
}

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
  const [webStats, setWebStats] = useState(null)
  const [webRecent, setWebRecent] = useState([])
  const [ticketStats, setTicketStats] = useState(null)
  const [ticketRecent, setTicketRecent] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [uRes, tRes] = await Promise.all([
        adminLocalFetch('/api/admin/web-users', { action: 'list' }),
        adminLocalFetch('/api/admin/tickets', { action: 'list_threads' })
      ])
      
      if (uRes.ok) {
        const users = uRes.data || []
        setWebStats({
          total: users.length,
          active: users.filter(u => u.status === 'active').length,
          agency: users.filter(u => u.plan === 'agency').length
        })
        setWebRecent(users.slice(0, 5))
      }
      
      if (tRes.ok) {
        const threads = tRes.threads || []
        setTicketStats({
          total: threads.length,
          open: threads.filter(t => t.status === 'open').length,
          resolved: threads.filter(t => t.status === 'resolved').length
        })
        setTicketRecent(threads.slice(0, 5))
      }
    } catch(e) {
      console.error(e)
    }
    setLoading(false)
  }

  return (
    <AdminLayout title="Tổng quan">
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--txt)' }}>Tổng quan hệ thống</h2>
        <button className="btn btn-primary" onClick={loadData}>↻ Làm mới</button>
      </div>

      {loading ? <Spinner /> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
            {/* Thống kê Users */}
            <div className="card">
              <h3 style={{ fontSize: 14, color: 'var(--mut)', textTransform: 'uppercase', marginBottom: 16 }}>Người dùng Web</h3>
              <div style={{ display: 'flex', gap: 24 }}>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--txt)' }}>{webStats?.total || 0}</div>
                  <div style={{ fontSize: 12, color: 'var(--mut)' }}>Tổng cộng</div>
                </div>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--grn)' }}>{webStats?.active || 0}</div>
                  <div style={{ fontSize: 12, color: 'var(--mut)' }}>Hoạt động</div>
                </div>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--blue)' }}>{webStats?.agency || 0}</div>
                  <div style={{ fontSize: 12, color: 'var(--mut)' }}>Gói Agency</div>
                </div>
              </div>
            </div>

            {/* Thống kê Tickets */}
            <div className="card">
              <h3 style={{ fontSize: 14, color: 'var(--mut)', textTransform: 'uppercase', marginBottom: 16 }}>Support Tickets</h3>
              <div style={{ display: 'flex', gap: 24 }}>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--txt)' }}>{ticketStats?.total || 0}</div>
                  <div style={{ fontSize: 12, color: 'var(--mut)' }}>Tổng cộng</div>
                </div>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--red)' }}>{ticketStats?.open || 0}</div>
                  <div style={{ fontSize: 12, color: 'var(--mut)' }}>Chưa xử lý</div>
                </div>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--grn)' }}>{ticketStats?.resolved || 0}</div>
                  <div style={{ fontSize: 12, color: 'var(--mut)' }}>Đã giải quyết</div>
                </div>
              </div>
            </div>
          </div>

          {/* Dữ liệu gần đây */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            <div className="card">
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
            </div>

            <div className="card">
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
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
