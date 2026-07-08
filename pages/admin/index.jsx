import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Tự động gọi API /api/admin/me để kiểm tra phiên đăng nhập
    fetch('/api/admin/me')
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          router.replace('/admin/dashboard')
        } else {
          setChecking(false)
        }
      })
      .catch(() => setChecking(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      
      if (data.ok) {
        router.push('/admin/dashboard')
      } else {
        setError(data.error || 'Đăng nhập thất bại')
        setLoading(false)
      }
    } catch (err) {
      setError('Lỗi kết nối đến máy chủ')
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
        <div style={{ color: 'var(--blue)', fontSize: 18 }}>Đang kiểm tra...</div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Go Meta Ads Pro</title>
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
              fontSize: 24,
              fontWeight: 600,
              margin: '0 0 8px',
              letterSpacing: '-0.02em',
            }}>
              Admin Dashboard
            </h1>
            <p style={{ color: '#8b9bb4', fontSize: 15, margin: 0 }}>
              Đăng nhập để quản lý hệ thống
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', color: '#a0aec0', fontSize: 13, fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Email
              </label>
              <input
                type="email"
                placeholder="admin@gomedia.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  fontSize: 15,
                  color: '#fff',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                autoFocus
                required
              />
            </div>
            
            <div>
              <label style={{ display: 'block', color: '#a0aec0', fontSize: 13, fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Mật khẩu
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  fontSize: 15,
                  color: '#fff',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(255, 68, 68, 0.1)',
                border: '1px solid rgba(255, 68, 68, 0.2)',
                color: '#ff4444',
                padding: '12px 16px',
                borderRadius: 8,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              style={{
                width: '100%',
                padding: '14px',
                background: loading || (!email || !password) ? '#007a8a' : '#00c7de',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 16,
                fontWeight: 600,
                cursor: loading || (!email || !password) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                marginTop: 8,
                opacity: loading || (!email || !password) ? 0.7 : 1,
                boxShadow: loading || (!email || !password) ? 'none' : '0 4px 14px rgba(0,199,222,0.4)',
              }}
            >
              {loading ? 'Đang xác thực...' : 'Đăng nhập'}
            </button>
          </form>

          {/* Footer */}
          <div style={{
            marginTop: 32,
            textAlign: 'center',
            color: 'var(--mut)',
            fontSize: 13,
            borderTop: '1px solid rgba(255,255,255,0.05)',
            paddingTop: 24,
          }}>
            &copy; {new Date().getFullYear()} Go Meta Ads Pro.<br/>
            Bảo mật nhiều lớp (JWT).
          </div>
        </div>
      </div>

      <style jsx global>{`
        input:focus {
          border-color: #00c7de !important;
          box-shadow: 0 0 0 3px rgba(0, 199, 222, 0.15) !important;
        }
      `}</style>
    </>
  )
}
