import Head from 'next/head'
import Link from 'next/link'
import { useEffect } from 'react'
import { useAuth } from '../../lib/AuthContext'

export default function PaymentSuccess() {
  const { refreshUser } = useAuth()

  useEffect(() => {
    // Refresh user info so plan updates reflect immediately
    refreshUser()
  }, [])

  return (
    <>
      <Head><title>Go Meta Ads Pro</title></Head>
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0c2a72 0%, #1a3a8f 60%, #0f1117 100%)',
        padding: 20,
      }}>
        <div style={{
          background: '#1e2536', border: '1px solid #2a3347', borderRadius: 20,
          padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center',
          boxShadow: '0 24px 60px rgba(0,0,0,.6)',
        }}>
          <div style={{ fontSize: 72, marginBottom: 16, animation: 'bounce .6s ease' }}>✅</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#e8eaf0', marginBottom: 10 }}>
            Thanh toán thành công!
          </h1>
          <p style={{ color: '#6b7a99', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
            Cảm ơn bạn đã đăng ký <strong style={{ color: '#00c48c' }}>Go Meta Ads Pro</strong>.
            Tài khoản của bạn đã được nâng cấp ngay lập tức.
          </p>
          <div style={{ background: 'rgba(0,196,140,.08)', border: '1px solid rgba(0,196,140,.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 28, textAlign: 'left' }}>
            <div style={{ fontSize: 13, color: '#00c48c', fontWeight: 700, marginBottom: 8 }}>✓ Gói đã kích hoạt</div>
            <div style={{ fontSize: 12, color: '#6b7a99' }}>Truy cập dashboard để bắt đầu sử dụng các tính năng mới.</div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/dashboard" style={{
              background: '#fe5f01', color: '#fff', padding: '12px 28px', borderRadius: 10,
              fontWeight: 700, textDecoration: 'none', fontSize: 15,
            }}>
              Vào Dashboard →
            </Link>
            <Link href="/" style={{
              background: 'rgba(255,255,255,.08)', color: '#e8eaf0', padding: '12px 28px',
              borderRadius: 10, fontWeight: 600, textDecoration: 'none', fontSize: 15,
              border: '1px solid rgba(255,255,255,.12)',
            }}>
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes bounce {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  )
}
