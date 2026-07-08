import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { useAuth } from '../lib/AuthContext'
import { useLang } from '../lib/LangContext'
import { isPlanAllowed } from '../lib/planLimits'
import pkg from '../package.json'
import { LayoutDashboard, Coins, BarChart3, HeartHandshake, Settings2, ClipboardList, ShieldCheck, Bell, Users, Handshake, LifeBuoy, BookOpen, Sun, Moon, LogOut, Link as LinkIcon, ChevronLeft, ChevronRight, Lock, CheckCircle2 } from 'lucide-react'

const NAV_ICONS = {
  campaigns: LayoutDashboard,
  profit: Coins,
  report: BarChart3,
  autocare: HeartHandshake,
  autoset: Settings2,
  rules: ClipboardList,
  policycheck: ShieldCheck,
  notifications: Bell,
  team: Users,
  affiliate: Handshake,
  support: LifeBuoy,
  guide: BookOpen,
}

function getNav(dt) {
  const n = dt.nav || {}
  return [
    { href: '/dashboard',             iconKey: 'campaigns',    labelKey: 'campaigns',    needFb: true,  feature: 'campaigns'     },
    { href: '/dashboard/profit',      iconKey: 'profit',       labelKey: 'profit',       needFb: false, feature: 'profit'        },
    { href: '/dashboard/report',      iconKey: 'report',       labelKey: 'report',       needFb: true,  feature: 'report'        },
    { href: '/dashboard/autocare',    iconKey: 'autocare',     labelKey: 'autocare',     needFb: true,  feature: 'autocare'      },
    { href: '/dashboard/autoset',     iconKey: 'autoset',      labelKey: 'autoset',      needFb: true,  feature: 'autoset'       },
    { href: '/dashboard/automated-rules', iconKey: 'rules',    labelKey: 'rules',        needFb: true,  feature: 'autoset'       },
    { href: '/dashboard/policycheck', iconKey: 'policycheck',  labelKey: 'policycheck',  needFb: false, feature: 'policycheck'   },
    { divider: true },
    { href: '/dashboard/notifications',iconKey:'notifications', labelKey: 'notifications', needFb: true, feature: 'notifications' },
    { href: '/dashboard/team',        iconKey: 'team',          labelKey: 'team',          needFb: false, feature: 'team'         },
    { href: '/dashboard/affiliate',   iconKey: 'affiliate',     labelKey: 'affiliate',     needFb: false, feature: 'affiliate'    },
    { divider: true },
    { href: '/dashboard/support',     iconKey: 'support',       labelKey: 'support',       needFb: false, feature: 'support'      },
    { href: 'https://adsmeta.gonetwork.vn/huong-dan', iconKey: 'guide', labelKey: 'guide', external: true },
  ].map(item => item.divider ? item : { ...item, label: n[item.labelKey] || item.labelKey })
}

const PLAN_COLOR = {
  trial:    'rgba(96,165,250,.2)',
  personal: 'rgba(96,165,250,.2)',
  business: 'rgba(251,191,36,.2)',
  agency:   'rgba(0,196,140,.2)',
}
const PLAN_TEXT = {
  trial: '#60a5fa', personal: '#60a5fa', business: '#f59e0b', agency: '#00c48c'
}

export default function DashboardLayout({ children, title = 'Dashboard' }) {
  const { user, logout, planName, isExpired } = useAuth()
  const { lang, setLang, t } = useLang()
  const router  = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [theme, setTheme]         = useState('light')
  const dt = t.dashboard || {}
  const NAV = getNav(dt)

  useEffect(() => {
    const saved = localStorage.getItem('gmap_theme') || 'light'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('gmap_theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  const fbConnected = user?.fb_connected

  return (
    <>
      <Head>
        <title>Go Meta Ads Pro</title>
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
                <span className="version-badge">v{pkg.version}</span>
              </div>
              <div className="topbar-sub">by Go Media Vietnam</div>
            </div>
          </div>

          <div className="topbar-mid">
            {!fbConnected && (
              <Link href="/settings/connect-facebook" className="fb-connect-btn">
{(dt.topbar?.fbConnect || 'Kết nối Facebook Ads').replace(/^🔗\s*/, '')}
              </Link>
            )}
            {fbConnected && (
              <span className="fb-ok-badge"><CheckCircle2 size={13} className="fb-ok-icon" />{(dt.topbar?.fbConnected || 'Facebook đã kết nối').replace(/^✅\s*/, '')}</span>
            )}
          </div>

          <div className="topbar-right">
            {isExpired && (
              <Link href="/mua-goi" className="expired-badge">{dt.topbar?.expired || '⚠️ Tài khoản hết hạn'}</Link>
            )}
            <span className="plan-badge" style={{ background: PLAN_COLOR[user?.plan], color: PLAN_TEXT[user?.plan] }}>
              {dt.plan?.[user?.plan] || planName}
            </span>
            <span className="user-name">{user?.name}</span>
            <button className="icon-btn lang-btn" onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')} title={dt.topbar?.switchLang || 'Switch language'}>
              {lang === 'vi' ? '🇬🇧 EN' : '🇻🇳 VI'}
            </button>
            <button className="icon-btn" onClick={toggleTheme} title={dt.topbar?.toggleTheme || 'Toggle theme'}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
            <Link href="/settings" className="icon-btn" title={dt.topbar?.settings || 'Settings'}><Settings2 size={16} /></Link>
            <button className="icon-btn logout-btn" onClick={logout} title={dt.topbar?.logout || 'Log out'}><LogOut size={16} /></button>
          </div>
        </header>

        <div className="app-body">
          {/* ── SIDEBAR ── */}
          <nav className={`sidebar${collapsed ? ' collapsed' : ''}`}>
            <div className="sidebar-inner">
              {NAV.map((item, i) => {
                if (item.divider) return <div key={i} className="sidebar-divider" />
                
                const userRole = user?.role || 'admin'
                const isViewer = userRole === 'viewer'
                const isManager = userRole === 'manager'
                
                // Lock menus based on role
                let roleLocked = false
                if (item.feature) {
                  if (isViewer && !['campaigns', 'profit', 'report', 'support'].includes(item.feature)) {
                    roleLocked = true
                  }
                  if (isManager && !['campaigns', 'profit', 'report', 'autoset', 'policycheck', 'support'].includes(item.feature)) {
                    roleLocked = true
                  }
                }

                const isActive   = !item.external && router.pathname === item.href
                const fbLocked   = item.needFb && !fbConnected
                const planLocked = item.feature && !isPlanAllowed(user?.plan || 'trial', item.feature)
                const locked     = fbLocked || planLocked || roleLocked

                const IconComp = NAV_ICONS[item.iconKey] || LayoutDashboard
                if (item.external) {
                  return (
                    <a key={item.href} href={item.href} target="_blank" rel="noopener" className="sidebar-btn">
                      <span className="sb-icon"><IconComp size={18} /></span>
                      <span className="sb-label">{item.label}</span>
                    </a>
                  )
                }
                const lockTitle = fbLocked ? (dt.sidebar?.fbNeeded || 'Cần kết nối Facebook Ads') : 
                                  planLocked ? (dt.sidebar?.upgradePlan || 'Nâng cấp gói để sử dụng') : 
                                  roleLocked ? 'Tài khoản của bạn không có quyền sử dụng chức năng này' : item.label
                const lockHref  = fbLocked ? '/settings/connect-facebook' : planLocked ? '/mua-goi' : item.href
                return (
                  <Link key={item.href} href={locked && !roleLocked ? lockHref : item.href}
                    className={`sidebar-btn${isActive ? ' active' : ''}${locked ? ' locked' : ''}`}
                    title={lockTitle}>
                    <span className="sb-icon"><IconComp size={18} /></span>
                    <span className="sb-label">{item.label}{locked && <Lock size={12} style={{ marginLeft: 4, opacity: .5 }} />}</span>
                  </Link>
                )
              })}
            </div>
            <div className="sidebar-footer">
              <button className="sidebar-toggle" onClick={() => setCollapsed(c => !c)}>
                <span className="sb-toggle-arrow">{collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}</span>
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
          background: rgba(254,95,1,.25); color: #ff9a60;
          border: 1px solid rgba(254,95,1,.4);
          border-radius: 4px; padding: 1px 5px; line-height: 1.5;
          white-space: nowrap;
        }
        .topbar-mid  { flex: 1; display: flex; align-items: center; gap: 8px; }
        .topbar-right{ display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

        .fb-connect-btn {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.3);
          border-radius: 7px; padding: 5px 12px;
          font-size: 12px; color: #fff; text-decoration: none;
          transition: background .15s;
        }
        .fb-connect-btn:hover { background: rgba(255,255,255,.25); }
        .fb-ok-badge { font-size: 12px; color: rgba(255,255,255,.85); display: inline-flex; align-items: center; gap: 5px; }
        .fb-ok-icon { color: #34d399; flex-shrink: 0; }

        .plan-badge {
          display: inline-flex; align-items: center;
          padding: 3px 10px; border-radius: 20px;
          font-size: 10px; font-weight: 700; letter-spacing: .3px;
        }
        .user-name { font-size: 12px; color: rgba(255,255,255,.8); white-space: nowrap; }
        .icon-btn {
          background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2);
          border-radius: 7px; padding: 5px 9px; font-size: 14px; color: #fff;
          cursor: pointer; text-decoration: none; transition: background .15s;
          display: inline-flex; align-items: center; line-height: 1;
        }
        .icon-btn:hover { background: rgba(255,255,255,.22); }
        .logout-btn { font-size: 16px; }
        .lang-btn { font-size: 11px; font-weight: 700; letter-spacing: .3px; padding: 5px 10px; }
        .expired-badge {
          background: rgba(255,69,96,.25); border: 1px solid rgba(255,69,96,.5);
          border-radius: 7px; padding: 4px 10px; font-size: 11px; color: #ff8fa3;
          text-decoration: none;
        }

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
        .sidebar-btn.locked { opacity: .55; }
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
        .app-content { flex: 1; overflow: auto; min-width: 0; }
      `}</style>
    </>
  )
}
