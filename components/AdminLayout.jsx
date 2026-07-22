import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import {
  LayoutDashboard,
  Users,
  Ticket,
  Handshake,
  ShieldCheck,
  Brain,
  Mail,
  Sun,
  Moon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MousePointerClick,
  KeyRound
} from 'lucide-react'

const ADMIN_NAV = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
  { href: '/admin/users',     icon: Users,           label: 'Web Users' },
  { href: '/admin/tickets',   icon: Ticket,          label: 'Support Tickets' },
  { href: '/admin/affiliates',icon: Handshake,       label: 'Affiliates' },
  { divider: true },
  { href: '/admin/policy',    icon: ShieldCheck,     label: 'Kiểm tra Vi phạm' },
  { href: '/admin/ai',        icon: Brain,           label: 'AI Knowledge' },
  { href: '/admin/smtp',      icon: Mail,            label: 'Email / SMTP' },
  { href: '/admin/pixels',    icon: MousePointerClick, label: 'Tracking Pixels' },
  { divider: true },
  { href: '/admin/security',  icon: KeyRound,        label: 'Bảo mật' },
]

export default function AdminLayout({ children, title = 'Admin Dashboard' }) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [theme, setTheme] = useState('light')
  const [authChecking, setAuthChecking] = useState(true)

  // Auth check & Theme init
  useEffect(() => {
    // Theme
    const saved = localStorage.getItem('gmap_theme') || 'light'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)

    // Auth
    async function checkAuth() {
      try {
        const res = await fetch('/api/admin/me')
        const data = await res.json()
        if (!data.ok) {
          router.replace('/admin')
          return
        }
        setAuthChecking(false)
      } catch (e) {
        router.replace('/admin')
      }
    }
    checkAuth()
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('gmap_theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  async function handleLogout() {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
    } catch(e) {}
    router.replace('/admin')
  }

  if (authChecking) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f0f4ff' }}>
        <p style={{ color: '#0c2a72', fontWeight: 600 }}>Đang kiểm tra quyền Admin...</p>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>{title} | Go Meta Ads Pro</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="app-shell" data-theme={theme}>
        {/* ── TOP BAR ── */}
        <header className="topbar">
          <div className="topbar-logo">
            <img src="/logo.png" alt="logo" onError={e => e.target.style.display='none'} />
            <div>
              <div className="topbar-name">
                Go Meta Ads Pro
                <span className="version-badge">ADMIN</span>
              </div>
              <div className="topbar-sub">Trung tâm điều khiển</div>
            </div>
          </div>

          <div className="topbar-mid"></div>

          <div className="topbar-right">
            <span className="plan-badge" style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }}>
              Super Admin
            </span>
            <button className="icon-btn" onClick={toggleTheme} title="Giao diện (Sáng/Tối)">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="icon-btn logout-btn" onClick={handleLogout} title="Đăng xuất">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <div className="app-body">
          {/* ── SIDEBAR ── */}
          <nav className={`sidebar${collapsed ? ' collapsed' : ''}`}>
            <div className="sidebar-inner">
              {ADMIN_NAV.map((item, i) => {
                if (item.divider) return <div key={i} className="sidebar-divider" />
                
                const isActive = router.pathname === item.href
                const IconComp = item.icon
                
                return (
                  <Link key={item.href} href={item.href} className={`sidebar-btn${isActive ? ' active' : ''}`}>
                    <span className="sb-icon"><IconComp size={18} /></span>
                    <span className="sb-label">{item.label}</span>
                  </Link>
                )
              })}
            </div>
            <div className="sidebar-footer">
              <button className="sidebar-toggle" onClick={() => setCollapsed(c => !c)}>
                <span className="sb-toggle-arrow">
                  {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </span>
                {!collapsed && <span className="sb-toggle-text">Thu gọn</span>}
              </button>
            </div>
          </nav>

          {/* ── CONTENT ── */}
          <main className="app-content">
            {children}
          </main>
        </div>
      </div>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #f0f4ff; --s1: #fff; --s2: #f1f5f9; --s3: #e2e8f0; --bd: #e2e8f0;
          --txt: #1e293b; --mut: #64748b;
          --primary: #fe5f01; --navy: #0c2a72;
          --grn: #10b981; --red: #ef4444; --ylw: #f59e0b; --blue: #3b82f6;
        }
        [data-theme="dark"] {
          --bg: #0f1117; --s1: #161b27; --s2: #1e2536; --s3: #242d40; --bd: #2a3347;
          --txt: #e8eaf0; --mut: #6b7a99;
          --primary: #fe5f01; --navy: #0c2a72;
          --grn: #00c48c; --red: #ff4560; --ylw: #ffb400; --blue: #3b82f6;
        }

        html, body { height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

        .app-shell {
          display: flex; flex-direction: column; height: 100vh;
          background: var(--bg); color: var(--txt);
          transition: background .2s, color .2s;
        }

        /* TOP BAR */
        .topbar {
          display: flex; align-items: center; gap: 12px;
          height: 52px; padding: 0 16px; flex-shrink: 0;
          background: linear-gradient(135deg, #0c2a72 0%, #1a3a8f 100%);
          box-shadow: 0 2px 8px rgba(12,42,114,.3);
        }
        .topbar-logo { display: flex; align-items: center; gap: 8px; }
        .topbar-logo img { height: 28px; border-radius: 6px; }
        .topbar-name { font-size: 14px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 6px; }
        .topbar-sub  { font-size: 10px; color: rgba(255,255,255,.55); }
        .version-badge {
          font-size: 9px; font-weight: 600; letter-spacing: .3px;
          background: rgba(255,255,255,.15); color: #fff;
          border: 1px solid rgba(255,255,255,.3);
          border-radius: 4px; padding: 1px 5px; line-height: 1.5;
          white-space: nowrap;
        }
        .topbar-mid  { flex: 1; display: flex; align-items: center; gap: 8px; }
        .topbar-right{ display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

        .plan-badge {
          display: inline-flex; align-items: center;
          padding: 3px 10px; border-radius: 20px;
          font-size: 10px; font-weight: 700; letter-spacing: .3px;
        }
        .icon-btn {
          background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2);
          border-radius: 7px; padding: 5px 9px; font-size: 14px; color: #fff;
          cursor: pointer; text-decoration: none; transition: background .15s;
          display: inline-flex; align-items: center; line-height: 1;
        }
        .icon-btn:hover { background: rgba(255,255,255,.22); }
        .logout-btn { font-size: 16px; }

        /* BODY */
        .app-body { display: flex; flex: 1; overflow: hidden; min-height: 0; }

        /* SIDEBAR */
        .sidebar {
          width: 220px; flex-shrink: 0;
          background: linear-gradient(180deg, #0c2a72 0%, #1a3a8f 100%);
          display: flex; flex-direction: column;
          transition: width .25s cubic-bezier(.4,0,.2,1);
          overflow: hidden;
        }
        .sidebar.collapsed { width: 56px; }
        .sidebar-inner { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 6px 0; }
        .sidebar-btn {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 10px 14px;
          font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,.65);
          background: transparent; border: none; border-left: 3px solid transparent;
          cursor: pointer; text-decoration: none;
          transition: all .15s; white-space: nowrap; text-align: left;
        }
        .sidebar-btn:hover  { background: rgba(255,255,255,.09); color: #fff; }
        .sidebar-btn.active { background: rgba(59,130,246,.15); color: #fff; border-left-color: #3b82f6; }
        .sidebar.collapsed .sidebar-btn { padding: 10px 0; justify-content: center; }
        .sb-icon  {
          flex-shrink: 0; width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(59,130,246,.12); color: rgba(147,197,253,.85);
          transition: background .15s, color .15s;
        }
        .sidebar-btn:hover .sb-icon { background: rgba(59,130,246,.2); color: #93c5fd; }
        .sidebar-btn.active .sb-icon { background: rgba(59,130,246,.25); color: #fff; }
        .sb-label { flex: 1; transition: opacity .2s; }
        .sidebar.collapsed .sb-label { display: none; }
        .sidebar.collapsed .sb-icon  { width: 34px; height: 34px; }
        .sidebar-divider { height: 1px; background: rgba(255,255,255,.1); margin: 4px 8px; }
        .sidebar-footer   { border-top: 1px solid rgba(255,255,255,.08); }
        .sidebar-toggle {
          width: 100%; padding: 9px;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          background: rgba(255,255,255,.06); border: none;
          color: rgba(255,255,255,.5); cursor: pointer;
          font-size: 12px; font-weight: 600; transition: all .15s;
        }
        .sidebar-toggle:hover { background: rgba(255,255,255,.12); color: #fff; }
        .sb-toggle-arrow { display: inline-block; }

        /* CONTENT */
        .app-content { flex: 1; overflow: auto; min-width: 0; padding: 24px; }

        /* GLOBAL FORMS & CARDS */
        .card, .admin-card {
          background: var(--s1); border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          border: 1px solid var(--bd); padding: 20px;
          margin-bottom: 24px;
        }
        .form-group { margin-bottom: 16px; }
        .form-label { display: block; font-size: 13px; font-weight: 600; color: var(--txt); margin-bottom: 6px; }
        .form-input {
          width: 100%; padding: 10px 14px; border-radius: 8px;
          border: 1px solid var(--bd); background: var(--s2);
          color: var(--txt); font-size: 14px; font-family: inherit;
          transition: border-color .2s;
        }
        .form-input:focus { outline: none; border-color: var(--blue); }
        .btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 600;
          cursor: pointer; border: 1px solid transparent; transition: all .2s;
          font-family: inherit; box-shadow: none !important;
        }
        .btn:active { transform: scale(0.98) !important; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn:hover { transform: none !important; box-shadow: none !important; }
        .btn-primary { background: var(--blue); color: #fff; }
        .btn-primary:hover:not(:disabled) { background: #2563eb; }
        .btn-secondary { background: var(--s3); color: var(--txt); border-color: var(--bd); }
        .btn-secondary:hover:not(:disabled) { background: var(--bd); }
        .btn-danger { background: var(--red); color: #fff; }
        .btn-danger:hover:not(:disabled) { background: #dc2626; }
        .btn-outline { background: transparent; color: var(--blue); border-color: rgba(59,130,246,0.3); }
        .btn-outline:hover:not(:disabled) { background: rgba(59,130,246,0.1); }
        
        /* TABLES */
        .admin-table-wrapper {
          background: var(--s1); border-radius: 12px; border: 1px solid var(--bd);
          overflow: hidden; width: 100%; overflow-x: auto;
        }
        .admin-table {
          width: 100%; border-collapse: collapse; text-align: left;
        }
        .admin-table th {
          padding: 12px 16px; font-size: 11px; font-weight: 700; color: var(--mut);
          text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;
          background: var(--s2); border-bottom: 1px solid var(--bd);
        }
        .admin-table td {
          padding: 12px 16px; font-size: 13px; color: var(--txt);
          border-bottom: 1px solid var(--bd);
        }
        .admin-table tr:last-child td { border-bottom: none; }
        .admin-table tbody tr { transition: background 0.15s; }
        .admin-table tbody tr:hover { background: var(--s2); }
      `}</style>
    </>
  )
}
