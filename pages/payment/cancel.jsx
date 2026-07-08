import Head from 'next/head'
import Link from 'next/link'

export default function PaymentCancel() {
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
          <div style={{ fontSize: 72, marginBottom: 16 }}>❌</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#e8eaf0', marginBottom: 10 }}>
            Đã huỷ thanh toán
          </h1>
          <p style={{ color: '#6b7a99', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
            Bạn đã huỷ giao dịch. Không có khoản tiền nào bị trừ.
            Bạn có thể thử lại bất kỳ lúc nào.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/mua-goi" style={{
              background: '#fe5f01', color: '#fff', padding: '12px 28px', borderRadius: 10,
              fontWeight: 700, textDecoration: 'none', fontSize: 15,
            }}>
              Thử lại →
            </Link>
            <Link href="/dashboard" style={{
              background: 'rgba(255,255,255,.08)', color: '#e8eaf0', padding: '12px 28px',
              borderRadius: 10, fontWeight: 600, textDecoration: 'none', fontSize: 15,
              border: '1px solid rgba(255,255,255,.12)',
            }}>
              Về Dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
