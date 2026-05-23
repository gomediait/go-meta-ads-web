import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const router    = useRouter()
  const [form, setForm]   = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(form.email, form.password)
      const next = router.query.next || '/dashboard'
      router.push(next)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head><title>Đăng nhập — Go Meta Ads Pro</title></Head>
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">
            <img src="/logo.png" alt="logo" onError={e => e.target.style.display='none'} />
            <h1>Go Meta Ads Pro</h1>
            <p>Nền tảng quản lý quảng cáo Facebook chuyên nghiệp</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input type="email" placeholder="email@example.com" autoComplete="email"
                value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required />
            </div>
            <div className="field">
              <label>Mật khẩu</label>
              <input type="password" placeholder="••••••••" autoComplete="current-password"
                value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required />
            </div>

            {error && <div className="err-msg">{error}</div>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? '⏳ Đang đăng nhập...' : '→ Đăng nhập'}
            </button>
          </form>

          <div className="auth-divider"><span>hoặc</span></div>

          <button className="fb-btn" disabled title="Sắp có — Facebook OAuth đang được cấu hình">
            <span>f</span> Đăng nhập bằng Facebook
          </button>

          <div className="auth-footer">
            Chưa có tài khoản? <Link href="/register">Đăng ký ngay</Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #0c2a72 0%, #1a3a8f 60%, #0f1117 100%);
          padding: 20px;
        }
        .auth-card {
          background: #1e2536; border: 1px solid #2a3347; border-radius: 18px;
          padding: 36px 32px; width: 100%; max-width: 400px;
          box-shadow: 0 24px 60px rgba(0,0,0,.6);
        }
        .auth-logo { text-align: center; margin-bottom: 28px; }
        .auth-logo img { width: 56px; height: 56px; object-fit: contain; border-radius: 12px; margin-bottom: 10px; }
        .auth-logo h1 { font-size: 20px; font-weight: 700; color: #e8eaf0; margin-bottom: 4px; }
        .auth-logo p  { font-size: 12px; color: #6b7a99; line-height: 1.5; }

        .field { margin-bottom: 14px; }
        .field label { display: block; font-size: 12px; font-weight: 600; color: #6b7a99; margin-bottom: 5px; text-transform: uppercase; letter-spacing: .4px; }
        .field input {
          width: 100%; background: #161b27; border: 1.5px solid #2a3347;
          border-radius: 9px; padding: 11px 14px; font-size: 14px; color: #e8eaf0;
          outline: none; transition: border-color .15s;
        }
        .field input:focus { border-color: #3b82f6; }

        .err-msg { background: rgba(255,69,96,.12); border: 1px solid rgba(255,69,96,.3); border-radius: 8px; padding: 9px 12px; font-size: 13px; color: #ff8fa3; margin-bottom: 12px; }

        .submit-btn {
          width: 100%; background: #fe5f01; border: none; border-radius: 10px;
          padding: 13px; font-size: 15px; font-weight: 700; color: #fff;
          cursor: pointer; transition: opacity .15s; margin-top: 4px;
        }
        .submit-btn:hover:not(:disabled) { opacity: .88; }
        .submit-btn:disabled { opacity: .5; cursor: not-allowed; }

        .auth-divider { display: flex; align-items: center; gap: 10px; margin: 18px 0; }
        .auth-divider::before, .auth-divider::after { content: ''; flex: 1; height: 1px; background: #2a3347; }
        .auth-divider span { font-size: 12px; color: #6b7a99; }

        .fb-btn {
          width: 100%; background: #1877f2; border: none; border-radius: 10px;
          padding: 12px; font-size: 14px; font-weight: 600; color: #fff;
          cursor: not-allowed; opacity: .45; display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .fb-btn span { font-size: 18px; font-weight: 900; line-height: 1; }

        .auth-footer { text-align: center; margin-top: 20px; font-size: 13px; color: #6b7a99; }
        .auth-footer a { color: #fe5f01; text-decoration: none; font-weight: 600; }
        .auth-footer a:hover { text-decoration: underline; }
      `}</style>
    </>
  )
}
