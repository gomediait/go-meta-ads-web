import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { checkAdminAuth, adminLogin } from '../../lib/adminAuth'

export default function AdminLogin() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (checkAdminAuth()) {
      router.replace('/admin/dashboard')
    } else {
      setChecking(false)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const ok = adminLogin(password)
    if (ok) {
      router.push('/admin/dashboard')
    } else {
      setError('Sai mật khẩu. Vui lòng thử lại.')
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#000d1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ color: '#00c7de', fontSize: 18 }}>Đang kiểm tra...</div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Admin Login — Go Meta Ads Pro</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div style={{
        minHeight: '100vh',
        background: '#000d1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, Segoe UI, sans-serif',
        padding: '20px',
      }}>
        {/* Background grid pattern */}
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(0,199,222,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,199,222,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }} />

        <div style={{
          background: 'linear-gradient(135deg, #001428 0%, #001f3a 100%)',
          border: '1px solid rgba(0,199,222,0.2)',
          borderRadius: 16,
          padding: '48px 40px',
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,199,222,0.05)',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #00c7de, #0099aa)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 28,
              boxShadow: '0 8px 24px rgba(0,199,222,0.3)',
            }}>
              🛡️
            </div>
            <h1 style={{
              color: '#ffffff',
              fontSize: 22,
              fontWeight: 700,
              margin: '0 0 6px',
              letterSpacing: '-0.3px',
            }}>
              Admin Dashboard
            </h1>
            <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
              Go Meta Ads Pro
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                color: '#94a3b8',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu admin..."
                autoFocus
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${error ? '#ef4444' : 'rgba(0,199,222,0.25)'}`,
                  borderRadius: 10,
                  color: '#ffffff',
                  fontSize: 15,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#00c7de' }}
                onBlur={(e) => { e.target.style.borderColor = error ? '#ef4444' : 'rgba(0,199,222,0.25)' }}
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#f87171',
                fontSize: 13,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              style={{
                width: '100%',
                padding: '13px 20px',
                background: loading || !password
                  ? 'rgba(0,199,222,0.4)'
                  : 'linear-gradient(135deg, #00c7de, #0099aa)',
                border: 'none',
                borderRadius: 10,
                color: '#ffffff',
                fontSize: 15,
                fontWeight: 700,
                cursor: loading || !password ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
                letterSpacing: '0.3px',
                boxShadow: loading || !password ? 'none' : '0 4px 16px rgba(0,199,222,0.3)',
              }}
            >
              {loading ? '⏳ Đang đăng nhập...' : '🚀 Đăng nhập'}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: '#475569', fontSize: 12, marginTop: 24, marginBottom: 0 }}>
            Trang quản trị dành riêng cho admin
          </p>
        </div>
      </div>
    </>
  )
}
